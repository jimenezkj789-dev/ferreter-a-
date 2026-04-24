import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, BusinessSettings } from '../types';

export const generateInvoicePDF = (invoice: Invoice, settings: BusinessSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.razonSocial, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`RUC: ${settings.ruc}`, 14, 28);
  doc.text(settings.direccion || '', 14, 33);

  // Document Info (Series / Number Box)
  doc.setFillColor(241, 245, 249);
  doc.rect(pageWidth - 80, 15, 66, 30, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - 80, 15, 66, 30, 'D');
  
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  const typeText = (invoice.type === 'guia' ? 'GUÍA DE REMISIÓN' : invoice.type).toUpperCase();
  doc.text(typeText, pageWidth - 47, 25, { align: 'center' });
  doc.text('ELECTRÓNICA', pageWidth - 47, 32, { align: 'center' });
  doc.setTextColor(59, 130, 246);
  doc.text(`${invoice.id}`, pageWidth - 47, 40, { align: 'center' });

  // Customer Info
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 45, 55);
  
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO:', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerDocument, 45, 60);
  
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', 14, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.date).toLocaleDateString(), 45, 65);

  // Table
  const tableData = invoice.items.map(item => [
    item.quantity.toString(),
    'UNID',
    item.name,
    `S/ ${item.unitPrice.toFixed(2)}`,
    `S/ ${item.total.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['CANT', 'U.M.', 'DESCRIPCIÓN', 'P. UNIT', 'TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SUBTOTAL:', pageWidth - 80, finalY);
  doc.text(`S/ ${invoice.subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
  
  doc.text('IGV (18%):', pageWidth - 80, finalY + 7);
  doc.text(`S/ ${invoice.igv.toFixed(2)}`, pageWidth - 20, finalY + 7, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 80, finalY + 15);
  doc.text(`S/ ${invoice.total.toFixed(2)}`, pageWidth - 20, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('Representación impresa del comprobante electrónico.', 14, finalY + 30);
  doc.text('Consulta tu documento en nuestro portal web.', 14, finalY + 35);
  doc.text(`Hash: ${Math.random().toString(36).substring(7).toUpperCase()}`, 14, finalY + 40);

  doc.save(`${invoice.id}.pdf`);
};

export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
