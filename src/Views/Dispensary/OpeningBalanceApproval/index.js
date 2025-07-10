import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"


const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true);
  const [approvalData, setApprovalData] = useState([]);
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");
  const [popupMessage, setPopupMessage] = useState(null)



  const fetchOpenBalance = async () => {
    try {
      setLoading(true);
      const status = "p";
      const response = await getRequest(`${OPEN_BALANCE}/list/${status}`);

      if (response && Array.isArray(response)) {

        setApprovalData(response);
        console.log("Transformed approval data:", response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOpenBalance();
  }, []);

  useEffect(() => {
    console.log("approvalData updated:", approvalData);
  }, [approvalData]);


  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")



  const [detailEntries, setDetailEntries] = useState([])

  // Helper to format date to yyyy-mm-dd
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Filtered data based on date range (only when both dates are present)
  const filteredApprovalData = approvalData.filter((item) => {
    if (!fromDate || !toDate) return true;
    const itemDate = formatDate(item.enteredDt);
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    return itemDate >= from && itemDate <= to;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredApprovalData.length / itemsPerPage);
  const currentItems = filteredApprovalData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setSelectedRecord(item)
    setDetailEntries(item.openingBalanceDtResponseList)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
  }

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSubmit = async () => {
    console.log("Submitting id:", selectedRecord.balanceMId);

    const payload = {
      remark: remark || "",
      status: action || "",
    };

    try {
      const response = await putRequest(`${OPEN_BALANCE}/Approved/${selectedRecord.balanceMId}`, payload);
      setCurrentView("list");
      setSelectedRecord(null);
      showPopup(
        `${payload.status === "a" ? "Approved" : "Rejected"} successfully!`,
        "success"
      );
      await fetchOpenBalance();
      setSelectedRecord(null);
      setDetailEntries([]);
      setCurrentView("list");


    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };





  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...")
      pageNumbers.push(totalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }



  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Entry Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Entry Details Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedRecord?.enteredDt
                          ? new Date(selectedRecord.enteredDt).toLocaleDateString("en-GB")
                          : ""
                      }

                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.enteredBy || ""}
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
                  <div className="col-md-3 mt-3">
                    <button className="btn btn-success">Download Invoice</button>
                  </div>
                </div>

                {/* Detail Table */}
                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "200px", minWidth: "270px" }}>Drug Name</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Unit</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Batch No/ Serial No</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOM</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Qty</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Units Per Pack</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Purchase Rate/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>GST Percent</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>MRP/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Total Cost</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Brand Name</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.balanceMId}>
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
                              style={{ width: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemUnit}
                              style={{ width: "70px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              style={{ width: "140px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.manufactureDate}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.expiryDate}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.qty}
                              style={{ width: "70px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.unitsPerPack || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.purchaseRatePerUnit || ""}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.gstPercent || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.mrpPerUnit || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.totalPurchaseCost || ""}
                              readOnly
                              disabled
                              style={{ backgroundColor: "#e9ecef", minWidth: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.manufacturerName || ""}
                              style={{ minWidth: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />

                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.brandName || ""}
                              style={{ minWidth: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mb-3 mt-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Action</label>
                    <select
                      className="form-select"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="">Select Action</option>
                      <option value="a">Approve</option>
                      <option value="r">Reject</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Remark</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: "100px" }}
                      placeholder="Enter your remark here"
                      value={remark}
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

                    {action === "a" ? "Approve" : action === "r" ? "Reject" : "Submit"}

                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList} >
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
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval List</h4>
            </div>

            <div className="card-body">
              {/* Date Filter Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end"></div>
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-success" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              {/* Table Section */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Balance No.</th>
                      <th>Opening Balance Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.balanceMId}>
                        <td>{item.balanceNo}</td>
                        <td>{new Date(item.enteredDt).toLocaleDateString("en-GB")}</td>
                        <td>{item.departmentName}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.status === "p" ? "#ffc107" : item.status === "a" ? "#28a745" : "#6c757d",
                              color: item.status === "p" ? "#000" : "#fff",
                            }}
                          >
                            {item.status === "p"
                              ? "Pending for Approval"
                              : item.status === "a"
                                ? "Approved"
                                : item.status}
                          </span>
                        </td>
                        <td>{item.enteredBy}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleEdit(item)}
                            disabled={item.status !== "p"}
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {filteredApprovalData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval
