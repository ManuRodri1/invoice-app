import { supabase } from "./supabase/client"

export type User = {
  id: string
  username: string
  full_name: string | null
  email: string | null
  role: string
}

export async function loginUser(username: string, password: string): Promise<User | null> {
  try {
    console.log("🔐 Intentando login para usuario:", username)

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single()

    console.log("📊 Resultado de consulta:")
    console.log("Data:", data ? "Usuario encontrado" : "No encontrado")
    console.log("Error:", error)

    if (error) {
      console.error("❌ Error de autenticación:", error)
      return null
    }

    if (!data) {
      console.error("❌ No se encontraron datos del usuario")
      return null
    }

    console.log("✅ Login exitoso para usuario:", data.username)

    return {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    }
  } catch (error) {
    console.error("❌ Error al iniciar sesión:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // Verificar si estamos en el cliente
    if (typeof window === "undefined") {
      console.log("🖥️ getCurrentUser llamado en el servidor, retornando null")
      return null
    }

    // Obtener ID de usuario del localStorage
    const userId = localStorage.getItem("userId")
    if (!userId) {
      console.log("🔍 No hay userId en localStorage")
      return null
    }

    console.log("🔍 Obteniendo usuario con ID:", userId)

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ Error al obtener usuario:", error)
      return null
    }

    if (!data) {
      console.error("❌ Usuario no encontrado en la base de datos")
      return null
    }

    console.log("✅ Usuario obtenido exitosamente:", data.username)

    return {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    }
  } catch (error) {
    console.error("❌ Error al obtener usuario actual:", error)
    return null
  }
}
