#!/bin/bash

# ========================================================
# HugoAFK - Update Script
# ========================================================
# Führe dieses Skript aus, um den neuesten Code von GitHub
# herunterzuladen und dein Dashboard zu aktualisieren.
# Deine .env und Datenbank bleiben dabei zu 100% sicher!

set -e

PROJECT_DIR="/var/www/hugoafk"

echo -e "\e[36m========================================================\e[0m"
echo -e "\e[36m               HugoAFK Updater                          \e[0m"
echo -e "\e[36m========================================================\e[0m"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "\e[31m[Fehler] Das Projekt wurde noch nicht installiert!\e[0m"
    echo "Bitte führe zuerst das install.sh Skript aus."
    exit 1
fi

echo -e "\n\e[36m[1/3] Lade neueste Version von GitHub herunter...\e[0m"
cd "$PROJECT_DIR"
git reset --hard
git pull origin main

echo -e "\n\e[36m[2/3] Installiere neue Pakete & kompiliere Code...\e[0m"
npm run install:all
npm run build

echo -e "\n\e[36m[3/3] Starte PM2 Prozesse neu...\e[0m"
pm2 restart hugoafk-backend
pm2 restart hugoafk-frontend
pm2 save

echo -e "\n\e[32m🎉 Update erfolgreich abgeschlossen! 🎉\e[0m"
echo "Dein Dashboard läuft jetzt auf der neuesten Version."
