"use client"

import { useState, useEffect } from "react"

interface SalesGoalData {
  amount: number
  month: string
  year: number
  isManuallySet: boolean
}

export function useSalesGoal(currentSales: number, previousMonthSales = 0) {
  const [goalData, setGoalData] = useState<SalesGoalData>({
    amount: 100000, // Meta por defecto
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    year: new Date().getFullYear(),
    isManuallySet: false,
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    // Cargar meta guardada del localStorage
    const savedGoal = localStorage.getItem("salesGoal")
    if (savedGoal) {
      const parsed: SalesGoalData = JSON.parse(savedGoal)

      // Si es un nuevo mes y la meta anterior no fue establecida manualmente
      if (parsed.month !== currentMonth) {
        if (!parsed.isManuallySet) {
          // Calcular nueva meta basada en el mes anterior
          const newGoal = Math.max(previousMonthSales * 1.1, 50000) // 10% más que el mes anterior, mínimo 50k
          setGoalData({
            amount: newGoal,
            month: currentMonth,
            year: currentYear,
            isManuallySet: false,
          })

          // Guardar la nueva meta
          localStorage.setItem(
            "salesGoal",
            JSON.stringify({
              amount: newGoal,
              month: currentMonth,
              year: currentYear,
              isManuallySet: false,
            }),
          )
        } else {
          // Si fue establecida manualmente, mantenerla pero actualizar el mes
          const updatedGoal = {
            ...parsed,
            month: currentMonth,
            year: currentYear,
            isManuallySet: false, // Reset para el nuevo mes
          }
          setGoalData(updatedGoal)
          localStorage.setItem("salesGoal", JSON.stringify(updatedGoal))
        }
      } else {
        // Mismo mes, usar la meta guardada
        setGoalData(parsed)
      }
    } else {
      // Primera vez, establecer meta basada en ventas anteriores
      const initialGoal = Math.max(previousMonthSales * 1.1, 50000)
      const initialData = {
        amount: initialGoal,
        month: currentMonth,
        year: currentYear,
        isManuallySet: false,
      }
      setGoalData(initialData)
      localStorage.setItem("salesGoal", JSON.stringify(initialData))
    }
  }, [currentMonth, currentYear, previousMonthSales])

  const updateGoal = (newAmount: number, isManual = true) => {
    const updatedData = {
      amount: newAmount,
      month: currentMonth,
      year: currentYear,
      isManuallySet: isManual,
    }

    setGoalData(updatedData)
    localStorage.setItem("salesGoal", JSON.stringify(updatedData))
  }

  const progressPercentage = Math.min((currentSales / goalData.amount) * 100, 100)

  return {
    goalAmount: goalData.amount,
    progressPercentage,
    isManuallySet: goalData.isManuallySet,
    updateGoal,
  }
}
