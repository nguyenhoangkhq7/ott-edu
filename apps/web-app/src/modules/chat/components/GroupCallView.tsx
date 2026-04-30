"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  const remoteGridColsClass =
    remoteStreamsList.length === 0
      ? ""
      : remoteStreamsList.length === 1
        ? "grid-cols-1"
        : remoteStreamsList.length <= 4
          ? "grid-cols-2"
          : "grid-cols-3";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) {
      return;
    }

    const videoElement = localVideoRef.current;
    videoElement.srcObject = localStream;

    const playLocalVideo = () => {
      void videoElement.play().catch(() => {
        // Autoplay can still be blocked until the user interacts.
      });
    };

    if (videoElement.readyState >= 1) {
      playLocalVideo();
    } else {
      videoElement.onloadedmetadata = playLocalVideo;
    }

    return () => {
      videoElement.onloadedmetadata = null;
    };
  }, [localStream]);

  useEffect(() => {
    setRemoteStreamsList(Array.from(remoteStreams.entries()));
  }, [remoteStreams]);

  useEffect(() => {
    remoteStreamsList.forEach(([userId, stream]) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (!videoElement) {
        return;
      }

      videoElement.srcObject = stream;

      const playRemoteVideo = () => {
        void videoElement.play().catch(() => {
          // Autoplay can still be blocked until the user interacts.
        });
      };

      if (videoElement.readyState >= 1) {
        playRemoteVideo();
      } else {
        videoElement.onloadedmetadata = playRemoteVideo;
      }
    });

    return () => {
      remoteVideoRefs.current.forEach((videoElement) => {
        videoElement.onloadedmetadata = null;
      });
    };
  }, [remoteStreamsList]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-9999 flex h-screen w-screen flex-col bg-black text-white">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-400" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">{conversationName}</h2>
            <p className="text-sm text-gray-400">
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onEndCall}
          className="rounded-lg p-2 transition-colors hover:bg-gray-800"
          title="Exit call"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={`grid flex-1 gap-2 overflow-auto bg-black p-4 ${remoteGridColsClass || "grid-cols-1"}`}>
          {remoteStreamsList.length === 0 ? (
            <div className="col-span-full flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-gray-400">Waiting for other participants...</p>
              </div>
            </div>
          ) : (
            remoteStreamsList.map(([userId, stream]) => (
              <div key={userId} className="group relative aspect-video overflow-hidden rounded-lg bg-gray-900">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideoRefs.current.set(userId, el);
                    } else {
                      remoteVideoRefs.current.delete(userId);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs">
                  {userId}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-20 right-4 h-36 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!isCameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-xs">
            You
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-gray-700 bg-gray-900 px-4 py-4">
        <button
          onClick={onToggleMicrophone}
          className={`rounded-full p-3 transition-all ${
            isMicrophoneEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
          title={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`rounded-full p-3 transition-all ${
            isCameraEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
          title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={onEndCall}
          disabled={isLoading}
          className="rounded-full bg-red-600 p-3 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="End call"
        >
          <Phone className="h-5 w-5" style={{ transform: "rotate(225deg)" }} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
