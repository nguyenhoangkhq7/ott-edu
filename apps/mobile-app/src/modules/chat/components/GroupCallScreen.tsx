/**
 * GroupCallScreen.tsx
 *
 * Màn hình gọi nhóm SFU (Mediasoup).
 * - Grid video nhiều người tự động điều chỉnh layout (1, 2, 3-4, 5+ người).
 * - PIP (Picture-in-Picture) cho local stream ở góc dưới phải.
 * - Thanh điều khiển: Mic, Camera, Đổi Camera, Rời phòng.
 * - Hiển thị userId (hoặc tên) bên dưới mỗi video tile.
 *
 * Sử dụng:
 *   import { GroupCallScreen } from './components/GroupCallScreen';
 *
 *   <GroupCallScreen
 *     conversationId={activeConversationId}
 *     currentUserId={chatUser.id}
 *     socket={socket}
 *     participantNames={participantNameMap} // optional
 *     onLeave={() => navigation.goBack()}
 *   />
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
  conversationType?: "private" | "class";
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
    // Allow dev builds to proceed if native module exists, even when env flag is missing.
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
          <Text style={styles.tileAvatarText}>
            {label.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.tileLabelRow}>
        <Text style={styles.tileLabelText} numberOfLines={1}>
          {label}
        </Text>
        {isMuted && (
          <View style={styles.mutedBadge}>
            <Text style={styles.mutedBadgeText}>🔇</Text>
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
  disabled?: boolean;
}

function ControlButton({
  icon,
  label,
  onPress,
  isActive = true,
  isDanger = false,
  disabled = false,
}: ControlButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
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
      style={({ pressed }) => [{ opacity: pressed || disabled ? 0.6 : 1 }]}
    >
      <Animated.View
        style={[
          styles.controlBtn,
          isDanger && styles.controlBtnDanger,
          !isActive && styles.controlBtnInactive,
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color="#f8fafc"
        />
      </Animated.View>
      <Text style={styles.controlBtnLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Grid layout calculator ───────────────────────────────────────────────────

function calcGridLayout(count: number, screenWidth: number) {
  if (count === 1) return { columns: 1, tileWidth: screenWidth, tileHeight: 560 };
  if (count === 2) return { columns: 1, tileWidth: screenWidth, tileHeight: 260 };
  if (count <= 4) return { columns: 2, tileWidth: screenWidth / 2, tileHeight: 220 };
  return { columns: 2, tileWidth: screenWidth / 2, tileHeight: 180 };
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
      return participantNames[userId] ?? `User…${userId.slice(-4)}`;
    },
    [participantNames],
  );

  const localStreamURL = useMemo(() => {
    if (!localStream) return null;
    return (localStream as unknown as import("react-native-webrtc").MediaStream).toURL();
  }, [localStream]);

  const grid = useMemo(
    () => calcGridLayout(remoteParticipants.length, screenWidth),
    [remoteParticipants.length, screenWidth],
  );

  const isJoining = callStatus === "joining";
  const isPrivateCall = conversationType === "private";
  const isOneToOne = remoteParticipants.length <= 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.backdropTop} />
      <View style={styles.backdropBottom} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {callType === "audio"
              ? (isPrivateCall ? "Cuộc gọi thoại" : (isOneToOne ? "Cuộc gọi thoại" : "Cuộc gọi thoại nhóm"))
              : (isPrivateCall ? "Cuộc gọi video" : (isOneToOne ? "Cuộc gọi video" : "Cuộc gọi nhóm"))}
          </Text>
          <Text style={styles.headerSubTitle}>
            {remoteParticipants.length + 1} người tham gia
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{callStatus === "connected" ? "Đang gọi" : "Đang kết nối"}</Text>
        </View>
      </View>

      {/* ── Loading / Joining state ── */}
      {isJoining && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.joiningText}>Đang kết nối SFU…</Text>
        </View>
      )}

      {/* ── Error banner ── */}
      {callError && (
        <Pressable style={styles.errorBanner} onPress={clearCallError}>
          <Text style={styles.errorBannerText}>⚠️ {callError}</Text>
          <Text style={styles.errorDismiss}>Nhấn để đóng</Text>
        </Pressable>
      )}

      {/* ── Remote Video Grid ── */}
      <View style={styles.grid}>
        {remoteParticipants.length === 0 && !isJoining ? (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyGridText}>
              {callStatus === "ready"
                ? "Bạn đã vào phòng. Chờ thành viên khác tham gia…"
                : "Chưa có ai trong phòng."}
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
                  }}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* ── Local PIP ── */}
      {localStreamURL && callType !== "audio" && (
        <View style={styles.pip} pointerEvents="none">
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
              <Text style={styles.pipPlaceholderText}>CAM</Text>
            </View>
          )}
          {!isCameraEnabled && (
            <View style={styles.pipCamOff}>
              <Ionicons name="videocam-off" size={18} color="#fff" />
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
          {callStatus === "joining" && "Đang kết nối…"}
          {callStatus === "ready" && "Đã vào phòng – chờ người khác"}
          {callStatus === "connected" && "Đang kết nối nhóm"}
          {callStatus === "error" && "Lỗi kết nối"}
          {callStatus === "idle" && "—"}
        </Text>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controls}>
        <ControlButton
          icon={isMicrophoneEnabled ? "mic" : "mic-off"}
          label={isMicrophoneEnabled ? "Tắt Mic" : "Bật Mic"}
          onPress={toggleMicrophone}
          isActive={isMicrophoneEnabled}
          disabled={!localStreamURL}
        />
        {callType !== "audio" && (
          <>
            <ControlButton
              icon={isCameraEnabled ? "videocam" : "videocam-off"}
              label={isCameraEnabled ? "Tắt Cam" : "Bật Cam"}
              onPress={toggleCamera}
              isActive={isCameraEnabled}
              disabled={!localStreamURL}
            />
            <ControlButton
              icon="camera-reverse"
              label={cameraFacing === "front" ? "Đổi Cam" : "Cam trước"}
              onPress={switchCamera}
              disabled={!localStreamURL}
            />
          </>
        )}
        <ControlButton
          icon="call"
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
            <Text style={styles.modalTitle}>Rời cuộc gọi?</Text>
            <Text style={styles.modalDesc}>
              Bạn có chắc muốn rời khỏi cuộc gọi nhóm này không?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setConfirmLeave(false)}
              >
                <Text style={styles.modalBtnText}>Ở lại</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnLeave]}
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

const PIP_WIDTH = 100;
const PIP_HEIGHT = 140;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  backdropTop: {
    position: "absolute",
    top: -120,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(96,165,250,0.20)",
  },
  backdropBottom: {
    position: "absolute",
    bottom: -150,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(14,165,233,0.12)",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  headerTitle: {
    color: "#e2e8f0",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubTitle: {
    marginTop: 2,
    color: "#94a3b8",
    fontSize: 12,
  },
  headerBadge: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerBadgeText: {
    color: "#86efac",
    fontSize: 12,
    fontWeight: "600",
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
    marginTop: 12,
    color: "#a5b4fc",
    fontSize: 15,
  },
  // Error
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#450a0a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  errorBannerText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "600",
  },
  errorDismiss: {
    color: "#f87171",
    fontSize: 11,
    marginTop: 3,
  },
  // Grid
  grid: {
    flex: 1,
    overflow: "hidden",
    marginTop: 10,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyGrid: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyGridText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  // Tile
  tile: {
    backgroundColor: "#111827",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 16,
  },
  tileVideo: {
    width: "100%",
    height: "100%",
  },
  tileVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  tileAvatarText: {
    fontSize: 40,
    color: "#a5b4fc",
    fontWeight: "700",
  },
  tileLabelRow: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.68)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tileLabelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: 110,
  },
  mutedBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  mutedBadgeText: {
    fontSize: 10,
  },
  // PIP
  pip: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 120 : 138,
    right: 16,
    width: PIP_WIDTH,
    height: PIP_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.75)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  pipVideo: {
    width: "100%",
    height: "100%",
  },
  pipPlaceholder: {
    flex: 1,
    backgroundColor: "#1e1b2e",
    justifyContent: "center",
    alignItems: "center",
  },
  pipPlaceholderText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "700",
  },
  pipCamOff: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#475569",
  },
  statusDotConnected: { backgroundColor: "#22c55e" },
  statusDotReady: { backgroundColor: "#f59e0b" },
  statusDotError: { backgroundColor: "#ef4444" },
  statusText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  // Controls
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15,23,42,0.84)",
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(30,41,59,0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#312e55",
  },
  controlBtnDanger: {
    backgroundColor: "#dc2626",
    borderColor: "#ef4444",
  },
  controlBtnInactive: {
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  controlBtnLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#1e1b2e",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#312e55",
  },
  modalTitle: {
    color: "#f0f0f0",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalDesc: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#374151",
  },
  modalBtnLeave: {
    backgroundColor: "#b91c1c",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
