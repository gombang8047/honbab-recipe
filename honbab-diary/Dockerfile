# ===== Stage 1: Build =====
FROM gradle:8.8-jdk17 AS builder

WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성 캐싱을 위해 먼저 다운로드
RUN gradle dependencies --no-daemon || true

COPY src ./src
RUN gradle bootJar --no-daemon -x test

# ===== Stage 2: Run =====
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 보안: root가 아닌 사용자로 실행
RUN addgroup -S honbab && adduser -S honbab -G honbab
USER honbab

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev}", \
    "app.jar"]
