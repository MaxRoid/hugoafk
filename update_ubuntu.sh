#!/bin/bash

# ========================================================
# HugoAFK - Update Script
# ========================================================
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

# ========================================================
# .env Rekonfiguration Abfrage
# ========================================================
echo -e "\e[33m[Einstellungen]\e[0m"
read -p "Möchtest du deine Konfiguration (.env) NEU einrichten? (z.B. um Google/Discord Keys hinzuzufügen) (y/N): " RECONFIGURE

if [[ "$RECONFIGURE" =~ ^[Yy]$ ]]; then
    echo -e "\n\e[36mKonfigurations-Assistent wird gestartet...\e[0m"
    
    # 1. SSL & Domain (um die URLs neu zu setzen)
    read -p "Nutzt du eine Domain mit SSL? (y/n): " SETUP_SSL
    if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
        read -p "Bitte gib deine Domain ein (z.B. hugo.deinedomain.de): " DOMAIN_NAME
        BASE_URL="https://$DOMAIN_NAME"
    else
        SERVER_IP=$(curl -s ifconfig.me || echo "127.0.0.1")
        BASE_URL="http://$SERVER_IP:3000"
    fi

    # 2. Discord
    echo -e "\n\e[33m[Discord OAuth]\e[0m"
    read -p "Discord Client ID: " DISCORD_CLIENT_ID
    read -p "Discord Client Secret: " DISCORD_CLIENT_SECRET
    read -p "Deine Discord Owner ID (Für Admin Rechte): " DISCORD_OWNER_ID

    # 3. Google
    echo -e "\n\e[33m[Google OAuth]\e[0m"
    read -p "Google Client ID: " GOOGLE_CLIENT_ID
    read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
    read -p "Deine Google E-Mail (Für Admin Rechte): " OWNER_EMAIL

    # 4. Gemini
    echo -e "\n\e[33m[Gemini AI]\e[0m"
    read -p "Gemini API Key: " GEMINI_API_KEY

    # Generiere alte JWT Secret wiederverwenden falls vorhanden
    if grep -q "JWT_SECRET=" "$PROJECT_DIR/.env" 2>/dev/null; then
        RANDOM_JWT=$(grep "JWT_SECRET=" "$PROJECT_DIR/.env" | cut -d '=' -f2)
    else
        RANDOM_JWT=$(openssl rand -hex 32)
    fi

    cat > "$PROJECT_DIR/.env" <<EOF
# ==========================================
# HugoAFK Configuration
# ==========================================
PORT=3001
FRONTEND_URL=$BASE_URL
DATABASE_PATH=../data/hugoafk.sqlite
JWT_SECRET=$RANDOM_JWT

# ==========================================
# OAuth 2.0 Providers
# ==========================================
DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET

GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# ==========================================
# Administrator & Owner Permissions
# ==========================================
DISCORD_OWNER_ID=$DISCORD_OWNER_ID
OWNER_EMAIL=$OWNER_EMAIL

SSL_ENABLED=false
EOF

    mkdir -p "$PROJECT_DIR/frontend"
    cat > "$PROJECT_DIR/frontend/.env" <<EOF
GEMINI_API_KEY="$GEMINI_API_KEY"
APP_URL="$BASE_URL"
EOF
    echo -e "\e[32m✅ Neue Konfiguration wurde gespeichert!\e[0m\n"
else
    echo -e "Überspringe Konfiguration. Behalte alte .env Dateien...\n"
fi

# ========================================================
# Update Logik
# ========================================================
echo -e "\e[36m[1/3] Lade neueste Version von GitHub herunter...\e[0m"
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
