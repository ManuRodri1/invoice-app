"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useResponsive } from "@/hooks/use-responsive"

interface Column {
  header: string
  accessorKey: string
  cell?: (value: any, row: any) => React.ReactNode
  className?: string
}

interface ResponsiveTableProps {
  data: any[] | undefined
  columns: Column[]
  defaultPageSize?: number
  className?: string
  alwaysUsePagination?: boolean
}

export function ResponsiveTable({
  data = [], // Proporcionar un array vacío como valor predeterminado
  columns,
  defaultPageSize = 10,
  className = "",
  alwaysUsePagination = false,
}: ResponsiveTableProps) {
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Usar el hook de responsividad
  const { shouldUsePagination } = useResponsive()

  // Asegurarse de que data sea un array
  const safeData = Array.isArray(data) ? data : []

  // Determinar si se debe usar paginación basado en el tamaño de pantalla o la prop
  const usePagination = alwaysUsePagination || shouldUsePagination

  // Calcular el número total de páginas
  const totalPages = Math.ceil(safeData.length / pageSize)

  // Obtener los datos para la página actual
  const paginatedData = usePagination ? safeData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : safeData

  // Resetear a la primera página cuando cambian los datos
  useEffect(() => {
    setCurrentPage(1)
  }, [safeData])

  // Función para cambiar de página
  const changePage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-4">
      {/* // Tabla responsiva con scroll horizontal en dispositivos pequeños */}
      <div className={`overflow-x-auto rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {column.cell ? column.cell(row[column.accessorKey], row) : row[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* // Controles de paginación */}
      {usePagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
