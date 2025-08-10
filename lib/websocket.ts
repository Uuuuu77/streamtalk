export class WebSocketService {
  private ws: WebSocket | null = null
  private sessionId: string
  private viewerId: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(sessionId: string, viewerId: string) {
    this.sessionId = sessionId
    this.viewerId = viewerId
  }

  connect() {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws`

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("WebSocket connected")
      this.reconnectAttempts = 0

      // Join session room
      this.send({
        type: "join-session",
        sessionId: this.sessionId,
        viewerId: this.viewerId,
      })

      this.onConnectionChange?.("connected")
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error)
      }
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      this.onConnectionChange?.("disconnected")
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      this.onConnectionChange?.("error")
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "queue-updated":
        this.onQueueUpdate?.(message.data)
        break
      case "viewer-selected":
        this.onViewerSelected?.(message.data)
        break
      case "speaking-ended":
        this.onSpeakingEnded?.(message.data)
        break
      case "session-ended":
        this.onSessionEnded?.()
        break
      case "webrtc-offer":
        this.onWebRTCOffer?.(message.data)
        break
      case "webrtc-answer":
        this.onWebRTCAnswer?.(message.data)
        break
      case "ice-candidate":
        this.onIceCandidate?.(message.data)
        break
      default:
        console.log("Unknown message type:", message.type)
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket not connected, message not sent:", message)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000 // Exponential backoff

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, delay)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Event handlers
  onConnectionChange?: (state: "connected" | "disconnected" | "error") => void
  onQueueUpdate?: (data: any) => void
  onViewerSelected?: (data: any) => void
  onSpeakingEnded?: (data: any) => void
  onSessionEnded?: () => void
  onWebRTCOffer?: (data: any) => void
  onWebRTCAnswer?: (data: any) => void
  onIceCandidate?: (data: any) => void
}
