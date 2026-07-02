import React, { useEffect, useState } from "react";
import "./dashboard.css";

const Dashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("Last 7 Days");

  // Toggle states for patient trend chart lines
  const [showReg, setShowReg] = useState(true);
  const [showOPD, setShowOPD] = useState(true);
  const [showIPD, setShowIPD] = useState(true);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Bed statistics constants
  const bedStats = {
    total: 250,
    occupied: { count: 205, percentage: 82 },
    available: { count: 35, percentage: 14 },
    cleaning: { count: 5, percentage: 2 },
    maintenance: { count: 5, percentage: 2 }
  };

  // Ward Wise Bed Statistics
  const wardWiseBeds = [
    { name: "General Ward", occupied: 85, available: 20, cleaning: 3, maintenance: 2, total: 110 },
    { name: "Semi Private Ward", occupied: 40, available: 10, cleaning: 2, maintenance: 1, total: 53 },
    { name: "Private Ward", occupied: 25, available: 10, cleaning: 2, maintenance: 1, total: 38 },
    { name: "ICU", occupied: 22, available: 3, cleaning: 0, maintenance: 0, total: 25 },
    { name: "NICU", occupied: 12, available: 3, cleaning: 0, maintenance: 0, total: 15 },
    { name: "HDU", occupied: 10, available: 4, cleaning: 1, maintenance: 1, total: 16 },
    { name: "Isolation Ward", occupied: 6, available: 2, cleaning: 0, maintenance: 0, total: 8 },
    { name: "Maternity Ward", occupied: 5, available: 2, cleaning: 2, maintenance: 0, total: 9 }
  ];

  // IPD Admission Summary
  const ipdSummary = {
    todayAdmission: 22,
    discharges: 18,
    currentIpd: 126,
    icuPatients: 14
  };

  // OPD, Lab & Billing KPI Summaries
  const opdSummary = {
    todayOPD: 342,
    newReg: 125,
    revisits: 217
  };

  const labSummary = {
    todayTests: 185,
    pendingReports: 28,
    completedReports: 157
  };

  const billingSummary = {
    todayBilling: "₹1,42,800",
    collectedAmount: "₹1,28,500",
    pendingBilling: "₹14,300"
  };

  // Billing Statistics List
  const billingStats = [
    { name: "OPD Billing", amount: "₹85,400", percentage: 40 },
    { name: "IPD Billing", amount: "₹1,20,500", percentage: 56 },
    { name: "Pharmacy Billing", amount: "₹65,200", percentage: 30 },
    { name: "Lab Billing", amount: "₹42,800", percentage: 20 },
    { name: "Radiology Billing", amount: "₹24,300", percentage: 11 },
    { name: "Consult Billing", amount: "₹18,500", percentage: 8 },
    { name: "Emergency Billing", amount: "₹15,000", percentage: 7 }
  ];

  // Payment Mode Distribution
  const paymentModes = [
    { name: "Cash", percentage: 35 },
    { name: "Card", percentage: 25 },
    { name: "UPI", percentage: 30 },
    { name: "Insurance", percentage: 10 }
  ];

  // IPD Ward Occupancy Percentages
  const wardOccupancy = [
    { name: "General Ward", percentage: 85 },
    { name: "Semi Private Ward", percentage: 78 },
    { name: "Private Ward", percentage: 65 },
    { name: "ICU", percentage: 92 }
  ];

  // OPD Specialty Wise
  const opdSpecialties = [
    { name: "Gen Medicine", count: 220 },
    { name: "Orthopedic", count: 180 },
    { name: "Pediatrics", count: 140 },
    { name: "Gynecology", count: 125 },
    { name: "ENT", count: 95 },
    { name: "Cardiology", count: 80 },
    { name: "Dental", count: 65 },
    { name: "Neurology", count: 50 },
    { name: "Dermatology", count: 40 }
  ];

  // Top Investigations
  const topInvestigations = [
    { name: "CBC", count: 220 },
    { name: "Blood Sugar", count: 180 },
    { name: "LFT", count: 150 },
    { name: "KFT", count: 132 },
    { name: "Thyroid", count: 98 },
    { name: "Lipid Profile", count: 85 },
    { name: "Urine R/M", count: 70 },
    { name: "X-Ray Chest", count: 55 }
  ];

  // Top Diagnosis
  const topDiagnosis = [
    { name: "Hypertension", count: 165 },
    { name: "Diabetes", count: 142 },
    { name: "Fever", count: 125 },
    { name: "Viral Infection", count: 110 },
    { name: "Arthritis", count: 90 },
    { name: "Asthma", count: 75 },
    { name: "Gastritis", count: 60 },
    { name: "Anaemia", count: 45 }
  ];

  // Patient Trend Data (7 Days)
  const patientTrend = {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    registration: [620, 680, 780, 820, 950, 1200, 580],
    opd: [680, 800, 850, 1050, 1100, 1250, 600],
    ipd: [100, 120, 150, 180, 220, 260, 80]
  };

  // SVG dimensions for Line Chart
  const lineChartWidth = 600;
  const lineChartHeight = 240;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 25;

  const plotWidth = lineChartWidth - padLeft - padRight;
  const plotHeight = lineChartHeight - padTop - padBottom;
  const maxVal = 1400;

  const getCoordinates = (value, index) => {
    const x = padLeft + index * (plotWidth / 6);
    const y = lineChartHeight - padBottom - (value / maxVal) * plotHeight;
    return { x, y };
  };

  // Generates SVG Path string
  const generatePath = (data) => {
    return data.map((val, i) => {
      const { x, y } = getCoordinates(val, i);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  // Generates SVG Area Path string
  const generateAreaPath = (data) => {
    const linePath = generatePath(data);
    const firstX = padLeft;
    const lastX = padLeft + 6 * (plotWidth / 6);
    const baseY = lineChartHeight - padBottom;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  return (
    <div className="modern-dashboard anim-fade-in">

      {/* Dashboard Top Header Block */}
      <div className="dashboard-header d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="dashboard-title-area">
          <h2>Clinical & Operational Dashboard</h2>
          <p>Real-time updates & hospital status insights • Auto-refreshes every 15 min</p>
        </div>
        <div className="dashboard-filters">
          {["Today", "Last 7 Days", "Last Month"].map((tab) => (
            <button
              key={tab}
              className={`filter-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: KPI Statistics Overview */}
      <div className="metric-row">
        {/* Today's OPD Visits */}
        <div className="glass-card card-info">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Today's OPD Visits</span>
              <span className="metric-value">{opdSummary.todayOPD}</span>
              <span className="metric-meta text-primary">New: {opdSummary.newReg} • Revisit: {opdSummary.revisits}</span>
            </div>
            <div className="metric-icon-box bg-info-light">
              <i className="icofont-doctor-alt" />
            </div>
          </div>
        </div>

        {/* Today's Lab Tests */}
        <div className="glass-card card-available">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Today's Lab Tests</span>
              <span className="metric-value">{labSummary.todayTests}</span>
              <span className="metric-meta text-success">{labSummary.pendingReports} pending reports</span>
            </div>
            <div className="metric-icon-box bg-available-light">
              <i className="icofont-laboratory" />
            </div>
          </div>
        </div>

        {/* Today's Billing/Revenue */}
        <div className="glass-card card-billing">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Today's Revenue</span>
              <span className="metric-value">{billingSummary.todayBilling}</span>
              <span className="metric-meta text-warning">Pending: {billingSummary.pendingBilling}</span>
            </div>
            <div className="metric-icon-box bg-billing-light">
              <i className="icofont-coins" />
            </div>
          </div>
        </div>

        {/* Today's Admission */}
        <div className="glass-card card-info">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Today's Admission</span>
              <span className="metric-value">{ipdSummary.todayAdmission}</span>
              <span className="metric-meta text-primary">+{ipdSummary.todayAdmission} new today</span>
            </div>
            <div className="metric-icon-box bg-info-light">
              <i className="icofont-sign-in" />
            </div>
          </div>
        </div>

        {/* Discharges */}
        <div className="glass-card card-available">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Discharges</span>
              <span className="metric-value">{ipdSummary.discharges}</span>
              <span className="metric-meta text-success">-{ipdSummary.discharges} checked out</span>
            </div>
            <div className="metric-icon-box bg-available-light">
              <i className="icofont-sign-out" />
            </div>
          </div>
        </div>

        {/* Current IPD */}
        <div className="glass-card card-accent">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Current IPD</span>
              <span className="metric-value">{ipdSummary.currentIpd}</span>
              <span className="metric-meta text-muted">Inpatient department</span>
            </div>
            <div className="metric-icon-box bg-accent-light">
              <i className="icofont-hospital" />
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-layout-grid">

        {/* ── Row 1: OPD Statistics full width ── */}
        <div className="glass-card span-12">
          <div className="card-title-bar">
            <h5><i className="icofont-doctor-alt text-info" /> OPD Statistics</h5>
          </div>
          <div className="card-body-content opd-dashboard-row">
            {/* Specialty bars */}
            <div className="opd-chart-col">
              <h6>Specialty-Wise Distribution</h6>
              <div className="vertical-bar-chart">
                {opdSpecialties.map((spec, idx) => {
                  const heightPercent = (spec.count / 220) * 100;
                  return (
                    <div className="vertical-bar-item" key={idx}>
                      <div className="vertical-bar-value">{spec.count}</div>
                      <div className="vertical-bar-container">
                        <div
                          className="vertical-bar-fill gradient-fill-teal"
                          style={{ height: isMounted ? `${heightPercent}%` : "0%" }}
                          title={`${spec.name}: ${spec.count}`}
                        />
                      </div>
                      <div className="vertical-bar-label" title={spec.name}>{spec.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gender Donut */}
            <div className="opd-gender-col">
              <h6>Gender Distribution</h6>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div className="donut-svg-wrapper" style={{ width: "130px", height: "130px" }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="130.7 251.3" strokeDashoffset="0" transform="rotate(-90 50 50)" className="chart-segment" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="10" strokeDasharray="103.0 251.3" strokeDashoffset="-130.7" transform="rotate(-90 50 50)" className="chart-segment" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="17.6 251.3" strokeDashoffset="-233.7" transform="rotate(-90 50 50)" className="chart-segment" />
                  </svg>
                  <div className="donut-center-text">
                    <div className="donut-center-number" style={{ fontSize: "1.3rem" }}>{opdSummary.todayOPD}</div>
                    <div className="donut-center-label">Total</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", fontSize: "0.8rem" }}>
                  {[
                    { label: "Male", pct: "52%", color: "#3b82f6" },
                    { label: "Female", pct: "41%", color: "#ec4899" },
                    { label: "Child", pct: "7%", color: "#10b981" }
                  ].map((g) => (
                    <div key={g.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: g.color, display: "inline-block" }} />
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{g.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>{g.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Top Investigations | Top Diagnosis | Billing & Financials ── */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-laboratory text-primary" /> Top Investigations</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {topInvestigations.map((inv, idx) => {
                const heightPercent = (inv.count / 220) * 100;
                return (
                  <div className="vertical-bar-item" key={idx}>
                    <div className="vertical-bar-value">{inv.count}</div>
                    <div className="vertical-bar-container">
                      <div
                        className="vertical-bar-fill gradient-fill-blue"
                        style={{ height: isMounted ? `${heightPercent}%` : "0%" }}
                        title={`${inv.name}: ${inv.count}`}
                      />
                    </div>
                    <div className="vertical-bar-label" title={inv.name}>{inv.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-stethoscope text-accent" /> Top Diagnosis</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {topDiagnosis.map((diag, idx) => {
                const heightPercent = (diag.count / 165) * 100;
                return (
                  <div className="vertical-bar-item" key={idx}>
                    <div className="vertical-bar-value">{diag.count}</div>
                    <div className="vertical-bar-container">
                      <div
                        className="vertical-bar-fill gradient-fill-coral"
                        style={{ height: isMounted ? `${heightPercent}%` : "0%" }}
                        title={`${diag.name}: ${diag.count}`}
                      />
                    </div>
                    <div className="vertical-bar-label" title={diag.name}>{diag.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Billing & Financials */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-coins text-warning" /> Billing & Financials</h5>
          </div>
          <div className="card-body-content" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Bar chart row */}
            <div className="billing-bar-chart">
              <div className="vertical-bar-chart">
                {billingStats.map((bill, idx) => {
                  const amt = parseInt(bill.amount.replace(/[^0-9]/g, ""), 10);
                  const heightPercent = (amt / 120500) * 100;
                  return (
                    <div className="vertical-bar-item" key={idx}>
                      <div className="vertical-bar-value" style={{ fontSize: "0.62rem" }}>{bill.amount}</div>
                      <div className="vertical-bar-container">
                        <div
                          className="vertical-bar-fill gradient-fill-purple"
                          style={{ height: isMounted ? `${heightPercent}%` : "0%" }}
                          title={`${bill.name}: ${bill.amount}`}
                        />
                      </div>
                      <div className="vertical-bar-label" title={bill.name} style={{ fontSize: "0.62rem" }}>
                        {bill.name.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Mode Donut + Legend */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>
                Payment Mode
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div className="donut-svg-wrapper" style={{ width: "80px", height: "80px", flexShrink: 0 }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="83.5 238.8" strokeDashoffset="0" transform="rotate(-90 50 50)" className="chart-segment" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="71.6 238.8" strokeDashoffset="-83.5" transform="rotate(-90 50 50)" className="chart-segment" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#ec4899" strokeWidth="12" strokeDasharray="59.7 238.8" strokeDashoffset="-155.1" transform="rotate(-90 50 50)" className="chart-segment" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="23.9 238.8" strokeDashoffset="-214.8" transform="rotate(-90 50 50)" className="chart-segment" />
                  </svg>
                  <div className="donut-center-text">
                    <div className="donut-center-number" style={{ fontSize: "0.8rem", fontWeight: 800 }}>₹1.4L</div>
                    <div className="donut-center-label" style={{ fontSize: "0.5rem" }}>Revenue</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, fontSize: "0.75rem" }}>
                  {[
                    { label: "Cash", pct: "35%", color: "#3b82f6" },
                    { label: "UPI", pct: "30%", color: "#10b981" },
                    { label: "Card", pct: "25%", color: "#ec4899" },
                    { label: "Insurance", pct: "10%", color: "#f59e0b" }
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.color, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{m.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>{m.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Daily Patient Trend full width ── */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-chart-line text-accent" /> Daily Patient Trend (Last 7 Days)</h5>
            <div className="chart-legends-horizontal mt-0">
              <div
                className={`chart-legend-pill ${showReg ? "" : "inactive"}`}
                onClick={() => setShowReg(!showReg)}
              >
                <span className="legend-color-dot" style={{ backgroundColor: "#2563eb" }} />
                <span>Registrations</span>
              </div>
              <div
                className={`chart-legend-pill ${showOPD ? "" : "inactive"}`}
                onClick={() => setShowOPD(!showOPD)}
              >
                <span className="legend-color-dot" style={{ backgroundColor: "#8b5cf6" }} />
                <span>OPD Visits</span>
              </div>
              <div
                className={`chart-legend-pill ${showIPD ? "" : "inactive"}`}
                onClick={() => setShowIPD(!showIPD)}
              >
                <span className="legend-color-dot" style={{ backgroundColor: "#10b981" }} />
                <span>IPD Admissions</span>
              </div>
            </div>
          </div>
          <div className="card-body-content">
            <div className="chart-container-rel">
              <svg width="100%" height="auto" viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} style={{ display: "block" }}>
                <defs>
                  <linearGradient id="reg-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="opd-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ipd-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Gridlines */}
                {[0, 200, 400, 600, 800, 1000, 1200, 1400].map((v, idx) => {
                  const y = lineChartHeight - padBottom - (v / maxVal) * plotHeight;
                  return (
                    <g key={idx}>
                      <line x1={padLeft} y1={y} x2={lineChartWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">{v}</text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {patientTrend.days.map((d, i) => {
                  const x = padLeft + i * (plotWidth / 6);
                  return (
                    <text key={i} x={x} y={lineChartHeight - 6} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">{d}</text>
                  );
                })}

                {/* Registration Area and Line */}
                {showReg && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.registration)} fill="url(#reg-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.registration)} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line-path" />
                  </>
                )}

                {/* OPD Visits Area and Line */}
                {showOPD && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.opd)} fill="url(#opd-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.opd)} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line-path" />
                  </>
                )}

                {/* IPD Admissions Area and Line */}
                {showIPD && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.ipd)} fill="url(#ipd-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.ipd)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line-path" />
                  </>
                )}

                {/* Interactive Dots & Tooltip Overlays */}
                {patientTrend.days.map((d, i) => {
                  const regCoords = getCoordinates(patientTrend.registration[i], i);
                  const opdCoords = getCoordinates(patientTrend.opd[i], i);
                  const ipdCoords = getCoordinates(patientTrend.ipd[i], i);
                  return (
                    <g key={i}>
                      <rect
                        x={regCoords.x - 25}
                        y={padTop}
                        width={50}
                        height={plotHeight}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredTrendIndex(i)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                      />
                      {hoveredTrendIndex === i && (
                        <line x1={regCoords.x} y1={padTop} x2={regCoords.x} y2={lineChartHeight - padBottom} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
                      )}
                      {showReg && isMounted && (
                        <circle cx={regCoords.x} cy={regCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#2563eb" stroke="#fff" strokeWidth="2" className="chart-data-dot" />
                      )}
                      {showOPD && isMounted && (
                        <circle cx={opdCoords.x} cy={opdCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#8b5cf6" stroke="#fff" strokeWidth="2" className="chart-data-dot" />
                      )}
                      {showIPD && isMounted && (
                        <circle cx={ipdCoords.x} cy={ipdCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#10b981" stroke="#fff" strokeWidth="2" className="chart-data-dot" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {hoveredTrendIndex !== null && (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${padLeft + hoveredTrendIndex * (plotWidth / 6) + 18}px`,
                    top: "20px",
                    opacity: 1
                  }}
                >
                  <div className="tooltip-day">{patientTrend.days[hoveredTrendIndex]}</div>
                  {showReg && (
                    <div className="tooltip-row">
                      <span><span className="tooltip-dot" style={{ backgroundColor: "#2563eb" }} />Registrations:</span>
                      <span className="fw-bold">{patientTrend.registration[hoveredTrendIndex]}</span>
                    </div>
                  )}
                  {showOPD && (
                    <div className="tooltip-row">
                      <span><span className="tooltip-dot" style={{ backgroundColor: "#8b5cf6" }} />OPD Visits:</span>
                      <span className="fw-bold">{patientTrend.opd[hoveredTrendIndex]}</span>
                    </div>
                  )}
                  {showIPD && (
                    <div className="tooltip-row">
                      <span><span className="tooltip-dot" style={{ backgroundColor: "#10b981" }} />IPD Admissions:</span>
                      <span className="fw-bold">{patientTrend.ipd[hoveredTrendIndex]}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Bed Statistics (Donut) */}
        <div className="glass-card span-4">
          <div className="card-title-bar">
            <h5><i className="icofont-pie-chart text-primary" /> Overall Bed Statistics</h5>
          </div>
          <div className="card-body-content">
            <div className="donut-container">
              <div className="donut-svg-wrapper">
                <svg width="100%" height="100%" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="occupied-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="available-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="cleaning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="maintenance-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>

                  {/* Circle segments calculations based on r=60, circ=377 */}
                  {/* Occupied: 82% = 309.1 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="url(#occupied-grad)"
                    strokeWidth="10"
                    strokeDasharray="309.1 377"
                    strokeDashoffset="0"
                    transform="rotate(-90 80 80)"
                    className="chart-segment"
                  />
                  {/* Available: 14% = 52.8 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="url(#available-grad)"
                    strokeWidth="10"
                    strokeDasharray="52.8 377"
                    strokeDashoffset="-309.1"
                    transform="rotate(-90 80 80)"
                    className="chart-segment"
                  />
                  {/* Cleaning: 2% = 7.5 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="url(#cleaning-grad)"
                    strokeWidth="10"
                    strokeDasharray="7.5 377"
                    strokeDashoffset="-361.9"
                    transform="rotate(-90 80 80)"
                    className="chart-segment"
                  />
                  {/* Maintenance: 2% = 7.5 */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="url(#maintenance-grad)"
                    strokeWidth="10"
                    strokeDasharray="7.5 377"
                    strokeDashoffset="-369.4"
                    transform="rotate(-90 80 80)"
                    className="chart-segment"
                  />
                </svg>
                <div className="donut-center-text">
                  <div className="donut-center-number">{bedStats.total}</div>
                  <div className="donut-center-label">Beds</div>
                </div>
              </div>

              <div className="legend-list">
                <div className="legend-item">
                  <div className="legend-label-wrapper">
                    <span className="legend-color-dot" style={{ backgroundColor: "#2563eb" }} />
                    <span>Occupied</span>
                  </div>
                  <div className="legend-value-group">
                    <span>{bedStats.occupied.count}</span>
                    <span className="legend-percentage">({bedStats.occupied.percentage}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-label-wrapper">
                    <span className="legend-color-dot" style={{ backgroundColor: "#059669" }} />
                    <span>Available</span>
                  </div>
                  <div className="legend-value-group">
                    <span>{bedStats.available.count}</span>
                    <span className="legend-percentage">({bedStats.available.percentage}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-label-wrapper">
                    <span className="legend-color-dot" style={{ backgroundColor: "#d97706" }} />
                    <span>Cleaning</span>
                  </div>
                  <div className="legend-value-group">
                    <span>{bedStats.cleaning.count}</span>
                    <span className="legend-percentage">({bedStats.cleaning.percentage}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-label-wrapper">
                    <span className="legend-color-dot" style={{ backgroundColor: "#dc2626" }} />
                    <span>Maintenance</span>
                  </div>
                  <div className="legend-value-group">
                    <span>{bedStats.maintenance.count}</span>
                    <span className="legend-percentage">({bedStats.maintenance.percentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Rate (Gauge) */}
        <div className="glass-card span-4">
          <div className="card-title-bar">
            <h5><i className="icofont-speedometer text-success" /> Occupancy Rate</h5>
          </div>
          <div className="card-body-content d-flex justify-content-center align-items-center">
            <div className="gauge-container">
              <div className="gauge-svg-wrapper">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="35%" stopColor="#f97316" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Gauge Arc Background track */}
                  <path
                    d="M 30 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />

                  {/* Segments: Red Zone (0-25%), Orange (25-50%), Yellow (50-75%), Green (75-100%) */}
                  <path
                    d="M 30 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="url(#gauge-grad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />

                  {/* Needle - pivots around 100,100. Pointers point vertically up at 50% */}
                  {/* Rotation calculates: 82% translates to (82 - 50) * 1.8 = 57.6 degrees rotation */}
                  <g
                    className="gauge-needle"
                    style={{
                      transform: isMounted
                        ? `rotate(${((bedStats.occupied.count / bedStats.total) * 180) - 90}deg)`
                        : "rotate(-90deg)"
                    }}
                  >
                    <polygon points="97,100 103,100 100,38" fill="#1e293b" />
                    <circle cx="100" cy="100" r="7" fill="#1e293b" />
                    <circle cx="100" cy="100" r="3" fill="#ffffff" />
                  </g>
                </svg>
              </div>
              <div className="gauge-center-text">
                <div className="gauge-percentage">{bedStats.occupied.percentage}%</div>
                <div className="gauge-label">Occupancy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* IPD Ward Occupancy Percentage */}
        <div className="glass-card span-4">
          <div className="card-title-bar">
            <h5><i className="icofont-building text-info" /> Ward Occupancy</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {wardOccupancy.map((ward, idx) => {
                return (
                  <div className="vertical-bar-item" key={idx}>
                    <div className="vertical-bar-value">{ward.percentage}%</div>
                    <div className="vertical-bar-container" style={{ width: "24px" }}>
                      <div
                        className="vertical-bar-fill gradient-fill-blue"
                        style={{ height: isMounted ? `${ward.percentage}%` : "0%" }}
                        title={`${ward.name}: ${ward.percentage}%`}
                      />
                    </div>
                    <div className="vertical-bar-label" title={ward.name} style={{ fontSize: "0.7rem", maxWidth: "70px" }}>{ward.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ward Wise Bed Statistics (Grid of 8 wards) */}
        <div className="glass-card span-12">
          <div className="card-title-bar">
            <h5><i className="icofont-listing-number text-primary" /> Ward-Wise Bed Details (Occupied, Available, Cleaning, Maintenance)</h5>
          </div>
          <div className="card-body-content">
            <div className="ward-grid">
              {wardWiseBeds.map((ward, i) => {
                const occWidth = (ward.occupied / ward.total) * 100;
                const avWidth = (ward.available / ward.total) * 100;
                const clWidth = (ward.cleaning / ward.total) * 100;
                const mtWidth = (ward.maintenance / ward.total) * 100;

                return (
                  <div className="ward-bed-card" key={i}>
                    <div className="ward-card-header">
                      <span className="ward-name">{ward.name}</span>
                      <span className="ward-total">{ward.total} Beds</span>
                    </div>

                    <div className="stacked-bar">
                      <div className="bar-segment bg-primary" style={{ width: `${occWidth}%` }} title={`Occupied: ${ward.occupied}`} />
                      <div className="bar-segment bg-success" style={{ width: `${avWidth}%` }} title={`Available: ${ward.available}`} />
                      <div className="bar-segment bg-warning" style={{ width: `${clWidth}%` }} title={`Cleaning: ${ward.cleaning}`} />
                      <div className="bar-segment bg-danger" style={{ width: `${mtWidth}%` }} title={`Maintenance: ${ward.maintenance}`} />
                    </div>

                    <div className="ward-bed-legend">
                      <div className="ward-legend-label">
                        <span className="count text-primary">{ward.occupied}</span>
                        <span className="text-muted">Occ</span>
                      </div>
                      <div className="ward-legend-label">
                        <span className="count text-success">{ward.available}</span>
                        <span className="text-muted">Avail</span>
                      </div>
                      <div className="ward-legend-label">
                        <span className="count text-warning">{ward.cleaning}</span>
                        <span className="text-muted">Clean</span>
                      </div>
                      <div className="ward-legend-label">
                        <span className="count text-danger">{ward.maintenance}</span>
                        <span className="text-muted">Maint</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
