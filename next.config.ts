import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: serverExternalPackages replaces experimental.serverComponentsExternalPackages
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
