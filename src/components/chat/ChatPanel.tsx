import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Bot, User, CornerDownLeft, RotateCcw } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'buyer_ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    action: () => void;
  };
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onOpenVoice: () => void;
  onResetSession?: () => void;
  isNegotiating?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onOpenVoice,
  onResetSession,
  isNegotiating = false,
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isNegotiating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const quickPrompts = [
    "I want earbuds under ₹2,600",
    "Negotiate Titan Smartwatch at ₹3,600",
    "Compare all sellers for Studio Headphones",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0D15] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Buyer Intent Agent
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Autonomous Bargaining Delegate</span>
            </div>
          </div>
        </div>

        {onResetSession && (
          <button
            onClick={onResetSession}
            title="Reset conversation"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs ${
                  isUser
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[9px] mt-1 font-mono ${
                    isUser ? 'text-slate-900/60 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </span>

                {msg.suggestedAction && (
                  <button
                    onClick={msg.suggestedAction.action}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{msg.suggestedAction.label}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="p-2.5 border-t border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              disabled={isNegotiating}
              className="px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-[#07090F] flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenVoice}
          title="Voice Command"
          className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-700/60 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isNegotiating ? 'AI is currently negotiating...' : 'Tell Buyer AI what you want & target budget...'}
          disabled={isNegotiating}
          className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50 font-sans"
        />

        <button
          type="submit"
          disabled={!input.trim() || isNegotiating}
          className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 disabled:hover:bg-cyan-500 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4 font-bold" />
        </button>
      </form>
    </div>
  );
};
