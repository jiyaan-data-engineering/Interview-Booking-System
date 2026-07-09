import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Booking Dashboard",
  description: "Modern interview slot booking and management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
