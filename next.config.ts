const nextConfig = {
  reactStrictMode: true,

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Firebase Storage public URLs
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        // Local dev Express server (backward compat for existing DB records)
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "se-project-group.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
