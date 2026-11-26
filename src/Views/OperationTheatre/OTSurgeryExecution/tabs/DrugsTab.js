import React from "react";

const DrugsTab = ({
  activeDrugDropdownRowId,
  drugErrors,
  drugInputRefs,
  drugRows,
  handleAddDrugRow,
  handleDrugInputChange,
  handleDrugInputFocus,
  handleDrugRowChange,
  handleRemoveDrugRow,
  handleSaveTab,
  isSelectedPatientPacPending,
  openDrugTemplateModal,
  savingTab,
  setDrugErrors,
  setDrugRows,
  setShowDrugDropdown,
}) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="fw-bold mb-0">Drugs Used During Surgery</h6>
      <div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm me-2"
          onClick={openDrugTemplateModal}
        >
          <i className="fa fa-folder-open me-1"></i> Drug Templates
        </button>
        <button className="btn btn-success btn-sm" onClick={handleAddDrugRow}>
          <i className="fa fa-plus me-1"></i> Add Drug
        </button>
      </div>
    </div>

    <div className="table-responsive" style={{ minHeight: "220px" }}>
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ minWidth: "240px" }}>Drug</th>
            <th style={{ width: "90px" }}>Qty</th>
            <th style={{ width: "120px" }}>Unit</th>
            <th style={{ minWidth: "180px", width: "200px" }}>Batch No.</th>
            <th style={{ width: "150px" }}>Used By</th>
            <th style={{ width: "50px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {drugRows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="text"
                  ref={(el) => (drugInputRefs.current[row.id] = el)}
                  className="form-control form-control-sm"
                  value={row.drugName}
                  onChange={(e) => handleDrugInputChange(row.id, e.target.value)}
                  onFocus={() => handleDrugInputFocus(row.id, row.drugName)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (activeDrugDropdownRowId === row.id) {
                        setShowDrugDropdown(false);
                      }
                    }, 250);
                  }}
                  placeholder="Type drug name to search..."
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  className={`form-control form-control-sm ${drugErrors[`qty_${row.id}`] ? "is-invalid" : ""
                    }`}
                  value={row.qty}
                  onChange={(e) => {
                    handleDrugRowChange(row.id, "qty", e.target.value);
                    if (drugErrors[`qty_${row.id}`]) {
                      setDrugErrors((prev) => ({ ...prev, [`qty_${row.id}`]: "" }));
                    }
                  }}
                />
                {drugErrors[`qty_${row.id}`] && (
                  <div className="invalid-feedback d-block" style={{ fontSize: "11px" }}>
                    {drugErrors[`qty_${row.id}`]}
                  </div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  className={`form-control form-control-sm bg-light ${drugErrors[`unit_${row.id}`] ? "is-invalid" : ""
                    }`}
                  value={row.unit || ""}
                  readOnly
                  title="Unit is set automatically from selected drug and cannot be updated"
                  style={{ backgroundColor: "#e9ecef" }}
                  placeholder="Unit"
                />
                {drugErrors[`unit_${row.id}`] && (
                  <div className="invalid-feedback d-block" style={{ fontSize: "11px" }}>
                    {drugErrors[`unit_${row.id}`]}
                  </div>
                )}
              </td>
              <td>
                {row.loadingBatches ? (
                  <div className="d-flex align-items-center text-muted py-1" style={{ fontSize: "11px" }}>
                    <span className="spinner-border spinner-border-sm me-1 text-primary" role="status" aria-hidden="true"></span>
                    Loading batches...
                  </div>
                ) : !row.itemId ? (
                  <select className="form-select form-select-sm" disabled>
                    <option value="">Select drug first</option>
                  </select>
                ) : row.availableBatches && row.availableBatches.length > 0 ? (
                  <div>
                    <select
                      className="form-select form-select-sm"
                      value={row.batchNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        const bObj = row.availableBatches.find((b) => b.batchName === val);
                        setDrugRows((prev) =>
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
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.usedBy}
                  onChange={(e) => handleDrugRowChange(row.id, "usedBy", e.target.value)}
                />
              </td>
              <td className="text-center">
                <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveDrugRow(row.id)}
                  disabled={drugRows.length === 1}><i className="icofont-trash"></i></button>
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
        onClick={() => handleSaveTab("Drugs used")}
        disabled={Boolean(savingTab) || isSelectedPatientPacPending}
        title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
      >
        Save Drugs
        {savingTab === "drugs" ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Saving Drugs...
          </>
        ) : (
          <>
            <i className="fa fa-save me-1"></i> Save Drugs
          </>
        )}
      </button>
    </div>
  </div>
);

export default DrugsTab;
