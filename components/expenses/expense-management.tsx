"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, DollarSign, ShoppingBag, Building, Receipt, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { ExpenseService } from "@/lib/expense-service"
import { Textarea } from "@/components/ui/textarea"
import type { Expense, ExpenseCategory } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ExpenseManagementProps {
  selectedMonth?: string
  selectedYear?: string
  categories: ExpenseCategory[]
  viewType: "monthly" | "yearly"
  onExpenseChange: () => void
}

export function ExpenseManagement({
  selectedMonth,
  selectedYear,
  categories,
  viewType,
  onExpenseChange,
}: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    description: "",
    payment_method: "efectivo",
    date: new Date().toISOString().split("T")[0],
    receipt_url: "",
  })
  const [materialsExpense, setMaterialsExpense] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Función para obtener la fecha por defecto según el período seleccionado
  const getDefaultDate = () => {
    if (viewType === "monthly" && selectedMonth) {
      // Si estamos en vista mensual, usar el primer día del mes seleccionado
      return `${selectedMonth}-01`
    } else if (viewType === "yearly" && selectedYear) {
      // Si estamos en vista anual, usar el primer día del año seleccionado
      return `${selectedYear}-01-01`
    } else {
      // Por defecto, usar la fecha actual
      return new Date().toISOString().split("T")[0]
    }
  }

  // Cargar datos
  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar gastos
      let expensesData: Expense[]
      if (viewType === "monthly" && selectedMonth) {
        expensesData = await ExpenseService.getExpenses(selectedMonth)
        // Cargar gastos de materiales
        const materials = await ExpenseService.getInventoryInvestment(selectedMonth)
        setMaterialsExpense(materials)
      } else if (viewType === "yearly" && selectedYear) {
        expensesData = await ExpenseService.getExpensesByYear(selectedYear)
        // Cargar gastos de materiales anuales
        const materials = await ExpenseService.getInventoryInvestmentByYear(selectedYear)
        setMaterialsExpense(materials)
      } else {
        expensesData = []
        setMaterialsExpense(0)
      }

      setExpenses(expensesData)
    } catch (error) {
      console.error("Error loading expense data:", error)
      toast.error("Error al cargar gastos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear, viewType])

  // Actualizar fecha por defecto cuando cambie el período
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: getDefaultDate(),
    }))
  }, [selectedMonth, selectedYear, viewType])

  // Agregar nuevo gasto
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.from("expenses").insert([
        {
          category_id: formData.category_id,
          amount: Number.parseFloat(formData.amount),
          description: formData.description || null,
          payment_method: formData.payment_method,
          date: formData.date,
          receipt_url: formData.receipt_url || null,
        },
      ])

      if (error) throw error

      toast.success("Gasto agregado correctamente")

      setIsAddDialogOpen(false)
      setFormData({
        category_id: "",
        amount: "",
        description: "",
        payment_method: "efectivo",
        date: getDefaultDate(), // Usar la fecha correcta del período seleccionado
        receipt_url: "",
      })

      loadData()
      onExpenseChange()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("No se pudo agregar el gasto")
    }
  }

  // Editar gasto
  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          category_id: formData.category_id,
          amount: Number.parseFloat(formData.amount),
          description: formData.description || null,
          payment_method: formData.payment_method,
          date: formData.date,
          receipt_url: formData.receipt_url || null,
        })
        .eq("id", currentExpense!.id)

      if (error) throw error

      toast.success("Gasto actualizado correctamente")

      setIsEditDialogOpen(false)
      setCurrentExpense(null)

      loadData()
      onExpenseChange()
    } catch (error) {
      console.error("Error updating expense:", error)
      toast.error("No se pudo actualizar el gasto")
    }
  }

  // Eliminar gasto
  const handleDeleteExpense = async () => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", currentExpense!.id)

      if (error) throw error

      toast.success("Gasto eliminado correctamente")

      setIsDeleteDialogOpen(false)
      setCurrentExpense(null)

      loadData()
      onExpenseChange()
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error("No se pudo eliminar el gasto")
    }
  }

  // Preparar edición
  const prepareEdit = (expense: Expense) => {
    setCurrentExpense(expense)
    setFormData({
      category_id: expense.category_id,
      amount: expense.amount.toString(),
      description: expense.description || "",
      payment_method: expense.payment_method,
      date: expense.date,
      receipt_url: expense.receipt_url || "",
    })
    setIsEditDialogOpen(true)
  }

  // Preparar eliminación
  const prepareDelete = (expense: Expense) => {
    setCurrentExpense(expense)
    setIsDeleteDialogOpen(true)
  }

  // Calcular totales
  const totalRegisteredExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const totalExpenses = totalRegisteredExpenses + materialsExpense

  // Determinar el título según el tipo de vista - CORREGIDO
  const periodLabel = (() => {
    if (viewType === "yearly" && selectedYear) {
      return `Año ${selectedYear}`
    } else if (viewType === "monthly" && selectedMonth) {
      try {
        const [year, month] = selectedMonth.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
        return format(date, "MMMM yyyy", { locale: es })
      } catch (error) {
        console.error("Error formatting month:", error)
        return selectedMonth
      }
    }
    return "Período actual"
  })()

  const paymentMethods = [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
    { value: "cheque", label: "Cheque" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Registrados</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRegisteredExpenses)}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} gastos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiales Comprados</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(materialsExpense)}</div>
            <p className="text-xs text-muted-foreground">Calculado desde inventario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {viewType === "monthly" ? "Total del mes" : "Total del año"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gastos Registrados - {periodLabel}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(totalExpenses)}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setCurrentExpense(null)
                  setFormData({
                    category_id: "",
                    amount: "",
                    payment_method: "efectivo",
                    description: "",
                    date: getDefaultDate(), // Usar la fecha correcta del período seleccionado
                    receipt_url: "",
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Gasto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <Label htmlFor="category_id">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles del gasto..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="receipt_url">URL del Comprobante (opcional)</Label>
                  <Input
                    id="receipt_url"
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Registrar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : expenses.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category?.color || "#6B7280" }}
                          />
                          <span>{expense.category?.name || "Sin categoría"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">{expense.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {expense.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {expense.receipt_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(expense.receipt_url!, "_blank")}
                            >
                              <Receipt className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => prepareEdit(expense)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => prepareDelete(expense)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay gastos registrados para este período</div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div>
              <Label htmlFor="category_id">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles del gasto..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="receipt_url">URL del Comprobante (opcional)</Label>
              <Input
                id="receipt_url"
                type="url"
                value={formData.receipt_url}
                onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Actualizar
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Está seguro de que desea eliminar este gasto?</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
