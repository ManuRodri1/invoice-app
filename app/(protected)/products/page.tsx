"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ProductsTable } from "@/components/products/products-table"
import { ProductCard } from "@/components/products/product-card"
import { AddProductButton } from "@/components/products/add-product-button"
import { EditProductDialog } from "@/components/products/edit-product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid2X2, List } from "lucide-react"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      const { data } = await supabase.from("products").select("*")
      if (data) {
        setProducts(data)
        setFilteredProducts(data)
      }
      setIsLoading(false)
    }

    loadProducts()

    // Suscribirse a cambios en la tabla de productos
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        loadProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Filtrar productos cuando cambian los filtros
  useEffect(() => {
    let result = [...products]

    // Filtrar por nombre
    if (searchQuery) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filtrar por disponibilidad
    if (availabilityFilter === "available") {
      result = result.filter((product) => product.available)
    } else if (availabilityFilter === "unavailable") {
      result = result.filter((product) => !product.available)
    }

    setFilteredProducts(result)
  }, [products, searchQuery, availabilityFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos</h1>
        <AddProductButton />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={availabilityFilter}
            onValueChange={(value) => setAvailabilityFilter(value as "all" | "available" | "unavailable")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Disponibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="unavailable">No disponibles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "brand-gradient" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            className={viewMode === "card" ? "brand-gradient" : ""}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : viewMode === "table" ? (
        <ProductsTable initialProducts={products} filteredProducts={filteredProducts} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500">
              No se encontraron productos con los filtros seleccionados
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={setProductToEdit} onDelete={setProductToDelete} />
            ))
          )}
        </div>
      )}

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
    </div>
  )
}
