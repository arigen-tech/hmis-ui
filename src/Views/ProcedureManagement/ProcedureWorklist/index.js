import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ProcedureWorklist = () => {
  // ----- State -----
  const [currentView, setCurrentView] = useState("list"); // "list" | "detail"
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [searchMobile, setSearchMobile] = useState("");
  const [searchPatient, setSearchPatient] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // ----- Dummy data -----
  const dummyData = [
    {
      id: 1,
      mobile: "9765432108",
      patientName: "Vikram Malhotra",
      ageGender: "45/M",
      department: "Cardiology",
      procedure: "ECG",
      sitting: "1/1",
      dateTime: "27-Aug-26 09:00AM",
      advisedBy: "Dr.Patel",
      scheduled: "Consultation"
    },
    {
      id: 2,
      mobile: "9856123470",
      patientName: "Ananya Verma",
      ageGender: "28/F",
      department: "Orthopedics",
      procedure: "Knee Physiotherapy",
      sitting: "3/6",
      dateTime: "27-Aug-26 10:15AM",
      advisedBy: "Dr.Agarwal",
      scheduled: "Treatment"
    },
    {
      id: 3,
      mobile: "9912345670",
      patientName: "Manish Tiwari",
      ageGender: "51/M",
      department: "Ophthalmology",
      procedure: "Eye Examination",
      sitting: "1/2",
      dateTime: "27-Aug-26 11:45AM",
      advisedBy: "Dr.Mishra",
      scheduled: "Checkup"
    },
    {
      id: 4,
      mobile: "9789012345",
      patientName: "Kavita Joshi",
      ageGender: "36/F",
      department: "Dermatology",
      procedure: "Laser Treatment",
      sitting: "2/5",
      dateTime: "27-Aug-26 01:00PM",
      advisedBy: "Dr.Kapoor",
      scheduled: ""
    },
    {
      id: 5,
      mobile: "9834567210",
      patientName: "Sandeep Yadav",
      ageGender: "40/M",
      department: "Physiotherapy",
      procedure: "Back Pain Therapy",
      sitting: "5/8",
      dateTime: "27-Aug-26 03:30PM",
      advisedBy: "Dr.Chauhan",
      scheduled: ""
    },
    {
      id: 6,
      mobile: "9871203456",
      patientName: "Meera Nair",
      ageGender: "33/F",
      department: "Gynecology",
      procedure: "Ultrasound",
      sitting: "1/1",
      dateTime: "28-Aug-26 10:00AM",
      advisedBy: "Dr.Iyer",
      scheduled: ""
    }
  ];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setTotalItems(dummyData.length);
      setTotalPages(Math.ceil(dummyData.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  // ----- Filtered data (list view) -----
  const filteredData = data.filter(item => {
    const matchMobile = item.mobile.includes(searchMobile);
    const matchPatient = item.patientName.toLowerCase().includes(searchPatient.toLowerCase());
    return matchMobile && matchPatient;
  });

  // ----- Pagination slice -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Handlers for list view -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchMobile("");
    setSearchPatient("");
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    alert("Add New Procedure – open form here");
  };

  // ----- Navigate to detail view -----
  const handleRowClick = (record) => {
    setSelectedRecord({ ...record }); // copy to allow editing
    setCurrentView("detail");
  };

  // ----- Navigate back to list -----
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
  };

  // ----- Detail view: handle field changes -----
  const handleFieldChange = (field, value) => {
    setSelectedRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ----- Save changes (simulate) -----
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Update the main data list with the edited record
      const updatedData = data.map((item) =>
        item.id === selectedRecord.id ? { ...selectedRecord } : item
      );
      setData(updatedData);
      setIsSaving(false);
      showPopup("Procedure updated successfully!", "success", () => {
        handleBackToList();
      });
    }, 500);
  };

  // ----- Popup helper -----
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  // ============================================================
  // RENDER: DETAIL VIEW
  // ============================================================
  if (currentView === "detail" && selectedRecord) {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  Procedure Details – {selectedRecord.patientName}
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  <i className="mdi mdi-arrow-left"></i> Back
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Mobile No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.mobile}
                      onChange={(e) => handleFieldChange("mobile", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.patientName}
                      onChange={(e) => handleFieldChange("patientName", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Age / Gender</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.ageGender}
                      onChange={(e) => handleFieldChange("ageGender", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.department}
                      onChange={(e) => handleFieldChange("department", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Procedure</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.procedure}
                      onChange={(e) => handleFieldChange("procedure", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Sitting</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.sitting}
                      onChange={(e) => handleFieldChange("sitting", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Date / Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.dateTime}
                      onChange={(e) => handleFieldChange("dateTime", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Advised By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.advisedBy}
                      onChange={(e) => handleFieldChange("advisedBy", e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold">Scheduled</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord.scheduled || ""}
                      onChange={(e) => handleFieldChange("scheduled", e.target.value)}
                      placeholder="(Optional)"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="btn btn-success me-2"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: LIST VIEW
  // ============================================================
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">Procedure Worklist</h4>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-success" onClick={handleAddNew}>
                  <i className="mdi mdi-plus"></i> Add
                </button>
                <button className="btn btn-success" onClick={() => setData(dummyData)}>
                  <i className="mdi mdi-refresh"></i> Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Search Section */}
              <div className="mb-3">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Mobile No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by mobile..."
                      value={searchMobile}
                      onChange={(e) => setSearchMobile(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by patient name..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch}>
                      Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mobile No.</th>
                      <th>Patient Name</th>
                      <th>Age/Gender</th>
                      <th>Department</th>
                      <th>Procedure</th>
                      <th>Sitting</th>
                      <th>Date/Time</th>
                      <th>Advised By</th>
                      <th>Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.mobile}</td>
                          <td>{item.patientName}</td>
                          <td>{item.ageGender}</td>
                          <td>{item.department}</td>
                          <td>{item.procedure}</td>
                          <td>{item.sitting}</td>
                          <td>{item.dateTime}</td>
                          <td>{item.advisedBy}</td>
                          <td>{item.scheduled || "-"}</td>
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

              {filteredData.length > 0 && (
                <Pagination
                  totalItems={filteredData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default ProcedureWorklist;