import React from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { GoogleSignInButton } from './GoogleSignInButton';

interface CreateAccountProps {
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onSwitchToSignIn: () => void;
  loading?: boolean;
  isSuccess?: boolean;
  isStoreRegistration?: boolean;
  storeName?: string;
  onStoreNameChange?: (value: string) => void;
  sellerAccessCode?: string;
  onSellerAccessCodeChange?: (value: string) => void;
}

export const CreateAccount: React.FC<CreateAccountProps> = ({
  name,
  onNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onSwitchToSignIn,
  loading = false,
  isSuccess = false,
  isStoreRegistration = false,
  storeName = '',
  onStoreNameChange,
  sellerAccessCode = '',
  onSellerAccessCodeChange,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <GoogleSignInButton
        onClick={onGoogleSignIn}
        loading={loading}
        disabled={isSuccess}
        label="Continue with Google"
      />

      <div className="relative flex items-center py-1">
        <div className="grow border-t border-slate-200/80" />
        <span className="shrink-0 px-3 text-[11px] font-medium text-slate-400 lowercase">
          or
        </span>
        <div className="grow border-t border-slate-200/80" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="dealmate-signup-name"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            Name
          </label>
          <input
            id="dealmate-signup-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            disabled={loading || isSuccess}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/12 disabled:opacity-60"
          />
        </div>

        {/* Progressive disclosure ONLY when registering a merchant store */}
        {isStoreRegistration && onStoreNameChange && onSellerAccessCodeChange && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label
                htmlFor="dealmate-store-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Store name
              </label>
              <input
                id="dealmate-store-name"
                type="text"
                value={storeName}
                onChange={(e) => onStoreNameChange(e.target.value)}
                placeholder="Your store name"
                disabled={loading || isSuccess}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="dealmate-store-code"
                className="block text-xs font-semibold text-slate-700"
              >
                Partner code
              </label>
              <input
                id="dealmate-store-code"
                type="text"
                value={sellerAccessCode}
                onChange={(e) => onSellerAccessCodeChange(e.target.value)}
                placeholder="SELLER2026"
                disabled={loading || isSuccess}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200/90 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="dealmate-signup-email"
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            Email address
          </label>
          <input
            id="dealmate-signup-email"
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

        {/* Password */}
        <PasswordInput
          id="dealmate-signup-password"
          label="Password"
          value={password}
          onChange={onPasswordChange}
          autoComplete="new-password"
          disabled={loading || isSuccess}
        />

        {/* Submit */}
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
              <span>You're all set! 🎉</span>
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            disabled={loading || isSuccess}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            Sign in →
          </button>
        </div>
      </form>
    </div>
  );
};
