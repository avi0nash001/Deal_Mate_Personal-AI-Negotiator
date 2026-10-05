import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  onForgotPassword?: () => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id = 'dealmate-password',
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••••••',
  autoComplete = 'current-password',
  disabled = false,
  required = true,
  onForgotPassword,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            Forgot password?
          </button>
        )}
      </div>

      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isVisible ? 'Enter your password' : placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/12 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          disabled={disabled}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          title={isVisible ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4 transition-transform duration-150" />
          ) : (
            <Eye className="w-4 h-4 transition-transform duration-150" />
          )}
        </button>
      </div>
    </div>
  );
};
