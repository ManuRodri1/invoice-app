"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { StickyNavigation } from "@/components/sticky-navigation"
import { DateRangeProvider } from "@/contexts/date-range-context"
import { Loader2 } from "lucide-react"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("🚫 Usuario no autenticado, redirigiendo a login")
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar loading (se redirigirá)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Redirigiendo a login...</p>
        </div>
      </div>
    )
  }

  // Si hay usuario, mostrar el contenido
  return (
    <DateRangeProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Sidebar - Responsivo */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col">
          {/* Navegación sticky */}
          <StickyNavigation />

          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </DateRangeProvider>
  )
}
