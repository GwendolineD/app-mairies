import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  // web-push relies on native Node APIs and must not be bundled; keeping it
  // external ensures it is traced into the standalone server output (otherwise
  // the dynamic import resolves to null in production and no push is sent).
  serverExternalPackages: ["web-push"],
  ...(isDev && { allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io"] }),
  experimental: {
    serverActions: {
      ...(isDev && { allowedOrigins: ["*.ngrok-free.app", "*.ngrok.io"] }),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://res.cloudinary.com data: blob: https://*.tile.openstreetmap.org",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api-adresse.data.gouv.fr https://geo.api.gouv.fr https://*.tile.openstreetmap.org",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
