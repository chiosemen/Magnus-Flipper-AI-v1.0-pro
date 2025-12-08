"use client";

import "./globals.css";

import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body 
        style={{ 
          position: "relative", 
          overflowX: "hidden",
          backgroundColor: "#000"
        }}
      >
        {children}
      </body>
    </html>
  );
}
