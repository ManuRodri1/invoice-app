# 🏢 LL THERMOART - Sistema de Facturación

Sistema de facturación moderno y completo desarrollado con Next.js, TypeScript, Tailwind CSS y Supabase.

## 🚀 Configuración Rápida en Visual Studio Code

### 📋 Prerrequisitos

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Visual Studio Code** - [Descargar aquí](https://code.visualstudio.com/)
- **Git** - [Descargar aquí](https://git-scm.com/)

### 🔧 Instalación Paso a Paso

#### 1. **Clonar o Descargar el Proyecto**
\`\`\`bash
# Si tienes Git instalado
git clone [URL_DEL_REPOSITORIO]
cd ll-thermoart-invoice-app

# O simplemente descarga y extrae el ZIP
\`\`\`

#### 2. **Abrir en Visual Studio Code**
\`\`\`bash
# Desde la terminal
code .

# O abre VS Code y usa File > Open Folder
\`\`\`

#### 3. **Instalar Dependencias**
\`\`\`bash
# En la terminal de VS Code (Ctrl + `)
npm install
\`\`\`

#### 4. **Configurar Base de Datos**

**📍 AQUÍ ES DONDE CAMBIAS LA CONEXIÓN A BASE DE DATOS:**

1. **Copia el archivo de configuración:**
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. **Edita `.env.local` con tus datos de Supabase:**
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   \`\`\`

3. **¿Dónde encontrar estos datos?**
   - Ve a [supabase.com](https://supabase.com)
   - Entra a tu proyecto
   - Ve a **Settings > API**
   - Copia **Project URL** y **anon public key**

#### 5. **Ejecutar en Desarrollo**
\`\`\`bash
npm run dev
\`\`\`

**¡Listo!** Abre http://localhost:3000

---

## 🌐 Despliegue en Vercel (Producción)

### 🚀 Opción 1: Desde GitHub (Recomendado)

#### 1. **Subir a GitHub**
\`\`\`bash
git add .
git commit -m "Proyecto listo para producción"
git push origin main
\`\`\`

#### 2. **Conectar con Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"New Project"**
3. Conecta tu repositorio de GitHub
4. Vercel detectará automáticamente que es Next.js

#### 3. **Configurar Variables de Entorno en Vercel**
En el panel de Vercel, ve a **Settings > Environment Variables** y agrega:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu_clave_anonima
\`\`\`

#### 4. **Desplegar**
Haz clic en **"Deploy"** - ¡Vercel hace todo automáticamente!

### 🔄 Actualizaciones Automáticas
Cada vez que hagas `git push`, Vercel redesplegará automáticamente.

---

## 📁 Estructura del Proyecto

\`\`\`
ll-thermoart-invoice-app/
├── app/                    # Páginas de la aplicación
│   ├── (protected)/       # Páginas protegidas (requieren login)
│   │   ├── dashboard/     # Panel principal
│   │   ├── invoices/      # Facturación
│   │   ├── quotes/        # Cotizaciones
│   │   ├── products/      # Productos
│   │   ├── inventario/    # Inventario
│   │   ├── clientes/      # Clientes
│   │   ├── finanzas/      # Finanzas
│   │   └── gastos/        # Gastos
│   ├── login/             # Página de login
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
├── lib/                   # Utilidades y servicios
├── contexts/              # Contextos de React
├── hooks/                 # Hooks personalizados
├── types.ts              # Tipos de TypeScript
├── .env.local            # Variables de entorno (TU CONFIGURACIÓN)
└── package.json          # Dependencias del proyecto
\`\`\`

---

## 🔧 Comandos Útiles

\`\`\`bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build           # Crear build de producción
npm run start           # Ejecutar build de producción
npm run preview         # Build + Start en un comando

# Mantenimiento
npm run lint            # Verificar código
npm run type-check      # Verificar tipos TypeScript
npm run clean           # Limpiar cache
npm run reset           # Reinstalar todo desde cero
\`\`\`

---

## 🔒 Seguridad

- ✅ Autenticación personalizada con Supabase
- ✅ Protección de rutas
- ✅ Variables de entorno seguras
- ✅ Headers de seguridad configurados
- ✅ Sin credenciales hardcodeadas

---

## 🆘 Solución de Problemas

### ❌ Error "Failed to fetch"
\`\`\`bash
# Verifica que las variables de entorno estén correctas
cat .env.local

# Reinicia el servidor
npm run dev
\`\`\`

### ❌ Error de dependencias
\`\`\`bash
# Reinstala todo
npm run reset
\`\`\`

### ❌ Error de build
\`\`\`bash
# Verifica tipos
npm run type-check

# Limpia cache
npm run clean
npm run build
\`\`\`

---

## 📞 Soporte

Si tienes problemas:

1. **Verifica** que Node.js 18+ esté instalado
2. **Confirma** que las variables de entorno estén correctas
3. **Reinicia** VS Code y el servidor de desarrollo
4. **Revisa** la consola del navegador (F12) para errores

---

## 🎯 Características

- ✅ **Facturación completa** - Crear, editar, imprimir facturas
- ✅ **Cotizaciones** - Sistema completo de cotizaciones
- ✅ **Inventario** - Control de stock y movimientos
- ✅ **Clientes** - Gestión de base de clientes
- ✅ **Productos** - Catálogo de productos
- ✅ **Finanzas** - Dashboard financiero
- ✅ **Gastos** - Control de gastos e ingresos
- ✅ **Reportes** - Exportación a Excel
- ✅ **Responsive** - Funciona en móvil y desktop
- ✅ **Impresión térmica** - Compatible con impresoras térmicas

**¡Tu sistema está listo para producción!** 🎉
\`\`\`

Creo el archivo de configuración para Vercel:
