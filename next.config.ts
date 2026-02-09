import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================================
  // PERFORMANCE - Otimizacoes de build e runtime
  // ============================================================
  reactStrictMode: true,

  // Compressao habilitada
  compress: true,

  // Otimizacao de pacotes pesados - tree-shaking melhorado
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      'react-syntax-highlighter',
      '@supabase/supabase-js',
      'langchain',
      '@langchain/core',
      '@langchain/anthropic',
      '@langchain/openai',
      '@langchain/google-genai',
    ],
  },

  // ============================================================
  // IMAGENS - Otimizacao com next/image
  // ============================================================
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zkcstkbpgwdoiihvfspp.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
    ],
  },

  // ============================================================
  // HEADERS - Seguranca e cache
  // ============================================================
  async headers() {
    return [
      {
        // Headers de seguranca para todas as rotas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache de assets estaticos (1 ano)
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache do Service Worker (sem cache)
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Cache do manifest
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // ============================================================
  // LOGGING - Reduzir logs em producao
  // ============================================================
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
