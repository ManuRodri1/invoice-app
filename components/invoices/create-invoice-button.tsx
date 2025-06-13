"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateInvoiceDialog } from "./create-invoice-dialog"

export function CreateInvoiceButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="brand-gradient">
        <Plus className="mr-2 h-4 w-4" />
        Crear Factura
      </Button>
      <CreateInvoiceDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
