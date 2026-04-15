const TOKEN_KEY = "accessToken";

function getStoredToken(): string | null {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Failed to get token from localStorage:", error);
  }
  return null;
}

function setStoredToken(token: string | null): void {
  try {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  } catch (error) {
    console.error("Failed to set token in localStorage:", error);
  }
}

export function getAccessToken(): string | null {
  return getStoredToken();
}

export function setAccessToken(token: string | null): void {
  setStoredToken(token);
}

export function clearAccessToken(): void {
  setStoredToken(null);
}
