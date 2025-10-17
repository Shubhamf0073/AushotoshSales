// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import { toWords } from 'number-to-words';

// // Function to generate Section 1 PDF
// export const generateSection1PDF = () => {
//   const doc = new jsPDF();
//   const logo = new Image();
//   logo.src = require('../assets/logo.png');

//   doc.addImage(logo, 'PNG', 10, 10, 50, 50);
//   doc.setFontSize(16);
//   doc.text("AASHUTOSH SALES CENTRE", 70, 20);
//   doc.setFontSize(12);
//   doc.text("Address: 24, FI FLOOR, MEGHALHAR COMPLEX, SECTOR-11, GANDHINAGAR", 10, 40);
//   doc.text("GSTIN/UIN: 24AAJPT3116D1Z0", 10, 50);
//   doc.text("State Name: Gujarat, Code: 24", 10, 60);
//   doc.text("Contact: 9426513615", 10, 70);
//   doc.text("E-Mail: svt6152@gmail.com", 10, 80);

//   doc.save("Section1_Bill.pdf");
// };

// // Function to generate Section 2 PDF
// export const generateSection2PDF = (billData, items) => {
//   const doc = new jsPDF();
//   doc.setFontSize(16);
//   doc.text("Bill of Supply", 105, 20, null, null, 'center');
//   doc.setFontSize(12);
//   doc.text(`Invoice No: ${billData.invoiceNo}`, 10, 40);
//   doc.text(`Date: ${billData.date}`, 10, 50);
//   doc.text(`Reference No: ${billData.referenceNo}`, 10, 60);
//   doc.text(`Other References: ${billData.otherReferences}`, 10, 70);
//   doc.text(`Buyer Name: ${billData.buyerName}`, 10, 80);
//   doc.text(`Address: ${billData.buyerAddress1}, ${billData.buyerAddress2}`, 10, 90);

//   // Add items table
//   const tableData = items.map((item, index) => [
//     index + 1,
//     item.description,
//     item.quantity,
//     item.rate,
//     item.per,
//     item.amount,
//   ]);

//   doc.autoTable({
//     head: [['Sl No.', 'Description of Goods', 'Quantity', 'Rate', 'Per', 'Amount']],
//     body: tableData,
//     startY: 100,
//   });

//   // Total Amount in Words
//   const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
//   doc.text(`Total Amount in Words: ${toWords(totalAmount)} Only`, 10, doc.lastAutoTable.finalY + 10);

//   doc.save("Section2_Bill.pdf");
// };