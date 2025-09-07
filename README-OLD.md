# StreamTalk - Interactive Live Streaming Platform

Transform your one-way livestreams into dynamic, two-way audio conversations. Give every viewer a voice with real-time audio interaction.

## 🚀 Features

### Core Functionality
- **Real-Time Audio Communication**: Ultra-low latency WebRTC peer-to-peer audio connections
- **Smart Queue System**: Intelligent viewer queue with random selection and priority management
- **Firebase Integration**: Scalable backend with authentication, real-time database, and hosting
- **Email Authentication**: Secure user authentication with email verification
- **Universal Platform Support**: Works with any streaming platform (TikTok, Instagram, YouTube, Twitch)

### Enhanced Features
- **Live Participant Management**: Real-time viewer joining, queue position updates, and speaker selection
- **Audio Controls**: Microphone muting, volume control, and speaking time limits
- **Session Analytics**: Track viewer count, speaking statistics, and session duration
- **Responsive Design**: Beautiful purple/slate theme that works on all devices
- **WebRTC Signaling**: Firebase-powered signaling for reliable peer connections

## 🛠 Technical Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **Styling**: Tailwind CSS with custom purple/slate design system
- **UI Components**: Radix UI primitives with custom styling
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Real-Time Audio**: WebRTC with simple-peer library
- **State Management**: React Context for authentication
- **Development**: ESLint, TypeScript, PostCSS

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Firebase project (for production)

### 1. Clone and Install
```bash
git clone <repository-url>
cd streamtalk
npm install
```

### 2. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Get your Firebase configuration from Project Settings

### 3. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### For Streamers
1. **Sign Up/Sign In**: Create an account or sign in with email verification
2. **Create Session**: Click "Start Streaming" to create a new interactive session
3. **Share Link**: Share your unique session link with your audience
4. **Manage Queue**: Select viewers from the queue to speak
5. **Control Audio**: Manage speaking time, volume, and queue settings

### For Viewers
1. **Join Session**: Enter a session ID or paste the streamer's link
2. **Grant Permissions**: Allow microphone access when prompted
3. **Join Queue**: Enter your name and join the audio queue
4. **Wait Your Turn**: See your position and estimated wait time
5. **Speak**: When selected, you can speak directly to the streamer and audience

## 🏗 Project Structure

```
/app                    # Next.js app router
  /api                  # API routes (legacy - moving to Firebase)
  /join                 # Session joining pages
  /streamer             # Streamer dashboard pages
  /viewer               # Viewer interface pages
  layout.tsx            # Root layout with AuthProvider
  page.tsx              # Main landing page

/components             # React components
  /auth                 # Authentication components
    AuthForm.tsx        # Sign in/up modal
  /ui                   # UI component library
  StreamTalkEnhanced.tsx # Main application component

/lib                    # Core services and utilities
  auth.tsx              # Firebase authentication context
  firebase.ts           # Firebase configuration
  firestore.ts          # Firestore database service
  webrtc.ts             # WebRTC service with simple-peer
  utils.ts              # Utility functions

/hooks                  # React hooks
  use-toast.ts          # Toast notification hook
  useStreamTalk.ts      # Main app state hook (legacy)

/styles                 # Global styles
/public                 # Static assets
```

## 🔧 Configuration

### Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.hostId || 
         request.auth.uid in resource.data.participantIds);
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
    
    // Participants
    match /participants/{participantId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🌐 API Reference

### Firebase Services

#### `firestoreService`
```typescript
// Create a room
const roomId = await firestoreService.createRoom(roomData);

// Join a room as participant
await firestoreService.addParticipant(roomId, participantData);

// Listen to room updates
const unsubscribe = firestoreService.subscribeToRoom(roomId, (room) => {
  // Handle room updates
});

// Update participant status
await firestoreService.updateParticipant(participantId, { status: 'speaking' });
```

#### `WebRTCService`
```typescript
// Initialize WebRTC service
const webrtc = new WebRTCService(
  onPeerConnected,
  onPeerDisconnected,
  onSignalData
);

// Create peer connection
await webrtc.createPeerConnection(userId, isInitiator);

// Handle signaling data
webrtc.handleSignalData(userId, signalData);

// Manage audio
webrtc.muteLocalAudio(true);
const isMuted = webrtc.isLocalAudioMuted();
```

## 🎨 Customization

### Theme Colors
The application uses a purple/slate color scheme defined in `tailwind.config.ts`:

```typescript
colors: {
  purple: {
    400: '#a855f7',
    500: '#9333ea',
    600: '#7c3aed',
    700: '#6d28d9'
  },
  slate: {
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Variables for Production
Set these in your deployment platform:
- All `NEXT_PUBLIC_FIREBASE_*` variables
- `NEXT_PUBLIC_APP_URL` (your production domain)

## 🐛 Troubleshooting

### Common Issues

**Authentication not working:**
- Check Firebase project configuration
- Verify environment variables
- Ensure email/password provider is enabled

**WebRTC connection fails:**
- Check browser permissions for microphone
- Verify STUN/TURN server configuration
- Test with different browsers

**Firebase connection issues:**
- Verify API keys and project ID
- Check Firestore security rules
- Ensure Firebase project is active

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for the streaming community