import React from 'react';
import { Bot, Store, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AgentAvatarProps {
  type: 'BUYER' | 'SELLER';
  name?: string;
  status?: 'IDLE' | 'THINKING' | 'NEGOTIATING' | 'WAITING' | 'ACCEPTED' | 'REJECTED';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  type,
  name,
  status = 'NEGOTIATING',
  size = 'md',
}) => {
  const isBuyer = type === 'BUYER';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* 3D Outer Halo / Pulse */}
      <div
        className={`relative ${sizeClasses[size]} rounded-2xl flex items-center justify-center transition-all duration-300 transform-style-3d shadow-2xl ${
          isBuyer
            ? 'bg-gradient-to-br from-cyan-500/20 via-sky-600/30 to-indigo-950 border border-cyan-400/40 shadow-cyan-500/25'
            : 'bg-gradient-to-br from-amber-500/20 via-orange-600/30 to-stone-950 border border-amber-400/40 shadow-amber-500/25'
        } ${status === 'THINKING' || status === 'NEGOTIATING' ? 'animate-pulse' : ''}`}
      >
        {/* Inner geometric core */}
        <div
          className={`w-3/4 h-3/4 rounded-xl flex items-center justify-center transition-transform ${
            isBuyer
              ? 'bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 shadow-inner'
              : 'bg-gradient-to-tr from-amber-400 to-orange-600 text-slate-950 shadow-inner'
          }`}
        >
          {isBuyer ? (
            <Bot className={`${iconSizes[size]} text-slate-950 font-bold`} />
          ) : (
            <Store className={`${iconSizes[size]} text-slate-950 font-bold`} />
          )}
        </div>

        {/* Orbiting indicator dot */}
        {(status === 'NEGOTIATING' || status === 'THINKING') && (
          <span
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-[#080B11] ${
              isBuyer ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-amber-400 shadow-sm shadow-amber-400'
            } animate-ping`}
          />
        )}

        {/* Status corner badge */}
        {status === 'ACCEPTED' && (
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-slate-950 ring-2 ring-[#080B11]">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
        {status === 'REJECTED' && (
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-rose-500 rounded-full text-slate-950 ring-2 ring-[#080B11]">
            <XCircle className="w-3.5 h-3.5" />
          </div>
        )}
        {status === 'WAITING' && (
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-600 rounded-full text-slate-200 ring-2 ring-[#080B11]">
            <Clock className="w-3 h-3" />
          </div>
        )}
      </div>

      {name && (
        <span className="mt-1.5 text-xs font-medium text-slate-300 tracking-wide text-center">
          {name}
        </span>
      )}
    </div>
  );
};
