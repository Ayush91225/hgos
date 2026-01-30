'use client'

import { Icon } from '@iconify/react'

interface ParticipantVideoProps {
  videoRef?: React.RefObject<HTMLVideoElement>
  name: string
  imageUrl?: string
  isLocal?: boolean
  isMicOn?: boolean
  showMicStatus?: boolean
  showHandRaised?: boolean
  showCameraOff?: boolean
  onPin?: () => void
}

export default function ParticipantVideo({
  videoRef,
  name,
  imageUrl,
  isLocal = false,
  isMicOn = true,
  showMicStatus = false,
  showHandRaised = false,
  showCameraOff = false,
  onPin
}: ParticipantVideoProps) {
  return (
    <div className="aspect-video h-full rounded-lg bg-neutral-900 border border-white/10 relative overflow-hidden flex-shrink-0 group hover:border-white/30 transition-colors">
      
      {videoRef && !showCameraOff && (
        <video 
          ref={videoRef}
          autoPlay 
          muted={isLocal}
          playsInline 
          className={`w-full h-full bg-black ${isLocal ? 'mirror-mode' : ''}`}
        />
      )}
      
      {imageUrl && !showCameraOff && (
        <img 
          src={imageUrl}
          className="w-full h-full object-cover opacity-80" 
          alt={name}
        />
      )}

      {!imageUrl && !videoRef && !showCameraOff && (
        <div className="w-full h-full flex items-center justify-center bg-[#111]">
          <span className="text-xs font-medium text-neutral-500 tracking-tight">
            {name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
      )}
      
      {showCameraOff && (
        <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
            <Icon icon="solar:user-linear" className="text-neutral-500" />
          </div>
        </div>
      )}

      {showHandRaised && (
        <div className="absolute top-2 right-2 bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[9px] border border-blue-500/20 flex items-center gap-1">
          <Icon icon="solar:hand-shake-linear" />
          Hand Up
        </div>
      )}

      {onPin && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <button 
            onClick={onPin}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform" 
            title={`Pin ${name}`}
          >
            <Icon icon="solar:pin-linear" width={18} />
          </button>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-2 video-overlay flex justify-between items-end z-10">
        <span className="text-[10px] font-medium text-white/90">{name}</span>
        <div className="flex gap-1 items-end">
          {showMicStatus && isMicOn && (
            <Icon icon="solar:microphone-3-linear" className="text-emerald-400 text-xs" />
          )}
          {showMicStatus && !isMicOn && (
            <Icon icon="solar:microphone-off-linear" className="text-red-400 text-xs" />
          )}
          {!showMicStatus && !isMicOn && (
            <Icon icon="solar:microphone-off-linear" className="text-red-400 text-xs" />
          )}
          {name === 'David Kim' && (
            <div className="flex gap-0.5 items-end h-2.5">
              <div className="w-0.5 bg-emerald-400 h-1.5 animate-pulse"></div>
              <div className="w-0.5 bg-emerald-400 h-2.5 animate-pulse"></div>
              <div className="w-0.5 bg-emerald-400 h-1 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}