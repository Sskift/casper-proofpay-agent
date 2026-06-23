import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@proofpay/agent", "@proofpay/casper"]
};

export default nextConfig;
