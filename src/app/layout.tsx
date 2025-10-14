import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthContext from "./context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitQ - Track Your Habits",
  description: "A habit tracking application with calendar heatmap visualization",
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
        <AuthContext>
          {children}
        </AuthContext>
      </body>
    </html>
  );
}
