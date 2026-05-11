@REM Maven Wrapper script for Windows
@REM Downloaded from https://github.com/apache/maven-wrapper

@IF "%__MVNW_ARG0__%"=="" SET __MVNW_ARG0__=%~dpnx0
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0teleType'; $scriptDir=$scriptDir.Substring(0,$scriptDir.LastIndexOf('\')); $wrapperJar=Join-Path $scriptDir '.mvn\wrapper\maven-wrapper.jar'; $wrapperUrl=(Get-Content (Join-Path $scriptDir '.mvn\wrapper\maven-wrapper.properties') | Where-Object {$_ -match '^wrapperUrl='}) -replace 'wrapperUrl=',''; if (-not (Test-Path $wrapperJar)) { Write-Host 'Downloading Maven Wrapper...'; try { (New-Object Net.WebClient).DownloadFile($wrapperUrl, $wrapperJar) } catch { Write-Host 'ERROR: Failed to download Maven Wrapper'; exit 1 }}; $distributionUrl=(Get-Content (Join-Path $scriptDir '.mvn\wrapper\maven-wrapper.properties') | Where-Object {$_ -match '^distributionUrl='}) -replace 'distributionUrl=',''; $mavenHome=Join-Path $env:USERPROFILE '.m2\wrapper\dists'; $versionDir=Join-Path $mavenHome ($distributionUrl.Split('/')[-1] -replace '\.zip$',''); if (-not (Test-Path $versionDir)) { $zipFile=Join-Path $env:TEMP 'maven-dist.zip'; Write-Host 'Downloading Maven...'; (New-Object Net.WebClient).DownloadFile($distributionUrl, $zipFile); Expand-Archive $zipFile $mavenHome -Force; Remove-Item $zipFile }; $mvnExe=Get-ChildItem $versionDir -Recurse -Filter 'mvn.cmd' | Select-Object -First 1; Write-Output ('MAVEN_CMD=' + $mvnExe.FullName)}"`) DO @IF "%%A"=="MAVEN_CMD" SET "__MVNW_CMD__=%%B"
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%

@IF "%__MVNW_CMD__%"=="" (
    @ECHO ERROR: Could not find Maven installation
    @EXIT /B 1
)

"%__MVNW_CMD__%" %*
