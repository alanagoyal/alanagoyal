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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/notes',
        permanent: false,
      },
      {
        source: '/:slug((?!notes|api|messages|_next|static|public|favicon.ico).+)',
        destination: '/notes/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
