'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Code2,
  BookOpen,
  Cpu,
  Layers,
} from 'lucide-react';

interface AiAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPresetForInstall?: (preset: { folderName: string; manifest: any; code: string }) => void;
}

export const AiAddonModal: React.FC<AiAddonModalProps> = ({ isOpen, onClose, onSelectPresetForInstall }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'docs' | 'examples'>('prompt');
  const [template, setTemplate] = useState('universal');
  const [addonName, setAddonName] = useState('MyCustomBotPlugin');
  const [addonDescription, setAddonDescription] = useState('Automatisches Einsammeln und Lagern von Erzen in Kisten.');
  const [category, setCategory] = useState('Automation');
  const [behaviors, setBehaviors] = useState('- Wenn Inventar voll ist, zur nächsten Kiste gehen\n- Items per Klick einlagern\n- Im Chat melden wenn Kiste voll ist');
  const [configParams, setConfigParams] = useState('- chestRadius: number (Standard: 15, Min: 5, Max: 50)\n- autoDeposit: boolean (Standard: true)\n- depositMessage: text (Standard: "Lagerung abgeschlossen")');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedPrompt = `Du bist ein erfahrener Minecraft Bot Entwickler für das HugoAFK Plug-and-Play Addon-System (Mineflayer Node.js).
Erstelle mir ein vollständiges, lauffähiges Addon bestehend aus ZWEI Dateien: "addon.json" und "index.js".

Hier sind die Anforderungen:
- Addon-Name: ${addonName}
- ID (Slug): ${addonName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
- Kategorie: ${category} (Automation / Movement / Utility / Management)
- Beschreibung: ${addonDescription}
- Gewünschtes Bot-Verhalten & Features:
${behaviors}
- Konfigurierbare Parameter im Dashboard:
${configParams}

WICHTIGE HUGOAFK REGELN:
1. "addon.json" muss valides JSON sein mit:
   - "id", "name", "version": "1.0.0", "author", "description", "category", "entry": "index.js"
   - "configSchema": Array von Feldern mit key, label, type (boolean/number/text/select), defaultValue, min, max, unit
2. "index.js" muss ein ES-Modul sein und zwingend exportieren:
   - "export async function init(context) { ... }"
   - "export async function stop(context) { ... }"
   - "export default { init, stop };"
3. Im context-Objekt stehen zur Verfügung:
   - context.bot: Die Mineflayer Bot Instanz (bot.chat, bot.equip, bot.activateItem, bot.entity, bot.inventory)
   - context.clientName: Der Name des Bots
   - context.logger: logger.info, logger.warn, logger.error, logger.debug
   - context.config: Das Live-Konfigurationsobjekt mit allen Werten aus dem configSchema
   - context.sendChat(msg): Sendet Chat/Befehle
4. Sichere Fehlerbehandlung: Jede Aktion in try-catch kapseln, damit der Bot niemals abstürzt!
5. In stop(context) alle Intervalle (clearInterval) und Event-Listeners sauber entfernen.

Gib mir den vollständigen Dateiinhalt für beide Dateien aus.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    if (val === 'universal') {
      setAddonName('MyCustomPlugin');
      setAddonDescription('Allgemeines Plug-and-Play Addon mit Konfiguration.');
      setCategory('Utility');
      setBehaviors('- Überwacht Chat auf Befehle\n- Reagiert auf Events\n- Sendet Statusmeldungen');
      setConfigParams('- enableFeature: boolean (Standard: true)\n- delayMs: number (Standard: 1000, Min: 100, Max: 5000)');
    } else if (val === 'fisher') {
      setAddonName('AutoFisherElite');
      setAddonDescription('Automatisches Angeln mit Haltbarkeits-Schutz und Fang-Zähler.');
      setCategory('Automation');
      setBehaviors('- Rüstet Angelrute automatisch aus\n- Wirft ins Wasser aus\n- Holt bei Biss sofort ein\n- Wechselt Rute bevor sie zerbricht');
      setConfigParams('- autoReelDelayMs: number (Standard: 200, Min: 50, Max: 800)\n- switchRodDurability: number (Standard: 5, Min: 2, Max: 20)\n- notifyDiscord: boolean (Standard: false)');
    } else if (val === 'guard') {
      setAddonName('MobGuardSentry');
      setAddonDescription('Wachturm-Modus: Greift herannahende feindliche Mobs automatisch an.');
      setCategory('Movement');
      setBehaviors('- Scannt Umgebung nach Monstern (Zombies, Skelette, Creeper)\n- Schlägt mit bestem Schwert zu\n- Weicht Creepern aus\n- Meldet Angriffe im Log');
      setConfigParams('- attackRadius: number (Standard: 4, Min: 2, Max: 6)\n- attackCreeper: boolean (Standard: false)\n- healBelowHealth: number (Standard: 10, Min: 5, Max: 18)');
    } else if (val === 'chat') {
      setAddonName('ClanChatBridge');
      setAddonDescription('Interaktiver Chat-Bot für Clan-Mitglieder und Besucher.');
      setCategory('Utility');
      setBehaviors('- Erkennt Keywords wie !help, !stats, !discord\n- Sendet konfigurierte Antworten\n- Cooldown pro Spieler');
      setConfigParams('- triggerWord: text (Standard: "!hugo")\n- welcomeMessage: text (Standard: "Willkommen auf dem Server!")\n- cooldownSeconds: number (Standard: 5, Min: 1, Max: 60)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>AI Addon Generator & Prompts</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded-full">
                  Plug & Play
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Generiere sofort einsatzbereite Minecraft Bot-Addons mit ChatGPT, Claude oder Gemini.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pb-3 border-b border-zinc-850 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'prompt'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prompt Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'docs'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>API Cheat-Sheet</span>
          </button>
        </div>

        {/* Tab 1: Prompt Generator */}
        {activeTab === 'prompt' && (
          <div className="mt-4 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Vorlage wählen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'universal', label: 'Universell' },
                  { id: 'fisher', label: 'Auto-Angeln' },
                  { id: 'guard', label: 'Mob-Wache' },
                  { id: 'chat', label: 'Chat-Befehle' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tpl.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      template === tpl.id
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 shadow-sm'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">Addon Name</label>
                <input
                  type="text"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Kategorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Automation">Automation</option>
                  <option value="Movement">Movement</option>
                  <option value="Utility">Utility</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Beschreibung</label>
              <input
                type="text"
                value={addonDescription}
                onChange={(e) => setAddonDescription(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Features & Bot-Verhalten
                </label>
                <textarea
                  rows={3}
                  value={behaviors}
                  onChange={(e) => setBehaviors(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Dashboard Config-Felder
                </label>
                <textarea
                  rows={3}
                  value={configParams}
                  onChange={(e) => setConfigParams(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Generated Prompt Preview */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fertiger Prompt für deine KI (ChatGPT, Claude, Gemini):</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopiert!' : 'Prompt kopieren'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
                {generatedPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: API Docs */}
        {activeTab === 'docs' && (
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <h4 className="text-xs font-bold text-emerald-400 mb-2">Plug-and-Play Ordnerstruktur</h4>
              <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                Erstelle einfach einen Ordner in <code className="text-zinc-200">addons/mein-addon/</code> mit zwei Dateien:
              </p>
              <div className="font-mono text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
                <div>addons/mein-addon/</div>
                <div className="ml-4 text-emerald-400">├── addon.json &nbsp;&nbsp;&lt;-- Metadaten & Config-Felder</div>
                <div className="ml-4 text-blue-400">└── index.js &nbsp;&nbsp;&nbsp;&nbsp;&lt;-- export async function init(context) / stop(context)</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <h4 className="text-xs font-bold text-zinc-200 mb-2">Verfügbare Werkzeuge in `context`</h4>
              <ul className="text-xs space-y-2 text-zinc-400">
                <li><strong className="text-zinc-200 font-mono">context.bot</strong>: Volle Mineflayer-Instanz (<code className="text-emerald-300">bot.chat()</code>, <code className="text-emerald-300">bot.equip()</code>, <code className="text-emerald-300">bot.inventory</code>, <code className="text-emerald-300">bot.on(&apos;chat&apos;)</code>)</li>
                <li><strong className="text-zinc-200 font-mono">context.logger</strong>: Live Dashboard Logging (<code className="text-emerald-300">logger.info()</code>, <code className="text-emerald-300">logger.warn()</code>, <code className="text-emerald-300">logger.error()</code>)</li>
                <li><strong className="text-zinc-200 font-mono">context.config</strong>: Die Live-Konfigurationswerte aus dem Web-Dashboard</li>
                <li><strong className="text-zinc-200 font-mono">context.sendChat(msg)</strong>: Sendet Chat-Nachrichten oder Server-Befehle</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
