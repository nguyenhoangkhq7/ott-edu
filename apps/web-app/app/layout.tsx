import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AppProviders from "@/shared/providers/AppProviders";

import "./globals.css";
import { SplashProvider } from "@/shared/components/common/SplashProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teams Dashboard",
  description: "Enterprise Teams dashboard UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <SplashProvider>
            {children}
          </SplashProvider>
        </AppProviders>
      </body>
    </html>
  );
}
