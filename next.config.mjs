/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to focus on deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
