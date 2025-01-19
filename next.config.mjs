/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
        {
          source: '/messages/:path*',
          destination: `${process.env.MESSAGES_URL}/messages/:path*`,
        }
    ];
  },
};

export default nextConfig;
