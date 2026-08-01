/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@keyclash/ui", "@keyclash/game-engine", "@keyclash/database", "@keyclash/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

module.exports = nextConfig;
