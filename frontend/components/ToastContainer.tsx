'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDashboard();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-zinc-900/95 backdrop-blur-md shadow-2xl shadow-black/50 text-zinc-100 transition-all transform translate-y-0 opacity-100',
              isSuccess && 'border-emerald-500/40',
              isError && 'border-rose-500/40',
              isWarning && 'border-amber-500/40',
              !isSuccess && !isError && !isWarning && 'border-zinc-800'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <XCircle className="w-4 h-4 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1 text-sm min-w-0">
              <p className="font-semibold text-zinc-100 leading-tight">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed break-words">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              id={`toast-close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
