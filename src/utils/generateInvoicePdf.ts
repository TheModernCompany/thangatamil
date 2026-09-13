import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export interface InvoiceItem {
  name: string;
  category?: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface InvoiceData {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoDataUrl?: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerContact: string;
  customerAddress?: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentStatusColor: string;
  items: InvoiceItem[];
  subtotal: number;
  productDiscount: number;
  additionalDiscount?: number;
  additionalDiscountLabel?: string;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

export async function generateInvoicePdf(data: InvoiceData, filename: string) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 32;

  // ---- Compact header (rendered once, fixed height, top of page 1) ----
  const headerContainer = document.createElement('div');
  headerContainer.style.position = 'absolute';
  headerContainer.style.left = '-9999px';
  headerContainer.style.width = '794px';
  headerContainer.innerHTML = `
    <div style="padding: 20px; background: white; font-family: Arial, sans-serif;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #d4a843; padding-bottom: 16px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${data.logoDataUrl
            ? `<img src="${data.logoDataUrl}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px;" />`
            : `<div style="width: 60px; height: 60px; background: linear-gradient(135deg, #d4a843, #f5d06b); border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:28px; color:white;">🎆</div>`
          }
          <div>
            <div style="font-size: 20px; font-weight: bold; color: #1a1a2e;">${data.companyName}</div>
            <div style="font-size: 11px; color: #6b7280; letter-spacing: 1.5px;">${data.tagline}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 26px; font-weight: bold; color: #d4a843; letter-spacing: 3px;">INVOICE</div>
          <div style="font-size: 12px; color: #6b7280;">#${data.invoiceNumber}</div>
        </div>
      </div>
      <div style="text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 14px; padding: 8px 0; background: #fafafa; border-radius: 6px;">
        📍 ${data.address} &nbsp;|&nbsp; 📞 ${data.phone} &nbsp;|&nbsp; ✉ ${data.email}${data.website ? ` &nbsp;|&nbsp; 🌐 ${data.website}` : ''}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; background: #f8fafc;">
          <div style="font-size: 10px; font-weight: bold; color: #d4a843; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Bill To</div>
          <div style="font-size: 14px; font-weight: bold; color: #1a1a2e;">${data.customerName}</div>
          <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">${data.customerContact}</div>
          <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">${data.customerAddress || 'N/A'}</div>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; background: #f8fafc;">
          <div style="font-size: 10px; font-weight: bold; color: #d4a843; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Invoice Details</div>
          <div style="display:flex; justify-content: space-between; font-size:12px; padding:1px 0;"><span style="color:#6b7280;">Date</span><span>${data.date}</span></div>
          <div style="display:flex; justify-content: space-between; font-size:12px; padding:1px 0;"><span style="color:#6b7280;">Time</span><span>${data.time}</span></div>
          <div style="display:flex; justify-content: space-between; font-size:12px; padding:1px 0;"><span style="color:#6b7280;">Payment</span><span style="text-transform:uppercase;">${data.paymentMethod}</span></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(headerContainer);
  await new Promise((r) => setTimeout(r, 100));
  const headerCanvas = await html2canvas(headerContainer, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: 794,
  });
  document.body.removeChild(headerContainer);

  const headerImg = headerCanvas.toDataURL('image/png');
  const headerImgHeight = (headerCanvas.height * (pageWidth - margin * 2)) / headerCanvas.width;
  pdf.addImage(headerImg, 'PNG', margin, margin, pageWidth - margin * 2, headerImgHeight);

  // ---- Items table — real pagination, tight consistent row spacing ----
  const tableStartY = margin + headerImgHeight + 16;

  autoTable(pdf, {
    startY: tableStartY,
    margin: { left: margin, right: margin, top: margin + 10 },
    head: [['#', 'Product', 'Price', 'Qty', 'Discount', 'Total']],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.category ? `${item.name}\n${item.category}` : item.name,
      `Rs ${item.unitPrice.toFixed(2)}`,
      String(item.qty),
      item.discount ? `-Rs ${item.discount.toFixed(2)}` : '-',
      `Rs ${item.total.toFixed(2)}`,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 24 },
      1: { halign: 'left' },
      2: { halign: 'right', cellWidth: 60 },
      3: { halign: 'center', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 60 },
      5: { halign: 'right', cellWidth: 65, fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: 'grid',
  });

  // ---- Totals — flows to a new page automatically if it doesn't fit ----
  // @ts-ignore - lastAutoTable is attached by the plugin at runtime
  let y = (pdf as any).lastAutoTable.finalY + 16;
  const totalsBlockHeight = 160;
  if (y + totalsBlockHeight > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  const totalsX = pageWidth - margin - 220;
  const printRow = (
    label: string,
    value: string,
    rowY: number,
    bold = false,
    color: [number, number, number] = [26, 26, 46]
  ) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(label, totalsX, rowY);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(value, pageWidth - margin, rowY, { align: 'right' });
  };

  printRow('Subtotal', `Rs ${data.subtotal.toFixed(2)}`, y);
  y += 16;
  if (data.productDiscount > 0) {
    printRow('Discount', `-Rs ${data.productDiscount.toFixed(2)}`, y, false, [239, 68, 68]);
    y += 16;
  }
  if (data.additionalDiscount && data.additionalDiscount > 0) {
    printRow(data.additionalDiscountLabel || 'Additional Discount', `-Rs ${data.additionalDiscount.toFixed(2)}`, y, false, [34, 197, 94]);
    y += 16;
  }
  pdf.setDrawColor(212, 168, 67);
  pdf.line(totalsX, y, pageWidth - margin, y);
  y += 14;
  printRow('Grand Total', `Rs ${data.grandTotal.toFixed(2)}`, y, true, [212, 168, 67]);
  y += 20;
  printRow('Payment Status', data.paymentStatus, y, true, hexToRgb(data.paymentStatusColor));
  y += 16;
  printRow('Total Paid', `Rs ${data.paidAmount.toFixed(2)}`, y, true, [34, 197, 94]);
  y += 16;
  printRow('Balance Due', `Rs ${data.remainingAmount.toFixed(2)}`, y, true, data.remainingAmount > 0 ? [234, 179, 8] : [34, 197, 94]);
  y += 24;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(156, 163, 175);
  pdf.text('This is a computer-generated invoice. Goods once sold will not be taken back.', pageWidth / 2, y, { align: 'center' });

  pdf.save(filename);
}
