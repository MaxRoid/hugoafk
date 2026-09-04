'use client';

import React, { useState } from 'react';
import { MinecraftClient, InventoryItem } from '@/types';
import {
  Package,
  Sparkles,
  Shield,
  Sword,
  Wrench,
  Apple,
  Gem,
  Info,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryGridProps {
  client: MinecraftClient;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ client }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(
    client.inventory[0] || null
  );

  // Map inventory by slot number
  const inventoryMap = new Map<number, InventoryItem>();
  client.inventory.forEach((item) => {
    inventoryMap.set(item.slot, item);
  });

  // Hotbar: 36 to 44
  const hotbarSlots = Array.from({ length: 9 }, (_, i) => 36 + i);

  // Main inventory: 9 to 35 (3 rows of 9)
  const mainInventoryRows = [
    Array.from({ length: 9 }, (_, i) => 9 + i),
    Array.from({ length: 9 }, (_, i) => 18 + i),
    Array.from({ length: 9 }, (_, i) => 27 + i),
  ];

  const getItemIcon = (id: string) => {
    if (id.includes('sword')) return <Sword className="w-4 h-4 text-cyan-400" />;
    if (id.includes('pickaxe') || id.includes('hoe')) return <Wrench className="w-4 h-4 text-zinc-300" />;
    if (id.includes('apple') || id.includes('beef') || id.includes('bread') || id.includes('carrot') || id.includes('potato'))
      return <Apple className="w-4 h-4 text-amber-400" />;
    if (id.includes('diamond') || id.includes('emerald') || id.includes('ingot') || id.includes('scrap'))
      return <Gem className="w-4 h-4 text-emerald-400" />;
    if (id.includes('shield') || id.includes('totem'))
      return <Shield className="w-4 h-4 text-amber-300" />;
    return <Package className="w-4 h-4 text-zinc-400" />;
  };

  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'epic':
        return 'text-purple-400 border-purple-800/60 bg-purple-950/40';
      case 'rare':
        return 'text-cyan-400 border-cyan-800/60 bg-cyan-950/40';
      case 'uncommon':
        return 'text-yellow-400 border-yellow-800/60 bg-yellow-950/40';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  };

  const renderSlot = (slotIndex: number, isHotbar: boolean = false) => {
    const item = inventoryMap.get(slotIndex);
    const isSelected = selectedItem?.slot === slotIndex;

    return (
      <button
        key={slotIndex}
        type="button"
        id={`inv-slot-${slotIndex}`}
        onClick={() => item && setSelectedItem(item)}
        className={cn(
          'group relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-150',
          item
            ? 'cursor-pointer hover:scale-105 hover:z-10'
            : 'cursor-default opacity-40',
          isSelected
            ? 'border-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/40 shadow-sm'
            : isHotbar
            ? 'border-zinc-700/80 bg-zinc-900/90 hover:border-zinc-600'
            : 'border-zinc-800/90 bg-zinc-950/80 hover:border-zinc-700'
        )}
      >
        {/* Slot index label */}
        <span className="absolute top-1 left-1 text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400">
          {slotIndex}
        </span>

        {item ? (
          <>
            <div className="shrink-0 my-auto">
              {getItemIcon(item.id)}
            </div>

            {/* Durability bar if tool */}
            {item.durability !== undefined && item.maxDurability && (
              <div className="absolute bottom-1.5 left-1.5 right-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                />
              </div>
            )}

            {/* Stack count */}
            {item.count > 1 && (
              <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-bold text-zinc-200 drop-shadow">
                {item.count}
              </span>
            )}
          </>
        ) : null}
      </button>
    );
  };

  return (
    <div id="client-inventory-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2-Column: The Minecraft Inventory Matrix */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Live Inventory Grid</h3>
            <p className="text-xs text-zinc-400">
              36-slot container storage & active hotbar
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Occupied:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-semibold">
              {client.inventory.length} / 36
            </span>
          </div>
        </div>

        {/* Main Inventory Box (3 rows of 9) */}
        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Storage Slots (9-35)</span>
          </div>

          <div className="space-y-2">
            {mainInventoryRows.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-9 gap-2">
                {row.map((slot) => renderSlot(slot, false))}
              </div>
            ))}
          </div>

          {/* Hotbar Section (slots 36-44) */}
          <div className="pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 uppercase tracking-wider font-semibold mb-2">
              <span>Active Hotbar (36-44)</span>
              <span className="text-zinc-500 font-normal normal-case">Slot 36 is primary hand</span>
            </div>

            <div className="grid grid-cols-9 gap-2">
              {hotbarSlots.map((slot) => renderSlot(slot, true))}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Column: Item Details & Inspector Card */}
      <div>
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm sticky top-24">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-xs font-semibold text-zinc-200">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Item Inspector</span>
          </div>

          {selectedItem ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  {getItemIcon(selectedItem.id)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">{selectedItem.displayName}</h4>
                  <span
                    className={cn(
                      'inline-block text-[10px] font-mono px-2 py-0.5 rounded border uppercase mt-1',
                      getRarityBadge(selectedItem.rarity)
                    )}
                  >
                    {selectedItem.rarity || 'Common'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-zinc-850 pt-3">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Slot Position:</span>
                  <span className="font-mono text-zinc-200 font-semibold">#{selectedItem.slot}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Stack Count:</span>
                  <span className="font-mono text-zinc-200 font-semibold">
                    {selectedItem.count} / {selectedItem.maxCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Namespaced ID:</span>
                  <span className="font-mono text-zinc-400 text-[11px]">minecraft:{selectedItem.id}</span>
                </div>

                {selectedItem.durability !== undefined && selectedItem.maxDurability && (
                  <div className="pt-2 border-t border-zinc-850">
                    <div className="flex items-center justify-between text-zinc-400 mb-1">
                      <span>Durability:</span>
                      <span className="font-mono text-zinc-200">
                        {selectedItem.durability} / {selectedItem.maxDurability}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${(selectedItem.durability / selectedItem.maxDurability) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Item Lore / Enchantments */}
              {selectedItem.lore && selectedItem.lore.length > 0 && (
                <div className="pt-3 border-t border-zinc-850">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Enchantments & Lore
                  </span>
                  <div className="space-y-1">
                    {selectedItem.lore.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs font-mono text-cyan-300/90"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              Click any inventory slot to inspect metadata, durability, and enchantments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
