'use client'

import { useState, useRef, useCallback } from 'react'

type PinnedType = 'local' | 'screen' | 'image' | null

export const usePinning = () => {
  const [currentPinnedType, setCurrentPinnedType] = useState<PinnedType>(null)
  const stageVideoRef = useRef<HTMLVideoElement>(null)
  const stageImageRef = useRef<HTMLImageElement>(null)

  const pinStream = useCallback((stream: MediaStream, mirror: boolean = false) => {
    if (stageVideoRef.current) {
      stageVideoRef.current.srcObject = stream
      if (mirror) {
        stageVideoRef.current.classList.add('mirror-mode')
      } else {
        stageVideoRef.current.classList.remove('mirror-mode')
      }
    }
  }, [])

  const pinImage = useCallback((url: string) => {
    if (stageImageRef.current) {
      stageImageRef.current.src = url
    }
    setCurrentPinnedType('image')
  }, [])

  const pinLocalUser = useCallback((stream: MediaStream | null) => {
    if (stream) {
      pinStream(stream, true)
      setCurrentPinnedType('local')
    }
  }, [pinStream])

  const pinScreenShare = useCallback((stream: MediaStream | null) => {
    if (stream) {
      pinStream(stream, false)
      setCurrentPinnedType('screen')
    }
  }, [pinStream])

  const unpinContent = useCallback(() => {
    if (stageVideoRef.current) {
      stageVideoRef.current.srcObject = null
    }
    if (stageImageRef.current) {
      stageImageRef.current.src = ''
    }
    setCurrentPinnedType(null)
  }, [])

  return {
    currentPinnedType,
    stageVideoRef,
    stageImageRef,
    pinImage,
    pinLocalUser,
    pinScreenShare,
    unpinContent
  }
}