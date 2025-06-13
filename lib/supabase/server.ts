import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Crear un cliente de Supabase para el lado del servidor
export function createServerClient() {
  const cookieStore = cookies()

  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
