#!/usr/bin/env bash
# ========================================================
#                 HUGOAFK BOT MANAGER
#           Autonomous Minecraft Bot System
#               Linux / VPS Startup Script
# ========================================================

set -e

# Terminal colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================================${NC}"
echo -e "${CYAN}                HUGOAFK BOT MANAGER                     ${NC}"
echo -e "${CYAN}          Autonomous Minecraft Bot System               ${NC}"
echo -e "${CYAN}========================================================${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js ist nicht installiert!${NC}"
    echo -e "Bitte installiere Node.js v18 oder neuer (z.B. via: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs)"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}[INFO] Node.js Version: ${NODE_VERSION}${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm ist nicht installiert!${NC}"
    exit 1
fi

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installiere Root-Abhängigkeiten...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installiere Backend-Abhängigkeiten...${NC}"
    npm --prefix backend install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}[SETUP] Installiere Frontend-Abhängigkeiten...${NC}"
    npm --prefix frontend install
fi

# Build backend TypeScript
echo -e "${CYAN}[BUILD] Kompiliere Backend TypeScript...${NC}"
npm run build:backend

echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}[INFO] Starte HugoAFK (Backend auf Port 3001, Frontend auf Port 3000)...${NC}"
echo -e "  - Frontend: http://localhost:3000"
echo -e "  - Backend:  http://localhost:3001"
echo -e "Beenden mit STRG+C"
echo -e "${GREEN}========================================================${NC}"

# Start development stack
exec npm run dev
