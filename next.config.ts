import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone output is for the Docker image (STANDALONE=1). On the atelier computer the
  // app runs with `next start` from the project folder, so relative paths in .env work.
  output: process.env.STANDALONE ? "standalone" : undefined,
  serverExternalPackages: ["sharp", "@prisma/client"],
  poweredByHeader: false,
  // Uploaded client files are read at runtime from STORAGE_DIR; never copy them into the build.
  outputFileTracingExcludes: { "*": ["./storage/**", "./prisma/*.db*"] },
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
