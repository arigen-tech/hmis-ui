import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// Dummy JSON data (to be replaced by API response later)
const DUMMY_PENDING_PRESCRIPTION_DATA = [
  {
    prescriptionId: 101,
    prescriptionNo: "PR0000215",
    prescriptionDate: "2026-08-05T09:30:00",
    opdVisitNo: "OPD000891",
    patientName: "Aarav Sharma",
    uhid: "UH00023456",
    mobileNo: "9876543210",
    ageGender: "45/M",
    department: "Cardiology",
    doctorName: "Dr. Verma",
    status: "N"
  },
  {
    prescriptionId: 102,
    prescriptionNo: "PR0000216",
    prescriptionDate: "2026-08-05T10:15:00",
    opdVisitNo: "OPD000892",
    patientName: "Priya Patel",
    uhid: "UH00023457",
    mobileNo: "9765432109",
    ageGender: "32/F",
    department: "Gynecology",
    doctorName: "Dr. Singh",
    status: "N"
  },
  {
    prescriptionId: 103,
    prescriptionNo: "PR0000217",
    prescriptionDate: "2026-08-05T11:00:00",
    opdVisitNo: "OPD000893",
    patientName: "Rohit Kumar",
    uhid: "UH00023458",
    mobileNo: "9654321098",
    ageGender: "28/M",
    department: "Orthopedics",
    doctorName: "Dr. Gupta",
    status: "N"
  },
  {
    prescriptionId: 104,
    prescriptionNo: "PR0000218",
    prescriptionDate: "2026-08-05T11:45:00",
    opdVisitNo: "OPD000894",
    patientName: "Sneha Reddy",
    uhid: "UH00023459",
    mobileNo: "9543210987",
    ageGender: "39/F",
    department: "Dermatology",
    doctorName: "Dr. Joshi",
    status: "N"
  },
  {
    prescriptionId: 105,
    prescriptionNo: "PR0000219",
    prescriptionDate: "2026-08-05T12:30:00",
    opdVisitNo: "OPD000895",
    patientName: "Vikram Singh",
    uhid: "UH00023460",
    mobileNo: "9432109876",
    ageGender: "55/M",
    department: "Neurology",
    doctorName: "Dr. Rao",
    status: "N"
  },
  {
    prescriptionId: 106,
    prescriptionNo: "PR0000220",
    prescriptionDate: "2026-08-05T13:15:00",
    opdVisitNo: "OPD000896",
    patientName: "Ananya Iyer",
    uhid: "UH00023461",
    mobileNo: "9321098765",
    ageGender: "24/F",
    department: "ENT",
    doctorName: "Dr. Nair",
    status: "N"
  }
];

// Dummy medicine details keyed by prescriptionId (to be replaced by API response later)
const DUMMY_MEDICINE_DETAILS = {
  101: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Aspirin",
      dosage: "100 mg",
      frequency: "1-0-1",
      days: 7,
      prescribedQty: 14,
      batchNo: "B240101",
      expiryDate: "2027-11-30",
      issueQty: 14,
      totalStock: 500
    },
    {
      id: 2,
      sNo: 2,
      medicineName: "Atorvastatin",
      dosage: "20 mg",
      frequency: "0-0-1",
      days: 30,
      prescribedQty: 30,
      batchNo: "B240102",
      expiryDate: "2028-01-31",
      issueQty: 30,
      totalStock: 200
    }
  ],
  102: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Folic Acid",
      dosage: "5 mg",
      frequency: "1-0-0",
      days: 90,
      prescribedQty: 90,
      batchNo: "B240103",
      expiryDate: "2027-09-30",
      issueQty: 90,
      totalStock: 600
    },
    {
      id: 2,
      sNo: 2,
      medicineName: "Iron Supplement",
      dosage: "100 mg",
      frequency: "1-0-1",
      days: 30,
      prescribedQty: 60,
      batchNo: "B240104",
      expiryDate: "2027-12-15",
      issueQty: 60,
      totalStock: 300
    }
  ],
  103: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Ibuprofen",
      dosage: "400 mg",
      frequency: "1-1-1",
      days: 5,
      prescribedQty: 15,
      batchNo: "B240105",
      expiryDate: "2027-08-31",
      issueQty: 15,
      totalStock: 250
    },
    {
      id: 2,
      sNo: 2,
      medicineName: "Paracetamol",
      dosage: "500 mg",
      frequency: "1-0-1",
      days: 5,
      prescribedQty: 10,
      batchNo: "B240106",
      expiryDate: "2027-10-31",
      issueQty: 10,
      totalStock: 450
    },
    {
      id: 3,
      sNo: 3,
      medicineName: "Diclofenac Gel",
      dosage: "2%",
      frequency: "2-0-2",
      days: 7,
      prescribedQty: 1,
      batchNo: "B240107",
      expiryDate: "2028-02-28",
      issueQty: 1,
      totalStock: 100
    }
  ],
  104: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Cetirizine",
      dosage: "10 mg",
      frequency: "0-0-1",
      days: 14,
      prescribedQty: 14,
      batchNo: "B240108",
      expiryDate: "2027-07-31",
      issueQty: 14,
      totalStock: 350
    },
    {
      id: 2,
      sNo: 2,
      medicineName: "Mometasone Cream",
      dosage: "0.1%",
      frequency: "1-0-1",
      days: 14,
      prescribedQty: 1,
      batchNo: "B240109",
      expiryDate: "2028-03-15",
      issueQty: 1,
      totalStock: 80
    }
  ],
  105: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Levetiracetam",
      dosage: "500 mg",
      frequency: "1-0-1",
      days: 30,
      prescribedQty: 60,
      batchNo: "B240110",
      expiryDate: "2028-05-31",
      issueQty: 60,
      totalStock: 150
    }
  ],
  106: [
    {
      id: 1,
      sNo: 1,
      medicineName: "Amoxicillin",
      dosage: "500 mg",
      frequency: "1-1-1",
      days: 7,
      prescribedQty: 21,
      batchNo: "B240111",
      expiryDate: "2027-12-31",
      issueQty: 21,
      totalStock: 500
    },
    {
      id: 2,
      sNo: 2,
      medicineName: "Clavulanic Acid",
      dosage: "125 mg",
      frequency: "1-1-1",
      days: 7,
      prescribedQty: 21,
      batchNo: "B240112",
      expiryDate: "2027-11-15",
      issueQty: 21,
      totalStock: 300
    }
  ]
};

// Dummy registered patients lookup (to be replaced by API response later)
const DUMMY_REGISTERED_PATIENTS = [
  { uhid: "UH00023456", patientName: "Aarav Sharma", ageGender: "45/M", mobileNo: "9876543210" },
  { uhid: "UH00023457", patientName: "Priya Patel", ageGender: "32/F", mobileNo: "9765432109" },
  { uhid: "UH00023458", patientName: "Rohit Kumar", ageGender: "28/M", mobileNo: "9654321098" },
  { uhid: "UH00023459", patientName: "Sneha Reddy", ageGender: "39/F", mobileNo: "9543210987" },
  { uhid: "UH00023460", patientName: "Vikram Singh", ageGender: "55/M", mobileNo: "9432109876" },
  { uhid: "UH00023461", patientName: "Ananya Iyer", ageGender: "24/F", mobileNo: "9321098765" }
];

const PrescriptionList = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const [pendingPrescriptionData, setPendingPrescriptionData] = useState([]);
  const [detailEntries, setDetailEntries] = useState([]);

  const [patientName, setPatientName] = useState("");
  const [mobileNo, setMobileNo] = useState("");

  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  // Patient info shown/editable on the Issue view, and UHID search for registered patients
  const [patientInfo, setPatientInfo] = useState(null);
  const [searchUhid, setSearchUhid] = useState("");
  const [isPatientSearching, setIsPatientSearching] = useState(false);

  useEffect(() => {
    fetchPendingPrescriptionData();
  }, []);

  // Fetch Pending Prescription List (dummy JSON for now, only Status = 'N', oldest first)
  const fetchPendingPrescriptionData = () => {
    setLoading(true);
    try {
      const sortedData = [...DUMMY_PENDING_PRESCRIPTION_DATA]
        .filter((item) => item.status?.toUpperCase() === "N")
        .sort((a, b) => new Date(a.prescriptionDate) - new Date(b.prescriptionDate));

      setPendingPrescriptionData(sortedData);
    } catch (error) {
      console.error("Error fetching Pending Prescription data:", error);
      setPendingPrescriptionData([]);
      showPopup("Failed to fetch pending prescription list", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicine details for the selected prescription (dummy JSON for now)
  const fetchMedicineDetails = (prescriptionId) => {
    try {
      const data = DUMMY_MEDICINE_DETAILS[prescriptionId] || [];
      setDetailEntries(data.map((entry) => ({ ...entry })));
    } catch (error) {
      console.error("Error fetching medicine details:", error);
      setDetailEntries([]);
      showPopup("Failed to fetch medicine details", "error");
    }
  };

  const filteredPendingPrescriptionData = pendingPrescriptionData.filter((item) =>
    item.patientName?.toLowerCase().includes(patientName.toLowerCase()) &&
    item.mobileNo?.toLowerCase().includes(mobileNo.toLowerCase())
  );

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPendingPrescriptionData.slice(indexOfFirstItem, indexOfLastItem);

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

  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : () => setConfirmationPopup(null),
      confirmText,
      cancelText
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
    setIsSearching(false);
  };

  const handleReset = () => {
    setIsResetting(true);
    setPatientName("");
    setMobileNo("");
    setCurrentPage(1);
    fetchPendingPrescriptionData();
    setIsResetting(false);
  };

  // Open the OPD / Dispensary Issue view for the selected prescription (in-page, no redirect)
  const handleIssueClick = (record, e) => {
    e.stopPropagation();
    setSelectedPrescription(record);
    setPatientInfo({
      uhid: record.uhid || "",
      patientName: record.patientName || "",
      ageGender: record.ageGender || "",
      mobileNo: record.mobileNo || ""
    });
    setSearchUhid(record.uhid || "");
    fetchMedicineDetails(record.prescriptionId);
    setCurrentView("issue");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedPrescription(null);
    setDetailEntries([]);
    setPatientInfo(null);
    setSearchUhid("");
  };

  const handleCloseClick = (record, e) => {
    e.stopPropagation();
    showConfirmationPopup(
      `Are you sure you want to close prescription ${record.prescriptionNo}?`,
      "info",
      () => {
        handleCloseConfirmed(record);
      },
      () => {
        console.log("Close prescription cancelled by user");
      },
      "Yes",
      "No"
    );
  };

  const handleCloseConfirmed = (record) => {
    setIsClosing(true);
    try {
      // Update prescription status to 'X' (Closed) and remove from pending list
      const updatedData = pendingPrescriptionData.filter(
        (item) => item.prescriptionId !== record.prescriptionId
      );
      setPendingPrescriptionData(updatedData);
      showPopup("Prescription closed successfully!", "success");
    } catch (error) {
      console.error("Error closing prescription:", error);
      showPopup("Failed to close prescription", "error");
    } finally {
      setIsClosing(false);
    }
  };

  // If patient is registered, search by UHID to populate the patient details
  const handlePatientSearch = () => {
    if (!searchUhid.trim()) {
      showPopup("Please enter a UHID to search", "warning");
      return;
    }

    setIsPatientSearching(true);
    try {
      const foundPatient = DUMMY_REGISTERED_PATIENTS.find(
        (p) => p.uhid.toLowerCase() === searchUhid.trim().toLowerCase()
      );

      if (foundPatient) {
        setPatientInfo({ ...foundPatient });
        showPopup("Patient details populated successfully!", "success");
      } else {
        showPopup("No registered patient found for this UHID", "warning");
      }
    } catch (error) {
      console.error("Error searching patient:", error);
      showPopup("Failed to search patient details", "error");
    } finally {
      setIsPatientSearching(false);
    }
  };

  const updateDetailEntry = (id, field, value) => {
    const updatedEntries = detailEntries.map((entry) => {
      if (entry.id === id) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    setDetailEntries(updatedEntries);
  };

  // Add Medicine - adds a new blank editable row to the medicine grid
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
      totalStock: ""
    };
    setDetailEntries([...detailEntries, newEntry]);
  };

  // Delete Medicine - removes a row from the medicine grid
  const deleteMedicineRow = (id) => {
    setDetailEntries((prev) =>
      prev.length > 1 ? prev.filter((entry) => entry.id !== id) : prev
    );
  };

  const handleIssueSubmit = () => {
    // Business rule: Issue Qty shall not exceed the available stock of the selected batch
    const invalidEntry = detailEntries.find(
      (entry) => Number(entry.issueQty) > Number(entry.totalStock)
    );

    if (invalidEntry) {
      showPopup(`Issue Qty for ${invalidEntry.medicineName || "this medicine"} cannot exceed available Total Stock`, "warning");
      return;
    }

    showConfirmationPopup(
      `Are you sure you want to issue all prescribed medicines for ${selectedPrescription?.prescriptionNo}?`,
      "info",
      () => {
        handleIssueConfirmed();
      },
      () => {
        console.log("Issue medicines cancelled by user");
      },
      "Yes",
      "No"
    );
  };

  const handleIssueConfirmed = () => {
    setIsIssuing(true);
    try {
      // Update prescription status to 'Y' (Issued) and remove from pending list
      const updatedData = pendingPrescriptionData.filter(
        (item) => item.prescriptionId !== selectedPrescription.prescriptionId
      );
      setPendingPrescriptionData(updatedData);
      showPopup("Medicines issued successfully!", "success", () => {
        handleBackToList();
      });
    } catch (error) {
      console.error("Error issuing medicines:", error);
      showPopup("Failed to issue medicines", "error");
    } finally {
      setIsIssuing(false);
    }
  };

  if (currentView === "issue") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => { })}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Issue Screen</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              </div>

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              <div className="card-body">
                {/* Prescription & Patient Details */}
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Prescription & Patient Details</h6>
                      </div>
                      <div className="card-body">
                        {/* If patient is registered - search by UHID to populate patient details */}
                        <div className="row g-3 align-items-end mb-3">
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">UHID</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter UHID"
                              value={searchUhid}
                              onChange={(e) => setSearchUhid(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handlePatientSearch()}
                            />
                          </div>
                          <div className="col-md-3">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handlePatientSearch}
                              disabled={isPatientSearching}
                            >
                              {isPatientSearching ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <i className="mdi mdi-magnify"></i> Search
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="form-group col-md-4">
                            <label>Prescription No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedPrescription?.prescriptionNo || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Prescription Date</label>
                            <input
                              type="text"
                              className="form-control"
                              value={
                                selectedPrescription?.prescriptionDate
                                  ? new Date(selectedPrescription.prescriptionDate).toLocaleString("en-GB")
                                  : ""
                              }
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>OPD Visit No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedPrescription?.opdVisitNo || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Doctor Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedPrescription?.doctorName || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Department</label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedPrescription?.department || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientInfo?.patientName || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>UHID</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientInfo?.uhid || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Age / Gender</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientInfo?.ageGender || ""}
                              readOnly
                            />
                          </div>

                          <div className="form-group col-md-4">
                            <label>Mobile No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={patientInfo?.mobileNo || ""}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold">Medicine Details</h6>

                {/* Add Medicine button - positioned above the table */}
                <div className="d-flex justify-content-end mb-2">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addMedicineRow}
                  >
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
                      {detailEntries.length > 0 ? (
                        detailEntries.map((entry, index) => (
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
                                className="form-control form-control-sm"
                                value={entry.expiryDate ? entry.expiryDate.split("T")[0] : ""}
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
                                title="Delete medicine row"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={11} className="text-center py-4 text-muted">
                            No medicines found for this prescription.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={handleIssueSubmit}
                    disabled={isIssuing || detailEntries.length === 0}
                  >
                    {isIssuing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Issuing...
                      </>
                    ) : (
                      "Issue"
                    )}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleBackToList} disabled={isIssuing}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => { })}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending Prescription List</h4>
            </div>

            <div className="card-body">
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Mobile No.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading || isSearching || isResetting}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading || isSearching || isResetting}
                  >
                    {isResetting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resetting...
                      </>
                    ) : (
                      "Reset"
                    )}
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Prescription No.</th>
                      <th>Prescription Date</th>
                      <th>Patient Name</th>
                      <th>Mobile No.</th>
                      <th>Age/Gender</th>
                      <th>Department</th>
                      <th>Doctor Name</th>
                      <th className="text-center">Action</th>
                      <th className="text-center">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.prescriptionId}>
                          <td>{item.prescriptionNo || '-'}</td>
                          <td>
                            {item.prescriptionDate
                              ? new Date(item.prescriptionDate).toLocaleString("en-GB")
                              : '-'}
                          </td>
                          <td>{item.patientName || '-'}</td>
                          <td>{item.mobileNo || '-'}</td>
                          <td>{item.ageGender || '-'}</td>
                          <td>{item.department || '-'}</td>
                          <td>{item.doctorName || '-'}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={(e) => handleIssueClick(item, e)}
                              title="Issue Prescription"
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={(e) => handleCloseClick(item, e)}
                              disabled={isClosing}
                              title="Close Prescription"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredPendingPrescriptionData.length > 0 && (
                <Pagination
                  totalItems={filteredPendingPrescriptionData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionList