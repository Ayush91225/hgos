'use client'

import { Icon } from '@iconify/react'
import { useClock } from '@/hooks/useClock'

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export default function Header({ onToggleMobileSidebar }: HeaderProps) {
  const time = useClock()

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 z-20 bg-[#050505] shrink-0">
      <div className="flex items-center gap-6">
        <div className="font-semibold tracking-tighter text-sm flex items-center gap-2.5">
          <img
            src="https://homeguruworld.com/wp-content/uploads/2022/04/Homeguru-Logo-1.png"
            alt="HomeGuru Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-default">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-neutral-400 font-medium">Advanced Physics 101</span>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
        <span className="text-xs font-mono text-neutral-500 tracking-wider">{time}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-neutral-400 hover:text-white"
        >
          <Icon icon="solar:hamburger-menu-linear" width={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop"
            alt="User"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      </div>
    </header>
  )
}