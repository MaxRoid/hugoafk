'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MinecraftClient } from '@/types';
import { useDashboard } from '@/context/DashboardContext';
import { Send, Terminal, MessageSquare, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  client: MinecraftClient;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ client }) => {
  const { sendClientChat } = useDashboard();
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [client.chatHistory, autoScroll]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = inputText;
    setInputText('');
    await sendClientChat(client.id, message);
  };

  return (
    <div
      id="client-chat-panel"
      className="flex flex-col h-[520px] rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md overflow-hidden"
    >
      {/* Chat Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">Server & Client Chat Stream</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {client.chatHistory.length} messages
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              'flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors',
              autoScroll
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <ArrowDown className="w-3 h-3" />
            <span>Auto-scroll</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 select-text">
        {client.chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
            No chat messages recorded in this session.
          </div>
        ) : (
          client.chatHistory.map((msg) => {
            const isServer = msg.sender.toLowerCase() === 'server' || msg.isSystem;
            const isBot = msg.sender.toLowerCase() === client.name.toLowerCase() || msg.isBot;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-zinc-900/40 transition-colors',
                  isServer && 'bg-zinc-900/20'
                )}
              >
                <span className="text-zinc-600 text-[11px] shrink-0 select-none">
                  [{msg.timestamp}]
                </span>

                <div className="min-w-0 flex-1 leading-relaxed">
                  {isServer ? (
                    <span className="text-amber-400 font-semibold mr-1.5">[Server]</span>
                  ) : isBot ? (
                    <span className="text-emerald-400 font-semibold mr-1.5">[{msg.sender}]</span>
                  ) : (
                    <span className="text-cyan-400 font-semibold mr-1.5">&lt;{msg.sender}&gt;</span>
                  )}

                  <span
                    className={cn(
                      'break-words',
                      isServer ? 'text-zinc-300' : isBot ? 'text-zinc-100' : 'text-zinc-300'
                    )}
                  >
                    {msg.message}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Quick Commands & Input Bar */}
      <div className="p-3 border-t border-zinc-850 bg-zinc-900/30">
        {/* Quick Commands Chips */}
        <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto text-[11px] pb-1">
          <span className="text-zinc-500 shrink-0 font-sans">Quick:</span>
          {['/sell', '/ping', '/home farm', '/help', 'hello world'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => setInputText(cmd)}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono shrink-0 border border-zinc-700/60 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            id="chat-message-input"
            type="text"
            placeholder="Send message or command (e.g. /sell)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
          />

          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
