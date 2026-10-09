@echo off
chcp 65001 >nul
title Creative AI - Creation de l APK Android
where node >nul 2>nul || (echo Node.js est requis : https://nodejs.org & pause & exit /b 1)
if not defined ANDROID_HOME if not defined ANDROID_SDK_ROOT (echo Android Studio doit etre installe ^(SDK Android + JDK 17^). Voir LISEZMOI-INSTALLATION.txt & pause & exit /b 1)
call npm install || goto err
if not exist android call npm run android:init || goto err
call npm run android:icons
call npx cap sync android || goto err
cd android
call gradlew.bat assembleDebug || goto err
cd ..
echo.
echo TERMINE : android\app\build\outputs\apk\debug\app-debug.apk
start "" "android\app\build\outputs\apk\debug"
pause
exit /b 0
:err
echo Une erreur est survenue.
pause
