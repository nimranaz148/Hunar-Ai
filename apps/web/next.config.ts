import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/admin/runs",
        destination: "/runs",
      },
      {
        source: "/admin/runs/:path*",
        destination: "/runs/:path*",
      },
      {
        source: "/admin/audit",
        destination: "/audit",
      },
      {
        source: "/admin/users",
        destination: "/users",
      },
      {
        source: "/admin/settings",
        destination: "/settings",
      },
    ];
  },
};

export default nextConfig;

