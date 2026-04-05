"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAccessToken, clearAccessToken } from "@/services/api/token-store"; 
import Cookies from "js-cookie"; 
import { getCurrentUser } from "@/services/auth/auth.service";

// 1. Định nghĩa kiểu dữ liệu cho Context
interface AppContextType {
  userEmail: string | null;
  classId: string | null;
  isLoaded: boolean;
  
  setUserEmail: (email: string | null) => void;
  setClassId: (id: string | null) => void;
  logout: () => void;
}

interface UserWithTeams {
  email: string;
  teams?: Array<{ id: number | string }>;
}

// 2. Tạo Context với giá trị mặc định
const AppContext = createContext<AppContextType | undefined>(undefined);

// 3. Provider Component để bọc ngoài ứng dụng
export function AppProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = getAccessToken();
        
        if (token) {
          // BƯỚC 1: Lấy classId từ Cookie (Đây là Nguồn gốc chuẩn vì nó lưu lúc Login hoặc chọn lớp)
         const savedClassId = Cookies.get("classId") || localStorage.getItem("classId");
          if (savedClassId) {
            setClassId(savedClassId);
          }

          // BƯỚC 2: Gọi API /auth/me để cập nhật Email
          const latestUser = await getCurrentUser();
          
          if (latestUser) {
            setUserEmail(latestUser.email);
            
            // XÓA ĐOẠN DÙNG latestUser.code (Vì đó là Mã sinh viên)
            
            // Backup: Nếu Cookie classId bị mất, ta lấy ID của Team đầu tiên mà User này tham gia
            const userTeams = (latestUser as unknown as UserWithTeams)?.teams || [];
            if (!savedClassId && userTeams.length > 0) {
                const firstTeamId = userTeams[0].id.toString();
                setClassId(firstTeamId);
                Cookies.set("classId", firstTeamId, { expires: 7 });
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khởi tạo App Context hoặc Token hết hạn:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initializeApp();
  }, []);

  // Hàm đăng xuất tiện lợi
  const logout = () => {
    clearAccessToken();
    setUserEmail(null);
    setClassId(null);
    
    // Xóa luôn cookie/localstorage khi đăng xuất cho sạch sẽ
    Cookies.remove("classId");
    Cookies.remove("userEmail");
    localStorage.removeItem("classId");
    localStorage.removeItem("userEmail");
  };

  return (
    <AppContext.Provider
      value={{
        userEmail,
        classId,
        isLoaded,
        setUserEmail,
        setClassId,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// 4. Custom hook để sử dụng Context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext phải được sử dụng bên trong AppProvider");
  }
  return context;
}