@echo off
setlocal
cd /d "%~dp0"
title HugoAFK - Minecraft Bot Dashboard

echo ========================================================
echo                 HUGOAFK BOT MANAGER
echo           Autonomous Minecraft Bot System
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js wurde nicht im PATH gefunden!
    echo Bitte stelle sicher, dass Node.js installiert ist.
    echo.
    pause
    exit /b 1
)

if not exist .env (
    echo [INFO] Erstelle .env Datei...
    copy .env.example .env >nul
)

echo [INFO] Starte HugoAFK (Backend auf Port 3001, Frontend auf Port 3000)...
echo.
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:3001
echo.
echo Beenden mit STRG+C
echo ========================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [HINWEIS] HugoAFK wurde beendet.
    pause
)
