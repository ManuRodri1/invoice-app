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
import { Trash2, Plus, DollarSign, TrendingUp, Building, Edit } from "lucide-react"
import { ExpenseService } from "@/lib/expense-service"
import type { IncomeSource } from "@/lib/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface IncomeManagementProps {
  selectedMonth?: string
  selectedYear?: string
  salesIncome: number
  onIncomeChange: () => void
}

export function IncomeManagement({ selectedMonth, selectedYear, salesIncome, onIncomeChange }: IncomeManagementProps) {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentIncome, setCurrentIncome] = useState<IncomeSource | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "freelance",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [isLoading, setIsLoading] = useState(true)

  // Función para obtener la fecha por defecto según el período seleccionado
  const getDefaultDate = () => {
    if (selectedMonth) {
      // Si estamos en vista mensual, usar el primer día del mes seleccionado
      return `${selectedMonth}-01`
    } else if (selectedYear) {
      // Si estamos en vista anual, usar el primer día del año seleccionado
      return `${selectedYear}-01-01`
    } else {
      // Por defecto, usar la fecha actual
      return new Date().toISOString().split("T")[0]
    }
  }

  // Función para obtener el período actual para mostrar en labels - CORREGIDA
  const getCurrentPeriodLabel = () => {
    if (selectedMonth) {
      try {
        const [year, month] = selectedMonth.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
        return format(date, "MMMM yyyy", { locale: es })
      } catch (error) {
        console.error("Error formatting month:", error)
        return selectedMonth
      }
    } else if (selectedYear) {
      return `Año ${selectedYear}`
    }
    return "Período actual"
  }

  // Cargar datos
  const loadData = async () => {
    setIsLoading(true)
    try {
      let incomeData: IncomeSource[]
      if (selectedMonth) {
        incomeData = await ExpenseService.getIncomeSources(selectedMonth)
      } else if (selectedYear) {
        incomeData = await ExpenseService.getIncomeSourcesByYear(selectedYear)
      } else {
        incomeData = []
      }

      setIncomeSources(incomeData)
    } catch (error) {
      console.error("Error loading income data:", error)
      toast.error("Error al cargar ingresos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  // Actualizar fecha por defecto cuando cambie el período
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: getDefaultDate(),
    }))
  }, [selectedMonth, selectedYear])

  // Agregar nuevo ingreso
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await ExpenseService.createIncomeSource({
        name: formData.name,
        type: formData.type,
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
      })

      toast.success("Ingreso agregado correctamente")

      setIsAddDialogOpen(false)
      setFormData({
        name: "",
        type: "freelance",
        amount: "",
        date: getDefaultDate(),
      })

      loadData()
      onIncomeChange()
    } catch (error) {
      console.error("Error adding income:", error)
      toast.error("No se pudo agregar el ingreso")
    }
  }

  // Editar ingreso
  const handleEditIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await ExpenseService.updateIncomeSource(currentIncome!.id, {
        name: formData.name,
        type: formData.type,
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
      })

      toast.success("Ingreso actualizado correctamente")

      setIsEditDialogOpen(false)
      setCurrentIncome(null)

      loadData()
      onIncomeChange()
    } catch (error) {
      console.error("Error updating income:", error)
      toast.error("No se pudo actualizar el ingreso")
    }
  }

  // Eliminar ingreso
  const handleDeleteIncome = async () => {
    try {
      await ExpenseService.deleteIncomeSource(currentIncome!.id)

      toast.success("Ingreso eliminado correctamente")

      setIsDeleteDialogOpen(false)
      setCurrentIncome(null)

      loadData()
      onIncomeChange()
    } catch (error) {
      console.error("Error deleting income:", error)
      toast.error("No se pudo eliminar el ingreso")
    }
  }

  // Preparar edición
  const prepareEdit = (income: IncomeSource) => {
    setCurrentIncome(income)
    setFormData({
      name: income.name,
      type: income.type,
      amount: income.amount.toString(),
      date: income.date,
    })
    setIsEditDialogOpen(true)
  }

  // Preparar eliminación
  const prepareDelete = (income: IncomeSource) => {
    setCurrentIncome(income)
    setIsDeleteDialogOpen(true)
  }

  // Calcular totales
  const totalOtherIncome = incomeSources.reduce((sum, income) => sum + (income.amount || 0), 0)
  const totalIncome = salesIncome + totalOtherIncome

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount)
  }

  const incomeTypes = [
    { value: "freelance", label: "Freelance" },
    { value: "consulting", label: "Consultoría" },
    { value: "investment", label: "Inversiones" },
    { value: "rental", label: "Alquiler" },
    { value: "other", label: "Otros" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas - {getCurrentPeriodLabel()}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesIncome)}</div>
            <p className="text-xs text-muted-foreground">Solo facturas pagadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otros Ingresos - {getCurrentPeriodLabel()}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOtherIncome)}</div>
            <p className="text-xs text-muted-foreground">{incomeSources.length} fuentes registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos - {getCurrentPeriodLabel()}</CardTitle>
            <Building className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Ventas + otros ingresos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Otros Ingresos - {getCurrentPeriodLabel()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total: {formatCurrency(totalOtherIncome)}</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setCurrentIncome(null)
                  setFormData({
                    name: "",
                    type: "freelance",
                    amount: "",
                    date: getDefaultDate(),
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ingreso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Ingreso</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <Label htmlFor="name">Descripción del Ingreso</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Trabajo freelance, consultoría..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
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
          ) : incomeSources.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeSources.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>{format(new Date(income.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell className="font-medium">{income.name}</TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {incomeTypes.find((t) => t.value === income.type)?.label || income.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(income.amount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => prepareEdit(income)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => prepareDelete(income)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de cards para móvil */}
              <div className="md:hidden space-y-4 p-4">
                {incomeSources.map((income) => (
                  <div key={income.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{income.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {incomeTypes.find((t) => t.value === income.type)?.label || income.type}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => prepareEdit(income)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => prepareDelete(income)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(income.date), "dd/MM/yyyy", { locale: es })}
                      </span>
                      <span className="font-medium text-lg">{formatCurrency(income.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay otros ingresos registrados para este período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Ingreso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditIncome} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Descripción del Ingreso</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Trabajo freelance, consultoría..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {incomeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-amount">Monto</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Fecha</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
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
          <p>¿Está seguro de que desea eliminar este ingreso?</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteIncome}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
