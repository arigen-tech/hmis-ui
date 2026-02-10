import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const XRAYInvestigation = () => {
  const [xrayData, setXrayData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    investigationName: ""
  });

  const [popupMessage, setPopupMessage] = useState(null);

  /* ---------------- SAMPLE DATA ---------------- */
  useEffect(() => {
    setTimeout(() => {
      setXrayData([
        {
          id: 1,
          accessionNo: "Acc-260112-001",
          uhid: "U12345",
          patientName: "John Doe",
          age: "35",
          gender: "Male",
          modality: "X-Ray",
          investigationName: "Chest X-Ray",
          orderDate: "2026-01-10",
          orderTime: "10:30",
          department: "Radiology",
          contactNo: "+91-9876543210",
          status: "y"
        },
        {
          id: 2,
          accessionNo: "Acc-260112-002",
          uhid: "U67890",
          patientName: "Jane Smith",
          age: "28",
          gender: "Female",
          modality: "CT",
          investigationName: "CT Brain",
          orderDate: "2026-01-12",
          orderTime: "11:00",
          department: "Radiology",
          contactNo: "+91-9876543211",
          status: "n"
        },
        {
          id: 3,
          accessionNo: "Acc-260112-003",
          uhid: "U13579",
          patientName: "Robert Johnson",
          age: "45",
          gender: "Male",
          modality: "MRI",
          investigationName: "MRI Spine",
          orderDate: "2026-01-13",
          orderTime: "14:15",
          department: "Radiology",
          contactNo: "+91-9876543212",
          status: "y"
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = xrayData.filter(item =>
    item.accessionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.contactNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- POPUP ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ---------------- STATUS CHANGE ---------------- */
  const handleSwitchChange = (id, newStatus, investigationName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, investigationName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setXrayData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );
      showPopup(
        `XRAY Investigation ${confirmDialog.newStatus === "y" ? "Activated" : "Deactivated"
        } Successfully`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", investigationName: "" });
  };

  /* ---------------- ACTION HANDLERS ---------------- */
  const handleCompleted = (row) => {
    showPopup(`Marked as Completed for ${row.patientName} (${row.accessionNo})`, "success");
    // Add your completed logic here
    // You can update the status or add a completed flag
  };

  const handleCancel = (row) => {
    showPopup(`Cancelling investigation for ${row.patientName} (${row.accessionNo})`, "warning");
    // Add your cancel logic here
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">XRAY Investigation</h4>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {/* Search Field inside table header */}
              <div className="mb-3">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by Accession No / UHID / Patient Name / Contact No"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </button>
                  </div>
                  <div className="col-md-6 text-end">
                    <span className="text-muted">
                      Showing {currentItems.length} of {filteredData.length} records
                    </span>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Accession No</th>
                      <th>UHID</th>
                      <th>Patient Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Contact No</th>
                      <th>Modality</th>
                      <th>Investigation</th>
                      <th>Order Date</th>
                      <th>Order Time</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.accessionNo}</td>
                          <td>{item.uhid}</td>
                          <td>{item.patientName}</td>
                          <td>{item.age}</td>
                          <td>{item.gender}</td>
                          <td>{item.contactNo}</td>
                          <td>{item.modality}</td>
                          <td>{item.investigationName}</td>
                          <td>{item.orderDate}</td>
                          <td>{item.orderTime}</td>
                          <td>{item.department}</td>

                          {/* STATUS */}
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() =>
                                  handleSwitchChange(
                                    item.id,
                                    item.status === "y" ? "n" : "y",
                                    item.investigationName
                                  )
                                }
                              />
                              <span className="ms-2">
                                {item.status === "y" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>

                          {/* ACTIONS - Only Completed and Cancel buttons */}
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-success me-1"
                                onClick={() => handleCompleted(item)}
                                title="Mark as Completed"
                              >
                                Completed
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancel(item)}
                                title="Cancel Investigation"
                              >
                                Cancel
                              </button>
                            </div>


                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="13" className="text-center text-muted py-4">
                          <i className="fas fa-search fa-2x mb-3"></i>
                          <p>No records found matching your search</p>
                          {searchQuery && (
                            <button
                              className="btn btn-sm btn-outline-secondary mt-2"
                              onClick={() => setSearchQuery("")}
                            >
                              Clear Search
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Status Change</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => handleConfirm(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to{" "}
                      <strong>
                        {confirmDialog.newStatus === "y" ? "Activate" : "Deactivate"}
                      </strong>{" "}
                      <strong>"{confirmDialog.investigationName}"</strong>?
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleConfirm(false)}
                    >
                      No
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleConfirm(true)}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XRAYInvestigation;