# Phase 2: Web App Mediasoup SFU Integration

## Overview

Phase 2 completes the frontend implementation of mediasoup SFU for group video calls in ott-edu platform. This replaces the previous P2P WebRTC implementation with a server-centric SFU architecture that scales better for group calls.

## Changes Made

### 1. **New Dependencies**
- `mediasoup-client@^3.6.87` - Added to `apps/web-app/package.json`

### 2. **New Files Created**

#### `useWebRTCMediasoup.ts` Hook
**Location**: `apps/web-app/src/modules/chat/hooks/useWebRTCMediasoup.ts`

Comprehensive hook for managing mediasoup SFU client lifecycle:
- **Device Management**: Initializes device with server's router RTP capabilities
- **Transports**: Creates send/recv WebRTC transports for each call
- **Producers**: Produces local audio/video tracks to server
- **Consumers**: Consumes and manages remote audio/video streams
- **Room Management**: Handles joinMediaRoom, leaveMediaRoom, peer tracking
- **Control Methods**: 
  - `startGroupCall(conversationId)` - Join a group call
  - `endCall()` - Leave and cleanup
  - `toggleMicrophone()`, `toggleCamera()` - Media control
  - `acceptIncomingCall()`, `declineIncomingCall()` - Call acceptance flow

**Type Definitions**:
```typescript
type UseWebRTCMediasoupReturn = {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  callStatus: VideoCallStatus;
  incomingCall: IncomingVideoCall | null;
  activeCall: ActiveVideoCall | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  callError: string | null;
  retryMediaPermission: () => Promise<void>;
  startGroupCall: (conversationId: string) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endCall: (reason?: string) => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  clearCallError: () => void;
};
```

#### `GroupCallView.tsx` Component
**Location**: `apps/web-app/src/modules/chat/components/GroupCallView.tsx`

Full-screen video call UI with:
- **Remote Video Grid**: Responsive grid (1-4 columns) for participant videos
- **Local PIP**: Picture-in-picture local video in bottom-right
- **Controls**: Microphone, camera, end call buttons
- **Header**: Shows conversation name and participant count
- **Status Indicators**: Camera off overlay, participant labels

Features:
- Automatic grid layout based on number of participants
- Responsive design with Tailwind CSS
- Icons from lucide-react
- Auto-play video elements with proper constraints

#### `GroupCallButton.tsx` Component
**Location**: `apps/web-app/src/modules/chat/components/GroupCallButton.tsx`

Integration component that:
- Wraps `useWebRTCMediasoup` hook
- Displays "Start Call" button
- Shows full-screen `GroupCallView` when call is active
- Manages call state and UI transitions

#### `mediasoupService.ts` Service
**Location**: `apps/web-app/src/modules/chat/services/mediasoupService.ts`

Type-safe Socket.IO event manager for mediasoup signaling:
- Emits: `getRtpCapabilities`, `joinMediaRoom`, `createWebRtcTransport`, `connectTransport`, `produce`, `consume`, `resume`, `leaveMediaRoom`
- Listens: `newProducer`, `mediaPeerLeft`, `consumerInfo`
- Provides `MediasoupSocketManager` interface for type safety

### 3. **Updated Files**

#### `types.ts`
Updated `ActiveVideoCall` interface to support group calls:
```typescript
export interface ActiveVideoCall {
  callId: string;
  conversationId: string;
  peerUserId: string;
  direction: "incoming" | "outgoing" | "group";  // Added "group"
}
```

#### `package.json`
Added `mediasoup-client` dependency for WebRTC SFU client functionality.

## Socket.IO Events

### Client → Server

1. **getRtpCapabilities** - Get router capabilities for device initialization
2. **joinMediaRoom** - Join a group call room
3. **createWebRtcTransport** - Create send/recv transport
4. **connectTransport** - Connect transport with DTLS params
5. **produce** - Produce audio/video track
6. **consume** - Subscribe to remote producer
7. **resume** - Resume paused consumer
8. **leaveMediaRoom** - Leave the call

### Server → Client

1. **newProducer** - Notification of new producer in room (from other peer)
2. **mediaPeerLeft** - Peer left the room
3. **consumerInfo** - Callback with consumer info when consuming succeeds

## Architecture

### Client-Server Flow

```
User clicks "Start Call"
    ↓
Initialize Device (load router capabilities)
    ↓
Join Media Room
    ↓
Create Send Transport → Produce Audio/Video
Create Recv Transport → Ready to consume
    ↓
Listen for newProducer events
    ↓
For each producer: Consume it (subscribe)
    ↓
Display remote streams in grid
    ↓
User ends call → Cleanup & Leave
```

### State Management

- **localStream**: User's audio/video MediaStream
- **remoteStreams**: Map<userId, MediaStream> of other participants
- **callStatus**: "idle" | "connecting" | "connected"
- **isMicrophoneEnabled** / **isCameraEnabled**: Track control state

## Integration Points

### Into ChatLayout

To add group call support to existing chat:

```typescript
// In ChatLayout or ChatWindow component
import GroupCallButton from "./components/GroupCallButton";

// In chat header:
<GroupCallButton
  socket={socket}
  currentUserId={currentUserId}
  conversationId={conversation.id}
  conversationName={conversation.name || "Group Call"}
  participantCount={conversation.participants.length}
/>
```

### Socket Connection

The mediasoup SFU integrates with existing socket.io connection in `ChatLayout`:

```typescript
// Socket already exists and is authenticated
// Just pass it to useWebRTCMediasoup hook
const { startGroupCall, endCall, ... } = useWebRTCMediasoup({
  socket,
  currentUserId,
});
```

## Environment Configuration

Uses existing environment variables from backend:
- `MEDIASOUP_LISTEN_IP` (backend)
- `MEDIASOUP_ANNOUNCED_IP` (backend) - Configure for LAN/production
- `MEDIASOUP_WORKER_COUNT` (backend)
- `MEDIASOUP_RTC_MIN/MAX_PORT` (backend)

Frontend reads from socket connection dynamically.

## Error Handling

- **Media Permission Denied**: Shows error message with retry button
- **Network Issues**: Displays connection error
- **Transport Failures**: Gracefully closes and allows retry
- **Peer Disconnect**: Automatically removes remote stream

## Testing Checklist

- [ ] npm install succeeds with mediasoup-client
- [ ] TypeScript compilation passes
- [ ] Group call button visible in chat UI
- [ ] Click "Start Call" → media permission prompt appears
- [ ] Grant permissions → local video displays in PIP
- [ ] Can toggle microphone/camera
- [ ] Connect second user → remote video appears in grid
- [ ] Verify audio/video transmit and receive both ways
- [ ] End call → UI closes, streams cleanup
- [ ] Reconnect in same room → existing producers consumed

## Next Steps

1. **Install dependencies**: `npm install` in web-app
2. **Build verification**: `npm run build` to check TypeScript
3. **Docker integration**: Build web-app Docker image with mediasoup-client
4. **E2E testing**: Test with actual backend service running
5. **Mobile app**: After web-app verified, implement useWebRTC for React Native
6. **Call history**: Add UI for viewing past group call records

## Notes

- **Backward Compatibility**: Old P2P useWebRTC hook remains untouched; group calls use new mediasoup implementation
- **Single Router Per Conversation**: Each conversation has one mediasoup Router on server, all peers subscribe/publish to it
- **ICE Servers**: Currently uses Google STUN server; production should add TURN for NAT traversal
- **Bitrate Limiting**: Set to 1Mbps min, 1.5Mbps max per connection; adjust in backend config/mediasoup.ts for bandwidth
- **Codec Support**: Audio (Opus 48kHz), Video (VP8 + H264) - compatible with browsers and mobile

## Files Modified/Created Summary

| File | Type | Purpose |
|------|------|---------|
| package.json | Modified | Added mediasoup-client dependency |
| types.ts | Modified | Updated ActiveVideoCall.direction to support "group" |
| useWebRTCMediasoup.ts | Created | Main hook for SFU client management |
| GroupCallView.tsx | Created | Full-screen call UI with video grid |
| GroupCallButton.tsx | Created | Integration component for chat UI |
| mediasoupService.ts | Created | Type-safe Socket.IO event manager |
