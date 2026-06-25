import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  transpilePackages: ["@proofpay/agent", "@proofpay/casper"],
  ...(isGitHubPagesBuild
    ? {
        basePath: "/casper-proofpay-agent",
        assetPrefix: "/casper-proofpay-agent",
        trailingSlash: true,
        images: {
          unoptimized: true
        }
      }
    : {})
};

export default nextConfig;
