import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

type AccountHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export default function AccountHeader({ title, subtitle, onBack, avatarUrl, firstName, lastName, email }: AccountHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftBlock}>
        
        {/* {onBack ? (
          <Pressable style={styles.iconButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </Pressable>
        ) : (
          <View style={styles.profileIconWrap}>
            <Ionicons name="person-circle-outline" size={20} color="#1f3b8f" />
          </View>
        )} */}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightBlock}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8edff",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
});
