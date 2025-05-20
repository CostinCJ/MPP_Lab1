import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sqlite3'],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
