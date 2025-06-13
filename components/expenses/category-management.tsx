"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import { ExpenseService } from "@/lib/expense-service"
import type { ExpenseCategory } from "@/lib/types"
import { toast } from "sonner"

interface CategoryManagementProps {
  onCategoriesChange: () => void
  budgetComparison: { [key: string]: { spent: number; budget: number; percentage: number } }
  inventoryInvestment: number // Add this prop
}

export function CategoryManagement({
  onCategoriesChange,
  budgetComparison,
  inventoryInvestment,
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    color: "#3B82F6",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await ExpenseService.getCategories()
      setCategories(data)
    } catch (error) {
      toast.error("Error al cargar categorías")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCategory) {
        await ExpenseService.updateCategory(editingCategory.id, {
          name: formData.name,
          budget: Number.parseFloat(formData.budget),
          color: formData.color,
        })
        toast.success("Categoría actualizada")
      } else {
        await ExpenseService.createCategory({
          name: formData.name,
          budget: Number.parseFloat(formData.budget),
          color: formData.color,
        })
        toast.success("Categoría creada")
      }

      setIsDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", budget: "", color: "#3B82F6" })
      loadCategories()
      onCategoriesChange()
    } catch (error) {
      console.error("Error al guardar categoría:", error)
      toast.error("Error al guardar categoría")
    }
  }

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      budget: category.budget.toString(),
      color: category.color,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await ExpenseService.deleteCategory(id)
        toast.success("Categoría eliminada")
        loadCategories()
        onCategoriesChange()
      } catch (error) {
        toast.error("Error al eliminar categoría")
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categorías de Gastos</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: "", budget: "", color: "#3B82F6" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="budget">Presupuesto Mensual</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCategory ? "Actualizar" : "Crear"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600" />
                <span className="font-medium">Materiales comprados</span>
                <Badge variant="secondary" className="text-xs">
                  Automático
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Invertido: {formatCurrency(inventoryInvestment)}</span>
                <span className="text-muted-foreground">Sin presupuesto definido</span>
              </div>
              <Progress
                value={inventoryInvestment > 0 ? Math.min((inventoryInvestment / 100000) * 100, 100) : 0}
                className="h-2"
              />
              <div className="text-xs text-center text-muted-foreground">
                {formatCurrency(inventoryInvestment)} invertido en materiales
              </div>
            </div>
          </div>
          {categories.map((category) => {
            const comparison = budgetComparison[category.name] || { spent: 0, budget: category.budget, percentage: 0 }
            const isOverBudget = comparison.percentage > 100

            return (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="font-medium">{category.name}</span>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sobre presupuesto
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gastado: {formatCurrency(comparison.spent)}</span>
                    <span>Presupuesto: {formatCurrency(comparison.budget)}</span>
                  </div>
                  <Progress
                    value={Math.min(comparison.percentage, 100)}
                    className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                  />
                  <div className="text-xs text-center text-muted-foreground">
                    {comparison.percentage.toFixed(1)}% del presupuesto
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
