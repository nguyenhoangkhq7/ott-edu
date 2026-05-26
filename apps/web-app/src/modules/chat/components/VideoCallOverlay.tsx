"use client";

import React, { useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Share2,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  ActiveVideoCall,
  Conversation,
  IncomingVideoCall,
  MediaCallKind,
  VideoCallStatus,
} from "../types";

interface RemoteVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  stream: MediaStream;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tracksHash = stream.getTracks().map((t) => `${t.id}:${t.readyState}:${t.enabled}`).join(",");

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.srcObject = stream;
    el.muted = true;
    const tryPlay = () => {
      if (!el) return;
      el.play()
        .then(() => {
          el.muted = false;
        })
        .catch((err) => {
          console.warn("[RemoteVideo] Play failed:", err);
        });
    };

    if (el.readyState >= 2) {
      tryPlay();
    } else {
      el.oncanplay = tryPlay;
    }

    return () => {
      el.oncanplay = null;
    };
  }, [stream, tracksHash]);

  return <video ref={videoRef} {...props} />;
};

interface RemoteAudioProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
  stream: MediaStream;
}

const RemoteAudio: React.FC<RemoteAudioProps> = ({ stream, ...props }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksHash = stream.getTracks().map((t) => `${t.id}:${t.readyState}:${t.enabled}`).join(",");

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.srcObject = stream;
    el.muted = true;
    el.play()
      .then(() => {
        try {
          el.muted = false;
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        console.warn("[RemoteAudio] Play failed:", err);
      });
  }, [stream, tracksHash]);

  return <audio ref={audioRef} {...props} />;
};

interface LocalVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  stream: MediaStream | null;
}

const LocalVideo: React.FC<LocalVideoProps> = ({ stream, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.srcObject = stream;
    if (stream) {
      el.play().catch((err) => {
        console.warn("[LocalVideo] Play failed:", err);
      });
    }
  }, [stream]);

  return <video ref={videoRef} {...props} />;
};

interface VideoCallOverlayProps {
  showFullScreenCall: boolean;
  conversation: Conversation | null;
  incomingCall: IncomingVideoCall | null;
  incomingCallerName: string;
  incomingCallTypeLabel: string;
  activeCallTypeLabel: string;
  callStatusLabel: string;
  isAudioCall: boolean;
  localStream: MediaStream | null;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;
  callStatus: VideoCallStatus;
  activeCall: ActiveVideoCall | null;
  remoteStreamsList: [string, MediaStream][];
  callError: string | null;
  onClearCallError?: () => void;
  onRetryMediaPermission?: () => void;
  onDeclineIncomingCall?: () => void;
  onAcceptIncomingCall?: () => void;
  onToggleMicrophone?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onEndVideoCall?: () => void;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  showFullScreenCall,
  conversation,
  incomingCall,
  incomingCallerName,
  incomingCallTypeLabel,
  activeCallTypeLabel,
  callStatusLabel,
  isAudioCall,
  localStream,
  isCameraEnabled,
  isMicrophoneEnabled,
  isScreenSharing,
  callStatus,
  activeCall,
  remoteStreamsList,
  callError,
  onClearCallError,
  onRetryMediaPermission,
  onDeclineIncomingCall,
  onAcceptIncomingCall,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onEndVideoCall,
}) => {
  if (!showFullScreenCall) {
    return null;
  }

  const callTitle = conversation?.name || incomingCallerName || "Cuộc gọi";
  const isOneOnOne = remoteStreamsList.length <= 1;

  // Responsive grid for group: 1→full, 2→2col, 3-4→2col, 5+→3col
  const gridCols =
    remoteStreamsList.length <= 1
      ? "grid-cols-1"
      : remoteStreamsList.length <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  const renderLocalPreview = () => {
    if (isAudioCall) {
      return (
        <div className="absolute bottom-4 right-4 z-20 flex w-44 items-center gap-3 rounded-2xl border border-white/20 bg-black/80 px-3 py-3 shadow-2xl backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <Users size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">Bạn</p>
            <p className="text-[11px] text-white/60">Đang gọi âm thanh</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="absolute bottom-4 right-4 z-20 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl
                      w-28 sm:w-36 md:w-44"
      >
        <LocalVideo
          stream={localStream}
          autoPlay
          muted
          playsInline
          className="aspect-video w-full object-cover"
        />
        {(!localStream || !isCameraEnabled) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-[10px] text-slate-300">
            {isCameraEnabled ? "Đang tải..." : "Camera tắt"}
          </div>
        )}
        <div className="absolute bottom-1 left-2 text-[10px] text-white/70">
          Bạn
        </div>
      </div>
    );
  };

  const currentCallTypeLabel = incomingCallTypeLabel === "am thanh" ? "audio" : activeCallTypeLabel;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(14,116,144,0.15),transparent_50%)]" />

      {/* Content wrapper — takes full height, never overflows */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-widest text-slate-400">
                Cuộc gọi {currentCallTypeLabel === "audio" ? "âm thanh" : "video"}
              </p>
              <h2 className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
                {callTitle}
              </h2>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-slate-400">{callStatusLabel}</p>
          </div>
        </div>

        {/* ── Error banner ── */}
        {callError && (
          <div className="mx-4 mb-2 shrink-0 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 sm:mx-6">
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1">{callError}</p>
              {onClearCallError && (
                <button
                  type="button"
                  onClick={onClearCallError}
                  className="shrink-0 rounded-full p-1 hover:bg-white/10"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {onRetryMediaPermission && (
              <button
                type="button"
                onClick={() => void onRetryMediaPermission()}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-rose-200/40 px-2.5 py-1 text-[11px] font-semibold hover:bg-rose-500/20"
              >
                <RefreshCw size={11} /> Xin quyền lại
              </button>
            )}
          </div>
        )}

        {/* ── Main area — flex-1 with min-h-0 to stay within bounds ── */}
        {incomingCall && callStatus === ("receiving" as VideoCallStatus) ? (
          /* Incoming call screen */
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-8 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 ring-4 ring-emerald-400/30">
                {incomingCall?.callType === "audio" ? (
                  <Phone size={28} className="text-emerald-300" />
                ) : (
                  <Video size={28} className="text-emerald-300" />
                )}
              </div>
              <p className="text-xs uppercase tracking-widest text-emerald-300">
                Cuộc gọi đến
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {incomingCallerName} đang gọi {incomingCallTypeLabel === "am thanh" ? "âm thanh" : incomingCallTypeLabel} cho bạn
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onDeclineIncomingCall}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/80 transition hover:bg-rose-500"
                  title="Từ chối"
                >
                  <PhoneOff size={20} />
                </button>
                <button
                  type="button"
                  onClick={onAcceptIncomingCall}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 transition hover:bg-emerald-300"
                  title="Chấp nhận"
                >
                  <Phone size={20} className="text-emerald-950" />
                </button>
              </div>
            </div>
          </div>
        ) : isAudioCall ? (
          /* ── Audio Layout: compact avatar-based view ── */
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center text-white/90">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <Users size={42} className="text-white/80" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {conversation?.name || callTitle}
                  </p>
                  <p className="text-sm text-white/60">Cuộc gọi âm thanh</p>
                </div>
              </div>
            </div>

            {remoteStreamsList.length > 0 ? (
              <>
                {/* Invisible audio elements to decode and play sound */}
                {remoteStreamsList.map(([userId, stream]) => (
                  <RemoteAudio key={userId} stream={stream} />
                ))}
                <div className="absolute inset-x-0 bottom-28 flex justify-center gap-3 px-4 flex-wrap">
                  {remoteStreamsList.map(([userId]) => (
                    <div
                      key={userId}
                      className="flex h-14 min-w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-xs text-white/90 backdrop-blur-sm"
                    >
                      {userId.slice(-6)}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {renderLocalPreview()}
          </div>
        ) : isOneOnOne ? (
          /* ── 1-1 Layout: remote fills entire area, local is PiP ── */
          <div className="relative min-h-0 flex-1">
            {/* Remote — full bleed */}
            {remoteStreamsList.length > 0 ? (
              (() => {
                const [userId, stream] = remoteStreamsList[0]!;

                const hasVideo = stream.getVideoTracks().length > 0;
                const hasAudio = stream.getAudioTracks().length > 0;

                // If stream has no video but has audio (audio-only call), render an <audio>
                if (!hasVideo && hasAudio) {
                  return (
                    <RemoteAudio
                      key={userId}
                      stream={stream}
                      autoPlay
                      controls={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  );
                }

                return (
                  <RemoteVideo
                    key={userId}
                    stream={stream}
                    autoPlay
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                );
              })()
            ) : (
              /* Waiting placeholder */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                  <Users size={36} className="opacity-40" />
                </div>
                <p className="text-sm tracking-wide text-slate-400">
                  Đang kết nối...
                </p>
              </div>
            )}

            {renderLocalPreview()}
          </div>
        ) : (
          /* ── Group Layout: grid + local tile ── */
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 sm:px-4">
            <div
              className={`grid ${gridCols} auto-rows-fr gap-2 sm:gap-3`}
              style={{ minHeight: 0 }}
            >
              {/* Remote tiles */}
              {remoteStreamsList.map(([userId, stream]) => (
                <div
                  key={userId}
                  className="relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10"
                  style={{ aspectRatio: "16/9" }}
                >
                  {stream.getVideoTracks().length > 0 ? (
                    <RemoteVideo
                      key={userId}
                      stream={stream}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/90">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                          <Users size={20} />
                        </div>
                        <p className="text-[10px] text-white/60">Camera tắt</p>
                      </div>
                      <RemoteAudio key={userId} stream={stream} />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    {userId.slice(-6)}
                  </div>
                </div>
              ))}

              {/* Local tile in grid */}
              <div
                className="relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10"
                style={{ aspectRatio: "16/9" }}
              >
                {isAudioCall ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/90">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                        <Users size={24} />
                      </div>
                      <p className="text-xs text-white/60">Bạn</p>
                    </div>
                  </div>
                ) : (
                    <LocalVideo
                      stream={localStream}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                )}
                {!isAudioCall && (!localStream || !isCameraEnabled) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-xs text-slate-300">
                    {isCameraEnabled ? "Đang tải..." : "Camera tắt"}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                  Bạn
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Controls bar — always at bottom, never overlaps ── */}
        <div className="shrink-0 px-4 pb-safe-bottom">
          <div className="flex items-center justify-center gap-2 py-4 sm:gap-3">
            {/* Mic */}
            <button
              type="button"
              onClick={onToggleMicrophone}
              disabled={!localStream}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${isMicrophoneEnabled
                ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                : "border-rose-400/60 bg-rose-500/30 text-rose-200"
                }`}
              title={isMicrophoneEnabled ? "Tắt micro" : "Bật micro"}
            >
              {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {!isAudioCall && (
              <>
                {/* Camera */}
                <button
                  type="button"
                  onClick={onToggleCamera}
                  disabled={!localStream}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${isCameraEnabled
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                    : "border-rose-400/60 bg-rose-500/30 text-rose-200"
                    }`}
                  title={isCameraEnabled ? "Tắt camera" : "Bật camera"}
                >
                  {isCameraEnabled ? (
                    <Camera size={18} />
                  ) : (
                    <CameraOff size={18} />
                  )}
                </button>

                {/* Screen share */}
                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  disabled={!localStream}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${isScreenSharing
                    ? "border-sky-300/60 bg-sky-500/30 text-sky-200"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                >
                  <Share2 size={18} />
                </button>
              </>
            )}

            {/* End call */}
            {(activeCall || callStatus !== "idle") && (
              <button
                type="button"
                onClick={() => onEndVideoCall?.()}
                className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 font-semibold transition hover:bg-rose-500 active:scale-95"
              >
                <PhoneOff size={16} />
                <span className="text-sm">Kết thúc</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
