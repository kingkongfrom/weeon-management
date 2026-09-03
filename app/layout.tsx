import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/theme";
import { siteCopy } from "@/lib/site-copy";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    applicationName: "Weeon Ops",
    title: {
      default: siteCopy.meta.title,
      template: "%s · Weeon Ops",
    },
    description: siteCopy.meta.description,
    authors: [{ name: "Kingkongfrom / EduNova" }],
    robots: { index: false, follow: false },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title: "Weeon Ops",
      statusBarStyle: "default",
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1c2230" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script
          id="weeon-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
