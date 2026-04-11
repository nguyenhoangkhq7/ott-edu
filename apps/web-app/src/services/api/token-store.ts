let accessToken: string | null = null;

const TOKEN_KEY = 'accessToken';

export function getAccessToken(): string | null {
  // Trước tiên kiểm tra memory
  if (accessToken) {
    return accessToken;
  }

  // Nếu không có trong memory, try lấy từ localStorage
  // (Chỉ hoạt động trên client-side)
  if (typeof window !== 'undefined') {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        accessToken = storedToken;
        return storedToken;
      }
    } catch (e) {
      console.error('Lỗi đọc token từ localStorage:', e);
    }
  }

  return null;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  
  // Lưu vào localStorage để persist token khi reload
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Lỗi lưu token vào localStorage:', e);
    }
  }
}

export function clearAccessToken(): void {
  accessToken = null;
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Lỗi xóa token khỏi localStorage:', e);
    }
  }
}
