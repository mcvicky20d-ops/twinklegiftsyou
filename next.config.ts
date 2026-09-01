import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product and gallery images are pasted in or uploaded to Cloudinary from the
    // admin panel, so any https host has to be allowed.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // The bundled sample artwork is SVG, which the optimizer refuses by default
    // because an SVG can carry script. The CSP below is served with every
    // optimised image and sandboxes exactly that: no scripts, no outbound
    // fetches, no plugins — so the format is safe to allow.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
