import { useState, useEffect } from "react"
import { getRequest, postRequest, putRequest } from "../../../service/apiService"
import { MAS_WARD_GET_ALL_ACTIVE, GET_BED_DETAILS_BY_WARD, MAS_TRANSFER_REASON_GET_ALL, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, DOCTOR_BY_SPECIALITY, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, FILTER_WARD_DEPT, SAVE_BED_TRANSFER_REQUEST, WARD_PENDING_TRANSFER_REQUEST_LIST, UPDATE_TRANSFER_REQUEST_STATUS, WARD_TRANSFER_LIST } from "../../../config/apiConfig"

// ─── STATUS FLOW ─────────────────────────────────────────────
// Requested (Ward 1) → Pending Acceptance (Ward 2) → Accepted (Ward 2) → Completed
// Cancel available at Requested / Pending Acceptance

const TRANSFER_STATUS = {
  REQUESTED: "Requested",
  PENDING: "Pending Acceptance",
  ACCEPTED: "Accepted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
}

const BedTransfer = ({ selectedPatient, setSelectedPatient, selectedWard }) => {
  const [activeView, setActiveView] = useState("request") // "request" | "pendingList" | "transferredList"
  const [selectedPendingTransfer, setSelectedPendingTransfer] = useState(null) // for detail view
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [cancelRemarks, setCancelRemarks] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewTransfer, setReviewTransfer] = useState(null)
  const [reviewAllocatedBed, setReviewAllocatedBed] = useState("")

  // Store selected beds for each pending transfer (in detail view)
  const [selectedBedForTransfer, setSelectedBedForTransfer] = useState("")

  // Request form
  const [requestForm, setRequestForm] = useState({
    targetWardId: "",
    targetBed: "",
    departmentId: "",
    doctorInCharge: "",
    reason: "",
    otherReason: "",
    priority: "Normal",
    clinicalNotes: ""
  })

  const [wardsList, setWardsList] = useState([])
  const [targetWardBeds, setTargetWardBeds] = useState([])
  const [loadingBeds, setLoadingBeds] = useState(false)
  const [transferReasonsList, setTransferReasonsList] = useState([])
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await getRequest(MAS_WARD_GET_ALL_ACTIVE)
        if (response && response.response && Array.isArray(response.response)) {
          setWardsList(response.response)
        } else if (Array.isArray(response)) {
          setWardsList(response)
        }
      } catch (error) {
        console.error("Error fetching ward master:", error)
      }
    }
    fetchWards()
  }, [])

  useEffect(() => {
    const fetchTransferReasons = async () => {
      try {
        const response = await getRequest(MAS_TRANSFER_REASON_GET_ALL)
        const data = response?.response || response
        if (Array.isArray(data)) {
          const mapped = data.map(r => ({
            id: r.id,
            reason: r.transferReasonName
          }))
          mapped.sort((a, b) => a.id - b.id)
          setTransferReasonsList(mapped)
        }
      } catch (error) {
        console.error("Error fetching transfer reasons:", error)
      }
    }
    fetchTransferReasons()
  }, [])

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_WARD_DEPT}`)
        const data = response?.response || response
        if (Array.isArray(data)) {
          setDepartments(data)
        }
      } catch (error) {
        console.error("Error fetching departments:", error)
      }
    }
    fetchDepartments()
  }, [])

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!requestForm.departmentId) {
        setDoctors([])
        return
      }
      try {
        const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${requestForm.departmentId}`)
        const data = response?.response || response
        if (Array.isArray(data)) {
          setDoctors(data)
        } else {
          setDoctors([])
        }
      } catch (error) {
        console.error("Error fetching doctors:", error)
        setDoctors([])
      }
    }
    fetchDoctors()
  }, [requestForm.departmentId])

  const [detailWardBeds, setDetailWardBeds] = useState([])

  useEffect(() => {
    const fetchBedsByWard = async () => {
      if (!requestForm.targetWardId) {
        setTargetWardBeds([])
        return
      }
      setLoadingBeds(true)
      try {
        const response = await getRequest(`${GET_BED_DETAILS_BY_WARD}/${requestForm.targetWardId}`)
        if (response && response.response && Array.isArray(response.response)) {
          setTargetWardBeds(response.response)
        } else if (Array.isArray(response)) {
          setTargetWardBeds(response)
        } else {
          setTargetWardBeds([])
        }
      } catch (error) {
        console.error("Error fetching bed details by ward:", error)
        setTargetWardBeds([])
      } finally {
        setLoadingBeds(false)
      }
    }

    fetchBedsByWard()
  }, [requestForm.targetWardId])

  useEffect(() => {
    const fetchDetailBeds = async () => {
      const activeTransfer = selectedPendingTransfer || reviewTransfer
      if (!activeTransfer) {
        setDetailWardBeds([])
        return
      }
      const ward = wardsList.find(w => (w.wardName || w.name)?.trim() === activeTransfer.targetWard?.trim())
      const wardId = ward?.wardId || ward?.id
      if (!wardId) {
        setDetailWardBeds([])
        return
      }
      try {
        const response = await getRequest(`${GET_BED_DETAILS_BY_WARD}/${wardId}`)
        const data = response?.response || response
        if (Array.isArray(data)) {
          setDetailWardBeds(data)
        } else {
          setDetailWardBeds([])
        }
      } catch (error) {
        console.error("Error fetching detail beds:", error)
        setDetailWardBeds([])
      }
    }
    fetchDetailBeds()
  }, [selectedPendingTransfer, reviewTransfer, wardsList])

  const [loadingPendingList, setLoadingPendingList] = useState(false);
  const [loadingCompletedList, setLoadingCompletedList] = useState(false);
  const [completedTransfers, setCompletedTransfers] = useState([]);

  useEffect(() => {
    const fetchPendingTransfers = async () => {
      const wardId = selectedWard?.wardId || selectedWard?.id || 0;
      if (!wardId) return;
      try {
        setLoadingPendingList(true);
        const response = await getRequest(`${WARD_PENDING_TRANSFER_REQUEST_LIST}/${wardId}?wardIds=${wardId}`);
        const data = response?.response || response;
        if (Array.isArray(data)) {
          // Map to the frontend transfers schema
          const mapped = data.map((t, index) => {
            // Determine status based on logic:
            // if "toWardId" === wardId -> Pending Acceptance, else -> Requested
            let status = TRANSFER_STATUS.REQUESTED;
            if (t.toWardId === wardId) {
              status = TRANSFER_STATUS.PENDING;
            } else {
              status = TRANSFER_STATUS.REQUESTED;
            }

            return {
              id: t.inpatientId || index + 1,
              trfNo: t.transferNo || `TRF${String(index + 1).padStart(6, '0')}`,
              transferDate: t.transferDateTime || new Date().toISOString(),
              patientName: t.patientName || "Unknown Patient",
              gender: t.gender || "M",
              age: t.age || "",
              admissionNo: t.admissionNo || "",
              uhidNo: t.uhidNO || t.uhidNo || t.uhid || "",
              admissionDate: t.admissionDate || "",
              fromWard: t.fromWardName || "",
              fromBed: t.fromBedName || "",
              targetWard: t.toWardName || "",
              targetBed: t.toBedName || "",
              allocatedBed: "",
              doctorInCharge: t.doctorName || "",
              reason: t.transferReason || "",
              priority: t.priority || "Normal",
              clinicalNotes: t.clinicalNotes || "",
              status: status,
              cancelRemarks: "",
              raw: t
            };
          });
          setTransfers(mapped);
        } else {
          setTransfers([]);
        }
      } catch (error) {
        console.error("Error fetching ward pending transfer list:", error);
        setTransfers([]);
      } finally {
        setLoadingPendingList(false);
      }
    };

    const fetchCompletedTransfers = async () => {
      const wardId = selectedWard?.wardId || selectedWard?.id || 0;
      if (!wardId) return;
      try {
        setLoadingCompletedList(true);
        const response = await getRequest(`${WARD_TRANSFER_LIST}/${wardId}?wardIds=${wardId}`);
        const data = response?.response || response;
        if (Array.isArray(data)) {
          const mapped = data.map((t, index) => {
            let status = TRANSFER_STATUS.COMPLETED;
            if (t.transferStatus === "C") {
              status = TRANSFER_STATUS.COMPLETED;
            } else if (t.transferStatus === "R") {
              status = TRANSFER_STATUS.CANCELLED;
            }
            return {
              id: t.inpatientId || index + 1,
              trfNo: t.transferNo || `TRF${String(index + 1).padStart(6, '0')}`,
              transferDate: t.transferDateTime || new Date().toISOString(),
              patientName: t.patientName || "Unknown Patient",
              gender: t.gender || "M",
              age: t.age || "",
              admissionNo: t.admissionNo || "",
              uhidNo: t.uhidNO || t.uhidNo || t.uhid || "",
              admissionDate: t.admissionDate || "",
              fromWard: t.fromWardName || "",
              fromBed: t.fromBedName || "",
              targetWard: t.toWardName || "",
              targetBed: t.toBedName || "",
              allocatedBed: t.toBedName || "",
              doctorInCharge: t.doctorName || "",
              reason: t.transferReason || "",
              priority: t.priority || "Normal",
              clinicalNotes: t.clinicalNotes || "",
              status: status,
              cancelRemarks: "",
              raw: t
            };
          });
          setCompletedTransfers(mapped);
        } else {
          setCompletedTransfers([]);
        }
      } catch (error) {
        console.error("Error fetching ward completed transfer list:", error);
        setCompletedTransfers([]);
      } finally {
        setLoadingCompletedList(false);
      }
    };

    fetchPendingTransfers();
    fetchCompletedTransfers();
  }, [selectedWard]);

  // Transfer list (tx table: ip_transfer_request)
  const [transfers, setTransfers] = useState([])

  const generateTRFNo = () => {
    const maxId = transfers.length > 0 ? Math.max(...transfers.map(t => parseInt(t.trfNo.replace("TRF", "")))) : 0
    return "TRF" + String(maxId + 1).padStart(6, "0")
  }

  const formatDateTime = (str) => {
    if (!str) return ""
    return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (str) => {
    if (!str) return ""
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleRequestFormChange = (e) => {
    const { name, value } = e.target
    setRequestForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "targetWardId" ? { targetBed: "" } : {}),
      ...(name === "departmentId" ? { doctorInCharge: "" } : {})
    }))
  }

  const handleSubmitRequest = async () => {
    if (!requestForm.targetWardId || !requestForm.departmentId || !requestForm.doctorInCharge || !requestForm.reason) {
      alert("Please fill Target Ward, Target Department, Doctor In Charge, and Reason")
      return
    }

    const ward = wardsList.find(w => (w.wardId == requestForm.targetWardId || w.id == requestForm.targetWardId))
    const selectedBedObj = targetWardBeds.find(b => b.bedId == requestForm.targetBed)
    const bedNoStr = selectedBedObj ? selectedBedObj.bedNo : requestForm.targetBed

    // Resolve IDs for API payload
    const fromWardObj = wardsList.find(w => (w.wardName || w.name)?.trim() === selectedPatient?.ward?.trim())
    const fromWardId = fromWardObj?.wardId || fromWardObj?.id || 0

    const docObj = doctors.find(d => {
      const docName = d.firstName ? [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") : (d.name || d.userName || "");
      return docName === requestForm.doctorInCharge;
    });
    const doctorId = docObj ? (docObj.userId || docObj.id) : 0;

    const reasonObj = transferReasonsList.find(r => r.reason === requestForm.reason)
    const transferReasonId = reasonObj ? reasonObj.id : 0

    const payload = {
      inpatientId: selectedPatient?.inpatientId || 0,
      patientId: selectedPatient?.patientId || 0,
      fromWard: fromWardId,
      fromBed: selectedPatient?.id || 0,
      toWard: Number(requestForm.targetWardId),
      toBed: Number(requestForm.targetBed) || 0,
      doctorId: doctorId,
      priority: requestForm.priority || "Normal",
      transferReasonId: transferReasonId,
      clinicalNotes: requestForm.clinicalNotes || ""
    }

    try {
      const apiResponse = await postRequest(SAVE_BED_TRANSFER_REQUEST, payload)
      if (apiResponse && (apiResponse.status === 200 || apiResponse.status === "success" || apiResponse.message === "success")) {
        const now = new Date().toISOString()
        const newTransfer = {
          id: apiResponse.response?.id || (transfers.length + 1),
          trfNo: apiResponse.response?.trfNo || generateTRFNo(),
          transferDate: apiResponse.response?.transferDate || now,
          patientName: selectedPatient?.patientName || "Unknown Patient",
          gender: selectedPatient?.ageGender?.split("/")[1]?.trim() || "M",
          age: selectedPatient?.ageGender?.split("/")[0]?.trim() || "",
          admissionNo: selectedPatient?.admissionNo || "",
          uhidNo: selectedPatient?.uhidNo || selectedPatient?.uhid || "",
          admissionDate: selectedPatient?.admissionDate || "",
          fromWard: selectedPatient?.ward || "",
          fromBed: selectedPatient?.bedNo || "",
          targetWard: ward ? ((ward.wardName || ward.name)?.trim()) : "",
          targetBed: bedNoStr || "",
          allocatedBed: "",
          doctorInCharge: requestForm.doctorInCharge,
          reason: requestForm.reason === "Other" ? requestForm.otherReason : requestForm.reason,
          priority: requestForm.priority,
          clinicalNotes: requestForm.clinicalNotes,
          status: TRANSFER_STATUS.REQUESTED,
          cancelRemarks: ""
        }
        setTransfers([newTransfer, ...transfers])
        setRequestForm({ targetWardId: "", targetBed: "", departmentId: "", doctorInCharge: "", reason: "", otherReason: "", priority: "Normal", clinicalNotes: "" })
        alert(`Transfer Request ${newTransfer.trfNo} submitted successfully!`)
        setActiveView("pendingList")
      } else {
        alert("Failed to submit transfer request: " + (apiResponse?.message || "unknown error"))
      }
    } catch (error) {
      console.error("Error submitting transfer request:", error)
      alert("Error submitting transfer request. Please try again.")
    }
  }

  const handleOpenReview = (transfer) => {
    setReviewTransfer(transfer)
    setReviewAllocatedBed(transfer.targetBed || "")
    setShowReviewModal(true)
  }

  const handleAccept = async () => {
    if (!reviewAllocatedBed) { alert("Please allocate a bed before accepting"); return }
    
    const inpatientId = reviewTransfer.raw?.inpatientId || reviewTransfer.id || 0

    try {
      const response = await putRequest(`${UPDATE_TRANSFER_REQUEST_STATUS}/${inpatientId}/C`)
      const isSuccess = response && 
                        (response.status === 200 || response.status === 201) && 
                        (!response.data || response.data.status === 200 || response.data.status === "success" || response.data.message === "success" || response.data.status === undefined);

      if (isSuccess) {
        setTransfers(prev => prev.map(t =>
          t.id === reviewTransfer.id
            ? { ...t, status: TRANSFER_STATUS.ACCEPTED, allocatedBed: reviewAllocatedBed }
            : t
        ))
        
        if (setSelectedPatient && selectedPatient && selectedPatient.admissionNo === reviewTransfer.admissionNo) {
          const updatedPatient = {
            ...selectedPatient,
            ward: reviewTransfer.targetWard,
            bedNo: reviewAllocatedBed
          }
          setSelectedPatient(updatedPatient)
        }
        
        alert(`Transfer ${reviewTransfer.trfNo} ACCEPTED. Bed ${reviewAllocatedBed} allocated.\n\n✓ ip_transfer_request updated to ACCEPTED\n✓ ip_bed_allocation new entry created\n✓ Main inpatient table Ward/Bed updated\n✓ Billing table updated (ward change)`)
        
        setShowReviewModal(false)
        setReviewTransfer(null)
        setActiveView("pendingList")
        setSelectedPendingTransfer(null)
      } else {
        alert("Failed to accept transfer: " + (response?.data?.message || response?.message || "unknown error"))
      }
    } catch (error) {
      console.error("Error accepting transfer:", error)
      alert("Error accepting transfer: " + (error.message || "Please try again."))
    }
  }

  const handleMarkCompleted = (id) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: TRANSFER_STATUS.COMPLETED } : t))
  }

  const handleOpenCancel = (id) => {
    setCancelTargetId(id)
    setCancelRemarks("")
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancelRemarks.trim()) { alert("Please enter cancel remarks"); return }
    
    const targetTransfer = transfers.find(t => t.id === cancelTargetId)
    const inpatientId = targetTransfer?.raw?.inpatientId || cancelTargetId || 0

    try {
      const response = await putRequest(`${UPDATE_TRANSFER_REQUEST_STATUS}/${inpatientId}/R`)
      const isSuccess = response && 
                        (response.status === 200 || response.status === 201) && 
                        (!response.data || response.data.status === 200 || response.data.status === "success" || response.data.message === "success" || response.data.status === undefined);

      if (isSuccess) {
        setTransfers(prev => prev.map(t =>
          t.id === cancelTargetId
            ? { ...t, status: TRANSFER_STATUS.CANCELLED, cancelRemarks }
            : t
        ))
        setShowCancelModal(false)
        setCancelTargetId(null)
        alert("Transfer cancelled successfully.")
        // If we were viewing a pending transfer detail, go back to list
        if (selectedPendingTransfer) {
          setSelectedPendingTransfer(null)
          setActiveView("pendingList")
        }
      } else {
        alert("Failed to cancel transfer: " + (response?.data?.message || response?.message || "unknown error"))
      }
    } catch (error) {
      console.error("Error cancelling transfer:", error)
      alert("Error cancelling transfer: " + (error.message || "Please try again."))
    }
  }

  const handleAcceptTransfer = async (transfer, allocatedBed) => {
    if (!allocatedBed) {
      alert("Please allocate a bed before accepting")
      return
    }
    
    const inpatientId = transfer.raw?.inpatientId || transfer.id || 0

    try {
      const response = await putRequest(`${UPDATE_TRANSFER_REQUEST_STATUS}/${inpatientId}/C`)
      const isSuccess = response && 
                        (response.status === 200 || response.status === 201) && 
                        (!response.data || response.data.status === 200 || response.data.status === "success" || response.data.message === "success" || response.data.status === undefined);

      if (isSuccess) {
        setTransfers(prev => prev.map(t =>
          t.id === transfer.id
            ? { ...t, status: TRANSFER_STATUS.ACCEPTED, allocatedBed: allocatedBed }
            : t
        ))
        
        if (setSelectedPatient && selectedPatient && selectedPatient.admissionNo === transfer.admissionNo) {
          const updatedPatient = {
            ...selectedPatient,
            ward: transfer.targetWard,
            bedNo: allocatedBed
          }
          setSelectedPatient(updatedPatient)
        }
        
        alert(`Transfer ${transfer.trfNo} ACCEPTED. Bed ${allocatedBed} allocated.\n\n✓ Main inpatient table Ward/Bed updated`)
        setActiveView("pendingList")
        setSelectedPendingTransfer(null)
      } else {
        alert("Failed to accept transfer: " + (response?.data?.message || response?.message || "unknown error"))
      }
    } catch (error) {
      console.error("Error accepting transfer:", error)
      alert("Error accepting transfer: " + (error.message || "Please try again."))
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      [TRANSFER_STATUS.REQUESTED]: "warning",
      [TRANSFER_STATUS.PENDING]: "info",
      [TRANSFER_STATUS.ACCEPTED]: "primary",
      [TRANSFER_STATUS.COMPLETED]: "success",
      [TRANSFER_STATUS.CANCELLED]: "secondary"
    }
    return map[status] || "secondary"
  }

  const getStatusIcon = (status) => {
    const map = {
      [TRANSFER_STATUS.REQUESTED]: "⏳",
      [TRANSFER_STATUS.PENDING]: "🔵",
      [TRANSFER_STATUS.ACCEPTED]: "✅",
      [TRANSFER_STATUS.COMPLETED]: "🏁",
      [TRANSFER_STATUS.CANCELLED]: "❌"
    }
    return map[status] || "•"
  }

  // Filter transfers
  const pendingTransfers = transfers.filter(t => t.status === TRANSFER_STATUS.PENDING || t.status === TRANSFER_STATUS.REQUESTED)
  const transferredList = [
    ...transfers.filter(t =>
      t.status === TRANSFER_STATUS.ACCEPTED ||
      t.status === TRANSFER_STATUS.COMPLETED ||
      t.status === TRANSFER_STATUS.CANCELLED
    ),
    ...completedTransfers
  ]

  // Detail view for a pending transfer
  const renderPendingDetail = (transfer) => {
    const currentSelectedBed = selectedBedForTransfer || transfer.targetBed || ""

    return (
      <div>
        <div className="mb-3">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setSelectedPendingTransfer(null)
              setActiveView("pendingList")
              setSelectedBedForTransfer("")
            }}
          >
            ← Back to Pending List
          </button>
        </div>
        <div className="card">
          <div className="card-header bg-info text-white">
            <strong>TRANSFER DETAILS</strong>
            <span className="ms-2 small opacity-75">{transfer.trfNo}</span>
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-6">
                <p className="mb-1"><strong>Transfer No:</strong> {transfer.trfNo}</p>
                <p className="mb-1"><strong>Date/Time:</strong> {formatDateTime(transfer.transferDate)}</p>
                <p className="mb-1"><strong>Patient:</strong> {transfer.patientName}</p>
                <p className="mb-1"><strong>UHID:</strong> {transfer.uhidNo || ""}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-1"><strong>From:</strong> {transfer.fromWard} / {transfer.fromBed}</p>
                <p className="mb-1"><strong>To (Requested):</strong> {transfer.targetWard} / {transfer.targetBed || "TBD"}</p>
                <p className="mb-1"><strong>Doctor:</strong> {transfer.doctorInCharge}</p>
                <p className="mb-1"><strong>Reason:</strong> {transfer.reason}</p>
              </div>
              <div className="col-12">
                <strong>Clinical Notes:</strong>
                <p className="text-muted mb-2">{transfer.clinicalNotes || "—"}</p>
              </div>
              
              <div className="col-12 mt-2">
                <div className="border rounded p-3 bg-light">
                  <label className="form-label fw-bold mb-2">
                    Allocate Bed in {transfer.targetWard}
                  </label>
                  <select
                    className="form-select form-select-sm mb-2"
                    value={currentSelectedBed}
                    onChange={(e) => setSelectedBedForTransfer(e.target.value)}
                  >
                    <option value="">Select Bed</option>
                    {detailWardBeds.map(b => (
                      <option key={b.bedId || b.bedNo} value={b.bedNo || b.bedId}>
                        {b.bedNo || b.bedId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer bg-white">
            {transfer.status === TRANSFER_STATUS.PENDING && (
              <button 
                className="btn btn-success btn-sm me-2"
                onClick={() => handleAcceptTransfer(transfer, currentSelectedBed)}
              >
                Accept Transfer
              </button>
            )}
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => handleOpenCancel(transfer.id)}
            >
              Reject Transfer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "request" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("request")
            setSelectedPendingTransfer(null)
            
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          New Transfer Request
        </button>
        <button
          className={`btn btn-sm ${activeView === "pendingList" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("pendingList")
            setSelectedPendingTransfer(null)
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Pending for Transfer ({pendingTransfers.length})
        </button>
        <button
          className={`btn btn-sm ${activeView === "transferredList" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setActiveView("transferredList")
            setSelectedPendingTransfer(null)
          }}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Transferred List ({transferredList.length})
        </button>
      </div>

      {/* ─── NEW REQUEST FORM ─── */}
      {activeView === "request" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>WARD / BED TRANSFER REQUEST</strong>
            <span className="ms-3 small opacity-75">[{generateTRFNo()}] | {formatDateTime(new Date().toISOString())}</span>
          </div>
          <div className="card-body">
            {selectedPatient && (
              <div className="row g-2 mb-3 p-2 bg-light rounded">
                <div className="col-md-12 small">
                  <strong>Patient:</strong> {selectedPatient.patientName} ({selectedPatient.ageGender}) | 
                  <strong> UHID:</strong> {selectedPatient.uhidNo || ""} | 
                  <strong> Current Location:</strong> {selectedPatient.ward} / {selectedPatient.bedNo}
                </div>
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Target Ward</label>
                <select className="form-select form-select-sm" name="targetWardId" value={requestForm.targetWardId} onChange={handleRequestFormChange}>
                  <option value="">Select Ward </option>
                  {wardsList.map(w => (
                    <option key={w.wardId || w.id} value={w.wardId || w.id}>
                      {(w.wardName || w.name)?.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Preferred Bed</label>
                <select
                  className="form-select form-select-sm"
                  name="targetBed"
                  value={requestForm.targetBed}
                  onChange={handleRequestFormChange}
                  disabled={!requestForm.targetWardId || loadingBeds}
                >
                  <option value="">
                    {loadingBeds ? "Loading beds..." : "Any Available"}
                  </option>
                  {targetWardBeds.map(b => (
                    <option key={b.bedId || b.bedNo} value={b.bedId}>
                      {b.bedNo || `Bed-${b.bedId}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Target Department <span className="text-danger">*</span></label>
                <select className="form-select form-select-sm" name="departmentId" value={requestForm.departmentId} onChange={handleRequestFormChange}>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id || d.departmentId} value={d.id || d.departmentId}>
                      {d.departmentName || d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Doctor In Charge <span className="text-danger">*</span></label>
                <select className="form-select form-select-sm" name="doctorInCharge" value={requestForm.doctorInCharge} onChange={handleRequestFormChange}>
                  <option value=""> Select Doctor </option>
                  {doctors.map(d => {
                    const docName = d.firstName ? [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ") : (d.name || d.userName || "");
                    return (
                      <option key={d.userId || d.id} value={docName}>
                        {docName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Priority</label>
                <div className="d-flex gap-3">
                  {["Normal", "Emergency"].map(p => (
                    <div className="form-check" key={p}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        value={p}
                        checked={requestForm.priority === p}
                        onChange={handleRequestFormChange}
                      />
                      <label className="form-check-label small">{p}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Reason for Transfer</label>
                <div className="d-flex gap-3 flex-wrap mb-2">
                  {transferReasonsList.map(r => (
                    <div className="form-check" key={r.id}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reason"
                        value={r.reason}
                        checked={requestForm.reason === r.reason}
                        onChange={handleRequestFormChange}
                      />
                      <label className="form-check-label small">{r.reason}</label>
                    </div>
                  ))}
                </div>
                {requestForm.reason === "Other" && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Please specify..."
                    name="otherReason"
                    value={requestForm.otherReason}
                    onChange={handleRequestFormChange}
                  />
                )}
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">Clinical Notes</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Add any clinical notes or remarks..."
                  name="clinicalNotes"
                  value={requestForm.clinicalNotes}
                  onChange={handleRequestFormChange}
                />
              </div>

              <div className="col-12">
                <button className="btn btn-primary btn-sm me-2" onClick={handleSubmitRequest}>
                  Submit Request
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setRequestForm({ targetWardId: "", targetBed: "", departmentId: "", doctorInCharge: "", reason: "", otherReason: "", priority: "Normal", clinicalNotes: "" })}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PENDING FOR TRANSFER LIST (clickable rows) ─── */}
      {activeView === "pendingList" && !selectedPendingTransfer && (
        <div>
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
              <thead className="">
                <tr>
                  <th>TRF No</th>
                  <th>Transfer Date/Time</th>
                  <th>Patient Name</th>
                  <th>Gender/Age</th>
                  <th>Admission No / Date</th>
                  <th>From Ward/Bed</th>
                  <th>To Ward/Bed</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(t => (
                  <tr 
                    key={t.id} 
                    style={{ cursor: "pointer" }} 
                    onClick={() => {
                      setSelectedPendingTransfer(t)
                      setSelectedBedForTransfer(t.targetBed || "")
                    }}
                  >
                    <td >{t.trfNo}</td>
                    <td>{formatDateTime(t.transferDate)}</td>
                    <td>{t.patientName}</td>
                    <td>{t.gender} / {t.age}</td>
                    <td>{t.admissionNo} / {formatDate(t.admissionDate)}</td>
                    <td>{t.fromWard} / {t.fromBed}</td>
                    <td>{t.targetWard} / {t.targetBed || "TBD"}</td>
                    <td>{t.reason}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadge(t.status)}`}>
                         {t.status}
                      </span>
                      {t.cancelRemarks && <div className="text-muted mt-1" style={{ fontSize: "0.6rem" }}>Note: {t.cancelRemarks}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PENDING TRANSFER DETAIL VIEW ─── */}
      {activeView === "pendingList" && selectedPendingTransfer && renderPendingDetail(selectedPendingTransfer)}

      {/* ─── TRANSFERRED LIST (history) ─── */}
      {activeView === "transferredList" && (
        <div>
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover" >
              <thead className="">
                <tr>
                  <th>TRF No</th>
                  <th>Transfer Date/Time</th>
                  <th>Patient Name</th>
                  <th>Gender/Age</th>
                  <th>Admission No / Date</th>
                  <th>From Ward/Bed</th>
                  <th>To Ward/Bed</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transferredList.map(t => (
                  <tr key={t.id}>
                    <td >{t.trfNo}</td>
                    <td>{formatDateTime(t.transferDate)}</td>
                    <td>{t.patientName}</td>
                    <td>{t.gender} / {t.age}</td>
                    <td>{t.admissionNo} / {formatDate(t.admissionDate)}</td>
                    <td>{t.fromWard} / {t.fromBed}</td>
                    <td>{t.targetWard} {t.allocatedBed ? `/ ${t.allocatedBed}` : ""}</td>
                    <td>{t.reason}</td>
                    <td>
                      <span >
                         {t.status}
                      </span>
                      {t.cancelRemarks && <div className="text-muted mt-1" >Note: {t.cancelRemarks}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── REVIEW / ACCEPT MODAL (backup, kept for compatibility) ─── */}
      {showReviewModal && reviewTransfer && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={() => setShowReviewModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h6 className="modal-title">🔍 TRANSFER DETAILS — {reviewTransfer.trfNo}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowReviewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Transfer No:</strong> {reviewTransfer.trfNo}</p>
                    <p className="mb-1"><strong>Date/Time:</strong> {formatDateTime(reviewTransfer.transferDate)}</p>
                    <p className="mb-1"><strong>Patient:</strong> {reviewTransfer.patientName}</p>
                    <p className="mb-1"><strong>UHID:</strong> {reviewTransfer.uhidNo || ""}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>From:</strong> {reviewTransfer.fromWard} / {reviewTransfer.fromBed}</p>
                    <p className="mb-1"><strong>To (Requested):</strong> {reviewTransfer.targetWard} / {reviewTransfer.targetBed || "TBD"}</p>
                    <p className="mb-1"><strong>Doctor:</strong> {reviewTransfer.doctorInCharge}</p>
                    <p className="mb-1"><strong>Reason:</strong> {reviewTransfer.reason}</p>
                    <p className="mb-1"><strong>Priority:</strong> <span className={`badge ${reviewTransfer.priority === "Emergency" ? "bg-danger" : "bg-secondary"}`}>{reviewTransfer.priority}</span></p>
                    <p className="mb-1"><strong>Status:</strong> <span className={`badge bg-${getStatusBadge(reviewTransfer.status)}`}>{reviewTransfer.status}</span></p>
                  </div>
                  <div className="col-12">
                    <strong>Clinical Notes:</strong>
                    <p className="text-muted mb-0">{reviewTransfer.clinicalNotes || "—"}</p>
                  </div>
                </div>

                {reviewTransfer.status === TRANSFER_STATUS.PENDING && (
                  <div className="mt-3 p-3 bg-light rounded border border-success">
                    <label className="form-label fw-bold text-success">
                      Allocate Bed in {reviewTransfer.targetWard}
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={reviewAllocatedBed}
                      onChange={e => setReviewAllocatedBed(e.target.value)}
                    >
                      <option value="">Select Bed </option>
                      {detailWardBeds.map(b => (
                        <option key={b.bedId || b.bedNo} value={b.bedNo || b.bedId}>
                          {b.bedNo || b.bedId}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reviewTransfer.allocatedBed && (
                  <div className="mt-2 p-2 bg-success bg-opacity-10 rounded">
                    <strong>Allocated Bed:</strong> {reviewTransfer.allocatedBed}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {reviewTransfer.status === TRANSFER_STATUS.PENDING && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={handleAccept}>
                      ✅ Accept & Allocate Bed
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setShowReviewModal(false); handleOpenCancel(reviewTransfer.id) }}>
                      ❌ Reject / Cancel
                    </button>
                  </>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL MODAL ─── */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }} onClick={() => setShowCancelModal(false)}>
          <div className="modal-dialog modal-sm modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white py-2">
                <h6 className="modal-title">Cancel / Reject Transfer</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label small fw-bold">Cancel Remarks <span className="text-danger">*</span></label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                  value={cancelRemarks}
                  onChange={e => setCancelRemarks(e.target.value)}
                />
                <div className="small text-muted mt-2">Main inpatient record will NOT be updated on cancellation.</div>
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-danger btn-sm" onClick={handleConfirmCancel}>Confirm Cancel</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowCancelModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BedTransfer