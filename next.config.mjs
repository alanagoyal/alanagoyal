/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only apply rewrites if NEXT_PUBLIC_MESSAGES_URL is defined
    if (process.env.NEXT_PUBLIC_MESSAGES_URL) {
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
    }
    return [];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/notes',
        permanent: false,
      },
      {
        source: '/:path((?!notes|api|messages|_next|static|public|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
        destination: '/notes/:path',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
