"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { loginUser, getCurrentUser, type User } from "@/lib/auth-service"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar autenticación al cargar
  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()

        if (currentUser) {
          setUser(currentUser)
          setIsAuthenticated(true)

          // Si está en la página de login, redirigir a la página principal
          if (pathname === "/login") {
            router.push("/invoices")
          }
        } else {
          // Si no está autenticado y no está en la página de login, redirigir
          if (pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [pathname, router])

  // Función para iniciar sesión
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const userData = await loginUser(username, password)

      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)

        // Guardar ID de usuario en localStorage
        localStorage.setItem("userId", userData.id)
        localStorage.setItem("isAuthenticated", "true")
        document.cookie = "auth=true; path=/; max-age=86400"

        return true
      }

      return false
    } catch (error) {
      console.error("Error en login:", error)
      return false
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("userId")
    localStorage.removeItem("isAuthenticated")
    document.cookie = "auth=; path=/; max-age=0"
    router.push("/login")
  }

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}
