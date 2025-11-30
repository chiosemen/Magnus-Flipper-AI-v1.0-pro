import React from "react";
import "../styles.css";

export const metadata = {
  title: "Magnus Flipper Dashboard",
  description: "Live scraper activity"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
