import { useState } from "react";
import Popup from "../../../Components/popup";

/* ================= MOCK DATA ================= */
const MOCK_DRUGS = [
  { id: 101, code: "PCM001", name: "Paracetamol", unit: "mg", gst: 5 },
  { id: 102, code: "IBU001", name: "Ibuprofen", unit: "mg", gst: 12 },
  { id: 103, code: "DOL001", name: "Dolo 650", unit: "mg", gst: 5 },
];

const MOCK_BRANDS = [
  { id: 1, name: "Cipla" },
  { id: 2, name: "Sun Pharma" },
];

const MOCK_MANUFACTURERS = [
  { id: 1, name: "Cipla Ltd" },
  { id: 2, name: "Sun Pharma Ltd" },
];
/* ============================================ */

const emptyRow = {
  drugId: "",
  drugCode: "",
  drugName: "",
  unit: "",
  batchNo: "",
  dom: "",
  doe: "",
  qty: "",
  mrp: "",
  total: "",
  brand: "",
  manufacturer: "",
};

const IndentViewUpdate = () => {
  const [entryRow, setEntryRow] = useState(emptyRow);
  const [indentList, setIndentList] = useState([]);
  const [showIndentItems, setShowIndentItems] = useState(false);
  const [popup, setPopup] = useState(null);

  const showPopup = (message, type = "info") => {
    setPopup({ message, type, onClose: () => setPopup(null) });
  };

  /* ================= HANDLERS ================= */

  const handleChange = (field, value) => {
    let updated = { ...entryRow, [field]: value };

    if (field === "qty" || field === "mrp") {
      const qty = parseFloat(updated.qty || 0);
      const mrp = parseFloat(updated.mrp || 0);
      updated.total = (qty * mrp).toFixed(2);
    }

    setEntryRow(updated);
  };

  const handleDrugSelect = (drug) => {
    if (!drug) return;

    setEntryRow({
      ...entryRow,
      drugId: drug.id,
      drugCode: drug.code,
      drugName: drug.name,
      unit: drug.unit,
    });
  };

  const handleAdd = () => {
    if (!entryRow.drugId || !entryRow.qty || !entryRow.mrp) {
      showPopup("Please fill mandatory fields", "warning");
      return;
    }

    setIndentList([...indentList, { ...entryRow, id: Date.now() }]);
    setShowIndentItems(true);          // SHOW TABLE
    setEntryRow(emptyRow);             // RESET FORM
  };

  const handleDelete = (id) => {
    const updated = indentList.filter((i) => i.id !== id);
    setIndentList(updated);

    if (updated.length ===0){
      setShowIndentItems(false);
     
    }
  };

  const handleSave = () => {
    console.log("SAVE:", indentList);
    showPopup("Saved successfully", "success");
  };

  const handleSubmit = () => {
    console.log("SUBMIT:", indentList);
    showPopup("Submitted successfully", "success");
  };

  /* ================= UI ================= */

  return (
    <div className="content-wrapper">
      <div className="card">
        <div className="card-header">
          <h4>Indent View Update</h4>
        </div>

        <div className="card-body">

          {/* ========== ENTRY TABLE ========== */}
          <h6>Enter Item</h6>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Drug</th>
                <th>Batch</th>
                <th>DOM</th>
                <th>DOE</th>
                <th>Qty</th>
                <th>MRP</th>
                <th>Total</th>
                <th>Brand</th>
                <th>Mfg</th>
                <th>Add</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <select 
                    className="form-select"
                    value={entryRow.drugId}
                    onChange={(e) =>
                      handleDrugSelect(
                        MOCK_DRUGS.find(d => d.id === Number(e.target.value))
                      )
                    }
                  >
                    <option value="">Select Drug</option>
                    {MOCK_DRUGS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input className="form-control"
                    value={entryRow.batchNo}
                    onChange={e => handleChange("batchNo", e.target.value)} />
                </td>

                <td>
                  <input type="date" className="form-control"
                    value={entryRow.dom}
                    onChange={e => handleChange("dom", e.target.value)} />
                </td>

                <td>
                  <input type="date" className="form-control"
                    value={entryRow.doe}
                    onChange={e => handleChange("doe", e.target.value)} />
                </td>

                <td>
                  <input type="number" className="form-control"
                    value={entryRow.qty}
                    onChange={e => handleChange("qty", e.target.value)} />
                </td>

                <td>
                  <input type="number" className="form-control"
                    value={entryRow.mrp}
                    onChange={e => handleChange("mrp", e.target.value)} />
                </td>

                <td>
                  <input className="form-control" value={entryRow.total} readOnly />
                </td>

                <td>
                  <select className="form-select"
                    value={entryRow.brand}
                    onChange={e => handleChange("brand", e.target.value)}>
                    <option value="">Select</option>
                    {MOCK_BRANDS.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </td>

                <td>
                  <select className="form-select"
                    value={entryRow.manufacturer}
                    onChange={e => handleChange("manufacturer", e.target.value)}>
                    <option value="">Select</option>
                    {MOCK_MANUFACTURERS.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </td>

                <td>
                  <button className="btn btn-success" onClick={handleAdd}>+</button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ========== INDENT ITEMS (HIDDEN INITIALLY) ========== */}
          {showIndentItems && (
            <>
              <h6 className="mt-4">Indent Items</h6>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Drug</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>MRP</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {indentList.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.drugName}</td>
                      <td>{row.batchNo}</td>
                      <td>{row.qty}</td>
                      <td>{row.mrp}</td>
                      <td>{row.total}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(row.id)}
                        >
                          -
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ========== ACTION BUTTONS ========== */}
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-warning" onClick={handleSave}>Save</button>
            <button className="btn btn-success" onClick={handleSubmit}>Submit</button>
          </div>

        </div>
      </div>

      {popup && <Popup {...popup} />}
    </div>
  );
};

export default IndentViewUpdate;
