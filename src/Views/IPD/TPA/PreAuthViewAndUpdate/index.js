import { useState, useEffect } from "react"
import LoadingScreen from "../../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination"
import Popup from "../../../../Components/popup"
import ConfirmationPopup from "../../../../Components/ConfirmationPopup"

const PreAuthViewAndUpdate = () => {
  // ─── View management ────────────────────────────────
  const [currentView, setCurrentView] = useState("list")   // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)

  // ─── Global loading / operation states ──────────────
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── List view states ───────────────────────────────
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [insuranceFilter, setInsuranceFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // ─── Preauth list data (placeholder) ────────────────
  const [preauthData, setPreauthData] = useState([])

  // ─── Detail view form state ─────────────────────────
  const [detailForm, setDetailForm] = useState({
    reqNo: "",
    patient: "",
    uhid: "",
    admNo: "",
    reqDate: "",
    insurance: "",
    estAmt: "",
    approved: "",
    status: "",
  })

  // ─── Dropdown options (UI only) ─────────────────────
  const insuranceOptions = [
    { id: 1, name: "Star Health" },
    { id: 2, name: "HDFC Ergo" },
    { id: 3, name: "ICICI Lombard" },
  ]

  const statusOptions = [
    { value: "s", label: "Draft" },
    { value: "p", label: "Submitted" },
    { value: "a", label: "Approved" },
    { value: "r", label: "Rejected" },
  ]

  // ─── Popup / Confirmation popup ─────────────────────
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null)

  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  const showConfirmation = (message, type, onConfirm, onCancel, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => { onConfirm(); setConfirmationPopup(null) },
      onCancel: onCancel ? () => { onCancel(); setConfirmationPopup(null) } : () => setConfirmationPopup(null),
      confirmText,
      cancelText,
    })
  }

  // ─── Status helpers ─────────────────────────────────
  const getStatusLabel = (status) => {
    const opt = statusOptions.find(o => o.value === status)
    return opt ? opt.label : status
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "p": return { backgroundColor: "#ffc107", color: "#000" }
      case "a": return { backgroundColor: "#28a745", color: "#fff" }
      case "r": return { backgroundColor: "#dc3545", color: "#fff" }
      default: return { backgroundColor: "#6c757d", color: "#fff" }
    }
  }

  // ─── Simulated data for UI (no real API) ────────────
  const mockListData = [
    { reqNo: "PR001", patient: "Ritesh", uhid: "UH12345", admNo: "ADM56789", reqDate: "2025-03-10", insurance: "Star Health", estAmt: 500000, approved: 500000, status: "a" },
    { reqNo: "PR002", patient: "Amit", uhid: "UH67890", admNo: "-", reqDate: "2025-03-12", insurance: "HDFC Ergo", estAmt: 250000, approved: 0, status: "r" },
    { reqNo: "PR003", patient: "Neha", uhid: "UH11223", admNo: "ADM33445", reqDate: "2025-03-15", insurance: "ICICI Lombard", estAmt: 300000, approved: null, status: "p" },
  ]

  // ─── API placeholders (replace with actual calls) ───
  const fetchPreauthList = async (page = 0, showLoading = true) => {
    if (showLoading) setLoading(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    setPreauthData(mockListData)
    setTotalPages(1)
    setTotalElements(mockListData.length)
    setLoading(false)
  }

  const fetchPreauthDetails = async (reqNo) => {
    setLoadingDetails(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))
    const found = mockListData.find(item => item.reqNo === reqNo)
    if (found) {
      setDetailForm({
        reqNo: found.reqNo,
        patient: found.patient,
        uhid: found.uhid,
        admNo: found.admNo,
        reqDate: found.reqDate,
        insurance: found.insurance,
        estAmt: found.estAmt?.toString() || "",
        approved: found.approved?.toString() || "",
        status: found.status,
      })
    }
    setLoadingDetails(false)
  }

  // ─── List view handlers ─────────────────────────────
  const handleSearch = async () => {
    setIsSearching(true)
    setCurrentPage(1)
    await fetchPreauthList(0, false)
    setIsSearching(false)
  }

  const handleShowAll = async () => {
    setIsShowingAll(true)
    setFromDate("")
    setToDate("")
    setInsuranceFilter("")
    setStatusFilter("")
    setSearchKeyword("")
    setCurrentPage(1)
    await fetchPreauthList(0, false)
    setIsShowingAll(false)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchPreauthList(page - 1)
  }

  const handleEditClick = async (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)
    await fetchPreauthDetails(record.reqNo)
    setCurrentView("detail")
  }

  // ─── Detail view handlers ───────────────────────────
  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    // Reset form if needed
  }

  const handleDetailFieldChange = (field, value) => {
    setDetailForm(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdateOrSubmit = async (newStatus) => {
    const action = newStatus === "p" ? "submit" : "update"
    showConfirmation(
      `Are you sure you want to ${action} this pre‑auth request?`,
      "info",
      async () => {
        try {
          if (newStatus === "s") setIsUpdating(true)
          else setIsSubmitting(true)
          // Placeholder: update API call
          await new Promise(resolve => setTimeout(resolve, 1000))
          showPopup(`Pre‑auth request ${action} successfully!`, "success")
          handleBackToList()
          fetchPreauthList(0)   // refresh list
        } catch (err) {
          showPopup(`Failed to ${action} request`, "error")
        } finally {
          setIsUpdating(false)
          setIsSubmitting(false)
        }
      },
      () => console.log(`${action} cancelled`)
    )
  }

  // ─── Initial data load ──────────────────────────────
  useEffect(() => {
    fetchPreauthList(0)
  }, [])

  // ─── RENDER: DETAIL VIEW ────────────────────────────
  if (currentView === "detail") {
    const isEditable = detailForm.status === "s" || detailForm.status === "r"

    return (
      <div className="content-wrapper">
        {(loading || loadingDetails) && <LoadingScreen />}
        {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
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
                <h4 className="card-title p-2 mb-0">Pre‑Auth Request Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Header info */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Request No</label>
                    <input type="text" className="form-control" value={detailForm.reqNo} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Request Date</label>
                    <input type="text" className="form-control" value={detailForm.reqDate} readOnly />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Status</label>
                    <div>
                      <span className="badge mt-1" style={getStatusColor(detailForm.status)}>
                        {getStatusLabel(detailForm.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Patient Name</label>
                    <input
                      type="text" className="form-control"
                      value={detailForm.patient}
                      onChange={(e) => handleDetailFieldChange("patient", e.target.value)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">UHID</label>
                    <input
                      type="text" className="form-control"
                      value={detailForm.uhid}
                      onChange={(e) => handleDetailFieldChange("uhid", e.target.value)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Admission No</label>
                    <input
                      type="text" className="form-control"
                      value={detailForm.admNo}
                      onChange={(e) => handleDetailFieldChange("admNo", e.target.value)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Insurance</label>
                    {isEditable ? (
                      <select
                        className="form-select"
                        value={detailForm.insurance}
                        onChange={(e) => handleDetailFieldChange("insurance", e.target.value)}
                      >
                        <option value="">Select Insurance</option>
                        {insuranceOptions.map(opt => (
                          <option key={opt.id} value={opt.name}>{opt.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="form-control" value={detailForm.insurance} readOnly />
                    )}
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Estimated Amount</label>
                    <input
                      type="number" className="form-control"
                      value={detailForm.estAmt}
                      onChange={(e) => handleDetailFieldChange("estAmt", e.target.value)}
                      readOnly={!isEditable}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved Amount</label>
                    <input
                      type="number" className="form-control"
                      value={detailForm.approved}
                      onChange={(e) => handleDetailFieldChange("approved", e.target.value)}
                      readOnly={!isEditable}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="d-flex justify-content-end mt-4">
                  {isEditable ? (
                    <>
                      <button
                        type="button" className="btn btn-warning me-2"
                        onClick={() => handleUpdateOrSubmit("s")}
                        disabled={isUpdating || isSubmitting || loadingDetails}
                      >
                        {isUpdating ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Updating...</>
                        ) : "Update"}
                      </button>
                      <button
                        type="button" className="btn btn-success me-2"
                        onClick={() => handleUpdateOrSubmit("p")}
                        disabled={isUpdating || isSubmitting || loadingDetails}
                      >
                        {isSubmitting ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...</>
                        ) : "Submit"}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary me-2" onClick={handleBackToList}>
                      Back
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER: LIST VIEW ──────────────────────────────
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
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
              <h4 className="card-title p-2 mb-0">Preauth Request List</h4>
            </div>

            <div className="card-body">
              {/* Filters */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date" className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date" className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Insurance</label>
                  <select
                    className="form-select"
                    value={insuranceFilter}
                    onChange={(e) => setInsuranceFilter(e.target.value)}
                  >
                    <option value="">All Insurance</option>
                    {insuranceOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">UHID / Patient Name</label>
                  <input
                    type="text" className="form-control"
                    placeholder="Enter UHID or Patient Name"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mt-3 d-flex align-items-end">
                  <button
                    type="button" className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isSearching ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Searching...</>
                    ) : "Search"}
                  </button>

                  <button
                    type="button" className="btn btn-secondary"
                    onClick={handleShowAll}
                    disabled={loading || isSearching || isShowingAll}
                  >
                    {isShowingAll ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Showing All...</>
                    ) : "Show All"}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Req No.</th>
                      <th>Patient</th>
                      <th>UHID</th>
                      <th>Adm No.</th>
                      <th>Req Date</th>
                      <th>Insurance</th>
                      <th>Est. Amt</th>
                      <th>Approved</th>
                      <th>Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4">
                          <LoadingScreen />
                        </td>
                      </tr>
                    ) : preauthData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          No preauth requests found.
                        </td>
                      </tr>
                    ) : (
                      preauthData.map((item) => (
                        <tr key={item.reqNo}>
                          <td>{item.reqNo}</td>
                          <td>{item.patient}</td>
                          <td>{item.uhid}</td>
                          <td>{item.admNo}</td>
                          <td>{item.reqDate}</td>
                          <td>{item.insurance}</td>
                          <td>₹{item.estAmt?.toLocaleString()}</td>
                          <td>{item.approved ? `₹${item.approved.toLocaleString()}` : "-"}</td>
                          <td>
                            <span className="badge" style={getStatusColor(item.status)}>
                              {getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              type="button" className="btn btn-sm btn-primary"
                              onClick={(e) => handleEditClick(item, e)}
                              title={item.status === "s" || item.status === "r" ? "Edit Request" : "View Request"}
                              disabled={loading}
                            >
                              <i className={item.status === "s" || item.status === "r" ? "fa fa-pencil" : "fa fa-eye"}></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreAuthViewAndUpdate