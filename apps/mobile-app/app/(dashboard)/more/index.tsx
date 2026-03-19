// Ví dụ cho file activity.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function MoreTab() {
  return (
    <View style={styles.container}>
      <Text>More Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});