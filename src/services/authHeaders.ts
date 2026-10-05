/**
 * Client authentication header helper
 * Retrieves the active session token from localStorage to send in Authorization: Bearer <token>
 */
export function getAuthHeaders(): Record<string, string> {
  try {
    const sessionStr = localStorage.getItem('dealmate_active_user_session');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed?.sessionToken) {
        return {
          Authorization: `Bearer ${parsed.sessionToken}`,
        };
      }
    }
  } catch {
    // ignore
  }
  return {};
}

export function getActiveSessionToken(): string | null {
  try {
    const sessionStr = localStorage.getItem('dealmate_active_user_session');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      return parsed?.sessionToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}
