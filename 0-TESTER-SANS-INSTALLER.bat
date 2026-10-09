@echo off
chcp 65001 >nul
title Creative AI - Test sans installer
where node >nul 2>nul || (echo Node.js est requis : https://nodejs.org ^(version LTS^) & pause & exit /b 1)
call npm install || goto err
call npm start
exit /b 0
:err
echo Une erreur est survenue. & pause
