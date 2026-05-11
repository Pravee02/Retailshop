@echo off
echo Starting RetailShop Backend...
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
set "MVN_CMD=C:\Users\ADMIN\.m2\wrapper\dists\apache-maven-3.9.11-bin\6mqf5t809d9geo83kj4ttckcbc\apache-maven-3.9.11\bin\mvn.cmd"
"%MVN_CMD%" spring-boot:run
pause
