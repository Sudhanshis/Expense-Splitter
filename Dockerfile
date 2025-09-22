# Build stage: use Maven image with JDK 17 to build the jar
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy everything and build (skip tests for faster builds)
COPY . .
RUN mvn -DskipTests package

# Run stage: smaller image with JDK 17 to run the jar
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Start the app
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
