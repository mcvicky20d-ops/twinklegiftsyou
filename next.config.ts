import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product and gallery images are pasted in or uploaded to Cloudinary from the
    // admin panel, so any https host has to be allowed.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
