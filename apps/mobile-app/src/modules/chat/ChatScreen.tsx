import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { io, type Socket } from "socket.io-client";
import { RTCView } from "react-native-webrtc";
import { useAuth } from "../auth/AuthProvider";
import { CHAT_SERVICE_URL } from "./chat.config";
import { fetchConversations, fetchCurrentChatUser } from "./chat.service";
import type { ChatConversation, ChatUser } from "./types";
import { useMobileWebRTC } from "./useMobileWebRTC";

function toCallStatusLabel(status: "idle" | "calling" | "receiving" | "connected"): string {
  switch (status) {
    case "calling":
      return "Dang thiet lap cuoc goi...";
    case "receiving":
      return "Ban co cuoc goi den";
    case "connected":
      return "Da ket noi";
    default:
      return "San sang";
  }
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identity = useMemo(() => {
    if (!user?.email) {
      return null;
    }

    return {
      email: user.email,
      code: user.code || undefined,
    };
  }, [user?.code, user?.email]);

  const {
    localStreamUrl,
    remoteStreamUrl,
    callStatus,
    incomingCall,
    activeCall,
    callError,
    startVideoCall,
    acceptIncomingCall,
    declineIncomingCall,
    endVideoCall,
    clearCallError,
  } = useMobileWebRTC({
    socket,
    currentUserId: chatUser?.id || "",
  });

  const privateConversations = useMemo(
    () => conversations.filter((conversation) => conversation.type === "private"),
    [conversations],
  );

  const activeConversation = useMemo(
    () =>
      privateConversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) || null,
    [activeConversationId, privateConversations],
  );

  const activePeer = useMemo(() => {
    if (!activeConversation || !chatUser) {
      return null;
    }

    return (
      activeConversation.participants.find(
        (participant) => participant.id !== chatUser.id,
      ) || null
    );
  }, [activeConversation, chatUser]);

  useEffect(() => {
    if (!identity) {
      setChatUser(null);
      setConversations([]);
      setActiveConversationId(null);
      return;
    }

    let mounted = true;

    const bootstrapChat = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const me = await fetchCurrentChatUser(identity);
        const nextConversations = await fetchConversations(me.id, identity);

        if (!mounted) {
          return;
        }

        setChatUser(me);
        setConversations(nextConversations);

        const firstPrivateConversation = nextConversations.find(
          (conversation) => conversation.type === "private",
        );

        setActiveConversationId((previousConversationId) => {
          if (
            previousConversationId &&
            nextConversations.some(
              (conversation) => conversation.id === previousConversationId,
            )
          ) {
            return previousConversationId;
          }

          return firstPrivateConversation?.id || null;
        });
      } catch (bootstrapError) {
        if (!mounted) {
          return;
        }

        setError(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Khong the khoi tao chat mobile.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapChat();

    return () => {
      mounted = false;
    };
  }, [identity]);

  useEffect(() => {
    if (!chatUser) {
      setSocket(null);
      return;
    }

    const nextSocket = io(CHAT_SERVICE_URL, {
      auth: { userId: chatUser.id },
      query: { userId: chatUser.id },
      transports: ["websocket"],
      forceNew: true,
      reconnection: true,
      timeout: 10000,
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [chatUser]);

  useEffect(() => {
    if (!incomingCall) {
      return;
    }

    const matchedConversation = privateConversations.find((conversation) =>
      conversation.participants.some(
        (participant) => participant.id === incomingCall.fromUserId,
      ),
    );

    if (matchedConversation && activeConversationId !== matchedConversation.id) {
      setActiveConversationId(matchedConversation.id);
    }
  }, [activeConversationId, incomingCall, privateConversations]);

  const incomingCallerName = useMemo(() => {
    if (!incomingCall) {
      return null;
    }

    for (const conversation of privateConversations) {
      const caller = conversation.participants.find(
        (participant) => participant.id === incomingCall.fromUserId,
      );

      if (caller) {
        return caller.name;
      }
    }

    return "Nguoi dung";
  }, [incomingCall, privateConversations]);

  const canStartVideoCall = Boolean(activeConversation && activePeer) && callStatus === "idle";

  const handleStartVideoCall = useCallback(async () => {
    if (!activeConversation || !activePeer) {
      return;
    }

    await startVideoCall({
      toUserId: activePeer.id,
      conversationId: activeConversation.id,
    });
  }, [activeConversation, activePeer, startVideoCall]);

  const hasVideoSession =
    callStatus !== "idle" || Boolean(localStreamUrl) || Boolean(remoteStreamUrl);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Dang dong bo chat user...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Mobile Video Call 1-1</Text>
        <Text style={styles.headerSubTitle}>
          {chatUser ? `Dang dang nhap: ${chatUser.name}` : "Chua co chat user"}
        </Text>
        <Text style={styles.envHint}>
          Signaling: {CHAT_SERVICE_URL}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {callError && (
        <Pressable style={styles.errorBanner} onPress={clearCallError}>
          <Text style={styles.errorBannerText}>{callError}</Text>
          <Text style={styles.errorDismissText}>Cham de dong</Text>
        </Pressable>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Private Conversations</Text>
        {privateConversations.length === 0 ? (
          <Text style={styles.placeholderText}>
            Khong co doan chat private de goi video.
          </Text>
        ) : (
          <FlatList
            data={privateConversations}
            horizontal
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.conversationListContent}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = item.id === activeConversationId;
              return (
                <Pressable
                  onPress={() => setActiveConversationId(item.id)}
                  style={[
                    styles.conversationChip,
                    selected ? styles.conversationChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.conversationChipText,
                      selected ? styles.conversationChipTextActive : null,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Call Control</Text>
        <Text style={styles.statusText}>
          Trang thai: {toCallStatusLabel(callStatus)}
        </Text>
        <Text style={styles.statusText}>
          Dang chat voi: {activePeer?.name || "Chua chon private conversation"}
        </Text>

        <View style={styles.callActionsRow}>
          <Pressable
            onPress={handleStartVideoCall}
            disabled={!canStartVideoCall}
            style={[
              styles.primaryButton,
              !canStartVideoCall ? styles.buttonDisabled : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>Goi Video</Text>
          </Pressable>

          <Pressable
            onPress={() => endVideoCall("ended")}
            disabled={callStatus === "idle" && !activeCall}
            style={[
              styles.dangerButton,
              callStatus === "idle" && !activeCall ? styles.buttonDisabled : null,
            ]}
          >
            <Text style={styles.dangerButtonText}>Ket Thuc</Text>
          </Pressable>
        </View>

        <Text style={styles.permissionHint}>
          Luu y: Goi video can Expo Development Build (khong ho tro Expo Go).
        </Text>
      </View>

      {hasVideoSession && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Video Session</Text>
          <View style={styles.videoGrid}>
            <View style={styles.videoPane}>
              {remoteStreamUrl ? (
                <RTCView
                  streamURL={remoteStreamUrl}
                  objectFit="cover"
                  style={styles.videoView}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoPlaceholderText}>Dang cho video doi phuong</Text>
                </View>
              )}
            </View>

            <View style={styles.videoPane}>
              {localStreamUrl ? (
                <RTCView
                  streamURL={localStreamUrl}
                  objectFit="cover"
                  mirror
                  style={styles.videoView}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoPlaceholderText}>Dang mo camera cua ban</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(incomingCall && callStatus === "receiving")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cuoc Goi Den</Text>
            <Text style={styles.modalDescription}>
              {incomingCallerName || "Nguoi dung"} dang goi video cho ban.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={declineIncomingCall}
                style={[styles.modalButton, styles.modalDeclineButton]}
              >
                <Text style={styles.modalButtonText}>Tu Choi</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void acceptIncomingCall();
                }}
                style={[styles.modalButton, styles.modalAcceptButton]}
              >
                <Text style={styles.modalButtonText}>Chap Nhan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f7fb",
  },
  loadingText: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubTitle: {
    marginTop: 4,
    color: "#cbd5e1",
    fontSize: 13,
  },
  envHint: {
    marginTop: 2,
    color: "#94a3b8",
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  placeholderText: {
    color: "#64748b",
    fontSize: 13,
  },
  conversationListContent: {
    paddingRight: 8,
  },
  conversationChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxWidth: 220,
  },
  conversationChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  conversationChipText: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "600",
  },
  conversationChipTextActive: {
    color: "#ffffff",
  },
  statusText: {
    color: "#334155",
    fontSize: 13,
    marginBottom: 4,
  },
  callActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  dangerButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    paddingVertical: 11,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  permissionHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748b",
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorBannerText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  errorDismissText: {
    marginTop: 4,
    color: "#991b1b",
    fontSize: 11,
  },
  videoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  videoPane: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#020617",
    minHeight: 170,
  },
  videoView: {
    width: "100%",
    height: 170,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  videoPlaceholderText: {
    color: "#cbd5e1",
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalDescription: {
    marginTop: 6,
    color: "#334155",
    fontSize: 14,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalAcceptButton: {
    backgroundColor: "#16a34a",
  },
  modalDeclineButton: {
    backgroundColor: "#334155",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
