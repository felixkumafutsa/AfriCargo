/** @type {import('next').NextConfig} */
const path = require("node:path");

const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
};

module.exports = nextConfig;
