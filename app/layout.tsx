import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { getRequestSidebarCollapsed } from "@/lib/dashboard/request-sidebar";
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_DARK_BG,
  THEME_LIGHT_BG,
} from "@/lib/theme/theme";
import { getRequestTheme, themeBackground } from "@/lib/theme/request-theme";
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

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    applicationName: "Weeon Ops",
    title: {
      default: siteCopy.meta.title,
      template: "%s · Weeon Ops",
    },
    description: siteCopy.meta.description,
    authors: [{ name: "Kingkongfrom" }],
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
    { media: "(prefers-color-scheme: light)", color: THEME_LIGHT_BG },
    { media: "(prefers-color-scheme: dark)", color: THEME_DARK_BG },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [theme, sidebarCollapsed] = await Promise.all([
    getRequestTheme(),
    getRequestSidebarCollapsed(),
  ]);
  const htmlClass = [
    geistSans.variable,
    geistMono.variable,
    bricolage.variable,
    "antialiased",
    theme === "dark" ? "dark" : "",
    sidebarCollapsed ? "sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={htmlClass}
      style={{ backgroundColor: themeBackground(theme), colorScheme: theme }}
    >
      <head>
        <script
          id="weeon-theme"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
