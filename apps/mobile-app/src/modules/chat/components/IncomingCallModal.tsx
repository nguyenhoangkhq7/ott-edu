import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MediaCallKind } from "../types";

type IncomingCallModalProps = {
  visible: boolean;
  callType: MediaCallKind;
  isPrivate: boolean;
  callerName?: string | null;
  conversationName?: string | null;
  onAccept: () => void;
  onDecline: () => void;
};

export function IncomingCallModal({
  visible,
  callType,
  isPrivate,
  callerName,
  conversationName,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  const label = callType === "audio" ? "Cuộc gọi thoại" : "Cuộc gọi video";
  const title = useMemo(() => {
    if (isPrivate) {
      return `${label} đến`;
    }
    return `${label} nhóm đến`;
  }, [isPrivate, label]);

  const description = useMemo(() => {
    const callerText = callerName ? `Từ ${callerName}` : "Có người đang gọi đến";
    if (isPrivate) {
      return callerText;
    }
    return conversationName ? `${conversationName}\n${callerText}` : callerText;
  }, [callerName, conversationName, isPrivate]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Ambient Top Glow */}
          <View style={styles.topGlow} />

          <View style={[styles.iconWrap, callType === "audio" ? styles.iconAudio : styles.iconVideo]}>
            <Ionicons
              name={callType === "audio" ? "call" : "videocam"}
              size={28}
              color="#ffffff"
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.chipRow}>
            <View style={[styles.chip, callType === "audio" ? styles.chipAudio : styles.chipVideo]}>
              <Text style={[styles.chipText, callType === "audio" ? styles.chipTextAudio : styles.chipTextVideo]}>
                {callType === "audio" ? "Âm thanh" : "Video"}
              </Text>
            </View>
            <View style={styles.chipSecondary}>
              <Text style={styles.chipSecondaryText}>{isPrivate ? "Riêng tư" : "Nhóm"}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                styles.declineButton,
                pressed && styles.buttonPressed
              ]} 
              onPress={onDecline}
            >
              <Ionicons name="close-circle" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Từ chối</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                styles.acceptButton,
                pressed && styles.buttonPressed
              ]} 
              onPress={onAccept}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" className="animate-pulse" />
              <Text style={styles.buttonText}>Chấp nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.82)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
  },
  card: {
    width: "100%",
    borderRadius: 32,
    backgroundColor: "#0f172a", // Deep elegant slate
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
  },
  topGlow: {
    position: "absolute",
    top: -50,
    left: "25%",
    width: "50%",
    height: 60,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: 30,
    filter: "blur(20px)",
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  iconAudio: {
    backgroundColor: "#2563eb", // Vibrant Blue
  },
  iconVideo: {
    backgroundColor: "#6366f1", // Elegant Indigo
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#f8fafc",
    textAlign: "center",
    letterSpacing: 0.25,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#94a3b8",
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipAudio: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  chipVideo: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
  },
  chipSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextAudio: {
    color: "#60a5fa",
  },
  chipTextVideo: {
    color: "#818cf8",
  },
  chipSecondaryText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  declineButton: {
    backgroundColor: "#ef4444", // Modern Vibrant Red
  },
  acceptButton: {
    backgroundColor: "#10b981", // Modern Vibrant Green
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});