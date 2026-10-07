import { useCallback, useEffect, useState } from "react"
import Swal from "sweetalert2"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { getRequest, postRequest, putRequest } from "../../../service/apiService"
import {
  CREATE_BLOOD_REQUEST,
  MAS_BLOOD_COMPONENT_GET_ALL,
  MAS_BLOODGROUP,
  GET_BLOOD_REQUEST_TRACKING,
  ACKNOWLEDGE_BLOOD_REQUEST,
} from "../../../config/apiConfig"

/* ------------------------------------------------------------------ */
/*  Static options                                                     */
/* ------------------------------------------------------------------ */

const URGENCY_OPTIONS = ["Routine", "Emergency", "Urgent"]

const INDICATION_OPTIONS = [
  "Anemia",
  "Surgery",
  "Bleeding",
  "Trauma",
  "Thalassemia",
  "Hemophilia",
  "Cancer",
  "Liver Disease",
]

const newRequestRow = (id) => ({
  id,
  componentType: "",
  unitsRequired: "",
  urgency: "",
  requiredDateTime: "",
  indication: "",
  remarks: "",
})

const displayValue = (value) =>
  value === null || value === undefined ? "" : value

const formatDateTime = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (number) => String(number).padStart(2, "0")
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BloodTransfusion = ({ selectedPatient, selectedWard }) => {
  const [activeView, setActiveView] = useState("request")

  /* ---------------- master data ---------------- */
  const [componentOptions, setComponentOptions] = useState([])
  const [bloodGroupOptions, setBloodGroupOptions] = useState([])
  const [isLoadingMaster, setIsLoadingMaster] = useState(false)

  /* ---------------- request form ---------------- */
  const [bloodGroupId, setBloodGroupId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestRows, setRequestRows] = useState([newRequestRow(1)])

  /* ---------------- tracking ---------------- */
  const [trackingList, setTrackingList] = useState([])
  const [trackingTotal, setTrackingTotal] = useState(0)
  const [trackingPage, setTrackingPage] = useState(1)
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const [acknowledgedMap, setAcknowledgedMap] = useState({})

  /* ---------------- acknowledge modal ---------------- */
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedAction, setSelectedAction] = useState("Accept")
  const [remarks, setRemarks] = useState("")
  const [isSubmittingAck, setIsSubmittingAck] = useState(false)

  /* ---------------- placeholders ---------------- */
  const [pendingUnits] = useState([])
  const [receivedUnits] = useState([])

  /* ================================================================ */
  /*  Fetch masters                                                    */
  /* ================================================================ */
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMaster(true)
      try {
        const [componentsResponse, bloodGroupsResponse] = await Promise.all([
          getRequest(MAS_BLOOD_COMPONENT_GET_ALL),
          getRequest(`${MAS_BLOODGROUP}/getAll/1`),
        ])
        const components = componentsResponse?.response || []
        const bloodGroups = bloodGroupsResponse?.response || []
        setComponentOptions(Array.isArray(components) ? components : [])
        setBloodGroupOptions(Array.isArray(bloodGroups) ? bloodGroups : [])
      } catch (error) {
        console.error("Error fetching blood components / blood groups:", error)
        setComponentOptions([])
        setBloodGroupOptions([])
        Swal.fire(
          "Unable to Load Data",
          "Blood component and blood group data could not be loaded.",
          "error",
        )
      } finally {
        setIsLoadingMaster(false)
      }
    }
    fetchMasterData()
  }, [])

  /* ================================================================ */
  /*  Fetch tracking list (auto-loads by inpatientId)                  */
  /* ================================================================ */
  const fetchTracking = useCallback(
    async (page = 0) => {
      if (!selectedPatient?.inpatientId) {
        setTrackingList([])
        setTrackingTotal(0)
        return
      }
      setIsLoadingTracking(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(DEFAULT_ITEMS_PER_PAGE),
          inpatientId: String(selectedPatient.inpatientId),
        })
        const response = await getRequest(
          `${GET_BLOOD_REQUEST_TRACKING}?${params.toString()}`,
        )
        const responsePage = response?.response
        setTrackingList(
          Array.isArray(responsePage?.content) ? responsePage.content : [],
        )
        setTrackingTotal(responsePage?.totalElements || 0)
      } catch (error) {
        console.error("Error fetching blood request tracking data:", error)
        setTrackingList([])
        setTrackingTotal(0)
        Swal.fire(
          "Unable to Load Data",
          error?.message || "Blood request tracking data could not be loaded.",
          "error",
        )
      } finally {
        setIsLoadingTracking(false)
      }
    },
    [selectedPatient?.inpatientId],
  )

  useEffect(() => {
    fetchTracking(0)
    setTrackingPage(1)
  }, [fetchTracking])

  const handleTrackingPageChange = (page) => {
    setTrackingPage(page)
    fetchTracking(page - 1)
  }

  /* ================================================================ */
  /*  Acknowledge helpers                                              */
  /* ================================================================ */
  const canUserAcknowledge = (request) => {
    if (
      request?.canAcknowledge !== undefined &&
      request?.canAcknowledge !== null
    ) {
      return Boolean(request.canAcknowledge)
    }
    const status = String(request?.trackingStatus || "").trim().toUpperCase()
    return (
      status === "ISSUED" ||
      status === "PARTIALLY_ISSUED" ||
      request?.trackingStatusId === 4 ||
      Number(request?.fulfilledUnits || 0) > 0
    )
  }

  const getAcknowledgeStatus = (request) => {
    const key =
      request.requestDtId ||
      request.requestNo ||
      `${request.inpatientId}-${request.component}-${request.requestedDateTime}`
    if (acknowledgedMap[key]) {
      return acknowledgedMap[key].status
    }
    const status =
      request.acknowledgementStatus ||
      request.acknowledgeStatus ||
      request.ackStatus
    if (status && String(status).toUpperCase() !== "PENDING") {
      return status
    }
    return null
  }

  const handleOpenAcknowledge = (request) => {
    setSelectedRequest(request)
    setSelectedAction("Accept")
    setRemarks("")
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (isSubmittingAck) return
    setShowModal(false)
    setSelectedRequest(null)
    setSelectedAction("Accept")
    setRemarks("")
  }

  const executeAcknowledge = async (request, action, remarksText) => {
    setIsSubmittingAck(true)
    try {
      const allocationIds =
        Array.isArray(request.allocationIds) && request.allocationIds.length > 0
          ? request.allocationIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
          : request.allocationId != null
          ? [Number(request.allocationId)]
          : request.bloodAllocationId != null
          ? [Number(request.bloodAllocationId)]
          : request.requestDtId != null
          ? [Number(request.requestDtId)]
          : []

      if (allocationIds.length === 0) {
        throw new Error("No allocation ID found for this blood request.")
      }

      const responses = await Promise.all(
        allocationIds.map((allocId) =>
          putRequest(ACKNOWLEDGE_BLOOD_REQUEST, {
            allocationId: allocId,
            accepted: action === "Accept",
            remarks: (remarksText || "").trim(),
          }),
        ),
      )

      const response = responses[0]
      const isSuccess =
        response?.status === 200 ||
        response?.data?.status === 200 ||
        response?.data?.production === false

      if (!isSuccess && response?.status >= 400) {
        throw new Error(
          response?.data?.message ||
            response?.message ||
            "Failed to acknowledge blood request.",
        )
      }

      const key =
        request.requestDtId ||
        request.requestNo ||
        `${request.inpatientId}-${request.component}-${request.requestedDateTime}`

      const finalStatus = action === "Accept" ? "Accepted" : "Rejected"

      setAcknowledgedMap((prev) => ({
        ...prev,
        [key]: { status: finalStatus, remarks: (remarksText || "").trim() },
      }))

      setTrackingList((prev) =>
        prev.map((item) => {
          const itemKey =
            item.requestDtId ||
            item.requestNo ||
            `${item.inpatientId}-${item.component}-${item.requestedDateTime}`
          if (itemKey === key) {
            return {
              ...item,
              trackingStatus:
                finalStatus === "Rejected" ? "Rejected" : item.trackingStatus,
              acknowledgementStatus: finalStatus,
              canAcknowledge: false,
            }
          }
          return item
        }),
      )

      handleCloseModal()

      Swal.fire({
        icon: "success",
        title: `Request ${finalStatus}!`,
        text:
          action === "Reject"
            ? `Blood Request ${request.requestNo || ""} status updated to Rejected successfully.`
            : `Blood Request ${request.requestNo || ""} has been accepted successfully.`,
        timer: 1800,
        showConfirmButton: false,
      })

      fetchTracking(trackingPage - 1)
    } catch (error) {
      console.error("Error processing acknowledgment:", error)
      Swal.fire(
        "Error",
        error?.message || "Failed to process acknowledgment.",
        "error",
      )
    } finally {
      setIsSubmittingAck(false)
    }
  }

  const handleModalSubmit = async () => {
    if (!selectedAction) {
      Swal.fire(
        "Selection Required",
        "Please select either Accept or Reject.",
        "warning",
      )
      return
    }
    if (selectedAction === "Reject" && !remarks.trim()) {
      Swal.fire(
        "Remarks Required",
        "Please provide a reason for rejecting the blood units.",
        "warning",
      )
      return
    }
    await executeAcknowledge(selectedRequest, selectedAction, remarks)
  }

  /* ================================================================ */
  /*  Auto-select the patient's blood group when available             */
  /* ================================================================ */
  useEffect(() => {
    if (!selectedPatient?.bloodGroup || bloodGroupOptions.length === 0) return
    const match = bloodGroupOptions.find(
      (bg) =>
        String(bg.bloodGroupName || bg.bloodGroupCode || "")
          .trim()
          .toLowerCase() ===
        String(selectedPatient.bloodGroup).trim().toLowerCase(),
    )
    if (match) setBloodGroupId(String(match.bloodGroupId))
  }, [selectedPatient?.bloodGroup, bloodGroupOptions])

  /* ================================================================ */
  /*  Row handlers                                                     */
  /* ================================================================ */
  const handleRowChange = (id, field, value) => {
    setRequestRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  const handleUnitsChange = (id, value) => {
    handleRowChange(id, "unitsRequired", value.replace(/\D/g, ""))
  }

  const handleAddRow = () => {
    setRequestRows((prev) => [
      ...prev,
      newRequestRow(prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1),
    ])
  }

  const handleRemoveRow = (id) => {
    setRequestRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    )
  }

  const handleResetForm = () => {
    setRequestRows([newRequestRow(1)])
  }

  /* ================================================================ */
  /*  Submit request                                                   */
  /* ================================================================ */
  const handleSubmitRequest = async () => {
    const patientId = Number(selectedPatient?.patientId)
    const inpatientId = Number(selectedPatient?.inpatientId)
    const wardIdNum = Number(selectedWard?.wardId)
    const requestDepartment = Number(
      sessionStorage.getItem("departmentId") ||
        localStorage.getItem("departmentId"),
    )
    const selectedBloodGroupId = Number(bloodGroupId)

    if (!Number.isInteger(patientId) || patientId < 1) {
      Swal.fire(
        "Patient ID Missing",
        "The selected inpatient does not contain a valid patient ID.",
        "error",
      )
      return
    }
    if (!Number.isInteger(inpatientId) || inpatientId < 1) {
      Swal.fire(
        "Inpatient ID Missing",
        "The selected inpatient does not contain a valid inpatient ID.",
        "error",
      )
      return
    }
    if (!Number.isInteger(wardIdNum) || wardIdNum < 1) {
      Swal.fire("Ward Required", "A valid ward could not be determined for this request.", "error")
      return
    }
    if (!Number.isInteger(selectedBloodGroupId) || selectedBloodGroupId < 1) {
      Swal.fire("Blood Group Required", "Please select a blood group.", "error")
      return
    }
    if (!Number.isInteger(requestDepartment) || requestDepartment < 1) {
      Swal.fire(
        "Department Required",
        "A valid department could not be found. Please log in again.",
        "error",
      )
      return
    }

    const hasMissingFields = requestRows.some((row) =>
      ["componentType", "unitsRequired", "urgency", "requiredDateTime", "indication"].some(
        (field) => !row[field],
      ),
    )

    const hasInvalidUnits = requestRows.some(
      (row) =>
        !Number.isInteger(Number(row.unitsRequired)) ||
        Number(row.unitsRequired) < 1,
    )

    if (hasMissingFields || hasInvalidUnits) {
      Swal.fire(
        "Incomplete Request",
        "Please complete all required blood details.",
        "warning",
      )
      return
    }

    const payload = {
      inpatientId,
      wardId: wardIdNum,
      patientId,
      requestDepartment,
      bloodGroupId: selectedBloodGroupId,
      bloodRequirementDetails: requestRows.map((row) => ({
        componentId: Number(row.componentType),
        unitsRequired: Number(row.unitsRequired),
        urgency: row.urgency,
        requiredDateTime: row.requiredDateTime,
        indication: row.indication,
        remarks: row.remarks,
      })),
    }

    setIsSubmitting(true)
    try {
      const response = await postRequest(CREATE_BLOOD_REQUEST, payload)
      if (response?.status === 200 || response?.status === 201) {
        await Swal.fire({
          title: "Success",
          text: response.message || "Blood request submitted successfully.",
          icon: "success",
          confirmButtonText: "OK",
          allowOutsideClick: false,
        })
        handleResetForm()
        setActiveView("tracking")
        // Refresh tracking list so the new request appears immediately
        fetchTracking(0)
        setTrackingPage(1)
      } else {
        Swal.fire(
          "Unable to Submit",
          response?.message || "Blood request could not be submitted.",
          "error",
        )
      }
    } catch (error) {
      console.error("Error submitting blood request:", error)
      Swal.fire("Unable to Submit", "Blood request could not be submitted.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ================================================================ */
  /*  Badge helpers                                                    */
  /* ================================================================ */
  const getUrgencyBadge = (urgency) => {
    const badgeClasses = {
      Emergency: "bg-danger",
      Urgent: "bg-warning text-dark",
      Routine: "bg-info",
    }
    return urgency ? (
      <span className={`badge ${badgeClasses[urgency] || "bg-secondary"}`}>
        {urgency}
      </span>
    ) : (
      "-"
    )
  }

  const getTrackingStatusBadge = (status) => {
    if (!status) return "-"
    const normalized = String(status).trim().toUpperCase().replace(/[\s-]+/g, "_")
    const badgeClasses = {
      ISSUED: "bg-success",
      PARTIALLY_ISSUED: "bg-primary",
      ALLOCATED: "bg-info text-dark",
      PARTIALLY_ALLOCATED: "bg-warning text-dark",
      CROSS_MATCHING: "bg-warning text-dark",
      COMPATIBILITY_TESTING: "bg-info text-dark",
      REQUESTED: "bg-secondary",
      PENDING: "bg-secondary",
      REJECTED: "bg-danger",
      CANCELLED: "bg-danger",
    }
    const formattedText = String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const badgeClass = badgeClasses[normalized] || "bg-secondary"
    return <span className={`badge ${badgeClass}`}>{formattedText}</span>
  }

  const getTransfusionBadge = (status) => {
    const map = {
      "Received in Ward": "info",
      "Transfusion Started": "warning",
      "Transfusion Completed": "success",
    }
    return map[status] || "secondary"
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className={`btn btn-sm ${activeView === "request" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("request")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Blood Request
        </button>
        <button
          className={`btn btn-sm ${activeView === "tracking" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("tracking")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Tracking Request ({trackingTotal})
        </button>
        <button
          className={`btn btn-sm ${activeView === "pending" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("pending")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Pending for Receiving ({pendingUnits.length})
        </button>
        <button
          className={`btn btn-sm ${activeView === "transfusion" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("transfusion")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Transfusion ({receivedUnits.length})
        </button>
      </div>

      {/* ============================ BLOOD REQUEST ============================ */}
      {activeView === "request" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong style={{ fontSize: "0.8rem" }}>Blood Requirement Details</strong>
          </div>
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label mb-1" style={{ fontSize: "0.7rem" }}>
                  Blood Group <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  value={bloodGroupId}
                  onChange={(event) => setBloodGroupId(event.target.value)}
                  disabled={isSubmitting || isLoadingMaster}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroupOptions.map((bloodGroup) => (
                    <option key={bloodGroup.bloodGroupId} value={bloodGroup.bloodGroupId}>
                      {bloodGroup.bloodGroupName || bloodGroup.bloodGroupCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle" style={{ fontSize: "0.75rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Component Type <span className="text-danger">*</span></th>
                    <th>Units <span className="text-danger">*</span></th>
                    <th>Urgency <span className="text-danger">*</span></th>
                    <th>Required Date &amp; Time <span className="text-danger">*</span></th>
                    <th>Indication <span className="text-danger">*</span></th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requestRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.componentType}
                          onChange={(e) => handleRowChange(row.id, "componentType", e.target.value)}
                          disabled={isSubmitting || isLoadingMaster}
                        >
                          <option value="">
                            {isLoadingMaster ? "Loading..." : "Select Component"}
                          </option>
                          {componentOptions.map((component) => (
                            <option key={component.componentId} value={component.componentId}>
                              {component.componentName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className="form-control form-control-sm"
                          placeholder="Units"
                          value={row.unitsRequired}
                          onKeyDown={(e) =>
                            ["-", "+", ".", "e", "E"].includes(e.key) && e.preventDefault()
                          }
                          onChange={(e) => handleUnitsChange(row.id, e.target.value)}
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.urgency}
                          onChange={(e) => handleRowChange(row.id, "urgency", e.target.value)}
                          disabled={isSubmitting}
                        >
                          <option value="">Select</option>
                          {URGENCY_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={row.requiredDateTime}
                          onChange={(e) => handleRowChange(row.id, "requiredDateTime", e.target.value)}
                          disabled={isSubmitting}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.indication}
                          onChange={(e) => handleRowChange(row.id, "indication", e.target.value)}
                          disabled={isSubmitting}
                        >
                          <option value="">Select Indication</option>
                          {INDICATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Optional remarks"
                          value={row.remarks}
                          onChange={(e) => handleRowChange(row.id, "remarks", e.target.value)}
                          disabled={isSubmitting}
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={requestRows.length === 1 || isSubmitting}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-success btn-sm mb-3"
              onClick={handleAddRow}
              disabled={isSubmitting}
            >
              + Add Another Component
            </button>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetForm}
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================ TRACKING ============================ */}
      {activeView === "tracking" && (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover align-middle" style={{ fontSize: "0.72rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Request No</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th className="text-center">Units</th>
                  <th className="text-center">Issued</th>
                  <th className="text-center">Acknowledged</th>
                  <th className="text-center">Pending</th>
                  <th>Urgency</th>
                  <th>Requested Date &amp; Time</th>
                  <th>Required By</th>
                  <th>Tracking Status</th>
                  <th className="text-center" style={{ minWidth: "140px" }}>
                    Acknowledgement
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTracking ? (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : trackingList.length > 0 ? (
                  trackingList.map((request, index) => {
                    const ackStatus = getAcknowledgeStatus(request)
                    const canAck = canUserAcknowledge(request)
                    const normalizedAck = String(ackStatus || "").toUpperCase()
                    const isAccepted =
                      normalizedAck === "ACCEPTED" ||
                      normalizedAck === "FULLY_ACKNOWLEDGED"
                    const isRejected = normalizedAck === "REJECTED"
                    const isPartiallyAck =
                      normalizedAck === "PARTIALLY_ACKNOWLEDGED"

                    return (
                      <tr
                        key={
                          request.requestDtId ||
                          `${request.inpatientId}-${request.component}-${request.requestedDateTime}-${index}`
                        }
                      >
                        <td className="fw-semibold">
                          {displayValue(request.requestNo) || "-"}
                        </td>
                        <td>
                          {request.bloodGroup ? (
                            <span className="badge bg-danger">
                              {request.bloodGroup}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{displayValue(request.component) || "-"}</td>
                        <td className="text-center fw-bold">
                          {request.units != null ? request.units : "-"}
                        </td>
                        <td className="text-center fw-bold">
                          {request.fulfilledUnits != null
                            ? request.fulfilledUnits
                            : request.issuedUnits != null
                            ? request.issuedUnits
                            : 0}
                        </td>
                        <td className="text-center fw-bold">
                          {request.acknowledgedUnits != null
                            ? request.acknowledgedUnits
                            : 0}
                        </td>
                        <td className="text-center fw-bold">
                          {request.pendingUnits != null
                            ? request.pendingUnits
                            : 0}
                        </td>
                        <td>{getUrgencyBadge(request.urgency)}</td>
                        <td>{formatDateTime(request.requestedDateTime) || "-"}</td>
                        <td>
                          {formatDateTime(
                            request.requiredByDateTime || request.requiredBy,
                          ) || "-"}
                        </td>
                        <td>{getTrackingStatusBadge(request.trackingStatus)}</td>
                        <td className="text-center">
                          {isAccepted ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-semibold">
                              <i className="fa fa-check me-1"></i> Accepted
                            </span>
                          ) : isRejected ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small fw-semibold">
                              <i className="fa fa-times me-1"></i> Rejected
                            </span>
                          ) : isPartiallyAck && !canAck ? (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 small fw-semibold">
                              <i className="fa fa-clock-o me-1"></i> Partially Accepted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                canAck
                                  ? "btn-primary shadow-sm"
                                  : "btn-outline-secondary opacity-60"
                              }`}
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                cursor: canAck ? "pointer" : "not-allowed",
                              }}
                              disabled={!canAck || isSubmittingAck}
                              onClick={() => handleOpenAcknowledge(request)}
                              title={
                                canAck
                                  ? "Click to Acknowledge (Accept or Reject)"
                                  : "Acknowledge is enabled when units are issued"
                              }
                            >
                              <i className="fa fa-check-square-o me-1"></i> Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      <div className="text-muted">
                        <h6 className="mt-2">No blood requests found</h6>
                        <p className="mb-0">
                          Create a blood request to see it here.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {trackingTotal > 0 && (
            <Pagination
              totalItems={trackingTotal}
              itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
              currentPage={trackingPage}
              onPageChange={handleTrackingPageChange}
            />
          )}
        </>
      )}

      {/* ============================ PENDING (placeholder) ============================ */}
      {activeView === "pending" && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
            <thead className="table-light">
              <tr>
                <th>Component</th>
                <th>Group</th>
                <th>Unit / Bag No</th>
                <th>Expiry</th>
                <th>Issued At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-3 text-muted">No blood units pending receipt.</td>
                </tr>
              ) : (
                pendingUnits.map((u) => (
                  <tr key={u.id}>
                    <td>{u.component}</td>
                    <td>{u.group}</td>
                    <td>{u.unitNo}</td>
                    <td>{u.expiry}</td>
                    <td>{u.issuedAt}</td>
                    <td>
                      <button className="btn btn-primary btn-sm">Receive</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ TRANSFUSION (placeholder) ============================ */}
      {activeView === "transfusion" && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover" style={{ fontSize: "0.72rem" }}>
            <thead className="table-light">
              <tr>
                <th>Component</th>
                <th>Group</th>
                <th>Unit / Bag No</th>
                <th>Expiry</th>
                <th>Received At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receivedUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-3 text-muted">No received blood units yet.</td>
                </tr>
              ) : (
                receivedUnits.map((u) => (
                  <tr key={u.id}>
                    <td>{u.component}</td>
                    <td>{u.group}</td>
                    <td>{u.unitNo}</td>
                    <td>{u.expiry}</td>
                    <td>{u.receivedAt}</td>
                    <td>
                      <span className={`badge bg-${getTransfusionBadge(u.status)}`}>{u.status}</span>
                    </td>
                    <td>—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ ACKNOWLEDGE MODAL ============================ */}
      {showModal && selectedRequest && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(15, 23, 42, 0.55)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
            <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
              <div className="modal-header py-2 px-3 bg-light border-bottom">
                <h6 className="modal-title fw-bold mb-0 text-dark d-flex align-items-center">
                  <i className="fa fa-check-square-o text-primary me-2"></i>
                  Acknowledge Blood Request
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  style={{ fontSize: "10px" }}
                  onClick={handleCloseModal}
                  disabled={isSubmittingAck}
                ></button>
              </div>

              <div className="modal-body p-3">
                <div
                  className="p-2 mb-3 rounded-2"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="row g-2 text-secondary" style={{ fontSize: "12px" }}>
                    <div className="col-6">
                      <span className="text-muted">Request No:</span>{" "}
                      <span className="fw-semibold text-dark">
                        {selectedRequest.requestNo || "N/A"}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Blood Group:</span>{" "}
                      <span className="badge bg-danger ms-1" style={{ fontSize: "10.5px" }}>
                        {selectedRequest.bloodGroup || "N/A"}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Component:</span>{" "}
                      <span className="fw-semibold text-dark">
                        {selectedRequest.component || "N/A"}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Total Units:</span>{" "}
                      <span className="fw-bold text-dark">{selectedRequest.units ?? "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Units Issued:</span>{" "}
                      <span className="fw-bold text-success">
                        {selectedRequest.fulfilledUnits ?? selectedRequest.issuedUnits ?? 0}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Acknowledged:</span>{" "}
                      <span className="fw-bold text-dark">
                        {selectedRequest.acknowledgedUnits ?? 0}
                      </span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Pending Issue:</span>{" "}
                      <span className="fw-bold text-danger">
                        {selectedRequest.pendingUnits ?? 0}
                      </span>
                    </div>
                    {Array.isArray(selectedRequest.allocationIds) &&
                      selectedRequest.allocationIds.length > 0 && (
                        <div className="col-6">
                          <span className="text-muted">Allocation ID:</span>{" "}
                          <span className="fw-semibold text-dark">
                            {selectedRequest.allocationIds.join(", ")}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <label className="form-label fw-semibold text-dark mb-1" style={{ fontSize: "12.5px" }}>
                  Acknowledgment Decision <span className="text-danger">*</span>
                </label>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div
                      onClick={() => !isSubmittingAck && setSelectedAction("Accept")}
                      className="p-2 rounded-2 border d-flex align-items-center gap-2"
                      style={{
                        cursor: isSubmittingAck ? "not-allowed" : "pointer",
                        backgroundColor: selectedAction === "Accept" ? "#e8f5e9" : "#ffffff",
                        borderColor: selectedAction === "Accept" ? "#2e7d32" : "#e2e8f0",
                        borderWidth: selectedAction === "Accept" ? "1.5px" : "1px",
                        borderStyle: "solid",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="ackDecision"
                        checked={selectedAction === "Accept"}
                        onChange={() => setSelectedAction("Accept")}
                        disabled={isSubmittingAck}
                        className="form-check-input mt-0"
                        style={{ cursor: "pointer" }}
                      />
                      <div className="d-flex flex-column lh-sm">
                        <span
                          className="fw-bold"
                          style={{
                            fontSize: "13px",
                            color: selectedAction === "Accept" ? "#2e7d32" : "#334155",
                          }}
                        >
                          <i className="fa fa-check-circle me-1 text-success"></i> Accept
                        </span>
                        <span className="text-muted" style={{ fontSize: "10.5px" }}>
                          Units received in ward
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div
                      onClick={() => !isSubmittingAck && setSelectedAction("Reject")}
                      className="p-2 rounded-2 border d-flex align-items-center gap-2"
                      style={{
                        cursor: isSubmittingAck ? "not-allowed" : "pointer",
                        backgroundColor: selectedAction === "Reject" ? "#ffebee" : "#ffffff",
                        borderColor: selectedAction === "Reject" ? "#c62828" : "#e2e8f0",
                        borderWidth: selectedAction === "Reject" ? "1.5px" : "1px",
                        borderStyle: "solid",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="ackDecision"
                        checked={selectedAction === "Reject"}
                        onChange={() => setSelectedAction("Reject")}
                        disabled={isSubmittingAck}
                        className="form-check-input mt-0"
                        style={{ cursor: "pointer" }}
                      />
                      <div className="d-flex flex-column lh-sm">
                        <span
                          className="fw-bold"
                          style={{
                            fontSize: "13px",
                            color: selectedAction === "Reject" ? "#c62828" : "#334155",
                          }}
                        >
                          <i className="fa fa-times-circle me-1 text-danger"></i> Reject
                        </span>
                        <span className="text-muted" style={{ fontSize: "10.5px" }}>
                          Return to blood bank
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "12.5px" }}>
                      Remarks
                    </label>
                    {selectedAction === "Reject" ? (
                      <span className="text-danger" style={{ fontSize: "11px" }}>
                        * Reason required
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        Optional
                      </span>
                    )}
                  </div>
                  <textarea
                    className="form-control"
                    rows="2"
                    style={{ fontSize: "12.5px", borderRadius: "6px" }}
                    placeholder={
                      selectedAction === "Reject"
                        ? "Enter reason for rejecting these units..."
                        : "Enter any remarks or notes..."
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={isSubmittingAck}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3"
                  style={{ fontSize: "12.5px", borderRadius: "5px" }}
                  onClick={handleCloseModal}
                  disabled={isSubmittingAck}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 fw-semibold ${
                    selectedAction === "Reject" ? "btn-danger" : "btn-success"
                  }`}
                  style={{ fontSize: "12.5px", borderRadius: "5px" }}
                  onClick={handleModalSubmit}
                  disabled={isSubmittingAck || !selectedAction}
                >
                  {isSubmittingAck ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className={`fa ${selectedAction === "Reject" ? "fa-times" : "fa-check"} me-1`}></i>
                      Confirm {selectedAction || "Action"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BloodTransfusion