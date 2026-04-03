import React, { useState, useEffect } from "react"
import { getRequest, putRequest } from "../../../service/apiService"
import { ACTIVE_STATUS_FOR_DROPDOWN, FIXED_VALUE_DROPDOWNS_END_URL, LAB, LAB_AMENDMENT_ALL_TYPE, LAB_AMENDMENT_TYPE_API, PENDING_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL, PENDING_SAMPLE_HEADERS_FOR_RESULT_UPDATE_END_URL, PENDING_SUB_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL, REQUEST_PARAM_FLAG, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_INVESTIGATION_ID, REQUEST_PARAM_MOBILE_NO, REQUEST_PARAM_ORDER_HD_ID, REQUEST_PARAM_PAGE, REQUEST_PARAM_PATIENT_NAME, REQUEST_PARAM_RESULT_ENTRY_DT_ID, REQUEST_PARAM_SIZE, REQUEST_PARAM_SUB_INVESTIGATION_ID, UPDATE_RESULT_END_URL } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import {
  FETCH_RESULT_UPDATE_DATA_ERR_MSG,
  RESULT_UPDATE_ERR_MSG,
  RESULT_UPDATE_SUCC_MSG,
  UNEXPECTED_ERROR,
  SELECT_ROW_TO_EDIT_WARN_MSG,
} from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { checkInRange, getResultTextStyle } from "../../../utils/rangeCheckService"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString("en-GB")
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? new Date().toLocaleDateString("en-GB") : date.toLocaleDateString("en-GB")
  } catch {
    return new Date().toLocaleDateString("en-GB")
  }
}

const formatTime = (timeValue) => {
  if (!timeValue) return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  try {
    if (typeof timeValue === "string") {
      if (timeValue.includes("T")) {
        const d = new Date(timeValue)
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        }
      }
      const parts = timeValue.split(":")
      if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`
    }
    return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const UpdateResultValidation = () => {
  // ---- list-view state ----
  const [headerList, setHeaderList] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchData, setSearchData] = useState({ patientName: "", mobileNo: "" })
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [amendmentTypes, setAmendmentTypes] = useState([])

  // ---- detail-view state ----
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedHeader, setSelectedHeader] = useState(null)
  const [investigations, setInvestigations] = useState([])
  const [editableRows, setEditableRows] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  // fixed-value dropdown cache { subInvestigationId: [...options] }
  const [fixedDropdownCache, setFixedDropdownCache] = useState({})

  // ---- constants ----
  const HOSPITAL_ID = sessionStorage.getItem("hospitalId")

  // ---------------------------------------------------------------------------
  // Show popup helper
  // ---------------------------------------------------------------------------
  const showPopup = (message, type = "info") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) })
  }

  // ---------------------------------------------------------------------------
  // Fetch amendment types once on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchAmendmentTypes = async () => {
      try {
        const data = await getRequest(`${LAB_AMENDMENT_ALL_TYPE}?${REQUEST_PARAM_FLAG}=${ACTIVE_STATUS_FOR_DROPDOWN}`)
        if (data.status === 200 && data.response) setAmendmentTypes(data.response)
      } catch (e) {
        console.error("Error fetching amendment types:", e)
      }
    }
    fetchAmendmentTypes()
  }, [])

  // ---------------------------------------------------------------------------
  // Fetch paginated header list – backend handles dedup, we just render what comes back
  // ---------------------------------------------------------------------------
  const fetchHeaders = async (page = 1, patientName = "", mobileNo = "") => {
    try {
      setIsSearching(true)
      const zeroPage = page - 1
      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_UPDATE_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${HOSPITAL_ID}&${REQUEST_PARAM_PAGE}=${zeroPage}&${REQUEST_PARAM_SIZE}=${DEFAULT_ITEMS_PER_PAGE}`
      if (patientName) url += `&${REQUEST_PARAM_PATIENT_NAME}=${encodeURIComponent(patientName)}`
      if (mobileNo) url += `&${REQUEST_PARAM_MOBILE_NO}=${encodeURIComponent(mobileNo)}`

      const data = await getRequest(url)
      if (data.status === 200 && data.response) {
        const pageData = data.response
        setHeaderList(pageData.content || [])
        setTotalElements(pageData.totalElements || 0)
        setHasSearched(true)
      } else {
        showPopup(FETCH_RESULT_UPDATE_DATA_ERR_MSG, "error")
      }
    } catch (e) {
      console.error("Error fetching headers:", e)
      showPopup(FETCH_RESULT_UPDATE_DATA_ERR_MSG, "error")
    } finally {
      setIsSearching(false)
    }
  }

  // Re-fetch on page change (only after first search)
  useEffect(() => {
    if (hasSearched) {
      fetchHeaders(currentPage, searchData.patientName, searchData.mobileNo)
    }
  }, [currentPage]) // eslint-disable-line

  // ---------------------------------------------------------------------------
  // Search handlers
  // ---------------------------------------------------------------------------
  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchHeaders(1, searchData.patientName, searchData.mobileNo)
  }

  const handleSearchReset = () => {
    setSearchData({ patientName: "", mobileNo: "" })
    setCurrentPage(1)
    setHasSearched(false)
    setHeaderList([])
    setTotalElements(0)
  }

  // ---------------------------------------------------------------------------
  // Build flat investigation rows from details API response
  // investigationType 's' → single row
  // investigationType 'm' → header row + sub-investigation rows (fetched separately)
  // ---------------------------------------------------------------------------
  const buildInvestigationRows = async (detailsData) => {
    const rows = []
    let mainCounter = 1

    for (const inv of detailsData) {
      if (inv.investigationType === "s") {
        const inRange = checkInRange(inv.result, inv.normalValue)
        rows.push({
          id: `${inv.resultEntryHeaderId}-${inv.resultEntryDetailsId}`,
          si_no: String(mainCounter),
          displayType: "single",
          resultEntryHeaderId: inv.resultEntryHeaderId,
          resultEntryDetailsId: inv.resultEntryDetailsId,
          investigationId: inv.investigationId,
          investigation: inv.investigationName || "",
          sample: inv.sampleName || "",
          generatedSampleId: inv.generatedSampleId || "",
          result: inv.result || "",
          oldResult: inv.result || "",
          units: inv.unit || "",
          normal_range: inv.normalValue || "",
          remarks: "",
          amendmentTypeId: null,
          inRange,
          comparisonType: inv.comparisonType || "",
          fixedId: inv.fixedId || null,
          fixedDropdownValues: [],
          subInvestigationId: null,
        })
        mainCounter++
      } else if (inv.investigationType === "m") {
        rows.push({
          id: `main-${inv.resultEntryHeaderId}-${inv.resultEntryDetailsId}`,
          si_no: String(mainCounter),
          displayType: "main",
          resultEntryHeaderId: inv.resultEntryHeaderId,
          resultEntryDetailsId: inv.resultEntryDetailsId,
          investigationId: inv.investigationId,
          investigation: inv.investigationName || "",
          sample: inv.sampleName || "",
          generatedSampleId: inv.generatedSampleId || "",
        })

        try {
          const subData = await getRequest(
            `${PENDING_SUB_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL}?${REQUEST_PARAM_RESULT_ENTRY_DT_ID}=${inv.resultEntryDetailsId}&${REQUEST_PARAM_INVESTIGATION_ID}=${inv.investigationId}`
          )
          if (subData.status === 200 && subData.response) {
            const subList = subData.response
            subList.forEach((sub, subIndex) => {
              const subNo =
                subList.length === 1 ? "" : `${mainCounter}.${String.fromCharCode(97 + subIndex)}`
              const inRange = checkInRange(sub.result, sub.normalValue)
              rows.push({
                id: `${inv.resultEntryHeaderId}-${inv.resultEntryDetailsId}-${sub.subInvestigationId}`,
                si_no: subNo,
                displayType: "subtest",
                parentId: `main-${inv.resultEntryHeaderId}-${inv.resultEntryDetailsId}`,
                resultEntryHeaderId: inv.resultEntryHeaderId,
                resultEntryDetailsId: inv.resultEntryDetailsId,
                subInvestigationId: sub.subInvestigationId,
                investigation: sub.subInvestigationName || "",
                sample: inv.sampleName || "",
                generatedSampleId: sub.generatedSampleId || "",
                result: sub.result || "",
                oldResult: sub.result || "",
                units: sub.unitName || "",
                normal_range: sub.normalValue || "",
                remarks: "",
                amendmentTypeId: null,
                inRange,
                comparisonType: sub.comparisonType || "",
                fixedId: sub.fixedId || null,
                fixedDropdownValues: [],
              })
            })
          }
        } catch (e) {
          console.error("Error fetching sub-investigations:", e)
        }
        mainCounter++
      }
    }
    return rows
  }

  // ---------------------------------------------------------------------------
  // Row click → open detail view
  // ---------------------------------------------------------------------------
  const handleRowClick = async (headerRow) => {
    setEditableRows([])
    setFixedDropdownCache({})
    setSelectedHeader(headerRow)
    setShowDetailView(true)
    setDetailLoading(true)

    try {
      const data = await getRequest(
        `${PENDING_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL}?${REQUEST_PARAM_ORDER_HD_ID}=${headerRow.orderHdId}`
      )
      if (data.status === 200 && data.response) {
        const rows = await buildInvestigationRows(data.response)
        setInvestigations(rows)
      } else {
        showPopup(FETCH_RESULT_UPDATE_DATA_ERR_MSG, "error")
      }
    } catch (e) {
      console.error("Error fetching investigations:", e)
      showPopup(FETCH_RESULT_UPDATE_DATA_ERR_MSG, "error")
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Toggle edit row + lazy-load fixed dropdown if needed
  // ---------------------------------------------------------------------------
  const toggleEditRow = async (investigationId, isChecked) => {
    if (isChecked) {
      setEditableRows((prev) => [...prev, investigationId])

      const row = investigations.find((inv) => inv.id === investigationId)
      if (row && row.comparisonType === "f" && row.subInvestigationId) {
        const cacheKey = row.subInvestigationId
        if (!fixedDropdownCache[cacheKey]) {
          try {
            const data = await getRequest(`${FIXED_VALUE_DROPDOWNS_END_URL}?${REQUEST_PARAM_SUB_INVESTIGATION_ID}=${cacheKey}`)
            if (data.status === 200 && data.response) {
              setFixedDropdownCache((prev) => ({ ...prev, [cacheKey]: data.response }))
              setInvestigations((prev) =>
                prev.map((inv) =>
                  inv.id === investigationId ? { ...inv, fixedDropdownValues: data.response } : inv
                )
              )
            }
          } catch (e) {
            console.error("Error fetching fixed dropdown:", e)
          }
        } else {
          setInvestigations((prev) =>
            prev.map((inv) =>
              inv.id === investigationId
                ? { ...inv, fixedDropdownValues: fixedDropdownCache[cacheKey] }
                : inv
            )
          )
        }
      }
    } else {
      setEditableRows((prev) => prev.filter((id) => id !== investigationId))
    }
  }

  const isRowEditable = (id) => editableRows.includes(id)

  // ---------------------------------------------------------------------------
  // Field change handlers
  // ---------------------------------------------------------------------------
  const updateInvestigation = (id, changes) => {
    setInvestigations((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...changes } : inv)))
  }

  const handleResultChange = (id, value, selectedFixedId = null) => {
    const row = investigations.find((inv) => inv.id === id)
    const newInRange = row ? checkInRange(value, row.normal_range) : null
    updateInvestigation(id, {
      result: value,
      ...(selectedFixedId !== undefined && selectedFixedId !== null ? { fixedId: selectedFixedId } : {}),
      inRange: newInRange,
    })
  }

  const handleRemarksChange = (id, value) => updateInvestigation(id, { remarks: value })

  const handleAmendmentTypeChange = (id, value) =>
    updateInvestigation(id, { amendmentTypeId: value ? parseInt(value) : null })

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderEditCheckbox = (test) => {
    if (test.displayType === "main") return null
    const isChecked = isRowEditable(test.id)
    return (
      <div className="form-check d-flex justify-content-center">
        <input
          type="checkbox"
          className="form-check-input"
          id={`edit-${test.id}`}
          checked={isChecked}
          onChange={(e) => toggleEditRow(test.id, e.target.checked)}
          style={{ transform: "scale(1.2)", cursor: "pointer" }}
        />
        <label className="form-check-label ms-1" htmlFor={`edit-${test.id}`} style={{ cursor: "pointer" }} />
      </div>
    )
  }

  const renderAmendmentTypeDropdown = (test) => {
    const isEditable = isRowEditable(test.id)
    return (
      <select
        className="form-select"
        value={test.amendmentTypeId || ""}
        onChange={(e) => { if (isEditable) handleAmendmentTypeChange(test.id, e.target.value) }}
        disabled={!isEditable}
        style={{ padding: "4px" }}
      >
        <option value="">-- Select --</option>
        {amendmentTypes.map((type) => (
          <option key={type.amendmentTypeId} value={type.amendmentTypeId}>
            {type.amendmentTypeName}
          </option>
        ))}
      </select>
    )
  }

  const renderResultInput = (test) => {
    const resultStyle = getResultTextStyle(test.inRange)
    const isEditable = isRowEditable(test.id)

    if (test.comparisonType === "f" && isEditable && test.fixedDropdownValues && test.fixedDropdownValues.length > 0) {
      return (
        <select
          className="form-select"
          value={test.fixedId || ""}
          onChange={(e) => {
            const selectedFixedId = e.target.value ? parseInt(e.target.value) : null
            const selectedOption = test.fixedDropdownValues.find((opt) => opt.fixedId === selectedFixedId)
            const resultValue = selectedOption ? selectedOption.fixedValue : ""
            handleResultChange(test.id, resultValue, selectedFixedId)
          }}
          style={resultStyle}
        >
          <option value="">Select Result</option>
          {test.fixedDropdownValues.map((option) => (
            <option key={option.fixedId} value={option.fixedId}>
              {option.fixedValue}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        type="text"
        className="form-control"
        value={test.result}
        onChange={(e) => { if (isEditable) handleResultChange(test.id, e.target.value, null) }}
        placeholder="Enter result"
        style={resultStyle}
        readOnly={!isEditable}
      />
    )
  }

  const renderRemarksInput = (test) => {
    const isEditable = isRowEditable(test.id)
    return (
      <input
        type="text"
        className="form-control"
        value={test.remarks}
        onChange={(e) => { if (isEditable) handleRemarksChange(test.id, e.target.value) }}
        placeholder="Enter remarks"
        style={{ padding: "4px" }}
        readOnly={!isEditable}
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Back to list
  // ---------------------------------------------------------------------------
  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedHeader(null)
    setInvestigations([])
    setEditableRows([])
    setFixedDropdownCache({})
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  const handleReset = async () => {
    if (!selectedHeader) return
    setEditableRows([])
    setFixedDropdownCache({})
    setDetailLoading(true)
    try {
      const data = await getRequest(
        `${LAB}/${PENDING_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL}?${REQUEST_PARAM_ORDER_HD_ID}=${selectedHeader.orderHdId}`
      )
      if (data.status === 200 && data.response) {
        const rows = await buildInvestigationRows(data.response)
        setInvestigations(rows)
      }
    } catch (e) {
      console.error("Error resetting investigations:", e)
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Update (PUT) – payload unchanged
  // ---------------------------------------------------------------------------
  const handleUpdate = async () => {
    if (!selectedHeader) return

    if (editableRows.length === 0) {
      showPopup(SELECT_ROW_TO_EDIT_WARN_MSG, "warning")
      return
    }

    const rowsWithoutAmendmentType = investigations.filter(
      (inv) => isRowEditable(inv.id) && inv.displayType !== "main" && !inv.amendmentTypeId
    )
    if (rowsWithoutAmendmentType.length > 0) {
      showPopup("Please select Amendment Type for all editable rows", "warning")
      return
    }

    setLoading(true)
    try {
      const headerMap = new Map()
      investigations
        .filter((inv) => inv.displayType !== "main" && isRowEditable(inv.id))
        .forEach((inv) => {
          if (!headerMap.has(inv.resultEntryHeaderId)) headerMap.set(inv.resultEntryHeaderId, [])
          headerMap.get(inv.resultEntryHeaderId).push({
            resultEntryDetailsId: inv.resultEntryDetailsId,
            result: inv.result || "",
            oldResult: inv.oldResult || "",
            amendmentTypeId: inv.amendmentTypeId || null,
            remarks: inv.remarks || "",
            fixedId: inv.fixedId || null,
            comparisonType: inv.comparisonType || "",
          })
        })

      if (headerMap.size === 0) {
        showPopup(SELECT_ROW_TO_EDIT_WARN_MSG, "warning")
        setLoading(false)
        return
      }

      const updatePromises = Array.from(headerMap.entries()).map(([headerId, detailRequests]) => {
        const payload = {
          orderHdId: selectedHeader.orderHdId,
          resultEntryHeaderId: headerId,
          resultUpdateDetailRequests: detailRequests.sort((a, b) => a.resultEntryDetailsId - b.resultEntryDetailsId),
        }
        console.log("Submitting update for header:", headerId, payload)
        return putRequest(`${UPDATE_RESULT_END_URL}`, payload)
      })

      const responses = await Promise.all(updatePromises)
      const allSuccess = responses.every((r) => r.status === 200)

      if (allSuccess) {
        showPopup(RESULT_UPDATE_SUCC_MSG, "success")
        await fetchHeaders(currentPage, searchData.patientName, searchData.mobileNo)
        setShowDetailView(false)
        setSelectedHeader(null)
        setInvestigations([])
        setEditableRows([])
        setFixedDropdownCache({})
      } else {
        showPopup(RESULT_UPDATE_ERR_MSG, "error")
      }
    } catch (e) {
      console.error("Error submitting update:", e)
      showPopup(UNEXPECTED_ERROR, "error")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // DETAIL VIEW
  // ---------------------------------------------------------------------------
  if (showDetailView && selectedHeader) {
    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
        {(loading || detailLoading) && <LoadingScreen />}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">UPDATE RESULT ENTRY</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input type="text" className="form-control" value={selectedHeader.patientName || ""} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input type="text" className="form-control" value={selectedHeader.patientPhnNum || ""} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input type="text" className="form-control" value={selectedHeader.patientRelation || ""} readOnly />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input type="text" className="form-control" value={selectedHeader.patientAge || ""} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input type="text" className="form-control" value={selectedHeader.patientGender || ""} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">ORDER DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${formatDate(selectedHeader.orderDate)} - ${formatTime(selectedHeader.orderTime)}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Number</label>
                        <input type="text" className="form-control" value={selectedHeader.orderNo || ""} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investigations Table */}
                <div className="table-responsive" style={{ overflowX: "auto" }}>
                  <table
                    className="table table-bordered table-hover"
                    style={{ marginBottom: 0, tableLayout: "fixed", width: "100%", minWidth: "1000px" }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60px" }}>SL No.</th>
                        <th style={{ width: "150px" }}>Sample Id</th>
                        <th style={{ width: "120px" }}>Investigation</th>
                        <th style={{ width: "120px" }}>Sample</th>
                        <th style={{ width: "80px" }}>Result</th>
                        <th style={{ width: "60px" }}>Units</th>
                        <th style={{ width: "120px" }}>Normal Range</th>
                        <th style={{ width: "120px" }}>Amendment Type</th>
                        <th style={{ width: "140px" }}>Remarks</th>
                        <th style={{ width: "50px" }}>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investigations.map((investigation) => (
                        <React.Fragment key={investigation.id}>
                          {investigation.displayType === "main" ? (
                            <tr>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td colSpan="9" style={{ padding: "4px" }}>
                                <strong>{investigation.investigation}</strong>
                              </td>
                            </tr>
                          ) : (
                            <tr className={isRowEditable(investigation.id) ? "table-warning" : ""}>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "150px" }}>
                                <input type="text" className="form-control" value={investigation.generatedSampleId} readOnly />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <input type="text" className="form-control" value={investigation.investigation} readOnly />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <input type="text" className="form-control" value={investigation.sample} readOnly />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                {renderResultInput(investigation)}
                              </td>
                              <td style={{ padding: "4px", width: "60px" }}>
                                <input type="text" className="form-control" value={investigation.units} readOnly />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <textarea className="form-control" rows="2" value={investigation.normal_range} readOnly />
                              </td>
                              <td style={{ padding: "4px", width: "180px" }}>
                                {renderAmendmentTypeDropdown(investigation)}
                              </td>
                              <td style={{ padding: "4px", width: "140px" }}>
                                {renderRemarksInput(investigation)}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "50px" }}>
                                {renderEditCheckbox(investigation)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="text-end mt-4">
                  <button
                    className="btn btn-warning me-3"
                    onClick={handleUpdate}
                    disabled={loading || detailLoading || editableRows.length === 0}
                  >
                    UPDATE
                  </button>
                  <button
                    className="btn btn-secondary me-3"
                    onClick={handleReset}
                    disabled={loading || detailLoading}
                  >
                    RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    BACK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // LIST VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">UPDATE RESULT ENTRY</h4>
            </div>

            <div className="card-body">
              {/* Search Section – always visible */}
              <div className="mb-3">
                <div className="row g-4 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="patientName"
                      placeholder="Enter patient name"
                      value={searchData.patientName}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Mobile No.</label>
                    <input
                      type="text"
                      className="form-control"
                      id="mobileNo"
                      placeholder="Enter mobile number"
                      maxLength={10}
                      value={searchData.mobileNo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        handleSearchChange({ target: { id: "mobileNo", value } })
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <div className="col-md-3 d-flex">
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={handleSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSearchReset}
                      disabled={isSearching}
                    >
                      <i className="mdi mdi-refresh"></i> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table + Pagination – only after first search */}
              {hasSearched && (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order Date/Time</th>
                          <th>Order No.</th>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Relation</th>
                          <th>Doctor Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {headerList.length > 0 ? (
                          headerList.map((item) => (
                            <tr
                              key={item.resultEntryHeaderId}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{`${formatDate(item.orderDate)} - ${formatTime(item.orderTime)}`}</td>
                              <td>{item.orderNo}</td>
                              <td>{item.patientName}</td>
                              <td>{item.patientPhnNum}</td>
                              <td>{item.patientRelation}</td>
                              <td>{item.doctorName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              No pending validation entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalElements > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={(page) => setCurrentPage(page)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateResultValidation