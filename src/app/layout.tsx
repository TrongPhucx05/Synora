import type { Metadata } from "next";
import "./globals.css";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import { themeInitScript } from "@/lib/theme/script";

export const metadata: Metadata = {
  title: "Synora - Nền tảng học tập cộng đồng",
  description: "Modern collaborative social-learning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript(THEME_STORAGE_KEY),
          }}
        />
      </head>
      <body>
        <ToastProvider>
          <NextAuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </NextAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}