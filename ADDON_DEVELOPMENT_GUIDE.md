# HugoAFK - Addon Development Guide & AI Specification
> **Offizielle Spezifikation für Entwickler & Künstliche Intelligenz (ChatGPT, Claude, Gemini)**
> Entwickle Plug-and-Play Addons für das autonome HugoAFK Minecraft Bot-System – genau wie Spigot/Paper Plugins!

---

## 1. Übersicht & Plug-and-Play Prinzip

In **HugoAFK** funktioniert die Addon-Verwaltung wie bei einem Minecraft-Server:
1. Ein Ordner mit dem Addon-Namen wird in das Verzeichnis `/addons/` kopiert (oder im Dashboard hochgeladen).
2. Das System erkennt das Addon **automatisch in Echtzeit** (Hot-Reload ohne Server-Neustart).
3. Jeder Bot kann das Addon über das Web-Dashboard individuell aktivieren, deaktivieren und konfigurieren.

---

## 2. Ordnerstruktur eines Addons

Jedes Addon lebt in einem eigenen Unterordner in `/addons/<addon-id>/`:

```text
addons/
└── mein-cooles-addon/
    ├── addon.json        <-- Manifest (Metadaten, UI-Konfiguration) [PFLICHT]
    ├── index.js          <-- Ausführbarer Code (ESM / CJS)        [PFLICHT]
    └── README.md         <-- Dokumentation & Erklärung            [OPTIONAL]
```

---

## 3. Das Manifest: `addon.json`

Das `addon.json`-Manifest definiert, wie dein Addon im Dashboard dargestellt und konfiguriert wird:

```json
{
  "id": "auto-fisher",
  "name": "Auto Fisher Pro",
  "version": "1.0.0",
  "author": "DeinName",
  "description": "Automatisiertes Angeln mit automatischer Ruten-Erkennung und Fang-Statistiken.",
  "category": "Automation",
  "tags": ["Fishing", "XP", "Plug & Play"],
  "icon": "Fish",
  "entry": "index.js",
  "configSchema": [
    {
      "key": "autoReelDelayMs",
      "label": "Verzögerung nach Biss (ms)",
      "type": "number",
      "defaultValue": 250,
      "min": 50,
      "max": 1000,
      "unit": "ms",
      "description": "Wie viele Millisekunden nach dem Biss die Angel eingeholt wird."
    },
    {
      "key": "logCatches",
      "label": "Fänge im Dashboard protokollieren",
      "type": "boolean",
      "defaultValue": true
    },
    {
      "key": "mode",
      "label": "Angel-Modus",
      "type": "select",
      "defaultValue": "fast",
      "options": [
        { "label": "Schnell (Maximale XP)", "value": "fast" },
        { "label": "Schonend (Wenig Ruten-Verschleiß)", "value": "eco" }
      ]
    }
  ]
}
```

### Gültige Kategorien:
* `"Automation"` (z. B. Farmen, Angeln, Sortieren, Auto-Verkauf)
* `"Movement"` (z. B. Anti-AFK, Wegfindung, Parkour, Folgen)
* `"Utility"` (z. B. Auto-Respawn, Chat-Antworten, Reconnect)
* `"Management"` (z. B. Statistiken, Benachrichtigungen, Webhooks)

### Unterstützte UI-Feldtypen (`configSchema`):
| Typ | Beschreibung | Zusätzliche Eigenschaften |
| :--- | :--- | :--- |
| `boolean` | Ein-/Ausschalter (Toggle Switch) | `defaultValue: true/false` |
| `number` | Zahlen-Eingabefeld | `min`, `max`, `step`, `unit` (z. B. `"ms"`, `"s"`) |
| `slider` | Schieberegler | `min`, `max`, `step`, `unit` |
| `text` | Textzeile / Eingabefeld | `placeholder`, `description` |
| `select` | Dropdown-Auswahl | `options: [{ label, value }]` |

---

## 4. Der Addon-Code: `index.js`

Die `index.js` exportiert zwei Kernfunktionen:
1. `init(context)`: Wird aufgerufen, sobald ein Bot spawnt oder das Addon aktiviert wird.
2. `stop(context)`: Wird aufgerufen, wenn der Bot stoppt oder das Addon deaktiviert wird (Aufräumen von Timern/Listeners).

```javascript
/**
 * Beispiel Addon-Struktur
 */
let intervalTimer = null;

export async function init(context) {
  const { bot, clientName, logger, config, sendChat } = context;

  logger.info(`Addon gestartet für Bot: ${clientName}`);

  // Zugriff auf Mineflayer-Events
  bot.on('chat', (username, message) => {
    if (message === '!ping') {
      sendChat(`Pong! Bot ${clientName} ist online.`);
    }
  });

  // Wiederkehrende Aktionen
  intervalTimer = setInterval(() => {
    if (config.someSetting) {
      // Deine Logik hier
    }
  }, 5000);
}

export async function stop(context) {
  const { logger } = context;
  
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }

  logger.info('Addon sauber beendet.');
}

export default { init, stop };
```

---

## 5. Das `context`-Objekt (API-Referenz)

Jede `init`- und `stop`-Methode erhält das `context`-Objekt mit allen Werkzeugen:

| Eigenschaft | Typ | Beschreibung |
| :--- | :--- | :--- |
| `context.bot` | `MineflayerBot` | Die vollständige [Mineflayer](https://github.com/PrismarineJS/mineflayer) Bot-Instanz. |
| `context.clientName` | `string` | Der Minecraft-Name des Bots (z. B. `"HugoBot1"`). |
| `context.clientId` | `string` | Eindeutige interne Client-ID. |
| `context.logger` | `AddonLogger` | `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`. Schreibt live in die Dashboard-Konsole. |
| `context.config` | `object` | Die aktuellen Werte der in `addon.json` definierten Felder (z. B. `config.autoReelDelayMs`). |
| `context.sendChat(msg)` | `function` | Sendet eine Nachricht oder einen Serverbefehl (z. B. `sendChat("/sell all")`). |
| `context.saveConfig(cfg)` | `function` | Aktualisiert Konfigurationen zur Laufzeit persistent in SQLite. |

---

## 6. Wichtige Mineflayer-Methoden & Eigenschaften (`context.bot`)

* **Bewegung & Steuerung**:
  - `bot.setControlState('jump', true / false)`
  - `bot.setControlState('forward', true / false)`
  - `bot.lookAt(point)`
* **Interaktion & Hand**:
  - `bot.activateItem()` (z. B. Angel auswerfen, Bogen spannen, Essen)
  - `bot.deactivateItem()`
  - `bot.equip(item, destination)` (`'hand'`, `'head'`, `'torso'`, `'legs'`, `'feet'`)
  - `bot.attack(entity)`
* **Inventar & Items**:
  - `bot.inventory.items()` -> Gibt alle Items im Inventar zurück.
  - `bot.heldItem` -> Das aktuell gehaltene Item.
* **Events**:
  - `bot.on('chat', (username, message) => ...)`
  - `bot.on('health', () => ...)` (bot.health, bot.food)
  - `bot.on('entitySpawn', (entity) => ...)`
  - `bot.on('entityMoved', (entity) => ...)`
  - `bot.on('blockUpdate', (oldBlock, newBlock) => ...)`

---

## 7. KI-Prompts mit Platzhaltern (Für ChatGPT, Claude, Gemini)

Kopiere diese Vorlagen, fülle die Platzhalter aus und lasse deine KI das Addon komplett generieren!

### Vorlage 1: Universeller Addon-Generator

```text
Du bist ein erfahrener Minecraft Bot Entwickler für das HugoAFK Plug-and-Play Addon-System.
Erstelle mir ein vollständiges Addon bestehend aus ZWEI Dateien: "addon.json" und "index.js".

Hier sind die Anforderungen:
- Addon-Name: {{ADDON_NAME}}
- ID (slug): {{ADDON_ID}}
- Kategorie: {{CATEGORY}} (Automation / Movement / Utility / Management)
- Beschreibung: {{DESCRIPTION}}
- Funktionen:
{{FEATURES_AND_BEHAVIORS}}
- Konfigurierbare Parameter:
{{CONFIG_PARAMETERS}}

WICHTIGE REGELN:
1. addon.json muss valides JSON sein und configSchema mit passenden Typen (boolean, number, text, select) enthalten.
2. index.js muss ESM sein und "export async function init(context)" sowie "export async function stop(context)" exportieren.
3. Behandle alle Fehler sicher ab, damit der Bot niemals abstürzt (try-catch Blöcke).
4. Nutze context.logger.info / warn / error für Meldungen im Dashboard.
5. Räume alle Timer (setInterval) und Event-Listeners in stop(context) sauber auf.
```

### Vorlage 2: Automatisierter Farm-/Arbeits-Bot

```text
Erstelle ein HugoAFK Addon namens "{{ADDON_NAME}}".
Ziel: Der Bot soll in Minecraft automatisch {{FARMING_TARGET}} (z. B. Weizen ernten, Bäume fällen, Monster schlagen).

Konfiguration:
- Radius: {{RADIUS}} Blöcke
- Pause zwischen Aktionen: {{DELAY_MS}} ms
- Automatisches Nachpflanzen / Werkzeug-Wechsel: {{AUTO_REPLANT}}

Erstelle "addon.json" und "index.js" mit voller Fehlerbehandlung und Dashboard-Konfiguration.
```

### Vorlage 3: Chat-Befehle & Sicherheits-Guard

```text
Erstelle ein HugoAFK Addon namens "{{ADDON_NAME}}".
Ziel: Wenn ein feindlicher Spieler oder Mob näher als {{DISTANCE}} Blöcke an den Bot herantritt, soll der Bot:
1. {{ACTION_1}} (z. B. Alarm im Chat schlagen oder Schlagen)
2. Eine Warnung an den Besitzer senden.

Erstelle "addon.json" und "index.js" für das HugoAFK Plug-and-Play System.
```
