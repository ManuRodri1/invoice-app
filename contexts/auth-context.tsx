"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { loginUser, getCurrentUser, type User } from "@/lib/auth-service"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const router = useRouter()

  // Verificar autenticación al cargar
  useEffect(() => {
    async function loadUser() {
      // Evitar múltiples verificaciones
      if (hasChecked) return

      console.log("🔍 Verificando usuario actual...")

      try {
        const currentUser = await getCurrentUser()

        if (currentUser) {
          console.log("✅ Usuario encontrado:", currentUser.username)
          setUser(currentUser)
          setIsAuthenticated(true)
        } else {
          console.log("❌ No hay usuario autenticado")
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("❌ Error al cargar usuario:", error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
        setHasChecked(true)
      }
    }

    loadUser()
  }, [hasChecked])

  // Función para iniciar sesión
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("🔐 Iniciando proceso de login...")
      const userData = await loginUser(username, password)

      if (userData) {
        setUser(userData)
        setIsAuthenticated(true)

        // Guardar en localStorage y cookies
        localStorage.setItem("userId", userData.id)
        localStorage.setItem("isAuthenticated", "true")
        document.cookie = "isLoggedIn=true; path=/; max-age=86400"

        console.log("✅ Login exitoso, redirigiendo a /invoices")
        router.push("/invoices")

        return { success: true }
      }

      return { success: false, error: "Usuario o contraseña incorrectos" }
    } catch (error) {
      console.error("❌ Error en login:", error)
      return { success: false, error: "Error de conexión" }
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    console.log("🚪 Cerrando sesión...")
    setUser(null)
    setIsAuthenticated(false)
    setHasChecked(false)
    localStorage.removeItem("userId")
    localStorage.removeItem("isAuthenticated")
    document.cookie = "isLoggedIn=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>{children}</AuthContext.Provider>
  )
}
