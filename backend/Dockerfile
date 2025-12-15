# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml /app/pom.xml

# Copy backend module
COPY backend/pom.xml /app/backend/pom.xml
COPY backend/src /app/backend/src

# Build the application
RUN mvn clean package -DskipTests -pl backend -am

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl

# Create user for running application
RUN addgroup -g 1000 spring && adduser -u 1000 -G spring -s /bin/sh -D spring

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/backend/target/*.jar app.jar

# Change ownership
RUN chown -R spring:spring /app

USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]