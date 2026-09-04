'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConfirmDialog: React.FC = () => {
  const { confirmModal, closeConfirm } = useDashboard();

  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <div
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfirm();
      }}
    >
      <div
        id="confirm-dialog-modal"
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          id="confirm-dialog-close-btn"
          onClick={closeConfirm}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'p-2.5 rounded-xl border shrink-0',
              confirmModal.isDestructive
                ? 'bg-rose-950/40 text-rose-400 border-rose-900/40'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50'
            )}
          >
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-zinc-100">{confirmModal.title}</h3>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              {confirmModal.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            id="confirm-dialog-cancel-btn"
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg border border-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-dialog-submit-btn"
            type="button"
            onClick={() => {
              confirmModal.onConfirm();
            }}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-lg transition-colors shadow-sm',
              confirmModal.isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-zinc-100 hover:bg-white text-zinc-900'
            )}
          >
            {confirmModal.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
