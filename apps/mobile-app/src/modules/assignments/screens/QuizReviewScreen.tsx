import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { type AssignmentDetail } from "../assignment.types";
import { type ViewSubmission } from "../assignment.api";

export type QuizReviewScreenProps = {
  detail: AssignmentDetail;
  submission: ViewSubmission;
  onBack: () => void;
};

export default function QuizReviewScreen({
  detail,
  submission,
  onBack,
}: QuizReviewScreenProps) {
  const answers = submission.studentAnswers ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Xem lại bài làm
          </Text>
          <Text style={styles.headerSub}>{detail.title}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(detail.questions ?? []).map((question, index: number) => {
          // Find student answer for this specific question
          const studentAnswer = answers.find(sa => sa.questionId === question.id);
          const selectedOptionIds = studentAnswer?.selectedOptionIds ?? [];
          const earnedPoints = studentAnswer?.earnedPoints ?? 0;
          const isCorrect = earnedPoints > 0;
          const hasAnswered = !!studentAnswer;

          return (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>Câu {index + 1}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: !hasAnswered ? "#f1f5f9" : isCorrect ? "#dcfce7" : "#fee2e2" }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: !hasAnswered ? "#64748b" : isCorrect ? "#15803d" : "#b91c1c" }
                    ]}>
                      {!hasAnswered ? "Chưa trả lời" : isCorrect ? "Đúng" : "Sai"}
                    </Text>
                  </View>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>
                    {earnedPoints} / {question.points} điểm
                  </Text>
                </View>
              </View>

              <Text style={styles.questionContent}>{question.content}</Text>

              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Đáp án đã chọn:</Text>
                <View style={styles.optionsList}>
                  {question.options && question.options.length > 0 ? (
                    question.options.map((opt) => {
                      const isSelected = selectedOptionIds.includes(opt.id);

                      let iconName: "ellipse-outline" | "checkmark-circle" | "close-circle" = "ellipse-outline";
                      let iconColor = "#94a3b8";
                      let textColor = "#475569";
                      let fontWeight: "normal" | "600" = "normal";
                      let bgColor = "transparent";

                      if (isSelected) {
                        fontWeight = "600";
                        if (isCorrect) {
                          iconName = "checkmark-circle";
                          iconColor = "#10b981";
                          textColor = "#15803d";
                          bgColor = "#e6f4ea";
                        } else {
                          iconName = "close-circle";
                          iconColor = "#ef4444";
                          textColor = "#b91c1c";
                          bgColor = "#fce8e6";
                        }
                      }

                      return (
                        <View
                          key={opt.id}
                          style={[
                            styles.optionRowReview,
                            bgColor !== "transparent" && {
                              backgroundColor: bgColor,
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                            },
                          ]}
                        >
                          <Ionicons name={iconName} size={16} color={iconColor} />
                          <Text
                            style={[
                              styles.optionText,
                              { color: textColor, fontWeight, flex: 1, marginLeft: 6 },
                            ]}
                          >
                            {opt.content}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    // Fallback: If options are missing in detail, display selected IDs
                    selectedOptionIds.map((optId: number, optIdx: number) => {
                      return (
                        <View key={optIdx} style={styles.selectedOption}>
                          <Ionicons
                            name={isCorrect ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={isCorrect ? "#10b981" : "#ef4444"}
                          />
                          <Text
                            style={[
                              styles.optionText,
                              { color: isCorrect ? "#166534" : "#991b1b", fontWeight: "600", marginLeft: 6 }
                            ]}
                          >
                            Lựa chọn ID: {optId}
                          </Text>
                        </View>
                      );
                    })
                  )}
                  {selectedOptionIds.length === 0 && (
                    <Text style={styles.noAnswerText}>Không có câu trả lời</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b" },
  scrollContent: { padding: 16, gap: 16 },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  indexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
  },
  indexText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  pointsText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  questionContent: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 22,
    marginBottom: 16,
  },
  answerSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  optionsList: { gap: 8 },
  selectedOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: { fontSize: 14, color: "#334155" },
  noAnswerText: { fontSize: 14, color: "#94a3b8", fontStyle: "italic" },
  optionRowReview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
});
