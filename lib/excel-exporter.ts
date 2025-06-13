import * as XLSX from "xlsx"

export function exportToExcel(data: any[], fileName: string, sheetName = "Hoja1") {
  // Crear un libro de trabajo
  const workbook = XLSX.utils.book_new()

  // Convertir los datos a una hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generar un blob en lugar de escribir directamente en el sistema de archivos
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

  // Crear un URL para el blob
  const url = URL.createObjectURL(blob)

  // Crear un elemento de enlace para descargar el archivo
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileName}.xlsx`

  // Simular un clic en el enlace para iniciar la descarga
  document.body.appendChild(a)
  a.click()

  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
