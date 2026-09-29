import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
};

module.exports = {
  allowedDevOrigins: ['100.100.148.37'],
}

export default nextConfig;
