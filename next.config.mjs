/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/messages',
        destination: `${process.env.NEXT_PUBLIC_MESSAGES_URL}/messages`,
      },
      {
        source: '/messages/:path*',
        destination: `${process.env.NEXT_PUBLIC_MESSAGES_URL}/messages/:path*`,
      },
    ];
  },
};

export default nextConfig;
