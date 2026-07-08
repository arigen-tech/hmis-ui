import React, { useState } from 'react';

const NursingCareModule = () => {
  // ---------- Tab State ----------
  const [activeTab, setActiveTab] = useState('procedures'); // "procedures" | "consumables"

  // ---------- Sample Data ----------
  // Available procedure names for auto‑complete
  const procedureOptions = [
    'IV Cannulation',
    'Dressing',
    'Foley Catheter Insertion',
    'Ryle’s Tube Insertion',
    'Nebulization',
    'Oxygen Therapy',
    'Suctioning',
    'Bladder Wash',
    'Enema',
    'Suture Removal',
  ];

  // Available consumable items for auto‑complete
  const itemOptions = [
    'IV Cannula',
    'Needle',
    'Fixator',
    'Gauze',
    'Gloves',
    'Catheter',
    'Lubricant',
    'Syringe',
    'IV Set',
    'Bandage',
    'Oxygen Mask',
    'Nebulizer',
  ];

  // Batch data (simulating FIFO)
  const batchData = {
    'IV Cannula': [
      { batch: '3053632', expiry: '2026-02-28' },
      { batch: '3053633', expiry: '2026-04-15' },
    ],
    'Needle': [
      { batch: '23023626', expiry: '2028-03-22' },
      { batch: '23023627', expiry: '2028-05-10' },
    ],
    'Fixator': [
      { batch: '239005', expiry: '2026-04-30' },
    ],
    'Gauze': [
      { batch: '621023', expiry: '2027-01-15' },
      { batch: '621024', expiry: '2027-03-20' },
    ],
    'Gloves': [
      { batch: 'GL5566', expiry: '2026-12-10' },
      { batch: 'GL5567', expiry: '2027-02-01' },
    ],
    // add more as needed
  };

  // UOM mapping
  const uomMap = {
    'IV Cannula': 'Piece',
    'Needle': 'Piece',
    'Fixator': 'Piece',
    'Gauze': 'Piece',
    'Gloves': 'Pair',
    'Catheter': 'Piece',
    'Lubricant': 'ml',
    'Syringe': 'Piece',
    'IV Set': 'Set',
    'Bandage': 'Roll',
    'Oxygen Mask': 'Piece',
    'Nebulizer': 'Piece',
  };

  // ---------- Procedures State ----------
  const [procedures, setProcedures] = useState([
    {
      id: 'P101',
      procedure: 'IV Cannulation',
      dateTime: '2025-04-05T10:30',
      performedBy: 'Nurse A',
      remarks: 'NA', // icon for remark
      remarkText: 'Patient had difficulty; used ultrasound',
    },
    {
      id: 'P102',
      procedure: 'Dressing',
      dateTime: '2025-04-05T14:00',
      performedBy: 'Nurse B',
      remarks: 'NA', // icon for remark

      remarkText: 'Wound clean, no signs of infection',
    },
    {
      id: 'P103',
      procedure: 'Foley Catheter Insertion',
      dateTime: '2025-04-06T09:15',
      performedBy: 'Nurse A',
      remarks: 'NA', // icon for remark

      remarkText: 'Catheter size 16Fr, urine output clear',
    },
    {
      id: 'P104',
      procedure: 'Nebulization',
      dateTime: '2025-04-06T11:00',
      performedBy: 'Nurse C',
      remarks: 'NA', // icon for remark
      remarkText: '',
    },
  ]);

  // ---------- Consumables State ----------
  const [consumables, setConsumables] = useState([
    {
      id: 1,
      item: 'IV Cannula',
      qty: 1,
      procedureRef: 'P101',
      dateTime: '2025-04-05T10:35',
      usedBy: 'Nurse A',
      batch: '3053632',
      expiry: '2026-02-28',
      remarks: 'C',
    },
    {
      id: 2,
      item: 'Needle',
      qty: 1,
      procedureRef: 'P101',
      dateTime: '2025-04-05T10:35',
      usedBy: 'Nurse A',
      batch: '23023626',
      expiry: '2028-03-22',
      remarks: '—',
    },
    {
      id: 3,
      item: 'Fixator',
      qty: 1,
      procedureRef: 'P101',
      dateTime: '2025-04-05T10:35',
      usedBy: 'Nurse A',
      batch: '239005',
      expiry: '2026-04-30',
      remarks: 'C',
    },
    {
      id: 4,
      item: 'Gauze',
      qty: 2,
      procedureRef: 'P102',
      dateTime: '2025-04-05T14:05',
      usedBy: 'Nurse B',
      batch: '621023',
      expiry: '2027-01-15',
      remarks: 'C',
    },
    {
      id: 5,
      item: 'Gloves',
      qty: 2,
      procedureRef: null, // not linked
      dateTime: '2025-04-05T15:10',
      usedBy: 'Nurse B',
      batch: 'GL5566',
      expiry: '2026-12-10',
      remarks: '—',
    },
  ]);

  // ---------- Templates State ----------
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'IV Cannulation Template',
      procedureName: 'IV Cannulation',
      items: [
        { item: 'IV Cannula', qty: 1 },
        { item: 'Needle', qty: 1 },
        { item: 'Fixator', qty: 1 },
        { item: 'Gloves', qty: 1 },
        { item: 'Syringe', qty: 1 },
      ],
    },
    {
      id: 2,
      name: 'Dressing Template',
      procedureName: 'Dressing',
      items: [
        { item: 'Gauze', qty: 2 },
        { item: 'Gloves', qty: 1 },
        { item: 'Bandage', qty: 1 },
      ],
    },
    {
      id: 3,
      name: 'Foley Catheter Template',
      procedureName: 'Foley Catheter Insertion',
      items: [
        { item: 'Catheter', qty: 1 },
        { item: 'Lubricant', qty: 10 },
        { item: 'Syringe', qty: 1 },
        { item: 'Gloves', qty: 1 },
      ],
    },
  ]);

  // ---------- UI State for Modals ----------
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [showAddConsumableModal, setShowAddConsumableModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRemarkTooltip, setShowRemarkTooltip] = useState(false); // not used, we'll use title attr

  // New Procedure form
  const [newProcedure, setNewProcedure] = useState({
    procedure: '',
    dateTime: '',
    performedBy: '',
    remarks: '',
    remarkText: '',
  });

  // New Consumable form
  const [newConsumable, setNewConsumable] = useState({
    item: '',
    uom: '',
    batch: '',
    expiry: '',
    qty: 1,
    usedBy: '',
    dateTime: '',
    procedureRef: '', // can be empty
  });

  // Template form for creating/editing
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    procedureName: '',
    items: [], // array of {item, qty}
  });

  // For applying template: when user selects a template in consumable form, we fill items
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  // We'll store the items from template in a separate list in the consumable form
  // Instead, we'll directly populate the consumable list when applying template? But requirement: "Users should be able to create templates for procedures" and "apply template to auto-fill consumable entry form".
  // We'll implement: In new consumable modal, there is a dropdown to select a template. When selected, it will generate a list of consumable entries (one for each item in template). We'll then allow user to edit quantities and other fields for each item.
  // So we need a dynamic list of consumable entries inside the modal.
  const [templateItems, setTemplateItems] = useState([]); // array of {item, qty, batch, expiry, usedBy, dateTime, procedureRef, remarks} for each line

  // Helper: get current datetime-local string
  const nowDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  // Helper: get default usedBy (simulate login user)
  const defaultUsedBy = 'Nurse A';

  // ---------- Handlers: Procedures ----------
  const handleAddProcedure = () => {
    const { procedure, dateTime, performedBy, remarks, remarkText } = newProcedure;
    if (!procedure || !dateTime || !performedBy) {
      alert('Please fill all required fields (Procedure, Date/Time, Performed By).');
      return;
    }
    const newId = `P${String(procedures.length + 101).padStart(3, '0')}`;
    const procToAdd = {
      id: newId,
      procedure,
      dateTime,
      performedBy,
      remarks: remarks ? '🔑' : '—',
      remarkText: remarks || '',
    };
    setProcedures([...procedures, procToAdd]);
    setShowAddProcedureModal(false);
    setNewProcedure({
      procedure: '',
      dateTime: nowDateTimeLocal(),
      performedBy: '',
      remarks: '',
      remarkText: '',
    });
  };

  // ---------- Handlers: Consumables ----------
  // When item changes, auto-set UOM and fetch batch options (FIFO)
  const handleConsumableItemChange = (item) => {
    const uom = uomMap[item] || '';
    setNewConsumable({
      ...newConsumable,
      item,
      uom,
      batch: '', // reset batch
      expiry: '',
    });
  };

  // When batch is selected, auto-fill expiry
  const handleBatchChange = (batch) => {
    const batches = batchData[newConsumable.item] || [];
    const found = batches.find(b => b.batch === batch);
    setNewConsumable({
      ...newConsumable,
      batch,
      expiry: found ? found.expiry : '',
    });
  };

  // Add single consumable
  const addSingleConsumable = () => {
    const { item, uom, batch, expiry, qty, usedBy, dateTime, procedureRef } = newConsumable;
    if (!item || !qty || !usedBy || !dateTime) {
      alert('Please fill all required fields (Item, Quantity, Used By, Date/Time).');
      return;
    }
    if (!batch) {
      alert('Please select a batch.');
      return;
    }
    const newEntry = {
      id: Date.now(),
      item,
      qty,
      procedureRef: procedureRef || null,
      dateTime,
      usedBy,
      batch,
      expiry,
      remarks: '—',
    };
    setConsumables([...consumables, newEntry]);
    // Reset form or keep it for next entry? We'll close modal.
    setShowAddConsumableModal(false);
    setNewConsumable({
      item: '',
      uom: '',
      batch: '',
      expiry: '',
      qty: 1,
      usedBy: defaultUsedBy,
      dateTime: nowDateTimeLocal(),
      procedureRef: '',
    });
    setTemplateItems([]);
    setSelectedTemplateId('');
  };

  // Add multiple items from template
  const addTemplateItems = () => {
    // templateItems contains all the rows with filled fields
    if (templateItems.length === 0) {
      alert('No items in template.');
      return;
    }
    for (let item of templateItems) {
      if (!item.item || !item.qty || !item.usedBy || !item.dateTime || !item.batch) {
        alert('Please fill all required fields for each template item (Item, Quantity, Used By, Date/Time, Batch).');
        return;
      }
    }
    const newEntries = templateItems.map(item => ({
      id: Date.now() + Math.random(),
      item: item.item,
      qty: item.qty,
      procedureRef: item.procedureRef || null,
      dateTime: item.dateTime,
      usedBy: item.usedBy,
      batch: item.batch,
      expiry: item.expiry,
      remarks: item.remarks || '—',
    }));
    setConsumables([...consumables, ...newEntries]);
    setShowAddConsumableModal(false);
    setNewConsumable({
      item: '',
      uom: '',
      batch: '',
      expiry: '',
      qty: 1,
      usedBy: defaultUsedBy,
      dateTime: nowDateTimeLocal(),
      procedureRef: '',
    });
    setTemplateItems([]);
    setSelectedTemplateId('');
  };

  // Apply template: fill templateItems array
  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (!template) return;
    const items = template.items.map(item => ({
      item: item.item,
      qty: item.qty,
      batch: '', // will be selected later
      expiry: '',
      usedBy: defaultUsedBy,
      dateTime: nowDateTimeLocal(),
      procedureRef: '', // user can choose
      remarks: '',
    }));
    setTemplateItems(items);
  };

  // Update a template item row
  const updateTemplateItem = (index, field, value) => {
    const updated = [...templateItems];
    updated[index][field] = value;
    // if item changes, update UOM? Not necessary for template.
    // if batch changes, update expiry
    if (field === 'batch') {
      const batches = batchData[updated[index].item] || [];
      const found = batches.find(b => b.batch === value);
      if (found) {
        updated[index].expiry = found.expiry;
      }
    }
    setTemplateItems(updated);
  };

  // ---------- Handlers: Templates ----------
  const openTemplateModal = (template = null) => {
    if (template) {
      setTemplateForm({
        id: template.id,
        name: template.name,
        procedureName: template.procedureName,
        items: template.items.map(it => ({ ...it })),
      });
    } else {
      setTemplateForm({
        id: null,
        name: '',
        procedureName: '',
        items: [{ item: '', qty: 1 }],
      });
    }
    setShowTemplateModal(true);
  };

  const addTemplateItemRow = () => {
    setTemplateForm({
      ...templateForm,
      items: [...templateForm.items, { item: '', qty: 1 }],
    });
  };

  const updateTemplateItemForm = (index, field, value) => {
    const updatedItems = [...templateForm.items];
    updatedItems[index][field] = value;
    setTemplateForm({ ...templateForm, items: updatedItems });
  };

  const removeTemplateItemRow = (index) => {
    if (templateForm.items.length === 1) {
      alert('Template must have at least one item.');
      return;
    }
    const updatedItems = templateForm.items.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, items: updatedItems });
  };

  const saveTemplate = () => {
    const { name, procedureName, items } = templateForm;
    if (!name || !procedureName || items.length === 0) {
      alert('Please fill Template Name, Procedure Name, and at least one item.');
      return;
    }
    if (items.some(it => !it.item || !it.qty)) {
      alert('Please fill item name and quantity for all rows.');
      return;
    }
    const newTemplate = {
      id: templateForm.id || Date.now(),
      name,
      procedureName,
      items: items.map(it => ({ item: it.item, qty: parseInt(it.qty) })),
    };
    if (templateForm.id) {
      // edit
      setTemplates(templates.map(t => t.id === templateForm.id ? newTemplate : t));
    } else {
      setTemplates([...templates, newTemplate]);
    }
    setShowTemplateModal(false);
  };

  // ---------- Render Helper for Procedure Remarks Tooltip ----------
  // We'll use title attribute for tooltip

  // ---------- Component Return ----------
  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'procedures' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('procedures')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Procedures
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'consumables' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('consumables')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Consumables
        </button>
      </div>

      {/* ─── PROCEDURES TAB ─── */}
      {activeTab === 'procedures' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Procedure List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setNewProcedure({ ...newProcedure, dateTime: nowDateTimeLocal() });
              setShowAddProcedureModal(true);
            }}>
              + Add Procedure
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Procedure</th>
                    <th>Date/Time</th>
                    <th>Performed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {procedures.map(proc => (
                    <tr key={proc.id}>
                      <td>{proc.id}</td>
                      <td>{proc.procedure}</td>
                      <td>{new Date(proc.dateTime).toLocaleString()}</td>
                      <td>{proc.performedBy}</td>
                      <td>
                        {proc.remarks !== '—' ? (
                          <span title={proc.remarkText || 'No remark'} style={{ cursor: 'help' }}>
                            {proc.remarks}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                  {procedures.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No procedures recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONSUMABLES TAB ─── */}
      {activeTab === 'consumables' && (
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <strong>Consumable List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setNewConsumable({
                ...newConsumable,
                dateTime: nowDateTimeLocal(),
                usedBy: defaultUsedBy,
              });
              setTemplateItems([]);
              setSelectedTemplateId('');
              setShowAddConsumableModal(true);
            }}>
              + Add Consumable
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Procedure Reference</th>
                    <th>Date & Time</th>
                    <th>Used By</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {consumables.map(cons => {
                    const proc = procedures.find(p => p.id === cons.procedureRef);
                    const refText = proc ? `${proc.procedure} (${new Date(proc.dateTime).toLocaleDateString()})` : '—';
                    return (
                      <tr key={cons.id}>
                        <td>{cons.item}</td>
                        <td>{cons.qty}</td>
                        <td>{refText}</td>
                        <td>{new Date(cons.dateTime).toLocaleString()}</td>
                        <td>{cons.usedBy}</td>
                        <td>{cons.batch}</td>
                        <td>{cons.expiry}</td>
                        <td>{cons.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                  {consumables.length === 0 && (
                    <tr><td colSpan="8" className="text-center">No consumables recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PROCEDURE MODAL ─── */}
      {showAddProcedureModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Add New Procedure</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddProcedureModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label small">Procedure Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    list="procedureOptions"
                    value={newProcedure.procedure}
                    onChange={e => setNewProcedure({ ...newProcedure, procedure: e.target.value })}
                    placeholder="Type or select"
                  />
                  <datalist id="procedureOptions">
                    {procedureOptions.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={newProcedure.dateTime}
                    onChange={e => setNewProcedure({ ...newProcedure, dateTime: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Performed By *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newProcedure.performedBy}
                    onChange={e => setNewProcedure({ ...newProcedure, performedBy: e.target.value })}
                    placeholder="Nurse name"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Remarks (optional)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newProcedure.remarks}
                    onChange={e => setNewProcedure({ ...newProcedure, remarks: e.target.value })}
                    placeholder="Any notes"
                  />
                  <small className="text-muted">Will show as key icon if filled.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddProcedureModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddProcedure}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CONSUMABLE MODAL ─── */}
    {/* ─── ADD CONSUMABLE MODAL ─── */}
{showAddConsumableModal && (
  <div
    className="modal show d-block"
    tabIndex="-1"
    style={{
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1040,
      overflowY: 'auto',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingLeft: '5rem' // extra gap from the right edge
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '800px' }}>
            <div className="modal-content">
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title">New Consumable Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddConsumableModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Template selection */}
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Apply Template (optional)</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedTemplateId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTemplateId(val);
                        if (val) {
                          applyTemplate(val);
                        } else {
                          setTemplateItems([]);
                        }
                      }}
                    >
                      <option value="">-- None --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => openTemplateModal(null)}>
                      Manage Templates
                    </button>
                  </div>
                </div>

                {/* If template is applied, show multiple rows */}
                {templateItems.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item *</th>
                          <th>Qty *</th>
                          <th>Batch *</th>
                          <th>Expiry</th>
                          <th>Used By *</th>
                          <th>Date/Time *</th>
                          <th>Procedure Ref</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templateItems.map((item, idx) => {
                          const availableBatches = batchData[item.item] || [];
                          return (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  list="itemOptions"
                                  value={item.item}
                                  onChange={(e) => updateTemplateItem(idx, 'item', e.target.value)}
                                />
                                <datalist id="itemOptions">
                                  {itemOptions.map(opt => <option key={opt} value={opt} />)}
                                </datalist>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={item.qty}
                                  onChange={(e) => updateTemplateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                  min="1"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.batch}
                                  onChange={(e) => updateTemplateItem(idx, 'batch', e.target.value)}
                                >
                                  <option value="">Select</option>
                                  {availableBatches.map(b => (
                                    <option key={b.batch} value={b.batch}>{b.batch}</option>
                                  ))}
                                </select>
                              </td>
                              <td>{item.expiry || '—'}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.usedBy}
                                  onChange={(e) => updateTemplateItem(idx, 'usedBy', e.target.value)}
                                  placeholder="Nurse"
                                />
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  className="form-control form-control-sm"
                                  value={item.dateTime}
                                  onChange={(e) => updateTemplateItem(idx, 'dateTime', e.target.value)}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.procedureRef}
                                  onChange={(e) => updateTemplateItem(idx, 'procedureRef', e.target.value)}
                                >
                                  <option value="">— None —</option>
                                  {procedures.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.procedure} ({new Date(p.dateTime).toLocaleDateString()})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.remarks}
                                  onChange={(e) => updateTemplateItem(idx, 'remarks', e.target.value)}
                                  placeholder="Optional"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-success btn-sm" onClick={addTemplateItems}>
                        Save All ({templateItems.length} items)
                      </button>
                    </div>
                  </div>
                ) : (
                  // Single entry form (when no template applied)
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small">Item Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        list="itemOptions"
                        value={newConsumable.item}
                        onChange={(e) => handleConsumableItemChange(e.target.value)}
                        placeholder="Type or select"
                      />
                      <datalist id="itemOptions">
                        {itemOptions.map(opt => <option key={opt} value={opt} />)}
                      </datalist>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">UOM</label>
                      <input type="text" className="form-control form-control-sm" value={newConsumable.uom} readOnly />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Batch *</label>
                      <select
                        className="form-select form-select-sm"
                        value={newConsumable.batch}
                        onChange={(e) => handleBatchChange(e.target.value)}
                      >
                        <option value="">Select</option>
                        {(batchData[newConsumable.item] || []).map(b => (
                          <option key={b.batch} value={b.batch}>{b.batch}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Expiry</label>
                      <input type="text" className="form-control form-control-sm" value={newConsumable.expiry} readOnly />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Quantity *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newConsumable.qty}
                        onChange={(e) => setNewConsumable({ ...newConsumable, qty: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Used By *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newConsumable.usedBy}
                        onChange={(e) => setNewConsumable({ ...newConsumable, usedBy: e.target.value })}
                        placeholder="Nurse"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={newConsumable.dateTime}
                        onChange={(e) => setNewConsumable({ ...newConsumable, dateTime: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Procedure Reference (optional)</label>
                      <select
                        className="form-select form-select-sm"
                        value={newConsumable.procedureRef}
                        onChange={(e) => setNewConsumable({ ...newConsumable, procedureRef: e.target.value })}
                      >
                        <option value="">— None —</option>
                        {procedures.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.procedure} ({new Date(p.dateTime).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* If no template, show save button */}
                {templateItems.length === 0 && (
                  <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-success btn-sm" onClick={addSingleConsumable}>
                      Save Consumable
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddConsumableModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATE MANAGER MODAL ─── */}
     {showTemplateModal && (
  <div
    className="modal show d-block"
    tabIndex="-1"
    style={{
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1050,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingLeft: '5rem'
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">{templateForm.id ? 'Edit Template' : 'New Template'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTemplateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Template Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Procedure Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      list="procedureOptions"
                      value={templateForm.procedureName}
                      onChange={(e) => setTemplateForm({ ...templateForm, procedureName: e.target.value })}
                    />
                    <datalist id="procedureOptions">
                      {procedureOptions.map(opt => <option key={opt} value={opt} />)}
                    </datalist>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item *</th>
                        <th>Quantity *</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templateForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              list="itemOptions"
                              value={item.item}
                              onChange={(e) => updateTemplateItemForm(idx, 'item', e.target.value)}
                            />
                            <datalist id="itemOptions">
                              {itemOptions.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.qty}
                              onChange={(e) => updateTemplateItemForm(idx, 'qty', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeTemplateItemRow(idx)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={addTemplateItemRow}>+ Add Item</button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveTemplate}>Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingCareModule;