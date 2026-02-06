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
          status: "n"
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = xrayData.filter(item =>
    item.accessionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase())
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
        `XRAY Investigation ${
          confirmDialog.newStatus === "y" ? "Activated" : "Deactivated"
        } Successfully`
      );
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", investigationName: "" });
  };

  /* ---------------- ACTION HANDLERS ---------------- */
  const handleView = (row) => {
    showPopup(`Viewing ${row.investigationName}`, "info");
  };

  const handleEdit = (row) => {
    showPopup(`Editing ${row.investigationName}`, "success");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">XRAY Investigation</h4>

          <div className="d-flex gap-2">
            <input
              type="search"
              className="form-control"
              placeholder="Search by Accession No / UHID / Patient Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "300px" }}
            />
            <button className="btn btn-success" onClick={() => setSearchQuery("")}>
              Show All
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Accession No</th>
                    <th>UHID</th>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>Gender</th>
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

                        {/* ACTION */}
                       <td>
  <td>
  <span>Completed</span>
</td>

</td>

               </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

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
            <div className="modal d-block">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5>Confirm Status Change</h5>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to{" "}
                    <strong>
                      {confirmDialog.newStatus === "y" ? "Activate" : "Deactivate"}
                    </strong>{" "}
                    <strong>{confirmDialog.investigationName}</strong>?
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                      No
                    </button>
                    <button className="btn btn-primary" onClick={() => handleConfirm(true)}>
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
