@echo off
chcp 65001 >nul
title Creative AI - Creation de l installateur Windows
where node >nul 2>nul || (echo Node.js est requis : https://nodejs.org ^(version LTS^) & pause & exit /b 1)
echo Installation des outils ^(premiere fois : quelques minutes, Internet requis^)...
call npm install || goto err
echo Creation de l installateur...
call npm run dist:win || goto err
echo.
echo TERMINE : ton installateur est dans le dossier "dist".
start "" "%~dp0dist"
pause
exit /b 0
:err
echo Une erreur est survenue. Copie le message ci-dessus pour obtenir de l aide.
pause
