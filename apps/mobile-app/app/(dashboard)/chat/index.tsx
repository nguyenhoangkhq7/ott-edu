// Ví dụ cho file activity.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ChatTab() {
  return (
    <View style={styles.container}>
      <Text>Chat Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});