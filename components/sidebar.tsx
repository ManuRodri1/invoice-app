"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Package,
  FileText,
  Menu,
  X,
  LogOut,
  User,
  DollarSign,
  FileCheck,
  PackageOpen,
  BarChart,
  Calculator,
  Users,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

// Rutas de navegación principal - NUEVO ORDEN
const routes = [
  {
    label: "Facturación",
    icon: FileText,
    href: "/invoices",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Cotizaciones",
    icon: FileCheck,
    href: "/quotes",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Productos",
    icon: Package,
    href: "/products",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Inventario",
    icon: PackageOpen,
    href: "/inventario",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Finanzas",
    icon: DollarSign,
    href: "/finanzas",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Clientes",
    icon: Users,
    href: "/clientes",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Control de Gastos",
    icon: Calculator, // NUEVO ÍCONO - Calculadora para diferenciarlo de Finanzas
    href: "/gastos",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
  {
    label: "Dashboard",
    icon: BarChart,
    href: "/dashboard",
    color: "text-[#8DC73F]", // Color de marca - Rosa LL THERMOART
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { logout, user } = useAuth()

  return (
    <>
      {/* // Botón de menú hamburguesa - Solo visible en móvil */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* // Sidebar principal - Responsivo con sticky positioning */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-900 md:relative md:translate-x-0 md:sticky md:top-0 md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* // Logo y nombre de la empresa - Identidad de marca */}
        <div className="flex h-20 items-center justify-center border-b px-6">
          <div className="flex items-center space-x-2">
            {/* // Logo principal del negocio */}
            <Image src="/images/logo.png" alt="Victor's Juice Co" width={40} height={40} />
            {/* // Nombre de la empresa - Identidad de marca */}
            <h1 className="text-xl font-bold">Victor's Juice Co</h1>
          </div>
        </div>

        {/* // Información del usuario */}
        {user && (
          <div className="border-b p-4">
            <div className="flex items-center space-x-2">
              {/* // Avatar del usuario con color de marca */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8DC73F]">
                <User className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{user.full_name || user.username}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* // Menú de navegación */}
        <div className="space-y-1 p-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.href
                  ? "bg-[#8DC73F]/10 text-[#8DC73F]" // Estilo activo con color de marca
                  : "text-gray-700 hover:bg-[#8DC73F]/10 dark:text-gray-200 dark:hover:bg-gray-800",
              )}
            >
              <route.icon className={cn("mr-3 h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>

        {/* // Botón de cerrar sesión */}
        <div className="absolute bottom-0 w-full border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  )
}
