import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "../src/modules/auth/AuthProvider";

function RootNavigator() {
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, isInitializing } = useAuth();

    useEffect(() => {
        // Nếu app đang kiểm tra token lúc mới mở -> Đợi, không làm gì cả
        if (isInitializing) return;

        // Khai báo 2 biến này để kiểm tra xem user đang ở nhánh nào
        const inAuthGroup = segments[0] === "(auth)";
        const inDashboardGroup = segments[0] === "(dashboard)"; // <-- DÒNG BỊ THIẾU LÀ ĐÂY NÈ

        if (!isAuthenticated) {
            // 1. NẾU CHƯA ĐĂNG NHẬP (hoặc vừa bấm Logout)
            if (!inAuthGroup) {
                router.replace("/(auth)/login");
            }
        } else {
            // 2. NẾU ĐÃ ĐĂNG NHẬP
            // Nếu đã đăng nhập mà đang không ở trong nhánh dashboard -> Búng vào dashboard
            if (!inDashboardGroup) {
                // SỬA LẠI DÒNG NÀY: Trỏ đích danh vào tab Teams thay vì để lửng ở dashboard
                router.replace("/(dashboard)/teams"); 
            }
        }
    }, [isAuthenticated, isInitializing, segments]);

    // Màn hình loading lúc mới mở app lên
    if (isInitializing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </SafeAreaView>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(dashboard)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },
});