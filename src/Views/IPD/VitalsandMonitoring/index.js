import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { SAVE_VITALS_DETAILS, GET_VITALS_DETAILS_BY_INPATIENT_ID } from "../../../config/apiConfig"
import Popup from "../../../Components/popup"
import {
  VITALS_FILL_ONE_WARN,
  VITALS_SAVE_SUCCESS,
  VITALS_SAVE_FAILURE,
  VITALS_SAVE_ERROR,
  VITALS_FILL_INTAKE_OUTPUT_WARN
} from "../../../config/constants"

const VitalsandMonitoring = ({ selectedPatient }) => {
  const [activeView, setActiveView] = useState("vitals") // "vitals" | "intakeOutput"

  const emptyVitalsRow = () => ({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0].split("-").reverse().join("/"),
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    temperature: "",
    temperatureUnit: "°F",
    pulse: "",
    pulseUnit: "bpm",
    respiration: "",
    bpSystolic: "",
    bpDiastolic: "",
    bpUnit: "mm/Hg",
    o2Saturation: "",
    bowel: "",
    pain: ""
  })

  const emptyIntakeRow = () => ({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    oralRt: "",
    type: "",
    qty: "",
    iv: "",
    ivQty: "",
    total: 0,
    remarks: ""
  })

  const emptyOutputRow = () => ({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    urine: "",
    stool: "",
    vomit: "",
    as: "",
    total: 0,
    remarks: ""
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (onCloseCallback) {
          onCloseCallback()
        }
      }
    })
  }

  const [vitalsHistory, setVitalsHistory] = useState([
    emptyVitalsRow()
  ])

  const [intakeEntries, setIntakeEntries] = useState([
    { id: 1, date: "2026-03-30", time: "08:00", oralRt: "Oral", type: "Water", qty: 200, iv: "NS", ivQty: 500, total: 700, remarks: "" },
    { id: 2, date: "2026-03-30", time: "12:00", oralRt: "Oral", type: "Juice", qty: 150, iv: "", ivQty: 0, total: 150, remarks: "" },
    { id: 3, date: "2026-03-29", time: "18:00", oralRt: "RT", type: "Soup", qty: 250, iv: "RL", ivQty: 500, total: 750, remarks: "" }
  ])

  const [outputEntries, setOutputEntries] = useState([
    { id: 1, date: "2026-03-30", time: "06:00", urine: 300, stool: 0, vomit: 0, as: 0, total: 300, remarks: "" },
    { id: 2, date: "2026-03-30", time: "10:00", urine: 250, stool: 0, vomit: 0, as: 0, total: 250, remarks: "" },
    { id: 3, date: "2026-03-29", time: "22:00", urine: 400, stool: 0, vomit: 50, as: 0, total: 450, remarks: "" }
  ])

  // ─── ADD INTAKE/OUTPUT MODAL STATE ───
  const createModalIntakeRow = () => ({ id: Date.now() + Math.random(), typeRoute: "", item: "", qty: "" })
  const createModalOutputRow = () => ({ id: Date.now() + Math.random(), item: "", qty: "" })

  const [showAddModal, setShowAddModal] = useState(false)
  const [modalIntakeRows, setModalIntakeRows] = useState([createModalIntakeRow()])
  const [modalOutputRows, setModalOutputRows] = useState([createModalOutputRow()])

  // Vitals handlers
  const handleVitalsCellChange = (id, field, value) => {
    setVitalsHistory(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const parseDateToISO = (dateStr, timeStr) => {
    try {
      if (!dateStr) return new Date().toISOString()
      let yyyy, mm, dd
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/")
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            [yyyy, mm, dd] = parts
          } else {
            [dd, mm, yyyy] = parts
          }
        }
      } else if (dateStr.includes("-")) {
        const parts = dateStr.split("-")
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            [yyyy, mm, dd] = parts
          } else {
            [dd, mm, yyyy] = parts
          }
        }
      }
      if (yyyy && mm && dd) {
        const time = timeStr && timeStr.trim() ? timeStr.trim() : "00:00"
        const isoStr = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${time}:00.000Z`
        const d = new Date(isoStr)
        if (!isNaN(d.getTime())) {
          return d.toISOString()
        }
      }
      return new Date().toISOString()
    } catch (e) {
      return new Date().toISOString()
    }
  }

  const formatDateAndTime = (datetimeStr) => {
    if (!datetimeStr) return { date: "", time: "" }
    const d = new Date(datetimeStr)
    if (isNaN(d.getTime())) return { date: "", time: "" }
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`
    }
  }

  const fetchVitalsDetails = async () => {
    const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id || 26
    if (!inpatientId) {
      setVitalsHistory([emptyVitalsRow()])
      return
    }

    setLoading(true)
    try {
      const response = await getRequest(`${GET_VITALS_DETAILS_BY_INPATIENT_ID}/${inpatientId}`)
      if (response && response.response && Array.isArray(response.response)) {
        const sorted = [...response.response].sort((a, b) => new Date(a.observationDatetime) - new Date(b.observationDatetime))
        const mapped = sorted.map(item => {
          const { date, time } = formatDateAndTime(item.observationDatetime)
          return {
            id: item.vitalId || Date.now() + Math.random(),
            date: date,
            time: time,
            temperature: item.temperature !== null && item.temperature !== undefined ? String(item.temperature) : "",
            temperatureUnit: "°F",
            pulse: item.pulse !== null && item.pulse !== undefined ? String(item.pulse) : "",
            pulseUnit: "bpm",
            respiration: item.respiration !== null && item.respiration !== undefined ? String(item.respiration) : "",
            bpSystolic: item.bpSystolic !== null && item.bpSystolic !== undefined ? String(item.bpSystolic) : "",
            bpDiastolic: item.bpDiastolic !== null && item.bpDiastolic !== undefined ? String(item.bpDiastolic) : "",
            bpUnit: "mm/Hg",
            o2Saturation: item.spo2 !== null && item.spo2 !== undefined ? `${item.spo2}%` : "",
            bowel: "Normal",
            pain: item.painScore !== null && item.painScore !== undefined ? String(item.painScore) : ""
          }
        })
        setVitalsHistory([...mapped, emptyVitalsRow()])
      } else {
        setVitalsHistory([emptyVitalsRow()])
      }
    } catch (error) {
      console.error("Error fetching vitals details:", error)
      setVitalsHistory([emptyVitalsRow()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVitalsDetails()
  }, [selectedPatient])

  const handleVitalsSubmit = async () => {
    const lastRow = vitalsHistory[vitalsHistory.length - 1]
    if (!lastRow.temperature && !lastRow.pulse && !lastRow.bpSystolic && !lastRow.respiration && !lastRow.o2Saturation && !lastRow.pain) {
      showPopup(VITALS_FILL_ONE_WARN, "warning")
      return
    }

    const inpatientId = Number(selectedPatient?.inpatientId || selectedPatient?.id || 26)
    const observationDatetime = parseDateToISO(lastRow.date, lastRow.time)

    const payload = {
      inpatientId: inpatientId,
      observationDatetime: observationDatetime,
      temperature: lastRow.temperature ? Number(lastRow.temperature) : null,
      pulse: lastRow.pulse ? Number(lastRow.pulse) : null,
      bpSystolic: lastRow.bpSystolic ? Number(lastRow.bpSystolic) : null,
      bpDiastolic: lastRow.bpDiastolic ? Number(lastRow.bpDiastolic) : null,
      respiration: lastRow.respiration ? Number(lastRow.respiration) : null,
      spo2: lastRow.o2Saturation ? Number(String(lastRow.o2Saturation).replace("%", "")) : null,
      painScore: lastRow.pain !== "" && lastRow.pain !== null && lastRow.pain !== undefined ? Number(lastRow.pain) : null
    }

    setSaving(true)
    try {
      const response = await postRequest(SAVE_VITALS_DETAILS, payload)
      if (response && (response.status === 200 || response.message === "success")) {
        showPopup(response.response || VITALS_SAVE_SUCCESS, "success")
        await fetchVitalsDetails()
      } else {
        showPopup(response?.message || VITALS_SAVE_FAILURE, "error")
      }
    } catch (error) {
      console.error("Error saving vitals details:", error)
      showPopup(VITALS_SAVE_ERROR, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVitals = (id) => {
    const isLast = vitalsHistory[vitalsHistory.length - 1].id === id
    if (isLast) return
    if (window.confirm("Are you sure you want to delete this vitals entry?")) {
      setVitalsHistory(prev => prev.filter(item => item.id !== id))
    }
  }

  const isLastRow = (index, array) => index === array.length - 1

  // ─── Add Intake/Output Modal handlers ───
  const handleOpenAddModal = () => {
    setModalIntakeRows([createModalIntakeRow()])
    setModalOutputRows([createModalOutputRow()])
    setShowAddModal(true)
  }

  const addModalIntakeRow = () => {
    setModalIntakeRows(prev => [...prev, createModalIntakeRow()])
  }

  const updateModalIntakeRow = (id, field, value) => {
    setModalIntakeRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const deleteModalIntakeRow = (id) => {
    setModalIntakeRows(prev => (prev.length === 1 ? prev : prev.filter(row => row.id !== id)))
  }

  const addModalOutputRow = () => {
    setModalOutputRows(prev => [...prev, createModalOutputRow()])
  }

  const updateModalOutputRow = (id, field, value) => {
    setModalOutputRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const deleteModalOutputRow = (id) => {
    setModalOutputRows(prev => (prev.length === 1 ? prev : prev.filter(row => row.id !== id)))
  }

  const modalIntakeTotalQty = modalIntakeRows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0)
  const modalOutputTotalQty = modalOutputRows.reduce((sum, row) => sum + (parseInt(row.qty) || 0), 0)

  const handleSaveIntakeOutputModal = () => {
    const filledIntakeRows = modalIntakeRows.filter(row => row.typeRoute || row.item || row.qty)
    const filledOutputRows = modalOutputRows.filter(row => row.item || row.qty)

    if (filledIntakeRows.length === 0 && filledOutputRows.length === 0) {
      showPopup(VITALS_FILL_INTAKE_OUTPUT_WARN, "warning")
      return
    }

    if (filledIntakeRows.length > 0) {
      const newIntakeEntries = filledIntakeRows.map(row => {
        const qty = parseInt(row.qty) || 0
        return {
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          oralRt: row.typeRoute,
          type: row.item,
          qty: qty,
          iv: "",
          ivQty: "",
          total: qty,
          remarks: ""
        }
      })
      setIntakeEntries(prev => [
        ...prev,
        ...newIntakeEntries
      ])
    }

    if (filledOutputRows.length > 0) {
      const newOutputEntries = filledOutputRows.map(row => {
        const qty = parseInt(row.qty) || 0
        const entry = {
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          urine: 0,
          stool: 0,
          vomit: 0,
          as: 0,
          total: qty,
          remarks: ""
        }
        if (row.item === "Urine") entry.urine = qty
        else if (row.item === "Stool") entry.stool = qty
        else if (row.item === "Vomitus") entry.vomit = qty
        else if (row.item === "AS") entry.as = qty
        return entry
      })
      setOutputEntries(prev => [
        ...prev,
        ...newOutputEntries
      ])
    }

    setShowAddModal(false)
  }

  return (
    <div>
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3 align-items-center">
        <button
          className={`btn btn-sm ${activeView === "vitals" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("vitals")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Vitals & Monitoring
        </button>
        <button
          className={`btn btn-sm ${activeView === "intakeOutput" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("intakeOutput")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Intake & Output
        </button>
        <button
          className="btn btn-sm btn-success"
          onClick={handleOpenAddModal}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          + Add Intake/Output
        </button>
      </div>

      {/* ─── VITALS SECTION ─── */}
      {activeView === "vitals" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Vitals Entry</strong>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ maxWidth: "60px" }}>Date</th>
                      <th style={{ minWidth: "60px" }}>Time</th>
                      <th style={{ minWidth: "130px" }}>Temp.</th>
                      <th style={{ minWidth: "130px" }}>Pulse</th>
                      <th style={{ minWidth: "60px" }}>Respiration</th>
                      <th style={{ minWidth: "60px" }}>BP</th>
                      <th style={{ minWidth: "60px" }}>O₂ Saturation</th>
                      <th style={{ minWidth: "60px" }}>Bowel</th>
                      <th style={{ minWidth: "60px" }}>Pain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsHistory.map((vitals, index) => {
                      const isEditable = isLastRow(index, vitalsHistory)
                      return (
                        <tr key={vitals.id} className={isEditable ? "" : "table-secondary"}>
                          <td>
                            {isEditable ? (
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={vitals.date.includes("/") ? vitals.date.split("/").reverse().join("-") : vitals.date}
                                onChange={(e) => {
                                  const newDate = e.target.value.split("-").reverse().join("/")
                                  handleVitalsCellChange(vitals.id, "date", newDate)
                                }}
                              />
                            ) : (
                              <span>{vitals.date}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                value={vitals.time}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "time", e.target.value)}
                              />
                            ) : (
                              <span>{vitals.time}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={vitals.temperature}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "temperature", e.target.value)}
                                  placeholder="Temp"
                                />
                                <select
                                  className="form-select form-select-sm"
                                  style={{ width: "60px" }}
                                  value={vitals.temperatureUnit}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "temperatureUnit", e.target.value)}
                                >
                                  <option>°F</option>
                                  <option>°C</option>
                                </select>
                              </div>
                            ) : (
                              <span>{vitals.temperature} {vitals.temperatureUnit}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={vitals.pulse}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "pulse", e.target.value)}
                                  placeholder="Pulse"
                                />
                                <select
                                  className="form-select form-select-sm"
                                  style={{ width: "70px" }}
                                  value={vitals.pulseUnit}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "pulseUnit", e.target.value)}
                                >
                                  <option>bpm</option>
                                  <option>mmHg</option>
                                </select>
                              </div>
                            ) : (
                              <span>{vitals.pulse} {vitals.pulseUnit}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={vitals.respiration}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "respiration", e.target.value)}
                                placeholder="breaths/min"
                              />
                            ) : (
                              <span>{vitals.respiration}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={vitals.bpSystolic}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "bpSystolic", e.target.value)}
                                  placeholder="Sys"
                                />
                                <span className="input-group-text">/</span>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={vitals.bpDiastolic}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "bpDiastolic", e.target.value)}
                                  placeholder="Dia"
                                />
                              </div>
                            ) : (
                              <span>{vitals.bpSystolic}/{vitals.bpDiastolic}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={vitals.o2Saturation}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "o2Saturation", e.target.value)}
                                placeholder="e.g. 98%"
                              />
                            ) : (
                              <span>{vitals.o2Saturation}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <select
                                className="form-select form-select-sm"
                                value={vitals.bowel}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "bowel", e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="Normal">Normal</option>
                                <option value="Constipation">Constipation</option>
                                <option value="Diarrhea">Diarrhea</option>
                              </select>
                            ) : (
                              <span>{vitals.bowel || "—"}</span>
                            )}
                          </td>
                          <td>
                            {isEditable ? (
                              <select
                                className="form-select form-select-sm"
                                value={vitals.pain}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "pain", e.target.value)}
                              >
                                <option value="">Select</option>
                                <option value="0">0 - No Pain</option>
                                <option value="1">1 - Mild</option>
                                <option value="2">2 - Moderate</option>
                                <option value="3">3 - Severe</option>
                              </select>
                            ) : (
                              <span>{vitals.pain || "—"}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="d-flex gap-2 justify-content-end py-2 px-2">
            <button className="btn btn-success btn-sm" onClick={handleVitalsSubmit} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
            <button className="btn btn-success btn-sm" onClick={handleVitalsSubmit} disabled={saving}>
              Print
            </button>
          </div>
        </div>
      )}

      {/* ─── INTAKE & OUTPUT SECTION ─── */}
      {activeView === "intakeOutput" && (
        <div>
          {/* Intake Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-success text-white py-2">
              <strong>Intake Entry</strong>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Oral/RT</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>IV</th>
                      <th>Qty</th>
                      <th>Total ml</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intakeEntries.map((entry) => (
                      <tr key={entry.id} className="table-secondary">
                        <td><span>{entry.date}</span></td>
                        <td><span>{entry.time}</span></td>
                        <td><span>{entry.oralRt || "—"}</span></td>
                        <td><span>{entry.type || "—"}</span></td>
                        <td><span>{entry.qty || 0} ml</span></td>
                        <td><span>{entry.iv || "—"}</span></td>
                        <td><span>{entry.ivQty || 0} ml</span></td>
                        <td>{entry.total} ml</td>
                        <td><span>{entry.remarks || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark py-2">
              <strong>Output Entry</strong>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Urine</th>
                      <th>Stool</th>
                      <th>Vomitus</th>
                      <th>AS</th>
                      <th>Total ml</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputEntries.map((entry) => (
                      <tr key={entry.id} className="table-secondary">
                        <td><span>{entry.date}</span></td>
                        <td><span>{entry.time}</span></td>
                        <td><span>{entry.urine} ml</span></td>
                        <td><span>{entry.stool} ml</span></td>
                        <td><span>{entry.vomit} ml</span></td>
                        <td><span>{entry.as} ml</span></td>
                        <td>{entry.total} ml</td>
                        <td><span>{entry.remarks || "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD INTAKE/OUTPUT MODAL ─── */}
      {showAddModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'flex-end', 
            alignItems: 'center',
            paddingLeft: '5rem'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Add Intake / Output</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Intake Section */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Intake</h6>
                  <button type="button" className="btn btn-sm btn-success" onClick={addModalIntakeRow}>
                    + Add Row
                  </button>
                </div>
                <div className="table-responsive mb-2">
                  <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: "0.8rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "8%" }}>Sl.No</th>
                        <th style={{ width: "27%" }}>Type/Route</th>
                        <th style={{ width: "27%" }}>Item</th>
                        <th style={{ width: "23%" }}>Qty (ml)</th>
                        <th style={{ width: "15%" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalIntakeRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="text-center">{idx + 1}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.typeRoute}
                              onChange={(e) => updateModalIntakeRow(row.id, "typeRoute", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Oral">Oral</option>
                              <option value="RT">RT</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.item}
                              onChange={(e) => updateModalIntakeRow(row.id, "item", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Water">Water</option>
                              <option value="Juice">Juice</option>
                              <option value="Milk">Milk</option>
                              <option value="Soup">Soup</option>
                              <option value="Feed">Feed</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={row.qty}
                              onChange={(e) => updateModalIntakeRow(row.id, "qty", e.target.value)}
                              placeholder="ml"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteModalIntakeRow(row.id)}
                              disabled={modalIntakeRows.length === 1}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end fw-bold">Total Quantity</td>
                        <td className="fw-bold">{modalIntakeTotalQty} ml</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <hr />

                {/* Output Section */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Output</h6>
                  <button type="button" className="btn btn-sm btn-success" onClick={addModalOutputRow}>
                    + Add Row
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: "0.8rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "10%" }}>Sl.No</th>
                        <th style={{ width: "45%" }}>Item</th>
                        <th style={{ width: "30%" }}>Qty (ml)</th>
                        <th style={{ width: "15%" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalOutputRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="text-center">{idx + 1}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={row.item}
                              onChange={(e) => updateModalOutputRow(row.id, "item", e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Urine">Urine</option>
                              <option value="Stool">Stool</option>
                              <option value="Vomitus">Vomitus</option>
                              <option value="AS">AS</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={row.qty}
                              onChange={(e) => updateModalOutputRow(row.id, "qty", e.target.value)}
                              placeholder="ml"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteModalOutputRow(row.id)}
                              disabled={modalOutputRows.length === 1}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className="text-end fw-bold">Total Quantity</td>
                        <td className="fw-bold">{modalOutputTotalQty} ml</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveIntakeOutputModal}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VitalsandMonitoring