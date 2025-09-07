# StreamTalk
> Transform one-way livestreams into dynamic, two-way audio conversations

[![Built with Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-orange)](https://firebase.google.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Audio-blue)](https://webrtc.org/)

StreamTalk enables streamers to give their viewers a voice through real-time audio interaction. Works with any streaming platform - TikTok, Instagram, YouTube, Twitch.

## ✨ Key Features

- **🎙️ Real-Time Audio**: Ultra-low latency WebRTC peer-to-peer connections
- **📋 Smart Queue System**: Intelligent viewer management with priority controls
- **🔐 Secure Authentication**: Email-based auth with Firebase
- **📱 Mobile Optimized**: Responsive design that works everywhere
- **🔧 Easy Integration**: Works alongside your existing streaming setup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project ([Create one here](https://console.firebase.google.com/))

### Installation

```bash
# Clone repository
git clone https://github.com/Uuuuu77/streamtalk.git
cd streamtalk

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Run development server
npm run dev
```

### Firebase Setup

1. Create a Firebase project
2. Enable **Authentication** → Email/Password
3. Create **Firestore Database** 
4. Copy config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 🎯 How It Works

### For Streamers
1. **Create Session** → Start hosting and get a shareable link
2. **Share Link** → Give your audience the session ID or URL
3. **Manage Queue** → Select viewers to speak, control timing
4. **Interact Live** → Real-time audio conversation with your audience

### For Viewers  
1. **Join Session** → Enter session ID or click streamer's link
2. **Join Queue** → Request to speak and see your position
3. **Get Selected** → Speak directly with streamer and audience
4. **Engage** → Participate in dynamic conversations

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15.2.4, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **Backend** | Firebase (Auth, Firestore) |
| **Audio** | WebRTC, simple-peer |
| **Deployment** | Vercel |

## 📁 Project Structure

```
/app                    # Next.js app router
  /api                  # API routes
  /join                 # Session joining
  /streamer             # Host dashboard
  /viewer               # Viewer interface
/components             # React components
  /auth                 # Authentication
  /ui                   # UI library
/lib                    # Core services
  firebase.ts           # Firebase config
  firestore.ts          # Database service  
  webrtc.ts            # Audio service
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

## 🔧 Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
  }
}
```

## 📱 Mobile Support

StreamTalk is fully optimized for mobile devices with:
- Touch-friendly 44px minimum button sizes
- Safe area support for notched devices
- Responsive grid layouts
- Mobile-first design approach

## 🐛 Troubleshooting

**Authentication Issues**
- Verify Firebase config in `.env.local`
- Check if Email/Password provider is enabled

**Audio Not Working**
- Ensure microphone permissions are granted
- Test in different browsers (Chrome recommended)

**Connection Problems**
- Check Firestore security rules
- Verify Firebase project is active

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the streaming community**

[Live Demo](https://streamtalk-dp82bxg7r-john-njugunas-projects.vercel.app) • [Report Bug](https://github.com/Uuuuu77/streamtalk/issues) • [Request Feature](https://github.com/Uuuuu77/streamtalk/issues)