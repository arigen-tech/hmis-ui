import { useState } from "react"

// ─── SVG Semicircle Gauge ────────────────────────────────────
const SemiGauge = ({ value, min, max, zones, label, unit, size = 160 }) => {
  const cx = size / 2
  const cy = size / 2 + 10
  const r = size * 0.38
  const strokeW = size * 0.1

  const valToAngle = (v) => 180 - ((v - min) / (max - min)) * 180

  const arcPath = (startDeg, endDeg, radius, sw) => {
    const toRad = (d) => (d * Math.PI) / 180
    const sx = cx + radius * Math.cos(toRad(startDeg))
    const sy = cy - radius * Math.sin(toRad(startDeg))
    const ex = cx + radius * Math.cos(toRad(endDeg))
    const ey = cy - radius * Math.sin(toRad(endDeg))
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    const sweep = endDeg > startDeg ? 0 : 1
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${large} ${sweep} ${ex} ${ey}`
  }

  const needleAngle = Math.max(0, Math.min(180, valToAngle(value)))
  const needleRad = (needleAngle * Math.PI) / 180
  const needleLen = r * 0.70
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy - needleLen * Math.sin(needleRad)

  const ticks = []
  const tickValues = zones.map(z => z.from).concat([max])
  for (const tv of tickValues) {
    const ang = valToAngle(tv)
    const rad = (ang * Math.PI) / 180
    const textRadius = r - strokeW / 2 - 8
    const lx = cx + textRadius * Math.cos(rad)
    const ly = cy - textRadius * Math.sin(rad)
    ticks.push({ ang, lx, ly, val: tv })
  }

  return (
    <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`} style={{ overflow: "visible" }}>
      {zones.map((zone, i) => {
        const startA = valToAngle(zone.from)
        const endA = valToAngle(zone.to)
        return (
          <path key={i} d={arcPath(startA, endA, r, strokeW)} fill="none"
            stroke={zone.color} strokeWidth={strokeW} strokeLinecap="butt" />
        )
      })}
      {ticks.map((t, i) => {
        const rad = (t.ang * Math.PI) / 180
        const innerRadius = r - strokeW / 2 - 2
        const outerRadius = r + strokeW / 2 + 2
        const i1x = cx + innerRadius * Math.cos(rad), i1y = cy - innerRadius * Math.sin(rad)
        const o1x = cx + outerRadius * Math.cos(rad), o1y = cy - outerRadius * Math.sin(rad)
        return (
          <g key={i}>
            <line x1={i1x} y1={i1y} x2={o1x} y2={o1y} stroke="#888" strokeWidth="1" />
            <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={size * 0.065} fill="#666" fontWeight="500">{t.val}</text>
          </g>
        )
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#334" strokeWidth={size * 0.022} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.04} fill="#334" />
      <text x={cx} y={cy + size * 0.18} textAnchor="middle" fontSize={size * 0.13} fontWeight="500" fill="#334">
        {value} {unit}
      </text>
      <text x={cx} y={size * 0.08} textAnchor="middle" fontSize={size * 0.1} fontWeight="500" fill="#334">
        {label}
      </text>
    </svg>
  )
}

// ─── Fluid Balance Chart Component with Stacked Bars ───────────────────
const FluidBalanceChart = ({ intake, output, balance, date }) => {
  const maxValue = Math.max(intake, output, 2000)
  const commonValue = Math.min(intake, output)
  const intakeRemaining = intake - commonValue
  const outputRemaining = output - commonValue

  const commonPercent = (commonValue / maxValue) * 100
  const intakeRemainingPercent = (intakeRemaining / maxValue) * 100
  const outputRemainingPercent = (outputRemaining / maxValue) * 100

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <h6 className="mb-3 fw-semibold text-center" style={{ color: "#2c3e50", fontSize: "0.9rem" }}>
          {date}
        </h6>
        
        {/* Intake Row - Heading on Left, Bar on Right */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="fw-semibold" style={{ fontSize: "1rem", color: "#2c3e50", minWidth: "70px" }}>Intake</span>
            <div className="flex-grow-1 position-relative" style={{ height: "16px" }}>
              {/* Background bar */}
              <div className="position-absolute w-100 h-100 rounded" style={{ backgroundColor: "#e9ecef" }} />
              {/* Common area bar (green) */}
              {commonValue > 0 && (
                <div 
                  className="position-absolute h-100 rounded-start"
                  style={{ 
                    width: `${commonPercent}%`, 
                    backgroundColor: "#28a745",
                    transition: "width 0.3s ease",
                    borderRadius: "4px 0 0 4px"
                  }}
                />
              )}
              {/* Intake remaining bar (light green) - only shows when intake > output */}
              {intakeRemaining > 0 && (
                <div 
                  className="position-absolute h-100"
                  style={{ 
                    width: `${intakeRemainingPercent}%`, 
                    left: `${commonPercent}%`,
                    backgroundColor: "#90EE90",
                    borderRadius: intakeRemainingPercent > 0 && outputRemaining === 0 ? "0 4px 4px 0" : "0",
                    transition: "width 0.3s ease"
                  }}
                />
              )}
            </div>
            <span className="fw-bold" style={{ fontSize: "1.3rem", color: "#28a745", minWidth: "80px", textAlign: "right" }}>{intake} ml</span>
          </div>
        </div>

        {/* Output Row - Heading on Left, Bar on Right */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="fw-semibold" style={{ fontSize: "1rem", color: "#2c3e50", minWidth: "70px" }}>Output</span>
            <div className="flex-grow-1 position-relative" style={{ height: "16px" }}>
              {/* Background bar */}
              <div className="position-absolute w-100 h-100 rounded" style={{ backgroundColor: "#e9ecef" }} />
              {/* Common area bar (green) */}
              {commonValue > 0 && (
                <div 
                  className="position-absolute h-100 rounded-start"
                  style={{ 
                    width: `${commonPercent}%`, 
                    backgroundColor: "#28a745",
                    transition: "width 0.3s ease",
                    borderRadius: "4px 0 0 4px"
                  }}
                />
              )}
              {/* Output remaining bar (light coral) - only shows when output > intake */}
              {outputRemaining > 0 && (
                <div 
                  className="position-absolute h-100"
                  style={{ 
                    width: `${outputRemainingPercent}%`, 
                    left: `${commonPercent}%`,
                    backgroundColor: "#F4A460",
                    borderRadius: outputRemainingPercent > 0 && intakeRemaining === 0 ? "0 4px 4px 0" : "0",
                    transition: "width 0.3s ease"
                  }}
                />
              )}
            </div>
            <span className="fw-bold" style={{ fontSize: "1.3rem", color: "#ffc107", minWidth: "80px", textAlign: "right" }}>{output} ml</span>
          </div>
        </div>

        {/* Balance Row */}
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-semibold" style={{ fontSize: "1rem", color: "#2c3e50" }}>Balance</span>
            <span className={`fw-bold ${balance >= 0 ? "text-info" : "text-danger"}`} style={{ fontSize: "1.3rem" }}>
              {balance >= 0 ? "+" : ""}{balance} ml
            </span>
          </div>
        </div>

        {/* Reference Line */}
        <div className="mt-3 pt-2 border-top">
          <div className="d-flex justify-content-between text-muted small">
            <span>0</span>
            <span>{Math.round(maxValue / 2)}</span>
            <span>{maxValue} ml</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Generate previous days data with varying intake/output ─────────────────
const generatePreviousDayData = (dayOffset) => {
  // Create variations where sometimes output is greater than intake
  const scenarios = [
    { intake: 1800, output: 1200 }, // Today's data - intake > output
    { intake: 1100, output: 1500 }, // Day 1 - output > intake (negative balance)
    { intake: 1400, output: 1300 }, // Day 2 - intake slightly higher
    { intake: 950, output: 1250 }   // Day 3 - output > intake
  ]
  
  const data = scenarios[dayOffset] || scenarios[0]
  const balance = data.intake - data.output
  
  return { intake: data.intake, output: data.output, balance }
}

// ─── Get dates for previous days ─────────────────────────────────────
const getDateString = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Zones config per vital ──────────────────────────────────
const BP_SYS_ZONES = [
  { from: 70, to: 90,  color: "#ffc107" },
  { from: 90, to: 120, color: "#28a745" },
  { from: 120, to: 140, color: "#fd7e14" },
  { from: 140, to: 200, color: "#dc3545" },
]
const BP_DIA_ZONES = [
  { from: 50, to: 60,  color: "#ffc107" },
  { from: 60, to: 80,  color: "#28a745" },
  { from: 80, to: 90,  color: "#fd7e14" },
  { from: 90, to: 120, color: "#dc3545" },
]
const HR_ZONES = [
  { from: 40, to: 60,  color: "#ffc107" },
  { from: 60, to: 100, color: "#28a745" },
  { from: 100, to: 130, color: "#fd7e14" },
  { from: 130, to: 180, color: "#dc3545" },
]
const TEMP_ZONES = [
  { from: 94, to: 97,   color: "#ffc107" },
  { from: 97, to: 99,   color: "#28a745" },
  { from: 99, to: 100.4, color: "#fd7e14" },
  { from: 100.4, to: 106, color: "#dc3545" },
]
const SPO2_ZONES = [
  { from: 80, to: 90,  color: "#dc3545" },
  { from: 90, to: 95,  color: "#ffc107" },
  { from: 95, to: 100, color: "#28a745" },
]
const RR_ZONES = [
  { from: 8, to: 12,  color: "#ffc107" },
  { from: 12, to: 20, color: "#28a745" },
  { from: 20, to: 25, color: "#fd7e14" },
  { from: 25, to: 35, color: "#dc3545" },
]

// ─── Dummy patient data ─────────────────────────────────────
const dummyPatientData = {
  vitals: {
    bpSystolic: 142,
    bpDiastolic: 88,
    temperature: 100.2,
    heartRate: 112,
    spo2: 93,
    respiration: 22
  },
  intakeOutput: {
    intake: 1800,
    output: 1200,
    balance: 600
  }
}

// ─── Status badge helper ─────────────────────────────────────
const getStatus = (zones, value) => {
  for (const z of zones) {
    if (value >= z.from && value <= z.to) {
      if (z.color === "#28a745") return { label: "Normal", cls: "bg-success" }
      if (z.color === "#dc3545") return { label: "Critical", cls: "bg-danger" }
    }
  }
  return { label: "—", cls: "bg-secondary" }
}

// ─── Main Component with Tabs ─────────────────────────────────
const ClinicalDashboard = ({ selectedPatient }) => {
  const [activeView, setActiveView] = useState("vitals") // "vitals" | "intakeOutput"

  const vitals = dummyPatientData.vitals
  const intakeOutput = dummyPatientData.intakeOutput

  // Generate previous 3 days data with different scenarios
  const day1 = generatePreviousDayData(1) // Output > Intake
  const day2 = generatePreviousDayData(2) // Intake > Output
  const day3 = generatePreviousDayData(3) // Output > Intake

  const bpSysStatus = getStatus(BP_SYS_ZONES, vitals.bpSystolic)
  const bpDiaStatus = getStatus(BP_DIA_ZONES, vitals.bpDiastolic)
  const hrStatus    = getStatus(HR_ZONES,     vitals.heartRate)
  const tempStatus  = getStatus(TEMP_ZONES,   vitals.temperature)
  const spo2Status  = getStatus(SPO2_ZONES,   vitals.spo2)
  const rrStatus    = getStatus(RR_ZONES,     vitals.respiration)

  return (
    <div className="container-fluid p-4">
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "vitals" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("vitals")}
        >
          Vital Details
        </button>
        <button
          className={`btn btn-sm ${activeView === "intakeOutput" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("intakeOutput")}
        >
          Intake / Output
        </button>
      </div>

      {/* ─── VITAL DETAILS SECTION ─── */}
      {activeView === "vitals" && (
        <div>
          {/* Row 1: BP Systolic | BP Diastolic | Heart Rate */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.bpSystolic}
                    min={70} max={200}
                    zones={BP_SYS_ZONES}
                    label="Systolic"
                    unit="mmHg"
                    size={160}
                  />
                  <div className="text-center mt-2">
                    <span className={`badge ${bpSysStatus.cls}`}>{bpSysStatus.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.bpDiastolic}
                    min={50} max={120}
                    zones={BP_DIA_ZONES}
                    label="Diastolic"
                    unit="mmHg"
                    size={160}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.heartRate}
                    min={40} max={180}
                    zones={HR_ZONES}
                    label="Heart Rate"
                    unit="bpm"
                    size={160}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Temperature | SpO2 | Respiration */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.temperature}
                    min={94} max={106}
                    zones={TEMP_ZONES}
                    label="Temperature"
                    unit="°F"
                    size={160}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.spo2}
                    min={80} max={100}
                    zones={SPO2_ZONES}
                    label="SpO₂"
                    unit="%"
                    size={160}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border h-100">
                <div className="card-body py-3">
                  <SemiGauge
                    value={vitals.respiration}
                    min={8} max={35}
                    zones={RR_ZONES}
                    label="Respiration"
                    unit="/min"
                    size={160}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="d-flex gap-3 mt-3 justify-content-center">
            <span className="badge bg-success">Normal</span>
            <span className="badge bg-danger">Critical</span>
          </div>
        </div>
      )}

      {/* ─── INTAKE / OUTPUT SECTION ─── */}
      {activeView === "intakeOutput" && (
        <div>
          {/* Legend for fluid balance charts */}
          <div className="d-flex gap-3 justify-content-end mb-3">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: "20px", height: "12px", backgroundColor: "#28a745", borderRadius: "3px" }}></div>
              <span style={{ fontSize: "0.75rem" }}>Common (Matched)</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: "20px", height: "12px", backgroundColor: "#90EE90", borderRadius: "3px" }}></div>
              <span style={{ fontSize: "0.75rem" }}>Intake Extra</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: "20px", height: "12px", backgroundColor: "#F4A460", borderRadius: "3px" }}></div>
              <span style={{ fontSize: "0.75rem" }}>Output Extra</span>
            </div>
          </div>

          {/* Row 1: Today and 1 Day Ago */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <FluidBalanceChart 
                intake={intakeOutput.intake}
                output={intakeOutput.output}
                balance={intakeOutput.balance}
                date={`Today (${getDateString(0)}) - Intake > Output`}
              />
            </div>
            <div className="col-md-6">
              <FluidBalanceChart 
                intake={day1.intake}
                output={day1.output}
                balance={day1.balance}
                date={`1 Day Ago (${getDateString(1)}) - Output > Intake`}
              />
            </div>
          </div>

          {/* Row 2: 2 Days Ago and 3 Days Ago */}
          <div className="row g-4">
            <div className="col-md-6">
              <FluidBalanceChart 
                intake={day2.intake}
                output={day2.output}
                balance={day2.balance}
                date={`2 Days Ago (${getDateString(2)}) - Intake > Output`}
              />
            </div>
            <div className="col-md-6">
              <FluidBalanceChart 
                intake={day3.intake}
                output={day3.output}
                balance={day3.balance}
                date={`3 Days Ago (${getDateString(3)}) - Output > Intake`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicalDashboard