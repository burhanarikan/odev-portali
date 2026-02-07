/**
 * Next.js yapılandırması (ileride Next.js kullanılırsa).
 * Şu an frontend Vite ile build ediliyor; bu dosya Vercel deploy ve
 * olası Next.js API rotaları için referans amaçlıdır.
 *
 * API rotalarında fs (dosya sistemi) KULLANMAYIN — Vercel serverless
 * ortamında yazılabilir dosya sistemi yoktur. Bunun yerine:
 * - Vercel Blob (@vercel/blob) ile yükleme
 * - İstek gövdesinden base64 / Buffer kullanımı
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel'de sorun çıkarmamak için API rotalarında fs kullanmayın
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // İsteğe bağlı: Edge Runtime kullanacak API route'lar için
  // export const runtime = 'edge' kullanın (fs yok)
};

module.exports = nextConfig;
