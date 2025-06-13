"use client"

import { useEffect } from "react"
import Image from "next/image"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useBusinessConfig } from "@/hooks/use-business-config"

interface InvoicePrintProps {
  invoice: Invoice
  invoiceItems: InvoiceItem[]
}

export function InvoicePrint({ invoice, invoiceItems }: InvoicePrintProps) {
  const { config } = useBusinessConfig()

  useEffect(() => {
    // Imprimir automáticamente cuando se carga la página
    window.onload = () => {
      window.print()
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 print:p-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>

      <div className="print-area">
        {/* Encabezado */}
        <div className="flex flex-col justify-between gap-6 border-b border-gray-200 pb-6 md:flex-row md:items-start">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{config.businessName}</h1>
              <p className="text-sm text-gray-600">RNC: {config.rnc}</p>
              <p className="text-sm text-gray-600">{config.address}</p>
              <p className="text-sm text-gray-600">Tel: {config.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="rounded-md bg-[#EC8330]/10 p-4 text-center">
              <h2 className="text-xl font-bold text-[#8DC73F]">FACTURA</h2>
              <p className="text-lg font-semibold text-gray-700">#{invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Información del cliente y detalles de la factura */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Cliente</h3>
            <p className="text-lg font-medium text-gray-900">{invoice.customer_name}</p>
            {invoice.customer_rnc && <p className="text-sm text-gray-600">RNC: {invoice.customer_rnc}</p>}
            {invoice.customer_phone && <p className="text-sm text-gray-600">Tel: {invoice.customer_phone}</p>}
            {invoice.customer_address && <p className="text-sm text-gray-600">Dirección: {invoice.customer_address}</p>}
          </div>
          <div className="space-y-1 text-right">
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Fecha de emisión:</span>
              <span>{formatDate(invoice.created_at)}</span>
            </div>
            {invoice.delivery_date && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Fecha de entrega:</span>
                <span>{formatDate(invoice.delivery_date)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Método de pago:</span>
              <span>{invoice.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Estado:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  invoice.payment_status === "Pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {invoice.payment_status}
              </span>
            </div>
            {config.cashierName && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Atendido por:</span>
                <span>{config.cashierName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="mt-8">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Descripción</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Precio Unitario</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoiceItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.product?.name}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal || invoice.total_amount)}</span>
            </div>
            {invoice.apply_tax && (
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-medium text-gray-600">ITBIS (18%):</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-[#E382C8]">{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {invoice.notes && (
          <div className="mt-8 rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 font-semibold text-gray-700">Notas</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Pie de página */}
        <div className="mt-12 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">Gracias por su compra</p>
          <p className="mt-1 text-xs text-gray-400">
            Esta factura fue generada electrónicamente y es válida sin firma ni sello.
          </p>
          <div className="mt-4 text-xs text-gray-400">
            <p>
              {config.businessName} | Tel: {config.phone}
            </p>
            {config.deliveryPhone && <p>Delivery: {config.deliveryPhone}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
