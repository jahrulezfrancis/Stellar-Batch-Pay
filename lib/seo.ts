import type { Metadata } from "next";

export const siteName = "Stellar BatchPay";
export const siteDescription =
  "Send multiple payments on the Stellar blockchain in seconds. Simple, fast, and secure batch payment processing.";
export const titleTemplate = `%s | ${siteName}`;
export const shareImage = "/logo.png";

export function makePageMetadata(
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
      title,
      description,
      images: [shareImage],
    },
  };
}
