import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "@prisma/client"],
  poweredByHeader: false,
  // Fewer build workers keeps memory low on small servers and laptops.
  experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS ?? 2) },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
