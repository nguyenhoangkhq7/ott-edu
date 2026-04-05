import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectModalProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedValue: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyText?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  loading = false,
  emptyText = "Không có dữ liệu.",
  onSelect,
  onClose,
}: SelectModalProps) {
  const [keyword, setKeyword] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return options;
    }

    return options.filter((item) => item.label.toLowerCase().includes(normalizedKeyword));
  }, [keyword, options]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={() => {
                setKeyword("");
                onClose();
              }}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
          </View>

          {searchable ? (
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder={searchPlaceholder}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}

          {loading ? <Text style={styles.metaText}>Đang tải dữ liệu...</Text> : null}

          {!loading && filteredOptions.length === 0 ? <Text style={styles.metaText}>{emptyText}</Text> : null}

          {!loading && filteredOptions.length > 0 ? (
            <ScrollView style={styles.listWrap} contentContainerStyle={styles.listContent}>
              {filteredOptions.map((item) => {
                const isSelected = item.value === selectedValue;

                return (
                  <Pressable
                    key={item.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      setKeyword("");
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxHeight: "70%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeText: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#0f172a",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  metaText: {
    color: "#64748b",
    fontSize: 13,
    marginVertical: 8,
  },
  listWrap: {
    marginTop: 4,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  option: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#eef2ff",
  },
  optionText: {
    color: "#334155",
    fontSize: 14,
  },
  optionTextSelected: {
    color: "#4338ca",
    fontWeight: "700",
  },
});
