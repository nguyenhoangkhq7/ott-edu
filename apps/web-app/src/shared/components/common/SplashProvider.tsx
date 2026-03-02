"use client";
import { useEffect, useState, createContext, useContext } from "react";
import AppLoader from "./AppLoader";

const SplashContext = createContext<{ done: boolean }>({ done: false });

export function useSplash() {
  return useContext(SplashContext);
}

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Show splash for at least 1.5s, hoặc cho đến khi video kết thúc (cái nào lâu hơn)
    const timeout = setTimeout(() => setDone(true), 1800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SplashContext.Provider value={{ done }}>
      {!done && <AppLoader />}
      {done && children}
    </SplashContext.Provider>
  );
}
