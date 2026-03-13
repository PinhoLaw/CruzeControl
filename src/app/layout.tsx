import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "JDE Mission Control",
  description: "Just Drive Events — Sale Event Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-jde-bg text-jde-text">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
