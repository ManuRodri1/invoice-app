"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, FileText } from "lucide-react"
import type { Product } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { EditProductDialog } from "./edit-product-dialog"
import { DeleteProductDialog } from "./delete-product-dialog"
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useResponsive } from "@/hooks/use-responsive"

interface ProductsTableProps {
  initialProducts: Product[]
  filteredProducts?: Product[]
}

export function ProductsTable({ initialProducts, filteredProducts }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(filteredProducts || initialProducts)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Usar el hook de responsividad
  const { isMobile } = useResponsive()

  // Actualizamos los productos cuando cambian los filtrados
  useEffect(() => {
    if (filteredProducts) {
      setProducts(filteredProducts)
    }
  }, [filteredProducts])

  useEffect(() => {
    // Suscribirse a cambios en la tabla de productos
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        // Recargar productos cuando haya cambios
        supabase
          .from("products")
          .select("*")
          .then(({ data }) => {
            if (data) setProducts(filteredProducts || data)
          })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filteredProducts])

  const handleInvoice = (product: Product) => {
    // Guardar el ID del producto en localStorage para recuperarlo en el diálogo de facturación
    localStorage.setItem("selectedProductId", product.id)
    setSelectedProductId(product.id)
    setShowInvoiceDialog(true)
  }

  // Definir las columnas para la tabla responsiva
  const columns = [
    {
      header: "Imagen",
      accessorKey: "image",
      cell: (_, row: Product) =>
        row.image_url ? (
          <Image
            src={row.image_url || "/placeholder.svg"}
            alt={row.name}
            width={50}
            height={50}
            className="rounded-md object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-gray-200" />
        ),
      className: "w-[80px]",
    },
    {
      header: "Nombre",
      accessorKey: "name",
      cell: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      header: "Descripción",
      accessorKey: "description",
      cell: (value: string) => <span className="max-w-xs truncate">{value || "Sin descripción"}</span>,
      className: isMobile ? "hidden" : "", // Ocultar en móvil
    },
    {
      header: "Precio de Venta",
      accessorKey: "sale_price",
      cell: (value: number) => formatCurrency(value),
    },
    {
      header: "Inversión",
      accessorKey: "cost_price",
      cell: (value: number) => formatCurrency(value),
      className: isMobile ? "hidden" : "", // Ocultar en móvil
    },
    {
      header: "Disponibilidad",
      accessorKey: "available",
      cell: (value: boolean) => (
        <Badge variant="outline" className={value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {value ? "Disponible" : "No disponible"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: (_, row: Product) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" className="brand-gradient" onClick={() => handleInvoice(row)}>
            <FileText className={`${isMobile ? "" : "mr-2"} h-4 w-4`} />
            {!isMobile && "Facturar"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setProductToEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setProductToDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* // Tabla responsiva de productos */}
      <ResponsiveTable data={products} columns={columns} defaultPageSize={10} className="w-full" />

      {productToEdit && (
        <EditProductDialog product={productToEdit} open={!!productToEdit} onOpenChange={() => setProductToEdit(null)} />
      )}

      {productToDelete && (
        <DeleteProductDialog
          product={productToDelete}
          open={!!productToDelete}
          onOpenChange={() => setProductToDelete(null)}
        />
      )}

      {showInvoiceDialog && <CreateInvoiceDialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog} />}
    </>
  )
}
