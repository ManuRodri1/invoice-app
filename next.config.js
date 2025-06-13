/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para producción en Vercel
  output: "standalone",

  // Optimizaciones de imagen
 images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lnvcylhijpdnpnuwdchk.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
  formats: ["image/webp", "image/avif"],
},


  // Variables de entorno públicas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ]
  },

  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuración experimental
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
}

module.exports = nextConfig
