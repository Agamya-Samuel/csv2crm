import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
