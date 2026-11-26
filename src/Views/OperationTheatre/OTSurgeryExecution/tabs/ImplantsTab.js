import React from "react";

const ImplantsTab = ({
  handleAddImplantRow,
  handleImplantRowChange,
  handleRemoveImplantRow,
  handleSaveTab,
  implantRows,
  isSelectedPatientPacPending,
  savingTab,
}) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h6 className="fw-bold mb-0">Implants Used</h6>
      <button className="btn btn-success btn-sm" onClick={handleAddImplantRow}>
        <i className="fa fa-plus me-1"></i> Add Implant
      </button>
    </div>

    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Implant</th>
            <th style={{ width: "120px" }}>Size / Spec</th>
            <th style={{ width: "80px" }}>Qty</th>
            <th style={{ width: "140px" }}>Batch / Lot No.</th>
            <th>Used By</th>
            <th style={{ width: "50px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {implantRows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.implantName}
                  onChange={(e) => handleImplantRowChange(row.id, "implantName", e.target.value)}
                  placeholder="Implant name"
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.sizeSpec}
                  onChange={(e) => handleImplantRowChange(row.id, "sizeSpec", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.qty}
                  onChange={(e) => handleImplantRowChange(row.id, "qty", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.batchLotNo}
                  onChange={(e) => handleImplantRowChange(row.id, "batchLotNo", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.usedBy}
                  onChange={(e) => handleImplantRowChange(row.id, "usedBy", e.target.value)}
                />
              </td>
              <td className="text-center">
                <button className="btn btn-outline-danger btnDel" title="Delete" onClick={() => handleRemoveImplantRow(row.id)}
                  disabled={implantRows.length === 1}><i class="icofont-trash"></i></button>
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
        onClick={() => handleSaveTab("Implants used")}
        disabled={Boolean(savingTab) || isSelectedPatientPacPending}
        title={isSelectedPatientPacPending ? "PAC Clearance is pending. Cannot save data." : ""}
      >
        Save Implants
        {savingTab === "implants" ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Saving Implants...
          </>
        ) : (
          <>
            <i className="fa fa-save me-1"></i> Save Implants
          </>
        )}
      </button>
    </div>
  </div>
);

export default ImplantsTab;
