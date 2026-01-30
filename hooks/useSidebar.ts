'use client'

import { useState } from 'react'

type TabType = 'chat' | 'people' | 'tools'

export const useSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const switchTab = (tab: TabType) => {
    setActiveTab(tab)
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  return {
    activeTab,
    isMobileSidebarOpen,
    switchTab,
    toggleMobileSidebar
  }
}