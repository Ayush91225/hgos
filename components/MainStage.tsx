"use client";

import { ParticipantView, CallStatsButton } from "@stream-io/video-react-sdk";
import { Pin } from "lucide-react";

interface MainStageProps {
    pinnedParticipant?: any | null;
    activeSpeaker?: any | null;
    screenShareStream?: MediaStream | null;
    onUnpin: () => void;
}

export default function MainStage({ pinnedParticipant, activeSpeaker, screenShareStream, onUnpin }: MainStageProps) {
    // Priority: Screen Share > Pinned > Active Speaker
    const displayParticipant = pinnedParticipant || activeSpeaker;
    const hasPinnedContent = !!pinnedParticipant;
    const isActiveSpeaker = !pinnedParticipant && activeSpeaker && displayParticipant?.userId === activeSpeaker?.userId;

    return (
        <div className="flex-1 rounded-lg md:rounded-xl border border-white/5 overflow-hidden relative bg-[#080808] flex items-center justify-center layout-transition">

            {/* Display participant video */}
            {displayParticipant ? (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    {/* Fixed aspect ratio container */}
                    <div className="relative max-w-full max-h-full aspect-video">
                        <ParticipantView
                            participant={displayParticipant}
                            ParticipantViewUI={null}
                        />
                    </div>

                    {/* Active Speaker Indicator */}
                    {isActiveSpeaker && displayParticipant.isSpeaking && (
                        <div className="absolute inset-0 border-4 border-emerald-500/50 rounded-lg md:rounded-xl pointer-events-none animate-pulse" />
                    )}
                </div>
            ) : (
                /* Placeholder when nothing to show */
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 transition-opacity">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 md:mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500 md:w-10 md:h-10">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <h3 className="text-xs md:text-sm text-neutral-400 font-medium">Waiting for participants...</h3>
                </div>
            )}

            {/* Unpin Button (only show when manually pinned) */}
            {hasPinnedContent && (
                <button
                    onClick={onUnpin}
                    className="absolute top-3 left-3 md:top-4 md:left-4 z-50 glass-panel px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium text-white hover:bg-white/10 transition-all flex items-center gap-1.5 md:gap-2"
                >
                    <Pin className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Unpin</span>
                </button>
            )}

            {/* Participant Name (bottom left) */}
            {displayParticipant && (
                <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-20 glass-panel px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-[10px] md:text-xs font-medium text-white">
                        {displayParticipant.name || 'Guest'}
                        {displayParticipant.isLocalParticipant && ' (You)'}
                    </span>
                    {isActiveSpeaker && displayParticipant.isSpeaking && (
                        <div className="flex gap-0.5 items-end h-3">
                            <div className="w-0.5 bg-emerald-400 h-1.5 animate-pulse" />
                            <div className="w-0.5 bg-emerald-400 h-3 animate-pulse" />
                            <div className="w-0.5 bg-emerald-400 h-2 animate-pulse" />
                        </div>
                    )}
                </div>
            )}

            {/* Network Status */}
            <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
                <CallStatsButton />
            </div>
        </div>
    );
}
