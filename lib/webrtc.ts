import SimplePeer from 'simple-peer';

export interface PeerConnection {
  userId: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
}

export class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onPeerConnected?: (userId: string, stream: MediaStream) => void;
  private onPeerDisconnected?: (userId: string) => void;
  private onSignalData?: (userId: string, data: any) => void;

  constructor(
    onPeerConnected?: (userId: string, stream: MediaStream) => void,
    onPeerDisconnected?: (userId: string) => void,
    onSignalData?: (userId: string, data: any) => void
  ) {
    this.onPeerConnected = onPeerConnected;
    this.onPeerDisconnected = onPeerDisconnected;
    this.onSignalData = onSignalData;
  }

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Failed to access microphone. Please check your permissions.');
    }
  }

  async createPeerConnection(userId: string, initiator: boolean = false): Promise<void> {
    try {
      const localStream = await this.getLocalStream();
      
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream: localStream
      });

      // Handle incoming signal data
      peer.on('signal', (data) => {
        if (this.onSignalData) {
          this.onSignalData(userId, data);
        }
      });

      // Handle successful connection
      peer.on('connect', () => {
        console.log(`Connected to peer: ${userId}`);
      });

      // Handle incoming stream
      peer.on('stream', (stream) => {
        console.log(`Received stream from peer: ${userId}`);
        const peerConnection = this.peers.get(userId);
        if (peerConnection) {
          peerConnection.stream = stream;
        }
        if (this.onPeerConnected) {
          this.onPeerConnected(userId, stream);
        }
      });

      // Handle peer disconnection
      peer.on('close', () => {
        console.log(`Peer disconnected: ${userId}`);
        this.removePeer(userId);
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected(userId);
        }
      });

      // Handle errors
      peer.on('error', (error) => {
        console.error(`Peer error for ${userId}:`, error);
        this.removePeer(userId);
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected(userId);
        }
      });

      this.peers.set(userId, { userId, peer });
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  handleSignalData(userId: string, data: any): void {
    const peerConnection = this.peers.get(userId);
    if (peerConnection) {
      try {
        peerConnection.peer.signal(data);
      } catch (error) {
        console.error(`Error handling signal data for ${userId}:`, error);
      }
    }
  }

  removePeer(userId: string): void {
    const peerConnection = this.peers.get(userId);
    if (peerConnection) {
      try {
        peerConnection.peer.destroy();
      } catch (error) {
        console.error(`Error destroying peer ${userId}:`, error);
      }
      this.peers.delete(userId);
    }
  }

  muteLocalAudio(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  isLocalAudioMuted(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      return audioTracks.length > 0 ? !audioTracks[0].enabled : true;
    }
    return true;
  }

  // Analyze audio levels for speaking detection
  analyzeAudioLevel(callback: (level: number) => void): void {
    if (!this.localStream) return;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(this.localStream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);

      const analyze = () => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        
        const average = sum / bufferLength;
        callback(average);
        
        requestAnimationFrame(analyze);
      };

      analyze();
    } catch (error) {
      console.error('Error analyzing audio level:', error);
    }
  }

  cleanup(): void {
    // Close all peer connections
    this.peers.forEach(peerConnection => {
      try {
        peerConnection.peer.destroy();
      } catch (error) {
        console.error('Error destroying peer:', error);
      }
    });
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  getPeers(): Map<string, PeerConnection> {
    return this.peers;
  }
}
