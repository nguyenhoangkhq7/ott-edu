import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";

import { AuthProvider, useAuth } from "../src/modules/auth/AuthProvider";

function RootNavigator() {
	const router = useRouter();
	const segments = useSegments();
	const { isAuthenticated, isInitializing } = useAuth();

	useEffect(() => {
		if (isInitializing) {
			return;
		}

		const inAuthGroup = segments[0] === "(auth)";

		if (!isAuthenticated && !inAuthGroup) {
			router.replace("/(auth)/login");
			return;
		}

		if (isAuthenticated && inAuthGroup) {
			router.replace("/(dashboard)");
		}
	}, [isAuthenticated, isInitializing, router, segments]);

	if (isInitializing) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#4f46e5" />
			</SafeAreaView>
		);
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
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

