import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default withNextIntl(nextConfig);
