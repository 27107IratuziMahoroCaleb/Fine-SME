export async function exportPdf(el, filename) {
  const { default: html2canvas } = await import('html2canvas')
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width
  let left = imgH
  let pos = 0
  pdf.addImage(imgData, 'PNG', 0, pos, pageW, imgH)
  left -= pageH
  while (left > 0) {
    pos -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, pos, pageW, imgH)
    left -= pageH
  }
  pdf.save(filename)
}
