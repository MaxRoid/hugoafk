#!/bin/bash

# ========================================================
# HugoAFK - Install Script (Nur für Neuinstallationen)
# ========================================================
set -e

echo -e "\e[36m========================================================\e[0m"
echo -e "\e[36m          HugoAFK Installer - Setup Assistent           \e[0m"
echo -e "\e[36m========================================================\e[0m"

PROJECT_DIR="/var/www/hugoafk"

# Prüfe, ob das Verzeichnis bereits existiert
if [ -d "$PROJECT_DIR" ]; then
    echo -e "\e[31m[Achtung] Es wurde bereits ein Ordner unter $PROJECT_DIR gefunden!\e[0m"
    read -p "Möchtest du den kompletten Ordner LÖSCHEN und komplett neu installieren? (Alle Daten & Datenbanken gehen verloren!) (y/n): " WIPE_DIR
    
    if [[ "$WIPE_DIR" =~ ^[Yy]$ ]]; then
        echo -e "\e[33mLösche bestehenden Ordner...\e[0m"
        sudo rm -rf "$PROJECT_DIR"
        echo "Ordner gelöscht. Starte saubere Neuinstallation!"
    else
        echo -e "\e[31mInstallation abgebrochen.\e[0m"
        echo "Um deine bestehende Installation zu aktualisieren, nutze bitte das 'update_ubuntu.sh' Skript!"
        exit 1
    fi
fi

echo -e "Willkommen! Ich werde nun alle nötigen Daten für dein Dashboard abfragen.\n"

# ========================================================
# Konfigurations-Abfragen
# ========================================================
# 1. SSL & Domain
echo -e "\n\e[33m[1. Domain & Webserver]\e[0m"
read -p "Möchtest du SSL (HTTPS) mit einer Domain einrichten? (y/n): " SETUP_SSL
if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
    read -p "Bitte gib deine Domain ein (z.B. hugo.deinedomain.de): " DOMAIN_NAME
    read -p "Bitte gib deine E-Mail für das Zertifikat ein: " CERT_EMAIL
    BASE_URL="https://$DOMAIN_NAME"
else
    SERVER_IP=$(curl -s ifconfig.me || echo "127.0.0.1")
    BASE_URL="http://$SERVER_IP:3000"
fi

# 2. API Keys & Discord
echo -e "\n\e[33m[2. Discord OAuth & Admin Setup]\e[0m"
read -p "Discord Client ID: " DISCORD_CLIENT_ID
read -p "Discord Client Secret: " DISCORD_CLIENT_SECRET
read -p "Deine Discord Owner ID: " DISCORD_OWNER_ID

echo -e "\n\e[33m[3. Gemini AI Setup]\e[0m"
read -p "Gemini API Key: " GEMINI_API_KEY

echo -e "\n\e[32mPerfekt! Installation beginnt in 3 Sekunden...\e[0m"
sleep 3

# ========================================================
# System Updates
# ========================================================
echo -e "\n\e[36m[Schritt 1] Aktualisiere Paketlisten...\e[0m"
sudo apt-get update -y
sudo apt-get install -y curl git build-essential

echo -e "\n\e[36m[Schritt 2] Node.js & PM2...\e[0m"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# ========================================================
# Projekt Download
# ========================================================
echo -e "\n\e[36m[Schritt 3] Lade Code von GitHub...\e[0m"
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

git clone "https://github.com/MaxRoid/hugoafk.git" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# ========================================================
# .env Generierung
# ========================================================
echo -e "\n\e[36m[Schritt 4] Generiere Konfigurationsdateien...\e[0m"

RANDOM_JWT=$(openssl rand -hex 32)
cat > .env <<EOF
PORT=3001
FRONTEND_URL=$BASE_URL
DATABASE_PATH=../data/hugoafk.sqlite
JWT_SECRET=$RANDOM_JWT
DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET
DISCORD_OWNER_ID=$DISCORD_OWNER_ID
SSL_ENABLED=false
EOF
echo "✅ Backend .env erstellt."

mkdir -p frontend
cat > frontend/.env <<EOF
GEMINI_API_KEY="$GEMINI_API_KEY"
APP_URL="$BASE_URL"
EOF
echo "✅ Frontend .env erstellt."

# ========================================================
# Build & Start
# ========================================================
echo -e "\n\e[36m[Schritt 5] Installiere Abhängigkeiten & Build...\e[0m"
npm run install:all
npm run build

if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
    echo -e "\n\e[36m[Schritt 6] SSL Setup...\e[0m"
    sudo apt-get install -y nginx certbot python3-certbot-nginx

    NGINX_CONF="/etc/nginx/sites-available/hugoafk"
    sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    server_name $DOMAIN_NAME;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF
    sudo ln -sf /etc/nginx/sites-available/hugoafk /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$CERT_EMAIL"
fi

echo -e "\n\e[36m[Letzter Schritt] Starte das Dashboard...\e[0m"
pm2 stop hugoafk-backend 2>/dev/null || true
pm2 stop hugoafk-frontend 2>/dev/null || true

pm2 start npm --name "hugoafk-backend" -- run start:backend
pm2 start npm --name "hugoafk-frontend" -- run start:frontend
pm2 save
pm2 startup | grep "sudo" | bash || true

echo -e "\n\e[32m🎉 Installation erfolgreich abgeschlossen! 🎉\e[0m"
