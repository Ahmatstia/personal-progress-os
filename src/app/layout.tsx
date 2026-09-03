import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgressBar } from "@/app/components/core/NavigationProgressBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Personal Progress OS",
  description:
    "Personal system untuk mengelola dan memahami perkembangan diri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
