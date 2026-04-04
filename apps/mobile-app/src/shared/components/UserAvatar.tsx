import { Image, StyleSheet, Text, View } from "react-native";

import { getDisplayName, getInitialsFromDisplayName } from "../utils/user-display";

type UserAvatarProps = {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: number;
};

export default function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 40,
}: UserAvatarProps) {
  const hasAvatar = Boolean(avatarUrl && avatarUrl.trim().length > 0);

  if (hasAvatar) {
    return <Image source={{ uri: avatarUrl?.trim() }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  const displayName = getDisplayName(firstName, lastName, email);
  const initials = getInitialsFromDisplayName(displayName);

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, Math.floor(size * 0.38)) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#e2e8f0",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d1d2eb",
  },
  initials: {
    color: "#4b53bc",
    fontWeight: "700",
  },
});