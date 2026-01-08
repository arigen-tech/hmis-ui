import { useState, useRef, useEffect } from "react"
import { OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"
import Popup from "../../../Components/popup"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";


const PhysicalStockAdjustmentApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [physicalStockData, setPhysicalStockData] = useState([])
  const [processing, setProcessing] = useState(false)

  const [popupMessage, setPopupMessage] = useState(null)


  const [fromDate, setFromDate] = useState("2025-07-17")
  const [toDate, setToDate] = useState("2025-07-17")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");


  const [detailEntries, setDetailEntries] = useState([])
  const [selectedAction, setSelectedAction] = useState("")
  const [remark, setRemark] = useState("")

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = physicalStockData.slice(indexOfFirst, indexOfLast);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }


  const fatchPhysicalStock = async () => {
    try {
      const status = "p";
      const response = await getRequest(`${OPEN_BALANCE}/listPhysical/${status}/${hospitalId}/${departmentId}`);
      if (response) {
        setPhysicalStockData(response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
    }
  };

  useEffect(() => {
    fatchPhysicalStock();
  }, []);

  const handleEdit = (item) => {
    setSelectedRecord(item)
    setDetailEntries(item.storeStockTakingTResponseList)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setSelectedAction("")
    setRemark("")
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
  }

 

  const handleSubmit = async () => {
    if (!selectedAction) {
      alert("Please select an action");
      return;
    }

    if (!remark.trim()) {
      alert("Please enter a remark");
      return;
    }
    const payload = {
      status: selectedAction,
      takingMId: selectedRecord.takingMId,
      reason: remark,
    }
    try {
      setProcessing(true);

      const response = await putRequest(
        `${OPEN_BALANCE}/approvedPhysical`,
        payload
      );

      if (response && response.response) {
        showPopup("Stock adjustment submitted successfully!", "success");
        // handleReset();
        handleBackToList();
      } else {
        showPopup("Failed to submit stock adjustment. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error submitting stock adjustment:", error);
      showPopup("Error submitting stock adjustment. Please try again.", "error");
    } finally {
      setProcessing(false);
      console.log("Submitting stock adjustment:");
    }
  };


  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  }

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Physical Stock Adjustment Approval Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {/* Entry Details Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Stock Taking Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedRecord?.physicalDate) || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Stock Taking Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.stockTakingNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                </div>

                {/* Detail Table */}
                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead >
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "300px", minWidth: "300px" }}>Drug Name</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Batch No.</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Computed Stock</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Physical Stock</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Surplus</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Deficient</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="text-center">
                            <input
                              type="text"
                              className="form-control text-center"
                              value={index + 1}
                              style={{ width: "50px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemCode}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemName}
                              style={{ width: "280px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={formatDate(entry.expiryDate)}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.computedStock}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.storeStockService}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.stockSurplus}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.stockDeficient}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.remarks}
                              style={{ width: "180px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Approval Section */}
                <div className="row mb-3 mt-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Action</label>
                    <select
                      className="form-select"
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                    >
                      <option value="">Select Action</option>
                      <option value="a">Approve</option>
                      <option value="r">Reject</option>
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold mb-1">Remark</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={remark || selectedRecord.reason}
                      placeholder="Enter your remark here"
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn me-2"
                    style={{ backgroundColor: "#e67e22", color: "white" }}
                    onClick={handleSubmit}
                  >
                    {selectedAction === "a"
                      ? "Approve"
                      : selectedAction === "r"
                        ? "Reject"
                        : "Submit"}

                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
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
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Physical Stock Taking/Stock Adjustment Approval</h4>
            </div>
            {popupMessage && (
              <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
            )}
            <div className="card-body">
              {/* Date Filter Section */}
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"

                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleShowAll}
                  >
                    Show All
                  </button>
                </div>
              </div>



              {/* Table Section */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Stock Taking No.</th>
                      <th>Stock Taking Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.stockTakingNo}</td>
                        <td>{formatDate(item.physicalDate)}</td>
                        <td>{item.departmentName}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.status === "p" ? "#ffc107" : "#28a745",
                              color: item.status === "Pending for Approval" ? "#000" : "#fff",
                            }}
                          >
                            {"Pending for Approval"}
                          </span>
                        </td>
                        <td>{item.createdBy}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                                            totalItems={physicalStockData.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhysicalStockAdjustmentApproval
