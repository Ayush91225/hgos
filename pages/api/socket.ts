import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Store for whiteboard states per room
const whiteboardStates: Map<string, any[]> = new Map();
// Store for graphs states per room
const graphsStates: Map<string, any> = new Map();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!(res.socket as any).server.io) {
        console.log('Initializing Socket.IO server...');

        const httpServer: NetServer = (res.socket as any).server;
        const io = new SocketIOServer(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join a whiteboard room
            socket.on('join-room', (roomId: string) => {
                socket.join(roomId);
                console.log(`${socket.id} joined room ${roomId}`);

                // Send current state to the new joiner
                const state = whiteboardStates.get(roomId);
                if (state && state.length > 0) {
                    socket.emit('wb-state', state);
                }
            });

            // Handle whiteboard updates
            socket.on('wb-update', (data: { roomId: string; records: any[]; action: 'put' | 'remove' }) => {
                const { roomId, records, action } = data;

                // Update stored state
                let state = whiteboardStates.get(roomId) || [];

                if (action === 'put') {
                    // Add or update records
                    records.forEach(record => {
                        const existingIdx = state.findIndex((r: any) => r.id === record.id);
                        if (existingIdx >= 0) {
                            state[existingIdx] = record;
                        } else {
                            state.push(record);
                        }
                    });
                } else if (action === 'remove') {
                    // Remove records
                    const idsToRemove = new Set(records.map((r: any) => r.id));
                    state = state.filter((r: any) => !idsToRemove.has(r.id));
                }

                whiteboardStates.set(roomId, state);

                // Broadcast to others in the room
                socket.to(roomId).emit('wb-update', { records, action });
            });

            // Request full state
            socket.on('wb-request-state', (roomId: string) => {
                const state = whiteboardStates.get(roomId);
                socket.emit('wb-state', state || []);
            });

            // Join a graphs room
            socket.on('join-graphs-room', (roomId: string) => {
                socket.join(roomId);
                console.log(`📊 ${socket.id} joined graphs room ${roomId}`);

                // Send current state to the new joiner
                const state = graphsStates.get(roomId);
                if (state) {
                    console.log(`📊 Sending existing state to ${socket.id}:`, state);
                    socket.emit('graphs-state', state);
                }
            });

            // Handle graphs updates
            socket.on('graphs-update', (data: { roomId: string; state: any }) => {
                const { roomId, state } = data;
                console.log(`📊 Graphs update for room ${roomId}:`, state);

                // Update stored state
                graphsStates.set(roomId, state);

                // Broadcast to others in the room
                socket.to(roomId).emit('graphs-state', state);
                console.log(`📊 Broadcasted to room ${roomId}`);
            });

            // Leave graphs room
            socket.on('leave-graphs-room', (roomId: string) => {
                socket.leave(roomId);
                console.log(`${socket.id} left graphs room ${roomId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        (res.socket as any).server.io = io;
    }

    res.end();
}
