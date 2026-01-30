"use client";

import { ParticipantView, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Pin } from "lucide-react";

interface ParticipantStripProps {
    onPinParticipant: (userId: string) => void;
    localUserId?: string;
}

export default function ParticipantStrip({ onPinParticipant, localUserId }: ParticipantStripProps) {
    const { useParticipants, useLocalParticipant } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();

    return (
        <div className="h-24 md:h-28 lg:h-32 flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-1 shrink-0">

            {/* Local User */}
            {localParticipant && (
                <div className="relative h-full w-auto aspect-video rounded-lg border border-white/10 overflow-hidden flex-shrink-0 group hover:border-white/30 transition-colors bg-neutral-900">
                    <div className="absolute inset-0 scale-x-[-1]">
                        <ParticipantView
                            participant={localParticipant}
                            ParticipantViewUI={null}
                        />
                    </div>

                    {/* Pin Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <button
                            onClick={() => onPinParticipant(localParticipant.userId)}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform touch-manipulation"
                            title="Pin yourself"
                        >
                            <Pin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    </div>

                    {/* Name & Status Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-1.5 md:p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end z-10">
                        <span className="text-[9px] md:text-[10px] font-medium text-white/90">You</span>
                        <div className="flex gap-1">
                            {localParticipant.isSpeaking && (
                                <div className="flex gap-0.5 items-end h-2 md:h-2.5">
                                    <div className="w-0.5 bg-emerald-400 h-1 md:h-1.5 animate-pulse" />
                                    <div className="w-0.5 bg-emerald-400 h-2 md:h-2.5 animate-pulse" />
                                    <div className="w-0.5 bg-emerald-400 h-1 animate-pulse" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Remote Participants */}
            {participants
                .filter((p) => p.userId !== localParticipant?.userId)
                .map((participant) => (
                    <ParticipantTile
                        key={participant.sessionId}
                        participant={participant}
                        onPin={() => onPinParticipant(participant.userId)}
                    />
                ))}
        </div>
    );
}

function ParticipantTile({ participant, onPin }: { participant: any; onPin: () => void }) {
    const hasVideo = !!(
        participant.videoStream ||
        participant.publishedTracks.some((t: any) =>
            t.type === 'video' ||
            t.trackType === 'videoTrack' ||
            t.kind === 'video' ||
            (t.mimeType && t.mimeType.startsWith('video/'))
        )
    );
    const isMuted = !participant.publishedTracks.some((track: any) => track.type === 'audio');

    return (
        <div className="relative h-full w-auto aspect-video rounded-lg border border-white/10 overflow-hidden flex-shrink-0 group hover:border-white/30 transition-colors bg-neutral-900">
            <div className="absolute inset-0">
                <ParticipantView
                    participant={participant}
                    ParticipantViewUI={null}
                />
            </div>

            {/* Avatar Fallback Overlay */}
            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#111] z-10">
                    <img
                        src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${participant.userId}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
                        alt={participant.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full opacity-80"
                    />
                </div>
            )}

            {/* Pin Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <button
                    onClick={onPin}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform touch-manipulation"
                    title={`Pin ${participant.name}`}
                >
                    <Pin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
            </div>

            {/* Name & Status */}
            <div className="absolute bottom-0 inset-x-0 p-1.5 md:p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                <span className="text-[9px] md:text-[10px] font-medium text-white/90 truncate max-w-[80%]">
                    {participant.name || 'Guest'}
                </span>
                {isMuted && (
                    <div className="bg-red-500/10 p-1 rounded-full border border-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 md:w-3 md:h-3">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
