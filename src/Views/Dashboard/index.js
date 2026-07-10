import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { getRequest } from "../../service/apiService";
import { DASHBOARD_STATS_API, DASHBOARD_BILLING_FINANCE_API } from "../../config/apiConfig";

const Dashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("Last 7 Days");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Toggle states for patient trend chart lines
  const [showReg, setShowReg] = useState(true);
  const [showOPD, setShowOPD] = useState(true);
  const [showIPD, setShowIPD] = useState(true);

  const [opdSummary, setOpdSummary] = useState({ todayOPD: 0, newReg: 0, revisits: 0 });
  const [labSummary, setLabSummary] = useState({ todayTests: 0, totalVisits: 0 });
  const [radiologySummary, setRadiologySummary] = useState({ totalTests: 0, totalVisits: 0 });

  const [genderDistribution, setGenderDistribution] = useState([]);
  const [opdSpecialties, setOpdSpecialties] = useState([]);
  const [topInvestigations, setTopInvestigations] = useState([]);
  const [topRadioInvestigations, setTopRadioInvestigations] = useState([]);
  const [topDiagnosis, setTopDiagnosis] = useState([]);
  const [topOpdDoctors, setTopOpdDoctors] = useState([]);

  const [billingSummary, setBillingSummary] = useState({ todayBilling: "₹0", collectedAmount: "₹0", pendingBilling: "₹0" });
  const [billingStats, setBillingStats] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDates = (tab) => {
    const today = new Date();
    const to = getFormattedDate(today);
    let from = to;

    if (tab === "Today") {
      from = to;
    } else if (tab === "Last 7 Days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      from = getFormattedDate(d);
    } else if (tab === "Last Month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      from = getFormattedDate(d);
    }
    return { from, to };
  };

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsMounted(true), 100);

    if (activeTab !== "Other") {
      const { from, to } = calculateDates(activeTab);
      fetchDashboardStats(from, to);
    }

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleCustomDateFetch = () => {
    if (customFromDate && customToDate) {
      fetchDashboardStats(customFromDate, customToDate);
    } else {
      alert("Please select both From and To dates.");
    }
  };

  const fetchDashboardStats = async (fDate, tDate) => {
    try {
      const res = await getRequest(`${DASHBOARD_STATS_API}?fromDate=${fDate}&toDate=${tDate}`);
      if (res?.response) {
        const stats = res.response;

        const newOpdVisits = stats.TotOPDVisit?.find(v => v.visit_type === "N")?.total_opd_visit || 0;
        const followUpOpdVisits = stats.TotOPDVisit?.find(v => v.visit_type === "F")?.total_opd_visit || 0;
        const totalOpdVisits = stats.TotOPDVisit?.reduce((sum, item) => sum + (item.total_opd_visit || 0), 0) || 0;
        setOpdSummary({ todayOPD: totalOpdVisits, newReg: newOpdVisits, revisits: followUpOpdVisits });
        
        const newLabVisits = stats.TotLabVisit?.find(v => v.visit_type === "N")?.total_lab_visit || 0;
        const followUpLabVisits = stats.TotLabVisit?.find(v => v.visit_type === "F")?.total_lab_visit || 0;
        const totalLabVisits = stats.TotLabVisit?.reduce((sum, item) => sum + (item.total_lab_visit || 0), 0) || 0;
        setLabSummary({
          todayTests: stats.TotLabTest?.[0]?.total_lab_test || 0,
          totalVisits: totalLabVisits,
          newReg: newLabVisits,
          revisits: followUpLabVisits
        });

        const newRadioVisits = stats.TotRadioVisit?.find(v => v.visit_type === "N")?.total_radio_visit || 0;
        const followUpRadioVisits = stats.TotRadioVisit?.find(v => v.visit_type === "F")?.total_radio_visit || 0;
        const totalRadioVisits = stats.TotRadioVisit?.reduce((sum, item) => sum + (item.total_radio_visit || 0), 0) || 0;
        setRadiologySummary({
          totalTests: stats.TotRadTest?.[0]?.total_rad_test || 0,
          totalVisits: totalRadioVisits,
          newReg: newRadioVisits,
          revisits: followUpRadioVisits
        });

        setGenderDistribution(stats.GenderWiseVisit || []);

        setOpdSpecialties((stats.opdDepartmentWiseVisits || []).map(d => ({
          name: d.department_name,
          count: d.total_visits
        })));

        // Top 10 Lab Investigations
        setTopInvestigations((stats.TopLabInvestigation || []).slice(0, 10).map(i => ({
          name: i.investigation_name,
          count: i.investigation_count
        })));

        // Top 10 Radiology Investigations
        const radioApiData = stats.TopRadioInvestigation || [];
        // Fallback dummy data if API returns empty array for now
        const dummyRadioData = [
          // { investigation_name: "Chest X-Ray", total_count: 45 },
          // { investigation_name: "MRI Brain", total_count: 32 },
          // { investigation_name: "CT Scan Abdomen", total_count: 28 },
          // { investigation_name: "USG Pelvis", total_count: 15 },
          // { investigation_name: "X-Ray Knee", total_count: 10 }
        ];
        const radioDataToUse = radioApiData.length > 0 ? radioApiData : dummyRadioData;

        setTopRadioInvestigations(radioDataToUse.slice(0, 10).map(i => ({
          name: i.investigation_name,
          count: i.total_count
        })));

        setTopDiagnosis((stats.TopICDDiagnosis || []).map(d => ({
          name: d.icd_name,
          count: d.diagnosis_count
        })));

        setTopOpdDoctors((stats.opdDoctorWiseStats || []).map(d => ({
          name: d.doctor_name,
          count: d.total_visits
        })));
      }

      const financeRes = await getRequest(`${DASHBOARD_BILLING_FINANCE_API}?fromDate=${fDate}&toDate=${tDate}`);
      if (financeRes?.response) {
        const billByCat = financeRes.response.BillbyServiceCat || [];
        const paymentModesRes = financeRes.response.PaymentModeWisePercentage || [];

        const totalBillingNum = billByCat.reduce((sum, item) => sum + item.total_billing, 0);
        const collectedNum = paymentModesRes.reduce((sum, item) => sum + item.total_amount, 0);
        const pendingNum = totalBillingNum - collectedNum;

        setBillingSummary({
          todayBilling: `₹${totalBillingNum.toLocaleString('en-IN')}`,
          collectedAmount: `₹${collectedNum.toLocaleString('en-IN')}`,
          pendingBilling: `₹${pendingNum.toLocaleString('en-IN')}`
        });

        setBillingStats(billByCat.map(item => ({
          name: item.service_cat_name,
          amount: `₹${item.total_billing.toLocaleString('en-IN')}`,
          rawAmount: item.total_billing,
        })));

        setPaymentModes(paymentModesRes.map(item => ({
          name: item.payment_mode,
          percentage: item.percentage,
          total_amount: item.total_amount
        })));
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

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

  // Billing data is now dynamic using states

  // IPD Ward Occupancy Percentages
  const wardOccupancy = [
    { name: "General Ward", percentage: 85 },
    { name: "Semi Private Ward", percentage: 78 },
    { name: "Private Ward", percentage: 65 },
    { name: "ICU", percentage: 92 }
  ];

  // OPD Specialty Wise
  // State variables for these are now used.


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
        <div className="dashboard-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {["Today", "Last 7 Days", "Last Month", "Other"].map((tab) => (
              <button
                key={tab}
                className={`filter-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Other" && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-dark)' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-dark)' }}
              />
              <button
                className="filter-btn active"
                onClick={handleCustomDateFetch}
                style={{ padding: '0.4rem 1rem' }}
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 1: KPI Statistics Overview */}
      <div className="metric-row">
        {/* OPD Visits */}
        <div className="glass-card card-info">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">OPD Visits</span>
              <span className="metric-value">{opdSummary.todayOPD}</span>
              <span className="metric-meta text-primary">New: {opdSummary.newReg} • Follow-up: {opdSummary.revisits}</span>
            </div>
            <div className="metric-icon-box bg-info-light">
              <i className="icofont-doctor-alt" />
            </div>
          </div>
        </div>

        {/* LAB Visits */}
        <div className="glass-card card-available">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">LAB Visits</span>
              <span className="metric-value">{labSummary.totalVisits || 0}</span>
              <span className="metric-meta text-success">New: {labSummary.newReg || 0} • Follow-up: {labSummary.revisits || 0}</span>
            </div>
            <div className="metric-icon-box bg-available-light">
              <i className="icofont-laboratory" />
            </div>
          </div>
        </div>

        {/* Radiology Visits */}
        <div className="glass-card card-accent">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Radiology Visits</span>
              <span className="metric-value">{radiologySummary.totalVisits || 0}</span>
              <span className="metric-meta text-muted">New: {radiologySummary.newReg || 0} • Follow-up: {radiologySummary.revisits || 0}</span>
            </div>
            <div className="metric-icon-box bg-accent-light">
              <i className="icofont-xray" />
            </div>
          </div>
        </div>

        {/* Investigation Statistics */}
        <div className="glass-card card-available">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Investigation Statistics</span>
              <span className="metric-value">
                {(Number(labSummary.todayTests) || 0) + (Number(radiologySummary.totalTests) || 0)}
              </span>
              <span className="metric-meta text-success">
                LAB- {labSummary.todayTests || 0}, Radio- {radiologySummary.totalTests || 0}
              </span>
            </div>
            <div className="metric-icon-box bg-available-light">
              <i className="icofont-laboratory" />
            </div>
          </div>
        </div>

        {/* Total Billing/Revenue */}
        <div className="glass-card card-billing">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Total Revenue</span>
              <span className="metric-value">{billingSummary.todayBilling}</span>
              <span className="metric-meta text-warning">Pending: {billingSummary.pendingBilling}</span>
            </div>
            <div className="metric-icon-box bg-billing-light">
              <i className="icofont-coins" />
            </div>
          </div>
        </div>

        {/* Total Admission */}
        <div className="glass-card card-info">
          <div className="card-content-wrapper">
            <div className="metric-details">
              <span className="metric-label">Total Admission</span>
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
                  const maxSpec = opdSpecialties.reduce((max, s) => Math.max(max, s.count), 1);
                  const heightPercent = maxSpec > 0 ? (spec.count / maxSpec) * 100 : 0;
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
                      <div className="vertical-bar-label" title={spec.name} style={{ fontSize: "0.6rem" }}>{spec.name.substring(0, 10)}</div>
                    </div>
                  );
                })}
                {opdSpecialties.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
              </div>
            </div>

            {/* Gender Donut */}
            <div className="opd-gender-col">
              <h6>Gender Distribution</h6>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div className="donut-svg-wrapper" style={{ width: "130px", height: "130px" }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    {(() => {
                      let currentOffset = 0;
                      const c = 251.3;
                      const totalG = genderDistribution.reduce((sum, g) => sum + g.total, 0) || 1;
                      const gData = [
                        { label: "Male", count: genderDistribution.find(g => g.category === "Male")?.total || 0, color: "#3b82f6" },
                        { label: "Female", count: genderDistribution.find(g => g.category === "Female")?.total || 0, color: "#ec4899" },
                        { label: "Child", count: genderDistribution.find(g => g.category === "Child")?.total || 0, color: "#10b981" }
                      ];
                      return gData.map(g => {
                        const pct = (g.count / totalG) * 100;
                        const dash = (pct / 100) * c;
                        const offset = currentOffset;
                        currentOffset -= dash;
                        return (
                          <circle
                            key={g.label}
                            cx="50" cy="50" r="40" fill="none"
                            stroke={g.color} strokeWidth="10"
                            strokeDasharray={`${dash} ${c}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 50 50)"
                            className="chart-segment"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="donut-center-text">
                    <div className="donut-center-number" style={{ fontSize: "1.3rem" }}>{genderDistribution.reduce((sum, g) => sum + g.total, 0)}</div>
                    <div className="donut-center-label">Total</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", fontSize: "0.8rem" }}>
                  {[
                    { label: "Male", count: genderDistribution.find(g => g.category === "Male")?.total || 0, color: "#3b82f6" },
                    { label: "Female", count: genderDistribution.find(g => g.category === "Female")?.total || 0, color: "#ec4899" },
                    { label: "Child", count: genderDistribution.find(g => g.category === "Child")?.total || 0, color: "#10b981" }
                  ].map((g) => {
                    const totalG = genderDistribution.reduce((sum, g) => sum + g.total, 0) || 1;
                    return (
                      <div key={g.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: g.color, display: "inline-block" }} />
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{g.label}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                          {((g.count / totalG) * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Top Investigations | Top Diagnosis | Billing & Financials ── */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-laboratory text-primary" /> Top Lab Investigations</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {topInvestigations.map((inv, idx) => {
                const maxInv = topInvestigations.reduce((max, i) => Math.max(max, i.count), 1);
                const heightPercent = maxInv > 0 ? (inv.count / maxInv) * 100 : 0;
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
                    <div className="vertical-bar-label" title={inv.name}>{inv.name.substring(0, 10)}</div>
                  </div>
                );
              })}
              {topInvestigations.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
            </div>
          </div>
        </div>

        {/* Top Radiology Investigations */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-xray text-accent" /> Top Radiology Investigations</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {topRadioInvestigations.map((inv, idx) => {
                const maxInv = topRadioInvestigations.reduce((max, i) => Math.max(max, i.count), 1);
                const heightPercent = maxInv > 0 ? (inv.count / maxInv) * 100 : 0;
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
                    <div className="vertical-bar-label" title={inv.name}>{inv.name.substring(0, 10)}</div>
                  </div>
                );
              })}
              {topRadioInvestigations.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
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
                const maxDiag = topDiagnosis.reduce((max, d) => Math.max(max, d.count), 1);
                const heightPercent = maxDiag > 0 ? (diag.count / maxDiag) * 100 : 0;
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
                    <div className="vertical-bar-label" title={diag.name}>{diag.name.substring(0, 10)}</div>
                  </div>
                );
              })}
              {topDiagnosis.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
            </div>
          </div>
        </div>

        {/* Top 10 OPD Doctors */}
        <div className="glass-card span-6">
          <div className="card-title-bar">
            <h5><i className="icofont-doctor text-accent" /> Top OPD Doctors</h5>
          </div>
          <div className="card-body-content">
            <div className="vertical-bar-chart">
              {topOpdDoctors.map((doc, idx) => {
                const maxDoc = topOpdDoctors.reduce((max, d) => Math.max(max, d.count), 1);
                const heightPercent = maxDoc > 0 ? (doc.count / maxDoc) * 100 : 0;
                return (
                  <div className="vertical-bar-item" key={idx}>
                    <div className="vertical-bar-value">{doc.count}</div>
                    <div className="vertical-bar-container">
                      <div
                        className="vertical-bar-fill gradient-fill-teal"
                        style={{ height: isMounted ? `${heightPercent}%` : "0%" }}
                        title={`${doc.name}: ${doc.count}`}
                      />
                    </div>
                    <div className="vertical-bar-label" title={doc.name}>{doc.name.substring(0, 10)}</div>
                  </div>
                );
              })}
              {topOpdDoctors.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
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
                  const maxBill = billingStats.reduce((max, b) => Math.max(max, b.rawAmount || 0), 1);
                  const heightPercent = maxBill > 0 ? ((bill.rawAmount || 0) / maxBill) * 100 : 0;
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
                {billingStats.length === 0 && <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No data</div>}
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
                    {(() => {
                      let currentOffset = 0;
                      const c = 238.8;
                      const colors = ["#3b82f6", "#10b981", "#ec4899", "#f59e0b", "#6366f1"];
                      return paymentModes.map((m, i) => {
                        const dash = (m.percentage / 100) * c;
                        const offset = currentOffset;
                        currentOffset -= dash;
                        return (
                          <circle
                            key={m.name}
                            cx="50" cy="50" r="38" fill="none"
                            stroke={colors[i % colors.length]} strokeWidth="12"
                            strokeDasharray={`${dash} ${c}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 50 50)"
                            className="chart-segment"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="donut-center-text">
                    <div className="donut-center-number" style={{ fontSize: "0.8rem", fontWeight: 800 }}>
                      {billingSummary.collectedAmount}
                    </div>
                    <div className="donut-center-label" style={{ fontSize: "0.5rem" }}>Revenue</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, fontSize: "0.75rem" }}>
                  {paymentModes.map((m, i) => {
                    const colors = ["#3b82f6", "#10b981", "#ec4899", "#f59e0b", "#6366f1"];
                    return (
                      <div key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[i % colors.length], display: "inline-block", flexShrink: 0 }} />
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{m.name}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>{m.percentage}%</span>
                      </div>
                    );
                  })}
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
