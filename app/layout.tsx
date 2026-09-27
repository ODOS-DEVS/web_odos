import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemedToaster } from "@/components/layout/themed-toaster";
import CONFIG from "@/utils/config";
import { themeScript } from "@/libs/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.SITE_URL),
  title: {
    default: `${CONFIG.SITE_NAME} — one cart, every vendor`,
    template: `%s · ${CONFIG.SITE_NAME}`,
  },
  description: CONFIG.SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#12110e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by the inline script before hydration, so the attribute differs from the server HTML.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
        <ThemedToaster />
      </body>
    </html>
  );
}
