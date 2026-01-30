"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseGraphsSocketProps {
    roomId: string;
    onStateUpdate: (state: any) => void;
}

export function useGraphsSocket({ roomId, onStateUpdate }: UseGraphsSocketProps) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socket');

            const socket = io({
                path: '/api/socket',
                addTrailingSlash: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socket.on('connect', () => {
                setIsConnected(true);
                socket.emit('join-graphs-room', roomId);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
            });

            // Handle incoming graph state updates
            socket.on('graphs-state', (state: any) => {
                console.log('📊 Received graph state:', state);
                onStateUpdate(state);
            });

            socketRef.current = socket;
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-graphs-room', roomId);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomId, onStateUpdate]);

    // Broadcast graph state changes
    const broadcastState = useCallback((state: any) => {
        if (socketRef.current?.connected) {
            console.log('📊 Broadcasting to socket:', state);
            socketRef.current.emit('graphs-update', { roomId, state });
        } else {
            console.warn('📊 Socket not connected, cannot broadcast');
        }
    }, [roomId]);

    return {
        isConnected,
        broadcastState,
    };
}