import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";

// PortalDropdown Component - Fixed positioning like in IndentCreation / OpeningBalanceEntry
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4, // 4 px gap below the input
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      });
    };

    updatePosition();

    // Re-position on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const DischargeFromWard = () => {
  const [activeTab, setActiveTab] = useState("summary");

  // ---------- Dummy Patient Data (view only) ----------
  const patientDetails = {
    patientName: "Ramesh Kumar",
    uhid: "UHID-12345",
    ipNo: "IP-2026-001",
    age: "45 years",
    gender: "Male",
    admissionDate: "10-Apr-2026 10:30 AM",
    consultant: "Dr. Vinay Sharma",
    ward: "General Ward",
    bed: "Bed No. 12",
  };

  // ---------- Discharge Summary Form State ----------
  const [dischargeData, setDischargeData] = useState({
    finalDiagnosis: "",
    presentComplaints: "",
    historyPresentIllness: "",
    personalPastHistory: "",
    onExamination: "",
    procedureNotes: "",
    courseOfHospitalStay: "",
    // Medication on Discharge - now an array of objects
    medicationOnDischarge: [
      {
        medicineName: "",
        dosage: "",
        frequency: "OD",
        total: "", // auto-calculated, readonly
        route: "Oral",
        instruction: "",
        dropdownOpen: false,
      },
    ],
    adviseOnDischarge: "",
    followUp: "",
    billStatus: "FINAL",
    paymentStatus: "PAID",
    dischargeDateTime: "",
    patientCondition: "",
    dischargeReason: "",
    dischargeTo: "home",
    otherHospitalName: "",
  });

  // CKEditor refs for fields that still use the editor
  const historyPresentIllnessEditorRef = useRef(null);
  const personalPastHistoryEditorRef = useRef(null);
  const onExaminationEditorRef = useRef(null);
  const procedureNotesEditorRef = useRef(null);
  const courseOfHospitalStayEditorRef = useRef(null);
  const adviseOnDischargeEditorRef = useRef(null);
  const followUpEditorRef = useRef(null);

  // Toolbar container refs for CKEditor fields
  const historyPresentIllnessToolbarRef = useRef(null);
  const personalPastHistoryToolbarRef = useRef(null);
  const onExaminationToolbarRef = useRef(null);
  const procedureNotesToolbarRef = useRef(null);
  const courseOfHospitalStayToolbarRef = useRef(null);
  const adviseOnDischargeToolbarRef = useRef(null);
  const followUpToolbarRef = useRef(null);

  // Refs for portal-positioned medicine name dropdown inputs
  const medicineInputRefs = useRef({});

  // CKEditor configuration
  const editorConfig = {
    toolbar: {
      items: [
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "alignment",
        "indent",
        "outdent",
        "|",
        "undo",
        "redo",
      ],
      shouldNotGroupWhenFull: true,
    },
    alignment: {
      options: ["left", "center", "right", "justify"],
    },
    placeholder: "Enter text here...",
  };

  // Dropdown options
  const conditionOptions = ["Stable", "Improved", "Critical", "Palliative"];
  const reasonOptions = ["Recovered", "LAMA", "Death", "Referred"];

  // Frequency options (with multiplier for auto-total)
  const frequencyOptions = [
    { label: "OD (once daily)", value: "OD", multiplier: 1 },
    { label: "BD (twice daily)", value: "BD", multiplier: 2 },
    { label: "TDS (thrice daily)", value: "TDS", multiplier: 3 },
    { label: "QID (four times daily)", value: "QID", multiplier: 4 },
  ];

  const routeOptions = ["Oral", "IV", "IM", "SC", "Topical", "Inhalation"];

  // Sample medicine list for autocomplete
  const medicineList = [
    "Paracetamol",
    "Ceftriaxone",
    "Amoxicillin",
    "Metformin",
    "Omeprazole",
    "Losartan",
    "Atorvastatin",
    "Salbutamol",
    "Furosemide",
    "Warfarin",
  ];

  // ---------- Discharge Medications (tabular) ----------
  const [dischargeMeds, setDischargeMeds] = useState([
    {
      id: Date.now() + 1,
      medicineName: "Paracetamol",
      dose: "500 mg",
      duration: "5 days",
      instructions: "After meals",
    },
    {
      id: Date.now() + 2,
      medicineName: "Ceftriaxone",
      dose: "1 gm",
      duration: "3 days",
      instructions: "IV once daily",
    },
  ]);

  // ---------- Discharge History (dummy) ----------
  const [dischargeHistory] = useState([
    {
      id: 1,
      dischargeDate: "15-Mar-2026",
      dischargeType: "Routine",
      admittingDoctor: "Dr. Vinay Sharma",
      diagnosis: "Dengue Fever",
      summary: "Patient recovered well, discharged in stable condition.",
    },
    {
      id: 2,
      dischargeDate: "02-Feb-2026",
      dischargeType: "LAMA",
      admittingDoctor: "Dr. Priya Nair",
      diagnosis: "Pneumonia",
      summary: "Left against medical advice.",
    },
  ]);

  // CKEditor change handlers for editor fields
  const handleCKEditorChange = (fieldName) => (event, editor) => {
    const data = editor.getData();
    setDischargeData((prev) => ({ ...prev, [fieldName]: data }));
  };

  // Regular change handler for non-CKEditor fields (except medication array)
  const handleDischargeChange = (e) => {
    const { name, value } = e.target;
    setDischargeData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Medication on Discharge Handlers (table) ----------
  // Update a specific field of a medication row
  const handleMedicationRowChange = (index, field, value) => {
    setDischargeData((prev) => {
      const updated = [...prev.medicationOnDischarge];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-calculate total if dosage and frequency are present
      if (field === "dosage" || field === "frequency") {
        const dosage = parseFloat(updated[index].dosage) || 0;
        const freq = frequencyOptions.find(
          (f) => f.value === updated[index].frequency
        );
        const multiplier = freq ? freq.multiplier : 0;
        const total = dosage * multiplier;
        updated[index].total = total > 0 ? total.toFixed(2) : "";
      }
      return { ...prev, medicationOnDischarge: updated };
    });
  };

  // ---------- Medicine Name searchable dropdown handlers ----------
  const handleMedicineNameChange = (index, value) => {
    setDischargeData((prev) => {
      const updated = prev.medicationOnDischarge.map((med, i) =>
        i === index
          ? { ...med, medicineName: value, dropdownOpen: true }
          : { ...med, dropdownOpen: false }
      );
      return { ...prev, medicationOnDischarge: updated };
    });
  };

  const openMedicineDropdown = (index) => {
    setDischargeData((prev) => {
      const updated = prev.medicationOnDischarge.map((med, i) =>
        i === index ? { ...med, dropdownOpen: true } : med
      );
      return { ...prev, medicationOnDischarge: updated };
    });
  };

  const toggleMedicineDropdown = (index, open) => {
    setDischargeData((prev) => {
      const updated = prev.medicationOnDischarge.map((med, i) =>
        i === index ? { ...med, dropdownOpen: open } : med
      );
      return { ...prev, medicationOnDischarge: updated };
    });
  };

  const handleMedicineBlur = (index) => {
    setTimeout(() => toggleMedicineDropdown(index, false), 150);
  };

  const selectMedicine = (index, name) => {
    setDischargeData((prev) => {
      const updated = [...prev.medicationOnDischarge];
      updated[index] = { ...updated[index], medicineName: name, dropdownOpen: false };
      return { ...prev, medicationOnDischarge: updated };
    });
  };

  const getFilteredMedicines = (searchText) => {
    const query = (searchText || "").trim().toLowerCase();
    if (!query) return medicineList;
    return medicineList.filter((name) => name.toLowerCase().includes(query));
  };

  const addMedicationRow = () => {
    setDischargeData((prev) => ({
      ...prev,
      medicationOnDischarge: [
        ...prev.medicationOnDischarge,
        {
          medicineName: "",
          dosage: "",
          frequency: "OD",
          total: "",
          route: "Oral",
          instruction: "",
          dropdownOpen: false,
        },
      ],
    }));
  };

  const removeMedicationRow = (index) => {
    if (dischargeData.medicationOnDischarge.length === 1) {
      alert("At least one medication row is required");
      return;
    }
    setDischargeData((prev) => ({
      ...prev,
      medicationOnDischarge: prev.medicationOnDischarge.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ---------- Discharge Medications Handlers (separate tab) ----------
  const addMedicationRowTab = () => {
    const newRow = {
      id: Date.now(),
      medicineName: "",
      dose: "",
      duration: "",
      instructions: "",
    };
    setDischargeMeds([...dischargeMeds, newRow]);
  };

  const updateMedicationRowTab = (id, field, value) => {
    setDischargeMeds((prev) =>
      prev.map((med) => (med.id === id ? { ...med, [field]: value } : med))
    );
  };

  const deleteMedicationRowTab = (id) => {
    if (dischargeMeds.length === 1) {
      alert("At least one medication row is required");
      return;
    }
    setDischargeMeds((prev) => prev.filter((med) => med.id !== id));
  };

  const deleteAllMedicationsTab = () => {
    if (window.confirm("Are you sure you want to delete all medications?")) {
      setDischargeMeds([]);
    }
  };

  // ---------- Save Draft ----------
  const handleSaveDraft = () => {
    alert("Draft saved successfully!");
  };

  // ---------- Submit Discharge ----------
  const handleSubmitDischarge = () => {
    if (dischargeData.paymentStatus !== "PAID") {
      alert(
        "Payment is not completed against the FINAL bill. Please clear payment before discharge."
      );
      return;
    }

    const requiredFields = [
      "finalDiagnosis",
      "presentComplaints",
      "historyPresentIllness",
      "onExamination",
      "courseOfHospitalStay",
      "adviseOnDischarge",
      "dischargeDateTime",
      "patientCondition",
      "dischargeReason",
    ];

    const missing = requiredFields.filter(
      (field) =>
        !dischargeData[field] ||
        dischargeData[field] === "<p>&nbsp;</p>" ||
        dischargeData[field].trim() === ""
    );

    if (missing.length > 0) {
      alert(`Please fill all required fields: ${missing.join(", ")}`);
      return;
    }

    // Check medication on discharge rows: each row must have medicineName, dosage, frequency, route
    const invalidMedRows = dischargeData.medicationOnDischarge.some(
      (med) =>
        !med.medicineName.trim() ||
        !med.dosage ||
        parseFloat(med.dosage) <= 0 ||
        !med.frequency ||
        !med.route
    );

    if (invalidMedRows) {
      alert(
        "Please ensure each medication row has a valid Medicine Name, Dosage (>0), Frequency, and Route."
      );
      return;
    }

    if (
      dischargeData.dischargeTo === "otherHospital" &&
      !dischargeData.otherHospitalName.trim()
    ) {
      alert("Please enter the name of the hospital for transfer.");
      return;
    }

    alert(
      "Discharge completed! Bed will be released, patient status updated to DISCHARGED."
    );
  };

  const isSubmitDisabled = dischargeData.paymentStatus !== "PAID";

  // Cleanup CKEditor instances on unmount
  useEffect(() => {
    return () => {
      // CKEditor instances are destroyed automatically when component unmounts
    };
  }, []);

  return (
    <div>
      {/* ======================= DISCHARGE SUMMARY TAB ======================= */}
      {activeTab === "summary" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Discharge Summary</strong>
          </div>
          <div className="card-body">
            {/* Clinical Information */}
            <div className="row g-3">
              {/* Final Diagnosis - Regular Textarea */}
              <div className="col-md-4">
                <label className="form-label">
                  Final Diagnosis <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="finalDiagnosis"
                  value={dischargeData.finalDiagnosis}
                  onChange={handleDischargeChange}
                  placeholder="Enter final diagnosis"
                />
              </div>


              <div className="col-md-4">
                <label className="form-label">
                  Primary Diagnosis <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Enter Primary Diagnosis"
                />
              </div>

              {/* Present Complaints - Regular Textarea */}
              <div className="col-md-4">
                <label className="form-label">
                  Present Complaints <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="presentComplaints"
                  value={dischargeData.presentComplaints}
                  onChange={handleDischargeChange}
                  placeholder="Enter present complaints"
                />
              </div>

              {/* History of Present Illness - CKEditor */}
              <div className="col-12">
                <label className="form-label">
                  History of Present Illness{" "}
                  <span className="text-danger">*</span>
                </label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={historyPresentIllnessToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.historyPresentIllness}
                    config={editorConfig}
                    onReady={(editor) => {
                      historyPresentIllnessEditorRef.current = editor;
                      if (historyPresentIllnessToolbarRef.current) {
                        historyPresentIllnessToolbarRef.current.innerHTML = "";
                        historyPresentIllnessToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("historyPresentIllness")}
                  />
                </div>
              </div>

              {/* Personal / Past History - CKEditor */}
              <div className="col-12">
                <label className="form-label">Personal / Past History</label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={personalPastHistoryToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.personalPastHistory}
                    config={editorConfig}
                    onReady={(editor) => {
                      personalPastHistoryEditorRef.current = editor;
                      if (personalPastHistoryToolbarRef.current) {
                        personalPastHistoryToolbarRef.current.innerHTML = "";
                        personalPastHistoryToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("personalPastHistory")}
                  />
                </div>
              </div>

              {/* On Examination - CKEditor */}
              <div className="col-12">
                <label className="form-label">
                  On Examination <span className="text-danger">*</span>
                </label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={onExaminationToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.onExamination}
                    config={editorConfig}
                    onReady={(editor) => {
                      onExaminationEditorRef.current = editor;
                      if (onExaminationToolbarRef.current) {
                        onExaminationToolbarRef.current.innerHTML = "";
                        onExaminationToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("onExamination")}
                  />
                </div>
              </div>

              {/* Procedure Details - CKEditor */}
              <div className="col-12">
                <label className="form-label">
                  Procedure Details / Operative Notes
                </label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={procedureNotesToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.procedureNotes}
                    config={editorConfig}
                    onReady={(editor) => {
                      procedureNotesEditorRef.current = editor;
                      if (procedureNotesToolbarRef.current) {
                        procedureNotesToolbarRef.current.innerHTML = "";
                        procedureNotesToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("procedureNotes")}
                  />
                </div>
              </div>

              {/* Course of Hospital Stay - CKEditor */}
              <div className="col-12">
                <label className="form-label">
                  Course of Hospital Stay{" "}
                  <span className="text-danger">*</span>
                </label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={courseOfHospitalStayToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.courseOfHospitalStay}
                    config={editorConfig}
                    onReady={(editor) => {
                      courseOfHospitalStayEditorRef.current = editor;
                      if (courseOfHospitalStayToolbarRef.current) {
                        courseOfHospitalStayToolbarRef.current.innerHTML = "";
                        courseOfHospitalStayToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("courseOfHospitalStay")}
                  />
                </div>
              </div>

              {/* Medication on Discharge - Editable Table */}
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">
                    Medication on Discharge{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={addMedicationRow}
                  >
                    <i className="fa fa-plus me-1"></i> Add Medication
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: "280px                           " }}>Medicine Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Total </th>
                        <th>Route</th>
                        <th>Instruction</th>
                        <th style={{ width: "80px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dischargeData.medicationOnDischarge.map((med, index) => {
                        const filteredMedicines = getFilteredMedicines(
                          med.medicineName
                        );
                        return (
                          <tr key={index}>
                            <td
                              className="position-relative"
                              style={{ minWidth: "220px" }}
                            >
                              <input
                                ref={(el) => {
                                  medicineInputRefs.current[index] = el;
                                }}
                                type="text"
                                className="form-control form-control-sm"
                                autoComplete="off"
                                value={med.medicineName}
                                onChange={(e) =>
                                  handleMedicineNameChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                onFocus={() => openMedicineDropdown(index)}
                                onBlur={() => handleMedicineBlur(index)}
                                placeholder="Type medicine"
                              />
                              <PortalDropdown
                                anchorRef={{
                                  current: medicineInputRefs.current[index],
                                }}
                                show={
                                  med.dropdownOpen &&
                                  filteredMedicines.length > 0
                                }
                              >
                                <ul className="list-group mb-0">
                                  {filteredMedicines.map((name) => (
                                    <li
                                      key={name}
                                      className="list-group-item list-group-item-action"
                                      style={{ cursor: "pointer" }}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() =>
                                        selectMedicine(index, name)
                                      }
                                    >
                                      {name}
                                    </li>
                                  ))}
                                </ul>
                              </PortalDropdown>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={med.dosage}
                                onChange={(e) =>
                                  handleMedicationRowChange(
                                    index,
                                    "dosage",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 500"
                                min="0"
                                step="any"
                              />
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={med.frequency}
                                onChange={(e) =>
                                  handleMedicationRowChange(
                                    index,
                                    "frequency",
                                    e.target.value
                                  )
                                }
                              >
                                {frequencyOptions.map((f) => (
                                  <option key={f.value} value={f.value}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm bg-light"
                                value={med.total || "Auto"}
                                readOnly
                                style={{ cursor: "default" }}
                              />
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={med.route}
                                onChange={(e) =>
                                  handleMedicationRowChange(
                                    index,
                                    "route",
                                    e.target.value
                                  )
                                }
                              >
                                {routeOptions.map((route) => (
                                  <option key={route} value={route}>
                                    {route}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={med.instruction}
                                onChange={(e) =>
                                  handleMedicationRowChange(
                                    index,
                                    "instruction",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., After meals"
                              />
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => removeMedicationRow(index)}
                                disabled={
                                  dischargeData.medicationOnDischarge
                                    .length === 1
                                }
                                title="Remove this medication"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advise on Discharge - CKEditor */}
              <div className="col-12">
                <label className="form-label">
                  Advise on Discharge <span className="text-danger">*</span>
                </label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={adviseOnDischargeToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.adviseOnDischarge}
                    config={editorConfig}
                    onReady={(editor) => {
                      adviseOnDischargeEditorRef.current = editor;
                      if (adviseOnDischargeToolbarRef.current) {
                        adviseOnDischargeToolbarRef.current.innerHTML = "";
                        adviseOnDischargeToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("adviseOnDischarge")}
                  />
                </div>
              </div>

              {/* Follow Up - CKEditor */}
              <div className="col-12">
                <label className="form-label">Follow Up</label>
                <div
                  className="form-label"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    padding: "8px",
                  }}
                >
                  <div ref={followUpToolbarRef}></div>
                  <CKEditor
                    editor={DecoupledEditor}
                    data={dischargeData.followUp}
                    config={editorConfig}
                    onReady={(editor) => {
                      followUpEditorRef.current = editor;
                      if (followUpToolbarRef.current) {
                        followUpToolbarRef.current.innerHTML = "";
                        followUpToolbarRef.current.appendChild(
                          editor.ui.view.toolbar.element
                        );
                      }
                    }}
                    onChange={handleCKEditorChange("followUp")}
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="card mt-3 mb-3 bg-light">
              <div className="card-header bg-secondary text-white py-1">
                <strong>Payment Details</strong>
              </div>
              <div className="card-body py-2">
                <div className="row">
                  <div className="col-md-4">
                    <strong>Bill Status:</strong> {dischargeData.billStatus}
                  </div>
                  <div className="col-md-4">
                    <strong>Payment Status:</strong>{" "}
                    <span
                      className={
                        dischargeData.paymentStatus === "PAID"
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      {dischargeData.paymentStatus}
                    </span>
                  </div>
                  <div className="col-md-4">
                    {dischargeData.paymentStatus !== "PAID" && (
                      <small className="text-danger">
                        (Payment required before discharge)
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Discharge Details */}
            <div className="card mt-3">
              <div className="card-header bg-secondary text-white py-1">
                <strong>Discharge Details</strong>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Discharge Date & Time{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="dischargeDateTime"
                      value={dischargeData.dischargeDateTime}
                      onChange={handleDischargeChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Patient Condition on Discharge{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="patientCondition"
                      value={dischargeData.patientCondition}
                      onChange={handleDischargeChange}
                    >
                      <option value="">Select condition</option>
                      {conditionOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Discharge Reason <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="dischargeReason"
                      value={dischargeData.dischargeReason}
                      onChange={handleDischargeChange}
                    >
                      <option value="">Select reason</option>
                      {reasonOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Discharge to:</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="dischargeTo"
                          value="home"
                          checked={dischargeData.dischargeTo === "home"}
                          onChange={handleDischargeChange}
                        />
                        <label className="form-check-label">Home</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="dischargeTo"
                          value="otherHospital"
                          checked={
                            dischargeData.dischargeTo === "otherHospital"
                          }
                          onChange={handleDischargeChange}
                        />
                        <label className="form-check-label">
                          Other Hospital
                        </label>
                      </div>
                    </div>
                  </div>
                  {dischargeData.dischargeTo === "otherHospital" && (
                    <div className="col-md-6">
                      <label className="form-label">
                        Hospital Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="otherHospitalName"
                        value={dischargeData.otherHospitalName}
                        onChange={handleDischargeChange}
                        placeholder="Enter hospital name"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between mt-4">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSaveDraft}
              >
                <i className="fa fa-save me-1"></i> Save (Draft)
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleSubmitDischarge}
                disabled={isSubmitDisabled}
                title={isSubmitDisabled ? "Payment not completed" : ""}
              >
                Submit for Discharge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= DISCHARGE MEDICATIONS TAB ======================= */}
      {activeTab === "medications" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Discharge Medications</strong>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-danger"
                onClick={deleteAllMedicationsTab}
                title="Delete all medications"
              >
                <i className="fa fa-trash me-1"></i> Delete All
              </button>
              <button
                className="btn btn-sm btn-light"
                onClick={addMedicationRowTab}
              >
                + Add Medication
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            {dischargeMeds.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted mb-3">No medications added yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addMedicationRowTab}
                >
                  + Add Medication
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-bordered mb-0 align-middle"
                  style={{ fontSize: "0.85rem" }}
                >
                  <thead className="table-light">
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dose</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                      <th style={{ width: "100px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dischargeMeds.map((med) => (
                      <tr key={med.id}>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={med.medicineName}
                            onChange={(e) =>
                              updateMedicationRowTab(
                                med.id,
                                "medicineName",
                                e.target.value
                              )
                            }
                            placeholder="Medicine name"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={med.dose}
                            onChange={(e) =>
                              updateMedicationRowTab(
                                med.id,
                                "dose",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 500 mg"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={med.duration}
                            onChange={(e) =>
                              updateMedicationRowTab(
                                med.id,
                                "duration",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 5 days"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={med.instructions}
                            onChange={(e) =>
                              updateMedicationRowTab(
                                med.id,
                                "instructions",
                                e.target.value
                              )
                            }
                            placeholder="e.g., After meals"
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteMedicationRowTab(med.id)}
                            title="Delete this medication"
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {dischargeMeds.length > 0 && (
            <div className="card-footer d-flex justify-content-end">
              <button
                className="btn btn-success btn-sm"
                onClick={() => alert("Discharge medications saved (draft)")}
              >
                Save Medications
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================= DISCHARGE HISTORY TAB ======================= */}
      {activeTab === "history" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Previous Discharge History</strong>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table
                className="table table-bordered mb-0 align-middle"
                style={{ fontSize: "0.85rem" }}
              >
                <thead className="table-light">
                  <tr>
                    <th>Discharge Date</th>
                    <th>Type</th>
                    <th>Admitting Doctor</th>
                    <th>Diagnosis</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {dischargeHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.dischargeDate}</td>
                      <td>{record.dischargeType}</td>
                      <td>{record.admittingDoctor}</td>
                      <td>{record.diagnosis}</td>
                      <td>{record.summary}</td>
                    </tr>
                  ))}
                  {dischargeHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No previous discharge records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeFromWard;