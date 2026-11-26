import React from "react";

const ConsumablesTab = ({
  activeConsumableDropdownRowId,
  consumableInputRefs,
  consumableRows,
  handleAddConsumableRow,
  handleConsumableInputChange,
  handleConsumableInputFocus,
  handleConsumableRowChange,
  handleRemoveConsumableRow,
  handleSaveTab,
  isSelectedPatientPacPending,
  openConsumableTemplateModal,
  savingTab,
  setConsumableRows,
  setShowConsumableDropdown,
}) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="fw-bold mb-0">Medical Consumables Used</h6>
      <div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm me-2"
          onClick={openConsumableTemplateModal}
        >
          <i className="fa fa-folder-open me-1"></i> Consumable Templates
        </button>
        <button className="btn btn-success btn-sm" onClick={handleAddConsumableRow}>
          <i className="fa fa-plus me-1"></i> Add Consumable
        </button>
      </div>
    </div>

    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Item</th>
            <th style={{ width: "90px" }}>Planned</th>
            <th style={{ width: "90px" }}>Used</th>
            <th style={{ width: "110px" }}>Unit</th>
            <th style={{ width: "180px" }}>Batch</th>
            <th style={{ width: "50px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {consumableRows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="text"
                  ref={(el) => (consumableInputRefs.current[row.id] = el)}
                  className="form-control form-control-sm"
                  value={row.item}
                  onChange={(e) => handleConsumableInputChange(row.id, e.target.value)}
                  onFocus={() => handleConsumableInputFocus(row.id, row.item)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (activeConsumableDropdownRowId === row.id) {
                        setShowConsumableDropdown(false);
                      }
                    }, 250);
                  }}
                  placeholder="Type consumable name to search..."
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.planned}
                  readOnly
                  style={{ backgroundColor: "#e9ecef" }}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.used}
                  onChange={(e) => handleConsumableRowChange(row.id, "used", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm bg-light"
                  value={row.unit || ""}
                  readOnly
                  title="Unit is set automatically from selected item and cannot be updated"
                  style={{ backgroundColor: "#e9ecef" }}
                  placeholder="Unit"
                />
              </td>
              <td>
                {row.loadingBatches ? (
                  <div className="d-flex align-items-center text-muted py-1" style={{ fontSize: "11px" }}>
                    <span className="spinner-border spinner-border-sm me-1 text-primary" role="status" aria-hidden="true"></span>
                    Loading batches...
                  </div>
                ) : !row.itemId ? (
                  <select className="form-select form-select-sm" disabled>
                    <option value="">Select item first</option>
                  </select>
                ) : row.availableBatches && row.availableBatches.length > 0 ? (
                  <div>
                    <select
                      className="form-select form-select-sm"
                      value={row.batchNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        const bObj = row.availableBatches.find((b) => b.batchName === val);
                        setConsumableRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? {
                                ...r,
                                batchNo: val,
                                stockId: bObj?.stockId || null,
                                availableStock:
                                  bObj?.availableStock ?? bObj?.batchStock ?? null,
                              }
                              : r
                          )
                        );
                      }}
                    >
                      <option value="">Select Batch</option>
                      {row.availableBatches.map((b) => (
                        <option key={b.stockId || b.batchName} value={b.batchName}>
                          {b.batchName} (Stock: {b.availableStock ?? b.batchStock ?? 0}
                          {b.doe ? `, Exp: ${b.doe}` : ""})
                        </option>
                      ))}
                    </select>
                    {row.availableStock !== undefined && row.availableStock !== null && (
                      <small className="text-muted d-block mt-1" style={{ fontSize: "10px" }}>
                        Avail Stock: {row.availableStock}
                      </small>
                    )}
                  </div>
                ) : (
                  <select className="form-select form-select-sm" disabled>
                    <option value="">No Batch Available</option>
                  </select>
                )}
              </td>
              <td className="text-center">
                <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveConsumableRow(row.id)}
                  disabled={consumableRows.length === 1}><i className="icofont-trash"></i></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => handleSaveTab("Consumables used")}
        disabled={Boolean(savingTab) || isSelectedPatientPacPending}
        title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
      >
        {savingTab === "consumables" ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Saving Consumables...
          </>
        ) : (
          <>
            <i className="fa fa-save me-1"></i> Save Consumables
          </>
        )}
      </button>
    </div>
  </div>
);

export default ConsumablesTab;
