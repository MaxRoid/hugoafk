'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  indicatorColor?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'zinc';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtext,
  icon: Icon,
  indicatorColor = 'zinc',
  onClick,
}) => {
  const dotColorClass = {
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
    rose: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
    zinc: 'bg-zinc-500',
  }[indicatorColor];

  const iconColorClass = {
    emerald: 'text-emerald-400/90',
    amber: 'text-amber-400/90',
    rose: 'text-rose-400/90',
    cyan: 'text-cyan-400/90',
    zinc: 'text-zinc-400',
  }[indicatorColor];

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-4 transition-all duration-200',
        onClick ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/90' : 'hover:border-zinc-800'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-2">
          {indicatorColor !== 'zinc' && (
            <span className={cn('w-2 h-2 rounded-full', dotColorClass)} />
          )}
          <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-750">
            <Icon className={cn('w-4 h-4', iconColorClass)} />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-zinc-400 leading-none">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
