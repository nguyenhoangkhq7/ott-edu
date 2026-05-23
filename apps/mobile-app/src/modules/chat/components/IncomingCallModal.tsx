import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
    return conversationName ? `${conversationName} · ${callerText}` : callerText;
  }, [callerName, conversationName, isPrivate]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={callType === "audio" ? "call" : "videocam"}
              size={28}
              color="#ffffff"
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{callType === "audio" ? "Âm thanh" : "Video"}</Text>
            </View>
            <View style={styles.chipSecondary}>
              <Text style={styles.chipSecondaryText}>{isPrivate ? "Riêng tư" : "Nhóm"}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.declineButton]} onPress={onDecline}>
              <Ionicons name="close" size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Từ chối</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Ionicons name="checkmark" size={18} color="#ffffff" />
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
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
  },
  chipSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  chipText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700",
  },
  chipSecondaryText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  declineButton: {
    backgroundColor: "#334155",
  },
  acceptButton: {
    backgroundColor: "#16a34a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});