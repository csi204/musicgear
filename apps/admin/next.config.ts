import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@react-pdf/renderer"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
}

export default nextConfig
