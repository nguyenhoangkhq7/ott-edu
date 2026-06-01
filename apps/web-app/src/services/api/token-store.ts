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

export interface UserSessionMetadata {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
}

export function getSessionsMetadata(): UserSessionMetadata[] {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("auth_sessions_metadata");
      return raw ? JSON.parse(raw) : [];
    }
  } catch (e) {
    console.error("Failed to read auth_sessions_metadata:", e);
  }
  return [];
}

export function saveSessionMetadata(user: AuthUser): void {
  try {
    if (typeof window !== "undefined") {
      const list = getSessionsMetadata();
      const exists = list.some((u) => u.email === user.email);
      const metadataItem: UserSessionMetadata = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.roles?.[0] || "ROLE_STUDENT",
      };
      if (!exists) {
        list.push(metadataItem);
        localStorage.setItem("auth_sessions_metadata", JSON.stringify(list));
      } else {
        const updated = list.map((u) => (u.email === user.email ? metadataItem : u));
        localStorage.setItem("auth_sessions_metadata", JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.error("Failed to save auth_sessions_metadata:", e);
  }
}

export function removeSessionMetadata(email: string): void {
  try {
    if (typeof window !== "undefined") {
      const list = getSessionsMetadata();
      const filtered = list.filter((u) => u.email !== email);
      localStorage.setItem("auth_sessions_metadata", JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Failed to remove auth_sessions_metadata:", e);
  }
}

// Strictly in-memory secure closure variables (XSS immune)
let inMemoryAccessToken: string | null = null;
let inMemoryUser: AuthUser | null = null;
let inMemoryClassId: string | null = null;

/**
 * Retrieves the access token from secure Javascript memory.
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Refresh tokens are managed exclusively by the browser via HttpOnly cookies,
 * so they are never exposed to Javascript code.
 */
export function getRefreshToken(): string | null {
  return null;
}

/**
 * Retrieves the active user profile from secure Javascript memory.
 */
export function getActiveUser(): AuthUser | null {
  return inMemoryUser;
}

/**
 * Retrieves the active class ID from secure Javascript memory.
 */
export function getActiveSessionClassId(): string | null {
  return inMemoryClassId;
}

/**
 * Sets the active class ID in secure Javascript memory.
 */
export function setActiveSessionClassId(classId: string | null): void {
  inMemoryClassId = classId;
}

/**
 * High-level helper for updates or clearing.
 */
export function setAccessToken(token: string | null): void {
  if (token === null) {
    clearActiveSession();
  } else {
    updateActiveSessionToken(token);
  }
}

/**
 * Updates the active session access token in secure Javascript memory.
 */
export function updateActiveSessionToken(newAccessToken: string, newRefreshToken?: string): void {
  inMemoryAccessToken = newAccessToken;
  void newRefreshToken;
}

/**
 * Retrieves the active user's ID/email from localStorage.
 * Safe for Next.js SSR.
 */
export function getActiveUserId(): string | null {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem("active_user_id");
    }
  } catch (error) {
    console.error("Failed to read active_user_id from localStorage:", error);
  }
  return null;
}

/**
 * Registers all credentials and user profile for a logged-in user in secure Javascript memory.
 */
export function registerSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
  classId?: string | null
): void {
  inMemoryAccessToken = accessToken;
  inMemoryUser = user;
  if (classId) {
    inMemoryClassId = classId;
  }
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("active_user_id", user.email);
      sessionStorage.setItem("userEmail", user.email);
      saveSessionMetadata(user);
    }
  } catch (error) {
    console.error("Failed to save active_user_id in localStorage:", error);
  }
}

/**
 * Wipes out all active authentication data from secure Javascript memory.
 */
export function clearActiveSession(): void {
  const email = inMemoryUser?.email;
  inMemoryAccessToken = null;
  inMemoryUser = null;
  inMemoryClassId = null;
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_user_id");
      sessionStorage.removeItem("userEmail");
      if (email) {
        removeSessionMetadata(email);
      }
    }
  } catch (error) {
    console.error("Failed to clear active_user_id from localStorage:", error);
  }
}

/**
 * Wipes out all active authentication data.
 */
export function clearAccessToken(): void {
  clearActiveSession();
}

/**
 * Resolves the active session record if valid credentials exist in secure Javascript memory.
 */
export function getActiveSession(): AuthSessionRecord | null {
  if (inMemoryAccessToken && inMemoryUser) {
    return {
      accessToken: inMemoryAccessToken,
      refreshToken: "",
      user: inMemoryUser,
      classId: inMemoryClassId,
      role: inMemoryUser.roles?.[0] || "ROLE_STUDENT",
      lastAccessedAt: Date.now(),
    };
  }
  return null;
}

/**
 * Returns all active sessions in the current context (single-item array).
 */
export function getSessions(): AuthSessionRecord[] {
  const session = getActiveSession();
  return session ? [session] : [];
}

/**
 * Removes the session context.
 */
export function removeSession(emailOrSessionId: string): void {
  void emailOrSessionId;
  clearActiveSession();
}
