import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellar-batch-pay.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/about", "/contact"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}