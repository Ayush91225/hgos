"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useEffect, useState, useCallback, useRef } from "react";
import { TLRecord, TLStoreEventInfo } from "tldraw";

interface StreamWhiteboardState {
    isConnected: boolean;
    participantCount: number;
}

interface WhiteboardUpdate {
    type: 'add' | 'update' | 'remove';
    records: TLRecord[];
}

export function useStreamWhiteboardSync(roomId: string) {
    const call = useCall();
    const [state, setState] = useState<StreamWhiteboardState>({
        isConnected: false,
        participantCount: 0,
    });
    const [pendingUpdates, setPendingUpdates] = useState<WhiteboardUpdate[]>([]);
    const lastBroadcastRef = useRef<number>(0);
    const throttleMs = 50; // Throttle broadcasts to 50ms

    // Send whiteboard updates via Stream custom events
    const broadcastUpdate = useCallback((update: WhiteboardUpdate) => {
        if (!call) return;

        const now = Date.now();
        if (now - lastBroadcastRef.current < throttleMs) {
            // Throttle: queue the update
            setPendingUpdates(prev => [...prev, update]);
            return;
        }

        lastBroadcastRef.current = now;

        try {
            call.sendCustomEvent({
                type: 'whiteboard_update',
                roomId,
                update: {
                    type: update.type,
                    records: update.records.map(r => JSON.stringify(r)),
                },
            });
        } catch (error) {
            console.error('Failed to broadcast whiteboard update:', error);
        }
    }, [call, roomId]);

    // Process pending updates
    useEffect(() => {
        if (pendingUpdates.length === 0) return;

        const timer = setTimeout(() => {
            const allUpdates = pendingUpdates;
            setPendingUpdates([]);

            // Batch all pending updates into one
            if (allUpdates.length > 0 && call) {
                const batchedRecords: TLRecord[] = [];
                allUpdates.forEach(u => batchedRecords.push(...u.records));

                if (batchedRecords.length > 0) {
                    try {
                        call.sendCustomEvent({
                            type: 'whiteboard_update',
                            roomId,
                            update: {
                                type: 'update',
                                records: batchedRecords.map(r => JSON.stringify(r)),
                            },
                        });
                    } catch (error) {
                        console.error('Failed to broadcast batched update:', error);
                    }
                }
            }
        }, throttleMs);

        return () => clearTimeout(timer);
    }, [pendingUpdates, call, roomId]);

    // Set connected state when call is available
    useEffect(() => {
        if (call) {
            setState(prev => ({ ...prev, isConnected: true }));
        }
    }, [call]);

    // Create a handler for tldraw store changes
    const createStoreListener = useCallback((applyRemoteChanges: (records: TLRecord[], type: 'add' | 'update' | 'remove') => void) => {
        if (!call) return () => { };

        const handleCustomEvent = (event: any) => {
            if (event.custom?.type !== 'whiteboard_update') return;
            if (event.custom?.roomId !== roomId) return;

            // Don't apply our own updates
            if (event.user?.id === call.currentUserId) return;

            const update = event.custom.update;
            if (!update?.records) return;

            try {
                const records = update.records.map((r: string) => JSON.parse(r));
                applyRemoteChanges(records, update.type);
            } catch (error) {
                console.error('Failed to parse whiteboard update:', error);
            }
        };

        call.on('custom', handleCustomEvent);
        return () => call.off('custom', handleCustomEvent);
    }, [call, roomId]);

    // Request full sync from other participants
    const requestSync = useCallback(() => {
        if (!call) return;

        try {
            call.sendCustomEvent({
                type: 'whiteboard_sync_request',
                roomId,
            });
        } catch (error) {
            console.error('Failed to request sync:', error);
        }
    }, [call, roomId]);

    // Send full state to new participants
    const sendFullState = useCallback((records: TLRecord[]) => {
        if (!call) return;

        try {
            call.sendCustomEvent({
                type: 'whiteboard_full_state',
                roomId,
                records: records.map(r => JSON.stringify(r)),
            });
        } catch (error) {
            console.error('Failed to send full state:', error);
        }
    }, [call, roomId]);

    return {
        state,
        broadcastUpdate,
        createStoreListener,
        requestSync,
        sendFullState,
    };
}
