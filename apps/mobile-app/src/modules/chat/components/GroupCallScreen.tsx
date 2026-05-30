/**
 * GroupCallScreen.tsx
 *
 * Màn hình gọi nhóm SFU (Mediasoup).
 * - Grid video nhiều người tự động điều chỉnh layout (1, 2, 3-4, 5+ người).
 * - PIP (Picture-in-Picture) cho local stream ở góc dưới phải.
 * - Thanh điều khiển: Mic, Camera, Đổi Camera, Rời phòng.
 * - Hiển thị userId (hoặc tên) bên dưới mỗi video tile.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Socket } from "socket.io-client";
import type { MediaCallKind } from "../types";
import { useMobileMediasoup, type RemoteParticipant } from "../useMobileMediasoup";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupCallScreenProps {
  /** MongoDB conversationId – cũng là SFU roomId */
  conversationId: string;
  currentUserId: string;
  socket: Socket | null;
  /** Map từ userId → tên hiển thị (optional, fallback là userId ngắn) */
  participantNames?: Record<string, string>;
  conversationType?: "private" | "class" | "group";
  callType?: MediaCallKind;
  initiatorUserId?: string | null;
  /** Signal from parent to force leaving the call */
  leaveSignal?: number;
  /** Callback khi người dùng nhấn nút "Rời phòng" */
  onLeave?: () => void;
}

// ─── RTCView loader ───────────────────────────────────────────────────────────

const ENABLE_WEBRTC = process.env.EXPO_PUBLIC_ENABLE_WEBRTC === "true";

type RTCViewProps = {
  streamURL: string;
  objectFit?: "cover" | "contain";
  mirror?: boolean;
  style?: object;
  zOrder?: number;
};

function loadRTCView(): React.ComponentType<RTCViewProps> | null {
  try {
    const module = require("react-native-webrtc") as typeof import("react-native-webrtc");
    if (ENABLE_WEBRTC) return module.RTCView as React.ComponentType<RTCViewProps>;
    return module.RTCView as React.ComponentType<RTCViewProps>;
  } catch {
    return null;
  }
}

const RTCView = loadRTCView();

// ─── VideoTile ────────────────────────────────────────────────────────────────

interface VideoTileProps {
  streamURL: string | null;
  label: string;
  isMirror?: boolean;
  style?: object;
  isMuted?: boolean;
  isAudioOnly?: boolean;
  isCameraEnabled?: boolean;
}

function VideoTile({ streamURL, label, isMirror, style, isMuted, isAudioOnly, isCameraEnabled = true }: VideoTileProps) {
  // Generate a premium gradient color based on user name
  const gradientColor = useMemo(() => {
    const colors = ["#4f46e5", "#06b6d4", "#0d9488", "#2563eb", "#db2777", "#7c3aed"];
    const charCodeSum = label.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  }, [label]);

  return (
    <View style={[styles.tile, style]}>
      {streamURL && RTCView && !isAudioOnly && isCameraEnabled ? (
        <RTCView
          streamURL={streamURL}
          objectFit="cover"
          mirror={isMirror}
          style={styles.tileVideo}
          zOrder={1}
        />
      ) : (
        <View style={styles.tileVideoPlaceholder}>
          <View style={[styles.tileAvatarCircle, { backgroundColor: gradientColor }]}>
            <Text style={styles.tileAvatarText}>
              {label.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.placeholderLabelText}>Camera tắt</Text>
        </View>
      )}

      {/* Label Row */}
      <View style={styles.tileLabelRow}>
        <View style={styles.activeSpeakerDot} />
        <Text style={styles.tileLabelText} numberOfLines={1}>
          {label}
        </Text>
        {isMuted && (
          <View style={styles.mutedBadge}>
            <Ionicons name="mic-off" size={10} color="#fda4af" />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDanger?: boolean;
  isPrimary?: boolean;
  disabled?: boolean;
}

function ControlButton({
  icon,
  label,
  onPress,
  isActive = true,
  isDanger = false,
  isPrimary = false,
  disabled = false,
}: ControlButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.controlBtnWrapper,
        { opacity: pressed || disabled ? 0.75 : 1 }
      ]}
    >
      <Animated.View
        style={[
          styles.controlBtn,
          isDanger && styles.controlBtnDanger,
          isPrimary && styles.controlBtnPrimary,
          !isActive && styles.controlBtnInactive,
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color="#ffffff"
        />
      </Animated.View>
      <Text style={styles.controlBtnLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Grid layout calculator ───────────────────────────────────────────────────

function calcGridLayout(count: number, screenWidth: number, screenHeight: number) {
  const padding = 12;
  const gap = 10;
  
  if (count <= 1) {
    return { 
      columns: 1, 
      tileWidth: screenWidth - padding * 2, 
      tileHeight: Math.min(screenHeight - 340, 520) 
    };
  }
  if (count === 2) {
    return { 
      columns: 1, 
      tileWidth: screenWidth - padding * 2, 
      tileHeight: (screenHeight - 360) / 2 
    };
  }
  if (count <= 4) {
    return { 
      columns: 2, 
      tileWidth: (screenWidth - padding * 2 - gap) / 2, 
      tileHeight: 220 
    };
  }
  return { 
    columns: 2, 
    tileWidth: (screenWidth - padding * 2 - gap) / 2, 
    tileHeight: 170 
  };
}

// ─── GroupCallScreen ──────────────────────────────────────────────────────────

export function GroupCallScreen({
  conversationId,
  currentUserId,
  socket,
  participantNames = {},
  conversationType = "class",
  callType = "video",
  initiatorUserId = null,
  leaveSignal = 0,
  onLeave,
}: GroupCallScreenProps) {
  const screenWidth = useMemo(() => Dimensions.get("window").width, []);
  const screenHeight = useMemo(() => Dimensions.get("window").height, []);

  const {
    localStream,
    remoteParticipants,
    callStatus,
    isMicrophoneEnabled,
    isCameraEnabled,
    cameraFacing,
    callError,
    joinRoom,
    leaveRoom,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    clearCallError,
  } = useMobileMediasoup({
    socket,
    currentUserId,
    conversationId,
    callType,
    endOnPeerLeave: conversationType === "private",
    isCallInitiator: Boolean(initiatorUserId && initiatorUserId === currentUserId),
  });

  const [hasJoined, setHasJoined] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isLeavingRef = useRef(false);

  // Tự động join khi component mount
  useEffect(() => {
    if (!hasJoined && socket) {
      setHasJoined(true);
      void joinRoom();
    }
  }, [hasJoined, joinRoom, socket]);

  const executeLeave = useCallback(() => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    leaveRoom();
    onLeave?.();
  }, [leaveRoom, onLeave]);

  const handleLeave = useCallback(() => {
    executeLeave();
  }, [executeLeave]);

  useEffect(() => {
    if (!leaveSignal) return;
    executeLeave();
  }, [leaveSignal, executeLeave]);

  useEffect(() => {
    if (!hasJoined) return;
    if (callStatus !== "error") return;
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    onLeave?.();
  }, [callStatus, hasJoined, onLeave]);

  const getDisplayName = useCallback(
    (userId: string) => {
      return participantNames[userId] ?? `Thành viên…${userId.slice(-4)}`;
    },
    [participantNames],
  );

  const localStreamURL = useMemo(() => {
    if (!localStream) return null;
    return (localStream as unknown as import("react-native-webrtc").MediaStream).toURL();
  }, [localStream]);

  const grid = useMemo(
    () => calcGridLayout(remoteParticipants.length, screenWidth, screenHeight),
    [remoteParticipants.length, screenWidth, screenHeight],
  );

  const isJoining = callStatus === "joining";
  const isPrivateCall = conversationType === "private";
  const isOneToOne = remoteParticipants.length <= 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Premium Ambient Background */}
      <View style={styles.backdropTop} pointerEvents="none" />
      <View style={styles.backdropBottom} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {callType === "audio"
              ? (isPrivateCall ? "Cuộc thoại 1-1" : "Cuộc thoại nhóm")
              : (isPrivateCall ? "Cuộc gọi video" : "Cuộc gọi video nhóm")}
          </Text>
          <Text style={styles.headerSubTitle}>
            {remoteParticipants.length + 1} người tham gia
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.headerBadgeText}>
            {callStatus === "connected" ? "Đang gọi" : "Đang nối"}
          </Text>
        </View>
      </View>

      {/* ── Loading / Joining state ── */}
      {isJoining && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.joiningText}>Đang khởi tạo kênh truyền...</Text>
        </View>
      )}

      {/* ── Error banner ── */}
      {callError && (
        <Pressable style={styles.errorBanner} onPress={clearCallError}>
          <View style={styles.errorHeader}>
            <Ionicons name="warning" size={16} color="#fda4af" />
            <Text style={styles.errorBannerText}> Lỗi: {callError}</Text>
          </View>
          <Text style={styles.errorDismiss}>Nhấn để tắt cảnh báo này</Text>
        </Pressable>
      )}

      {/* ── Remote Video Grid ── */}
      <View style={styles.grid}>
        {remoteParticipants.length === 0 && !isJoining ? (
          <View style={styles.emptyGrid}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={44} color="#475569" />
            </View>
            <Text style={styles.emptyGridText}>
              {callStatus === "ready"
                ? "Bạn đã tham gia cuộc gọi.\nĐang đợi các thành viên khác kết nối..."
                : "Đang tải phòng thoại..."}
            </Text>
          </View>
        ) : (
          <View style={styles.gridRow}>
            {remoteParticipants.map((participant: RemoteParticipant) => {
              const streamURL = (
                participant.stream as unknown as import("react-native-webrtc").MediaStream
              ).toURL();
              return (
                <VideoTile
                  key={participant.userId}
                  streamURL={streamURL}
                  label={getDisplayName(participant.userId)}
                  isCameraEnabled={participant.isCameraEnabled}
                  style={{
                    width: grid.tileWidth,
                    height: grid.tileHeight,
                    margin: 5,
                  }}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* ── Local PIP (FaceTime-like Floating Window) ── */}
      {localStreamURL && callType !== "audio" && (
        <View style={styles.pip}>
          {RTCView ? (
            <RTCView
              streamURL={localStreamURL}
              objectFit="cover"
              mirror={cameraFacing === "front"}
              style={styles.pipVideo}
              zOrder={2}
            />
          ) : (
            <View style={styles.pipPlaceholder}>
              <Ionicons name="person" size={24} color="#6366f1" />
            </View>
          )}
          {!isCameraEnabled && (
            <View style={styles.pipCamOff}>
              <Ionicons name="videocam-off" size={22} color="#94a3b8" />
            </View>
          )}
        </View>
      )}

      {/* ── Status indicator ── */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            callStatus === "connected" && styles.statusDotConnected,
            callStatus === "ready" && styles.statusDotReady,
            callStatus === "error" && styles.statusDotError,
          ]}
        />
        <Text style={styles.statusText}>
          {callStatus === "joining" && "Đang thiết lập cổng..."}
          {callStatus === "ready" && "Đã sẵn sàng - Chờ mọi người"}
          {callStatus === "connected" && "Đường truyền bảo mật đã kết nối"}
          {callStatus === "error" && "Không thể kết nối máy chủ SFU"}
          {callStatus === "idle" && "Mở kết nối"}
        </Text>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controls}>
        <ControlButton
          icon={isMicrophoneEnabled ? "mic" : "mic-off"}
          label={isMicrophoneEnabled ? "Tắt Mic" : "Bật Mic"}
          onPress={toggleMicrophone}
          isActive={isMicrophoneEnabled}
          isPrimary={isMicrophoneEnabled}
          disabled={!localStreamURL}
        />
        {callType !== "audio" && (
          <>
            <ControlButton
              icon={isCameraEnabled ? "videocam" : "videocam-off"}
              label={isCameraEnabled ? "Tắt Cam" : "Bật Cam"}
              onPress={toggleCamera}
              isActive={isCameraEnabled}
              isPrimary={isCameraEnabled}
              disabled={!localStreamURL}
            />
            <ControlButton
              icon="camera-reverse"
              label="Đổi Cam"
              onPress={switchCamera}
              disabled={!localStreamURL}
            />
          </>
        )}
        <ControlButton
          icon="close"
          label="Kết thúc"
          onPress={conversationType === "private" ? handleLeave : () => setConfirmLeave(true)}
          isDanger
        />
      </View>

      {/* ── Confirm leave modal ── */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmLeave && conversationType !== "private"}
        onRequestClose={() => setConfirmLeave(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalWarningIcon}>
              <Ionicons name="log-out" size={28} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Rời khỏi phòng họp?</Text>
            <Text style={styles.modalDesc}>
              Bạn có chắc chắn muốn rời khỏi cuộc gọi nhóm đang diễn ra không?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn, 
                  styles.modalBtnCancel,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => setConfirmLeave(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Quay lại</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn, 
                  styles.modalBtnLeave,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => {
                  setConfirmLeave(false);
                  handleLeave();
                }}
              >
                <Text style={styles.modalBtnText}>Rời phòng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PIP_WIDTH = 110;
const PIP_HEIGHT = 160;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617", // Modern deep black-blue
  },
  backdropTop: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  backdropBottom: {
    position: "absolute",
    bottom: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(14,165,233,0.08)",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.15,
  },
  headerSubTitle: {
    marginTop: 2,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "500",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  headerBadgeText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
  },
  // Loading overlay
  centerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  joiningText: {
    marginTop: 14,
    color: "#818cf8",
    fontSize: 14,
    fontWeight: "600",
  },
  // Error
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorBannerText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "700",
  },
  errorDismiss: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 20,
  },
  // Grid
  grid: {
    flex: 1,
    paddingHorizontal: 7,
    marginTop: 12,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  emptyGrid: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyGridText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  // Tile
  tile: {
    backgroundColor: "#0f172a",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tileVideo: {
    width: "100%",
    height: "100%",
  },
  tileVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b0f19",
  },
  tileAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  tileAvatarText: {
    fontSize: 34,
    color: "#ffffff",
    fontWeight: "800",
  },
  placeholderLabelText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tileLabelRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  activeSpeakerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#818cf8",
  },
  tileLabelText: {
    color: "#f1f5f9",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 90,
  },
  mutedBadge: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 99,
    padding: 3,
    marginLeft: 2,
  },
  // PIP (FaceTime Floating Window)
  pip: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 130 : 148,
    right: 18,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  pipVideo: {
    width: "100%",
    height: "100%",
  },
  pipPlaceholder: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  pipCamOff: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#070a13",
    justifyContent: "center",
    alignItems: "center",
  },
  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#475569",
  },
  statusDotConnected: { backgroundColor: "#10b981" },
  statusDotReady: { backgroundColor: "#f59e0b" },
  statusDotError: { backgroundColor: "#ef4444" },
  statusText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
  },
  // Controls
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15,23,42,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  controlBtnWrapper: {
    alignItems: "center",
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  controlBtnPrimary: {
    backgroundColor: "#3b82f6",
    borderColor: "#60a5fa",
  },
  controlBtnDanger: {
    backgroundColor: "#ef4444",
    borderColor: "#fca5a5",
  },
  controlBtnInactive: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  controlBtnLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  modalWarningIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  modalBtnLeave: {
    backgroundColor: "#ef4444",
  },
  modalBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  modalBtnTextCancel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "800",
  },
});
