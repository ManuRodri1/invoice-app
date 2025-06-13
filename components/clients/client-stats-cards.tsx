"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserPlus, Calendar } from "lucide-react"
import { ClientService } from "@/lib/client-service"

interface ClientStatsCardsProps {
  refreshTrigger?: number
}

export function ClientStatsCards({ refreshTrigger }: ClientStatsCardsProps) {
  const [stats, setStats] = useState({
    total: 0,
    frecuentes: 0,
    nuevos: 0,
    thisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      const clientStats = await ClientService.getClientStats()
      setStats(clientStats)
    } catch (error) {
      console.error("Error loading client stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: "Total de Clientes",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Clientes Frecuentes",
      value: stats.frecuentes,
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Clientes Nuevos",
      value: stats.nuevos,
      icon: UserPlus,
      color: "text-purple-600",
    },
    {
      title: "Registrados Este Mes",
      value: stats.thisMonth,
      icon: Calendar,
      color: "text-amber-600",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
