"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, FileText, DollarSign, FileCheck, PackageOpen, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const routes = [
  {
    label: "Facturación",
    icon: FileText,
    href: "/invoices",
  },
  {
    label: "Cotizaciones",
    icon: FileCheck,
    href: "/quotes",
  },
  {
    label: "Productos",
    icon: Package,
    href: "/products",
  },
  {
    label: "Inventario",
    icon: PackageOpen,
    href: "/inventario",
  },
  {
    label: "Finanzas",
    icon: DollarSign,
    href: "/finanzas",
  },
  {
    label: "Dashboard",
    icon: BarChart,
    href: "/dashboard",
  },
]

export function StickyNavigation() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsVisible(scrollY > 100) // Mostrar después de 100px de scroll
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="flex items-center justify-center px-4 py-2">
        <nav className="flex space-x-1 overflow-x-auto">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                pathname === route.href
                  ? "bg-[#8DC73F]/10 text-[#8DC73F]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <route.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{route.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
