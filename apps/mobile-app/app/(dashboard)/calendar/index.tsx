// Ví dụ cho file activity.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function CalendarTab() {
  return (
    <View style={styles.container}>
      <Text>Calendar Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});