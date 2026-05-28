/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint warnings/errors don't block the production build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
