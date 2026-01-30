import { useMemo } from 'react';

export type LayoutMode = 'SOLO' | 'DUAL' | 'SPEAKER' | 'PINNED';

interface UseLayoutModeProps {
    participantCount: number;
    isPinned: boolean;
    isScreenSharing?: boolean;
}

/**
 * Smart hook to determine the optimal layout mode based on:
 * - Number of participants
 * - Pinned state
 * - Screen sharing state
 * 
 * Layout Modes:
 * - SOLO: 1 participant (full screen)
 * - DUAL: 2 participants (side-by-side split)
 * - SPEAKER: 3+ participants (main stage + strip)
 * - PINNED: Manual pin active (overrides other modes)
 */
export function useLayoutMode({
    participantCount,
    isPinned,
    isScreenSharing = false
}: UseLayoutModeProps): LayoutMode {
    return useMemo(() => {
        // Pinned content always takes priority
        if (isPinned || isScreenSharing) {
            return 'PINNED';
        }

        // Dynamic layout based on participant count
        if (participantCount === 1) {
            return 'SOLO';
        } else if (participantCount === 2) {
            return 'DUAL';
        } else {
            return 'SPEAKER';
        }
    }, [participantCount, isPinned, isScreenSharing]);
}
