/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true, // You can enable this if desired, but keep minimal for now
  // Add any other essential configurations if absolutely necessary for startup,
  // but aim for minimal to test API routing.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
