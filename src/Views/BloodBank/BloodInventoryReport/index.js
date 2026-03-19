import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const COMPONENTS = [
  "Whole Blood",
  "Packed Red Blood Cells (PRBC)",
  "Fresh Frozen Plasma (FFP)",
  "Platelets",
  "Cryoprecipitate",
  "Granulocytes",
];

const EXPIRY_OPTIONS = [
  { label: "Expiring Today", value: "0" },
  { label: "Within 3 Days", value: "3" },
  { label: "Within 7 Days", value: "7" },
  { label: "Within 15 Days", value: "15" },
  { label: "Within 30 Days", value: "30" },
];

const BloodBankStockReport = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleSearch = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      setShowDetailView(false);
      setSelectedItem(null);
    }, 1000);
  };

  const handleClear = () => {
    setShowReport(false);
    setShowDetailView(false);
    setSelectedItem(null);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetailView(true);
  };

  const handleBackToSummary = () => {
    setShowDetailView(false);
    setSelectedItem(null);
  };

const summaryData = [
  {
    id: "1",
    bloodGroup: "O-",
    component: "Packed Red Blood Cells (PRBC)",
    available: 10,
    reserved: 2,
    allocated: 3,
    expired: 1,
    detailUnits: [
      {
        unitNo: "PRBC-20250401-001",
        bagNo: "BAG-20250401-001",
        component: "Packed Red Blood Cells (PRBC)",
        bloodGroup: "O-",
        expiryDate: "02-Apr-2026",
        status: "Available",
        storageLocation: "Main BB - Rack A, Shelf 1"
      },
      {
        unitNo: "PRBC-20250401-002",
        bagNo: "BAG-20250401-002",
        component: "Packed Red Blood Cells (PRBC)",
        bloodGroup: "O-",
        expiryDate: "05-Apr-2026",
        status: "Reserved",
        storageLocation: "Main BB - Rack A, Shelf 2"
      },
      {
        unitNo: "PRBC-20250401-003",
        bagNo: "BAG-20250401-003",
        component: "Packed Red Blood Cells (PRBC)",
        bloodGroup: "O-",
        expiryDate: "08-Apr-2026",
        status: "Allocated",
        storageLocation: "Main BB - Rack A, Shelf 3"
      }
    ]
  },
  {
    id: "2",
    bloodGroup: "A-",
    component: "Platelets",
    available: 5,
    reserved: 2,
    allocated: 1,
    expired: 0,
    detailUnits: [
      {
        unitNo: "PLT-20250401-001",
        bagNo: "BAG-20250401-004",
        component: "Platelets",
        bloodGroup: "A-",
        expiryDate: "03-Apr-2026",
        status: "Available",
        storageLocation: "Main BB - Rack B, Shelf 1"
      },
      {
        unitNo: "PLT-20250401-002",
        bagNo: "BAG-20250401-005",
        component: "Platelets",
        bloodGroup: "A-",
        expiryDate: "06-Apr-2026",
        status: "Reserved",
        storageLocation: "Main BB - Rack B, Shelf 2"
      }
    ]
  },
  {
    id: "3",
    bloodGroup: "B+",
    component: "Fresh Frozen Plasma (FFP)",
    available: 7,
    reserved: 1,
    allocated: 2,
    expired: 0,
    detailUnits: [
      {
        unitNo: "FFP-20250401-001",
        bagNo: "BAG-20250401-006",
        component: "Fresh Frozen Plasma (FFP)",
        bloodGroup: "B+",
        expiryDate: "10-Apr-2026",
        status: "Available",
        storageLocation: "Main BB - Rack C, Shelf 1"
      },
      {
        unitNo: "FFP-20250401-002",
        bagNo: "BAG-20250401-007",
        component: "Fresh Frozen Plasma (FFP)",
        bloodGroup: "B+",
        expiryDate: "12-Apr-2026",
        status: "Allocated",
        storageLocation: "Main BB - Rack C, Shelf 2"
      }
    ]
  },
  {
    id: "4",
    bloodGroup: "AB-",
    component: "Cryoprecipitate",
    available: 3,
    reserved: 1,
    allocated: 0,
    expired: 0,
    detailUnits: [
      {
        unitNo: "CRYO-20250401-001",
        bagNo: "BAG-20250401-008",
        component: "Cryoprecipitate",
        bloodGroup: "AB-",
        expiryDate: "15-Apr-2026",
        status: "Available",
        storageLocation: "Main BB - Rack D, Shelf 1"
      },
      {
        unitNo: "CRYO-20250401-002",
        bagNo: "BAG-20250401-009",
        component: "Cryoprecipitate",
        bloodGroup: "AB-",
        expiryDate: "18-Apr-2026",
        status: "Reserved",
        storageLocation: "Main BB - Rack D, Shelf 2"
      }
    ]
  }
];
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Available":
        return "bg-success";
      case "Reserved":
        return "bg-warning";
      case "Allocated":
        return "bg-info";
      case "Expired":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">BLOOD BANK INVENTORY</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section - Always Visible */}
              <div className="row mb-4">
                {/* Blood Group Multi-select */}
                <div className="col-md-3">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Component Dropdown */}
                <div className="col-md-3">
                  <label className="form-label">
                    Component
                  </label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">All Components</option>
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Expiry Within Dropdown */}
                <div className="col-md-3">
                  <label className="form-label">
                    Expiry Within
                  </label>
                  <select
                    className="form-select"
                    defaultValue=""
                  >
                    <option value="">Any Time</option>
                    {EXPIRY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
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
                    onClick={handleClear}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {!isGenerating && showReport && (
                <>
                  {!showDetailView ? (
                    <div>
                      Blood
Group
Available
Units
Reserved
Units
Allocated
Units
ExpireUnits

                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead >
                            <tr>
                              <th>Blood Group</th>
                              <th>Component</th>
                              <th className="text-center">Available Units</th>
                              <th className="text-center">Reserved Units</th>
                              <th className="text-center">Allocated Units</th>
                              <th className="text-center">Expired Units</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaryData.length > 0 ? (
                              summaryData.map((item) => (
                                <tr
                                  key={item.id}
                                  onClick={() => handleRowClick(item)}
                                  style={{
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                                >
                                  <td className="fw-bold">{item.bloodGroup}</td>
                                  <td>{item.component}</td>
                                  <td className="text-center">
                                    <span className="fw-bold ">{item.available}</span>
                                  </td>
                                  <td className="text-center">
                                    <span className="fw-bold ">{item.reserved}</span>
                                  </td>
                                  <td className="text-center">
                                    <span className="fw-bold ">{item.allocated}</span>
                                  </td>
                                  <td className="text-center">
                                    <span className="fw-bold ">{item.expired}</span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="text-center py-4">
                                  No Record Found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {summaryData.length > 0 && (
                        <Pagination
                          totalItems={summaryData.length}
                          itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                          currentPage={1}
                          onPageChange={() => {}}
                        />
                      )}
                    </div>
                  ) : (
                    /* Detail View - Shows when row is clicked (hides main table) */
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Unit Details - {selectedItem?.bloodGroup} {selectedItem?.component}</h5>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={handleBackToSummary}
                        >
                          ← Back to Summary
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                          <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                            <tr>
                              <th>Unit No</th>
                              <th>Bag No</th>
                              <th>Component</th>
                              <th>Blood Group</th>
                              <th>Expiry Date</th>
                              <th>Inventory Status</th>
                              <th>Storage Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItem?.detailUnits.map((unit, index) => (
                              <tr key={index}>
                                <td className="fw-bold">{unit.unitNo}</td>
                                <td>{unit.bagNo}</td>
                                <td>{unit.component}</td>
                                <td>{unit.bloodGroup}</td>
                                <td>{unit.expiryDate}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(unit.status)}`}>
                                    {unit.status}
                                  </span>
                                </td>
                                <td>{unit.storageLocation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankStockReport;