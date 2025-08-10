export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private sessionId: string
  private viewerId: string

  constructor(sessionId: string, viewerId: string) {
    this.sessionId = sessionId
    this.viewerId = viewerId
  }

  async initialize() {
    const configuration: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: "ice-candidate",
          candidate: event.candidate,
        })
      }
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      this.onRemoteStream?.(this.remoteStream)
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", this.peerConnection?.connectionState)
      this.onConnectionStateChange?.(this.peerConnection?.connectionState || "closed")
    }
  }

  async requestMicrophone(): Promise<boolean> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      })

      // Add audio track to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!)
        })
      }

      return true
    } catch (error) {
      console.error("Microphone access denied:", error)
      return false
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })

      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error("Failed to create offer:", error)
      return null
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(answer)
    } catch (error) {
      console.error("Failed to handle answer:", error)
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error("Failed to add ICE candidate:", error)
    }
  }

  muteMicrophone(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }

  private async sendSignalingMessage(message: any) {
    // In a real implementation, this would send via WebSocket
    try {
      await fetch("/api/audio/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          viewerId: this.viewerId,
          message,
        }),
      })
    } catch (error) {
      console.error("Failed to send signaling message:", error)
    }
  }

  // Event handlers (to be set by the consumer)
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
}
