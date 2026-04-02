let accessToken: string | null = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0dXNlckBnbWFpbC5jb20iLCJhY2NvdW50SWQiOjIsInJvbGVzIjpbIlJPTEVfSU5TVFJVQ1RPUiJdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc1MTE3Mzc2LCJleHAiOjE3NzUxMTgyNzZ9.BjjJLGWS09aOyWn8P_oI55P6RBOQ0xFrxQ9qVS924m2tD6dRaPkTOYqiy63GQa-P"
export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
