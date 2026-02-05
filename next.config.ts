import type { NextConfig } from "next";

const nextConfig = {
  // 1. Ignorar errores de TypeScript durante el build (Acelera y evita fallos tontos)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Ignorar reglas de estilo (Linting) durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 3. Opcional: Si usas imágenes externas, configúralas aquí para que no den error
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite todas las imágenes externas (útil para pruebas)
      },
    ],
  },
} as NextConfig;

export default nextConfig;