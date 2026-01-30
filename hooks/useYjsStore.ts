"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    TLStoreWithStatus,
    createTLStore,
    defaultShapeUtils,
    TLRecord,
    RecordsDiff
} from "tldraw";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export function useYjsStore({
    roomId = "example",
    hostUrl = "wss://y-webrtc-signaling-eu.fly.dev", // More reliable signaling server
}: {
    roomId?: string;
    hostUrl?: string;
}): TLStoreWithStatus {
    const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
        status: 'loading',
    });

    const storeRef = useRef<ReturnType<typeof createTLStore> | null>(null);

    useEffect(() => {
        // Create store once
        if (!storeRef.current) {
            storeRef.current = createTLStore({
                shapeUtils: defaultShapeUtils,
            });
        }
        const store = storeRef.current;

        setStoreWithStatus({ status: 'loading' });

        const roomName = `homeguru-wb-${roomId}`;
        const doc = new Y.Doc({ gc: true });
        const yRecords = doc.getMap<string>('tl_records');

        // Multiple signaling servers for reliability
        const signalingServers = [
            'wss://y-webrtc-signaling-eu.fly.dev',
            'wss://signaling.yjs.dev',
        ];

        const provider = new WebrtcProvider(roomName, doc, {
            signaling: signalingServers,
        });

        let isSyncing = false;
        let syncTimeout: NodeJS.Timeout | null = null;

        // Sync Yjs → Tldraw with debounce
        const syncFromYjs = () => {
            if (isSyncing) return;

            const records: TLRecord[] = [];
            yRecords.forEach((value, key) => {
                try {
                    if (typeof value === 'string') {
                        records.push(JSON.parse(value));
                    }
                } catch (e) {
                    // Skip invalid records
                }
            });

            if (records.length > 0) {
                isSyncing = true;
                try {
                    store.mergeRemoteChanges(() => {
                        store.put(records);
                    });
                } finally {
                    isSyncing = false;
                }
            }
        };

        // Sync Tldraw → Yjs
        const handleStoreChange = ({ changes }: { changes: RecordsDiff<TLRecord> }) => {
            if (isSyncing) return;

            isSyncing = true;
            try {
                doc.transact(() => {
                    Object.values(changes.added).forEach((record) => {
                        yRecords.set(record.id, JSON.stringify(record));
                    });

                    Object.values(changes.updated).forEach(([_, record]) => {
                        yRecords.set(record.id, JSON.stringify(record));
                    });

                    Object.values(changes.removed).forEach((record) => {
                        yRecords.delete(record.id);
                    });
                });
            } finally {
                isSyncing = false;
            }
        };

        // Listen to Yjs changes
        yRecords.observeDeep(syncFromYjs);

        // Listen to store changes
        const unsubscribe = store.listen(handleStoreChange, { source: 'user', scope: 'document' });

        // Handle connection status
        const updateStatus = () => {
            if (provider.connected) {
                syncFromYjs();
                setStoreWithStatus({
                    status: 'synced-remote',
                    connectionStatus: 'online',
                    store,
                });
            }
        };

        provider.on('synced', updateStatus);
        provider.on('peers', updateStatus);

        // Set synced immediately if already connected
        if (provider.connected) {
            updateStatus();
        } else {
            // Timeout fallback - use local store if connection fails
            syncTimeout = setTimeout(() => {
                setStoreWithStatus({
                    status: 'synced-remote',
                    connectionStatus: 'online',
                    store,
                });
            }, 2000);
        }

        return () => {
            if (syncTimeout) clearTimeout(syncTimeout);
            unsubscribe();
            yRecords.unobserveDeep(syncFromYjs);
            provider.destroy();
            doc.destroy();
        };
    }, [roomId, hostUrl]);

    return storeWithStatus;
}
