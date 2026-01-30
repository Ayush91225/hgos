"use client";

import { Tldraw, Editor, TLRecord } from "tldraw";
import "tldraw/tldraw.css";
import { X, Presentation, Wifi, WifiOff, Users, Lock, Unlock } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { useWhiteboardSocket } from "@/hooks/useWhiteboardSocket";

interface WhiteboardProps {
    roomId: string;
    onClose: () => void;
    isOwner?: boolean;
    ownerName?: string;
    readOnly?: boolean;
    onToggleReadOnly?: () => void;
}

export default function Whiteboard({
    roomId,
    onClose,
    isOwner = false,
    ownerName = 'Someone',
    readOnly = false,
    onToggleReadOnly
}: WhiteboardProps) {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const editorRef = useRef<Editor | null>(null);
    const isApplyingRemoteRef = useRef(false);

    // Handle incoming updates from Socket.IO
    const handleRemoteUpdate = useCallback((records: TLRecord[], action: 'put' | 'remove') => {
        const editor = editorRef.current;
        if (!editor) return;

        try {
            isApplyingRemoteRef.current = true;
            editor.store.mergeRemoteChanges(() => {
                if (action === 'remove') {
                    const ids = records.map(r => r.id);
                    editor.store.remove(ids);
                } else {
                    editor.store.put(records);
                }
            });
        } catch (error) {
            console.error('Failed to apply remote update:', error);
        } finally {
            isApplyingRemoteRef.current = false;
        }
    }, []);

    // Handle full state sync
    const handleFullState = useCallback((records: TLRecord[]) => {
        const editor = editorRef.current;
        if (!editor || records.length === 0) return;

        try {
            isApplyingRemoteRef.current = true;
            editor.store.mergeRemoteChanges(() => {
                editor.store.put(records);
            });
        } catch (error) {
            console.error('Failed to apply full state:', error);
        } finally {
            isApplyingRemoteRef.current = false;
        }
    }, []);

    // Socket.IO hook
    const { isConnected, broadcastUpdate, requestState } = useWhiteboardSocket({
        roomId,
        onUpdate: handleRemoteUpdate,
        onFullState: handleFullState,
    });

    // Close on Escape key (only if owner)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOwner) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, isOwner]);

    // Handle editor mount
    const handleMount = useCallback((editor: Editor) => {
        editorRef.current = editor;

        // Request current state after connecting
        setTimeout(() => requestState(), 500);

        // Debounced broadcast to prevent glitches during fast typing
        let broadcastTimeout: NodeJS.Timeout | null = null;
        const pendingChanges = { put: new Map<string, TLRecord>(), remove: new Set<string>() };
        let changeBuffer: { records: TLRecord[], action: 'put' | 'remove' }[] = [];

        // Listen to local changes and broadcast them
        const unsubscribe = editor.store.listen((info) => {
            // Skip if we're applying remote changes
            if (isApplyingRemoteRef.current) return;

            // Skip non-user source changes
            if (info.source !== 'user') return;

            const { added, updated, removed } = info.changes;

            // Filter out instance-specific records to avoid loopbacks/glitches
            const filterRecords = (records: Record<string, TLRecord>) => {
                return Object.values(records).filter(r =>
                    r.typeName !== 'instance' &&
                    r.typeName !== 'instance_page_state' &&
                    r.typeName !== 'camera' &&
                    r.typeName !== 'pointer' &&
                    r.typeName !== 'instance_presence'
                );
            };

            const addedRecords = filterRecords(added);
            const updatedRecords = filterRecords(Object.fromEntries(
                Object.entries(updated).map(([id, [, to]]) => [id, to])
            ));
            const removedRecords = filterRecords(removed);

            // Batch changes for efficiency
            const allPutRecords = [...addedRecords, ...updatedRecords];
            
            if (allPutRecords.length > 0) {
                allPutRecords.forEach(record => {
                    pendingChanges.put.set(record.id, record);
                    pendingChanges.remove.delete(record.id);
                });
            }
            
            if (removedRecords.length > 0) {
                removedRecords.forEach(record => {
                    pendingChanges.put.delete(record.id);
                    pendingChanges.remove.add(record.id);
                });
            }

            // Clear existing timeout
            if (broadcastTimeout) {
                clearTimeout(broadcastTimeout);
            }

            // Adaptive debouncing - faster for small changes, slower for large batches
            const totalChanges = pendingChanges.put.size + pendingChanges.remove.size;
            const debounceTime = totalChanges > 10 ? 150 : 50; // 50ms for small changes, 150ms for large batches

            broadcastTimeout = setTimeout(() => {
                // Batch all pending changes into single broadcasts
                if (pendingChanges.put.size > 0) {
                    const putRecords = Array.from(pendingChanges.put.values());
                    broadcastUpdate(putRecords, 'put');
                }
                if (pendingChanges.remove.size > 0) {
                    const removeRecords = Array.from(pendingChanges.remove).map(id => ({ id } as TLRecord));
                    broadcastUpdate(removeRecords, 'remove');
                }
                
                // Clear pending changes
                pendingChanges.put.clear();
                pendingChanges.remove.clear();
            }, debounceTime);
        }, { source: 'user', scope: 'document' });

        return () => {
            if (broadcastTimeout) clearTimeout(broadcastTimeout);
            unsubscribe();
        };
    }, [broadcastUpdate, requestState]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={isOwner ? onClose : undefined}
            />

            {/* Whiteboard Container */}
            <div className="relative flex-1 flex flex-col bg-white m-2 md:m-4 rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="h-12 md:h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-3 md:px-4 shrink-0 z-10">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
                            <Presentation className="w-4 h-4 text-neutral-600" />
                        </div>
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">Whiteboard</h2>
                            <p className="text-[10px] text-neutral-500 font-medium">
                                {isOwner ? 'You are presenting' : `${ownerName} is presenting`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Permissions Toggle for Owner */}
                        {isOwner && onToggleReadOnly && (
                            <button
                                onClick={onToggleReadOnly}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${readOnly
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                            >
                                {readOnly ? (
                                    <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">View Only</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Collaborative</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Read Only Status for VIEWERS */}
                        {!isOwner && readOnly && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-500 border border-neutral-200 text-xs font-medium">
                                <Lock className="w-3.5 h-3.5" />
                                <span>View Only</span>
                            </div>
                        )}

                        {/* Connection Status */}
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border ${isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
                        </div>

                        {/* Participant Count */}
                        <div className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-medium flex items-center gap-1 border border-neutral-200">
                            <Users className="w-3 h-3" />
                            {participants.length}
                        </div>

                        {isOwner && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors text-neutral-600 hover:text-neutral-900 border border-transparent hover:border-neutral-200"
                                title="Stop presenting (Esc)"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tldraw Canvas */}
                <div className={`flex-1 relative bg-neutral-50 ${!isOwner && readOnly ? 'pointer-events-none opacity-90' : ''}`}>
                    <Tldraw
                        onMount={handleMount}
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
