"use client";

import { useState } from "react";
import { Video } from "lucide-react";
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
      className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      title={socket ? "Start group call" : "Connecting..."}
    >
      <Video size={20} />
    </button>
  );
}
