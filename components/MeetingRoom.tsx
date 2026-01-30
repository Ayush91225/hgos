"use client";

import { useCallStateHooks, useCall, ParticipantView, SpeakerLayout } from "@stream-io/video-react-sdk";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
    LayoutList,
    Presentation,
    MonitorUp,
    Hand as HandIcon,
    Pin,
    MicOff,
    Settings,
    Info,
    Clock,
    Calculator
} from "lucide-react";

import ControlDock from "@/components/ControlDock";
import Sidebar from "@/components/Sidebar";
import Whiteboard from "@/components/Whiteboard";
import Graphs from "@/components/Graphs";

export default function MeetingRoom() {
    const router = useRouter();
    const call = useCall();
    const [showSidebar, setShowSidebar] = useState(false); // Default closed for mobile safety
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showGraphs, setShowGraphs] = useState(false);
    const [graphsOwnerId, setGraphsOwnerId] = useState<string | null>(null);
    const [isGraphsReadOnly, setIsGraphsReadOnly] = useState(false);
    const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
    const [whiteboardOwnerId, setWhiteboardOwnerId] = useState<string | null>(null);
    const [isWhiteboardReadOnly, setIsWhiteboardReadOnly] = useState(false);
    const [handRaisedUsers, setHandRaisedUsers] = useState<Set<string>>(new Set());
    const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; userId: string }>>([]);
    const [showMeetingInfo, setShowMeetingInfo] = useState(false);
    
    // Chat state for premium messaging
    const [messages, setMessages] = useState<Array<{ id: string; text: string; userId: string; timestamp: number }>>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Toast notifications
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' }>>([]);

    const {
        useCallCallingState,
        useParticipants,
        useLocalParticipant,
        useDominantSpeaker,
        useHasOngoingScreenShare,
        useScreenShareState
    } = useCallStateHooks();

    const callingState = useCallCallingState();
    const particles = useParticipants();
    const localParticipant = useLocalParticipant();
    const dominantSpeaker = useDominantSpeaker();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const { screenShare } = useScreenShareState();
    const params = useParams();
    const meetingId = params?.id;

    // Find screen sharing participant using Stream.io's built-in detection
    const screenSharingParticipant = particles.find(p => {
        // Check if this participant has screen share tracks
        const hasScreenShareTrack = p.publishedTracks.some((track: any) => {
            const isScreenShare = 
                track.trackType === 'screenShareVideo' || 
                track.type === 'screenShareVideo' ||
                track.trackType === 'screenShare' ||
                track.type === 'screenShare' ||
                (track.source && track.source === 'screen') ||
                track.kind === 'screenshare';
            
            return isScreenShare;
        });
        
        // Also check if this participant is the local participant and screen sharing is active
        const isLocalScreenSharing = p.userId === localParticipant?.userId && hasOngoingScreenShare;
        
        return hasScreenShareTrack || isLocalScreenSharing;
    });
    
    const hasScreenShare = hasOngoingScreenShare || !!screenSharingParticipant;
    
    // Debug screen share state - Always log when screen sharing changes
    useEffect(() => {
        // Only log when state changes, not continuously
        if (hasOngoingScreenShare && screenSharingParticipant) {
            console.log('✅ Screen sharing active:', screenSharingParticipant);
        }
    }, [hasOngoingScreenShare, screenSharingParticipant]);

    // Premium sound effects
    const playSound = useCallback((type: 'handRaise' | 'message' | 'join' | 'leave' | 'poll') => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different sounds for different actions
            switch (type) {
                case 'handRaise':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                    break;
                case 'message':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);
                    break;
                case 'poll':
                    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.15);
                    break;
                case 'join':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
                    break;
                case 'leave':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Sound not available');
        }
    }, []);
    
    // Show toast notification
    const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);
    useEffect(() => {
        const optimizeMobile = () => {
            const isMobile = window.innerWidth < 768;
            
            if (isMobile) {
                // Optimize video quality for mobile
                const videoElements = document.querySelectorAll('video');
                videoElements.forEach((video: HTMLVideoElement) => {
                    if (video.srcObject instanceof MediaStream) {
                        const tracks = video.srcObject.getVideoTracks();
                        tracks.forEach(track => {
                            track.applyConstraints({
                                frameRate: { ideal: 24, max: 30 },
                                width: { ideal: 640, max: 1280 },
                                height: { ideal: 480, max: 720 }
                            }).catch(() => {});
                        });
                    }
                });
                
                // Prevent zoom on input focus
                const metaViewport = document.querySelector('meta[name=viewport]');
                if (metaViewport) {
                    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                }
            }
        };
        
        optimizeMobile();
        window.addEventListener('resize', optimizeMobile);
        return () => window.removeEventListener('resize', optimizeMobile);
    }, []);
    // Advanced client-side video enhancement with mobile optimization
    useEffect(() => {
        const enhanceVideoElements = () => {
            const videoElements = document.querySelectorAll('video');
            const isMobile = window.innerWidth < 768;
            
            videoElements.forEach((video: HTMLVideoElement) => {
                if (video.srcObject) {
                    // Mobile-adaptive visual quality filters
                    const filters = isMobile 
                        ? 'contrast(1.1) brightness(1.05) saturate(1.08)' // Lighter filters for mobile
                        : 'contrast(1.15) brightness(1.08) saturate(1.12) blur(0px) hue-rotate(0deg)';
                    
                    video.style.filter = filters;
                    video.style.imageRendering = 'optimizeQuality';
                    
                    // Hardware acceleration
                    video.style.transform = 'translateZ(0) scale3d(1,1,1)';
                    video.style.willChange = 'transform, filter';
                    video.style.backfaceVisibility = 'hidden';
                    
                    // Mobile-optimized attributes
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('webkit-playsinline', 'true');
                    video.setAttribute('preload', isMobile ? 'metadata' : 'none');
                    video.muted = false;
                    
                    // Mobile-adaptive constraints
                    if (video.srcObject instanceof MediaStream) {
                        const tracks = video.srcObject.getVideoTracks();
                        tracks.forEach(track => {
                            const constraints = track.getConstraints();
                            const mobileConstraints = isMobile ? {
                                frameRate: { ideal: 24, max: 30 },
                                width: { ideal: 640, max: 1280 },
                                height: { ideal: 480, max: 720 }
                            } : {
                                frameRate: { ideal: 30, max: 60 },
                                width: { ideal: 1280, max: 1920 },
                                height: { ideal: 720, max: 1080 }
                            };
                            
                            track.applyConstraints({
                                ...constraints,
                                ...mobileConstraints
                            }).catch(() => {});
                        });
                    }
                }
            });
        };

        enhanceVideoElements();
        
        // Optimized observer for mobile
        const observer = new MutationObserver((mutations) => {
            let hasVideoChanges = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && 
                        ((node as Element).tagName === 'VIDEO' || 
                         (node as Element).querySelector('video'))) {
                        hasVideoChanges = true;
                    }
                });
            });
            if (hasVideoChanges) {
                requestAnimationFrame(enhanceVideoElements);
            }
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: false
        });
        
        return () => observer.disconnect();
    }, [particles.length]);
    // Low-latency network optimization
    useEffect(() => {
        if (!call) return;

        const optimizeLowLatency = async () => {
            try {
                // Enable camera with low-latency settings
                await call.camera.enable();
                
                // Detect network quality for adaptive streaming
                const connection = (navigator as any).connection;
                const isSlowNetwork = connection && 
                    (connection.effectiveType === 'slow-2g' || 
                     connection.effectiveType === '2g' || 
                     connection.downlink < 2);
                
                // Configure WebRTC for low latency
                const peerConnections = (call as any).state?.peerConnections || [];
                peerConnections.forEach((pc: RTCPeerConnection) => {
                    if (pc.getConfiguration) {
                        pc.setConfiguration({
                            ...pc.getConfiguration(),
                            iceTransportPolicy: 'all',
                            bundlePolicy: 'max-bundle',
                            rtcpMuxPolicy: 'require'
                        });
                    }
                });
                
                console.log(`✅ Low-latency mode: ${isSlowNetwork ? 'Adaptive' : 'High-performance'}`);
            } catch (error) {
                console.error('Failed to optimize latency:', error);
            }
        };

        optimizeLowLatency();
    }, [call]);

    // Screen share video handling - force stream assignment
    useEffect(() => {
        if (!hasOngoingScreenShare || !screenSharingParticipant) return;
        
        const fixScreenShareVideo = () => {
            const screenShareVideo = document.querySelector('.str-video__video--screen-share') as HTMLVideoElement;
            const screenShareOverlay = document.querySelector('.str-video__screen-share-overlay') as HTMLElement;
            
            if (screenShareVideo) {
                // Hide overlay
                if (screenShareOverlay) {
                    screenShareOverlay.style.display = 'none';
                }
                
                // Make video visible
                screenShareVideo.style.display = 'block';
                screenShareVideo.style.visibility = 'visible';
                screenShareVideo.style.opacity = '1';
                screenShareVideo.style.position = 'relative';
                screenShareVideo.style.zIndex = '20';
                
                // Force assign screen share stream if missing
                if (!screenShareVideo.srcObject && screenSharingParticipant) {
                    console.log('🔧 Manually assigning screen share stream...');
                    
                    // Find screen share track
                    const screenTrack = screenSharingParticipant.publishedTracks.find((track: any) => 
                        track.trackType === 'screenShareVideo' || 
                        track.type === 'screenShareVideo' ||
                        track.trackType === 'screenShare' ||
                        track.type === 'screenShare'
                    );
                    
                    if (screenTrack) {
                        // Try different ways to get the MediaStreamTrack
                        const mediaTrack = (screenTrack as any).track || 
                                         (screenTrack as any).mediaStreamTrack ||
                                         (screenTrack as any).stream?.getVideoTracks()?.[0];
                        
                        if (mediaTrack) {
                            const stream = new MediaStream([mediaTrack]);
                            screenShareVideo.srcObject = stream;
                            screenShareVideo.muted = false;
                            screenShareVideo.play().then(() => {
                                console.log('✅ Screen share video now playing manually!');
                            }).catch(error => {
                                console.error('❌ Failed to play screen share:', error);
                            });
                        } else {
                            console.log('⚠️ No media track found in screen share track');
                        }
                    } else {
                        console.log('⚠️ No screen share track found');
                    }
                } else if (screenShareVideo.srcObject && screenShareVideo.paused) {
                    screenShareVideo.play().catch(() => {});
                }
                
                // Log current state
                console.log('📺 Screen share video state:', {
                    hasSrcObject: !!screenShareVideo.srcObject,
                    isPaused: screenShareVideo.paused,
                    videoWidth: screenShareVideo.videoWidth,
                    videoHeight: screenShareVideo.videoHeight,
                    readyState: screenShareVideo.readyState
                });
            }
        };

        fixScreenShareVideo();
        const interval = setInterval(fixScreenShareVideo, 2000);
        
        return () => clearInterval(interval);
    }, [hasOngoingScreenShare, screenSharingParticipant]);

    // Listen for custom events (whiteboard, hand raise, reactions)
    useEffect(() => {
        if (!call) return;

        const handleCustomEvent = (event: any) => {
            const eventType = event.custom?.type;
            const userId = event.user?.id;

            if (eventType === 'whiteboard_share') {
                if (event.custom.action === 'start') {
                    setWhiteboardOwnerId(userId);
                    setShowWhiteboard(true);
                    setIsWhiteboardReadOnly(false); // Reset on start
                } else if (event.custom.action === 'stop') {
                    setWhiteboardOwnerId(null);
                    setShowWhiteboard(false);
                    setIsWhiteboardReadOnly(false);
                } else if (event.custom.action === 'permissions') {
                    setIsWhiteboardReadOnly(event.custom.readOnly);
                }
            } else if (eventType === 'hand_raise') {
                if (event.custom.action === 'raise') {
                    playSound('handRaise');
                    setHandRaisedUsers(prev => {
                        const newSet = new Set(Array.from(prev));
                        newSet.add(userId);
                        return newSet;
                    });
                } else if (event.custom.action === 'lower') {
                    setHandRaisedUsers(prev => {
                        const next = new Set(Array.from(prev));
                        next.delete(userId);
                        return next;
                    });
                }
            } else if (eventType === 'message') {
                playSound('message');
                const newMessage = {
                    id: `${userId}-${Date.now()}`,
                    text: event.custom.text,
                    userId,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, newMessage]);
                if (!showSidebar) {
                    setUnreadCount(prev => prev + 1);
                }
            } else if (eventType === 'reaction') {
                const reactionId = `${userId}-${Date.now()}`;
                const emoji = event.custom.emoji;
                setReactions(prev => [...prev, { id: reactionId, emoji, userId }]);

                setTimeout(() => {
                    setReactions(prev => prev.filter(r => r.id !== reactionId));
                }, 3000);
            } else if (eventType === 'poll_created') {
                const creatorName = event.user?.name || 'Someone';
                playSound('poll');
                showToast(`${creatorName} created a new poll`, 'info');
            }
        };

        call.on('custom', handleCustomEvent);
        return () => { call.off('custom', handleCustomEvent); };
    }, [call]);

    const handlePinParticipant = (participantId: string) => {
        setPinnedParticipantId(prev => prev === participantId ? null : participantId);
    };

    const handleOpenWhiteboard = async () => {
        if (!call || !localParticipant) return;
        try {
            await call.sendCustomEvent({
                type: 'whiteboard_share',
                action: 'start',
            });
            setWhiteboardOwnerId(localParticipant.userId);
            setShowWhiteboard(true);
            setIsWhiteboardReadOnly(false);
        } catch (error) {
            console.error('Failed to start whiteboard:', error);
            setWhiteboardOwnerId(localParticipant.userId);
            setShowWhiteboard(true);
        }
    };

    const handleToggleWhiteboardPermissions = async () => {
        if (!call || !localParticipant) return;
        const newReadOnlyState = !isWhiteboardReadOnly;

        setIsWhiteboardReadOnly(newReadOnlyState); // Optimistic update

        try {
            await call.sendCustomEvent({
                type: 'whiteboard_share',
                action: 'permissions',
                readOnly: newReadOnlyState,
            });
        } catch (error) {
            console.error('Failed to toggle permissions:', error);
            setIsWhiteboardReadOnly(!newReadOnlyState); // Revert
        }
    };

    const handleCloseWhiteboard = async () => {
        if (!call || !localParticipant) return;
        if (whiteboardOwnerId === localParticipant.userId) {
            try {
                await call.sendCustomEvent({
                    type: 'whiteboard_share',
                    action: 'stop',
                });
            } catch (error) {
                console.error('Failed to stop whiteboard:', error);
            }
        }
        setWhiteboardOwnerId(null);
        setShowWhiteboard(false);
    };

    const handleOpenGraphs = async () => {
        if (!localParticipant) return;
        // Don't send custom event - just open locally
        setGraphsOwnerId(localParticipant.userId);
        setShowGraphs(true);
    };

    const handleCloseGraphs = async () => {
        // Don't send custom event - just close locally
        setGraphsOwnerId(null);
        setShowGraphs(false);
    };

    if (callingState !== 'joined') {
        return (
            <div className="h-screen w-screen flex items-center justify-center text-white bg-neutral-950">
                <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
                    </div>
                    <p className="text-sm text-neutral-400 font-medium animate-pulse">Entering secure room...</p>
                </div>
            </div>
        );
    }

    const whiteboardOwner = particles.find(p => p.userId === whiteboardOwnerId);
    const graphsOwner = particles.find(p => p.userId === graphsOwnerId);

    // Grid layout calculator
    // Grid layout calculator - Responsive updates
    const getGridClass = (count: number) => {
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-1 sm:grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-2 md:grid-cols-3";
        if (count <= 9) return "grid-cols-3";
        return "grid-cols-3 md:grid-cols-4";
    };

    const meetingIdStr = typeof meetingId === 'string' ? meetingId : 'meeting';

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-neutral-950 text-white font-sans selection:bg-neutral-800">
            {/* Header */}
            <header className="absolute top-0 inset-x-0 h-12 sm:h-14 border-b border-neutral-700/50 flex items-center justify-between px-2 sm:px-4 z-40 bg-neutral-900/95 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2 sm:gap-6">
                    <div className="flex items-center gap-2">
                        {/* Logo Image */}
                        <img
                            src="https://homeguruworld.com/wp-content/uploads/2022/04/Homeguru-Logo-1.png"
                            alt="HomeGuru"
                            className="h-6 sm:h-8 w-auto object-contain"
                        />
                    </div>

                    <div className="w-px h-4 sm:h-6 bg-neutral-600/50" />

                    {/* Meeting Info */}
                    <button
                        onClick={() => setShowMeetingInfo(!showMeetingInfo)}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-neutral-800/50 transition-all text-xs sm:text-sm font-medium text-neutral-400 hover:text-white"
                    >
                        <span className="truncate max-w-20 sm:max-w-none">{meetingIdStr}</span>
                        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>

                {/* Indicators */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {hasScreenShare && screenSharingParticipant && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/90 text-white border border-blue-500/30 text-[10px] font-medium animate-fade-in">
                            <MonitorUp className="w-3 h-3" />
                            <span>Sharing</span>
                        </div>
                    )}
                    {showWhiteboard && whiteboardOwner && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-600/90 text-white border border-orange-500/30 text-[10px] font-medium animate-fade-in">
                            <Presentation className="w-3 h-3" />
                            <span>Presenting</span>
                        </div>
                    )}
                    {showGraphs && localParticipant?.userId === graphsOwnerId && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white border border-emerald-500/30 text-[10px] font-medium animate-fade-in">
                            <Calculator className="w-3 h-3" />
                            <span>Graphing</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <MeetingClock />

                    <div className="w-px h-4 sm:h-6 bg-neutral-600/50" />

                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex -space-x-1 sm:-space-x-2">
                            {particles.slice(0, 3).map((p, i) => (
                                <div key={p.sessionId} className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center text-[8px] sm:text-[9px] z-10">
                                    {p.name?.charAt(0) || '?'}
                                </div>
                            ))}
                            {particles.length > 3 && (
                                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center text-[8px] sm:text-[9px] z-20">
                                    +{particles.length - 3}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setShowSidebar(!showSidebar);
                            if (!showSidebar) setUnreadCount(0);
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all border border-transparent touch-manipulation relative ${showSidebar ? 'bg-neutral-800/80 text-white border-neutral-600/30' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'}`}
                    >
                        <LayoutList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </button>

                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 border border-neutral-600/30 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-bold text-white">
                            {localParticipant?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Meeting Info Modal */}
            {
                showMeetingInfo && (
                    <div className="absolute top-16 left-4 z-50 glass-panel rounded-xl p-4 w-72 animate-fade-in">
                        <h3 className="text-sm font-semibold mb-2">Meeting Details</h3>
                        <div className="space-y-2 text-xs text-neutral-400">
                            <div className="flex justify-between">
                                <span>Meeting ID:</span>
                                <span className="font-mono text-white">{meetingIdStr}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Participants:</span>
                                <span className="text-white">{particles.length}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                setShowMeetingInfo(false);
                            }}
                            className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                        >
                            Copy Meeting Link
                        </button>
                    </div>
                )
            }

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative z-0 pt-12 sm:pt-16 pb-16 sm:pb-0 px-0 gap-0">
                {/* Video Stage */}
                <main className="flex-1 relative flex flex-col overflow-hidden bg-black shadow-none">

                    {/* Screen Share Mode - Use Stream.io built-in rendering with fallback */}
                    {hasOngoingScreenShare ? (
                        <div className="flex-1 flex flex-col gap-2">
                            {/* Main Screen Share View */}
                            <div className="flex-1 rounded-xl border border-blue-500/20 overflow-hidden relative bg-neutral-900">
                                <div className="absolute bottom-3 left-3 glass-panel px-2.5 py-1.5 rounded-lg flex items-center gap-2 z-10">
                                    <MonitorUp className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs font-medium text-white">
                                        {screenSharingParticipant?.name || 'Someone'} is sharing
                                    </span>
                                </div>
                                
                                {/* Use SpeakerLayout which handles screen share automatically */}
                                <SpeakerLayout />
                            </div>

                            {/* Participant Strip */}
                            <div className="h-24 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                                {particles.map((participant) => (
                                    <VideoTile
                                        key={participant.sessionId}
                                        participant={participant}
                                        isPinned={pinnedParticipantId === participant.userId}
                                        isHandRaised={handRaisedUsers.has(participant.userId)}
                                        onPin={() => handlePinParticipant(participant.userId)}
                                        isLocal={participant.userId === localParticipant?.userId}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Grid Layout */
                        <div className={`flex-1 grid ${getGridClass(particles.length)} gap-0.5 sm:gap-1 auto-rows-fr p-0.5 sm:p-1`}>
                            {particles.map((participant) => (
                                <div
                                    key={participant.sessionId}
                                    className={`relative rounded-lg border overflow-hidden bg-neutral-900 cursor-pointer group ${pinnedParticipantId === participant.userId
                                        ? 'border-emerald-500/50 ring-2 ring-emerald-500/20'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                    onClick={() => handlePinParticipant(participant.userId)}
                                >
                                    {/* High-quality video with optimized rendering */}
                                    <div className={`absolute inset-0 video-fill ${participant.userId === localParticipant?.userId ? 'scale-x-[-1]' : ''}`}>
                                        <ParticipantView
                                            participant={participant}
                                            ParticipantViewUI={null}
                                            VideoPlaceholder={() => (
                                                <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                                                    <img
                                                        src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${participant.userId}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
                                                        alt={participant.name}
                                                        className="w-20 h-20 rounded-full opacity-80"
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>

                                    {/* Overlay gradient */}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                    {/* Hand Raised - Icon */}
                                    {handRaisedUsers.has(participant.userId) && (
                                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center animate-bounce z-10">
                                            <HandIcon className="w-4 h-4 text-black" />
                                        </div>
                                    )}

                                    {/* Pin indicator */}
                                    {pinnedParticipantId === participant.userId && (
                                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-emerald-500/80 flex items-center justify-center z-10">
                                            <Pin className="w-3 h-3 text-white" />
                                        </div>
                                    )}

                                    {/* Mute indicator */}
                                    {!(participant.audioStream || participant.publishedTracks.some((t: any) => t.type === 'audio')) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center z-10">
                                            <MicOff className="w-3 h-3 text-red-500" />
                                        </div>
                                    )}

                                    {/* Name Tag */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                                        <span className="text-[10px] md:text-xs font-medium text-white truncate">
                                            {participant.name || 'Guest'}
                                            {participant.userId === localParticipant?.userId && ' (You)'}
                                        </span>
                                        {participant.isSpeaking && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="w-0.5 h-2 bg-emerald-400 animate-pulse rounded-full" />
                                                <div className="w-0.5 h-3 bg-emerald-400 animate-pulse rounded-full" />
                                                <div className="w-0.5 h-2 bg-emerald-400 animate-pulse rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Floating Reactions */}
                    <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
                        {reactions.map((reaction) => {
                            const user = particles.find(p => p.userId === reaction.userId);
                            return (
                                <div
                                    key={reaction.id}
                                    className="flex items-center gap-2 glass-panel px-3 py-2 rounded-lg animate-slide-up"
                                >
                                    <span className="text-2xl">{reaction.emoji}</span>
                                    <span className="text-xs text-white">{user?.name || 'Someone'}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Control Dock */}
                    <ControlDock
                        handRaisedUsers={handRaisedUsers}
                        onOpenWhiteboard={handleOpenWhiteboard}
                        onOpenGraphs={handleOpenGraphs}
                    />
                </main>

                {/* Sidebar */}
                {showSidebar && (
                    <Sidebar
                        isOpen={showSidebar}
                        onClose={() => setShowSidebar(false)}
                        onOpenWhiteboard={handleOpenWhiteboard}
                        onOpenGraphs={handleOpenGraphs}
                        messages={messages}
                        onSendMessage={(text) => {
                            if (call && localParticipant) {
                                call.sendCustomEvent({
                                    type: 'message',
                                    text
                                });
                            }
                        }}
                    />
                )}
            </div>

            {/* Whiteboard Overlay */}
            {
                showWhiteboard && (
                    <Whiteboard
                        roomId={meetingIdStr}
                        onClose={handleCloseWhiteboard}
                        isOwner={whiteboardOwnerId === localParticipant?.userId}
                        ownerName={whiteboardOwner?.name || 'Someone'}
                        readOnly={isWhiteboardReadOnly}
                        onToggleReadOnly={handleToggleWhiteboardPermissions}
                    />
                )
            }

            {/* Graphs Overlay */}
            {
                showGraphs && (
                    <Graphs
                        roomId={meetingIdStr}
                        onClose={handleCloseGraphs}
                        isOwner={graphsOwnerId === localParticipant?.userId}
                        ownerName={graphsOwner?.name || 'Someone'}
                    />
                )
            }



            {/* Click outside to close meeting info */}
            {
                showMeetingInfo && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMeetingInfo(false)}
                    />
                )
            }
        </div>
    );
}

// Video Tile with object-cover
function VideoTile({ participant, isPinned, isHandRaised, onPin, isLocal }: {
    participant: any;
    isPinned: boolean;
    isHandRaised: boolean;
    onPin: () => void;
    isLocal: boolean;
}) {
    const hasVideo = !!(
        participant.videoStream ||
        participant.publishedTracks.some((t: any) =>
            t.type === 'video' ||
            t.trackType === 'videoTrack' ||
            t.kind === 'video' ||
            (t.mimeType && t.mimeType.startsWith('video/'))
        )
    );

    return (
        <div
            className={`relative h-full aspect-video rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group transition-all duration-300 ${isPinned
                ? 'ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10'
                : 'border border-white/10 hover:border-white/20'
                }`}
            onClick={onPin}
        >
            {/* High-quality video tile */}
            <div className={`absolute inset-0 video-fill ${isLocal ? 'scale-x-[-1]' : ''}`}>
                <ParticipantView
                    participant={participant}
                    ParticipantViewUI={null}
                    VideoPlaceholder={() => (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                            <img
                                src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${participant.userId}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
                                alt={participant.name}
                                className="w-16 h-16 rounded-full opacity-80"
                            />
                        </div>
                    )}
                />
            </div>

            {isHandRaised && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center animate-bounce">
                    <HandIcon className="w-3 h-3 text-black" />
                </div>
            )}

            <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-[9px] font-medium text-white/90">
                    {isLocal ? 'You' : participant.name || 'Guest'}
                </span>
            </div>
        </div>
    );
}

function MeetingClock() {
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('00:00');
    const call = useCall();
    const [meetingStartTime, setMeetingStartTime] = useState<number | null>(null);

    // Get meeting start time from call metadata
    useEffect(() => {
        if (!call) return;

        const getMeetingStart = async () => {
            try {
                // Get start time from call custom data
                const callData = await call.get();
                const startTime = callData?.call?.custom?.meeting_start_time;
                if (startTime) {
                    setMeetingStartTime(startTime);
                } else {
                    // Fallback to current time if no start time found
                    setMeetingStartTime(Date.now());
                }
            } catch (error) {
                console.error('Failed to get meeting start time:', error);
                setMeetingStartTime(Date.now());
            }
        };

        getMeetingStart();
    }, [call]);

    useEffect(() => {
        if (!meetingStartTime) return;

        const update = () => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            const elapsed = Math.floor((Date.now() - meetingStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [meetingStartTime]);

    return (
        <div className="flex items-center gap-1 sm:gap-2 text-neutral-400 bg-neutral-800/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-neutral-600/30">
            <span className="text-[10px] sm:text-xs font-semibold tabular-nums tracking-wide text-white">{time}</span>
            <span className="text-neutral-500 text-[8px] sm:text-[10px] hidden sm:inline">•</span>
            <span className="text-[10px] sm:text-xs font-mono tabular-nums text-emerald-400">{duration}</span>
        </div>
    );
}
