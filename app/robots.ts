import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellar-batch-pay.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/about", "/contact"],
        disallow: ["/api", "/dashboard"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}