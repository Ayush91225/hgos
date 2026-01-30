'use client'

import { Icon } from '@iconify/react'

interface VideoStageProps {
  stageVideoRef: React.RefObject<HTMLVideoElement>
  stageImageRef: React.RefObject<HTMLImageElement>
  currentPinnedType: string | null
  onUnpin: () => void
}

export default function VideoStage({ 
  stageVideoRef, 
  stageImageRef, 
  currentPinnedType, 
  onUnpin 
}: VideoStageProps) {
  return (
    <div className="flex-1 rounded-xl border border-white/5 overflow-hidden relative group bg-[#080808] flex flex-col justify-center items-center transition-all">
      
      <video 
        ref={stageVideoRef}
        autoPlay 
        playsInline 
        className={`absolute inset-0 w-full h-full object-contain z-10 ${
          currentPinnedType ? 'block' : 'hidden'
        }`}
      />
      
      <img 
        ref={stageImageRef}
        className={`absolute inset-0 w-full h-full object-contain z-10 bg-black ${
          currentPinnedType === 'image' ? 'block' : 'hidden'
        }`}
        alt="Pinned content"
      />

      {currentPinnedType && (
        <button 
          onClick={onUnpin}
          className="absolute top-4 left-4 z-50 glass-panel px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <Icon icon="solar:pin-bold" className="text-emerald-500" />
          Unpin Content
        </button>
      )}

      {!currentPinnedType && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 transition-opacity">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
            <Icon icon="solar:presentation-graph-linear" width={40} className="text-neutral-500" />
          </div>
          <h3 className="text-sm text-neutral-400 font-medium">Dr. Miller is sharing screen</h3>
        </div>
      )}

      {!currentPinnedType && (
        <div className="absolute top-4 left-4 glass-panel px-2 py-1.5 rounded-lg flex flex-col gap-1 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors" title="Pen">
            <Icon icon="solar:pen-linear" width={16} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors" title="Eraser">
            <Icon icon="solar:eraser-linear" width={16} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors" title="Text">
            <Icon icon="solar:text-square-linear" width={16} />
          </button>
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
          <Icon icon="solar:signal-linear" className="text-emerald-500" width={14} />
          <span className="text-[10px] font-medium text-neutral-400">HD • 45ms</span>
        </div>
      </div>
    </div>
  )
}