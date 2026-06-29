import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@stellar/freighter-api"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stellar/freighter-api": "@stellar/freighter-api/build/index.min.js",
    };
    return config;
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@stellar/freighter-api": "@stellar/freighter-api/build/index.min.js",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://horizon-futurenet.stellar.org https://soroban-testnet.stellar.org https://soroban-mainnet.stellar.org https://soroban-futurenet.stellar.org https://*.stellar.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
