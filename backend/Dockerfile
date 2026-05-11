FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache maven && mvn clean package -DskipTests

RUN cp target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]