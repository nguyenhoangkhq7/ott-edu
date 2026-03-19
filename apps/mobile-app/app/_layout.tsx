import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator,  StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "../src/modules/auth/AuthProvider";

function RootNavigator() {
	const router = useRouter();
	const segments = useSegments();
	const { isAuthenticated, isInitializing } = useAuth();

	useEffect(() => {
        if (isInitializing) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inDashboardGroup = segments[0] === "(dashboard)";

        // 1. Nếu CHƯA đăng nhập mà lại KHÔNG ở trong nhóm (auth) -> Ép về Login
        if (!isAuthenticated && !inAuthGroup) {
            router.replace("/(auth)/login");
        } 
        
        else if (isAuthenticated && !inDashboardGroup) {
            router.replace("/teams");
        }
    }, [isAuthenticated, isInitializing, segments]); // <-- xóa router khỏi mảng dependency cũng được

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

