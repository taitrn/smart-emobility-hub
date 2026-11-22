import { isIPv4 } from "node:net";
import type { NextConfig } from "next";

const lanOrigin = process.env.NEXT_DEV_ALLOWED_ORIGIN?.trim();
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === "development" && lanOrigin && isIPv4(lanOrigin)
    ? { allowedDevOrigins: [lanOrigin] }
    : {}),
};

export default nextConfig;
