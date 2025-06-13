"use client"

import Image from "next/image"
import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Edit, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)

  const handleInvoice = () => {
    // Guardar el ID del producto en localStorage para recuperarlo en el diálogo de facturación
    localStorage.setItem("selectedProductId", product.id)
    setShowInvoiceDialog(true)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-gray-100">
          {product.image_url ? (
            <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">Sin imagen</div>
          )}
          <Badge
            className={`absolute right-2 top-2 ${
              product.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {product.available ? "Disponible" : "No disponible"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 text-lg font-bold">{product.name}</h3>
          <p className="mb-2 text-sm text-gray-500 line-clamp-2">{product.description || "Sin descripción"}</p>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Precio de venta</p>
              <p className="font-bold">{formatCurrency(product.sale_price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Inversión</p>
              <p className="font-medium">{formatCurrency(product.cost_price)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 border-t p-4">
          <Button variant="default" className="flex-1 brand-gradient" onClick={handleInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            Facturar
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(product)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDelete(product)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {showInvoiceDialog && <CreateInvoiceDialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog} />}
    </>
  )
}
