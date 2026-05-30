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
  Volume2,
} from "lucide-react";
import {
  ActiveVideoCall,
  Conversation,
  IncomingVideoCall,
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

  // Responsive dynamic grid for group layout
  const gridCols =
    remoteStreamsList.length <= 1
      ? "grid-cols-1 max-w-3xl"
      : remoteStreamsList.length <= 3
      ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
      : remoteStreamsList.length <= 5
      ? "grid-cols-2 lg:grid-cols-3 max-w-6xl"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl";

  const renderLocalPreview = () => {
    if (isAudioCall) {
      return (
        <div className="absolute bottom-6 right-6 z-20 flex w-52 items-center gap-3.5 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ring-2 ${
            isMicrophoneEnabled 
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" 
              : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
          }`}>
            {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">Bạn</p>
            <p className="text-[10px] text-slate-400">
              {isMicrophoneEnabled ? "Đang nói" : "Đã tắt mic"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="absolute bottom-6 right-6 z-20 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl backdrop-blur-md ring-1 ring-white/5 transition-all duration-300 hover:scale-105 w-28 sm:w-36 md:w-44 lg:w-48 aspect-video"
      >
        <LocalVideo
          stream={localStream}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {(!localStream || !isCameraEnabled) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-[10px] text-slate-400">
            <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-500">
              <CameraOff size={13} />
            </div>
            <span>Camera tắt</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
          Bạn
        </div>
      </div>
    );
  };

  const currentCallTypeLabel = incomingCallTypeLabel === "am thanh" ? "audio" : activeCallTypeLabel;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden text-white bg-slate-950 font-sans">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.1),transparent_50%),radial-gradient(circle_at_50%_10%,rgba(244,63,94,0.05),transparent_40%)]" />
      
      {/* Top Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[350px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <Users size={18} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
                  {currentCallTypeLabel === "audio" ? "Thoại" : "Video"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                  {callStatusLabel}
                </span>
              </div>
              <h2 className="truncate text-sm font-semibold leading-tight text-slate-100 sm:text-base mt-0.5">
                {callTitle}
              </h2>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đang kết nối</span>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {callError && (
          <div className="mx-6 mt-4 shrink-0 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2">
                <span className="font-semibold text-rose-400">Lỗi:</span>
                <p className="flex-1 leading-relaxed">{callError}</p>
              </div>
              {onClearCallError && (
                <button
                  type="button"
                  onClick={onClearCallError}
                  className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {onRetryMediaPermission && (
              <button
                type="button"
                onClick={() => void onRetryMediaPermission()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-300/35 bg-rose-500/20 px-3 py-1.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/30 active:scale-95 transition"
              >
                <RefreshCw size={11} className="animate-spin-slow" /> Xin cấp lại quyền truy cập thiết bị
              </button>
            )}
          </div>
        )}

        {/* ── Main area ── */}
        {incomingCall && callStatus === ("receiving" as VideoCallStatus) ? (
          /* Incoming call screen */
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center backdrop-blur-xl shadow-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-300">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 ring-4 ring-indigo-500/20 shadow-lg animate-bounce">
                {incomingCall?.callType === "audio" ? (
                  <Phone size={32} className="text-indigo-400" />
                ) : (
                  <Video size={32} className="text-indigo-400" />
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Cuộc gọi đến
              </span>
              <h3 className="mt-3 text-xl font-bold text-white tracking-tight">
                {incomingCallerName}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Đang gọi {incomingCallTypeLabel === "am thanh" ? "âm thanh" : "video"} cho bạn...
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onDeclineIncomingCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/25 transition duration-300 hover:bg-rose-600 hover:scale-105 active:scale-95"
                  title="Từ chối"
                >
                  <PhoneOff size={22} />
                </button>
                <button
                  type="button"
                  onClick={onAcceptIncomingCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:bg-emerald-600 hover:scale-105 active:scale-95"
                  title="Chấp nhận"
                >
                  <Phone size={22} className="animate-wiggle" />
                </button>
              </div>
            </div>
          </div>
        ) : isAudioCall ? (
          /* ── Audio Layout: premium minimal layout ── */
          <div className="relative min-h-0 flex-1 overflow-hidden flex flex-col justify-center items-center">
            <div className="flex flex-col items-center gap-6 text-center z-10">
              {/* Outer pulsing ring */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20 animate-ping duration-1000" />
                <div className="absolute -inset-4 rounded-full bg-indigo-500/5 ring-1 ring-indigo-500/10 animate-pulse" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-2xl">
                  <Users size={44} className="text-indigo-400" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-100 tracking-tight">
                  {conversation?.name || callTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-center">
                  <Volume2 size={13} className="text-indigo-400 animate-pulse" />
                  Cuộc gọi thoại đang hoạt động
                </p>
              </div>
            </div>

            {remoteStreamsList.length > 0 ? (
              <>
                {/* Invisible audio elements */}
                {remoteStreamsList.map(([userId, stream]) => (
                  <RemoteAudio key={userId} stream={stream} />
                ))}
                
                {/* Visual grid of audio members */}
                <div className="absolute inset-x-0 bottom-28 flex justify-center gap-3 px-6 flex-wrap z-10 max-w-xl mx-auto">
                  {remoteStreamsList.map(([userId]) => (
                    <div
                      key={userId}
                      className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-900/60 pl-3 pr-4 py-2.5 text-xs text-slate-200 backdrop-blur-md shadow-lg ring-1 ring-white/5 hover:bg-slate-900/80 transition"
                    >
                      <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="font-medium">
                        {userId.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="absolute inset-x-0 bottom-28 flex justify-center z-10">
                <p className="text-xs text-slate-500">Đang đợi người khác tham gia...</p>
              </div>
            )}

            {renderLocalPreview()}
          </div>
        ) : isOneOnOne ? (
          /* ── 1-1 Layout: remote fills full space, local is PiP ── */
          <div className="relative min-h-0 flex-1 flex items-center justify-center bg-slate-950">
            {remoteStreamsList.length > 0 ? (
              (() => {
                const [userId, stream] = remoteStreamsList[0]!;

                const hasVideo = stream.getVideoTracks().some(track => track.enabled);
                const hasAudio = stream.getAudioTracks().length > 0;

                if (!hasVideo && hasAudio) {
                  return (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-2xl">
                        <Users size={36} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">
                          {userId.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Camera tắt · Đang nghe</p>
                      </div>
                      <RemoteAudio key={userId} stream={stream} />
                    </div>
                  );
                }

                return (
                  <div className="absolute inset-0 h-full w-full overflow-hidden flex items-center justify-center bg-slate-950">
                    {/* Blurred background copy for premium feel */}
                    <RemoteVideo
                      key={`${userId}-blur`}
                      stream={stream}
                      autoPlay
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover opacity-30 blur-2xl scale-110 pointer-events-none"
                    />
                    {/* Main sharp video fitted correctly */}
                    <RemoteVideo
                      key={userId}
                      stream={stream}
                      autoPlay
                      playsInline
                      className="relative z-10 max-h-full max-w-full object-contain shadow-2xl"
                    />
                    {/* Shadow overlay to make controls/text pop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none z-10" />
                  </div>
                );
              })()
            ) : (
              /* Waiting placeholder */
              <div className="flex flex-col items-center justify-center gap-4 text-slate-300 animate-in fade-in duration-700">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/5 ring-1 ring-indigo-500/10 shadow-lg">
                  <Users size={36} className="text-indigo-400/50 animate-pulse" />
                </div>
                <p className="text-xs tracking-wider text-slate-400 font-medium">
                  Đang đợi kết nối cuộc gọi...
                </p>
              </div>
            )}

            {renderLocalPreview()}
          </div>
        ) : (
          /* ── Group Layout: dynamic Zoom/Teams style grid ── */
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 flex items-center justify-center">
            <div
              className={`grid ${gridCols} w-full gap-4 items-center justify-center`}
              style={{ minHeight: 0 }}
            >
              {/* Remote tiles */}
              {remoteStreamsList.map(([userId, stream]) => {
                const hasVideo = stream.getVideoTracks().some(track => track.enabled);
                return (
                  <div
                    key={userId}
                    className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 ring-1 ring-white/10 shadow-xl group aspect-video transition-all duration-300 hover:ring-indigo-500/50"
                  >
                    {hasVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                        {/* Blurred ambient background */}
                        <RemoteVideo
                          key={`${userId}-blur`}
                          stream={stream}
                          autoPlay
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover opacity-25 blur-xl scale-110 pointer-events-none"
                        />
                        {/* Crisp fitted remote video */}
                        <RemoteVideo
                          key={userId}
                          stream={stream}
                          autoPlay
                          playsInline
                          className="relative z-10 max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white/90">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-lg text-indigo-400">
                            <Users size={22} />
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium tracking-wide">CAMERA TẮT</p>
                        </div>
                        <RemoteAudio key={userId} stream={stream} />
                      </div>
                    )}
                    
                    {/* Dark gradient overlay on bottom of tile */}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur-md border border-white/5">
                      {userId.slice(-6).toUpperCase()}
                    </div>
                  </div>
                );
              })}

              {/* Local tile in grid */}
              <div
                className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 ring-1 ring-white/10 shadow-xl group aspect-video transition-all duration-300 hover:ring-indigo-500/50"
              >
                {isAudioCall ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white/90">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-lg text-indigo-400">
                        <Users size={22} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium tracking-wide">Bạn</p>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-xs text-slate-400">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-white/10 text-slate-500">
                      <CameraOff size={16} />
                    </div>
                    <span>Camera tắt</span>
                  </div>
                )}
                
                {/* Dark gradient overlay on bottom of tile */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur-md border border-white/5">
                  Bạn
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Controls bar ── */}
        <div className="shrink-0 px-6 pb-6 pt-2 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="flex items-center justify-center gap-3 max-w-lg mx-auto rounded-3xl border border-white/5 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
            {/* Mic Button */}
            <button
              type="button"
              onClick={onToggleMicrophone}
              disabled={!localStream}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                isMicrophoneEnabled
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "border-rose-500/30 bg-rose-500/20 text-rose-400 hover:bg-rose-500/35"
              }`}
              title={isMicrophoneEnabled ? "Tắt micro" : "Bật micro"}
            >
              {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {!isAudioCall && (
              <>
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={onToggleCamera}
                  disabled={!localStream}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                    isCameraEnabled
                      ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                      : "border-rose-500/30 bg-rose-500/20 text-rose-400 hover:bg-rose-500/35"
                  }`}
                  title={isCameraEnabled ? "Tắt camera" : "Bật camera"}
                >
                  {isCameraEnabled ? (
                    <Camera size={18} />
                  ) : (
                    <CameraOff size={18} />
                  )}
                </button>

                {/* Screen Share Button */}
                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  disabled={!localStream}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                    isScreenSharing
                      ? "border-sky-500/30 bg-sky-500/25 text-sky-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                  title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                >
                  <Share2 size={18} />
                </button>
              </>
            )}

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* End Call Button */}
            {(activeCall || callStatus !== "idle") && (
              <button
                type="button"
                onClick={() => onEndVideoCall?.()}
                className="flex h-12 items-center gap-2 rounded-2xl bg-rose-600 px-6 font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 active:scale-95 transition-all duration-300"
              >
                <PhoneOff size={16} />
                <span className="text-xs uppercase tracking-wider">Kết thúc</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
