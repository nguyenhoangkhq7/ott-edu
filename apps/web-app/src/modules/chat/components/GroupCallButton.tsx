"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import useWebRTCMediasoup from "../hooks/useWebRTCMediasoup";
import GroupCallView from "./GroupCallView";
import type { Socket } from "socket.io-client";

interface GroupCallButtonProps {
  socket: Socket | null;
  currentUserId: string;
  conversationId: string;
  conversationName?: string;
  participantCount?: number;
}

export default function GroupCallButton({
  socket,
  currentUserId,
  conversationId,
  conversationName = "Group Call",
  participantCount = 0,
}: GroupCallButtonProps) {
  const [showCallView, setShowCallView] = useState(false);

  const {
    localStream,
    remoteStreams,
    callStatus,
    isMicrophoneEnabled,
    isCameraEnabled,
    callError,
    startGroupCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
  } = useWebRTCMediasoup({
    socket,
    currentUserId,
  });

  const handleStartCall = async () => {
    try {
      await startGroupCall(conversationId);
      setShowCallView(true);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  const handleEndCall = () => {
    endCall();
    setShowCallView(false);
  };

  if (showCallView && callStatus !== "idle") {
    return (
      <GroupCallView
        localStream={localStream}
        remoteStreams={remoteStreams}
        isMicrophoneEnabled={isMicrophoneEnabled}
        isCameraEnabled={isCameraEnabled}
        isLoading={callStatus === "connecting"}
        onToggleMicrophone={toggleMicrophone}
        onToggleCamera={toggleCamera}
        onEndCall={handleEndCall}
        conversationName={conversationName}
        participantCount={participantCount}
      />
    );
  }

  return (
    <button
      onClick={handleStartCall}
      disabled={!socket}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      title={socket ? "Start group call" : "Connecting..."}
    >
      <Phone className="w-4 h-4" />
      Start Call
    </button>
  );
}
