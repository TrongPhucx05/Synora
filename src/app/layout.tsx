import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme/constants";
import { themeInitScript } from "@/lib/theme/script";
import {
  LOCALE_COOKIE_KEY,
  isValidLocale,
  type Locale,
} from "@/lib/i18n/constants";

export const metadata: Metadata = {
  title: "Synora - Nền tảng học tập cộng đồng",
  description: "Modern collaborative social-learning platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const initialLocale: Locale = isValidLocale(localeCookie)
    ? localeCookie
    : "vi";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
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
            <ThemeProvider>
              <LanguageProvider initialLocale={initialLocale}>
                {children}
              </LanguageProvider>
            </ThemeProvider>
          </NextAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}