import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // The apply form is one page now. Old links to its inner pages
  // (/joinus/team/technical, /joinus/success, ...) go back to the start.
  async redirects() {
    return [
      {
        source: '/joinus/:path+',
        destination: '/joinus',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;