"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Khung xương dữ liệu dùng chung cho toàn App
interface AppContextType {
  token: string;
  userEmail: string;
  classId: string;
  setToken: (token: string) => void;
  setUserEmail: (email: string) => void;
  setClassId: (classId: string) => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState('');
  const [userEmail, setUserEmailState] = useState('');
  const [classId, setClassIdState] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Lấy dữ liệu từ localStorage 1 lần duy nhất khi load web
 // AppContext.tsx

useEffect(() => {
  const initializeAuth = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || '';
      const email = localStorage.getItem('userEmail') || 'tran.hau@gmail.com';
      const classId = localStorage.getItem('classId') || 'DHKTPM18C';

      // Cập nhật state
      setTokenState(token);
      setUserEmailState(email);
      setClassIdState(classId);
      setIsLoaded(true);
    }
  };

  initializeAuth();
}, []);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem('accessToken', newToken);
  };

  const setUserEmail = (newEmail: string) => {
    setUserEmailState(newEmail);
    localStorage.setItem('userEmail', newEmail);
  };

  const setClassId = (newClassId: string) => {
    setClassIdState(newClassId);
    localStorage.setItem('classId', newClassId);
  };

  return (
    <AppContext.Provider value={{ token, userEmail, classId, setToken, setUserEmail, setClassId, isLoaded }}>
      {children}
    </AppContext.Provider>
  );
};

// Hàm hook để các component khác lấy dữ liệu ra xài
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext phải được sử dụng bên trong AppProvider');
  }
  return context;
};