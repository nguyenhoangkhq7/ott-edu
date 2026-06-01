export interface AuthUser {
  accountId: number;
  email: string;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  code: string | null;
  schoolId: number | null;
  schoolName: string | null;
  departmentId: number | null;
  departmentName: string | null;
}

export interface AuthSessionRecord {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  classId: string | null;
  role: string;
  lastAccessedAt: number;
}

export type AuthSessionsMap = Record<string, AuthSessionRecord>;

/**
 * Reads the entire sessions map from localStorage.
 * Handles SSR safely by checking if window is defined.
 */
export function getSessionsMap(): AuthSessionsMap {
  try {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("auth_sessions");
      return data ? JSON.parse(data) : {};
    }
  } catch (error) {
    console.error("Failed to parse auth_sessions from localStorage:", error);
  }
  return {};
}

/**
 * Serializes and saves the sessions map to localStorage.
 * Emits storage event for local tab updates.
 */
export function saveSessionsMap(map: AuthSessionsMap): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_sessions", JSON.stringify(map));
    }
  } catch (error) {
    console.error("Failed to save auth_sessions to localStorage:", error);
  }
}

/**
 * Resolves the active session ID for the current tab with fallback logic.
 * If the current tab has no active_session_id in sessionStorage, it scans
 * the auth_sessions from localStorage, picks the one with the latest lastAccessedAt,
 * registers it as the active session for the current tab, and returns it.
 */
export function getActiveSessionId(): string | null {
  try {
    if (typeof window === "undefined") return null;

    let activeId = sessionStorage.getItem("active_session_id");
    const map = getSessionsMap();

    // If activeId exists and is valid in localStorage, use it
    if (activeId && map[activeId]) {
      return activeId;
    }

    // Fallback: Pick session with latest lastAccessedAt
    const sessions = Object.entries(map);
    if (sessions.length > 0) {
      sessions.sort((a, b) => b[1].lastAccessedAt - a[1].lastAccessedAt);
      const latestSessionId = sessions[0][0];
      sessionStorage.setItem("active_session_id", latestSessionId);
      return latestSessionId;
    }

    // No sessions found at all, clean up active_session_id
    sessionStorage.removeItem("active_session_id");
  } catch (error) {
    console.error("Failed to resolve active_session_id:", error);
  }
  return null;
}

/**
 * Updates the lastAccessedAt timestamp for a session and saves the map.
 * This is triggered upon reading tokens or session details to maintain fresh access records.
 */
function updateLastAccessed(sessionId: string): AuthSessionRecord | null {
  try {
    const map = getSessionsMap();
    const session = map[sessionId];
    if (session) {
      session.lastAccessedAt = Date.now();
      saveSessionsMap(map);
      return session;
    }
  } catch (error) {
    console.error("Failed to update lastAccessedAt for session:", error);
  }
  return null;
}

/**
 * Retrieves the access token of the active session.
 * Automatically updates lastAccessedAt.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSessionId();
  if (activeId) {
    const session = updateLastAccessed(activeId);
    return session ? session.accessToken : null;
  }
  return null;
}

/**
 * Retrieves the refresh token of the active session.
 * Automatically updates lastAccessedAt.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSessionId();
  if (activeId) {
    const session = updateLastAccessed(activeId);
    return session ? session.refreshToken : null;
  }
  return null;
}

/**
 * Retrieves the active user profile object.
 * Automatically updates lastAccessedAt.
 */
export function getActiveUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSessionId();
  if (activeId) {
    const session = updateLastAccessed(activeId);
    return session ? session.user : null;
  }
  return null;
}

/**
 * Retrieves the active session record.
 */
export function getActiveSession(): AuthSessionRecord | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSessionId();
  if (activeId) {
    return updateLastAccessed(activeId);
  }
  return null;
}

/**
 * Retrieves the active class ID.
 * Automatically updates lastAccessedAt.
 */
export function getActiveSessionClassId(): string | null {
  if (typeof window === "undefined") return null;
  const activeId = getActiveSessionId();
  if (activeId) {
    const session = updateLastAccessed(activeId);
    return session ? session.classId : null;
  }
  return null;
}

/**
 * Sets the active session class ID.
 * Automatically updates lastAccessedAt.
 */
export function setActiveSessionClassId(classId: string | null): void {
  try {
    if (typeof window === "undefined") return;
    const activeId = getActiveSessionId();
    if (activeId) {
      const map = getSessionsMap();
      const session = map[activeId];
      if (session) {
        session.classId = classId;
        session.lastAccessedAt = Date.now();
        saveSessionsMap(map);
      }
    }
  } catch (error) {
    console.error("Failed to set active session classId:", error);
  }
}

/**
 * High-level helper conforming to legacy codebase usage.
 * Clears or updates based on the provided token value.
 */
export function setAccessToken(token: string | null): void {
  if (token === null) {
    clearActiveSession();
  } else {
    updateActiveSessionToken(token);
  }
}

/**
 * Updates the tokens of the active session.
 * Automatically updates lastAccessedAt.
 */
export function updateActiveSessionToken(newAccessToken: string, newRefreshToken?: string): void {
  try {
    if (typeof window === "undefined") return;
    const activeId = getActiveSessionId();
    if (activeId) {
      const map = getSessionsMap();
      const session = map[activeId];
      if (session) {
        session.accessToken = newAccessToken;
        if (newRefreshToken) {
          session.refreshToken = newRefreshToken;
        }
        session.lastAccessedAt = Date.now();
        saveSessionsMap(map);
      }
    }
  } catch (error) {
    console.error("Failed to update active session token:", error);
  }
}

/**
 * Registers a new session under `session_user_${user.email}` and marks it as active for this tab.
 */
export function registerSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
  classId?: string | null
): void {
  try {
    if (typeof window === "undefined") return;

    const sessionId = `session_user_${user.email}`;
    const map = getSessionsMap();

    map[sessionId] = {
      accessToken,
      refreshToken,
      user,
      classId: classId || null,
      role: user.roles?.[0] || "ROLE_STUDENT",
      lastAccessedAt: Date.now(),
    };

    saveSessionsMap(map);
    sessionStorage.setItem("active_session_id", sessionId);
  } catch (error) {
    console.error("Failed to register session:", error);
  }
}

/**
 * Removes the active session of this tab from localStorage, and cleans the tab's active session ID.
 */
export function clearActiveSession(): void {
  try {
    if (typeof window === "undefined") return;

    const activeId = sessionStorage.getItem("active_session_id");
    if (activeId) {
      const map = getSessionsMap();
      delete map[activeId];
      saveSessionsMap(map);
    }
    sessionStorage.removeItem("active_session_id");
  } catch (error) {
    console.error("Failed to clear active session:", error);
  }
}

/**
 * Clears active session credentials.
 */
export function clearAccessToken(): void {
  clearActiveSession();
}

/**
 * Returns all active sessions stored in localStorage, sorted by lastAccessedAt descending.
 */
export function getSessions(): AuthSessionRecord[] {
  try {
    const map = getSessionsMap();
    return Object.values(map).sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
  } catch (error) {
    console.error("Failed to retrieve sessions list:", error);
    return [];
  }
}

/**
 * Removes a specific session matching the user's email or full session ID.
 * If the current tab is operating under the removed session, it clears the active ID pointer.
 */
export function removeSession(emailOrSessionId: string): void {
  try {
    if (typeof window === "undefined") return;

    const sessionId = emailOrSessionId.startsWith("session_user_")
      ? emailOrSessionId
      : `session_user_${emailOrSessionId}`;

    const map = getSessionsMap();
    if (map[sessionId]) {
      delete map[sessionId];
      saveSessionsMap(map);
    }

    const activeId = sessionStorage.getItem("active_session_id");
    if (activeId === sessionId) {
      sessionStorage.removeItem("active_session_id");
    }
  } catch (error) {
    console.error("Failed to remove session:", error);
  }
}
