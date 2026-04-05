import { View } from "react-native";

export default function IndexRoute() {
    // Chỉ là một màn hình trống chớp mắt, nhường toàn quyền điều hướng cho _layout.tsx
    return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
}