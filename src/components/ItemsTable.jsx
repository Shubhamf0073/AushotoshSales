const ItemsTable = ({ items, setItems }) => {
  const addItem = () => setItems([...items, { description: '', quantity: '', rate: '', per: 'NO', amount: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index, field, value) => {
    const copy = [...items];
    copy[index][field] = value;
    const qty = parseFloat(copy[index].quantity) || 0;
    const rate = parseFloat(copy[index].rate) || 0;
    copy[index].amount = (qty * rate).toFixed(2);
    setItems(copy);
  };

  return (
    <div>
      <h3>Items</h3>
      <table className="items-table">
        <thead>
          <tr>
            <th>Sl No.</th>
            <th>Description of Goods</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Per</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>
                <input type="text" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
              </td>
              <td>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
              </td>
              <td>
                <input type="number" step="0.01" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} />
              </td>
              <td>
                <input type="text" value={item.per} onChange={(e) => updateItem(idx, 'per', e.target.value)} />
              </td>
              <td>{item.amount}</td>
              <td><button className="button btn-danger" onClick={() => removeItem(idx)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="button btn-primary" onClick={addItem}>+ Add Item</button>
    </div>
  );
};

export default ItemsTable;