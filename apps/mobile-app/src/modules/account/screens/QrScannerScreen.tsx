import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { confirmQrSession } from "../../auth/auth.service";

const { width, height } = Dimensions.get("window");
const SCANNER_SIZE = width * 0.7;

export default function QrScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  // 1. Kiểm tra trạng thái cấp quyền
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải quyền camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#64748b" />
        <Text style={styles.titleText}>Quyền truy cập Camera</Text>
        <Text style={styles.descText}>
          Ứng dụng cần quyền truy cập camera để quét mã QR đăng nhập web.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backLinkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Xử lý quét mã QR thành công
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isProcessing || showConfirmModal) return;

    const scannedText = data.trim();

    // 1. Kiểm tra nếu data là chuỗi UUID thô (sessionId)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedText);
    if (isUuid) {
      setScanned(true);
      setTargetSessionId(scannedText);
      setShowConfirmModal(true);
      return;
    }

    // 2. Phòng hờ nếu data vẫn là JSON
    try {
      const parsed = JSON.parse(scannedText);
      if (parsed.type === "LOGIN_QR" && parsed.sessionId) {
        setScanned(true);
        setTargetSessionId(parsed.sessionId);
        setShowConfirmModal(true);
        return;
      }
    } catch (e) {
      // Bỏ qua
    }

    // Nếu quét phải mã QR khác không đúng định dạng
    setScanned(true);
    Alert.alert(
      "Mã QR không hợp lệ",
      "Hệ thống không nhận diện được mã QR này. Vui lòng quét mã QR hiển thị ở trang đăng nhập của SmileEdu Web.",
      [{ text: "Đồng ý", onPress: () => setScanned(false) }]
    );
  };

  // 3. Người dùng bấm nút "Xác nhận đăng nhập"
  const handleConfirmLogin = async () => {
    if (!targetSessionId) return;

    try {
      setIsProcessing(true);
      setShowConfirmModal(false);

      await confirmQrSession(targetSessionId);

      Alert.alert(
        "Đăng nhập thành công",
        "Trình duyệt Web của bạn đã đăng nhập thành công.",
        [
          {
            text: "Đồng ý",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Đăng nhập thất bại", err.message || "Vui lòng quét lại.");
      setScanned(false);
      setTargetSessionId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelLogin = () => {
    setShowConfirmModal(false);
    setScanned(false);
    setTargetSessionId(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        {/* Lớp phủ màn mờ xung quanh vùng quét */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedRow} />
          
          <View style={styles.focusedRow}>
            <View style={styles.unfocusedCell} />
            <View style={styles.scannerBox}>
              
              {/* Neon border lines */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {/* Red warning pointer line */}
              {!scanned && <View style={styles.laserLine} />}
            </View>
            <View style={styles.unfocusedCell} />
          </View>

          <View style={styles.unfocusedRow}>
            <Text style={styles.scanInstruction}>
              Di chuyển camera vào trung tâm mã QR của Web SmileEdu để đăng nhập.
            </Text>
            
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close-circle" size={54} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Confirmation Modal Overlay */}
      {showConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <Ionicons name="desktop-outline" size={42} color="#4f46e5" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận đăng nhập?</Text>
            <Text style={styles.modalDesc}>
              Bằng việc xác nhận, bạn cho phép trình duyệt Web đăng nhập vào tài khoản SmileEdu này.
            </Text>
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelLogin}>
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmLogin}>
                <Text style={styles.confirmBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Đang gửi lệnh đăng nhập...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
  },
  unfocusedRow: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  focusedRow: {
    height: SCANNER_SIZE,
    flexDirection: "row",
  },
  unfocusedCell: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  scannerBox: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#4f46e5",
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  laserLine: {
    width: "100%",
    height: 2.5,
    backgroundColor: "#ef4444",
    position: "absolute",
    top: SCANNER_SIZE / 2,
  },
  scanInstruction: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12,
  },
  closeButton: {
    marginTop: 24,
    alignSelf: "center",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  processingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
