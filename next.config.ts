import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/du3ko16j1/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
