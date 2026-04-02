let accessToken: string | null = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0dXNlckBnbWFpbC5jb20iLCJhY2NvdW50SWQiOjIsInJvbGVzIjpbIlJPTEVfSU5TVFJVQ1RPUiJdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc1MTQ0Njk3LCJleHAiOjE3NzUxNDU1OTd9.6vBnNHi-GaY3cqDoLQKb5QMUkYdqy7egIUuFkD-LYFsa5X3HRrGQAqvA6_GEf08h"
export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
