FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .


RUN apk add --no-cache maven && mvn clean package -DskipTests

EXPOSE 8080

ENTRYPOINT ["java","-jar","target/*.jar"]