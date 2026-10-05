import { useMemo } from 'react';
import { AppUser, UserRole } from '../types';

export interface RoleFlags {
  role: UserRole | null;
  isAuthenticated: boolean;
  isUser: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  hasRole: (uid: string | undefined, targetRole: 'user' | 'seller' | 'store_owner' | 'admin') => boolean;
}

/**
 * Resolves role flags once for the current authenticated user
 * (mirrors Supabase has_role(uid, role) semantics without per-link re-queries).
 */
export function useRoles(currentUser: AppUser | null | undefined): RoleFlags {
  return useMemo(() => {
    const uid = currentUser?.uid;
    const role = currentUser?.role ?? null;
    const isAuthenticated = Boolean(uid && role);
    const isSeller = isAuthenticated && role === 'store_owner';
    const isAdmin = isAuthenticated && role === 'admin';
    const isUser = isAuthenticated && role === 'user';

    const hasRole = (
      checkUid: string | undefined,
      targetRole: 'user' | 'seller' | 'store_owner' | 'admin'
    ): boolean => {
      if (!checkUid || !currentUser || currentUser.uid !== checkUid) return false;
      if (targetRole === 'seller' || targetRole === 'store_owner') {
        return currentUser.role === 'store_owner';
      }
      return currentUser.role === targetRole;
    };

    return {
      role,
      isAuthenticated,
      isUser,
      isSeller,
      isAdmin,
      hasRole,
    };
  }, [currentUser?.uid, currentUser?.role]);
}
