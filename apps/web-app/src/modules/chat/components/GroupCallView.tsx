"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Mic, MicOff, Video, VideoOff, X, Users } from "lucide-react";

interface GroupCallViewProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isLoading?: boolean;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  conversationName?: string;
  participantCount?: number;
}

export default function GroupCallView({
  localStream,
  remoteStreams,
  isMicrophoneEnabled,
  isCameraEnabled,
  isLoading = false,
  onToggleMicrophone,
  onToggleCamera,
  onEndCall,
  conversationName = "Group Call",
  participantCount = 0,
}: GroupCallViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [remoteStreamsList, setRemoteStreamsList] = useState<Array<[string, MediaStream]>>([]);

  // Setup local video stream
  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // Setup remote video streams
  useEffect(() => {
    const streamsList = Array.from(remoteStreams.entries());
    setRemoteStreamsList(streamsList);
  }, [remoteStreams]);

  useEffect(() => {
    remoteStreamsList.forEach(([userId, stream]) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreamsList]);

  const remoteGridColsClass =
    remoteStreamsList.length === 0
      ? ""
      : remoteStreamsList.length === 1
        ? "grid-cols-1"
        : remoteStreamsList.length <= 4
          ? "grid-cols-2"
          : "grid-cols-3";

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-400" />
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg">{conversationName}</h2>
            <p className="text-sm text-gray-400">
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onEndCall}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title="Exit call"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Remote streams grid */}
        <div
          className={`flex-1 grid ${remoteGridColsClass} gap-2 p-4 overflow-auto bg-black`}
        >
          {remoteStreamsList.length === 0 ? (
            <div className="flex items-center justify-center col-span-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">Waiting for other participants...</p>
              </div>
            </div>
          ) : (
            remoteStreamsList.map(([userId, _]) => (
              <div
                key={userId}
                className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative group"
              >
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs">
                  {userId}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Local video (Picture-in-Picture) */}
        <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isCameraEnabled && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1 py-0.5 text-xs">
            You
          </div>
        </div>
      </div>

      {/* Controls footer */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-4 flex items-center justify-center gap-3">
        <button
          onClick={onToggleMicrophone}
          className={`p-3 rounded-full transition-all ${
            isMicrophoneEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
          title={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicrophoneEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-3 rounded-full transition-all ${
            isCameraEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
          title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onEndCall}
          disabled={isLoading}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="End call"
        >
          <Phone className="w-5 h-5" style={{ transform: "rotate(225deg)" }} />
        </button>
      </div>
    </div>
  );
}
