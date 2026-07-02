import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalAnalytics } from "@/components/conditional-analytics";
import StellarFooter from "@/components/landing/StellarFooter";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/contexts/WalletContext";
import { AddressBookProvider } from "@/contexts/AddressBookContext";
import { NetworkWarning } from "@/components/network-warning";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { siteDescription, siteName, titleTemplate, shareImage } from "@/lib/seo";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: siteName,
    template: titleTemplate,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [shareImage],
  },
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon-light-32x32.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-black focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider expectedNetwork={(process.env.NEXT_PUBLIC_STELLAR_NETWORK as "testnet" | "mainnet") ?? "testnet"}>
            <QueryProvider>
              <AddressBookProvider>
                {children}
                <NetworkWarning />
              </AddressBookProvider>
            </QueryProvider>
          </WalletProvider>
          <Toaster />
          <SonnerToaster />
          <ConditionalAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
