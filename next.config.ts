import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, Turbopack walks up past the repo and picks up a stray
    // package-lock.json in the user's home directory, then warns on every build.
    root: import.meta.dirname,
  },
};

export default nextConfig;
