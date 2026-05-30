import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import StellarFooter from "@/components/landing/StellarFooter";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "@/contexts/WalletContext";
import { AddressBookProvider } from "@/contexts/AddressBookContext";
import { NetworkWarning } from "@/components/network-warning";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Stellar BatchPay",
  description:
    "Send multiple payments on the Stellar blockchain in seconds. Simple, fast, and secure batch payment processing.",
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased bg-[#0B0F1A] text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider expectedNetwork="testnet">
            <AddressBookProvider>
              {children}
              <NetworkWarning />
            </AddressBookProvider>
          </WalletProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
