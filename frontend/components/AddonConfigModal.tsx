'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { X, Sliders, Check, HelpCircle } from 'lucide-react';
import { Addon } from '@/types';

interface ConfigFormProps {
  addon: Addon;
  clientId?: string;
  initialConfig: Record<string, any>;
  onClose: () => void;
  onSave: (addonId: string, config: Record<string, any>, clientId?: string) => void;
}

const AddonConfigForm: React.FC<ConfigFormProps> = ({
  addon,
  clientId,
  initialConfig,
  onClose,
  onSave,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialConfig);

  const handleFieldChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(addon.id, formValues, clientId);
  };

  return (
    <div
      id="addon-config-modal-content"
      className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-150 my-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-zinc-100">{addon.name}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                v{addon.version}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Configure parameters and routine limits</p>
          </div>
        </div>

        <button
          id="addon-config-close-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Config Fields */}
      <form onSubmit={handleSave} className="mt-5 space-y-4">
        {addon.configSchema.map((field) => {
          const currentValue =
            formValues[field.key] !== undefined
              ? formValues[field.key]
              : field.defaultValue;

          if (field.type === 'boolean') {
            return (
              <div
                key={field.key}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
              >
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block cursor-pointer">
                    {field.label}
                  </label>
                  {field.description && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{field.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleFieldChange(field.key, !currentValue)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentValue ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentValue ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          }

          return (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  {field.label}
                </label>
                {field.unit && (
                  <span className="text-[10px] text-zinc-400 font-mono">[{field.unit}]</span>
                )}
              </div>

              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={currentValue ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    field.key,
                    field.type === 'number'
                      ? parseFloat(e.target.value) || 0
                      : e.target.value
                  )
                }
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 font-mono transition-all"
              />

              {field.description && (
                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">{field.description}</p>
              )}
            </div>
          );
        })}

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-end gap-2.5">
          <button
            id="addon-config-cancel-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="addon-config-save-btn"
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export const AddonConfigModal: React.FC = () => {
  const { configModal, closeConfigModal, saveAddonConfig } = useDashboard();

  if (!configModal) return null;

  return (
    <div
      id="addon-config-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeConfigModal();
      }}
    >
      <AddonConfigForm
        key={`${configModal.addon.id}-${configModal.clientId || 'global'}`}
        addon={configModal.addon}
        clientId={configModal.clientId}
        initialConfig={configModal.currentConfig || {}}
        onClose={closeConfigModal}
        onSave={saveAddonConfig}
      />
    </div>
  );
};

