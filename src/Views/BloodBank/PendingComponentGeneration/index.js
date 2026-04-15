import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// Sample data based on the image
const pendingComponentData = [
  {
    id: 1,
    bagNo: "BAG-2025-001",
    donorRegNo: "DON-001",
    donorName: "Rakesh Sharma",
    bloodGroup: "O+",
    collectionDate: "18-Aug-2025 10:15",
    collectionType: "Whole Blood",
    bagType: "Triple",
    collectedVolume: 450,
    donationStatus: "COLLECTED"
  },
  {
    id: 2,
    bagNo: "BAG-2025-002",
    donorRegNo: "DON-002",
    donorName: "Sunita Verma",
    bloodGroup: "A+",
    collectionDate: "18-Aug-2025 11:05",
    collectionType: "Whole Blood",
    bagType: "Double",
    collectedVolume: 350,
    donationStatus: "COLLECTED"
  },
  {
    id: 3,
    bagNo: "BAG-2025-003",
    donorRegNo: "DON-003",
    donorName: "Mohan Das",
    bloodGroup: "B+",
    collectionDate: "18-Aug-2025 11:40",
    collectionType: "Apheresis",
    bagType: "Single",
    collectedVolume: 300,
    donationStatus: "COLLECTED"
  },
  {
    id: 4,
    bagNo: "BAG-2025-004",
    donorRegNo: "DON-004",
    donorName: "Priya Patel",
    bloodGroup: "AB+",
    collectionDate: "18-Aug-2025 12:20",
    collectionType: "Whole Blood",
    bagType: "Quadruple",
    collectedVolume: 450,
    donationStatus: "COLLECTED"
  },
  {
    id: 5,
    bagNo: "BAG-2025-005",
    donorRegNo: "DON-005",
    donorName: "Amit Kumar",
    bloodGroup: "B-",
    collectionDate: "18-Aug-2025 13:15",
    collectionType: "Whole Blood",
    bagType: "Triple",
    collectedVolume: 450,
    donationStatus: "COLLECTED"
  }
];

// Helper function to determine component names based on bag type
const getComponentsForBagType = (bagType) => {
  switch (bagType) {
    case "Single":
      return ["Red Blood Cells (RBC)"];
    case "Double":
      return ["Red Blood Cells (RBC)", "Plasma"];
    case "Triple":
      return ["Red Blood Cells (RBC)", "Plasma", "Platelets"];
    case "Quadruple":
      return ["Red Blood Cells (RBC)", "Plasma", "Platelets", "Cryoprecipitate"];
    default:
      return [];
  }
};

const PendingComponentGeneration = () => {
  const [pendingData, setPendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBag, setSelectedBag] = useState(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [failureRemarks, setFailureRemarks] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(""); // "pass" or "fail"
  
  // State to hold component entries (array of objects)
  const [components, setComponents] = useState([]);
  const [componentNotes, setComponentNotes] = useState("");

  // Mock failure reasons from mas_component_failure_reason
  const failureReasonOptions = [
    { id: 1, reason: "Hemolysis" },
    { id: 2, reason: "Clotting" },
    { id: 3, reason: "Insufficient Volume" },
    { id: 4, reason: "Lipemic" },
    { id: 5, reason: "Container Leak" },
    { id: 6, reason: "Expired" },
    { id: 7, reason: "Contamination" }
  ];

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPendingData(pendingComponentData);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Error fetching pending component data:", err);
      showPopup("Failed to fetch pending component data", "error");
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredPendingData = pendingData.filter(record =>
    record.bagNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.donorRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.collectionType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPendingData.slice(indexOfFirstItem, indexOfFirstItem + DEFAULT_ITEMS_PER_PAGE);

  const handleRowClick = (record) => {
    setSelectedBag(record);
    setShowDetailView(true);
    setGenerationStatus("");
    setComponentNotes("");
    
    // Initialize components array based on bag type
    const componentNames = getComponentsForBagType(record.bagType);
    const initialComponents = componentNames.map(name => ({
      componentName: name,
      unitNo: "",
      volume: "",
      expiryDate: ""
    }));
    setComponents(initialComponents);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedBag(null);
    setGenerationStatus("");
    setComponents([]);
    setComponentNotes("");
  };

  // Update a specific component field
  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...components];
    updatedComponents[index][field] = value;
    setComponents(updatedComponents);
  };

  const handleFailure = (record) => {
    setSelectedBag(record);
    setShowFailureModal(true);
    setFailureReason("");
    setFailureRemarks("");
  };

  const submitFailure = async () => {
    if (!failureReason) {
      showPopup("Please select a failure reason", "error");
      return;
    }

    try {
      setLoading(true);
      setTimeout(() => {
        setPendingData(pendingData.filter(item => item.id !== selectedBag.id));
        showPopup(`Component generation failed for Bag ${selectedBag.bagNo}. Status updated with reason: ${failureReason}`, "warning");
        setShowFailureModal(false);
        setSelectedBag(null);
        setFailureReason("");
        setFailureRemarks("");
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Error updating failure status:", err);
      showPopup("Failed to update failure status", "error");
      setLoading(false);
    }
  };

  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchPendingData();
  };

  const getBagTypeBadgeClass = (bagType) => {
    switch(bagType) {
      case "Single": return "badge bg-info";
      case "Double": return "badge bg-primary";
      case "Triple": return "badge bg-success";
      case "Quadruple": return "badge bg-warning text-dark";
      default: return "badge bg-secondary";
    }
  };

  // Validate component entries before save
  const validateComponents = () => {
    if (generationStatus === "fail") {
      return !!failureReason;
    }
    
    if (generationStatus === "pass") {
      for (let comp of components) {
        if (!comp.unitNo.trim()) {
          showPopup(`Please enter Unit No for ${comp.componentName}`, "error");
          return false;
        }
        if (!comp.volume || parseFloat(comp.volume) <= 0) {
          showPopup(`Please enter a valid volume for ${comp.componentName}`, "error");
          return false;
        }
        if (!comp.expiryDate) {
          showPopup(`Please select expiry date for ${comp.componentName}`, "error");
          return false;
        }
      }
      return true;
    }
    return false;
  };

  // Save component generation (PASS)
  const handleSavePass = () => {
    if (!validateComponents()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Remove from pending list
      setPendingData(pendingData.filter(item => item.id !== selectedBag.id));
      
      // In real implementation, send components array to backend
      console.log("Saving components:", components);
      console.log("Notes:", componentNotes);
      
      showPopup("Component generation completed successfully. Components saved.", "success");
      handleBackToList();
      setLoading(false);
    }, 1000);
  };

  // Save component failure
  const handleSaveFail = () => {
    if (!failureReason) {
      showPopup("Please select a failure reason", "error");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setPendingData(pendingData.filter(item => item.id !== selectedBag.id));
      showPopup(`Component generation failed. Reason: ${failureReason}`, "warning");
      handleBackToList();
      setLoading(false);
    }, 1000);
  };

  // Combined save handler
  const handleSave = () => {
    if (generationStatus === "pass") {
      handleSavePass();
    } else if (generationStatus === "fail") {
      handleSaveFail();
    }
  };

  return (
    <div className="content-wrapper">
      {showDetailView && selectedBag ? (
        // ============= COMPONENT GENERATION DETAIL VIEW =============
        <div className="row">
          <div className="col-12">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title">
                  <i className="mdi mdi-flask me-2"></i>
                  Component Generation – Details
                </h4>
                <button 
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  <i className="fa fa-arrow-left me-2"></i>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {loading && <LoadingScreen />}
                
                {/* Donation Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Donation Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-bold w-25">Bag No</td>
                                <td>{selectedBag.bagNo}</td>
                                <td className="fw-bold w-25">Donor Reg No</td>
                                <td>{selectedBag.donorRegNo}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Donor Name</td>
                                <td>{selectedBag.donorName}</td>
                                <td className="fw-bold">Blood Group</td>
                                <td><span className="badge bg-danger">{selectedBag.bloodGroup}</span></td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Collection Type</td>
                                <td>{selectedBag.collectionType}</td>
                                <td className="fw-bold">Current Status</td>
                                <td><span className="badge bg-info">COLLECTED</span></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Collection Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-bold w-25">Collection Date</td>
                                <td>{selectedBag.collectionDate}</td>
                                <td className="fw-bold w-25">Bag Type</td>
                                <td><span className={getBagTypeBadgeClass(selectedBag.bagType)}>{selectedBag.bagType}</span></td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Total Collected Volume</td>
                                <td>{selectedBag.collectedVolume} ml</td>
                                <td></td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Generation Status */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Component Generation Status</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Generation Status <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={generationStatus}
                              onChange={(e) => setGenerationStatus(e.target.value)}
                            >
                              <option value="">Select Status</option>
                              <option value="pass">PASS</option>
                              <option value="fail">FAIL</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Failure Form - Show only if FAIL is selected */}
                {generationStatus === "fail" && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow mb-3 ">
                        <div className="card-header py-3 bg-danger bg-opacity-10 border-bottom-1">
                          <h6 className="mb-0 fw-bold text-danger">
                            <i className="mdi mdi-alert-circle me-2"></i>
                            Component Generation Failure
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">
                                Failure Reason <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select"
                                value={failureReason}
                                onChange={(e) => setFailureReason(e.target.value)}
                              >
                                <option value="">Select Failure Reason</option>
                                {failureReasonOptions.map(option => (
                                  <option key={option.id} value={option.reason}>
                                    {option.reason}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="row g-3 mt-2">
                            <div className="col-12">
                              <label className="form-label">Remarks (Optional)</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Enter additional remarks..."
                                value={failureRemarks}
                                onChange={(e) => setFailureRemarks(e.target.value)}
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Component Separation Table - Show only if PASS is selected */}
                {generationStatus === "pass" && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow mb-3 ">
                        <div className="card-header py-3 bg-success bg-opacity-10 border-bottom-1">
                          <h6 className="mb-0 fw-bold text-success">
                            <i className="mdi mdi-check-circle me-2"></i>
                            Component Separation Details ({selectedBag.bagType} Bag)
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead className="table-light">
                                <tr>
                                  <th>Component</th>
                                  <th>Unit No</th>
                                  <th>Volume (ml)</th>
                                  <th>Expiry Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {components.map((comp, index) => (
                                  <tr key={index}>
                                    <td>{comp.componentName}</td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Enter unit number"
                                        value={comp.unitNo}
                                        onChange={(e) => handleComponentChange(index, 'unitNo', e.target.value)}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="Volume in ml"
                                        value={comp.volume}
                                        onChange={(e) => handleComponentChange(index, 'volume', e.target.value)}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={comp.expiryDate}
                                        onChange={(e) => handleComponentChange(index, 'expiryDate', e.target.value)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                         
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {generationStatus && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="card shadow">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <button
                                type="button"
                                className="btn btn-primary me-2"
                                onClick={handleSave}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-save me-2"></i>
                                    Save
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleBackToList}
                                disabled={loading}
                              >
                                <i className="fa fa-times me-2"></i>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ============= PENDING COMPONENT LIST VIEW =============
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Pending Component Generation</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search Bag No, Donor, Blood Group..."
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>

                <div className="d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-success me-2 flex-shrink-0"
                    onClick={handleRefresh}
                  >
                    <i className="mdi mdi-refresh"></i> Show All
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Bag No</th>
                          <th>Donor Reg No</th>
                          <th>Donor Name</th>
                          <th>Blood Group</th>
                          <th>Collection Date</th>
                          <th>Collection Type</th>
                          <th>Bag Type</th>
                          <th>Collected Volume (ml)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((record) => (
                            <tr key={record.id} onClick={() => handleRowClick(record)} style={{ cursor: 'pointer' }}>
                              <td><strong>{record.bagNo}</strong></td>
                              <td>{record.donorRegNo}</td>
                              <td>{record.donorName}</td>
                              <td><span className="badge bg-danger">{record.bloodGroup}</span></td>
                              <td>{record.collectionDate}</td>
                              <td>{record.collectionType}</td>
                              <td>
                                <span className={getBagTypeBadgeClass(record.bagType)}>
                                  {record.bagType}
                                </span>
                              </td>
                              <td className="text-end">{record.collectedVolume}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">No pending component generation found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredPendingData.length > 0 && (
                    <Pagination
                      totalItems={filteredPendingData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

              {/* Reports Modal */}
              {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5">Component Generation Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>Generate reports for component generation:</p>
                        <div className="list-group">
                          <button type="button" className="list-group-item list-group-item-action">Pending Component List</button>
                          <button type="button" className="list-group-item list-group-item-action">Component Generation Summary</button>
                          <button type="button" className="list-group-item list-group-item-action">Failure Analysis Report</button>
                          <button type="button" className="list-group-item list-group-item-action">Bag Type-wise Component Yield</button>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Generate Report</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure Reason Modal */}
              {showFailureModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5">Component Generation Failure</h1>
                        <button type="button" className="btn-close" onClick={() => setShowFailureModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p className="mb-3">
                          <strong>Bag No:</strong> {selectedBag?.bagNo}<br />
                          <strong>Donor:</strong> {selectedBag?.donorName} ({selectedBag?.donorRegNo})
                        </p>
                        <p>Please select the reason for component generation failure:</p>
                        
                        <div className="form-group mb-3">
                          <label className="mb-2">Failure Reason <span className="text-danger">*</span></label>
                          <select 
                            className="form-control"
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            required
                          >
                            <option value="">Select Failure Reason</option>
                            {failureReasonOptions.map(option => (
                              <option key={option.id} value={option.reason}>
                                {option.reason}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="mb-2">Remarks (Optional)</label>
                          <textarea 
                            className="form-control"
                            rows="3"
                            placeholder="Enter additional remarks..."
                            value={failureRemarks}
                            onChange={(e) => setFailureRemarks(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="alert alert-info mt-3 mb-0">
                          <i className="mdi mdi-information"></i> 
                          Note: No component data will be saved. Only the donation header will be updated with failure status.
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowFailureModal(false)}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-danger" onClick={submitFailure}>
                          Confirm Failure
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Background overlay for modals */}
              {(showModal || showFailureModal) && (
                <div className="modal-backdrop fade show"></div>
              )}

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingComponentGeneration;