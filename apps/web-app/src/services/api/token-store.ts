let accessToken: string | null = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ0ZXN0dXNlckBnbWFpbC5jb20iLCJhY2NvdW50SWQiOjIsInJvbGVzIjpbIlJPTEVfSU5TVFJVQ1RPUiJdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc1MjE2OTUzLCJleHAiOjE3NzUyMTc4NTN9.u-cbOXnB7Jq5E3p5st_0S8ENoA-ckNGoovXOhksUAVW7nFx8_RQTzof0RX1Gif4R"
export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
