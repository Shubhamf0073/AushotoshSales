import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

void main() {
  runApp(const PdfApp());
}

class PdfApp extends StatelessWidget {
  const PdfApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PDF Generator',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const HomeScreen(),
    );
  }
}

// Item model
class Item {
  String description;
  int qty;
  double price;

  Item({this.description = "", this.qty = 1, this.price = 0});
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Form fields
  String _docType = 'Quotation';
  final _clientNameController = TextEditingController();
  final _clientAddressController = TextEditingController();
  final _dateController = TextEditingController();
  final _invoiceController = TextEditingController();
  final _refNoController = TextEditingController();

  // Items
  List<Item> items = [];

  void _addItem() {
    setState(() {
      items.add(Item());
    });
  }

  void _removeItem(int index) {
    setState(() {
      items.removeAt(index);
    });
  }

  double get total {
    return items.fold(0, (sum, item) => sum + (item.qty * item.price));
  }

  // PDF Generator
  Future<void> _generatePdf() async {
    final pdf = pw.Document();

    // Load logo
    final logoBytes = await rootBundle.load("assets/logo.png");
    final logo = pw.MemoryImage(logoBytes.buffer.asUint8List());

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          // Header
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Image(logo, width: 80),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text("AASHUTOSH SALES CENTER",
                      style: pw.TextStyle(
                          fontSize: 16, fontWeight: pw.FontWeight.bold)),
                  pw.Text("Office No.124, 1st Floor, Meghmalhar Complex"),
                  pw.Text("Sector-11, Gandhinagar: 382010"),
                  pw.Text("GSTIN: 24AAJPT3116D1Z0 | PAN: AAJPT3116D"),
                  pw.Text("Phone: +91 9426513615"),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 20),

          // Title
          pw.Center(
            child: pw.Text(
              _docType == "Quotation" ? "QUOTATION" : "FINAL BILL",
              style:
              pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.SizedBox(height: 20),

          // Client + Doc info
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text("To: ${_clientNameController.text}"),
                  pw.Text(_clientAddressController.text),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text("Date: ${_dateController.text}"),
                  if (_docType == "Bill")
                    pw.Text("Invoice No: ${_invoiceController.text}"),
                  if (_docType == "Bill")
                    pw.Text("Ref No: ${_refNoController.text}"),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 20),

          // Items Table
          pw.Table.fromTextArray(
            headers: _docType == "Quotation"
                ? ["Description", "Unit Price"]
                : ["Qty", "Description", "Unit Price", "Total"],
            data: items.map((item) {
              if (_docType == "Quotation") {
                return [item.description, "₹${item.price}"];
              } else {
                return [
                  item.qty.toString(),
                  item.description,
                  "₹${item.price}",
                  "₹${item.qty * item.price}"
                ];
              }
            }).toList(),
            border: pw.TableBorder.all(),
            cellAlignment: pw.Alignment.centerLeft,
            headerStyle: pw.TextStyle(
                fontWeight: pw.FontWeight.bold, color: PdfColors.white),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.blue),
          ),
          pw.SizedBox(height: 20),

          // Grand total
          if (_docType == "Bill")
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Text("Grand Total: ₹$total",
                  style: pw.TextStyle(
                      fontSize: 16, fontWeight: pw.FontWeight.bold)),
            ),

          // Footer
          pw.SizedBox(height: 30),
          pw.Text("Bank: HDFC Bank, A/C: 50200109706541"),
          pw.Text("IFSC: HDFC0007455"),
          if (_docType == "Bill")
            pw.Text(
                "Goods once sold will not be taken back. No complaints after 7 days."),
          pw.SizedBox(height: 40),
          pw.Align(
            alignment: pw.Alignment.centerRight,
            child: pw.Text("Authorized Signatory"),
          ),
        ],
      ),
    );

    // Save locally
    final dir = await getApplicationDocumentsDirectory();
    final file = File(
        "${dir.path}/${_docType}_${DateTime.now().millisecondsSinceEpoch}.pdf");
    await file.writeAsBytes(await pdf.save());

    // Open the PDF
    await OpenFile.open(file.path);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Quotation / Bill Generator")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Dropdown
            DropdownButtonFormField<String>(
              value: _docType,
              items: const [
                DropdownMenuItem(value: 'Quotation', child: Text('Quotation')),
                DropdownMenuItem(value: 'Bill', child: Text('Bill')),
              ],
              onChanged: (val) {
                setState(() => _docType = val!);
              },
              decoration: const InputDecoration(
                labelText: 'Document Type',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Common fields
            TextField(
              controller: _dateController,
              decoration: const InputDecoration(
                labelText: "Date",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _clientNameController,
              decoration: const InputDecoration(
                labelText: "Client Name",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _clientAddressController,
              decoration: const InputDecoration(
                labelText: "Client Address",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Extra fields only if Bill
            if (_docType == 'Bill') ...[
              TextField(
                controller: _invoiceController,
                decoration: const InputDecoration(
                  labelText: "Invoice No.",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _refNoController,
                decoration: const InputDecoration(
                  labelText: "Ref No.",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Dynamic Items List
            const Text("Items",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      children: [
                        TextField(
                          decoration:
                          const InputDecoration(labelText: "Description"),
                          onChanged: (val) => item.description = val,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                decoration:
                                const InputDecoration(labelText: "Qty"),
                                keyboardType: TextInputType.number,
                                onChanged: (val) =>
                                item.qty = int.tryParse(val) ?? 1,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                decoration: const InputDecoration(
                                    labelText: "Unit Price"),
                                keyboardType: TextInputType.number,
                                onChanged: (val) =>
                                item.price = double.tryParse(val) ?? 0,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Total: ₹${item.qty * item.price}"),
                            IconButton(
                              onPressed: () => _removeItem(index),
                              icon: const Icon(Icons.delete, color: Colors.red),
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 8),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _addItem,
                icon: const Icon(Icons.add),
                label: const Text("Add Item"),
              ),
            ),
            const SizedBox(height: 16),

            Text("Grand Total: ₹$total",
                style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),

            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _generatePdf,
                child: const Text("Generate PDF"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
