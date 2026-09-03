import type { Metadata } from "next";
import "./globals.css";
import { siteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: siteCopy.meta.title,
    description: siteCopy.meta.description,
    authors: [{ name: "Kingkongfrom / EduNova" }],
    robots: { index: false, follow: false },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
