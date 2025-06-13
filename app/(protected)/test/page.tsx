"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Página de Prueba</h1>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Autenticación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Autenticado:</strong> {isAuthenticated ? "✅ Sí" : "❌ No"}
          </div>

          {user && (
            <div className="space-y-2">
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Usuario:</strong> {user.username}
              </div>
              <div>
                <strong>Nombre:</strong> {user.full_name || "No especificado"}
              </div>
              <div>
                <strong>Email:</strong> {user.email || "No especificado"}
              </div>
              <div>
                <strong>Rol:</strong> {user.role}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={logout} variant="outline">
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>localStorage userId:</strong>{" "}
              {typeof window !== "undefined" ? localStorage.getItem("userId") || "No encontrado" : "N/A"}
            </div>
            <div>
              <strong>localStorage isAuthenticated:</strong>{" "}
              {typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") || "No encontrado" : "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
