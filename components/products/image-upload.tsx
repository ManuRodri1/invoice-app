"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor, selecciona una imagen",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño de archivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError, data } = await supabase.storage.from("images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(filePath)

      if (publicUrlData) {
        onChange(publicUrlData.publicUrl)
        toast({
          title: "Imagen subida correctamente",
          description: "La imagen se ha subido y vinculado al producto",
        })
      }
    } catch (error) {
      console.error("Error al subir imagen:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al subir la imagen. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleRemove() {
    onChange("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={isLoading}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir Imagen
            </>
          )}
        </label>

        {value && (
          <Button type="button" variant="outline" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {value && (
        <div className="relative h-40 w-40 overflow-hidden rounded-md border">
          <Image src={value || "/placeholder.svg"} alt="Imagen del producto" fill className="object-cover" />
        </div>
      )}
    </div>
  )
}
