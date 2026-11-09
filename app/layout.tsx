import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemedToaster } from "@/components/layout/themed-toaster";
import CONFIG from "@/utils/config";
import { themeScript } from "@/libs/theme";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.SITE_URL),
  applicationName: CONFIG.SITE_NAME,
  title: {
    default: `${CONFIG.SITE_NAME} — one cart, every vendor`,
    template: `%s · ${CONFIG.SITE_NAME}`,
  },
  description: CONFIG.SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  keywords: [
    "ODOS",
    "online marketplace Ghana",
    "local vendors",
    "multi-vendor shopping",
    "Ghana online shopping",
  ],
  category: "shopping",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: CONFIG.SITE_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: CONFIG.SITE_NAME,
    title: `${CONFIG.SITE_NAME} — one cart, every vendor`,
    description: CONFIG.SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/opengraph-image.png",
        width: 837,
        height: 486,
        alt: "ODOS — one cart, every vendor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${CONFIG.SITE_NAME} — one cart, every vendor`,
    description: CONFIG.SITE_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
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
    <html lang="en" className={`h-full ${montserrat.variable}`} suppressHydrationWarning>
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
