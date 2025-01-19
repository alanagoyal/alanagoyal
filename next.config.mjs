/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
        {
          source: '/messages/:path*',
          destination: `${process.env.NEXT_PUBLIC_MESSAGES_URL}/messages/:path*`,
        }
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/notes',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
