"use client"

import { useState, useEffect, useCallback } from "react"
import { WebRTCService } from "@/lib/webrtc"
import { WebSocketService } from "@/lib/websocket"

interface UseStreamTalkProps {
  sessionId: string
  viewerId: string
  role: "streamer" | "viewer"
}

export function useStreamTalk({ sessionId, viewerId, role }: UseStreamTalkProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0)
  const [micEnabled, setMicEnabled] = useState(false)
  const [audioReady, setAudioReady] = useState(false)

  const [websocket] = useState(() => new WebSocketService(sessionId, viewerId))
  
  const [webrtc] = useState(() => new WebRTCService(
    // onPeerConnected
    (userId: string, stream: MediaStream) => {
      console.log('Peer connected:', userId);
      // Handle peer connection
    },
    // onPeerDisconnected  
    (userId: string) => {
      console.log('Peer disconnected:', userId);
      // Handle peer disconnection
    },
    // onSignalData
    (userId: string, data: any) => {
      console.log('Signal data:', userId, data);
      // Handle signal data through websocket
      websocket.send({
        type: 'webrtc-signal',
        targetUserId: userId,
        signalData: data
      });
    }
  ))

  useEffect(() => {
    // Initialize WebSocket
    websocket.onConnectionChange = (state) => {
      setConnectionStatus(state === "connected" ? "connected" : "disconnected")
    }

    websocket.onQueueUpdate = (data) => {
      setIsInQueue(data.isInQueue)
      setQueuePosition(data.position)
    }

    websocket.connect()

    return () => {
      webrtc.cleanup()
      websocket.disconnect()
    }
  }, [websocket, webrtc])

  const enableMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await webrtc.getLocalStream()
      setAudioReady(!!stream)
      return true
    } catch (error) {
      console.error("Failed to enable microphone:", error)
      return false
    }
  }, [webrtc])

  const joinQueue = useCallback(async () => {
    try {
      const stream = await webrtc.getLocalStream()
      if (!stream) {
        throw new Error("Microphone access required")
      }

      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          viewerId,
          viewerName: `Viewer ${viewerId.slice(-4)}`,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsInQueue(true)
        setQueuePosition(data.queueEntry.position)
        setAudioReady(true)
        return data.queueEntry
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to join queue:", error)
      throw error
    }
  }, [sessionId, viewerId, webrtc])

  const leaveQueue = useCallback(async () => {
    try {
      await fetch("/api/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, viewerId }),
      })

      setIsInQueue(false)
      setQueuePosition(null)
      setAudioReady(false)
      webrtc.cleanup()
    } catch (error) {
      console.error("Failed to leave queue:", error)
      throw error
    }
  }, [sessionId, viewerId, webrtc])

  const toggleMicrophone = useCallback(() => {
    if (isSelected) {
      const newState = !micEnabled
      setMicEnabled(newState)
      webrtc.muteLocalAudio(!newState)
    }
  }, [isSelected, micEnabled, webrtc])

  const endSpeaking = useCallback(() => {
    websocket.send({
      type: "end-speaking",
      sessionId,
      viewerId,
    })
  }, [websocket, sessionId, viewerId])

  return {
    connectionStatus,
    isInQueue,
    queuePosition,
    isSelected,
    speakingTimeLeft,
    micEnabled,
    audioReady,
    joinQueue,
    leaveQueue,
    toggleMicrophone,
    endSpeaking,
  }
}
