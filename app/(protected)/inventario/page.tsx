"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { InventoryMovementsTable } from "@/components/inventory/inventory-movements-table"
import { LowStockAlert } from "@/components/inventory/low-stock-alert"
import { AddInventoryDialog } from "@/components/inventory/add-inventory-dialog"
import { InventoryStats } from "@/components/inventory/inventory-stats"

export default function InventarioPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInventoryChange = () => {
    // Incrementar el contador para forzar la recarga de los componentes
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* // INICIO: ENCABEZADO DE PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <AddInventoryDialog onSuccess={handleInventoryChange} />
      </div>
      {/* // FIN: ENCABEZADO DE PÁGINA */}

      <LowStockAlert key={`low-stock-${refreshTrigger}`} />

      <InventoryStats refreshTrigger={refreshTrigger} />

      {/* // INICIO: TABS RESPONSIVOS */}
      <Tabs defaultValue="inventario" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inventario" className="flex-1 sm:flex-none">
            Inventario
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="flex-1 sm:flex-none">
            Movimientos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inventario">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Inventario</CardTitle>
              <CardDescription>Gestiona el stock de tus productos</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable key={`inventory-table-${refreshTrigger}`} onInventoryChange={handleInventoryChange} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movimientos">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Inventario</CardTitle>
              <CardDescription>Últimos movimientos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryMovementsTable key={`movements-table-${refreshTrigger}`} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* // FIN: TABS RESPONSIVOS */}
    </div>
  )
}
