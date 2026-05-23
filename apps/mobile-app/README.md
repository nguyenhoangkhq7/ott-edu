# Mobile App Setup

Hướng dẫn này dành cho app mobile trong `apps/mobile-app`, chạy bằng Expo và cần Development Build để dùng `react-native-webrtc` / Mediasoup.

## Yêu cầu

- Node.js 20+.
- Android Studio hoặc Xcode nếu muốn build native.
- Expo CLI / `npx expo`.
- Backend, gateway và chat service đang chạy.

Nếu bạn đang chạy toàn bộ hệ thống bằng Docker, có thể khởi động từ thư mục gốc:

```bash
docker compose up -d --build
```

## Cài đặt

```bash
cd apps/mobile-app
npm install
```

## Cấu hình môi trường

Tạo file `.env` trong `apps/mobile-app` với các biến sau:

```env
EXPO_PUBLIC_API_URL=http://<gateway-hoac-api-host>:8088
EXPO_PUBLIC_CHAT_SERVICE_URL=http://<chat-service-host>:3001
EXPO_PUBLIC_ENABLE_WEBRTC=true
```

Ghi chú:

- Khi test trên máy thật, hãy dùng IP LAN của máy đang chạy backend/gateway.
- Nếu dùng Android emulator, bạn có thể dùng `10.0.2.2` thay cho `localhost`.
- `EXPO_PUBLIC_ENABLE_WEBRTC=true` là bắt buộc để bật màn hình call Mediasoup.

## Chạy app

### Cách 1: chạy development build trên thiết bị/emulator
npx eas build --profile development --platform android
Lần đầu tiên, tạo development build native:

```bash
npx expo run:android
```

Sau đó khởi động Metro cho development client:

```bash
npx expo start --dev-client
```

Nếu muốn dùng lệnh có sẵn trong `package.json`, bạn cũng có thể chạy:

```bash
npm run android
```

### Cách 2: chạy Expo bundler để debug

```bash
npm run start
```

Từ đây bạn có thể mở app bằng development client đã cài sẵn.

## Lệnh có sẵn

```bash
npm run start   # mở Expo Metro
npm run android # build và chạy native Android
npm run ios     # build và chạy native iOS
npm run web     # chạy bản web của Expo
```

## Lưu ý về cuộc gọi video/audio

- App mobile dùng `mediasoup-client` và `react-native-webrtc`.
- Không chạy được đúng trên Expo Go, hãy dùng Development Build.
- Nếu call không vào được, kiểm tra lại `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_CHAT_SERVICE_URL` và backend đang mở port đúng.
- Trên thiết bị thật, camera/microphone sẽ hỏi quyền khi vào cuộc gọi.

## Kiểm tra nhanh

Nếu app mở được nhưng chat/call lỗi, hãy xác nhận:

1. Gateway/API đang chạy và truy cập được từ điện thoại.
2. Chat service đang chạy trên `3001`.
3. `EXPO_PUBLIC_ENABLE_WEBRTC=true` đã được set.
4. Bạn đã cài development build, không phải Expo Go.
