import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Invoice, InvoiceItem, Quote, QuoteItem } from "@/lib/types"

interface BusinessConfig {
  businessName: string
  rnc: string
  address: string
  phone: string
  deliveryPhone: string
  cashierName?: string
}

export function generateThermalPDF(invoice: Invoice, invoiceItems: InvoiceItem[], config: BusinessConfig) {
  // Crear PDF con tamaño térmico (80mm de ancho)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // 80mm de ancho, altura variable
  })

  let yPosition = 10
  const pageWidth = 80
  const margin = 5

  // Configurar fuente
  pdf.setFont("courier", "normal")
  pdf.setFontSize(8)

  // Función para centrar texto
  const centerText = (text: string, y: number, fontSize = 8) => {
    pdf.setFontSize(fontSize)
    const textWidth = pdf.getTextWidth(text)
    const x = (pageWidth - textWidth) / 2
    pdf.text(text, x, y)
    return y + fontSize * 0.5
  }

  // Función para texto normal
  const addText = (text: string, x: number, y: number, fontSize = 8) => {
    pdf.setFontSize(fontSize)
    pdf.text(text, x, y)
    return y + fontSize * 0.5
  }

  // Encabezado del negocio
  yPosition = centerText(config.businessName, yPosition, 10)
  yPosition = centerText(`${config.businessName} EIRL`, yPosition + 2, 8)
  yPosition = centerText(`RNC:${config.rnc}`, yPosition + 2, 7)
  yPosition = centerText(config.address, yPosition + 2, 6)

  yPosition += 8

  // Cliente genérico
  yPosition = addText("CLIENTE:000001-CLIENTE GENERICO", margin, yPosition, 7)
  yPosition = addText(`RNC CLIENTE:${invoice.customer_rnc || ""}`, margin, yPosition + 2, 7)

  yPosition += 8

  // Título
  yPosition = centerText("FACTURA", yPosition, 12)

  yPosition += 6

  // Información de la orden
  const folio = Math.floor(Math.random() * 90000) + 10000
  const orderNum = Math.floor(Math.random() * 100) + 1
  const date = new Date(invoice.created_at).toLocaleString("es-DO")

  yPosition = centerText(`FOLIO:${folio}`, yPosition, 8)
  yPosition = centerText(date, yPosition + 2, 8)

  yPosition += 4

  // Personas y orden
  pdf.setFontSize(7)
  pdf.text("PERSONAS:1", margin, yPosition)
  pdf.text(`ORDEN:${orderNum}`, pageWidth - margin - pdf.getTextWidth(`ORDEN:${orderNum}`), yPosition)

  yPosition += 6

  // Separador
  yPosition = centerText("==========================================", yPosition, 8)

  yPosition += 4

  // Encabezado de productos
  pdf.setFontSize(7)
  pdf.text("CANT.DESCRIPCION", margin, yPosition)
  pdf.text("IMPORTE", pageWidth - margin - pdf.getTextWidth("IMPORTE"), yPosition)

  yPosition += 4

  // Productos
  invoiceItems.forEach((item) => {
    const productName = item.product?.name?.toUpperCase() || "PRODUCTO"
    const quantity = item.quantity.toString()
    const price = formatCurrency(item.subtotal)

    pdf.setFontSize(6)
    pdf.text(quantity, margin, yPosition)
    pdf.text(productName, margin + 8, yPosition)
    pdf.text(price, pageWidth - margin - pdf.getTextWidth(price), yPosition)
    yPosition += 3
  })

  yPosition += 4

  // Totales
  const subtotal = formatCurrency(invoice.subtotal || invoice.total_amount)
  const tax = invoice.apply_tax ? formatCurrency(invoice.tax_amount || 0) : null
  const total = formatCurrency(invoice.total_amount)

  pdf.setFontSize(7)
  pdf.text("SUBTOTAL:", margin, yPosition)
  pdf.text(subtotal, pageWidth - margin - pdf.getTextWidth(subtotal), yPosition)
  yPosition += 3

  if (tax) {
    pdf.text("ITBIS:", margin, yPosition)
    pdf.text(tax, pageWidth - margin - pdf.getTextWidth(tax), yPosition)
    yPosition += 3
  }

  pdf.setFont("courier", "bold")
  pdf.text("TOTAL:", margin, yPosition)
  pdf.text(total, pageWidth - margin - pdf.getTextWidth(total), yPosition)
  pdf.setFont("courier", "normal")

  yPosition += 6

  // Forma de pago
  yPosition = addText(
    `FORMAS DE PAGO:${invoice.payment_method?.toUpperCase() || "NO IDENTIFICADO"}`,
    margin,
    yPosition,
    7,
  )

  yPosition += 4

  // Observaciones
  yPosition = addText("OBSERVACIONES:", margin, yPosition, 7)
  if (invoice.notes) {
    yPosition = addText(invoice.notes, margin, yPosition + 2, 6)
  }

  yPosition += 6

  // Atendido por
  yPosition = addText(`ATENDIDO POR: ${config.cashierName?.toUpperCase() || "CAJERO"}`, margin, yPosition, 7)

  yPosition += 4

  // Delivery
  yPosition = addText(`PARA DELIVERY : ${config.deliveryPhone}`, margin, yPosition, 7)

  yPosition += 6

  // Footer
  yPosition = centerText("***SOFT RESTAURANT V11 ***", yPosition, 7)

  return pdf
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(amount)
}

export async function generateQuotePDF(quote: Quote, quoteItems: QuoteItem[]) {
  // Crear un nuevo documento PDF
  const doc = new jsPDF()

  // Configurar fuentes
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("COTIZACIÓN", 14, 20)

  doc.setFontSize(12)
  doc.text(`#${quote.quote_number}`, 14, 28)

  // Información de la empresa
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("LL THERMOART", 150, 20, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("RNC: 123456789", 150, 28, { align: "right" })
  doc.text("Dirección: Calle Principal #123", 150, 34, { align: "right" })
  doc.text("Teléfono: 829-222-0085", 150, 40, { align: "right" })
  doc.text("Email: info@llthermoart.com", 150, 46, { align: "right" })

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 55, 196, 55)

  // Información del cliente
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Cliente:", 14, 65)

  doc.setFont("helvetica", "normal")
  doc.text(quote.customer_name, 50, 65)

  // RNC del cliente si existe
  if (quote.customer_rnc) {
    doc.setFont("helvetica", "bold")
    doc.text("RNC:", 14, 75)
    doc.setFont("helvetica", "normal")
    doc.text(quote.customer_rnc, 50, 75)
  }

  // Información de la cotización
  let yPos = quote.customer_rnc ? 85 : 75

  doc.setFont("helvetica", "bold")
  doc.text("Fecha:", 14, yPos)
  yPos += 10
  doc.text("Método de Pago:", 14, yPos)
  yPos += 10
  doc.text("Estado:", 14, yPos)
  yPos += 10

  if (quote.delivery_date) {
    doc.text("Fecha de Entrega:", 14, yPos)
    yPos += 10
  }

  // Resetear yPos para los valores
  yPos = quote.customer_rnc ? 85 : 75

  doc.setFont("helvetica", "normal")
  doc.text(new Date(quote.created_at).toLocaleDateString(), 50, yPos)
  yPos += 10
  doc.text(quote.payment_method, 50, yPos)
  yPos += 10
  doc.text(quote.payment_status, 50, yPos)
  yPos += 10

  if (quote.delivery_date) {
    doc.text(new Date(quote.delivery_date).toLocaleDateString(), 50, yPos)
    yPos += 10
  }

  // Tabla de productos
  const tableColumn = ["Producto", "Cantidad", "Precio Unitario", "Subtotal"]
  const tableRows = quoteItems.map((item) => [
    item.product?.name || "Producto desconocido",
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.subtotal),
  ])

  // Preparar el pie de tabla con subtotal, impuestos y total
  const tableFoot = [["", "", "Subtotal", formatCurrency(quote.subtotal)]]

  if (quote.apply_tax) {
    tableFoot.push(["", "", "ITBIS (18%)", formatCurrency(quote.tax_amount)])
  }

  tableFoot.push(["", "", "Total", formatCurrency(quote.total_amount)])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: yPos,
    theme: "striped",
    headStyles: {
      fillColor: [227, 130, 200],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    foot: tableFoot,
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  })

  // Notas
  if (quote.notes) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFont("helvetica", "bold")
    doc.text("Notas:", 14, finalY)
    doc.setFont("helvetica", "normal")
    doc.text(quote.notes, 14, finalY + 10)
  }

  // Pie de página
  const pageHeight = doc.internal.pageSize.height
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  doc.text("Gracias por su interés en nuestros productos", 105, pageHeight - 20, { align: "center" })
  doc.text("Esta cotización es válida por 30 días a partir de la fecha de emisión", 105, pageHeight - 15, {
    align: "center",
  })
  doc.text("LL THERMOART", 105, pageHeight - 10, { align: "center" })

  // Guardar el PDF
  doc.save(`Cotizacion_${quote.quote_number}.pdf`)
}
