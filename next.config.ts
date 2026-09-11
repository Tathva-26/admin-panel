import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.21.3.188"],
  turbopack: {
    // Without this, Turbopack walks up past the repo and picks up a stray
    // package-lock.json in the user's home directory, then warns on every build.
    root: import.meta.dirname,
  },
};

export default nextConfig;
