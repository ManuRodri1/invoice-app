"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateQuoteDialog } from "./create-quote-dialog"

export function CreateQuoteButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="brand-gradient">
        <Plus className="mr-2 h-4 w-4" />
        Crear Cotización
      </Button>
      <CreateQuoteDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
