"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  Smile,
  X,
  MoreVertical,
  Copy,
  ThumbsUp,
  Heart,
  PartyPopper,
  Flame,
  Sparkles,
  Star,
  Settings,
  Wifi,
  WifiOff,
  Calculator
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ControlDockProps {
  handRaisedUsers?: Set<string>;
  onOpenWhiteboard?: () => void;
  onOpenGraphs?: () => void;
  onScreenShareChange?: (isSharing: boolean) => void;
}

// Reaction config with icons
const REACTIONS = [
  { emoji: '👍', label: 'Like', icon: ThumbsUp },
  { emoji: '❤️', label: 'Love', icon: Heart },
  { emoji: '🎉', label: 'Celebrate', icon: PartyPopper },
  { emoji: '🔥', label: 'Fire', icon: Flame },
  { emoji: '✨', label: 'Sparkle', icon: Sparkles },
  { emoji: '⭐', label: 'Star', icon: Star },
];

export default function ControlDock({ handRaisedUsers, onOpenWhiteboard, onOpenGraphs, onScreenShareChange }: ControlDockProps) {
  const call = useCall();
  const router = useRouter();
  const {
    useMicrophoneState,
    useCameraState,
    useLocalParticipant,
    useScreenShareState,
  } = useCallStateHooks();

  const { microphone, isMute } = useMicrophoneState();
  const { camera, isMute: isCameraOff } = useCameraState();
  const { screenShare, isMute: isScreenShareOff } = useScreenShareState();
  const localParticipant = useLocalParticipant();

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLowDataMode, setIsLowDataMode] = useState(false);

  // Screen share state from SDK
  const isScreenSharing = !isScreenShareOff;

  // Notify parent when screen share state changes
  useEffect(() => {
    onScreenShareChange?.(isScreenSharing);
  }, [isScreenSharing, onScreenShareChange]);

  const toggleMic = async () => {
    if (isMute) {
      await microphone.enable();
    } else {
      await microphone.disable();
    }
  };

  const toggleCamera = async () => {
    if (isCameraOff) {
      await camera.enable();
    } else {
      await camera.disable();
    }
  };

  const toggleScreenShare = async () => {
    if (!call) return;

    try {
      console.log('📺 Toggling screen share. Current state:', isScreenSharing);
      
      if (isScreenSharing) {
        console.log('🚫 Stopping screen share...');
        await screenShare.disable();
      } else {
        console.log('▶️ Starting screen share...');
        await screenShare.enable();
      }
      
      console.log('✅ Screen share toggle completed');
    } catch (error: any) {
      console.error('❌ Screen share error:', error);
      
      // Show user-friendly error message
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotSupportedError') {
        alert('Screen sharing is not supported in this browser.');
      } else {
        alert('Failed to start screen sharing. Please try again.');
      }
    }
  };

  const toggleHandRaise = async () => {
    if (!call) return;

    const newState = !isHandRaised;
    setIsHandRaised(newState);

    try {
      await call.sendCustomEvent({
        type: 'hand_raise',
        action: newState ? 'raise' : 'lower',
      });
    } catch (error) {
      console.error('Hand raise error:', error);
    }
  };

  const sendReaction = async (emoji: string) => {
    if (!call) return;

    try {
      await call.sendCustomEvent({
        type: 'reaction',
        emoji,
      });
      setShowReactions(false);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const toggleLowDataMode = async () => {
    setIsLowDataMode(!isLowDataMode);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowMoreMenu(false);
  };

  const handleLeave = async () => {
    // If screen sharing, stop it first
    if (isScreenSharing) {
      try {
        await screenShare.disable();
      } catch { }
    }

    await call?.leave();
    router.push('/');
  };

  return (
    <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 z-30">
      {/* Reactions Popup */}
      {showReactions && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 sm:mb-2 glass-panel rounded-lg sm:rounded-xl p-1.5 sm:p-2 flex gap-0.5 sm:gap-1 animate-fade-in">
          {REACTIONS.map(({ emoji, label, icon: Icon }) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg hover:bg-white/10 flex flex-col items-center justify-center transition-transform hover:scale-110 group"
              title={label}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-yellow-400 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* More Menu */}
      {showMoreMenu && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 sm:mb-2 glass-panel rounded-lg sm:rounded-xl p-1.5 sm:p-2 w-44 sm:w-52 animate-fade-in">
          <button
            onClick={copyMeetingLink}
            className="w-full flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:bg-white/10 text-left text-xs sm:text-sm text-white"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Copy meeting link
          </button>
          <button
            onClick={() => {
              onOpenWhiteboard?.();
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-white"
          >
            <Sparkles className="w-4 h-4" />
            Open Whiteboard
          </button>

          {/* Moved Graphs to main dock */}
          <button
            onClick={toggleLowDataMode}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm ${isLowDataMode ? 'text-yellow-400' : 'text-white'}`}
          >
            {isLowDataMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {isLowDataMode ? 'Exit Low Data Mode' : 'Low Data Mode'}
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-white"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="glass-panel rounded-lg sm:rounded-xl p-1 sm:p-1.5 flex items-center gap-0.5 sm:gap-1 shadow-xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl bg-black/80">
        {/* Low Data Mode Indicator */}
        {isLowDataMode && (
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/20 text-yellow-400 text-[9px] sm:text-[10px] font-medium rounded-md sm:rounded-lg mr-0.5 sm:mr-1 flex items-center gap-0.5 sm:gap-1">
            <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">Audio Only</span>
          </div>
        )}

        {/* Mic */}
        <ControlButton
          onClick={toggleMic}
          icon={isMute ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip={isMute ? "Unmute" : "Mute"}
          danger={isMute}
        />

        {/* Camera */}
        <ControlButton
          onClick={toggleCamera}
          icon={isCameraOff ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <VideoIcon className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip={isCameraOff ? "Turn on camera" : "Turn off camera"}
          danger={isCameraOff}
        />

        <Divider />

        {/* Screen Share */}
        <ControlButton
          onClick={toggleScreenShare}
          icon={isScreenSharing ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5" /> : <MonitorUp className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip={isScreenSharing ? "Stop sharing" : "Share screen"}
          highlight={isScreenSharing}
        />

        {/* Hand Raise */}
        <ControlButton
          onClick={toggleHandRaise}
          icon={<Hand className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip={isHandRaised ? "Lower hand" : "Raise hand"}
          highlight={isHandRaised}
        />

        {/* Graphs - Main Dock */}
        <ControlButton
          onClick={onOpenGraphs || (() => { })}
          icon={<Calculator className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip="Desmos Graphs"
        />

        {/* Reactions */}
        <ControlButton
          onClick={() => {
            setShowReactions(!showReactions);
            setShowMoreMenu(false);
          }}
          icon={<Smile className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip="Reactions"
          highlight={showReactions}
        />

        {/* More */}
        <ControlButton
          onClick={() => {
            setShowMoreMenu(!showMoreMenu);
            setShowReactions(false);
          }}
          icon={<MoreVertical className="w-4 h-4 md:w-5 md:h-5" />}
          tooltip="More options"
          highlight={showMoreMenu}
        />

        <Divider />

        {/* Leave */}
        <button
          onClick={handleLeave}
          className="px-2 sm:px-3 md:px-4 h-7 sm:h-8 md:h-9 rounded-md sm:rounded-lg md:rounded-xl bg-red-500 hover:bg-red-600 text-white text-[9px] sm:text-[10px] md:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5"
        >
          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Click outside to close menus */}
      {(showReactions || showMoreMenu) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowReactions(false);
            setShowMoreMenu(false);
          }}
        />
      )}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 md:h-5 bg-white/10 mx-0.5" />;
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  danger?: boolean;
  highlight?: boolean;
}

function ControlButton({ onClick, icon, tooltip, danger = false, highlight = false }: ControlButtonProps) {
  const baseClass = "w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 border group relative touch-manipulation";

  let buttonClass = baseClass;
  if (danger) {
    buttonClass += " bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 hover:border-red-500/30";
  } else if (highlight) {
    buttonClass += " bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30";
  } else {
    buttonClass += " bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-transparent hover:border-white/10";
  }

  return (
    <button onClick={onClick} className={buttonClass}>
      {icon}
      <span className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none whitespace-nowrap hidden md:block shadow-lg">
        {tooltip}
      </span>
    </button>
  );
}