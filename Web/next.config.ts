// next.config.ts
import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  // Wenn du das wirklich brauchst:
  outputFileTracingRoot: process.cwd(),
};

export default withFlowbiteReact(nextConfig);
