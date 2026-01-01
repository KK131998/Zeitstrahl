import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;

export default withFlowbiteReact(nextConfig);
