import React from "react";

const DrugTabOverlays = ({
  activeDrugDropdownRowId,
  drugDropdownOptions,
  drugDropdownRect,
  drugTemplateFilterSurgeryId,
  drugTemplateForm,
  drugTemplateView,
  drugTemplates,
  expandedDrugTemplateId,
  fetchActiveDrugTemplates,
  getPatientSurgeryList,
  handleAddTemplateDrugRow,
  handleApplyDrugTemplate,
  handleDeleteDrugTemplate,
  handleDrugDropdownScroll,
  handleEditDrugTemplate,
  handleNewDrugTemplate,
  handleRemoveTemplateDrugRow,
  handleSaveDrugTemplate,
  handleSelectDrugDropdown,
  handleSelectTemplateDrug,
  handleTemplateDrugInputChange,
  handleTemplateDrugRowChange,
  loadingDrugDropdown,
  loadingDrugTemplates,
  savingDrugTemplate,
  setDrugTemplateFilterSurgeryId,
  setDrugTemplateForm,
  setDrugTemplateView,
  setExpandedDrugTemplateId,
  setShowDrugTemplateModal,
  setShowTemplateDrugDropdown,
  setTemplateDrugDropdownRect,
  setTemplateDrugSearchActiveIdx,
  showDrugDropdown,
  showDrugTemplateModal,
  showTemplateDrugDropdown,
  templateDrugDropdownRect,
  templateDrugInputRefs,
  templateDrugSearchActiveIdx,
}) => (
  <>
    {showDrugDropdown && activeDrugDropdownRowId && drugDropdownRect && (
      <ul
        className="list-group position-fixed shadow-lg"
        style={{
          zIndex: 9999,
          maxHeight: "220px",
          overflowY: "auto",
          top: drugDropdownRect.top,
          left: drugDropdownRect.left,
          width: Math.max(drugDropdownRect.width, 320),
          backgroundColor: "#fff",
          border: "1px solid #ced4da",
        }}
        onScroll={handleDrugDropdownScroll}
      >
        {drugDropdownOptions.map((item) => (
          <li
            key={item.itemId || item.pvmsNo}
            className="list-group-item list-group-item-action py-2 px-2"
            style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectDrugDropdown(activeDrugDropdownRowId, item);
            }}
          >
            <div className="fw-bold text-primary">{item.nomenclature}</div>
            <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: "11px" }}>
              <span>Code: {item.pvmsNo || "-"} | Class: {item.itemClassName || "-"}</span>
              <span>
                Unit: <strong className="text-dark">{item.dispUnitName || item.unitAuName || "-"}</strong> | Stock:{" "}
                <strong className={(item.storestocks || 0) > 0 ? "text-success" : "text-danger"}>
                  {item.storestocks ?? 0}
                </strong>
              </span>
            </div>
          </li>
        ))}
        {loadingDrugDropdown && (
          <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
            <span className="spinner-border spinner-border-sm me-1 text-primary"></span>
            Loading more drugs...
          </li>
        )}
        {!loadingDrugDropdown && drugDropdownOptions.length === 0 && (
          <li className="list-group-item py-2 text-center text-muted" style={{ fontSize: "12px" }}>
            No drugs found
          </li>
        )}
      </ul>
    )}
    {showTemplateDrugDropdown && templateDrugSearchActiveIdx !== null && templateDrugDropdownRect && (
      <ul
        className="list-group position-fixed shadow-lg"
        style={{
          zIndex: 1060,
          maxHeight: "200px",
          overflowY: "auto",
          top: templateDrugDropdownRect.top,
          left: templateDrugDropdownRect.left,
          width: Math.max(templateDrugDropdownRect.width, 320),
          backgroundColor: "#fff",
          border: "1px solid #ced4da",
        }}
        onScroll={handleDrugDropdownScroll}
      >
        {drugDropdownOptions.map((item) => (
          <li
            key={item.itemId || item.pvmsNo}
            className="list-group-item list-group-item-action py-1 px-2"
            style={{ cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #f0f0f0" }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectTemplateDrug(templateDrugSearchActiveIdx, item);
            }}
          >
            <div className="fw-bold text-primary">{item.nomenclature}</div>
            <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10.5px" }}>
              <span>Code: {item.pvmsNo || "-"}</span>
              <span>Unit: {item.dispUnitName || item.unitAuName || "-"} | Stock: {item.storestocks ?? 0}</span>
            </div>
          </li>
        ))}
        {loadingDrugDropdown && (
          <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
            Loading more...
          </li>
        )}
        {!loadingDrugDropdown && drugDropdownOptions.length === 0 && (
          <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "11px" }}>
            No drugs found
          </li>
        )}
      </ul>
    )}
    {showDrugTemplateModal && (
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content shadow">
            <div className="modal-header bg-primary text-white py-2">
              <h6 className="modal-title fw-bold">
                <i className="fa fa-folder-open me-2"></i>
                Drug Templates by Surgery
              </h6>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowDrugTemplateModal(false)}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              {drugTemplateView === "list" ? (
                <div>
                  {/* Header info bar with assigned surgery of current patient */}
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 p-2 bg-light border rounded">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold small text-dark">
                        Patient Assigned Surgery:
                      </span>
                      <select
                        className="form-select form-select-sm"
                        style={{ minWidth: "220px" }}
                        value={drugTemplateFilterSurgeryId}
                        onChange={(e) => {
                          const sId = Number(e.target.value);
                          setDrugTemplateFilterSurgeryId(sId);
                          fetchActiveDrugTemplates(sId);
                        }}
                      >
                        {getPatientSurgeryList().map((s) => (
                          <option key={s.surgeryId} value={s.surgeryId}>
                            {s.surgeryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={handleNewDrugTemplate}
                    >
                      <i className="fa fa-plus me-1"></i> Create New Template
                    </button>
                  </div>

                  {/* Template Headers Table (Click row to expand details) */}
                  <div className="table-responsive border rounded">
                    <table className="table table-hover table-bordered table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "35px" }} className="text-center"></th>
                          <th style={{ width: "45px" }} className="text-center">#</th>
                          <th>Template Name</th>
                          <th style={{ minWidth: "180px" }}>Assigned Surgery</th>
                          <th style={{ width: "110px" }} className="text-center">Meds Count</th>
                          <th style={{ width: "210px" }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingDrugTemplates ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                              Loading active drug templates...
                            </td>
                          </tr>
                        ) : (
                          drugTemplates.map((template, idx) => {
                            const isExpanded = expandedDrugTemplateId === (template.id || template.templateId);
                            return (
                              <React.Fragment key={template.id || template.templateId || idx}>
                                <tr
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isExpanded ? "#f0f7ff" : "inherit",
                                  }}
                                  onClick={() =>
                                    setExpandedDrugTemplateId((prev) =>
                                      prev === (template.id || template.templateId)
                                        ? null
                                        : (template.id || template.templateId)
                                    )
                                  }
                                  title="Click row to view/hide medicine details"
                                >
                                  <td className="text-center text-muted">
                                    <i
                                      className={`fa fa-chevron-${isExpanded ? "down text-primary" : "right"
                                        }`}
                                    ></i>
                                  </td>
                                  <td className="text-center text-muted">{idx + 1}</td>
                                  <td>
                                    <span className="fw-semibold text-primary">
                                      {template.templateName}
                                    </span>
                                    {template.description && (
                                      <div
                                        className="text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        {template.description}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border">
                                      {template.surgeryName || "Assigned Surgery"}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge bg-info text-dark">
                                      {template.items?.length || 0} Meds
                                    </span>
                                  </td>
                                  <td
                                    className="text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success px-2"
                                        title="Apply template to surgery drugs (appends medicines)"
                                        onClick={() => handleApplyDrugTemplate(template)}
                                      >
                                        <i className="fa fa-plus me-1"></i> Apply
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        title="Edit template"
                                        onClick={() => handleEditDrugTemplate(template)}
                                      >
                                        <i className="fa fa-pencil"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        title="Delete template"
                                        onClick={() => handleDeleteDrugTemplate(template.id || template.templateId)}
                                      >
                                        <i className="fa fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Detail View */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="6" className="bg-light p-3">
                                      <div className="card shadow-sm border">
                                        <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                          <div>
                                            <strong className="text-dark me-2">
                                              {template.templateName}
                                            </strong>
                                            <span className="badge bg-primary me-2">
                                              Surgery: {template.surgeryName}
                                            </span>
                                            {template.description && (
                                              <small className="text-muted fst-italic">
                                                ({template.description})
                                              </small>
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-success px-3"
                                            onClick={() => handleApplyDrugTemplate(template)}
                                          >
                                            <i className="fa fa-plus me-1"></i> Apply This Template
                                          </button>
                                        </div>
                                        <div className="card-body p-0">
                                          <table className="table table-sm table-striped mb-0 align-middle">
                                            <thead className="table-light">
                                              <tr>
                                                <th style={{ width: "50px" }} className="text-center">#</th>
                                                <th>Medicine / Drug Name</th>
                                                <th style={{ width: "100px" }}>Qty</th>
                                                <th style={{ width: "120px" }}>Unit</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {template.items?.map((it, itemIdx) => (
                                                <tr key={itemIdx}>
                                                  <td className="text-center text-muted">
                                                    {itemIdx + 1}
                                                  </td>
                                                  <td className="fw-semibold text-dark">
                                                    {it.drugName || it.itemName}
                                                  </td>
                                                  <td>{it.qty || it.plannedQuantity}</td>
                                                  <td>
                                                    <span className="badge bg-light text-dark border">
                                                      {it.unit || it.unitName || "No"}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                        {!loadingDrugTemplates && drugTemplates.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                              No drug templates found for this surgery. Click "Create New Template" to add one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      {drugTemplateForm.id ? "Edit Drug Template" : "Create New Drug Template"}
                    </h6>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setDrugTemplateView("list")}
                    >
                      <i className="fa fa-arrow-left me-1"></i> Back to Templates
                    </button>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Template Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Heart Transplant Intra-Op Kit"
                        value={drugTemplateForm.templateName}
                        onChange={(e) =>
                          setDrugTemplateForm({ ...drugTemplateForm, templateName: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Assigned Patient Surgery *
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={drugTemplateForm.surgeryId}
                        onChange={(e) => {
                          const sId = Number(e.target.value);
                          const sObj = getPatientSurgeryList().find((s) => Number(s.surgeryId) === sId);
                          setDrugTemplateForm({
                            ...drugTemplateForm,
                            surgeryId: sId,
                            surgeryName: sObj?.surgeryName || drugTemplateForm.surgeryName,
                          });
                        }}
                      >
                        {getPatientSurgeryList().map((s) => (
                          <option key={s.surgeryId} value={s.surgeryId}>
                            {s.surgeryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small">Description / Notes</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Optional notes about when to use this template..."
                        value={drugTemplateForm.description}
                        onChange={(e) =>
                          setDrugTemplateForm({ ...drugTemplateForm, description: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold small">Template Medicines</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={handleAddTemplateDrugRow}
                    >
                      <i className="fa fa-plus me-1"></i> Add Medicine Row
                    </button>
                  </div>

                  <div className="table-responsive border rounded mb-3">
                    <table className="table table-bordered table-sm mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ minWidth: "260px" }}>Drug Name *</th>
                          <th style={{ width: "90px" }}>Qty *</th>
                          <th style={{ width: "130px" }}>Unit</th>
                          <th style={{ width: "50px" }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drugTemplateForm.items.map((it, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                ref={(el) => (templateDrugInputRefs.current[idx] = el)}
                                className="form-control form-control-sm"
                                value={it.drugName}
                                placeholder="Type drug name to search..."
                                autoComplete="off"
                                onChange={(e) => handleTemplateDrugInputChange(idx, e.target.value)}
                                onFocus={() => {
                                  setTemplateDrugSearchActiveIdx(idx);
                                  const el = templateDrugInputRefs.current[idx];
                                  if (el) {
                                    const rect = el.getBoundingClientRect();
                                    setTemplateDrugDropdownRect({
                                      top: rect.bottom,
                                      left: rect.left,
                                      width: rect.width,
                                    });
                                  }
                                  if (it.drugName && it.drugName.trim() && drugDropdownOptions.length > 0) {
                                    setShowTemplateDrugDropdown(true);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    if (templateDrugSearchActiveIdx === idx) {
                                      setShowTemplateDrugDropdown(false);
                                    }
                                  }, 250);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={it.qty}
                                onChange={(e) => handleTemplateDrugRowChange(idx, "qty", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm bg-light"
                                value={it.unit || "No"}
                                readOnly
                                style={{ backgroundColor: "#e9ecef" }}
                                title="Unit is set automatically from selected medicine"
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemoveTemplateDrugRow(idx)}
                                disabled={drugTemplateForm.items.length === 1}
                              >
                                <i className="icofont-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDrugTemplateView("list")}
                      disabled={savingDrugTemplate}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveDrugTemplate}
                      disabled={savingDrugTemplate}
                    >
                      {savingDrugTemplate ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {drugTemplateForm.id || drugTemplateForm.templateId
                            ? "Updating Template..."
                            : "Saving Template..."}
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save me-1"></i>{" "}
                          {drugTemplateForm.id || drugTemplateForm.templateId
                            ? "Update Template"
                            : "Save Template"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);

export default DrugTabOverlays;
