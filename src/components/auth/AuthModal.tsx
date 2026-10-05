import React from 'react';
import { AppUser } from '../../types';
import { SignInPage, AuthGateContext } from './SignInPage';

export type AuthRoutePath =
  | '/auth'
  | '/auth/signup'
  | '/auth/store'
  | '/auth/admin'
  | '/auth/reset-password';

export type { AuthGateContext };

interface AuthModalProps {
  isOpen: boolean;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
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
  if (!isOpen) return null;

  return (
    <SignInPage
      initialRoute={initialRoute}
      onClose={onClose}
      currentUser={currentUser}
      onAuthenticated={onAuthenticated}
      onSignOut={onSignOut}
      registeredUsers={registeredUsers}
      onRegisterLocalUser={onRegisterLocalUser}
      onRouteChange={onRouteChange}
      authGateContext={authGateContext}
    />
  );
};

