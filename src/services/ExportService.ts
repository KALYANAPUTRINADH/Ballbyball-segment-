import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const ExportService = {
  exportToCSV(data: any[], filename: string) {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  exportToPDF(
    headers: string[],
    rows: any[][],
    filename: string,
    title: string,
    subtitle?: string
  ) {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 22);
    
    // Add subtitle if provided
    if (subtitle) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 30);
    }
    
    // Add timestamp
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, subtitle ? 35 : 28);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: subtitle ? 40 : 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [209, 26, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`${filename}.pdf`);
  }
};
