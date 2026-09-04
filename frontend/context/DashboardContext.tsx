'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MinecraftClient,
  Addon,
  ServerNode,
  UserAccount,
  AppSettings,
  ToastMessage,
  ConfirmModalState,
  ConfigModalState,
  ViewType,
  ClientDetailTab,
  ClientStatus,
  ClientChatMessage,
  ClientLogEntry,
  InventoryItem,
  ClientPosition,
} from '@/types';
import { getTranslation } from '@/lib/translations';
import { api } from '@/services/api';

interface DashboardContextType {
  clients: MinecraftClient[];
  selectedClient: MinecraftClient | null;
  addons: Addon[];
  nodes: ServerNode[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  activeView: ViewType;
  activeTab: ClientDetailTab;
  settings: AppSettings;
  toasts: ToastMessage[];
  isCreateModalOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isMobileNavOpen: boolean;
  configModal: ConfigModalState | null;
  installModalAddon: Addon | null;
  confirmModal: ConfirmModalState | null;

  globalLogs: ClientLogEntry[];
  clearGlobalLogs: () => void;

  // View Navigation
  setActiveView: (view: ViewType, clientId?: string) => void;
  setActiveTab: (tab: ClientDetailTab) => void;
  setSelectedClientId: (id: string | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
  setIsMobileNavOpen: (open: boolean) => void;

  // Modals & Popups
  openConfigModal: (addon: Addon, clientId?: string, currentConfig?: Record<string, any>) => void;
  closeConfigModal: () => void;
  openInstallModal: (addon: Addon) => void;
  closeInstallModal: () => void;
  openConfirm: (config: {
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  closeConfirm: () => void;
  addToast: (
    title: string,
    description?: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  removeToast: (id: string) => void;

  // Preferences
  toggleTheme: () => void;
  setLanguage: (lang: 'de' | 'en') => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  t: (key: string) => string;

  // Client Management
  createClient: (data: Partial<MinecraftClient>) => Promise<MinecraftClient>;
  startClient: (id: string) => Promise<void>;
  stopClient: (id: string) => Promise<void>;
  restartClient: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  sendClientChat: (id: string, message: string) => Promise<void>;
  clearClientLogs: (id: string) => Promise<void>;
  assignClientOwner: (clientId: string, userId: string) => Promise<void>;

  // Addon Management
  installAddonToClients: (addonId: string, clientIds: string[]) => Promise<void>;
  uninstallAddonFromClient: (addonId: string, clientId: string) => Promise<void>;
  toggleClientAddon: (arg1: string, arg2: string, arg3?: boolean) => Promise<void>;
  saveAddonConfig: (
    addonId: string,
    config: Record<string, any>,
    clientId?: string
  ) => Promise<void>;

  // Auth
  login: (usernameOrEmail: string, password?: string) => Promise<boolean>;
  register: (username: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  loginWithGoogle: () => void;
  loginWithDiscord: () => void;
  switchUser: (userId: string) => Promise<void>;

  // Node Administration
  toggleNodeMaintenance: (id: string) => Promise<void>;
  restartNodeDaemon: (id: string) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  addNode: (nodeData: Partial<ServerNode>) => Promise<void>;

  // User Administration
  toggleUserRole: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  updateUserQuota: (id: string, quota: number) => Promise<void>;

  // Fleet Control & Admin Hub
  sendFleetCommand: (command: string) => Promise<{ success: boolean; botsReached: number; command: string }>;
  emergencyStopAll: () => Promise<{ success: boolean; botsStopped: number }>;
  startAllBots: () => Promise<{ success: boolean; botsStarting: number }>;
  restartAllBots: () => Promise<{ success: boolean; botsRestarting: number }>;
  getSystemStats: () => Promise<any>;
  vacuumDatabase: () => Promise<{ success: boolean; message: string }>;
  clearSystemLogs: (all?: boolean) => Promise<{ success: boolean }>;
  getAuditLogs: () => Promise<any>;
  broadcastAnnouncement: (message: string, level?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'de',
  refreshInterval: 5,
  autoScrollLogs: true,
  desktopAlerts: true,
  compactMode: false,
  showCoordinates: true,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<MinecraftClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [nodes, setNodes] = useState<ServerNode[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<ClientDetailTab>('overview');

  const handleSetActiveView = useCallback((view: ViewType, clientId?: string) => {
    setActiveView(view);
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, []);

  const globalLogs: ClientLogEntry[] = clients
    .flatMap((c) => (c.logs || []).map((l) => ({ ...l, clientName: c.name })))
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  const clearGlobalLogs = () => {
    setClients((prev) => prev.map((c) => ({ ...c, logs: [] })));
    addToast(settings.language === 'de' ? 'Logs geleert' : 'Logs cleared', undefined, 'info');
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hugoafk_settings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          // ignore
        }
      }
    }
    return defaultSettings;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [configModal, setConfigModal] = useState<ConfigModalState | null>(null);
  const [installModalAddon, setInstallModalAddon] = useState<Addon | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const popupShownRef = useRef<Set<string>>(new Set());

  // Toast Helper
  const addToast = useCallback(
    (title: string, description?: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Translation function
  const t = useCallback(
    (key: string) => {
      return getTranslation(settings.language, key);
    },
    [settings.language]
  );

  // Check URL parameters for OAuth callbacks (e.g. ?token=... or ?error=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('hugoafk_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      addToast(
        settings.language === 'de' ? 'Erfolgreich angemeldet' : 'Signed in successfully',
        settings.language === 'de' ? 'Willkommen zurück!' : 'Welcome back!',
        'success'
      );
      loadCurrentUser();
    } else if (error) {
      window.history.replaceState({}, document.title, window.location.pathname);
      let msg = error;
      if (error === 'discord_oauth_not_configured') {
        msg =
          settings.language === 'de'
            ? 'Discord OAuth ist noch nicht eingerichtet. Bitte DISCORD_CLIENT_ID und DISCORD_CLIENT_SECRET in der .env Datei angeben.'
            : 'Discord OAuth is not configured. Please supply DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env.';
      } else if (error === 'google_oauth_not_configured') {
        msg =
          settings.language === 'de'
            ? 'Google OAuth ist noch nicht eingerichtet. Bitte GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in der .env Datei angeben.'
            : 'Google OAuth is not configured. Please supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.';
      }
      addToast(
        settings.language === 'de' ? 'Authentifizierungsfehler' : 'Authentication Error',
        msg,
        'error'
      );
    }
  }, [addToast, settings.language]);

  // Load current user from token
  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await api.auth.me();
      if (res && res.user) {
        setCurrentUser(res.user);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Load all initial data once user is logged in
  // Track whether this is the first load (full replace) vs subsequent syncs (merge)
  const isInitialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [clientsRes, addonsRes, nodesRes, usersRes] = await Promise.allSettled([
        api.clients.getAll(),
        api.addons.getAll(),
        api.nodes.getAll(),
        api.auth.getUsers(),
      ]);

      if (clientsRes.status === 'fulfilled') {
        const apiClients = clientsRes.value.clients || [];

        if (!isInitialLoadDone.current) {
          // First load: use API data directly
          setClients(apiClients);
          isInitialLoadDone.current = true;
        } else {
          // Subsequent syncs: merge API data with live WebSocket state
          setClients((prev) => {
            const prevMap = new Map(prev.map((c) => [c.id, c]));

            // Merge each API client with existing live state
            const merged = apiClients.map((apiClient) => {
              const existing = prevMap.get(apiClient.id);
              if (!existing) return apiClient;

              // Keep live status from WebSocket if the bot is actively running
              // The API returns status from DB which may lag behind real-time WebSocket updates
              const liveStatuses = ['online', 'starting', 'reconnecting'];
              const keepLiveStatus =
                liveStatuses.includes(existing.status) && apiClient.status !== 'online';
              const status = keepLiveStatus ? existing.status : apiClient.status;

              // Merge logs: combine API logs with any newer WebSocket logs
              const apiLogIds = new Set(apiClient.logs.map((l) => l.id));
              const newWsLogs = existing.logs.filter((l) => !apiLogIds.has(l.id));
              const mergedLogs = [...apiClient.logs, ...newWsLogs].slice(-300);

              // Merge chat: combine API chat with any newer WebSocket chat messages
              const apiChatIds = new Set(apiClient.chatHistory.map((m) => m.id));
              const newWsChat = existing.chatHistory.filter((m) => !apiChatIds.has(m.id));
              const mergedChat = [...apiClient.chatHistory, ...newWsChat].slice(-200);

              // Keep live inventory if the bot is online (API may return stale/empty)
              const inventory =
                existing.status === 'online' && existing.inventory.length > 0
                  ? existing.inventory
                  : apiClient.inventory;

              // Keep live stats (ping, health, food, runtime) from WebSocket if online
              const keepLiveStats = existing.status === 'online';

              return {
                ...apiClient,
                status,
                logs: mergedLogs,
                chatHistory: mergedChat,
                inventory,
                ...(keepLiveStats && {
                  ping: existing.ping || apiClient.ping,
                  health: existing.health ?? apiClient.health,
                  food: existing.food ?? apiClient.food,
                  runtimeSeconds: Math.max(existing.runtimeSeconds || 0, apiClient.runtimeSeconds || 0),
                  position: existing.position || apiClient.position,
                }),
                // Always preserve deviceCode from WebSocket
                deviceCode: existing.deviceCode || apiClient.deviceCode,
              };
            });

            return merged;
          });
        }
      }
      if (addonsRes.status === 'fulfilled') {
        setAddons(addonsRes.value.addons || []);
      }
      if (nodesRes.status === 'fulfilled') {
        setNodes(nodesRes.value.nodes || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.users || []);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic background sync: keeps dashboard in sync but at a slower rate
  // since WebSocket handles real-time updates. This is a fallback for missed events.
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, loadData]);

  // Socket.IO setup for live client updates
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('hugoafk_token');
    
    // Connect to backend websocket gateway.
    // Using polling first ensures immediate connection through Next.js rewrites,
    // then seamlessly upgrades to websocket if the network allows.
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('client:status', ({ clientId, status }: { clientId: string; status: ClientStatus }) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, status, ...(status === 'online' ? { deviceCode: null } : {}) }
            : c
        )
      );
    });

    socket.on('client:update', (updatedClient: MinecraftClient) => {
      setClients((prev) =>
        prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
      );
    });

    socket.on('client:chat', (chatMsg: ClientChatMessage) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === chatMsg.clientId) {
            return {
              ...c,
              chatHistory: [...c.chatHistory.slice(-199), chatMsg],
            };
          }
          return c;
        })
      );
    });

    socket.on('client:log', (logEntry: ClientLogEntry) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === logEntry.clientId) {
            return {
              ...c,
              logs: [...c.logs.slice(-299), logEntry],
            };
          }
          return c;
        })
      );
    });

    socket.on('client:inventory', ({ clientId, inventory }: { clientId: string; inventory: InventoryItem[] }) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, inventory } : c))
      );
    });

    socket.on('client:position', ({ clientId, position }: { clientId: string; position: ClientPosition }) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, position } : c))
      );
    });

    socket.on('client:stats', ({ clientId, ping, health, food, runtimeSeconds }: any) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              ...(ping !== undefined && { ping }),
              ...(health !== undefined && { health }),
              ...(food !== undefined && { food }),
              ...(runtimeSeconds !== undefined && { runtimeSeconds }),
            };
          }
          return c;
        })
      );
    });

    socket.on('client:device_code', ({ clientId, message, url, code, directUrl }: any) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, status: 'starting', deviceCode: { url, code, directUrl } }
            : c
        )
      );

      const targetUrl = directUrl || `https://www.microsoft.com/link?otc=${code}`;
      openConfirm({
        title: '🔑 Microsoft-Anmeldung erforderlich!',
        description: `Der Bot wartet auf deine einmalige Anmeldung bei Microsoft.\n\nCode: ${code}\n\nKlicke auf "Auf Microsoft anmelden", um den Login im Browser zu bestätigen. Sobald du eingeloggt bist, verbindet sich der Bot sofort automatisch!`,
        confirmLabel: 'Auf Microsoft anmelden',
        onConfirm: () => {
          window.open(targetUrl, '_blank');
        },
      });
    });

    socket.on('client:kicked', ({ clientId, clientName, reason }: any) => {
      let cleanReason = reason;
      try {
        if (typeof reason === 'string' && (reason.startsWith('{') || reason.startsWith('['))) {
          const parsed = JSON.parse(reason);
          cleanReason = parsed.text || parsed.extra?.map((e: any) => e.text).join('') || reason;
        }
      } catch {}

      addToast(
        settings.language === 'de' ? `Vom Server gekickt: ${clientName || 'Bot'}` : `Kicked from server: ${clientName || 'Bot'}`,
        cleanReason,
        'error'
      );
    });

    socket.on('client:error', ({ clientId, clientName, error }: any) => {
      addToast(
        settings.language === 'de' ? `Bot-Fehler: ${clientName || 'Bot'}` : `Bot error: ${clientName || 'Bot'}`,
        error,
        'error'
      );
    });

    socket.on('admin:announcement', ({ message, level, author }: any) => {
      addToast(
        author ? `Admin: ${author}` : 'System Alert',
        message,
        level === 'emergency' ? 'error' : level === 'warning' ? 'warning' : 'info'
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, addToast, settings.language]);

  // Selected client computed object
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;

  // Settings & Theme
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('hugoafk_settings', JSON.stringify(updated));
        if (updated.theme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      }
      return updated;
    });
    api.settings.save({ ...settings, ...newSettings }).catch(() => {});
  }, [settings]);

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
  }, [settings.theme, updateSettings]);

  const setLanguage = useCallback(
    (lang: 'de' | 'en') => {
      updateSettings({ language: lang });
    },
    [updateSettings]
  );

  // Auth Operations
  const login = async (usernameOrEmail: string, password?: string): Promise<boolean> => {
    try {
      const res = await api.auth.login({ usernameOrEmail, password });
      if (res && res.token) {
        localStorage.setItem('hugoafk_token', res.token);
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        addToast(
          settings.language === 'de' ? 'Angemeldet' : 'Signed in',
          `${settings.language === 'de' ? 'Willkommen' : 'Welcome'}, ${res.user.username}!`,
          'success'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Anmeldung fehlgeschlagen' : 'Login failed',
        err.message || 'Ungültige Anmeldedaten',
        'error'
      );
      return false;
    }
  };

  const register = async (username: string, email: string, password?: string): Promise<boolean> => {
    try {
      const res = await api.auth.register({ username, email, password });
      if (res && res.token) {
        localStorage.setItem('hugoafk_token', res.token);
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        addToast(
          settings.language === 'de' ? 'Konto erstellt' : 'Account created',
          `${settings.language === 'de' ? 'Willkommen' : 'Welcome'}, ${res.user.username}!`,
          'success'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed',
        err.message || 'Fehler beim Erstellen des Kontos',
        'error'
      );
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('hugoafk_token');
    api.auth.logout();
    setCurrentUser(null);
    addToast(
      settings.language === 'de' ? 'Abgemeldet' : 'Logged out',
      settings.language === 'de' ? 'Auf Wiedersehen!' : 'See you soon!',
      'info'
    );
  };

  const loginWithGoogle = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/google';
    }
  };

  const loginWithDiscord = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/discord';
    }
  };

  const switchUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addToast(
        settings.language === 'de' ? 'Benutzer gewechselt' : 'User switched',
        `${target.username} (${target.role})`,
        'info'
      );
    }
  };

  // Client Operations
  const createClient = async (data: Partial<MinecraftClient>): Promise<MinecraftClient> => {
    try {
      const res = await api.clients.create(data);
      const newClient = res.client;
      setClients((prev) => [newClient, ...prev]);
      setIsCreateModalOpen(false);
      setSelectedClientId(newClient.id);
      addToast(
        settings.language === 'de' ? 'Client erstellt' : 'Client created',
        `${newClient.name} (${newClient.server})`,
        'success'
      );
      return newClient;
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Fehler beim Erstellen' : 'Creation failed',
        err.message,
        'error'
      );
      throw err;
    }
  };

  const startClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'starting' } : c))
    );
    try {
      const res = await api.clients.start(id);
      if (res?.client) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...res.client } : c))
        );
      }
      addToast(
        settings.language === 'de' ? 'Bot wird gestartet' : 'Bot starting',
        `${res?.client?.name || client?.name || id} verbindet sich...`,
        'info'
      );
    } catch (err: any) {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'offline' } : c))
      );
      addToast(
        settings.language === 'de' ? 'Start fehlgeschlagen' : 'Failed to start',
        err.message,
        'error'
      );
    }
  };

  const stopClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'stopped' } : c))
    );
    try {
      await api.clients.stop(id);
      addToast(
        settings.language === 'de' ? 'Bot gestoppt' : 'Bot stopped',
        `${client?.name || id} getrennt.`,
        'info'
      );
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Stop fehlgeschlagen' : 'Failed to stop',
        err.message,
        'error'
      );
    }
  };

  const restartClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'starting' } : c))
    );
    try {
      await api.clients.restart(id);
      addToast(
        settings.language === 'de' ? 'Bot wird neu gestartet' : 'Restarting bot',
        `${client?.name || id}...`,
        'info'
      );
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Neustart fehlgeschlagen' : 'Restart failed',
        err.message,
        'error'
      );
    }
  };

  const deleteClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    openConfirm({
      title: settings.language === 'de' ? 'Client wirklich löschen?' : 'Delete Client?',
      description:
        settings.language === 'de'
          ? `Möchtest du "${client?.name || id}" und alle zugehörigen Daten wirklich löschen?`
          : `Are you sure you want to permanently delete "${client?.name || id}"?`,
      confirmLabel: settings.language === 'de' ? 'Unwiderruflich löschen' : 'Delete permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.clients.delete(id);
          setClients((prev) => prev.filter((c) => c.id !== id));
          if (selectedClientId === id) {
            setSelectedClientId(null);
          }
          closeConfirm();
          addToast(
            settings.language === 'de' ? 'Client gelöscht' : 'Client deleted',
            `${client?.name || id} wurde entfernt.`,
            'info'
          );
        } catch (err: any) {
          addToast(
            settings.language === 'de' ? 'Löschen fehlgeschlagen' : 'Delete failed',
            err.message,
            'error'
          );
        }
      },
    });
  };

  const sendClientChat = async (id: string, message: string) => {
    try {
      await api.clients.sendChat(id, message);
    } catch (err: any) {
      addToast(
        settings.language === 'de' ? 'Nachricht fehlgeschlagen' : 'Message failed',
        err.message,
        'error'
      );
    }
  };

  const clearClientLogs = async (id: string) => {
    try {
      await api.clients.clearLogs(id);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, logs: [] } : c))
      );
      addToast(
        settings.language === 'de' ? 'Logs geleert' : 'Logs cleared',
        undefined,
        'info'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const assignClientOwner = async (clientId: string, userId: string) => {
    try {
      const res = await api.clients.assignOwner(clientId, userId);
      setClients((prev) => prev.map((c) => (c.id === clientId ? res.client : c)));
      addToast(
        settings.language === 'de' ? 'Besitzer zugewiesen' : 'Owner Assigned',
        settings.language === 'de'
          ? `Bot wurde erfolgreich ${res.client.ownerUsername || 'dem Nutzer'} zugewiesen.`
          : `Bot successfully assigned to ${res.client.ownerUsername || 'user'}.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  // Addon Operations
  const installAddonToClients = async (addonId: string, clientIds: string[]) => {
    try {
      await api.addons.install(addonId, clientIds);
      closeInstallModal();
      loadData();
      addToast(
        settings.language === 'de' ? 'Addon installiert' : 'Addon installed',
        `${addonId} auf ${clientIds.length} Client(s) installiert.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const uninstallAddonFromClient = async (addonId: string, clientId: string) => {
    try {
      await api.addons.uninstall(addonId, clientId);
      loadData();
      addToast(
        settings.language === 'de' ? 'Addon deinstalliert' : 'Addon uninstalled',
        undefined,
        'info'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const toggleClientAddon = async (arg1: string, arg2: string, arg3?: boolean) => {
    let clientId = arg1;
    let addonId = arg2;
    let enabled = arg3;

    if (addons.some((a) => a.id === arg1)) {
      addonId = arg1;
      clientId = arg2;
    }

    const client = clients.find((c) => c.id === clientId);
    if (client && enabled === undefined) {
      const existing = client.activeAddons.find((a) => a.addonId === addonId);
      enabled = existing ? !existing.enabled : true;
    }
    if (enabled === undefined) enabled = true;

    try {
      await api.addons.toggle(addonId, clientId, enabled);
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              activeAddons: c.activeAddons.map((a) =>
                a.addonId === addonId ? { ...a, enabled } : a
              ),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const saveAddonConfig = async (
    addonId: string,
    config: Record<string, any>,
    clientId?: string
  ) => {
    try {
      await api.addons.saveConfig(addonId, config, clientId);
      closeConfigModal();
      loadData();
      addToast(
        settings.language === 'de' ? 'Konfiguration gespeichert' : 'Configuration saved',
        `${addonId} wurde aktualisiert.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Modal Triggers
  const openConfigModal = (addon: Addon, clientId?: string, currentConfig?: Record<string, any>) => {
    setConfigModal({ addon, clientId, currentConfig: currentConfig || {} });
  };

  const closeConfigModal = () => {
    setConfigModal(null);
  };

  const openInstallModal = (addon: Addon) => {
    setInstallModalAddon(addon);
  };

  const closeInstallModal = () => {
    setInstallModalAddon(null);
  };

  const openConfirm = (config: {
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: config.title,
      description: config.description,
      confirmLabel: config.confirmLabel,
      isDestructive: config.isDestructive,
      onConfirm: config.onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
  };

  // Node Admin Operations
  const toggleNodeMaintenance = async (id: string) => {
    try {
      const res = await api.nodes.toggleMaintenance(id);
      setNodes((prev) => prev.map((n) => (n.id === id ? res.node : n)));
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const restartNodeDaemon = async (id: string) => {
    try {
      await api.nodes.restart(id);
      addToast('Node Daemon restarted', `Node ${id} re-initialized.`, 'info');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const deleteNode = async (id: string) => {
    try {
      await api.nodes.delete(id);
      setNodes((prev) => prev.filter((n) => n.id !== id));
      addToast('Node removed', undefined, 'info');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const addNode = async (nodeData: Partial<ServerNode>) => {
    try {
      const res = await api.nodes.add(nodeData);
      setNodes((prev) => [...prev, res.node]);
      addToast('Node added', `${res.node.name} connected.`, 'success');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // User Admin Operations
  const toggleUserRole = async (id: string) => {
    try {
      const res = await api.auth.toggleRole(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const res = await api.auth.toggleStatus(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const updateUserQuota = async (id: string, quota: number) => {
    try {
      const res = await api.auth.updateQuota(id, quota);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.user : u)));
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Fleet & Admin Hub Methods
  const sendFleetCommand = async (command: string) => {
    try {
      const res = await api.admin.sendFleetCommand(command);
      addToast(
        settings.language === 'de' ? 'Flotten-Befehl gesendet' : 'Fleet Command Executed',
        settings.language === 'de'
          ? `Befehl an ${res.botsReached} aktive Bots gesendet.`
          : `Sent to ${res.botsReached} active bots.`,
        'success'
      );
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const emergencyStopAll = async () => {
    try {
      const res = await api.admin.emergencyStopAll();
      addToast(
        settings.language === 'de' ? 'Notfall-Stopp ausgeführt!' : 'Emergency Stop Executed!',
        settings.language === 'de'
          ? `Alle ${res.botsStopped} Bots wurden sofort gestoppt.`
          : `All ${res.botsStopped} bots stopped.`,
        'warning'
      );
      setClients((prev) => prev.map((c) => ({ ...c, status: 'stopped' })));
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const startAllBots = async () => {
    try {
      const res = await api.admin.startAllBots();
      addToast(
        settings.language === 'de' ? 'Flotten-Start initiiert' : 'Fleet Start Initiated',
        settings.language === 'de'
          ? `${res.botsStarting} Bots werden gestartet.`
          : `Starting ${res.botsStarting} bots.`,
        'info'
      );
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const restartAllBots = async () => {
    try {
      const res = await api.admin.restartAllBots();
      addToast(
        settings.language === 'de' ? 'Flotten-Neustart' : 'Fleet Restart',
        settings.language === 'de'
          ? `${res.botsRestarting} Bots werden neu gestartet.`
          : `Restarting ${res.botsRestarting} bots.`,
        'info'
      );
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const getSystemStats = async () => {
    return api.admin.getSystemStats();
  };

  const vacuumDatabase = async () => {
    try {
      const res = await api.admin.vacuumDatabase();
      addToast(
        settings.language === 'de' ? 'Datenbank optimiert' : 'Database Optimized',
        settings.language === 'de' ? 'SQLite VACUUM erfolgreich durchgeführt.' : 'SQLite VACUUM executed successfully.',
        'success'
      );
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const clearSystemLogs = async (all?: boolean) => {
    try {
      const res = await api.admin.clearSystemLogs(all);
      addToast(
        settings.language === 'de' ? 'Logs bereinigt' : 'Logs Purged',
        settings.language === 'de' ? 'System- & Client-Logs wurden bereinigt.' : 'Logs cleared.',
        'info'
      );
      return res;
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  const getAuditLogs = async () => {
    return api.admin.getAuditLogs();
  };

  const broadcastAnnouncement = async (message: string, level?: string) => {
    try {
      await api.admin.broadcastAnnouncement(message, level);
      addToast(
        settings.language === 'de' ? 'Durchsage gesendet' : 'Announcement Broadcasted',
        message,
        'success'
      );
    } catch (err: any) {
      addToast('Error', err.message, 'error');
      throw err;
    }
  };

  useEffect(() => {
    const waitingClient = clients.find(c => c.deviceCode && !popupShownRef.current.has(c.deviceCode.code));
    if (waitingClient && waitingClient.deviceCode) {
      popupShownRef.current.add(waitingClient.deviceCode.code);
      const code = waitingClient.deviceCode.code;
      const targetUrl = waitingClient.deviceCode.directUrl || `https://www.microsoft.com/link?otc=${code}`;
      
      openConfirm({
        title: '🔑 Microsoft-Anmeldung erforderlich!',
        description: `Der Bot "${waitingClient.name}" wartet auf deine einmalige Anmeldung bei Microsoft.\n\nCode: ${code}\n\nKlicke auf "Auf Microsoft anmelden", um den Login im Browser zu bestätigen. Sobald du eingeloggt bist, verbindet sich der Bot sofort automatisch!`,
        confirmLabel: 'Auf Microsoft anmelden',
        onConfirm: () => {
          window.open(targetUrl, '_blank');
        },
      });
    }
  }, [clients]);

  return (
    <DashboardContext.Provider
      value={{
        clients,
        selectedClient,
        addons,
        nodes,
        users,
        currentUser,
        activeView,
        activeTab,
        settings,
        toasts,
        globalLogs,
        clearGlobalLogs,
        isCreateModalOpen,
        isAuthModalOpen,
        authModalMode,
        isMobileNavOpen,
        configModal,
        installModalAddon,
        confirmModal,
        setActiveView: handleSetActiveView,
        setActiveTab,
        setSelectedClientId,
        setIsCreateModalOpen,
        setIsAuthModalOpen,
        setAuthModalMode,
        setIsMobileNavOpen,
        openConfigModal,
        closeConfigModal,
        openInstallModal,
        closeInstallModal,
        openConfirm,
        closeConfirm,
        addToast,
        removeToast,
        toggleTheme,
        setLanguage,
        updateSettings,
        t,
        createClient,
        startClient,
        stopClient,
        restartClient,
        deleteClient,
        sendClientChat,
        clearClientLogs,
        assignClientOwner,
        installAddonToClients,
        uninstallAddonFromClient,
        toggleClientAddon,
        saveAddonConfig,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithDiscord,
        switchUser,
        toggleNodeMaintenance,
        restartNodeDaemon,
        deleteNode,
        addNode,
        toggleUserRole,
        toggleUserStatus,
        updateUserQuota,
        sendFleetCommand,
        emergencyStopAll,
        startAllBots,
        restartAllBots,
        getSystemStats,
        vacuumDatabase,
        clearSystemLogs,
        getAuditLogs,
        broadcastAnnouncement,
        refreshData: loadData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
