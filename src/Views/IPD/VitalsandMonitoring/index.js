import { useState } from "react"

const VitalsandMonitoring = ({ selectedPatient }) => {
  const [showVitalsSection, setShowVitalsSection] = useState(true)
  const [showIntakeOutputSection, setShowIntakeOutputSection] = useState(true)

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

  const [vitalsHistory, setVitalsHistory] = useState([
    {
      id: 1,
      date: "19/01/2026",
      time: "16:20",
      temperature: "97.6",
      temperatureUnit: "°F",
      pulse: "98",
      pulseUnit: "bpm",
      respiration: "56",
      bpSystolic: "120",
      bpDiastolic: "69",
      bpUnit: "mm/Hg",
      o2Saturation: "98%",
      bowel: "Normal",
      pain: "0"
    },
    {
      id: 2,
      date: "23/03/2026",
      time: "15:01",
      temperature: "98.4",
      temperatureUnit: "°F",
      pulse: "82",
      pulseUnit: "bpm",
      respiration: "18",
      bpSystolic: "118",
      bpDiastolic: "74",
      bpUnit: "mm/Hg",
      o2Saturation: "99%",
      bowel: "Normal",
      pain: "1"
    },
    emptyVitalsRow()
  ])

  const [intakeEntries, setIntakeEntries] = useState([
    { id: 1, date: "2026-03-30", time: "08:00", oralRt: "Oral", type: "Water", qty: 200, iv: "NS", ivQty: 500, total: 700, remarks: "" },
    { id: 2, date: "2026-03-30", time: "12:00", oralRt: "Oral", type: "Juice", qty: 150, iv: "", ivQty: 0, total: 150, remarks: "" },
    { id: 3, date: "2026-03-29", time: "18:00", oralRt: "RT", type: "Soup", qty: 250, iv: "RL", ivQty: 500, total: 750, remarks: "" },
    emptyIntakeRow()
  ])

  const [outputEntries, setOutputEntries] = useState([
    { id: 1, date: "2026-03-30", time: "06:00", urine: 300, stool: 0, vomit: 0, as: 0, total: 300, remarks: "" },
    { id: 2, date: "2026-03-30", time: "10:00", urine: 250, stool: 0, vomit: 0, as: 0, total: 250, remarks: "" },
    { id: 3, date: "2026-03-29", time: "22:00", urine: 400, stool: 0, vomit: 50, as: 0, total: 450, remarks: "" },
    emptyOutputRow()
  ])

  // Vitals handlers
  const handleVitalsCellChange = (id, field, value) => {
    setVitalsHistory(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleVitalsSubmit = () => {
    const lastRow = vitalsHistory[vitalsHistory.length - 1]
    if (!lastRow.temperature && !lastRow.pulse && !lastRow.bpSystolic) {
      alert("Please fill in at least one vital before submitting.")
      return
    }
    const newEmpty = emptyVitalsRow()
    setVitalsHistory(prev => [
      ...prev.slice(0, -1),
      { ...lastRow },
      newEmpty
    ])
  }

  const handleDeleteVitals = (id) => {
    const isLast = vitalsHistory[vitalsHistory.length - 1].id === id
    if (isLast) return
    if (window.confirm("Are you sure you want to delete this vitals entry?")) {
      setVitalsHistory(prev => prev.filter(item => item.id !== id))
    }
  }

  // Intake handlers
  const handleIntakeCellChange = (id, field, value) => {
    setIntakeEntries(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        updated.total = (parseInt(updated.qty) || 0) + (parseInt(updated.ivQty) || 0)
        return updated
      }
      return item
    }))
  }

  const handleIntakeSubmit = () => {
    const lastRow = intakeEntries[intakeEntries.length - 1]
    if (!lastRow.oralRt && !lastRow.type && !lastRow.iv && !lastRow.qty && !lastRow.ivQty) {
      alert("Please fill in at least one intake field before submitting.")
      return
    }
    const newEmpty = emptyIntakeRow()
    setIntakeEntries(prev => [
      ...prev.slice(0, -1),
      { ...lastRow },
      newEmpty
    ])
  }

  const handleDeleteIntake = (id) => {
    const isLast = intakeEntries[intakeEntries.length - 1].id === id
    if (isLast) return
    if (window.confirm("Are you sure you want to delete this intake entry?")) {
      setIntakeEntries(prev => prev.filter(entry => entry.id !== id))
    }
  }

  // Output handlers
  const handleOutputCellChange = (id, field, value) => {
    setOutputEntries(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value === "" ? "" : parseInt(value) || 0 }
        updated.total = (parseInt(updated.urine) || 0) + (parseInt(updated.stool) || 0) + (parseInt(updated.vomit) || 0) + (parseInt(updated.as) || 0)
        return updated
      }
      return item
    }))
  }

  const handleOutputSubmit = () => {
    const lastRow = outputEntries[outputEntries.length - 1]
    if (!lastRow.urine && !lastRow.stool && !lastRow.vomit && !lastRow.as) {
      alert("Please fill in at least one output field before submitting.")
      return
    }
    const newEmpty = emptyOutputRow()
    setOutputEntries(prev => [
      ...prev.slice(0, -1),
      { ...lastRow },
      newEmpty
    ])
  }

  const handleDeleteOutput = (id) => {
    const isLast = outputEntries[outputEntries.length - 1].id === id
    if (isLast) return
    if (window.confirm("Are you sure you want to delete this output entry?")) {
      setOutputEntries(prev => prev.filter(entry => entry.id !== id))
    }
  }

  const isLastRow = (index, array) => index === array.length - 1

  return (
    <div className="">

      {/* Vitals Section */}
      <div className="mb-4">
        <div
          className="d-flex justify-content-between align-items-center border border-primary rounded px-1 py-2 mb-2"
          style={{ cursor: "pointer" }}
          onClick={() => setShowVitalsSection(!showVitalsSection)}
        >
          <h6 className="mb-0 text-primary">Vitals & Monitoring</h6>
          <button className="btn btn-sm">
            {showVitalsSection ? "−" : "+"}
          </button>
        </div>

        {showVitalsSection && (
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3">
              <h6 className="mb-0">Vitals Entry</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0 align-middle" >
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
                        <tr key={vitals.id}>
                          <td className="">
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
                          <td className="">
                            {isEditable ? (
                              <input
                                type="time"
                                className="form-control form-control-sm"
                                style={{ width: "100%" }}
                                value={vitals.time}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "time", e.target.value)}
                              />
                            ) : (
                              <span>{vitals.time}</span>
                            )}
                          </td>
                          <td className="">
                            {isEditable ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                style={{ width: "30px" }}

                                  value={vitals.temperature}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "temperature", e.target.value)}
                                  placeholder="Temp"
                                />
                                <select
                                  className="form-select form-select-sm"
                                style={{ width: "40px" }}

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
                          <td className="">
                            {isEditable ? (
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                   style={{ width: "30px" }}
                                  value={vitals.pulse}
                                  onChange={(e) => handleVitalsCellChange(vitals.id, "pulse", e.target.value)}
                                  placeholder="Pulse"
                                />
                                <select
                                  className="form-select"
                                  value={vitals.pulseUnit}
                                style={{ width: "40px" }}

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
                          <td style={{ padding: "8px" }}>
                            {isEditable ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "100%" }}
                                value={vitals.respiration}
                                onChange={(e) => handleVitalsCellChange(vitals.id, "respiration", e.target.value)}
                                placeholder="breaths/min"
                              />
                            ) : (
                              <span>{vitals.respiration}</span>
                            )}
                          </td>
                          <td className="">
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
                          <td className="">
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
                          <td className="">
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
                          <td className="">
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
            </div>
            <div className="d-flex justify-content-end py-2 px-2 ">
              <button className="btn btn-success btn-sm" onClick={handleVitalsSubmit}>
                Submit Vitals
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Intake & Output Section */}
      <div className="mb-4">
        <div
          className="d-flex justify-content-between align-items-center border border-primary rounded py-2"
          style={{ cursor: "pointer" }}
          onClick={() => setShowIntakeOutputSection(!showIntakeOutputSection)}
        >
          <h6 className="mb-0 text-primary">Intake & Output</h6>
          <button className="btn btn-sm">
            {showIntakeOutputSection ? "−" : "+"}
          </button>
        </div>

        {showIntakeOutputSection && (
          <div>

            {/* Intake Section */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-success text-white py-2 px-3">
                <h6 className="mb-0">Intake Entry</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th className="">Date</th>
                        <th className="">Time</th>
                        <th className="">Oral/RT</th>
                        <th className="">Type</th>
                        <th className="">Qty</th>
                        <th className="">IV</th>
                        <th className="">Qty</th>
                        <th className="">Total ml</th>
                        <th className="">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intakeEntries.map((entry, index) => {
                        const isEditable = isLastRow(index, intakeEntries)
                        return (
                          <tr key={entry.id}>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={entry.date}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "date", e.target.value)}
                                />
                              ) : (
                                <span>{entry.date}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={entry.time}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "time", e.target.value)}
                                />
                              ) : (
                                <span>{entry.time}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={entry.oralRt}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "oralRt", e.target.value)}
                                >
                                  <option value="">Select</option>
                                  <option value="Oral">Oral</option>
                                  <option value="RT">RT</option>
                                </select>
                              ) : (
                                <span>{entry.oralRt || "—"}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={entry.type}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "type", e.target.value)}
                                >
                                  <option value="">Select</option>
                                  <option value="Water">Water</option>
                                  <option value="Juice">Juice</option>
                                  <option value="Milk">Milk</option>
                                  <option value="Soup">Soup</option>
                                  <option value="Feed">Feed</option>
                                </select>
                              ) : (
                                <span>{entry.type || "—"}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.qty}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "qty", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.qty || 0} ml</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={entry.iv}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "iv", e.target.value)}
                                >
                                  <option value="">Select</option>
                                  <option value="NS">NS (Normal Saline)</option>
                                  <option value="RL">RL (Ringer's Lactate)</option>
                                  <option value="DNS">DNS (Dextrose)</option>
                                  <option value="Blood">Blood</option>
                                </select>
                              ) : (
                                <span>{entry.iv || "—"}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.ivQty}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "ivQty", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.ivQty || 0} ml</span>
                              )}
                            </td>
                            <td className="bg-light">{entry.total} ml</td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={entry.remarks}
                                  onChange={(e) => handleIntakeCellChange(entry.id, "remarks", e.target.value)}
                                  placeholder="Remarks"
                                />
                              ) : (
                                <span>{entry.remarks || "—"}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="d-flex justify-content-end px-2 py-2">
                <button className="btn btn-success btn-sm" onClick={handleIntakeSubmit}>
                  Submit Intake
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-warning text-dark py-2 px-3">
                <h6 className="mb-0">Output Entry</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th className="">Date</th>
                        <th className="">Time</th>
                        <th className="">Urine</th>
                        <th className="">Stool</th>
                        <th className="">Vomitus</th>
                        <th className="">AS</th>
                        <th className="">Total ml</th>
                        <th className="">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outputEntries.map((entry, index) => {
                        const isEditable = isLastRow(index, outputEntries)
                        return (
                          <tr key={entry.id}>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={entry.date}
                                  onChange={(e) => handleOutputCellChange(entry.id, "date", e.target.value)}
                                />
                              ) : (
                                <span>{entry.date}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={entry.time}
                                  onChange={(e) => handleOutputCellChange(entry.id, "time", e.target.value)}
                                />
                              ) : (
                                <span>{entry.time}</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.urine}
                                  onChange={(e) => handleOutputCellChange(entry.id, "urine", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.urine} ml</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.stool}
                                  onChange={(e) => handleOutputCellChange(entry.id, "stool", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.stool} ml</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.vomit}
                                  onChange={(e) => handleOutputCellChange(entry.id, "vomit", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.vomit} ml</span>
                              )}
                            </td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={entry.as}
                                  onChange={(e) => handleOutputCellChange(entry.id, "as", e.target.value)}
                                  placeholder="ml"
                                />
                              ) : (
                                <span>{entry.as} ml</span>
                              )}
                            </td>
                            <td className="bg-light">{entry.total} ml</td>
                            <td className="">
                              {isEditable ? (
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={entry.remarks}
                                  onChange={(e) => handleOutputCellChange(entry.id, "remarks", e.target.value)}
                                  placeholder="Remarks"
                                />
                              ) : (
                                <span>{entry.remarks || "—"}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-light d-flex justify-content-end py-2 px-2">
                <button className="btn btn-success btn-sm " onClick={handleOutputSubmit}>
                  Submit Output
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default VitalsandMonitoring