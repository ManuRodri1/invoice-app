"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type PurchaseOrderItem, inventoryService } from "@/lib/inventory-service"
import { Download } from "lucide-react"

interface GeneratePurchaseOrderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeneratePurchaseOrder({ open, onOpenChange }: GeneratePurchaseOrderProps) {
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError("")
      setSuccess(false)
      const purchaseOrderItems = await inventoryService.generatePurchaseOrder()
      setItems(purchaseOrderItems)
    } catch (error) {
      console.error("Error al generar orden de compra:", error)
      setError("Ocurrió un error al generar la orden de compra")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (items.length === 0) {
      setError("No hay productos para generar una orden de compra")
      return
    }

    try {
      setLoading(true)
      setError("")
      await inventoryService.savePurchaseOrder(items)
      setSuccess(true)
    } catch (error) {
      console.error("Error al guardar orden de compra:", error)
      setError("Ocurrió un error al guardar la orden de compra")
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (items.length === 0) return

    const headers = ["Producto", "Stock Actual", "Stock Mínimo", "Stock Máximo", "Cantidad a Pedir"]
    const csvContent = [
      headers.join(","),
      ...items.map((item) =>
        [
          `"${item.product_name}"`,
          item.cantidad_actual,
          item.cantidad_minima,
          item.cantidad_maxima,
          item.cantidad_a_pedir,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `orden_compra_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Generar Orden de Compra</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Button onClick={handleGenerate} disabled={generating} className="mb-4">
            {generating ? "Generando..." : "Calcular Productos a Pedir"}
          </Button>

          {items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Stock Máximo</TableHead>
                    <TableHead>Cantidad a Pedir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.cantidad_actual}</TableCell>
                      <TableCell>{item.cantidad_minima}</TableCell>
                      <TableCell>{item.cantidad_maxima}</TableCell>
                      <TableCell>{item.cantidad_a_pedir}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md">
              {generating
                ? "Generando orden de compra..."
                : 'Haz clic en "Calcular Productos a Pedir" para generar una orden de compra'}
            </div>
          )}

          {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

          {success && <div className="text-green-500 text-sm mt-4">Orden de compra guardada exitosamente</div>}
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={exportToCSV} disabled={items.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar a CSV
          </Button>
          <Button onClick={handleSave} disabled={loading || items.length === 0}>
            {loading ? "Guardando..." : "Guardar Orden de Compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
