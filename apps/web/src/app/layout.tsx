import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CSV2CRM — AI-Powered Lead Importer",
  description: "Import CSV files and convert them to GrowEasy CRM format using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
