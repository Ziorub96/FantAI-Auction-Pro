import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  basePath: "/FantAI-Auction-Pro",

  images: {
    unoptimized: true,
  },

  trailingSlash: true,
};

export default nextConfig;