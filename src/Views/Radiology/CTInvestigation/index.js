import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const CTInvestigation = () => {
  const [ctData, setCtData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    investigationName: ""
  });

  /* -------- SAMPLE DATA -------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCtData([
        {
          id: 1,
          accessionNo: "Acc-260112-001",
          uhid: "UHID2001",
          patientName: "Suresh Yadav",
          age: "45",
          gender: "Male",
          modality: "CT",
          investigationName: "CT Brain",
          orderDate: "15/01/2026",
          orderTime: "10:30 AM",
          department: "Radiology",
          status: "y"
        },
        {
          id: 2,
          accessionNo: "Acc-260112-002",
          uhid: "UHID2002",
          patientName: "Anita Singh",
          age: "32",
          gender: "Female",
          modality: "CT",
          investigationName: "CT Chest",
          orderDate: "16/01/2026",
          orderTime: "01:15 PM",
          department: "Radiology",
          status: "n"
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* -------- SEARCH -------- */
  const filteredData = ctData.filter(item =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* -------- HELPERS -------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleSwitchChange = (id, newStatus, investigationName) => {
    setConfirmDialog({ isOpen: true, id, newStatus, investigationName });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed) {
      setCtData(prev =>
        prev.map(item =>
          item.id === confirmDialog.id
            ? { ...item, status: confirmDialog.newStatus }
            : item
        )
      );

      showPopup(
        `CT Investigation ${
          confirmDialog.newStatus === "y" ? "activated" : "deactivated"
        }`
      );
    }

    setConfirmDialog({
      isOpen: false,
      id: null,
      newStatus: "",
      investigationName: ""
    });
  };

  /* -------- UI -------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">CT Investigation</h4>

 
 <div className="d-flex gap-2">
  <input
    type="search"
    className="form-control"
    placeholder="Search by UHID or Patient Name"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{ width: "280px" }}
  />
  <button
    className="btn btn-success"
    onClick={() => setSearchQuery("")}
  >
    Show All
  </button>
</div>

</div>


  

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Accession No</th>
                    <th>UHID</th>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Modality</th>
                    <th>Investigation Name</th>
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
            <label className="form-check-label ms-2">
              {item.status === "y" ? "Active" : "Inactive"}
            </label>
          </div>
        </td>

        {/* ACTION */}
        <td>
          <span>Completed</span>
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
                    {confirmDialog.newStatus === "y"
                      ? "activate"
                      : "deactivate"}{" "}
                      </strong>
                    <strong>{confirmDialog.investigationName}</strong>?
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

export default CTInvestigation;
