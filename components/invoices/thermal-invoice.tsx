"use client"

import { useEffect } from "react"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { useBusinessConfig } from "@/hooks/use-business-config"

interface ThermalInvoiceProps {
  invoice: Invoice
  invoiceItems: InvoiceItem[]
}

export function ThermalInvoice({ invoice, invoiceItems }: ThermalInvoiceProps) {
  const { config } = useBusinessConfig()

  useEffect(() => {
    // Auto-imprimir cuando se carga el componente
    const timer = setTimeout(() => {
      window.print()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const generateOrderNumber = () => {
    return Math.floor(Math.random() * 100) + 1
  }

  // Determinar el tipo de documento
  const getDocumentType = () => {
    if (invoice.payment_status === "Pendiente") {
      return "PRE-FACTURA"
    }
    return "FACTURA"
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          .thermal-receipt,
          .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }

        .thermal-receipt {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.1;
          color: black;
          background: white;
        }

        .center {
          text-align: center;
        }

        .bold {
          font-weight: bold;
        }

        .separator {
          margin: 6px 0;
          text-align: center;
          font-weight: bold;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin: 4px 0;
        }

        .product-row {
          display: flex;
          margin: 2px 0;
          font-size: 10px;
        }

        .product-qty {
          width: 15px;
          flex-shrink: 0;
        }

        .product-desc {
          flex: 1;
          margin-right: 8px;
          word-wrap: break-word;
        }

        .product-price {
          width: 60px;
          text-align: right;
          flex-shrink: 0;
        }

        .totals-section {
          margin-top: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 1px 0;
        }

        .total-final {
          font-weight: bold;
          font-size: 12px;
          margin-top: 2px;
        }

        .info-section {
          margin: 8px 0;
          font-size: 10px;
        }

        .footer-section {
          margin-top: 12px;
          text-align: center;
          font-size: 10px;
        }

        .itbis-note {
          font-size: 8px;
          color: #666;
          margin-left: 15px;
        }
      `}</style>

      <div className="thermal-receipt">
        {/* Encabezado del negocio - Solo una vez */}
        <div className="center bold">
          <div style={{ fontSize: "13px" }}>{config.businessName}</div>
          <div style={{ fontSize: "10px" }}>RNC:{config.rnc}</div>
          <div style={{ fontSize: "9px", marginTop: "2px" }}>{config.address}</div>
        </div>

        {/* Información del cliente real */}
        <div style={{ marginTop: "8px", fontSize: "10px" }}>
          <div>CLIENTE: {invoice.customer_name.toUpperCase()}</div>
          {invoice.customer_rnc && <div>RNC CLIENTE: {invoice.customer_rnc}</div>}
          {invoice.customer_phone && <div>TEL: {invoice.customer_phone}</div>}
          {invoice.customer_address && <div>DIR: {invoice.customer_address}</div>}
        </div>

        {/* Título del documento */}
        <div className="center bold" style={{ margin: "12px 0", fontSize: "14px" }}>
          {getDocumentType()}
        </div>

        {/* Información de la orden */}
        <div className="center" style={{ fontSize: "10px" }}>
          <div>
            {getDocumentType()}:{invoice.invoice_number}
          </div>
          <div>{formatDate(invoice.created_at)}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: "10px" }}>
          <span>PERSONAS:1</span>
          <span>ORDEN:{generateOrderNumber()}</span>
        </div>

        {/* Separador */}
        <div className="separator">==========================================</div>

        {/* Encabezado de productos */}
        <div className="product-header">
          <span>CANT.DESCRIPCION</span>
          <span>IMPORTE</span>
        </div>

        {/* Lista de productos */}
        {invoiceItems.map((item) => (
          <div key={item.id}>
            <div className="product-row">
              <div className="product-qty">{item.quantity}</div>
              <div className="product-desc">{item.product?.name?.toUpperCase() || "PRODUCTO"}</div>
              <div className="product-price">{formatCurrency(item.subtotal)}</div>
            </div>
            {invoice.apply_tax && <div className="itbis-note">(incluye ITBIS)</div>}
          </div>
        ))}

        {/* Totales */}
        <div className="totals-section">
          <div className="total-row">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(invoice.subtotal || invoice.total_amount)}</span>
          </div>
          {invoice.apply_tax && (
            <div className="total-row">
              <span>ITBIS:</span>
              <span>{formatCurrency(invoice.tax_amount || 0)}</span>
            </div>
          )}
          <div className="total-row total-final">
            <span>TOTAL:</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>

        {/* Forma de pago */}
        <div className="info-section">
          <div>FORMAS DE PAGO:{invoice.payment_method?.toUpperCase() || "NO IDENTIFICADO"}</div>
        </div>

        {/* Observaciones - Mostrar las notas reales */}
        <div className="info-section">
          <div>OBSERVACIONES:</div>
          {invoice.notes && <div style={{ fontSize: "9px", marginTop: "2px" }}>{invoice.notes}</div>}
        </div>

        {/* Atendido por */}
        <div className="info-section">
          <div>ATENDIDO POR: {config.cashierName?.toUpperCase() || "CAJERO"}</div>
        </div>

        {/* Teléfono para delivery */}
        <div className="info-section">
          <div>PARA DELIVERY : {config.deliveryPhone}</div>
        </div>

        {/* Footer simplificado */}
        <div className="footer-section">
          <div>Gracias por su compra</div>
        </div>
      </div>
    </>
  )
}
