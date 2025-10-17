import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amountToWordsINR } from './numberToWords';
import logo from '../assets/logo.png';
import unicodeFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url';

const formatCurrency = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getTotals = (items) => {
  const totalQty = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);
  const totalAmt = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const units = new Set(items.map((i) => (i.per || '').trim()).filter(Boolean));
  const unit = units.size === 1 ? [...units][0] : '';
  return { totalQty, totalAmt, unit };
};

// Unicode font for ₹
let unicodeFontLoaded = false;
async function ensureUnicodeFont(doc) {
  if (unicodeFontLoaded) return;
  const res = await fetch(unicodeFontUrl);
  const buf = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  doc.addFileToVFS('NotoSans-Regular.ttf', base64);
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  unicodeFontLoaded = true;
}

// Shared layout
function layout(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageWidth - margin * 2;
  const headerY = 22;
  const headerH = 42;
  const leftW = 110;
  const rightW = contentW - leftW;
  const rightMidY = headerY + headerH / 2;
  const rightColMid = margin + leftW + rightW / 2;
  return { pageWidth, pageHeight, margin, contentW, headerY, headerH, leftW, rightW, rightMidY, rightColMid };
}

function drawTitles(doc, pageWidth) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(0, 0, 0);
  doc.text('Bill of Supply', pageWidth / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Composition taxable person. Not eligible to collect tax on supplies', pageWidth / 2, 17, { align: 'center' });
}

// Only the company contents (no boxes/lines)
function drawCompanyContents(doc, margin, headerY) {
  const compX = margin + 36;
  doc.addImage(logo, 'PNG', margin + 2, headerY + 4, 22, 16);
  doc.setTextColor(200, 32, 32);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('AASHUTOSH SALES CENTRE', compX, headerY + 9);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2);
  const companyLines = [
    '124,1 FLOOR, MEGHALHAR COMPLEX, SECTOR-11,',
    'GANDHINAGAR',
    'GSTIN/UIN: 24AAJPT3116D1Z0',
    'State Name : Gujarat, Code : 24',
    'Contact : 9426513615',
    'E-Mail : svt6152@gmail.com',
  ];
  let cy = headerY + 14; const cGap = 4.1;
  companyLines.forEach(t => { doc.text(t, compX, cy); cy += cGap; });
}

// Header boxes/lines (outer + right splits + optional left rectangle)
function drawHeaderBoxes(doc, layoutVals, opts = {}) {
  const { drawLeftRect = true } = opts;
  const { margin, contentW, headerY, headerH, leftW, rightW, rightMidY, rightColMid } = layoutVals;

  doc.rect(margin, headerY, contentW, headerH); // outer header
  if (drawLeftRect) doc.rect(margin, headerY, leftW, headerH); // left (company) box
  doc.rect(margin + leftW, headerY, rightW, headerH); // right meta box
  doc.line(margin + leftW, rightMidY, margin + contentW, rightMidY); // horizontal split
  doc.line(rightColMid, headerY, rightColMid, rightMidY); // vertical split
}

// Section 1: Header-only (color), exact same position, no lines
export async function generateHeaderSectionPDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { pageWidth, headerY, margin } = layout(doc);
  drawTitles(doc, pageWidth);
  drawCompanyContents(doc, margin, headerY);
  doc.save('Section1_Header_Color.pdf');
}

// Section 2: Body-only (B&W), everything except company contents (and no left header box)
export const generateBodySectionPDF = async (billData, items) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = layout(doc);
  const { pageWidth, pageHeight, margin, contentW, headerY, headerH, leftW, rightW, rightMidY, rightColMid } = L;

  drawTitles(doc, pageWidth);
  drawHeaderBoxes(doc, L, { drawLeftRect: false }); // suppress left outline

  // Right meta
  const pad = 2, colW = rightW / 2 - pad * 2;
  const col1X = margin + leftW + pad;
  const col2X = rightColMid + pad;
  const labelYTop = headerY + 7, valueYTop = labelYTop + 5.2;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text('Invoice No.', col1X, labelYTop);
  doc.text('Dated', col2X, labelYTop);

  doc.setFont('helvetica', 'bold');
  doc.text(billData.invoiceNo || '', col1X, valueYTop, { maxWidth: colW });
  doc.setFont('helvetica', 'normal');
  doc.text(billData.date || '', col2X, valueYTop, { maxWidth: colW });

  const labelYBot = rightMidY + 7, valueYBot = labelYBot + 5.2;
  doc.setFont('helvetica', 'bold');
  doc.text('Reference', col1X, labelYBot);
  doc.setFont('helvetica', 'normal');
  doc.text(billData.reference || 'NA', col1X + 24, valueYBot, { maxWidth: rightW - 24 - pad * 2 });

  // Buyer box
  const buyerY = headerY + headerH + 2;
  const buyerH = 26;
  doc.rect(margin, buyerY, contentW, buyerH);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Buyer (Bill to)', margin + 2, buyerY + 5);
  doc.text((billData.buyerName || '').toUpperCase(), margin + 2, buyerY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(billData.buyerAddress1 || '', margin + 2, buyerY + 17);
  doc.text(billData.buyerAddress2 || '', margin + 2, buyerY + 22);

  // Items table
  const tableStartY = buyerY + buyerH + 3;
  const head = [['Sl No.', 'Description of Goods', 'Quantity', 'Rate', 'per', 'Amount']];
  const body = items.map((it, i) => [
    String(i + 1),
    it.description || '',
    `${it.quantity || ''} ${it.per || ''}`.trim(),
    Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    it.per || '',
    Number(it.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
  ]);

  const { totalQty, totalAmt, unit } = getTotals(items);
  await ensureUnicodeFont(doc);

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    theme: 'grid',
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2.2,
      halign: 'left',
      valign: 'middle',
      textColor: 0,
    },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', halign: 'left' },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 92 },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'foot') {
        if (data.column.index === 5) {
          data.cell.styles.font = 'NotoSans';
          data.cell.styles.fontStyle = 'normal';
        } else {
          data.cell.styles.font = 'helvetica';
          data.cell.styles.fontStyle = 'bold';
        }
        data.cell.styles.textColor = 0;
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'foot') {
        if (data.column.index === 5) data.doc.setFont('NotoSans', 'normal');
        else data.doc.setFont('helvetica', 'bold');
      }
    },
    foot: [[
      { content: 'Total', colSpan: 2, styles: { halign: 'right' } },
      { content: `${String(totalQty).replace('.00', '')} ${unit}`.trim(), styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'center' } },
      { content: `₹ ${Number(totalAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, styles: { halign: 'right' } },
    ]],
    footStyles: { fillColor: [245, 245, 245], textColor: 0 },
    pageBreak: 'auto',
  });

  // Footer (wrapped amount-in-words + aligned bank)
  const bankRows = [
    ['A/c Holder\'s Name', 'AASHUTOSH SALES CENTRE'],
    ['Bank Name', 'HDFC AIC NO.50200109706541'],
    ['A/c No.', '50200109706541'],
    ['Branch & IFS Code', 'SECTOR-21 & HDFC0007455'],
    ['SWIFT Code', ''],
  ];

  const footerGapAbove = 10;
  const eoeHeight = 6;
  const amtWordsMinH = 18;

  const bankRowH = 4.8;
  const bankHeaderH = 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  const labelMax = Math.max(...bankRows.map(([label]) => doc.getTextWidth(`${label} :`)));
  const bankContentH = bankHeaderH + bankRows.length * bankRowH + 6;

  const { contentW: cw } = L;
  const leftW1 = cw * 0.55;
  const rightW1 = cw - leftW1;

  const wordsWrapWidth = leftW1 - 4;
  const wordsRaw = amountToWordsINR(totalAmt);
  const wordsLines = doc.splitTextToSize(wordsRaw, wordsWrapWidth);
  const wordsHeaderH = 6;
  const wordsLineH = 4.5;
  const wordsContentH = wordsHeaderH + wordsLines.length * wordsLineH + 4;

  const amtWordsH = Math.max(amtWordsMinH, bankContentH, wordsContentH);
  const declH = 26;
  const row3H = 24;
  const bottomNotes = 16;

  let afterTableY = doc.lastAutoTable.finalY + 3;
  let yStartFooter = afterTableY + footerGapAbove;
  const footerTotalH = eoeHeight + 4 + amtWordsH + 3 + declH + 3 + row3H + bottomNotes;
  const spaceLeft = L.pageHeight - L.margin - yStartFooter;
  if (spaceLeft < footerTotalH) {
    doc.addPage();
    yStartFooter = L.margin + 2;
  }

  // E. & O.E
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text('E. & O.E', L.margin + L.contentW - 10, yStartFooter + eoeHeight, { align: 'right' });

  // Row 1: Amount in words (wrapped)
  const row1Y = yStartFooter + eoeHeight + 4;
  doc.rect(L.margin, row1Y, leftW1, amtWordsH);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Amount Chargeable (in words)', L.margin + 2, row1Y + 6);
  doc.text(wordsLines, L.margin + 2, row1Y + 12, { lineHeightFactor: 1.1 });

  // Row 1: Bank details (aligned)
  doc.rect(L.margin + leftW1, row1Y, rightW1, amtWordsH);
  const bankXLabel = L.margin + leftW1 + 2;
  const bankXValue = bankXLabel + labelMax + 2;
  doc.text("Company's Bank Details", bankXLabel, row1Y + 6);
  let by = row1Y + 6 + 5;
  bankRows.forEach(([label, value]) => {
    doc.text(`${label} :`, bankXLabel, by);
    doc.text(String(value || ''), bankXValue, by);
    by += bankRowH;
  });

  // Row 2: Declaration + Sign
  const row2Y = row1Y + amtWordsH + 3;
  doc.rect(L.margin, row2Y, leftW1, declH);
  doc.text('Declaration', L.margin + 2, row2Y + 7);
  doc.setFont('helvetica', 'normal');
  const decl = 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
  doc.text(decl, L.margin + 2, row2Y + 13, { maxWidth: leftW1 - 4 });

  doc.setFont('helvetica', 'bold');
  doc.rect(L.margin + leftW1, row2Y, rightW1, declH);
  doc.text('for AASHUTOSH SALES CENTRE', L.margin + leftW1 + rightW1 - 2, row2Y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', L.margin + leftW1 + rightW1 - 2, row2Y + declH - 5, { align: 'right' });

  // Row 3: Customer seal/sign
  const row3Y = row2Y + declH + 3;
  doc.rect(L.margin, row3Y, leftW1, row3H);
  doc.text("Customer's Seal and Signature", L.margin + 2, row3Y + 8);

  // Bottom notes
  const bottom1Y = Math.min(L.pageHeight - 14, row3Y + row3H + 10);
  const bottom2Y = Math.min(L.pageHeight - 8, bottom1Y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBJECT TO GANDHINAGAR JURISDICTION', L.pageWidth / 2, bottom1Y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('This is a Computer Generated Invoice', L.pageWidth / 2, bottom2Y, { align: 'center' });

  doc.save(`Section2_Body_BW_${billData.invoiceNo || 'Generated'}.pdf`);
};

// Full bill (header + body) if you still need it
export const generateBillPDF = async (billData, items) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = layout(doc);
  const { pageWidth, pageHeight, margin, contentW, headerY, headerH, leftW, rightW, rightMidY, rightColMid } = L;

  drawTitles(doc, pageWidth);

  // Header boxes
  drawHeaderBoxes(doc, L, { drawLeftRect: true });

  // Company block
  drawCompanyContents(doc, margin, headerY);

  // Right meta
  const pad = 2, colW = rightW / 2 - pad * 2;
  const col1X = margin + leftW + pad;
  const col2X = rightColMid + pad;
  const labelYTop = headerY + 7, valueYTop = labelYTop + 5.2;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text('Invoice No.', col1X, labelYTop);
  doc.text('Dated', col2X, labelYTop);

  doc.setFont('helvetica', 'bold');
  doc.text(billData.invoiceNo || '', col1X, valueYTop, { maxWidth: colW });
  doc.setFont('helvetica', 'normal');
  doc.text(billData.date || '', col2X, valueYTop, { maxWidth: colW });

  const labelYBot = rightMidY + 7, valueYBot = labelYBot + 5.2;
  doc.setFont('helvetica', 'bold');
  doc.text('Reference', col1X, labelYBot);
  doc.setFont('helvetica', 'normal');
  doc.text(billData.reference || 'NA', col1X + 24, valueYBot, { maxWidth: rightW - 24 - pad * 2 });

  // Buyer box
  const buyerY = headerY + headerH + 2;
  const buyerH = 26;
  doc.rect(margin, buyerY, contentW, buyerH);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Buyer (Bill to)', margin + 2, buyerY + 5);
  doc.text((billData.buyerName || '').toUpperCase(), margin + 2, buyerY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(billData.buyerAddress1 || '', margin + 2, buyerY + 17);
  doc.text(billData.buyerAddress2 || '', margin + 2, buyerY + 22);

  // Items table
  const tableStartY = buyerY + buyerH + 3;
  const head = [['Sl No.', 'Description of Goods', 'Quantity', 'Rate', 'per', 'Amount']];
  const body = items.map((it, i) => [
    String(i + 1),
    it.description || '',
    `${it.quantity || ''} ${it.per || ''}`.trim(),
    Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    it.per || '',
    Number(it.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
  ]);

  const { totalQty, totalAmt, unit } = getTotals(items);
  await ensureUnicodeFont(doc);

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    theme: 'grid',
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2.2,
      halign: 'left',
      valign: 'middle',
      textColor: 0,
    },
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', halign: 'left' },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 92 },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'foot') {
        if (data.column.index === 5) {
          data.cell.styles.font = 'NotoSans';
          data.cell.styles.fontStyle = 'normal';
        } else {
          data.cell.styles.font = 'helvetica';
          data.cell.styles.fontStyle = 'bold';
        }
        data.cell.styles.textColor = 0;
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'foot') {
        if (data.column.index === 5) data.doc.setFont('NotoSans', 'normal');
        else data.doc.setFont('helvetica', 'bold');
      }
    },
    foot: [[
      { content: 'Total', colSpan: 2, styles: { halign: 'right' } },
      { content: `${String(totalQty).replace('.00', '')} ${unit}`.trim(), styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'center' } },
      { content: `₹ ${Number(totalAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, styles: { halign: 'right' } },
    ]],
    footStyles: { fillColor: [245, 245, 245], textColor: 0 },
    pageBreak: 'auto',
  });

  // Footer placement (same as Section 2)
  const bankRows = [
    ['A/c Holder\'s Name', 'AASHUTOSH SALES CENTRE'],
    ['Bank Name', 'HDFC AIC NO.50200109706541'],
    ['A/c No.', '50200109706541'],
    ['Branch & IFS Code', 'SECTOR-21 & HDFC0007455'],
    ['SWIFT Code', ''],
  ];

  const footerGapAbove = 10;
  const eoeHeight = 6;
  const amtWordsMinH = 18;

  const bankRowH = 4.8;
  const bankHeaderH = 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  const labelMax = Math.max(...bankRows.map(([label]) => doc.getTextWidth(`${label} :`)));
  const bankContentH = bankHeaderH + bankRows.length * bankRowH + 6;

  const { contentW: cw } = L;
  const leftW1 = cw * 0.55;
  const rightW1 = cw - leftW1;

  const wordsWrapWidth = leftW1 - 4;
  const wordsRaw = amountToWordsINR(totalAmt);
  const wordsLines = doc.splitTextToSize(wordsRaw, wordsWrapWidth);
  const wordsHeaderH = 6;
  const wordsLineH = 4.5;
  const wordsContentH = wordsHeaderH + wordsLines.length * wordsLineH + 4;

  const amtWordsH = Math.max(amtWordsMinH, bankContentH, wordsContentH);
  const declH = 26;
  const row3H = 24;
  const bottomNotes = 16;

  let afterTableY = doc.lastAutoTable.finalY + 3;
  let yStartFooter = afterTableY + footerGapAbove;
  const footerTotalH = eoeHeight + 4 + amtWordsH + 3 + declH + 3 + row3H + bottomNotes;
  const spaceLeft = L.pageHeight - L.margin - yStartFooter;
  if (spaceLeft < footerTotalH) {
    doc.addPage();
    yStartFooter = L.margin + 2;
  }

  // E. & O.E
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text('E. & O.E', L.margin + L.contentW - 10, yStartFooter + eoeHeight, { align: 'right' });

  // Row 1: Amount in words (wrapped)
  const row1Y = yStartFooter + eoeHeight + 4;
  doc.rect(L.margin, row1Y, leftW1, amtWordsH);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Amount Chargeable (in words)', L.margin + 2, row1Y + 6);
  doc.text(wordsLines, L.margin + 2, row1Y + 12, { lineHeightFactor: 1.1 });

  // Row 1: Bank details (aligned)
  doc.rect(L.margin + leftW1, row1Y, rightW1, amtWordsH);
  const bankXLabel = L.margin + leftW1 + 2;
  const bankXValue = bankXLabel + labelMax + 2;
  doc.text("Company's Bank Details", bankXLabel, row1Y + 6);
  let by = row1Y + 6 + 5;
  bankRows.forEach(([label, value]) => {
    doc.text(`${label} :`, bankXLabel, by);
    doc.text(String(value || ''), bankXValue, by);
    by += bankRowH;
  });

  // Row 2: Declaration + Sign
  const row2Y = row1Y + amtWordsH + 3;
  doc.rect(L.margin, row2Y, leftW1, declH);
  doc.text('Declaration', L.margin + 2, row2Y + 7);
  doc.setFont('helvetica', 'normal');
  const decl = 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
  doc.text(decl, L.margin + 2, row2Y + 13, { maxWidth: leftW1 - 4 });

  doc.setFont('helvetica', 'bold');
  doc.rect(L.margin + leftW1, row2Y, rightW1, declH);
  doc.text('for AASHUTOSH SALES CENTRE', L.margin + leftW1 + rightW1 - 2, row2Y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', L.margin + leftW1 + rightW1 - 2, row2Y + declH - 5, { align: 'right' });

  // Row 3: Customer seal/sign
  const row3Y = row2Y + declH + 3;
  doc.rect(L.margin, row3Y, leftW1, row3H);
  doc.text("Customer's Seal and Signature", L.margin + 2, row3Y + 8);

  // Bottom notes
  const bottom1Y = Math.min(L.pageHeight - 14, row3Y + row3H + 10);
  const bottom2Y = Math.min(L.pageHeight - 8, bottom1Y + 6);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBJECT TO GANDHINAGAR JURISDICTION', L.pageWidth / 2, bottom1Y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('This is a Computer Generated Invoice', L.pageWidth / 2, bottom2Y, { align: 'center' });

  doc.save(`Bill_${billData.invoiceNo || 'Generated'}.pdf`);
};