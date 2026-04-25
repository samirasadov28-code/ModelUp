

const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  env: {
    PYTHON_SERVICE_URL: process.env.PYTHON_SERVICE_URL || "http://localhost:8000",
  },
};

export default nextConfig;
