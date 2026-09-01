import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
