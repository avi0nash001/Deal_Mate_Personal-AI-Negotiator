import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthStatusProps {
  error?: string | null;
  success?: string | null;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
      {error && (
        <div
          role="alert"
          className="px-3.5 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="px-3.5 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-in zoom-in duration-200" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};
