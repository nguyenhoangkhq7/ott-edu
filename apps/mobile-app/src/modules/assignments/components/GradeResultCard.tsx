import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isValid } from "date-fns";
import type { GradeDetails } from "../assignment.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GradeResultCardProps = {
  grade: GradeDetails;
  maxScore: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ScoreTier = "excellent" | "pass" | "fail";

function getScoreTier(score: number, maxScore: number): ScoreTier {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 80) return "excellent";
  if (pct >= 50) return "pass";
  return "fail";
}

const TIER_PALETTE: Record<
  ScoreTier,
  {
    ring: string;
    ringBg: string;
    scoreText: string;
    badge: string;
    badgeBg: string;
    cardBorder: string;
    cardBg: string;
    icon: string;
    label: string;
  }
> = {
  excellent: {
    ring: "#10b981",
    ringBg: "#dcfce7",
    scoreText: "#065f46",
    badge: "#15803d",
    badgeBg: "#dcfce7",
    cardBorder: "#a7f3d0",
    cardBg: "#f0fdf4",
    icon: "trophy-outline",
    label: "Xuất sắc",
  },
  pass: {
    ring: "#f59e0b",
    ringBg: "#fef3c7",
    scoreText: "#78350f",
    badge: "#b45309",
    badgeBg: "#fef3c7",
    cardBorder: "#fde68a",
    cardBg: "#fffbeb",
    icon: "checkmark-circle-outline",
    label: "Đạt yêu cầu",
  },
  fail: {
    ring: "#ef4444",
    ringBg: "#fee2e2",
    scoreText: "#7f1d1d",
    badge: "#dc2626",
    badgeBg: "#fee2e2",
    cardBorder: "#fecaca",
    cardBg: "#fff5f5",
    icon: "alert-circle-outline",
    label: "Chưa đạt",
  },
};

function formatGradedAt(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  return isValid(d) ? format(d, "HH:mm · dd/MM/yyyy") : value;
}

// ─── Animated score ring ──────────────────────────────────────────────────────

function ScoreRing({
  score,
  maxScore,
  tier,
}: {
  score: number;
  maxScore: number;
  tier: ScoreTier;
}) {
  const palette = TIER_PALETTE[tier];
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Entrance scale animation
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          backgroundColor: palette.ringBg,
          borderColor: palette.ring,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Text style={[styles.ringScore, { color: palette.scoreText }]}>
        {score}
      </Text>
      <Text style={[styles.ringMax, { color: palette.ring }]}>
        / {maxScore}
      </Text>
      <Text style={[styles.ringPct, { color: palette.scoreText }]}>
        {pct}%
      </Text>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GradeResultCard({ grade, maxScore }: GradeResultCardProps) {
  const tier = getScoreTier(grade.score, maxScore);
  const palette = TIER_PALETTE[tier];

  // Slide-in animation for the whole card
  const slideY = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, slideY]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          transform: [{ translateY: slideY }],
          opacity: cardOpacity,
        },
      ]}
    >
      {/* ── Top accent bar ── */}
      <View style={[styles.topBar, { backgroundColor: palette.ring }]} />

      {/* ── Status badge ── */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: palette.badgeBg }]}>
          <Ionicons
            name={palette.icon as any}
            size={13}
            color={palette.badge}
          />
          <Text style={[styles.badgeText, { color: palette.badge }]}>
            {palette.label}
          </Text>
        </View>
        {grade.revision > 1 && (
          <View style={styles.revisionBadge}>
            <Text style={styles.revisionText}>
              Lần chấm {grade.revision}
            </Text>
          </View>
        )}
      </View>

      {/* ── Score ring ── */}
      <View style={styles.ringWrap}>
        <ScoreRing score={grade.score} maxScore={maxScore} tier={tier} />
      </View>

      {/* ── Score label ── */}
      <Text style={[styles.tierLabel, { color: palette.ring }]}>
        Điểm số của bạn
      </Text>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: palette.cardBorder }]} />

      {/* ── Feedback ── */}
      <View style={styles.feedbackSection}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#475569" />
          <Text style={styles.feedbackTitle}>Nhận xét của giáo viên</Text>
        </View>
        {grade.feedback && grade.feedback.trim().length > 0 ? (
          <View style={styles.feedbackBubble}>
            <Text style={styles.feedbackText}>{grade.feedback}</Text>
          </View>
        ) : (
          <Text style={styles.feedbackEmpty}>
            Giáo viên chưa để lại nhận xét.
          </Text>
        )}
      </View>

      {/* ── Graded at ── */}
      {grade.gradedAt && (
        <View style={styles.gradedAtRow}>
          <Ionicons name="time-outline" size={12} color="#94a3b8" />
          <Text style={styles.gradedAtText}>
            Chấm lúc {formatGradedAt(grade.gradedAt)}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  topBar: {
    height: 5,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  revisionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  revisionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },

  // Ring
  ringWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  ringScore: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 50,
  },
  ringMax: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  ringPct: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    opacity: 0.75,
  },
  tierLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 20,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },

  // Feedback
  feedbackSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  feedbackBubble: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  feedbackText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
  feedbackEmpty: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
    paddingHorizontal: 4,
  },

  // Footer
  gradedAtRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  gradedAtText: {
    fontSize: 11,
    color: "#94a3b8",
  },
});
