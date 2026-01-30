# HomeGuruOs - Production Video Conferencing Platform

A complete, production-ready video conferencing platform built with Next.js 14, Stream.io, and modern web technologies.

## 🚀 Features

- **🎥 HD Video Conferencing** - Up to 100 participants with SFU architecture
- **🖥️ Screen Sharing & Recording** - Native screen capture with WebM recording
- **🎨 Collaborative Whiteboard** - Real-time drawing with tldraw + yjs
- **📝 Live Transcription** - Multilingual speech-to-text (10+ languages)
- **⚡ Low-Bandwidth Mode** - Audio-only mode for data saving
- **🔒 Guest Authentication** - No sign-up required, secure token-based access
- **📱 Responsive Design** - Mobile-first, works on all devices
- **🌐 Serverless Architecture** - Fully stateless, scales automatically

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + clsx + tailwind-merge
- **Video Engine**: @stream-io/video-react-sdk (SFU, Simulcast)
- **Whiteboard**: tldraw + yjs + y-webrtc (P2P sync)
- **Icons**: lucide-react
- **Notifications**: sonner
- **Transcription**: Native webkitSpeechRecognition
- **Recording**: Native MediaRecorder API

## 🏗️ Project Structure

```
/app
  /meeting/[id]
    page.tsx       # Meeting orchestrator
  layout.tsx       # Global providers
  page.tsx         # Lobby entry point
  globals.css      # Design system
/actions
  stream.ts        # Server action for tokens
/components
  /ui              # Reusable UI components
  MeetingRoom.tsx  # Video grid wrapper
  ControlBar.tsx   # Meeting controls
  Whiteboard.tsx   # Collaborative drawing
  TranscriptSide.tsx # Live captions
/hooks
  useSpeechToText.ts # Speech recognition
/constants
  locales.ts       # Language definitions
```

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository>
cd homeguruos-video-platform
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Add your Stream.io credentials:

```env
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
```

### 3. Get Stream.io API Keys

1. Visit [getstream.io](https://getstream.io)
2. Create a free account
3. Create a new app
4. Copy API Key and Secret from dashboard

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Core Features Guide

### Video Conferencing
- **Join**: Enter name + room ID (auto-generated if empty)
- **Controls**: Mic, camera, screen share, low-data mode
- **Grid**: Responsive layout (1-4 participants optimized)

### Collaborative Whiteboard
- **Access**: Click pen tool in control bar
- **Sync**: Real-time P2P synchronization via WebRTC
- **Tools**: Drawing, erasing, text, shapes

### Live Transcription
- **Languages**: 10+ supported (English, Hindi, Spanish, etc.)
- **Auto-restart**: Continues on silence/interruption
- **Export**: Download as .txt file

### Low-Data Mode
- **Toggle**: ⚡ button in control bar
- **Effect**: Disables all video (incoming/outgoing)
- **Savings**: ~90% bandwidth reduction

### Screen Recording
- **Start**: Circle button in control bar
- **Format**: WebM with VP9 codec
- **Download**: Auto-saves on stop

## 🔧 Configuration

### Tailwind Config
Custom design system with:
- Primary: Indigo-600 (#4f46e5)
- Background: Slate-950
- Glass panels with backdrop blur

### Stream.io Settings
- Token expiry: 3 hours
- Call type: 'default'
- Auto-create rooms: enabled

## 📱 Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Video + audio (no screen recording)
- **Safari**: Basic support (iOS limitations)

### Required Permissions
- Camera access
- Microphone access
- Display capture (for screen sharing)

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Environment Variables
Set in deployment platform:
- `NEXT_PUBLIC_STREAM_API_KEY`
- `STREAM_SECRET_KEY`

## 🔒 Security Features

- **Token-based auth**: Secure Stream.io tokens (3hr expiry)
- **No data persistence**: Stateless architecture
- **Guest-friendly**: No account creation required
- **P2P whiteboard**: Direct peer connections

## 🎨 Design Philosophy

**"Click & Connect"** - Zero friction video conferencing:
- No sign-ups or downloads
- Professional UI with glassmorphism
- Mobile-first responsive design
- Accessible color contrast

## 📊 Performance

- **Bundle size**: Optimized with dynamic imports
- **Video quality**: Adaptive bitrate (SFU)
- **Latency**: <100ms with proper infrastructure
- **Scalability**: Serverless, auto-scaling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Docs**: Stream.io documentation
- **Community**: Discord/Slack channels

---

**Built with ❤️ by HomeGuruOs Team**