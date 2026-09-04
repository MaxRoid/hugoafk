# HugoAFK - Linux Server Deployment & SSL/TLS Guide

Dieser Leitfaden erklärt, wie du **HugoAFK** auf einem Linux-Server (Ubuntu, Debian, VPS, Root-Server) mit automatischer SSL-Verschlüsselung (HTTPS & WSS) installierst und als Hintergrund-Dienst (24/7) betreibst.

---

## 1. Voraussetzungen auf dem Linux-Server

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential
```

Überprüfen:
```bash
node -v   # v20.x.x
npm -v    # v10.x.x
```

---

## 2. HugoAFK herunterladen & starten

```bash
# In dein Zielverzeichnis wechseln
cd /var/www
git clone <DEIN_REPO_URL> hugoafk
cd hugoafk

# Berechtigungen für start.sh setzen
chmod +x start.sh

# Starten
./start.sh
```

---

## 3. SSL / HTTPS Optionen

### Option A: Automatisches SSL mit Caddy (Empfohlen - Dauert 1 Minute)
Caddy holt sich Let's Encrypt SSL-Zertifikate **vollautomatisch** ohne Konfigurationsaufwand:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Caddyfile kopieren und deine Domain eintragen
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile  # Ersetze yourdomain.com mit deiner echten Domain

# Caddy neu laden
sudo systemctl reload caddy
```
Fertig! Deine Website ist sofort unter `https://deinedomain.de` mit gültigem SSL erreichbar.

---

### Option B: Nginx & Certbot (Klassisch)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Konfiguration kopieren
sudo cp deploy/nginx.conf /etc/nginx/sites-available/hugoafk
sudo ln -s /etc/nginx/sites-available/hugoafk /etc/nginx/sites-enabled/

# Domain in nginx.conf anpassen
sudo nano /etc/nginx/sites-available/hugoafk

# Kostenloses Let's Encrypt SSL Zertifikat holen
sudo certbot --nginx -d deinedomain.de

# Nginx neu starten
sudo systemctl restart nginx
```

---

## 4. HugoAFK als Hintergrund-Dienst (24/7 Autostart via systemd)

Damit HugoAFK auch nach einem Server-Neustart oder SSH-Logout dauerhaft weiterläuft:

```bash
# Service-Datei kopieren
sudo cp deploy/hugoafk.service /etc/systemd/system/hugoafk.service

# Systemd neu laden und Dienst aktivieren
sudo systemctl daemon-reload
sudo systemctl enable hugoafk
sudo systemctl start hugoafk

# Status überprüfen
sudo systemctl status hugoafk

# Live-Logs ansehen
journalctl -u hugoafk -f
```

---

## 5. Plug-and-Play Addons auf Linux installieren

Auf Linux kannst du Addon-Ordner einfach per SFTP oder SSH in das Verzeichnis `/var/www/hugoafk/addons/` schieben:

```bash
# Neues Addon via git oder copy hinzufügen
cp -r mein-addon /var/www/hugoafk/addons/

# HugoAFK erkennt das Addon sofort ohne Neustart!
```
Oder direkt im Web-Dashboard unter dem Reiter **Addons** auf **"Plugin hinzufügen"** klicken.
