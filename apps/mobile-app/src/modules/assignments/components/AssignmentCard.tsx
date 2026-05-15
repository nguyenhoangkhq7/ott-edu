import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isPast, isValid } from "date-fns";
import type { Assignment } from "../assignment.types";
import { AssignmentType } from "../assignment.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(value?: string): string {
  if (!value) return "Chưa có hạn";
  const d = new Date(value);
  return isValid(d) ? format(d, "dd/MM/yyyy HH:mm") : value;
}

function isDueSoon(dueDate: string): boolean {
  const d = new Date(dueDate);
  if (!isValid(d)) return false;
  const diffMs = d.getTime() - Date.now();
  return diffMs > 0 && diffMs < 86_400_000 * 2; // within 48 hours
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentCardProps = {
  item: Assignment;
  index: number;
  onPress: (item: Assignment) => void;
};

// ─── Badge colours ────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<AssignmentType, { bg: string; text: string; icon: string }> = {
  [AssignmentType.QUIZ]: { bg: "#eef2ff", text: "#4f46e5", icon: "help-circle-outline" },
  [AssignmentType.ESSAY]: { bg: "#fef3c7", text: "#d97706", icon: "document-text-outline" },
};

const CARD_ACCENTS = ["#4f46e5", "#10b981", "#e11d48", "#f59e0b", "#8b5cf6", "#0ea5e9"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AssignmentCard({ item, index, onPress }: AssignmentCardProps) {
  const isArchived = item.archived;
  const overdue = !isArchived && isPast(new Date(item.dueDate));
  const dueSoon = !isArchived && !overdue && isDueSoon(item.dueDate);
  const accentColor = isArchived ? "#94a3b8" : CARD_ACCENTS[index % CARD_ACCENTS.length];
  const typeConfig = TYPE_COLORS[item.type] ?? TYPE_COLORS[AssignmentType.QUIZ];

  return (
    <TouchableOpacity
      style={[styles.card, isArchived && styles.cardArchived]}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      {/* Left accent stripe */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Body */}
      <View style={styles.body}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isArchived && styles.textMuted]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {isArchived && (
            <View style={styles.archivedBadge}>
              <Ionicons name="lock-closed" size={10} color="#64748b" />
              <Text style={styles.archivedBadgeText}>Đã khóa</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!!item.instructions && (
          <Text style={styles.description} numberOfLines={2}>
            {item.instructions}
          </Text>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
            <Ionicons
              name={typeConfig.icon as any}
              size={11}
              color={typeConfig.text}
            />
            <Text style={[styles.typeBadgeText, { color: typeConfig.text }]}>
              {item.type}
            </Text>
          </View>

          {/* Due date */}
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={12}
              color={overdue ? "#ef4444" : dueSoon ? "#f59e0b" : "#64748b"}
            />
            <Text
              style={[
                styles.metaText,
                overdue && styles.metaTextDanger,
                dueSoon && styles.metaTextWarn,
              ]}
            >
              {formatDueDate(item.dueDate)}
            </Text>
          </View>

          {/* Score */}
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={12} color="#64748b" />
            <Text style={styles.metaText}>{item.maxScore} điểm</Text>
          </View>
        </View>

        {/* Due-soon / Overdue pill */}
        {(overdue || dueSoon) && !isArchived && (
          <View
            style={[
              styles.urgencyPill,
              overdue ? styles.urgencyDanger : styles.urgencyWarn,
            ]}
          >
            <Text
              style={[
                styles.urgencyText,
                overdue ? styles.urgencyDangerText : styles.urgencyWarnText,
              ]}
            >
              {overdue ? "⚠ Đã quá hạn" : "⏰ Sắp đến hạn"}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isArchived ? "#cbd5e1" : "#94a3b8"}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardArchived: {
    backgroundColor: "#f8fafc",
    opacity: 0.82,
  },
  accentBar: {
    width: 5,
    alignSelf: "stretch",
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 20,
  },
  textMuted: {
    color: "#64748b",
  },
  description: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#64748b",
  },
  metaTextDanger: {
    color: "#ef4444",
    fontWeight: "700",
  },
  metaTextWarn: {
    color: "#f59e0b",
    fontWeight: "700",
  },
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  archivedBadgeText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
  },
  urgencyPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  urgencyDanger: { backgroundColor: "#fee2e2" },
  urgencyWarn: { backgroundColor: "#fef3c7" },
  urgencyText: { fontSize: 11, fontWeight: "700" },
  urgencyDangerText: { color: "#b91c1c" },
  urgencyWarnText: { color: "#92400e" },
  chevron: {
    paddingRight: 12,
  },
});
