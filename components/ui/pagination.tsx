"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const PaginationContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("list-none", className)} {...props} />,
)
PaginationItem.displayName = "PaginationItem"

interface PaginationLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
          isActive ? "bg-primary text-primary-foreground" : "bg-transparent text-foreground hover:bg-muted",
          className,
        )}
        {...props}
      />
    )
  },
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        "bg-transparent text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      <span>Anterior</span>
    </button>
  ),
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        "bg-transparent text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span>Siguiente</span>
      <ChevronRight className="h-4 w-4 ml-1" />
    </button>
  ),
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("flex h-8 w-8 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  ),
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Componente Pagination completo
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const renderPageLinks = () => {
    const pageLinks = []
    const maxVisiblePages = 5

    // Siempre mostrar la primera página
    pageLinks.push(
      <PaginationItem key="page-1">
        <PaginationLink isActive={currentPage === 1} onClick={() => onPageChange(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Calcular el rango de páginas a mostrar
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    if (endPage - startPage < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 3) + 1)
    }

    // Mostrar elipsis si hay páginas ocultas al principio
    if (startPage > 2) {
      pageLinks.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Mostrar páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
      pageLinks.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Mostrar elipsis si hay páginas ocultas al final
    if (endPage < totalPages - 1) {
      pageLinks.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Siempre mostrar la última página si hay más de una página
    if (totalPages > 1) {
      pageLinks.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink isActive={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return pageLinks
  }

  return (
    <nav className="mx-auto flex w-full justify-center">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
        </PaginationItem>

        {renderPageLinks()}

        <PaginationItem>
          <PaginationNext onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />
        </PaginationItem>
      </PaginationContent>
    </nav>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
}
