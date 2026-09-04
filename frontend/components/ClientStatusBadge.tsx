'use client';

import React from 'react';
import { ClientStatus } from '@/types';
import { getStatusBadgeConfig } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ClientStatusBadge: React.FC<ClientStatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const config = getStatusBadgeConfig(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      id={`status-badge-${status}`}
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all select-none',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full shrink-0',
          config.dotColor,
          config.glow,
          dotSizes[size]
        )}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
