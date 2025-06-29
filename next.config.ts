import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // กำหนดขนาด limit เป็น 5 เมกะไบต์
    },
  },
};

export default nextConfig;
