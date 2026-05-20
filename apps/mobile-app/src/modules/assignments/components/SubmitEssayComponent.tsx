import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import { assignmentApi } from "../assignment.api";
import { uploadFileToS3 } from "../s3.service";
import { type PickedFile } from "../services/mockUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubmitEssayComponentProps = {
  assignmentId: number;
  teamId: number;
  hasDraft?: boolean;
  onSubmitSuccess: () => void;
};

type UploadPhase = "idle" | "uploading" | "submitting" | "done";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(mimeType?: string): string {
  if (!mimeType) return "document-outline";
  if (mimeType.includes("pdf")) return "document-text-outline";
  if (mimeType.includes("word") || mimeType.includes("docx")) return "document-outline";
  if (mimeType.includes("image")) return "image-outline";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive-outline";
  return "attach-outline";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SubmitEssayComponent({
  assignmentId,
  teamId,
  hasDraft = false,
  onSubmitSuccess,
}: SubmitEssayComponentProps) {
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0); // 0–100

  const isBusy = phase === "uploading" || phase === "submitting";

  // ─── Pick file ────────────────────────────────────────────────────────────

  const handlePickFile = async () => {
    if (isBusy) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Accept all common submission formats
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/zip",
          "image/*",
          "*/*",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setPickedFile({
        name: asset.name,
        uri: asset.uri,
        size: asset.size,
        mimeType: asset.mimeType ?? undefined,
      });
      // Reset phase if they re-pick after an error
      setPhase("idle");
      setUploadProgress(0);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể chọn file. Vui lòng thử lại.");
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!pickedFile) {
      Alert.alert("Chưa chọn file", "Vui lòng chọn file bài nộp trước.");
      return;
    }

    // ── Phase 1: Mock upload ──────────────────────────────────────────────

    try {
      setPhase("uploading");
      
      const fileUrl = await uploadFileToS3(
        pickedFile.uri,
        pickedFile.name,
        pickedFile.mimeType || "application/octet-stream",
        teamId,
        (progress) => setUploadProgress(progress)
      );

      setUploadProgress(100);

      // ── Phase 2: API submit ───────────────────────────────────────────────
      setPhase("submitting");

      if (!hasDraft) {
        // Must start the assignment to create a DRAFT submission first
        try {
          await assignmentApi.startAssignment(assignmentId);
        } catch (startErr) {
          console.log("Could not start assignment (maybe already started)", startErr);
        }
      }

      await assignmentApi.submitEssay(assignmentId, {
        fileUrl: fileUrl,
        confirm: true,
      });

      setPhase("done");
      onSubmitSuccess();
    } catch (apiErr) {
      setPhase("idle");
      setUploadProgress(0);
      Alert.alert(
        "Nộp bài thất bại",
        apiErr instanceof Error ? apiErr.message : "Đã xảy ra lỗi. Vui lòng thử lại."
      );
    }
  };

  // ─── Status label ─────────────────────────────────────────────────────────

  const phaseLabel: Record<UploadPhase, string> = {
    idle: "Nộp bài",
    uploading: "Đang tải file lên...",
    submitting: "Đang gửi bài...",
    done: "Đã nộp thành công",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      {/* ── Section title ── */}
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>Nộp bài luận</Text>
      </View>

      {/* ── File picker zone ── */}
      <TouchableOpacity
        style={[styles.dropZone, pickedFile && styles.dropZoneFilled, isBusy && styles.dropZoneBusy]}
        onPress={handlePickFile}
        activeOpacity={0.8}
        disabled={isBusy}
      >
        {pickedFile ? (
          /* ── File selected state ── */
          <View style={styles.filePreview}>
            <View style={styles.fileIconWrap}>
              <Ionicons
                name={getFileIcon(pickedFile.mimeType) as any}
                size={28}
                color="#4f46e5"
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>
                {pickedFile.name}
              </Text>
              {pickedFile.size ? (
                <Text style={styles.fileSize}>{formatBytes(pickedFile.size)}</Text>
              ) : null}
            </View>
            {!isBusy && (
              <TouchableOpacity
                style={styles.rePickBtn}
                onPress={handlePickFile}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* ── Empty state ── */
          <View style={styles.emptyZone}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cloud-upload-outline" size={32} color="#4f46e5" />
            </View>
            <Text style={styles.emptyTitle}>Chọn file bài nộp</Text>
            <Text style={styles.emptyDesc}>
              PDF, Word, ZIP, ảnh... (tối đa 20 MB)
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Upload progress bar ── */}
      {(phase === "uploading" || phase === "submitting") && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${uploadProgress}%` as any,
                  backgroundColor:
                    phase === "submitting" ? "#10b981" : "#4f46e5",
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {phase === "uploading"
              ? `Đang tải lên... ${uploadProgress}%`
              : "Đang xác nhận nộp bài..."}
          </Text>
        </View>
      )}

      {/* ── Submit button ── */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          !pickedFile && styles.submitBtnDisabled,
          isBusy && styles.submitBtnBusy,
          phase === "done" && styles.submitBtnDone,
        ]}
        onPress={handleSubmit}
        disabled={isBusy || !pickedFile || phase === "done"}
        activeOpacity={0.85}
      >
        {isBusy ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons
            name={phase === "done" ? "checkmark-circle" : "send-outline"}
            size={18}
            color="#ffffff"
          />
        )}
        <Text style={styles.submitBtnText}>{phaseLabel[phase]}</Text>
      </TouchableOpacity>

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimerRow}>
        <Ionicons name="information-circle-outline" size={13} color="#94a3b8" />
        <Text style={styles.disclaimerText}>
          Bài nộp sẽ được chuyển đến giáo viên để chấm điểm.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },

  // Section header
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Drop zone
  dropZone: {
    borderWidth: 2,
    borderColor: "#c7d2fe",
    borderStyle: "dashed",
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropZoneFilled: {
    borderStyle: "solid",
    borderColor: "#a5b4fc",
    backgroundColor: "#f5f3ff",
    minHeight: "auto",
  },
  dropZoneBusy: {
    opacity: 0.7,
  },

  // Empty zone interior
  emptyZone: {
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4f46e5",
  },
  emptyDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },

  // File preview
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: "100%",
    paddingVertical: 4,
  },
  fileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e1b4b",
    lineHeight: 19,
  },
  fileSize: {
    fontSize: 12,
    color: "#64748b",
  },
  rePickBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Progress
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "right",
  },

  // Submit button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: "#94a3b8",
    shadowColor: "transparent",
    elevation: 0,
  },
  submitBtnBusy: {
    backgroundColor: "#6366f1",
    shadowOpacity: 0.2,
  },
  submitBtnDone: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
  },

  // Disclaimer
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 16,
  },
});
