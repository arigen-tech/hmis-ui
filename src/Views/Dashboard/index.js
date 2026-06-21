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

  // IPD Ward Occupancy Percentages
  const wardOccupancy = [
    { name: "General Ward", percentage: 85 },
    { name: "Semi Private Ward", percentage: 78 },
    { name: "Private Ward", percentage: 65 },
    { name: "ICU", percentage: 92 }
  ];

  // OPD Specialty Wise
  const opdSpecialties = [
    { name: "General Medicine", count: 220 },
    { name: "Orthopedic", count: 180 },
    { name: "Pediatrics", count: 140 },
    { name: "Gynecology", count: 125 },
    { name: "ENT", count: 95 }
  ];

  // Top Investigations
  const topInvestigations = [
    { name: "CBC", count: 220 },
    { name: "Blood Sugar", count: 180 },
    { name: "LFT", count: 150 },
    { name: "KFT", count: 132 },
    { name: "Thyroid", count: 98 }
  ];

  // Top Diagnosis
  const topDiagnosis = [
    { name: "Hypertension", count: 165 },
    { name: "Diabetes", count: 142 },
    { name: "Fever", count: 125 },
    { name: "Viral Infection", count: 110 },
    { name: "Arthritis", count: 90 }
  ];

  // Patient Trend Data (7 Days)
  const patientTrend = {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    registration: [620, 680, 780, 820, 950, 1200, 580],
    opd: [680, 800, 850, 1050, 1100, 1250, 600],
    ipd: [100, 120, 150, 180, 220, 260, 80]
  };

  // SVG dimensions for Line Chart
  const lineChartWidth = 500;
  const lineChartHeight = 200;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
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
        {/* Total Beds */}
        <div className="glass-card card-occupied">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Total Bed Capacity</span>
              <span className="metric-value">{bedStats.total}</span>
              <span className="metric-meta text-muted">100% capacity</span>
            </div>
            <div className="metric-icon-box bg-occupied-light">
              <i className="icofont-patient-bed" />
            </div>
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="glass-card card-occupied">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Occupied Beds</span>
              <span className="metric-value">{bedStats.occupied.count}</span>
              <span className="metric-meta text-primary">82% occupancy rate</span>
            </div>
            <div className="metric-icon-box bg-occupied-light">
              <i className="icofont-user-suited" />
            </div>
          </div>
        </div>

        {/* Available Beds */}
        <div className="glass-card card-available">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Available Beds</span>
              <span className="metric-value">{bedStats.available.count}</span>
              <span className="metric-meta text-success">14% remaining capacity</span>
            </div>
            <div className="metric-icon-box bg-available-light">
              <i className="icofont-check-circled" />
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

      {/* Main Content Grid */}
      <div className="dashboard-layout-grid">
        
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
            <div className="progress-list">
              {wardOccupancy.map((ward, idx) => (
                <div className="progress-list-item" key={idx}>
                  <div className="item-meta-row">
                    <span className="item-name-bold">{ward.name}</span>
                    <span className="item-value-pill">{ward.percentage}%</span>
                  </div>
                  <div className="modern-progress-bar-bg">
                    <div
                      className="modern-progress-bar-fill gradient-fill-blue"
                      style={{ width: isMounted ? `${ward.percentage}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
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

        {/* Patient Trend (Line Chart Last 7 Days) */}
        <div className="glass-card span-8">
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
              <svg width="100%" height="100%" viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`}>
                <defs>
                  {/* Gradients for fills */}
                  <linearGradient id="reg-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="opd-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ipd-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Gridlines */}
                {[0, 200, 400, 600, 800, 1000, 1200, 1400].map((v, idx) => {
                  const y = lineChartHeight - padBottom - (v / maxVal) * plotHeight;
                  return (
                    <g key={idx}>
                      <line x1={padLeft} y1={y} x2={lineChartWidth - padRight} y2={y} className="grid-line" />
                      <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">{v}</text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {patientTrend.days.map((d, i) => {
                  const x = padLeft + i * (plotWidth / 6);
                  return (
                    <text key={i} x={x} y={lineChartHeight - 8} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">{d}</text>
                  );
                })}

                {/* Registration Area and Line */}
                {showReg && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.registration)} fill="url(#reg-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.registration)} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" className="chart-line-path" />
                  </>
                )}

                {/* OPD Visits Area and Line */}
                {showOPD && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.opd)} fill="url(#opd-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.opd)} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" className="chart-line-path" />
                  </>
                )}

                {/* IPD Admissions Area and Line */}
                {showIPD && isMounted && (
                  <>
                    <path d={generateAreaPath(patientTrend.ipd)} fill="url(#ipd-area)" className="chart-area-path" />
                    <path d={generatePath(patientTrend.ipd)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="chart-line-path" />
                  </>
                )}

                {/* Interactive Dots & Tooltip Overlays */}
                {patientTrend.days.map((d, i) => {
                  const regCoords = getCoordinates(patientTrend.registration[i], i);
                  const opdCoords = getCoordinates(patientTrend.opd[i], i);
                  const ipdCoords = getCoordinates(patientTrend.ipd[i], i);

                  return (
                    <g key={i}>
                      {/* Interaction bounds rect */}
                      <rect
                        x={regCoords.x - 20}
                        y={padTop}
                        width={40}
                        height={plotHeight}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredTrendIndex(i)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                      />

                      {/* Vertically hovering tracker line */}
                      {hoveredTrendIndex === i && (
                        <line x1={regCoords.x} y1={padTop} x2={regCoords.x} y2={lineChartHeight - padBottom} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                      )}

                      {/* Line points indicators */}
                      {showReg && isMounted && (
                        <circle cx={regCoords.x} cy={regCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="chart-data-dot" />
                      )}
                      {showOPD && isMounted && (
                        <circle cx={opdCoords.x} cy={opdCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" className="chart-data-dot" />
                      )}
                      {showIPD && isMounted && (
                        <circle cx={ipdCoords.x} cy={ipdCoords.y} r={hoveredTrendIndex === i ? 6 : 4} fill="#10b981" stroke="#ffffff" strokeWidth="2" className="chart-data-dot" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Box overlay */}
              {hoveredTrendIndex !== null && (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${padLeft + hoveredTrendIndex * (plotWidth / 6) + 15}px`,
                    top: "30px",
                    opacity: 1
                  }}
                >
                  <div className="tooltip-day">{patientTrend.days[hoveredTrendIndex]} Statistics</div>
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

        {/* OPD Specialty & Gender Distribution */}
        <div className="glass-card span-4">
          <div className="card-title-bar">
            <h5><i className="icofont-doctor-alt text-info" /> OPD Statistics</h5>
          </div>
          <div className="card-body-content">
            {/* Specialty List */}
            <div className="progress-list">
              {opdSpecialties.map((spec, idx) => (
                <div className="progress-list-item" key={idx}>
                  <div className="item-meta-row">
                    <span className="item-name-bold">{spec.name}</span>
                    <span className="item-value-pill">{spec.count}</span>
                  </div>
                  <div className="modern-progress-bar-bg">
                    <div
                      className="modern-progress-bar-fill gradient-fill-teal"
                      style={{ width: isMounted ? `${(spec.count / 220) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Gender Distribution Segment under Specialty */}
            <div className="gender-split-box flex-column align-items-stretch">
              <div className="d-flex justify-content-between font-weight-bold text-muted small mb-2">
                <span>OPD GENDER DISTRIBUTION</span>
                <span className="text-dark fw-bold">Male 52% • Female 41% • Child 7%</span>
              </div>
              <div className="gender-progress">
                <div className="gender-segment bg-male" style={{ width: "52%" }} title="Male: 52%" />
                <div className="gender-segment bg-female" style={{ width: "41%" }} title="Female: 41%" />
                <div className="gender-segment bg-child" style={{ width: "7%" }} title="Child: 7%" />
              </div>
              <div className="gender-labels-row mt-2">
                <span className="gender-label-item male"><span className="legend-color-dot bg-male d-inline-block" style={{ width: 8, height: 8 }} /> Male (52%)</span>
                <span className="gender-label-item female"><span className="legend-color-dot bg-female d-inline-block" style={{ width: 8, height: 8 }} /> Female (41%)</span>
                <span className="gender-label-item child"><span className="legend-color-dot bg-child d-inline-block" style={{ width: 8, height: 8 }} /> Child (7%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Investigations */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-laboratory text-primary" /> Top Investigations</h5>
          </div>
          <div className="card-body-content">
            <div className="progress-list">
              {topInvestigations.map((inv, idx) => (
                <div className="progress-list-item" key={idx}>
                  <div className="item-meta-row">
                    <span className="item-name-bold">{inv.name}</span>
                    <span className="item-value-pill">{inv.count} Cases</span>
                  </div>
                  <div className="modern-progress-bar-bg">
                    <div
                      className="modern-progress-bar-fill gradient-fill-blue"
                      style={{ width: isMounted ? `${(inv.count / 220) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Diagnosis */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-stethoscope text-accent" /> Top Diagnosis</h5>
          </div>
          <div className="card-body-content">
            <div className="progress-list">
              {topDiagnosis.map((diag, idx) => (
                <div className="progress-list-item" key={idx}>
                  <div className="item-meta-row">
                    <span className="item-name-bold">{diag.name}</span>
                    <span className="item-value-pill">{diag.count} cases</span>
                  </div>
                  <div className="modern-progress-bar-bg">
                    <div
                      className="modern-progress-bar-fill gradient-fill-coral"
                      style={{ width: isMounted ? `${(diag.count / 165) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
