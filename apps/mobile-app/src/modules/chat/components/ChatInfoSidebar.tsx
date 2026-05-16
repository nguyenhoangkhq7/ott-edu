import React, { useEffect, useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiConversation, ApiMessage } from "../types";
import {
  fetchConversationInfo,
  fetchFileItems,
  fetchLinkItems,
  fetchMediaItems,
} from "../chatApi";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width;

interface ChatInfoSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  conversationId: string;
  currentChatUserId?: string;
}

export const ChatInfoSidebar: React.FC<ChatInfoSidebarProps> = ({
  isVisible,
  onClose,
  conversationId,
  currentChatUserId,
}) => {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const [info, setInfo] = useState<ApiConversation | null>(null);
  const [media, setMedia] = useState<ApiMessage[]>([]);
  const [files, setFiles] = useState<ApiMessage[]>([]);
  const [links, setLinks] = useState<ApiMessage[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      loadAllData();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const loadAllData = async () => {
    try {
      const [infoData, mediaData, filesData, linksData] = await Promise.all([
        fetchConversationInfo(conversationId),
        fetchMediaItems(conversationId, 6),
        fetchFileItems(conversationId, 10),
        fetchLinkItems(conversationId, 10),
      ]);
      setInfo(infoData);
      setMedia(mediaData);
      setFiles(filesData);
      setLinks(linksData);
    } catch (error) {
      console.error("Error loading chat info:", error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSectionHeader = (title: string, icon: any, section: string) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={20} color="#475569" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons
        name={expandedSection === section ? "chevron-up" : "chevron-down"}
        size={18}
        color="#94A3B8"
      />
    </TouchableOpacity>
  );

  const getDisplayName = () => {
    if (!info) return "Đang tải...";
    if (info.type === "class") return info.name;
    // Private chat: filter out current user
    const other = info.participants.find((p) => p._id !== currentChatUserId);
    return other?.fullName || info.name;
  };

  const getDisplayAvatar = () => {
    if (!info) return `https://i.pravatar.cc/150?u=${conversationId}`;
    if (info.avatarUrl) return info.avatarUrl;
    if (info.type === "private") {
      const other = info.participants.find((p) => p._id !== currentChatUserId);
      return other?.avatarUrl || `https://i.pravatar.cc/150?u=${other?._id}`;
    }
    return `https://i.pravatar.cc/150?u=${conversationId}`;
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Thông tin hội thoại</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <Image
                  source={{ uri: getDisplayAvatar() }}
                  style={styles.avatar}
                />
                <Text style={styles.chatName}>{getDisplayName()}</Text>
                {info?.type === "class" && (
                  <Text style={styles.chatTypeBadge}>Nhóm lớp</Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: "#F1F5F9" }]}>
                    <Ionicons name="notifications-off-outline" size={20} color="#475569" />
                  </View>
                  <Text style={styles.actionText}>Tắt thông báo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: "#F1F5F9" }]}>
                    <Ionicons name="pin-outline" size={20} color="#475569" />
                  </View>
                  <Text style={styles.actionText}>Ghim</Text>
                </TouchableOpacity>
                {info?.type === "class" && (
                  <TouchableOpacity style={styles.actionItem}>
                    <View style={[styles.actionIcon, { backgroundColor: "#F1F5F9" }]}>
                      <Ionicons name="person-add-outline" size={20} color="#475569" />
                    </View>
                    <Text style={styles.actionText}>Thêm</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: "#F1F5F9" }]}>
                    <Ionicons name="settings-outline" size={20} color="#475569" />
                  </View>
                  <Text style={styles.actionText}>Quản lý</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Sections */}
              {info?.type === "class" && (
                <>
                  {renderSectionHeader("Thành viên nhóm", "people-outline", "members")}
                  {expandedSection === "members" && (
                    <View style={styles.sectionContent}>
                      {info?.participants?.map((p) => (
                        <View key={p._id} style={styles.memberRow}>
                          <Image
                            source={{ uri: p.avatarUrl || `https://i.pravatar.cc/150?u=${p._id}` }}
                            style={styles.memberAvatar}
                          />
                          <Text style={styles.memberName}>{p.fullName}</Text>
                          {info.ownerId === p._id && (
                            <Text style={styles.ownerBadge}>Chủ nhóm</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.dividerSmall} />
                </>
              )}

              {renderSectionHeader("Ảnh & Video", "images-outline", "media")}
              {expandedSection === "media" && (
                <View style={styles.mediaGrid}>
                  {media.length > 0 ? (
                    media.flatMap(m => m.attachments || []).map((att, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.mediaItem}
                        onPress={() => Linking.openURL(att.url)}
                      >
                        <Image source={{ uri: att.url }} style={styles.mediaThumb} />
                        {att.fileType.startsWith("video/") && (
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play" size={16} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Chưa có ảnh hoặc video</Text>
                  )}
                </View>
              )}
              <View style={styles.dividerSmall} />

              {renderSectionHeader("Tập tin", "document-text-outline", "files")}
              {expandedSection === "files" && (
                <View style={styles.sectionContent}>
                  {files.length > 0 ? (
                    files.flatMap(m => m.attachments || []).map((att, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.fileRow}
                        onPress={() => Linking.openURL(att.url)}
                      >
                        <View style={styles.fileIcon}>
                          <Ionicons name="document" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName} numberOfLines={1}>{att.fileName}</Text>
                          <Text style={styles.fileMeta}>2.4 MB • 12/05/2026</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Chưa có tập tin nào</Text>
                  )}
                </View>
              )}
              <View style={styles.dividerSmall} />

              {renderSectionHeader("Liên kết", "link-outline", "links")}
              {expandedSection === "links" && (
                <View style={styles.sectionContent}>
                  {links.length > 0 ? (
                    links.map((m, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.linkRow}
                        onPress={() => m.linkPreview?.url && Linking.openURL(m.linkPreview.url)}
                      >
                        <View style={styles.linkIcon}>
                          <Ionicons name="globe-outline" size={20} color="#10B981" />
                        </View>
                        <View style={styles.linkInfo}>
                          <Text style={styles.linkTitle} numberOfLines={1}>
                            {m.linkPreview?.title || "Liên kết"}
                          </Text>
                          <Text style={styles.linkUrl} numberOfLines={1}>
                            {m.linkPreview?.url || m.content}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Chưa có liên kết nào</Text>
                  )}
                </View>
              )}
              <View style={styles.dividerSmall} />

              {renderSectionHeader("Thiết lập bảo mật", "shield-checkmark-outline", "security")}
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#F1F5F9",
  },
  chatName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  chatTypeBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#6366F1",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  actionItem: {
    alignItems: "center",
    width: 70,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
  },
  divider: {
    height: 8,
    backgroundColor: "#F8FAFC",
  },
  dividerSmall: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 12,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  memberName: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  ownerBadge: {
    fontSize: 10,
    color: "#F59E0B",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  mediaItem: {
    width: (SIDEBAR_WIDTH - 32 - 16) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  mediaThumb: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  fileMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 10,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
  },
  linkUrl: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    textAlign: "center",
    width: "100%",
    paddingVertical: 10,
  },
});
