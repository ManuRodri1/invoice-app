"use client"

import { useState, useEffect } from "react"

// Hook personalizado para detectar el tamaño de pantalla y aplicar responsividad
export function useResponsive() {
  // Definir los breakpoints (en píxeles)
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }

  // Estado para almacenar el ancho de la ventana
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : breakpoints.lg,
  )

  // Estado para determinar si es un dispositivo móvil
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < breakpoints.md : false,
  )

  // Estado para determinar si se debe usar paginación
  const [shouldUsePagination, setShouldUsePagination] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < breakpoints.md : false,
  )

  useEffect(() => {
    // Función para actualizar el ancho de la ventana
    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < breakpoints.md)
      setShouldUsePagination(width < breakpoints.md)
    }

    // Verificar si estamos en el navegador
    if (typeof window !== "undefined") {
      // Establecer los valores iniciales
      handleResize()

      // Agregar el event listener
      window.addEventListener("resize", handleResize)

      // Limpiar el event listener
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [breakpoints.md])

  return {
    windowWidth,
    isMobile,
    shouldUsePagination,
    isSmall: windowWidth < breakpoints.sm,
    isMedium: windowWidth >= breakpoints.md && windowWidth < breakpoints.lg,
    isLarge: windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl,
    isExtraLarge: windowWidth >= breakpoints.xl,
  }
}
