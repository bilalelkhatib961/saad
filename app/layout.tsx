import type React from "react";
import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

const _geist = Montserrat({ subsets: ["latin"] });
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gallery | Photography Collection",
  description:
    "Explore our stunning collection of photographs from around the world",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${_geist.className} bg-[#0f0f0f] text-white antialiased`}
      >
        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
            <main className="relative isolate overflow-hidden bg-[#0f0f0f] text-white min-h-[calc(100vh-220px)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,214,170,0.25),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(159,196,255,0.2),_transparent_50%)]"
              />
              <div className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-[#2b2b2b]/60 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-[#3b2d20]/70 blur-3xl" />
              <Navbar />
              <div className="mt-16">{children}</div>
              <Footer />
            </main>
          </div>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
