import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker imajı için bağımsız (standalone) çıktı.
  output: "standalone",
  // Prisma client'ı sunucu tarafında bundle dışı tut.
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      // BunnyCDN (görseller + 3D poster'lar)
      { protocol: "https", hostname: "*.b-cdn.net" },
      // AR Code mock provider'ın örnek model poster'ları
      { protocol: "https", hostname: "modelviewer.dev" },
    ],
  },
};

export default nextConfig;
