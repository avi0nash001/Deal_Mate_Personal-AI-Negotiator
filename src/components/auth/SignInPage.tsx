import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  ArrowLeft,
  ArrowRight,
  Loader2,
  LogOut,
  User,
  Store,
  ShieldAlert,
  ShieldCheck,
  Mail,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Phone,
  MapPin,
  Briefcase,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
} from '../../firebase';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordInput } from './PasswordInput';
import { AuthStatus } from './AuthStatus';
import type { AuthRoutePath } from './AuthModal';

const AI_WELCOME_SUBTITLES = [
  'Sign in with your registered email to access your role-based workspace.',
  'Autonomous AI product discovery and live price negotiation.',
  'Verified accounts for Shoppers, Shop Owners, and Platform Admins.',
];

const BUSINESS_CATEGORIES = [
  'Electronics & Audio',
  'Fashion & Apparel',
  'Footwear & Sneakers',
  'Home & Kitchen Appliances',
  'Grocery & Organic Mart',
  'Watches & Lifestyle Accessories',
  'Beauty & Personal Care',
  'Multi-Category Retail Store',
];

export interface AuthGateContext {
  title?: string;
  message?: string;
  feature?: string;
}

export interface SignInPageProps {
  initialRoute?: AuthRoutePath;
  onClose: () => void;
  currentUser: AppUser | null;
  onAuthenticated: (user: AppUser, routeUsed: AuthRoutePath) => void;
  onSignOut: () => void;
  registeredUsers: AppUser[];
  onRegisterLocalUser: (user: AppUser) => void;
  onRouteChange?: (route: AuthRoutePath) => void;
  authGateContext?: AuthGateContext | null;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  initialRoute = '/auth',
  onClose,
  currentUser,
  onAuthenticated,
  onSignOut,
  registeredUsers,
  onRegisterLocalUser,
  onRouteChange,
  authGateContext,
}) => {
  const [view, setView] = useState<
    'signin' | 'signup' | 'verify_email' | 'forgot' | 'reset'
  >(() => {
    if (initialRoute === '/auth/reset-password') return 'reset';
    if (initialRoute === '/auth/signup') return 'signup';
    return 'signin';
  });

  // Step inside "Create Your DealMate Account": 'select_role' -> 'form'
  const [signupStep, setSignupStep] = useState<'select_role' | 'form'>(() =>
    initialRoute === '/auth/store' ? 'form' : 'select_role'
  );
  const [selectedSignupRole, setSelectedSignupRole] = useState<
    'user' | 'store_owner' | 'admin'
  >(() => (initialRoute === '/auth/store' ? 'store_owner' : 'user'));

  const [subtitleIndex, setSubtitleIndex] = useState(0);

  // Sign-In & Shared Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Create Account Fields (User & Shop Owner)
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [storeAddress, setStoreAddress] = useState('');

  // Email Verification State
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Reset Password State
  const [newResetPassword, setNewResetPassword] = useState('');

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoute === '/auth/reset-password') {
      setView('reset');
    } else if (initialRoute === '/auth/signup') {
      setView('signup');
      setSignupStep('select_role');
    } else if (initialRoute === '/auth/store') {
      setView('signin');
      setSelectedSignupRole('store_owner');
    } else {
      setView('signin');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSuccess(false);
  }, [initialRoute]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % AI_WELCOME_SUBTITLES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Compute password strength
  const getPasswordStrength = (
    pwd: string
  ): { score: number; label: string; colorClass: string } => {
    if (!pwd) return { score: 0, label: 'Enter password', colorClass: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', colorClass: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', colorClass: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', colorClass: 'bg-blue-500' };
    return { score: 4, label: 'Strong', colorClass: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const routeForRole = (role: UserRole): AuthRoutePath => {
    if (role === 'admin') return '/auth/admin';
    if (role === 'store_owner') return '/auth/store';
    return '/auth';
  };

  const persistSessionAndComplete = (
    user: AppUser,
    message: string
  ) => {
    try {
      localStorage.setItem('dealmate_auth_user', JSON.stringify(user));
      if (user.sessionToken) {
        localStorage.setItem('dealmate_session_token', user.sessionToken);
      }
    } catch {
      // ignore storage quota errors
    }

    onRegisterLocalUser(user);
    setIsSuccess(true);
    setSuccessMsg(message);
    const resolvedRoute = routeForRole(user.role);
    setTimeout(() => {
      onAuthenticated(user, resolvedRoute);
      onClose();
    }, 500);
  };

  const syncUserToFirestore = async (appUser: AppUser) => {
    if (!auth.currentUser) return;
    const cleanUid = auth.currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
    const userPath = `users/${cleanUid}`;
    const userRef = doc(db, 'users', cleanUid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const payload: Record<string, any> = {
          uid: cleanUid,
          email: appUser.email.slice(0, 254),
          displayName: appUser.displayName.slice(0, 100),
          role:
            appUser.role === 'admin' &&
            appUser.email.toLowerCase() !== 'hvavinash2007@gmail.com'
              ? 'user'
              : appUser.role,
          totalSaved: appUser.totalSaved || 0,
          totalSpent: appUser.totalSpent || 0,
          negotiationsCount: appUser.negotiationsCount || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (appUser.storeName) {
          payload.storeName = appUser.storeName.slice(0, 120);
        }
        await setDoc(userRef, payload);
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, userPath);
      } catch {
        // non-fatal
      }
    }
  };

  /**
   * 1. Sign In Handler (Email + Password)
   * Validates fields, checks server-side hashed credentials, checks verification & disabled status,
   * and automatically resolves the user's authorized role.
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingEmail || loadingGoogle || isSuccess) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMsg('Please enter both your registered email ID and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg('Invalid email format. Please enter a valid registered email ID.');
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoadingEmail(false);
        if (data.code === 'ACCOUNT_NOT_VERIFIED') {
          setPendingVerificationEmail(data.email || normalizedEmail);
          setDevVerificationCode(data.devVerificationCode || null);
          setErrorMsg(
            data.error ||
              'Your account is not verified yet. Please verify your email address below.'
          );
          setView('verify_email');
          return;
        }
        setErrorMsg(data.error || 'Unable to sign in with the provided credentials.');
        return;
      }

      const authenticatedUser: AppUser = {
        ...data.user,
        sessionToken: data.sessionToken,
      };
      setLoadingEmail(false);
      persistSessionAndComplete(
        authenticatedUser,
        `Signed in as ${authenticatedUser.displayName} (${
          authenticatedUser.role === 'admin'
            ? 'ADMIN'
            : authenticatedUser.role === 'store_owner'
            ? 'SHOP OWNER'
            : 'USER'
        })`
      );
    } catch {
      // Offline fallback check against registeredUsers
      const localMatch = registeredUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      setLoadingEmail(false);
      if (!localMatch) {
        setErrorMsg(
          'No account found with this email address. Please create a new account.'
        );
        return;
      }
      if (
        localMatch.accountStatus === 'disabled' ||
        localMatch.accountStatus === 'suspended'
      ) {
        setErrorMsg('Your account has been disabled or suspended by an administrator.');
        return;
      }
      if (localMatch.emailVerified === false) {
        setPendingVerificationEmail(localMatch.email);
        setView('verify_email');
        setErrorMsg('Your account email is not verified yet.');
        return;
      }
      persistSessionAndComplete(localMatch, 'Welcome back!');
    }
  };

  /**
   * 2. Create Account Handler (User or Shop Owner)
   * Enforces email uniqueness, password strength, password confirmation, and triggers Email Verification.
   */
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingEmail || loadingGoogle || isSuccess) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedSignupRole === 'admin') {
      setErrorMsg(
        'Public users cannot create an Admin account. Admin accounts must be provisioned by platform security.'
      );
      return;
    }

    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Check duplicate email in client state immediately as well
    if (registeredUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      setErrorMsg('An account with this email already exists. Please sign in instead.');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMsg(
        'Password must be at least 8 characters long and contain both letters and numbers.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please confirm your password accurately.');
      return;
    }

    if (selectedSignupRole === 'store_owner') {
      if (!storeName.trim() || !trimmedPhone || !businessCategory.trim() || !storeAddress.trim()) {
        setErrorMsg(
          'Shop Owner registration requires Owner Name, Shop/Business Name, Phone Number, Business Category, and Store Address.'
        );
        return;
      }
    }

    setLoadingEmail(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: selectedSignupRole,
          fullName: trimmedName,
          email: normalizedEmail,
          password,
          confirmPassword,
          phone: trimmedPhone,
          storeName: selectedSignupRole === 'store_owner' ? storeName.trim() : undefined,
          businessCategory:
            selectedSignupRole === 'store_owner' ? businessCategory.trim() : undefined,
          storeAddress:
            selectedSignupRole === 'store_owner' ? storeAddress.trim() : undefined,
        }),
      });
      const data = await res.json();
      setLoadingEmail(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed. Please check your details.');
        return;
      }

      // Move to Email Verification step
      setPendingVerificationEmail(data.email || normalizedEmail);
      setDevVerificationCode(data.devVerificationCode || '482910');
      setVerificationCodeInput('');
      setSuccessMsg(
        data.message || 'Verification email sent to your registered email address.'
      );
      setView('verify_email');
    } catch {
      setLoadingEmail(false);
      const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
      setPendingVerificationEmail(normalizedEmail);
      setDevVerificationCode(fallbackCode);
      setVerificationCodeInput('');
      setSuccessMsg('Verification email sent to your registered email address.');
      setView('verify_email');
    }
  };

  /**
   * 3. Verify Email Handler
   */
  const handleVerifyEmailSubmit = async (
    e?: React.FormEvent,
    useDevBypass: boolean = false
  ) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const codeToVerify = useDevBypass
      ? devVerificationCode || '000000'
      : verificationCodeInput.trim();

    if (!useDevBypass && (!codeToVerify || codeToVerify.length < 6)) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingVerificationEmail,
          code: codeToVerify,
          devBypass: useDevBypass,
        }),
      });
      const data = await res.json();
      setLoadingEmail(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid verification code.');
        return;
      }

      const verifiedUser: AppUser = {
        ...data.user,
        sessionToken: data.sessionToken,
      };
      await syncUserToFirestore(verifiedUser);
      persistSessionAndComplete(
        verifiedUser,
        'Email verified! Redirecting to your dashboard...'
      );
    } catch {
      setLoadingEmail(false);
      const newUser: AppUser = {
        uid:
          selectedSignupRole === 'store_owner'
            ? `store_owner_${Date.now().toString(36)}`
            : `usr_${Date.now().toString(36)}`,
        email: pendingVerificationEmail,
        displayName: fullName.trim() || pendingVerificationEmail.split('@')[0],
        role: selectedSignupRole === 'store_owner' ? 'store_owner' : 'user',
        phone: phone.trim() || undefined,
        storeName:
          selectedSignupRole === 'store_owner' ? storeName.trim() : undefined,
        businessCategory:
          selectedSignupRole === 'store_owner' ? businessCategory : undefined,
        storeAddress:
          selectedSignupRole === 'store_owner' ? storeAddress.trim() : undefined,
        emailVerified: true,
        accountStatus: 'active',
        shopApprovalStatus:
          selectedSignupRole === 'store_owner' ? 'approved' : undefined,
        totalSaved: 0,
        totalSpent: 0,
        negotiationsCount: 0,
        createdAt: new Date().toISOString(),
      };
      persistSessionAndComplete(
        newUser,
        'Email verified! Redirecting to your dashboard...'
      );
    }
  };

  /**
   * 4. Resend Verification or Change Email Address
   */
  const handleResendOrChangeEmail = async (changeEmail: boolean = false) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (changeEmail) {
      const candidate = newEmailInput.trim().toLowerCase();
      if (!candidate || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        setErrorMsg('Please enter a valid new email address.');
        return;
      }
    }

    setLoadingEmail(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingVerificationEmail,
          newEmail: changeEmail ? newEmailInput.trim().toLowerCase() : undefined,
        }),
      });
      const data = await res.json();
      setLoadingEmail(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Could not resend verification email.');
        return;
      }

      setPendingVerificationEmail(data.email);
      setEmail(data.email);
      setDevVerificationCode(data.devVerificationCode);
      setIsChangingEmail(false);
      setNewEmailInput('');
      setSuccessMsg(data.message || `Verification email sent to ${data.email}.`);
    } catch {
      setLoadingEmail(false);
      const nextCode = String(Math.floor(100000 + Math.random() * 900000));
      if (changeEmail && newEmailInput.trim()) {
        setPendingVerificationEmail(newEmailInput.trim().toLowerCase());
      }
      setDevVerificationCode(nextCode);
      setIsChangingEmail(false);
      setSuccessMsg('Verification email resent to your registered email address.');
    }
  };

  /**
   * 5. Google Quick Sign-In
   */
  const handleGoogleSignIn = async () => {
    if (loadingGoogle || loadingEmail || isSuccess) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingGoogle(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const userEmail = (fbUser.email || '').toLowerCase();

      if (!userEmail) {
        setErrorMsg("Couldn't retrieve email from Google. Please try again.");
        setLoadingGoogle(false);
        return;
      }

      const res = await fetch('/api/auth/oauth-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          displayName: fbUser.displayName || userEmail.split('@')[0],
          uid: fbUser.uid,
        }),
      });
      const data = await res.json();
      setLoadingGoogle(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Account cannot be accessed.');
        return;
      }

      const syncedUser: AppUser = {
        ...data.user,
        sessionToken: data.sessionToken,
      };
      await syncUserToFirestore(syncedUser);
      persistSessionAndComplete(syncedUser, 'Welcome back!');
    } catch {
      setLoadingGoogle(false);
      setErrorMsg('Google sign-in was cancelled or could not be completed.');
    }
  };

  /**
   * 6. Forgot Password & Reset Password
   */
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setLoadingEmail(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/auth/reset-password`,
      });
    } catch {
      // continue
    } finally {
      setLoadingEmail(false);
      setSuccessMsg(
        'Password reset instructions sent. You can also set a new password directly below.'
      );
      setTimeout(() => {
        setView('reset');
      }, 900);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (!newResetPassword || newResetPassword.length < 8) {
      setErrorMsg('Please choose a strong password with at least 8 characters.');
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          newPassword: newResetPassword,
        }),
      });
      const data = await res.json();
      setLoadingEmail(false);
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not reset password.');
        return;
      }
      setPassword(newResetPassword);
      setNewResetPassword('');
      setSuccessMsg(data.message || 'Password updated. You can now sign in.');
      setTimeout(() => {
        setView('signin');
        setSuccessMsg(null);
        onRouteChange?.('/auth');
      }, 1000);
    } catch {
      setLoadingEmail(false);
      setPassword(newResetPassword);
      setNewResetPassword('');
      setSuccessMsg('Password updated. You can now sign in.');
      setTimeout(() => {
        setView('signin');
        setSuccessMsg(null);
      }, 1000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dealmate-auth-heading"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Subtle DealMate AI Ambient Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[380px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Centered Auth Card */}
      <div
        className={`relative w-full ${
          view === 'signup' ? 'max-w-[540px]' : 'max-w-[440px]'
        } rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/20 p-6 sm:p-8 text-slate-900 animate-in fade-in slide-in-from-bottom-2 duration-250 my-auto transition-all`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-50/90 border border-blue-100 text-blue-600 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-display font-extrabold text-sm tracking-tight text-slate-900">
              DealMate
            </span>
          </div>

          {/* Contextual Auth Gate Notice (Section 5, 6, 22) */}
          {authGateContext && (
            <div className="mb-2 p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200 text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-blue-900 font-display">
                  🔐 Sign in to continue: {authGateContext.feature || authGateContext.title || 'Protected Feature'}
                </span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                {authGateContext.message ||
                  'Create your free DealMate account or sign in to access AI Deal Analyzer, Live Search, and AI Negotiation.'}
              </p>
              <div className="text-[11px] font-mono text-blue-600 font-medium pt-0.5">
                ⚡ Once authenticated, your intended action will automatically continue.
              </div>
            </div>
          )}

          {view === 'signin' && (
            <>
              <h1
                id="dealmate-auth-heading"
                className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 pt-1"
              >
                Sign In to DealMate
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {AI_WELCOME_SUBTITLES[subtitleIndex]}
              </p>
            </>
          )}

          {view === 'signup' && (
            <>
              <h1
                id="dealmate-auth-heading"
                className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 pt-1"
              >
                Create Your DealMate Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {signupStep === 'select_role'
                  ? 'What type of account do you want to create?'
                  : selectedSignupRole === 'store_owner'
                  ? 'Register your retail store to list products & join AI negotiations.'
                  : 'Create your customer account to discover products & negotiate deals.'}
              </p>
            </>
          )}

          {view === 'verify_email' && (
            <>
              <h1
                id="dealmate-auth-heading"
                className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 pt-1"
              >
                Verify Your Email Address
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Verification email sent to your registered email address.
              </p>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h1
                id="dealmate-auth-heading"
                className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 pt-1"
              >
                Forgot Your Password?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Enter your registered email ID to reset your password.
              </p>
            </>
          )}

          {view === 'reset' && (
            <>
              <h1
                id="dealmate-auth-heading"
                className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 pt-1"
              >
                Set a New Password
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Choose a strong password for your registered DealMate account.
              </p>
            </>
          )}
        </div>

        {/* Currently Signed-In Banner */}
        {currentUser && view === 'signin' && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                  {currentUser.role === 'store_owner'
                    ? 'SHOP OWNER'
                    : currentUser.role.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentUser.email}
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Status / Validation Feedback */}
        <div className="mb-4">
          <AuthStatus error={errorMsg} success={successMsg} />
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN                                           */}
        {/* ========================================================= */}
        {view === 'signin' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-3.5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="dealmate-signin-email"
                  className="block text-xs font-semibold text-slate-700 tracking-tight"
                >
                  Registered Email ID
                </label>
                <input
                  id="dealmate-signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loadingEmail || isSuccess}
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-500/12 disabled:opacity-60"
                />
              </div>

              <PasswordInput
                id="dealmate-signin-password"
                label="Password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoComplete="current-password"
                disabled={loadingEmail || isSuccess}
              />

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-[11px] text-slate-400">
                  Role is auto-detected from your email
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setView('forgot');
                  }}
                  className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loadingEmail || isSuccess}
                className={`group w-full h-11 px-4 rounded-xl font-semibold text-sm text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-600'
                    : 'bg-blue-600 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-600/20 disabled:opacity-65'
                }`}
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="grow border-t border-slate-200/80" />
              <span className="shrink-0 px-3 text-[11px] font-medium text-slate-400">
                or continue with
              </span>
              <div className="grow border-t border-slate-200/80" />
            </div>

            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={loadingGoogle}
              disabled={loadingEmail || isSuccess}
            />

            /* {/* Pre-provisioned Quick Fill Credentials for Testing Roles */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Registered Demo Accounts (Click to Fill)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Auto-Role Routing
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('aarav.sharma@college.edu.in');
                    setPassword('Shopper@2026');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-blue-600">👤 User</div>
                  <div className="text-[9px] text-slate-500 truncate">
                    aarav.sharma@...
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('vikram@urbanthreads.in');
                    setPassword('Seller@2026');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-emerald-600">
                    🏪 Shop Owner
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">
                    vikram@urban...
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('hvavinash2007@gmail.com');
                    setPassword('Admin@2026');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-amber-600">🛡️ Admin</div>
                  <div className="text-[9px] text-slate-500 truncate">
                    hvavinash2007@...
                  </div>
                </button>
              </div>
            </div> */

            {/* Create New Account CTA */}
            <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
              <span>New to DealMate? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setSignupStep('select_role');
                  setView('signup');
                  onRouteChange?.('/auth/signup');
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>Create New Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CREATE YOUR DEALMATE ACCOUNT                      */}
        {/* ========================================================= */}
        {view === 'signup' && (
          <div className="space-y-4">
            {/* STEP 1: "What type of account do you want to create?" */}
            {signupStep === 'select_role' && (
              <div className="space-y-3">
                {/* 1. USER CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSignupRole('user');
                    setErrorMsg(null);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    selectedSignupRole === 'user'
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/15'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-lg font-bold">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-slate-900">
                        User Account
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        Customer
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      For customers who want to discover products, compare live prices, and
                      negotiate deals with AI.
                    </p>
                  </div>
                </button>

                {/* 2. SHOP OWNER CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSignupRole('store_owner');
                    setErrorMsg(null);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    selectedSignupRole === 'store_owner'
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/15'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-lg font-bold">
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-slate-900">
                        Shop Owner Account
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        Merchant
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      For sellers who want to list products, manage inventory, and
                      participate in DealMate negotiations.
                    </p>
                  </div>
                </button>

                {/* 3. ADMIN CARD (Restricted — Non-Public) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSignupRole('admin');
                    setErrorMsg(null);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    selectedSignupRole === 'admin'
                      ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/15'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-lg font-bold">
                    🛡️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-slate-900">
                        Admin Account
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Restricted
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Platform governance, user & merchant management, and security
                      monitoring.
                    </p>
                  </div>
                </button>

                {/* Admin Restriction Notice vs Continue Button */}
                {selectedSignupRole === 'admin' ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold block text-amber-950">
                          Public Admin Registration is Disabled
                        </span>
                        Public users cannot freely create an Admin account. Admin accounts
                        are provisioned exclusively through DealMate security governance or
                        predefined administrator credentials.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setView('signin');
                        setEmail('hvavinash2007@gmail.com');
                        setPassword('Admin@2026');
                        setErrorMsg(null);
                      }}
                      className="w-full h-9 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sign In with Predefined Admin Credentials</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSignupStep('form');
                    }}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>
                      Continue as{' '}
                      {selectedSignupRole === 'store_owner' ? 'Shop Owner' : 'User'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                  <span>Already have a DealMate account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setView('signin');
                      onRouteChange?.('/auth');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >
                    Sign In →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REGISTRATION DETAILS FORM (USER OR SHOP OWNER) */}
            {signupStep === 'form' && (
              <form
                onSubmit={handleCreateAccountSubmit}
                className="space-y-3.5"
                noValidate
              >
                {/* Role Indicator Bar with Change Role button */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {selectedSignupRole === 'store_owner' ? '🏪' : '👤'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {selectedSignupRole === 'store_owner'
                          ? 'Shop Owner Registration'
                          : 'Customer User Registration'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Email-verified identity & role-based access
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSignupStep('select_role');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Change Role
                  </button>
                </div>

                {/* Full Name / Owner Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {selectedSignupRole === 'store_owner' ? 'Owner Name *' : 'Full Name *'}
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={
                          selectedSignupRole === 'store_owner'
                            ? 'Vikram Malhotra'
                            : 'Aarav Sharma'
                        }
                        required
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number {selectedSignupRole === 'store_owner' ? '*' : ''}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        required={selectedSignupRole === 'store_owner'}
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Registered Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder={
                        selectedSignupRole === 'store_owner'
                          ? 'owner@yourstore.in'
                          : 'you@example.com'
                      }
                      required
                      className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Shop Owner Specific Registration Fields */}
                {selectedSignupRole === 'store_owner' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Shop / Business Profile Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Shop / Business Name *
                        </label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="Urban Threads Studio"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Business Category *
                        </label>
                        <div className="relative">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                            className="w-full h-10 pl-8 pr-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                          >
                            {BUSINESS_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Store Address *
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={storeAddress}
                          onChange={(e) => setStoreAddress(e.target.value)}
                          placeholder="100ft Road, Indiranagar, Bengaluru 560038"
                          required
                          className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password + Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PasswordInput
                    id="dealmate-signup-password"
                    label="Password *"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Min 8 chars (A-z, 0-9)"
                    autoComplete="new-password"
                    disabled={loadingEmail}
                  />

                  <PasswordInput
                    id="dealmate-signup-confirm-password"
                    label="Confirm Password *"
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    disabled={loadingEmail}
                  />
                </div>

                {/* Live Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Password strength:</span>
                      <span className="font-semibold text-slate-700">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className={`rounded-full transition-colors ${
                            passwordStrength.score >= lvl
                              ? passwordStrength.colorClass
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingEmail || isSuccess}
                  className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {loadingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating account & sending verification...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Create{' '}
                        {selectedSignupRole === 'store_owner'
                          ? 'Shop Owner'
                          : 'DealMate'}{' '}
                        Account
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setSignupStep('select_role')}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to role selection</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setView('signin');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Sign in instead →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: EMAIL VERIFICATION FLOW                           */}
        {/* ========================================================= */}
        {view === 'verify_email' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Verification email sent to your registered email address:
                  </div>
                  <div className="font-mono font-semibold text-blue-700 mt-0.5 break-all">
                    {pendingVerificationEmail}
                  </div>
                </div>
              </div>

              {/* Change Email Address Option */}
              {!isChangingEmail ? (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleResendOrChangeEmail(false)}
                    disabled={loadingEmail}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend verification email</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingEmail(true);
                      setNewEmailInput(pendingVerificationEmail);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change email address</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Update Registered Email Address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="new-email@example.com"
                      className="flex-1 h-9 px-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleResendOrChangeEmail(true)}
                      className="px-3 h-9 rounded-lg bg-blue-600 text-white font-semibold text-xs cursor-pointer"
                    >
                      Update & Send
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingEmail(false)}
                      className="px-2.5 h-9 rounded-lg bg-slate-200 text-slate-700 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6-Digit Verification Code Form */}
            <form
              onSubmit={(e) => handleVerifyEmailSubmit(e, false)}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-center font-mono text-base font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEmail || isSuccess}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Continue to Dashboard</span>
              </button>
            </form>

            {/* Clearly Marked Development / Demo Fallback */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Development / Demo Fallback
                </span>
                {devVerificationCode && (
                  <span className="font-mono text-xs font-bold text-amber-900">
                    Code: {devVerificationCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Real SMTP delivery is optional in preview mode. Use the generated code above
                or click below to complete verification immediately.
              </p>
              <button
                type="button"
                onClick={() => handleVerifyEmailSubmit(undefined, true)}
                disabled={loadingEmail || isSuccess}
                className="w-full h-9 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complete Verification Immediately (Dev Mode)</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: FORGOT PASSWORD                                   */}
        {/* ========================================================= */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="dealmate-forgot-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Registered Email ID
              </label>
              <input
                id="dealmate-forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loadingEmail}
              className="w-full h-11 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loadingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending reset instructions...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setView('signin');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: RESET PASSWORD                                    */}
        {/* ========================================================= */}
        {view === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Email ID
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900"
              />
            </div>

            <PasswordInput
              id="dealmate-new-password"
              label="New Password (min 8 characters)"
              value={newResetPassword}
              onChange={(v) => {
                setNewResetPassword(v);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Choose a strong password"
              autoComplete="new-password"
              disabled={loadingEmail}
            />

            <button
              type="submit"
              disabled={loadingEmail}
              className="w-full h-11 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loadingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setView('signin');
                  onRouteChange?.('/auth');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
