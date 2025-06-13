#!/bin/bash

echo "🚀 Configurando LL THERMOART Invoice App..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Descárgalo desde https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo de entorno si no existe
if [ ! -f .env.local ]; then
    echo "🔧 Creando archivo de configuración..."
    cp .env.local.example .env.local
    echo "⚠️  IMPORTANTE: Edita .env.local con tus datos de Supabase"
fi

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita .env.local con tus datos de Supabase"
echo "2. Ejecuta: npm run dev"
echo "3. Abre: http://localhost:3000"
echo ""
echo "🌐 Para producción:"
echo "1. Sube el código a GitHub"
echo "2. Conecta con Vercel"
echo "3. Configura las variables de entorno en Vercel"
echo ""
echo "🎉 ¡Listo para usar!"
