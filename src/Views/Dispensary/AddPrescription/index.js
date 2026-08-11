import { useState } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";

const AddPrescription = () => {
  // ----- State – only patient fields: patientName, mobileNo -----
  const [formData, setFormData] = useState({
    patientName: "",
    mobileNo: "",
  });

  // ----- State for Medicine Grid -----
  const [detailEntries, setDetailEntries] = useState([
    {
      id: Date.now(),
      sNo: 1,
      medicineName: "",
      dosage: "",
      frequency: "",
      days: "",
      prescribedQty: "",
      batchNo: "",
      expiryDate: "",
      issueQty: "",
      totalStock: "",
    },
  ]);

  // ----- UI States -----
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // ----- Helper Functions -----
  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const updateDetailEntry = (id, field, value) => {
    const updatedEntries = detailEntries.map((entry) => {
      if (entry.id === id) return { ...entry, [field]: value };
      return entry;
    });
    setDetailEntries(updatedEntries);
  };

  const addMedicineRow = () => {
    const newEntry = {
      id: Date.now(),
      sNo: detailEntries.length + 1,
      medicineName: "",
      dosage: "",
      frequency: "",
      days: "",
      prescribedQty: "",
      batchNo: "",
      expiryDate: "",
      issueQty: "",
      totalStock: "",
    };
    setDetailEntries([...detailEntries, newEntry]);
  };

  const deleteMedicineRow = (id) => {
    if (detailEntries.length <= 1) {
      showPopup("At least one medicine row is required.", "warning");
      return;
    }
    setDetailEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ----- Submit -----
  const handleSubmit = () => {
    // Required: patientName and mobileNo
    if (!formData.patientName?.trim()) {
      showPopup("Please enter patient name.", "warning");
      return;
    }
    if (!formData.mobileNo?.trim()) {
      showPopup("Please enter mobile number.", "warning");
      return;
    }
    if (detailEntries.some((e) => !e.medicineName.trim())) {
      showPopup("Please enter medicine names for all rows.", "warning");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      console.log("Submitting:", { ...formData, medicines: detailEntries });
      showPopup("Prescription saved successfully!", "success", resetForm);
    } catch (error) {
      showPopup("Failed to save.", "error");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: "",
      mobileNo: "",
    });
    setDetailEntries([
      {
        id: Date.now(),
        sNo: 1,
        medicineName: "",
        dosage: "",
        frequency: "",
        days: "",
        prescribedQty: "",
        batchNo: "",
        expiryDate: "",
        issueQty: "",
        totalStock: "",
      },
    ]);
  };

  // ----- Render -----
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Add New Prescription</h4>
            </div>
            <div className="card-body">
              {/* ----- Patient Details (only two fields) ----- */}
              <div className="card shadow mb-4">
                <div className="card-header py-3 bg-light">
                  <h6 className="mb-0 fw-bold">Patient Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Patient Name */}
                    <div className="form-group col-md-4">
                      <label>Patient Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Full name"
                        value={formData.patientName}
                        onChange={(e) => handleFormChange("patientName", e.target.value)}
                      />
                    </div>

                    {/* Mobile No */}
                    <div className="form-group col-md-4">
                      <label>Mobile No. <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mobile number"
                        value={formData.mobileNo}
                        onChange={(e) => handleFormChange("mobileNo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ----- Medicine Grid (unchanged) ----- */}
              <h6 className="fw-bold mt-4">Medicine Details</h6>
              <div className="d-flex justify-content-end mb-2">
                <button type="button" className="btn btn-success" onClick={addMedicineRow}>
                  Add Medicine +
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                    <tr>
                      <th className="text-center" style={{ width: "60px" }}>S.No</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Days</th>
                      <th>Prescribed Qty</th>
                      <th>Batch No.</th>
                      <th>Expiry Date</th>
                      <th>Issue Qty</th>
                      <th>Total Stock</th>
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.medicineName}
                            onChange={(e) => updateDetailEntry(entry.id, "medicineName", e.target.value)}
                            style={{ minWidth: "150px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.dosage}
                            onChange={(e) => updateDetailEntry(entry.id, "dosage", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.frequency}
                            onChange={(e) => updateDetailEntry(entry.id, "frequency", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.days}
                            onChange={(e) => updateDetailEntry(entry.id, "days", e.target.value)}
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.prescribedQty}
                            onChange={(e) => updateDetailEntry(entry.id, "prescribedQty", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.batchNo}
                            onChange={(e) => updateDetailEntry(entry.id, "batchNo", e.target.value)}
                            style={{ width: "110px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control"
                            value={entry.expiryDate?.split("T")[0] || ""}
                            onChange={(e) => updateDetailEntry(entry.id, "expiryDate", e.target.value)}
                            style={{ minWidth: "130px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.issueQty}
                            onChange={(e) => updateDetailEntry(entry.id, "issueQty", e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.totalStock}
                            onChange={(e) => updateDetailEntry(entry.id, "totalStock", e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteMedicineRow(entry.id)}
                            disabled={detailEntries.length === 1}
                          >
                            <i className="icofont-close"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {detailEntries.length === 0 && (
                      <tr><td colSpan="11" className="text-center py-4 text-muted">No medicines added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ----- Buttons ----- */}
              <div className="d-flex justify-content-end mt-4">
                <button type="button" className="btn btn-success me-2" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Prescription"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPrescription;