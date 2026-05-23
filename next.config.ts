import type { NextConfig } from "next";
import withPWA from "next-pwa";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    domains: ["maps.googleapis.com", "api.mapbox.com"],
    formats: ["image/avif", "image/webp"],
  },

  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
      ],
    },
  ],

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(config);
