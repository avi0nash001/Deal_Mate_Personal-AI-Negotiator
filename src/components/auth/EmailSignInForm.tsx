import React from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { PasswordInput } from './PasswordInput';

interface EmailSignInFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onSwitchToCreateAccount: () => void;
  loading?: boolean;
  isSuccess?: boolean;
}

export const EmailSignInForm: React.FC<EmailSignInFormProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onSwitchToCreateAccount,
  loading = false,
  isSuccess = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Email Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="dealmate-signin-email"
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          Email address
        </label>
        <input
          id="dealmate-signin-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading || isSuccess}
          required
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/12 disabled:opacity-60"
        />
      </div>

      {/* Interactive Password Field */}
      <PasswordInput
        id="dealmate-signin-password"
        label="Password"
        value={password}
        onChange={onPasswordChange}
        autoComplete="current-password"
        disabled={loading || isSuccess}
      />

      {/* Primary Sign In Button with Normal, Hover, Loading & Success States */}
      <button
        type="submit"
        disabled={loading || isSuccess}
        className={`group w-full h-11 px-4 rounded-xl font-semibold text-sm text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none ${
          isSuccess
            ? 'bg-emerald-600 shadow-emerald-500/20'
            : 'bg-blue-600 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-600/20 disabled:opacity-65'
        }`}
      >
        {isSuccess ? (
          <>
            <Check className="w-4 h-4 stroke-[2.5] animate-in zoom-in duration-200" />
            <span>Welcome back!</span>
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {/* Forgot Password */}
      <div className="text-center pt-0.5">
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={loading || isSuccess}
          className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
        >
          Forgot password?
        </button>
      </div>

      {/* New to DealMate? Create an account -> */}
      <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>New to DealMate? </span>
        <button
          type="button"
          onClick={onSwitchToCreateAccount}
          disabled={loading || isSuccess}
          className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:underline"
        >
          <span>Create an account</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  );
};
