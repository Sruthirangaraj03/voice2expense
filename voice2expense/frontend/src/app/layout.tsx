import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vocal Ledger Pro - AI Expense Tracker",
  description: "Log, categorize, and analyze expenses using voice with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F5F5F0]`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
