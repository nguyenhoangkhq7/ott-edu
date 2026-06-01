import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reaction: ReactionType) => void;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
  { type: 'ANGRY', emoji: '😡', label: 'Angry' },
];

export default function ReactionPicker({ visible, onClose, onSelect }: ReactionPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>React</Text>
          <View style={styles.reactionRow}>
            {REACTIONS.map((r) => (
              <TouchableOpacity
                key={r.type}
                style={styles.reactionButton}
                onPress={() => {
                  onSelect(r.type);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{r.emoji}</Text>
                <Text style={styles.label}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  reactionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    flex: 1,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
});