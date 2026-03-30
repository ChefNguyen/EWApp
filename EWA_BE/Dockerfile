# ─────────────────────────────────────────────────────────────────
# Stage 1 – Build the fat JAR with Maven
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM first to leverage Docker layer cache
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B --no-transfer-progress

# Copy source and build, skipping tests (tests run in the pipeline stage)
COPY src/ src/
RUN ./mvnw package -DskipTests -B --no-transfer-progress

# ─────────────────────────────────────────────────────────────────
# Stage 2 – Lean runtime image
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Create a non-root user for security
RUN addgroup -S ewa && adduser -S ewa -G ewa

WORKDIR /app

# Copy only the fat JAR from the builder stage
COPY --from=builder /app/target/ewa-*.jar app.jar

# Own the workdir
RUN chown -R ewa:ewa /app

USER ewa

# Expose the default Spring Boot port
EXPOSE 8080

# JVM tuning for containers + explicit active profile
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
