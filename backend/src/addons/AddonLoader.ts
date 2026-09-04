import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HugoAddon, AddonContext, AddonConfigField } from './types.js';

export interface AddonManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description: string;
  category?: 'Automation' | 'Movement' | 'Utility' | 'Management';
  tags?: string[];
  icon?: string;
  configSchema?: AddonConfigField[];
  entry?: string;
}

export class AddonLoader {
  private addonsDirectory: string;

  constructor() {
    this.addonsDirectory = this.resolveAddonsDir();
  }

  public getAddonsDirectory(): string {
    return this.addonsDirectory;
  }

  private resolveAddonsDir(): string {
    // 1. Explicit env var
    if (process.env.ADDONS_DIR && fs.existsSync(process.env.ADDONS_DIR)) {
      return path.resolve(process.env.ADDONS_DIR);
    }
    // 2. Relative from project root
    const candidate1 = path.resolve(process.cwd(), 'addons');
    if (fs.existsSync(candidate1)) return candidate1;

    // 3. Relative from backend folder (when cwd is backend)
    const candidate2 = path.resolve(process.cwd(), '../addons');
    if (fs.existsSync(candidate2)) return candidate2;

    // Fallback: create candidate1
    try {
      fs.mkdirSync(candidate1, { recursive: true });
    } catch {}
    return candidate1;
  }

  /**
   * Scans the addons/ directory and dynamically imports each plug-and-play addon.
   */
  public async loadAllExternalAddons(): Promise<Map<string, HugoAddon>> {
    const loadedAddons = new Map<string, HugoAddon>();
    const dir = this.resolveAddonsDir();

    if (!fs.existsSync(dir)) {
      return loadedAddons;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const folderPath = path.join(dir, entry.name);
      try {
        const addon = await this.loadSingleAddon(folderPath, entry.name);
        if (addon) {
          loadedAddons.set(addon.id, addon);
          console.log(`[AddonLoader] Loaded plug-and-play addon: ${addon.name} v${addon.version} (${addon.id})`);
        }
      } catch (err: any) {
        console.error(`[AddonLoader] Failed to load addon from folder "${entry.name}":`, err?.message || err);
      }
    }

    return loadedAddons;
  }

  /**
   * Loads a single addon from its directory.
   */
  public async loadSingleAddon(folderPath: string, folderName: string): Promise<HugoAddon | null> {
    const manifestPath = path.join(folderPath, 'addon.json');
    let manifest: AddonManifest;

    if (fs.existsSync(manifestPath)) {
      try {
        const content = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(content);
      } catch (e: any) {
        throw new Error(`Invalid addon.json in ${folderName}: ${e?.message}`);
      }
    } else {
      // Check package.json fallback
      const pkgPath = path.join(folderPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          manifest = {
            id: pkg.name || folderName,
            name: pkg.title || pkg.name || folderName,
            version: pkg.version || '1.0.0',
            author: typeof pkg.author === 'object' ? pkg.author?.name : pkg.author || 'Community',
            description: pkg.description || 'Plug-and-play custom addon',
            category: 'Utility',
            entry: pkg.main || 'index.js',
          };
        } catch {
          return null;
        }
      } else {
        // Not an external manifest-based addon (e.g. built-in addon source folder)
        return null;
      }
    }

    const addonId = manifest.id || folderName;

    // Resolve entry file
    const possibleEntries = [
      manifest.entry,
      'index.js',
      'index.mjs',
      'index.cjs',
      'main.js',
      'index.ts',
    ].filter(Boolean) as string[];

    let resolvedEntry: string | null = null;
    for (const candidate of possibleEntries) {
      const fullPath = path.join(folderPath, candidate);
      if (fs.existsSync(fullPath)) {
        resolvedEntry = fullPath;
        break;
      }
    }

    if (!resolvedEntry) {
      throw new Error(`No entry file found for addon "${addonId}". Expected one of: ${possibleEntries.join(', ')}`);
    }

    // Dynamic import with timestamp cache-busting for hot reload
    const fileUrl = `${pathToFileURL(resolvedEntry).href}?t=${Date.now()}`;
    const moduleExports = await import(fileUrl);

    // Support both ES Module default export and named exports
    const rawAddon = moduleExports.default || moduleExports;
    const initFn = rawAddon.init || moduleExports.init;
    const stopFn = rawAddon.stop || moduleExports.stop;

    if (typeof initFn !== 'function') {
      throw new Error(`Addon "${addonId}" entry "${path.basename(resolvedEntry)}" must export an "init(context)" function.`);
    }

    const finalAddon: HugoAddon = {
      id: addonId,
      name: manifest.name || addonId,
      version: manifest.version || '1.0.0',
      author: manifest.author || 'Community',
      description: manifest.description || 'Custom plug-and-play addon',
      category: manifest.category || 'Utility',
      tags: manifest.tags || ['Custom', 'Plug & Play'],
      icon: manifest.icon || 'Puzzle',
      configSchema: manifest.configSchema || [],
      isBuiltIn: false,
      init: async (context: AddonContext) => {
        try {
          await initFn(context);
        } catch (err: any) {
          context.logger.error(`[Runtime Error in ${manifest.name}]: ${err?.message || err}`);
        }
      },
      stop: async (context: AddonContext) => {
        if (typeof stopFn === 'function') {
          try {
            await stopFn(context);
          } catch (err: any) {
            context.logger.error(`[Error stopping ${manifest.name}]: ${err?.message || err}`);
          }
        }
      },
    };

    return finalAddon;
  }
}

export const addonLoader = new AddonLoader();
