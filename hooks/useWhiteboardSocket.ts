"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TLRecord } from 'tldraw';

interface UseWhiteboardSocketProps {
    roomId: string;
    onUpdate: (records: TLRecord[], action: 'put' | 'remove') => void;
    onFullState: (records: TLRecord[]) => void;
}

export function useWhiteboardSocket({ roomId, onUpdate, onFullState }: UseWhiteboardSocketProps) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Initialize socket connection
    useEffect(() => {
        // Initialize socket
        const initSocket = async () => {
            // First, hit the API route to ensure Socket.IO server is initialized
            await fetch('/api/socket');

            const socket = io({
                path: '/api/socket',
                addTrailingSlash: false,
                reconnection: true,
                reconnectionAttempts: maxReconnectAttempts,
                reconnectionDelay: 1000,
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
                setIsConnected(true);
                reconnectAttempts.current = 0;

                // Join the room
                socket.emit('join-room', roomId);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                reconnectAttempts.current++;
            });

            // Handle incoming updates
            socket.on('wb-update', (data: { records: TLRecord[]; action: 'put' | 'remove' }) => {
                onUpdate(data.records, data.action);
            });

            // Handle full state sync
            socket.on('wb-state', (records: TLRecord[]) => {
                if (records && records.length > 0) {
                    onFullState(records);
                }
            });

            socketRef.current = socket;
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-room', roomId);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomId, onUpdate, onFullState]);

    // Buffer for pending updates
    const updateBuffer = useRef<{
        put: Record<string, TLRecord>;
        remove: Set<string>;
    }>({
        put: {},
        remove: new Set(),
    });
    const throttleTimer = useRef<NodeJS.Timeout | null>(null);

    // Broadcast local changes with throttling
    const broadcastUpdate = useCallback((records: TLRecord[], action: 'put' | 'remove') => {
        if (!socketRef.current?.connected) return;

        // Add to buffer
        if (action === 'put') {
            records.forEach(record => {
                updateBuffer.current.put[record.id] = record;
                // If it was marked for removal, unmark it (last write wins)
                updateBuffer.current.remove.delete(record.id);
            });
        } else {
            records.forEach(record => {
                // If it was in put buffer, remove it (we're deleting it now)
                delete updateBuffer.current.put[record.id]; // actually record is just {id} for remove usually
                // Use record.id if available, or just record if it's correct type. 
                // Tldraw types: remove receives partials with IDs? The hook signature says TLRecord[].
                // Let's assume we extract ID.
                updateBuffer.current.remove.add(record.id);
            });
        }

        // Schedule flush if not already scheduled
        if (!throttleTimer.current) {
            throttleTimer.current = setTimeout(() => {
                const { put, remove } = updateBuffer.current;
                const puts = Object.values(put);
                const removes = Array.from(remove);

                if (puts.length > 0) {
                    socketRef.current?.emit('wb-update', { roomId, records: puts, action: 'put' });
                }

                // For removes, we need to send objects with IDs.
                if (removes.length > 0) {
                    // Reconstruct minimal records for remove
                    const removeRecords = removes.map(id => ({ id } as any));
                    socketRef.current?.emit('wb-update', { roomId, records: removeRecords, action: 'remove' });
                }

                // Clear buffer
                updateBuffer.current = { put: {}, remove: new Set() };
                throttleTimer.current = null;
            }, 32); // 32ms throttle (~30fps)
        }
    }, [roomId]);

    // Request full state from server
    const requestState = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('wb-request-state', roomId);
        }
    }, [roomId]);

    return {
        isConnected,
        broadcastUpdate,
        requestState,
    };
}
