import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  experimental: {
    cpus: 1,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Utiliser le cache en mémoire en développement pour éviter le bug PackFileCacheStrategy
      // "RangeError: Array buffer allocation failed" sous Windows
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
