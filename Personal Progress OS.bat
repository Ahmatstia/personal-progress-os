@echo off
cd /d "D:\IT\web\personal-progress-os"

start "Personal Progress OS Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

start http://localhost:3000