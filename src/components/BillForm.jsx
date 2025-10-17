import { useState } from 'react';
import ItemsTable from './ItemsTable';
import { generateHeaderSectionPDF, generateBodySectionPDF, generateBillPDF } from '../utils/pdfTemplates';

const BillForm = () => {
  const [billData, setBillData] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    buyerName: '',
    buyerAddress1: '',
    buyerAddress2: '',
  });

  const [items, setItems] = useState([
    { description: '', quantity: '', rate: '', per: 'NO', amount: 0 },
  ]);

  const handleBillDataChange = (e) => {
    setBillData({ ...billData, [e.target.name]: e.target.value });
  };

  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Invoice No. *</label>
        <input type="text" name="invoiceNo" value={billData.invoiceNo} onChange={handleBillDataChange} />
      </div>
      <div className="form-group">
        <label>Date *</label>
        <input type="date" name="date" value={billData.date} onChange={handleBillDataChange} />
      </div>
      <div className="form-group">
        <label>Reference</label>
        <input type="text" name="reference" value={billData.reference} onChange={handleBillDataChange} placeholder="e.g. PO/Note/etc." />
      </div>

      <h3>Buyer Details (Bill to)</h3>
      <div className="form-group">
        <label>Buyer Name *</label>
        <input type="text" name="buyerName" value={billData.buyerName} onChange={handleBillDataChange} />
      </div>
      <div className="form-group">
        <label>Address Line 1 *</label>
        <input type="text" name="buyerAddress1" value={billData.buyerAddress1} onChange={handleBillDataChange} />
      </div>
      <div className="form-group">
        <label>Address Line 2 *</label>
        <input type="text" name="buyerAddress2" value={billData.buyerAddress2} onChange={handleBillDataChange} />
      </div>

      <ItemsTable items={items} setItems={setItems} />

      <div className="button-group" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="button" onClick={async () => { await generateHeaderSectionPDF(); }}>
          Download Section 1 (Color Header)
        </button>
        <button className="button" onClick={async () => { await generateBodySectionPDF(billData, items); }}>
          Download Section 2 (B&W Body)
        </button>
        <button className="button btn-primary" onClick={async () => { await generateBillPDF(billData, items); }}>
          Download Full Bill (PDF)
        </button>
      </div>
    </div>
  );
};

export default BillForm;