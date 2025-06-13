import { createClient } from "@supabase/supabase-js"

// Obtener variables de entorno con validación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug: Mostrar información de conexión
console.log("🔧 Configuración de Supabase:")
console.log("URL:", supabaseUrl)
console.log("Key disponible:", supabaseAnonKey ? "✅ Sí" : "❌ No")

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para probar la conexión
export async function testSupabaseConnection() {
  try {
    console.log("🔍 Probando conexión a Supabase...")

    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      console.error("❌ Error de conexión:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Conexión exitosa a Supabase")
    return { success: true, data }
  } catch (error) {
    console.error("❌ Error al probar conexión:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

// Función para obtener el cliente de Supabase
export function getSupabaseClient() {
  return supabase
}
