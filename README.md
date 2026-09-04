# HugoAFK – Fullstack Application

HugoAFK ist ein modernes, modulares Web-Dashboard und Server-Management-Panel zur Verwaltung autonomer Minecraft-Mineflayer-Bots mit Microsoft-Authentifizierung, Echtzeit-Telemetrie via Socket.IO, nativer SQLite-Speicherung und einem dynamischen Addon-System.

---

## Inhaltsverzeichnis
1. [Funktionsübersicht](#funktionsübersicht)
2. [Technologie-Stack](#technologie-stack)
3. [Projektarchitektur](#projektarchitektur)
4. [Voraussetzungen](#voraussetzungen)
5. [Installation & Schnellstart](#installation--schnellstart)
6. [Authentifizierung (Discord, Google, SQLite & Microsoft)](#authentifizierung)
7. [Addon-System & Eigenes Addon erstellen](#addon-system)
8. [Umgebungsvariablen (.env)](#umgebungsvariablen)
9. [Fehlerbehebung (Troubleshooting)](#fehlerbehebung)

---

## Funktionsübersicht

* **Bot-Manager**: Unabhängiges Erstellen, Starten, Stoppen, Neustarten und Löschen von Minecraft-Clients.
* **Microsoft Authentication**: Online-Mode-kompatibel über Microsoft Device Code Flow (`https://microsoft.com/devicelogin`) mit sicherem Token-Caching in `data/auth-cache/` (keine Klartext-Passwörter).
* **Echtzeit-Telemetrie via Socket.IO**:
  - Live-Status-Badges (`online`, `starting`, `stopped`, `offline`, `reconnecting`, `error`)
  - HP- & Hungerbalken
  - Latenz (Ping in ms) & Laufzeit-Zähler
  - Welt-Koordinaten & Blickrichtung (Yaw, Pitch, Dimension)
  - Live-Inventar-Grid mit Tooltips und Durability
  - Server- & Bot-Chat-Stream mit direkter Befehlseingabe (`/sell`, `/spawn`, etc.)
* **Modulares Addon-System**:
  - **AutoSell**: Überwacht das Inventar, führt konfigurierbare Verkaufsbefehle aus und interagiert mit Verkaufs-GUIs.
  - **AntiAFK**: Verhindert AFK-Kicks durch subtile Bewegungen, Drehungen und Sprünge.
  - **AutoReconnect**: Automatische Wiederverbindung bei Server-Restart oder Disconnects.
  - **AutoRespawn**: Automatischer Respawn nach Bot-Tod.
  - **AutoEat**: Automatisches Essen aus dem Inventar bei niedrigem Hungerlevel.
* **Dynamische Addon-Konfiguration**: Addons beschreiben ihr Schema (`boolean`, `number`, `text`, `select`, `slider`) und das Frontend erzeugt automatisch passende Eingabeformulare.
* **Echter Discord- & Google-Login**: OAuth 2.0 Integration mit automatischem Benutzerabgleich in SQLite, ergänzt durch reguläre Benutzername/Passwort-Registrierung.
* **Zero Paid Walls (V1)**: Alle Funktionen sind in V1 vollständig kostenlos lokal nutzbar. Die Architektur ist für spätere Berechtigungs-Tiers vorbereitet.

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| **Frontend** | React 19, Next.js 15, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js 24, TypeScript, Express, Socket.IO |
| **Datenbank** | Native SQLite 3 via `node:sqlite` (kein node-gyp oder C++-Compiler nötig) |
| **Minecraft** | Mineflayer, Minecraft 1.21.4, Microsoft Authentication |
| **Auth** | Discord OAuth 2.0, Google OAuth 2.0, JWT & Salted PBKDF2 Hashing |

---

## Projektarchitektur

```text
hugoafk/
│
├── frontend/                     # Next.js 15 React Frontend
│   ├── app/                      # Next.js App Router (Layout, Page, CSS)
│   ├── components/               # UI-Komponenten (Sidebar, Header, Modals, Views)
│   ├── context/                  # DashboardContext (Socket.IO + REST State)
│   ├── lib/                      # Formatierer, Utilities & DE/EN Übersetzungen
│   ├── services/                 # API Client (REST Endpoints)
│   └── types/                    # TypeScript Schnittstellen
│
├── backend/                      # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── addons/               # AddonManager & Core Addons
│   │   ├── api/routes/           # REST Router (Auth, Clients, Addons, Nodes, Settings)
│   │   ├── auth/                 # OAuth (Discord, Google) & JWT/Passwort-Service
│   │   ├── clients/              # BotManager & MineflayerBot Wrapper
│   │   ├── database/             # Native SQLite Initialisierung & Schemas
│   │   ├── websocket/            # Socket.IO Gateway
│   │   └── index.ts              # Server-Bootstrap
│   └── package.json
│
├── addons/                       # Addon-Verzeichnis für Erweiterungen
│   ├── autosell/
│   ├── anti-afk/
│   ├── auto-reconnect/
│   ├── auto-respawn/
│   └── auto-eat/
│
├── data/                         # Lokale Daten (wird automatisch erzeugt)
│   ├── hugoafk.sqlite            # SQLite Datenbankdatei
│   └── auth-cache/               # Microsoft OAuth Token Caches
│
├── .env.example                  # Vorlage für Umgebungsvariablen
├── package.json                  # Root Monorepo Scripts
└── README.md                     # Diese Dokumentation
```

---

## Voraussetzungen

* **Node.js**: v22.5.0 oder neuer (empfohlen: Node.js 24+)
* **NPM**: v10+

---

## Installation & Schnellstart

### 1. Repository klonen & Abhängigkeiten installieren
```bash
git clone https://github.com/your-username/hugoafk.git
cd hugoafk
npm run install:all
```

### 2. Umgebungsvariablen konfigurieren
Kopiere `.env.example` zu `.env`:
```bash
cp .env.example .env
```
*(Die Anwendung startet auch ohne OAuth-Keys sofort mit regulärem Benutzer-Login).*

### 3. Server starten (1-Klick oder Terminal)
* **Per Doppelklick**: Führe einfach die **`start.bat`** im Projektverzeichnis aus!
* **Oder im Terminal**:
  ```bash
  npm run dev
  ```
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:3001](http://localhost:3001)

### 4. Production Build & Start
```bash
npm run build
npm run start
```

---

## Authentifizierung & Owner-System

### 1. Exklusiver Discord & Google OAuth Login
Der klassische Login mit Benutzername und Passwort wurde entfernt. Die Anmeldung erfolgt exklusiv über autorisierte OAuth-Provider:
* **Mit Discord anmelden**
* **Mit Google anmelden**

In der `.env` Datei können die OAuth-Credentials hinterlegt werden:
```env
DISCORD_CLIENT_ID=deine_discord_client_id
DISCORD_CLIENT_SECRET=dein_discord_client_secret

GOOGLE_CLIENT_ID=deine_google_client_id
GOOGLE_CLIENT_SECRET=dein_google_client_secret
```

### 2. Owner-System (Discord ID Rechtevergabe)
Nur der Inhaber (Owner) und ernannte Administratoren haben Zugriff auf geschützte Funktionen wie das Cluster-Management (`/admin-nodes`) und administrative Server-Einstellungen.

Trage deine **Discord User ID** in die `.env` ein:
```env
DISCORD_OWNER_ID=123456789012345678
```
*(Deine Discord-ID findest du in Discord: Einstellungen -> Erweitert -> Entwicklermodus aktivieren -> Rechtsklick auf dein Profilbild -> "Benutzer-ID kopieren").*

Sobald du dich mit deinem Discord-Account anmeldest:
* Erkennt HugoAFK deine Discord-ID automatisch.
* Dein Account erhält sofort den Rang **Owner / Admin** mit vollen Administrator-Rechten.
* Alle anderen Nutzer erhalten die eingeschränkte Standard-Rolle `user` ohne Zugriff auf Node-Verwaltung oder administrative Systemsteuerungen.

### 3. Microsoft Authentication für Minecraft
Mineflayer nutzt offizielles Microsoft Device Login:
1. Erstelle einen Client im Dashboard und wähle Authentifizierung `Microsoft`.
2. Klicke auf **Start**.
3. In der Konsole und per Benachrichtigung erscheint der Device Code:
   ```text
   [AUTH] Microsoft Device Login: Go to https://microsoft.com/devicelogin and enter code ABCD-1234
   ```
4. Öffne den Link im Browser, gib den Code ein und bestätige die Minecraft-Anmeldung.
5. Die Token-Caches werden sicher in `data/auth-cache/<clientId>/` gespeichert. Zukünftige Starts verbinden sich vollautomatisch ohne erneute Code-Eingabe!

---

## Addon-System

Das Kernprinzip von HugoAFK ist die strikte Trennung von Core-Bot-Code und Automatisierungs-Modulen.

### HugoAddon Interface
Jedes Addon implementiert das `HugoAddon`-Interface:
```typescript
export interface HugoAddon {
  id: string;
  name: string;
  version: string;
  author?: string;
  description: string;
  category: 'Automation' | 'Movement' | 'Utility' | 'Management';
  configSchema: AddonConfigField[];

  init: (context: AddonContext) => Promise<void> | void;
  stop: (context: AddonContext) => Promise<void> | void;
}
```

### AddonContext
Addons erhalten kontrollierten Zugriff auf:
* `bot`: Mineflayer Bot-Instanz (Events, Inventory, Physics, Navigation)
* `clientId` & `clientName`: Metadaten des aktuellen Clients
* `logger`: Namespaced Logger (`logger.info`, `logger.warn`, `logger.error`, `logger.debug`)
* `config`: Dynamisch im Dashboard konfigurierbare Werte
* `sendChat(msg)`: Minecraft Chat- und Befehlsausführung
* `saveConfig(cfg)`: Speichern von Addon-Parametern in der SQLite-Datenbank

### Eigenes Addon erstellen (Beispiel)
Erstelle eine Datei unter `addons/my-addon/index.ts`:
```typescript
import { HugoAddon, AddonContext } from '../../backend/src/addons/types.js';

export const MyCustomAddon: HugoAddon = {
  id: 'my-custom-addon',
  name: 'AutoGreeting',
  version: '1.0.0',
  description: 'Begrüßt neue Spieler auf dem Server automatisch im Chat.',
  category: 'Utility',
  configSchema: [
    {
      key: 'enabled',
      label: 'Aktiviert',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'greetingMessage',
      label: 'Begrüßungsnachricht',
      type: 'text',
      defaultValue: 'Willkommen auf dem Server!',
    },
  ],

  init(context: AddonContext) {
    const { bot, logger, config, sendChat } = context;
    if (!bot) return;

    const onPlayerJoined = (player: any) => {
      if (!config.enabled || player.username === bot.username) return;
      logger.info(`Spieler ${player.username} beigetreten.`);
      sendChat(`${config.greetingMessage} ${player.username}`);
    };

    bot.on('playerJoined', onPlayerJoined);
    (context as any)._handler = onPlayerJoined;
    logger.info('AutoGreeting initialisiert.');
  },

  stop(context: AddonContext) {
    if (context.bot && (context as any)._handler) {
      context.bot.removeListener('playerJoined', (context as any)._handler);
    }
    context.logger.info('AutoGreeting gestoppt.');
  },
};
```
Registriere das Addon in `backend/src/addons/AddonManager.ts` über:
```typescript
this.registerAddon(MyCustomAddon);
```

---

## Umgebungsvariablen

| Variable | Beschreibung | Standardwert |
|---|---|---|
| `PORT` | HTTP & WebSocket Port des Backends | `3001` |
| `FRONTEND_URL` | Basis-URL des Frontends für OAuth Redirects | `http://localhost:3000` |
| `DATABASE_PATH` | Pfad zur SQLite-Datenbankdatei | `../data/hugoafk.sqlite` |
| `JWT_SECRET` | Geheimer Schlüssel für Auth-Tokens | *Zufälliger String in Prod* |
| `DISCORD_CLIENT_ID` | Discord Developer Portal Application ID | *Optional* |
| `DISCORD_CLIENT_SECRET`| Discord Developer Portal Secret | *Optional* |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 2.0 Client ID | *Optional* |
| `GOOGLE_CLIENT_SECRET`| Google Cloud Console Client Secret | *Optional* |

---

## Fehlerbehebung (Troubleshooting)

#### 1. "Microsoft Device Authentication Required"
* Der Bot wartet auf deine Freigabe. Öffne den Link `https://microsoft.com/devicelogin` und gib den angezeigten 8-stelligen Code ein.

#### 2. "Discord OAuth / Google OAuth nicht eingerichtet"
* Wenn du auf den Discord- oder Google-Button klickst und die Client-IDs in `.env` noch leer sind, zeigt HugoAFK eine informative Meldung an. Trage deine OAuth-Keys in `.env` ein oder nutze einfach die normale Registrierung mit Benutzername und Passwort.

#### 3. "Port 3001 oder 3000 belegt"
* Passe den Port in `.env` (`PORT=3002`) an. Next.js nutzt standardmäßig Port 3000 und leitet API-Aufrufe an den Backend-Port weiter.

---

## Lizenz
HugoAFK steht unter der MIT-Lizenz.
