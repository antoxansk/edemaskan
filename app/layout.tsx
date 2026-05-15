import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { YandexMetrika } from "@/components/shared/yandex-metrika";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edemaskan — AI-анализ зон отёчности лица | УПДН",
  description:
    "Бесплатный анализ отёчности лица по 4 фото. Узнайте причину и получите 7-дневный план от нутрициологов УПДН. Без регистрации, 60 секунд.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="top-center" richColors />
        <YandexMetrika />
      </body>
    </html>
  );
}
