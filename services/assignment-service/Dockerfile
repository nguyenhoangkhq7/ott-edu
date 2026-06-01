# --- Stage 1: Build (Dùng JDK để build code) ---
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy source code vào
COPY . .

# Cài đặt Maven (vì mvnw đang lỗi trên environment này)
RUN apk add --no-cache maven

# Chạy lệnh build (bỏ qua test để build nhanh hơn cho MVP)
RUN mvn clean package -DskipTests

# --- Stage 2: Run (Chỉ dùng JRE để chạy cho nhẹ) ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file .jar từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.jar app.jar

# Cổng mặc định
EXPOSE 8080

# Lệnh chạy app
ENTRYPOINT ["java", "-jar", "app.jar"]
