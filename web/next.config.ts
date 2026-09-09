import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.PAGES_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/learnsy" : ""),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
