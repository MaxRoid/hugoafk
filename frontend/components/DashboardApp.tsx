'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/ToastContainer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MicrosoftAuthModal } from '@/components/MicrosoftAuthModal';
import { CreateClientModal } from '@/components/CreateClientModal';
import { AddonConfigModal } from '@/components/AddonConfigModal';
import { InstallAddonModal } from '@/components/InstallAddonModal';
import { AuthModal } from '@/components/AuthModal';

import { DashboardView } from '@/components/views/DashboardView';
import { ClientsView } from '@/components/views/ClientsView';
import { ClientDetailView } from '@/components/views/ClientDetailView';
import { AddonsView } from '@/components/views/AddonsView';
import { LogsView } from '@/components/views/LogsView';
import { SettingsView } from '@/components/views/SettingsView';
import { AdminNodesView } from '@/components/views/AdminNodesView';
import { LoginScreen } from '@/components/LoginScreen';

function DashboardAppContent() {
  const { activeView, currentUser } = useDashboard();

  if (!currentUser) {
    return (
      <div className="min-h-screen antialiased" suppressHydrationWarning>
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/25 selection:text-emerald-300"
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64 min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'clients' && <ClientsView />}
          {activeView === 'client-detail' && <ClientDetailView />}
          {activeView === 'addons' && <AddonsView />}
          {activeView === 'logs' && <LogsView />}
          {activeView === 'admin-nodes' && <AdminNodesView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CreateClientModal />
      <AddonConfigModal />
      <InstallAddonModal />
      <AuthModal />
      <ConfirmDialog />
      <MicrosoftAuthModal />
      <ToastContainer />
    </div>
  );
}

export default function DashboardApp() {
  return (
    <DashboardProvider>
      <DashboardAppContent />
    </DashboardProvider>
  );
}
