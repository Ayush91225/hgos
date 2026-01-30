'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const stageVideoRef = useRef<HTMLVideoElement>(null)
  const stageImageRef = useRef<HTMLImageElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Error accessing media devices:', err)
      setIsCamOn(false)
      setIsMicOn(false)
    }
  }, [])

  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      if (audioTracks.length > 0) {
        const newMicState = !isMicOn
        audioTracks[0].enabled = newMicState
        setIsMicOn(newMicState)
      }
    }
  }, [localStream, isMicOn])

  const toggleCam = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      if (videoTracks.length > 0) {
        const newCamState = !isCamOn
        videoTracks[0].enabled = newCamState
        setIsCamOn(newCamState)
      }
    }
  }, [localStream, isCamOn])

  const toggleScreenShare = useCallback(async () => {
    if (!isSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as any,
          audio: true
        })
        setScreenStream(stream)
        setIsSharing(true)

        if (stageVideoRef.current) {
          stageVideoRef.current.srcObject = stream
          stageVideoRef.current.classList.remove('mirror-mode')
        }

        stream.getVideoTracks()[0].onended = () => {
          stopSharing()
        }
      } catch (err) {
        console.error('Error sharing screen:', err)
      }
    } else {
      stopSharing()
    }
  }, [isSharing])

  const stopSharing = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    setIsSharing(false)
    if (stageVideoRef.current) {
      stageVideoRef.current.srcObject = null
    }
  }, [screenStream])

  const pinLocalUser = useCallback(() => {
    if (localStream && stageVideoRef.current) {
      stageVideoRef.current.srcObject = localStream
      stageVideoRef.current.classList.add('mirror-mode')
    }
  }, [localStream])

  const pinImage = useCallback((url: string) => {
    if (stageImageRef.current) {
      stageImageRef.current.src = url
      if (stageVideoRef.current) {
        stageVideoRef.current.srcObject = null
      }
    }
  }, [])

  const unpinContent = useCallback(() => {
    if (stageVideoRef.current) {
      stageVideoRef.current.srcObject = null
    }
    if (stageImageRef.current) {
      stageImageRef.current.src = ''
    }
  }, [])

  useEffect(() => {
    startCamera()

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    localStream,
    screenStream,
    isMicOn,
    isCamOn,
    isSharing,
    localVideoRef,
    stageVideoRef,
    stageImageRef,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    stopSharing,
    pinLocalUser,
    pinImage,
    unpinContent
  }
}