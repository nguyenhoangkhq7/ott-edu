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
          const savedClassId = Cookies.get("classId") || localStorage.getItem("classId");
          const latestUser = await getCurrentUser();
          
          if (latestUser) {
            setUserEmail(latestUser.email);

            const userTeams = (latestUser as unknown as UserWithTeams)?.teams || [];
            const accessibleTeamIds = new Set(
              userTeams.map((team) => team.id.toString())
            );

            if (savedClassId && accessibleTeamIds.has(savedClassId)) {
              setClassId(savedClassId);
            } else if (userTeams.length > 0) {
              const firstTeamId = userTeams[0].id.toString();
              setClassId(firstTeamId);
              Cookies.set("classId", firstTeamId, { expires: 7 });
              localStorage.setItem("classId", firstTeamId);
            } else {
              setClassId(null);
              Cookies.remove("classId");
              localStorage.removeItem("classId");
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khởi tạo App Context hoặc Token hết hạn:", error);
        clearAccessToken();
        setUserEmail(null);
        setClassId(null);
        Cookies.remove("classId");
        Cookies.remove("userEmail");
        localStorage.removeItem("classId");
        localStorage.removeItem("userEmail");
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
