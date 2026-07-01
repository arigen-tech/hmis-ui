import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { integrationService } from "../../../service/integrationService";
import { postRequest } from "../../../service/apiService";
import { FOLLOWUP_PATIENTS_LIST } from "../../../config/apiConfig";
import "./abdmMilestone2.css";

const AbdmMilestone2 = () => {
  // Global States
  const [activeTab, setActiveTab] = useState("linking");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Search & Patient States
  const [searchQuery, setSearchQuery] = useState("");
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [abhaAddressInput, setAbhaAddressInput] = useState("");

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [linkingTransactionId, setLinkingTransactionId] = useState("");

  // Consent Management States
  const [consentsList, setConsentsList] = useState([]);
  const [consentForm, setConsentForm] = useState({
    abhaAddress: "",
    purpose: "REFERRAL",
    hiTypes: ["OPD_PRESCRIPTION", "DIAGNOSTIC_REPORT"],
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    accessMode: "VIEW"
  });

  // Decrypted Clinical Data Viewer States
  const [showClinicalViewer, setShowClinicalViewer] = useState(false);
  const [activeClinicalRecord, setActiveClinicalRecord] = useState(null);

  // Mock Data Sets for Demo Mode
  const mockPatients = [
    {
      patientId: "P-1092",
      uhidNo: "UHID-2026-0092",
      patientName: "Aarav Sharma",
      gender: "Male",
      age: 34,
      mobileNo: "9876543210",
      abhaNumber: "91-2304-9843-1209",
      abhaAddress: "aaravsharma@abdm",
      isLinked: true
    },
    {
      patientId: "P-1093",
      uhidNo: "UHID-2026-0093",
      patientName: "Priya Patel",
      gender: "Female",
      age: 29,
      mobileNo: "8765432109",
      abhaNumber: "",
      abhaAddress: "",
      isLinked: false
    },
    {
      patientId: "P-1094",
      uhidNo: "UHID-2026-0094",
      patientName: "Amit Verma",
      gender: "Male",
      age: 45,
      mobileNo: "7654321098",
      abhaNumber: "",
      abhaAddress: "",
      isLinked: false
    }
  ];

  const mockCareContexts = {
    "P-1092": [
      { id: "CC-101", referenceNumber: "OPD-2201", display: "OPD Consultation - General Medicine", type: "OPD", date: "2026-06-20", linked: true },
      { id: "CC-102", referenceNumber: "LAB-4050", display: "Complete Blood Count (CBC) Report", type: "LAB", date: "2026-06-21", linked: true }
    ],
    "P-1093": [
      { id: "CC-201", referenceNumber: "OPD-2202", display: "OPD Consultation - Gynecology", type: "OPD", date: "2026-06-22", linked: false },
      { id: "CC-202", referenceNumber: "LAB-4051", display: "Thyroid Profile Panel", type: "LAB", date: "2026-06-23", linked: false },
      { id: "CC-203", referenceNumber: "RAD-1102", display: "USG Pelvis Ultrasound", type: "RAD", date: "2026-06-24", linked: false }
    ],
    "P-1094": [
      { id: "CC-301", referenceNumber: "OPD-2203", display: "OPD Preconsultation - Cardiology", type: "OPD", date: "2026-06-25", linked: false }
    ]
  };

  const mockConsentRequests = [
    {
      consentRequestId: "CR-8802",
      abhaAddress: "aaravsharma@abdm",
      purpose: "REFERRAL",
      hiTypes: ["OPD_PRESCRIPTION", "DIAGNOSTIC_REPORT"],
      status: "GRANTED",
      expiry: "2026-07-15T18:30",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30"
    },
    {
      consentRequestId: "CR-8803",
      abhaAddress: "priyapatel@abdm",
      purpose: "CARE_MANAGEMENT",
      hiTypes: ["DISCHARGE_SUMMARY"],
      status: "PENDING",
      expiry: "2026-07-20T12:00",
      dateFrom: "2026-05-01",
      dateTo: "2026-06-25"
    },
    {
      consentRequestId: "CR-8804",
      abhaAddress: "amitverma@abdm",
      purpose: "SELF_REQUEST",
      hiTypes: ["OPD_PRESCRIPTION"],
      status: "DENIED",
      expiry: "2026-07-05T09:00",
      dateFrom: "2026-06-15",
      dateTo: "2026-06-28"
    }
  ];

  const mockDecryptedRecords = {
    "CR-8802": {
      patient: { name: "Aarav Sharma", age: 34, gender: "Male" },
      provider: { hospital: "City General Hospital", doctor: "Dr. Rajesh Gupta (MD)" },
      diagnosis: "Acute Brachial Plexus Neuritis / Viral Fever",
      prescriptions: [
        { drug: "Paracetamol 650mg", dosage: "1-0-1 (After Food)", duration: "5 Days" },
        { drug: "Amoxicillin 500mg", dosage: "1-1-1 (Antibiotic)", duration: "5 Days" },
        { drug: "Vitamin C 500mg", dosage: "0-1-0", duration: "10 Days" }
      ],
      investigations: [
        { test: "Complete Blood Count (CBC)", value: "Hb: 14.2 g/dL (Normal: 13.0 - 17.0)", status: "Completed" },
        { test: "WBC Count", value: "6,800 /cumm (Normal: 4000 - 11000)", status: "Completed" },
        { test: "Platelet Count", value: "2.1 Lakhs/cumm (Normal: 1.5 - 4.5 Lakhs)", status: "Completed" }
      ]
    }
  };

  // Initialize Lists on Mount/Mode Switch
  useEffect(() => {
    if (isDemoMode) {
      setPatientsList(mockPatients);
      setConsentsList(mockConsentRequests);
    } else {
      setPatientsList([]);
      setSelectedPatient(null);
      setPatientRecords([]);
      setSelectedRecords([]);
      fetchRealConsents();
    }
  }, [isDemoMode]);

  // Fetch real consent requests from server
  const fetchRealConsents = async () => {
    setLoading(true);
    try {
      const response = await integrationService.fetchConsentRequests();
      if (response && response.response) {
        setConsentsList(response.response.content || response.response || []);
      }
    } catch (error) {
      console.error("Error fetching real consents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Patient Search Action
  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      Swal.fire("Warning", "Please enter a name or mobile number to search.", "warning");
      return;
    }

    setLoading(true);
    if (isDemoMode) {
      // Demo Mode search filter
      const query = searchQuery.toLowerCase();
      const filtered = mockPatients.filter(
        (p) =>
          p.patientName.toLowerCase().includes(query) ||
          p.mobileNo.includes(query) ||
          p.patientId.toLowerCase().includes(query)
      );
      setPatientsList(filtered);
      setLoading(false);
      if (filtered.length === 0) {
        Swal.fire("No Results", "No demo patients found matching your search.", "info");
      }
    } else {
      // Live Mode search calling hospital HMIS search API
      try {
        const payload = {
          patientName: searchQuery,
          mobileNo: null
        };
        const response = await postRequest(`${FOLLOWUP_PATIENTS_LIST}?page=0&size=20`, payload);
        if (response && response.response) {
          const list = response.response.content || response.response || [];
          setPatientsList(list);
          if (list.length === 0) {
            Swal.fire("No Results", "No patient records found in HMIS.", "info");
          }
        } else {
          setPatientsList([]);
          Swal.fire("Info", "No patients found.", "info");
        }
      } catch (error) {
        console.error("HMIS search failed:", error);
        Swal.fire("Error", "Failed to search patient in hospital records.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Patient Selection Action
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSelectedRecords([]);
    setAbhaAddressInput(patient.abhaAddress || "");

    // Load patient's clinical care contexts
    setLoading(true);
    if (isDemoMode) {
      const contexts = mockCareContexts[patient.patientId] || [];
      setPatientRecords(contexts);
      // Auto-select unlinked records
      setSelectedRecords(contexts.filter(c => !c.linked).map(c => c.id));
      setLoading(false);
    } else {
      try {
        const patientUhid = patient.uhidNo || patient.patientId;
        const response = await integrationService.discoverPatientRecords(patientUhid);
        if (response && response.response) {
          const recordsList = response.response.careContexts || response.response || [];
          setPatientRecords(recordsList);
          setSelectedRecords(recordsList.filter(c => !c.linked).map(c => c.id || c.referenceNumber));
        } else {
          setPatientRecords([]);
        }
      } catch (error) {
        console.error("Record discovery failed:", error);
        setPatientRecords([]);
        Swal.fire("Record Discovery", "Failed to load patient's care contexts from local database.", "info");
      } finally {
        setLoading(false);
      }
    }
  };

  // Record Checkbox Selection Toggle
  const handleToggleRecord = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Link Care Contexts Request (HIP flow)
  const handleInitiateLinking = async () => {
    const abhaAddressToLink = abhaAddressInput.trim();
    if (!abhaAddressToLink) {
      Swal.fire("Input Required", "Please enter the patient's ABHA address (e.g. username@abdm).", "warning");
      return;
    }
    if (selectedRecords.length === 0) {
      Swal.fire("Selection Required", "Please select at least one care context (health record) to link.", "warning");
      return;
    }

    setLoading(true);
    const selectedContextObjects = patientRecords.filter(r => selectedRecords.includes(r.id || r.referenceNumber));

    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        setLinkingTransactionId("TXN-" + Math.floor(Math.random() * 90000 + 10000));
        setOtpValue("");
        setShowOtpModal(true);
        Swal.fire("OTP Sent", "A secure ABDM linking verification OTP has been sent to the patient's registered mobile number.", "success");
      }, 1000);
    } else {
      try {
        const payload = {
          abhaAddress: abhaAddressToLink,
          patientId: selectedPatient.uhidNo || selectedPatient.patientId,
          careContexts: selectedContextObjects.map(c => ({
            referenceNumber: c.referenceNumber,
            display: c.display
          }))
        };
        const response = await integrationService.initiateCareContextLink(payload);
        if (response && response.response) {
          setLinkingTransactionId(response.response.transactionId);
          setOtpValue("");
          setShowOtpModal(true);
          Swal.fire("OTP Sent", "ABHA linking request initiated. Please verify with patient OTP.", "success");
        }
      } catch (error) {
        Swal.fire("Linking Error", error.message || "Failed to initiate care context linking.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Verify Linking OTP (HIP OTP verification)
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      Swal.fire("Invalid OTP", "Please enter a valid 6-digit OTP.", "warning");
      return;
    }

    setLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        setShowOtpModal(false);

        // Update local patient states to linked
        const updatedPatient = {
          ...selectedPatient,
          isLinked: true,
          abhaAddress: abhaAddressInput,
          abhaNumber: selectedPatient.abhaNumber || "91-8843-0924-1188"
        };
        setSelectedPatient(updatedPatient);

        // Update list of patients
        setPatientsList(prev => prev.map(p => p.patientId === updatedPatient.patientId ? updatedPatient : p));

        // Mark local records as linked
        setPatientRecords(prev =>
          prev.map(r => selectedRecords.includes(r.id) ? { ...r, linked: true } : r)
        );
        setSelectedRecords([]);

        Swal.fire({
          icon: "success",
          title: "Care Contexts Linked!",
          text: "Selected medical records have been successfully mapped and linked to the patient's ABHA ID.",
          timer: 3000
        });
      }, 1200);
    } else {
      try {
        const payload = {
          transactionId: linkingTransactionId,
          otp: otpValue
        };
        const response = await integrationService.verifyCareContextLink(payload);
        if (response && response.status === "SUCCESS") {
          setShowOtpModal(false);
          // Reload patient to refresh status
          handleSelectPatient(selectedPatient);
          Swal.fire("Linked Successfully", "Patient records linked to ABHA profile on the national gateway.", "success");
        }
      } catch (error) {
        Swal.fire("Verification Failed", error.message || "Invalid OTP or verification expired.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Raise new Consent Request (HIU flow)
  const handleRaiseConsent = async (e) => {
    e.preventDefault();
    const abhaAddress = consentForm.abhaAddress.trim();
    if (!abhaAddress) {
      Swal.fire("Warning", "Please provide a valid Patient ABHA ID.", "warning");
      return;
    }
    if (consentForm.hiTypes.length === 0) {
      Swal.fire("Warning", "Please select at least one Health Information Type.", "warning");
      return;
    }

    setLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        const newRequest = {
          consentRequestId: "CR-" + Math.floor(Math.random() * 9000 + 1000),
          abhaAddress: abhaAddress,
          purpose: consentForm.purpose,
          hiTypes: consentForm.hiTypes,
          status: "PENDING",
          expiry: consentForm.expiry,
          dateFrom: consentForm.dateFrom,
          dateTo: consentForm.dateTo
        };
        setConsentsList(prev => [newRequest, ...prev]);
        setConsentForm(prev => ({ ...prev, abhaAddress: "" }));
        Swal.fire("Consent Requested", "Consent request successfully sent to the patient's PHR application. Status is set to PENDING.", "success");
      }, 1000);
    } else {
      try {
        const response = await integrationService.createConsentRequest(consentForm);
        if (response) {
          Swal.fire("Consent Requested", "Consent request raised on ABDM gateway.", "success");
          setConsentForm(prev => ({ ...prev, abhaAddress: "" }));
          fetchRealConsents();
        }
      } catch (error) {
        Swal.fire("Consent Request Error", error.message || "Failed to submit consent request.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Check/Refresh Consent status (HIU status check)
  const handleCheckConsentStatus = async (consentId) => {
    setLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        // Simulate consent granting
        setConsentsList(prev =>
          prev.map(c => {
            if (c.consentRequestId === consentId && c.status === "PENDING") {
              return { ...c, status: "GRANTED" };
            }
            return c;
          })
        );
        Swal.fire("Consent Granted", "Patient has approved the consent request in their ABHA app.", "success");
      }, 1000);
    } else {
      try {
        const response = await integrationService.refreshConsentStatus(consentId);
        if (response && response.response) {
          const updatedStatus = response.response.status;
          setConsentsList(prev =>
            prev.map(c => c.consentRequestId === consentId ? { ...c, status: updatedStatus } : c)
          );
          Swal.fire("Status Refreshed", `Consent status is: ${updatedStatus}`, "info");
        }
      } catch (error) {
        Swal.fire("Error", "Could not check consent status from Gateway.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch and display clinical records (HIU data sharing)
  const handleFetchRecords = async (consent) => {
    setLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        const record = mockDecryptedRecords[consent.consentRequestId] || {
          patient: { name: "Patient Record", age: 30, gender: "Other" },
          provider: { hospital: "General Clinic", doctor: "Dr. Unknown" },
          diagnosis: "Prescription Data Not Mocked For This Consent Request ID",
          prescriptions: [],
          investigations: []
        };
        setActiveClinicalRecord(record);
        setShowClinicalViewer(true);
      }, 1200);
    } else {
      try {
        const response = await integrationService.fetchSharedClinicalRecords(consent.consentRequestId);
        if (response && response.response) {
          setActiveClinicalRecord(response.response);
          setShowClinicalViewer(true);
        } else {
          Swal.fire("No Clinical Data", "No medical records were returned by the provider.", "info");
        }
      } catch (error) {
        Swal.fire("Data Retrieval Failed", error.message || "Failed to fetch and decrypt health data.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="abdm-container">
      {/* Top Header Block */}
      <div className="abdm-header">
        <div className="abdm-title-area">
          <h2>Ayushman Bharat Digital Mission (ABDM)</h2>
          <p>Milestone 2 & 3 integration • Patient Health Records (PHR) Linking & Consent Manager</p>
        </div>

        {/* Demo Mode Switch */}
        <div className="demo-toggle-wrapper">
          <span className="demo-toggle-label">
            {isDemoMode ? (
              <span className="text-warning">
                <i className="icofont-warning-alt me-1" /> DEMO/MOCK MODE ACTIVE
              </span>
            ) : (
              <span className="text-success">
                <i className="icofont-check-circled me-1" /> LIVE GATEWAY SYSTEM
              </span>
            )}
          </span>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="demoModeSwitch"
              checked={isDemoMode}
              onChange={(e) => setIsDemoMode(e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="abdm-tabs-nav">
        <button
          className={`abdm-tab-btn ${activeTab === "linking" ? "active" : ""}`}
          onClick={() => setActiveTab("linking")}
        >
          <i className="icofont-link" /> Care Context Linking (HIP)
        </button>
        <button
          className={`abdm-tab-btn ${activeTab === "consent" ? "active" : ""}`}
          onClick={() => setActiveTab("consent")}
        >
          <i className="icofont-checked" /> Consent & HIU Manager
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.7)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="mt-3 fw-bold text-dark">Processing ABDM Request...</span>
        </div>
      )}

      {/* TAB 1: CARE CONTEXT LINKING PANEL */}
      {activeTab === "linking" && (
        <div className="abdm-panel">
          <div className="grid-layout">
            {/* Search Col */}
            <div className="abdm-card">
              <h5 className="abdm-card-title">
                <i className="icofont-search-user text-primary" /> Search Patient Record
              </h5>
              <form onSubmit={handleSearchPatient}>
                <div className="form-group-custom">
                  <label htmlFor="searchPatientInput">Patient Name / Mobile / ID</label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      id="searchPatientInput"
                      className="input-custom"
                      placeholder="e.g. Aarav"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn-abdm btn-abdm-primary">
                      <i className="icofont-search" />
                    </button>
                  </div>
                </div>
              </form>

              <div className="search-results-list">
                {patientsList.map((p) => (
                  <div
                    key={p.patientId}
                    className={`patient-search-item ${selectedPatient?.patientId === p.patientId ? "active" : ""}`}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div className="patient-brief">
                      <h6>{p.patientName}</h6>
                      <span>
                        ID: {p.patientId} • {p.gender}, {p.age} Yrs • Mob: {p.mobileNo}
                      </span>
                    </div>
                    <div>
                      {p.isLinked ? (
                        <span className="status-tag linked">Linked</span>
                      ) : (
                        <span className="status-tag unlinked">Unlinked</span>
                      )}
                    </div>
                  </div>
                ))}
                {patientsList.length === 0 && (
                  <div className="text-center text-muted py-4">Search patients to map context records.</div>
                )}
              </div>
            </div>

            {/* Records Details Col */}
            <div className="abdm-card">
              <h5 className="abdm-card-title">
                <i className="icofont-prescription text-success" /> Care Context Mapping & Linking
              </h5>

              {selectedPatient ? (
                <div>
                  {/* Selected Patient details banner */}
                  <div className="patient-details-card">
                    <div className="detail-row-grid">
                      <div className="detail-cell">
                        <span className="cell-lbl">PATIENT NAME</span>
                        <span className="cell-val">{selectedPatient.patientName}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="cell-lbl">UHID</span>
                        <span className="cell-val">{selectedPatient.uhidNo || selectedPatient.patientId}</span>
                      </div>
                      <div className="detail-cell">
                        <span className="cell-lbl">GENDER & AGE</span>
                        <span className="cell-val">
                          {selectedPatient.gender}, {selectedPatient.age} Years
                        </span>
                      </div>
                      <div className="detail-cell">
                        <span className="cell-lbl">ABHA ID STATUS</span>
                        <span className="cell-val">
                          {selectedPatient.isLinked ? (
                            <span className="status-tag linked">
                              <i className="icofont-check" /> Verified ABHA Link
                            </span>
                          ) : (
                            <span className="status-tag unlinked">Not Mapped</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="form-group-custom mt-3">
                      <label htmlFor="abhaAddressInput">ABHA Address / Health ID</label>
                      <input
                        type="text"
                        id="abhaAddressInput"
                        className="input-custom"
                        placeholder="patient_username@abdm"
                        disabled={selectedPatient.isLinked}
                        value={abhaAddressInput}
                        onChange={(e) => setAbhaAddressInput(e.target.value)}
                      />
                      {selectedPatient.isLinked && selectedPatient.abhaNumber && (
                        <div className="mt-2 text-muted" style={{ fontSize: "0.8rem" }}>
                          Linked ABHA Card No: <strong>{selectedPatient.abhaNumber}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List of medical records */}
                  <div className="records-selection-wrapper">
                    <h6 className="fw-bold mb-3">Select Local Hospital Records (Care Contexts) to Link</h6>
                    <div className="records-list">
                      {patientRecords.map((rec) => (
                        <div key={rec.id || rec.referenceNumber} className="record-item-card">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(rec.id || rec.referenceNumber) || rec.linked}
                            disabled={rec.linked}
                            onChange={() => handleToggleRecord(rec.id || rec.referenceNumber)}
                          />
                          <div className={`record-icon ${rec.type?.toLowerCase()}`}>
                            <i
                              className={
                                rec.type === "OPD"
                                  ? "icofont-doctor-alt"
                                  : rec.type === "LAB"
                                    ? "icofont-laboratory"
                                    : "icofont-xray"
                              }
                            />
                          </div>
                          <div className="record-meta">
                            <h6>{rec.display}</h6>
                            <span>
                              Ref No: {rec.referenceNumber} • Date: {rec.date}
                            </span>
                          </div>
                          <div>
                            {rec.linked ? (
                              <span className="status-tag linked">Already Linked</span>
                            ) : selectedRecords.includes(rec.id || rec.referenceNumber) ? (
                              <span className="status-tag requested">Selected</span>
                            ) : (
                              <span className="status-tag unlinked">Ready to Link</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {patientRecords.length === 0 && (
                        <div className="text-center py-4 border rounded bg-light text-muted">
                          No hospital records found for this patient UHID.
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-end gap-3">
                      <button
                        className="btn-abdm btn-abdm-primary"
                        onClick={handleInitiateLinking}
                        disabled={selectedRecords.length === 0}
                      >
                        <i className="icofont-link" /> Link Selected Records to ABHA
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="text-center py-5 text-muted"
                  style={{ border: "2px dashed var(--abdm-border)", borderRadius: "16px" }}
                >
                  <i className="icofont-user-alt-4 fs-1 mb-3 text-light" />
                  <h5>No Patient Selected</h5>
                  <p>Please query and select a patient card from the sidebar first.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONSENT REQUEST MANAGER (HIU) */}
      {activeTab === "consent" && (
        <div className="abdm-panel">
          <div className="grid-layout">
            {/* Create Consent Request Form */}
            <div className="abdm-card">
              <h5 className="abdm-card-title">
                <i className="icofont-checked text-primary" /> Request Patient Consent
              </h5>
              <form onSubmit={handleRaiseConsent}>
                <div className="form-group-custom">
                  <label htmlFor="consentAbhaInput">Patient ABHA Address ID</label>
                  <input
                    type="text"
                    id="consentAbhaInput"
                    className="input-custom"
                    placeholder="patient@abdm"
                    value={consentForm.abhaAddress}
                    onChange={(e) => setConsentForm(prev => ({ ...prev, abhaAddress: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="consentPurpose">Purpose of Access</label>
                  <select
                    id="consentPurpose"
                    className="input-custom"
                    value={consentForm.purpose}
                    onChange={(e) => setConsentForm(prev => ({ ...prev, purpose: e.target.value }))}
                  >
                    <option value="REFERRAL">Referral (General Practice)</option>
                    <option value="CARE_MANAGEMENT">Chronic Care Management</option>
                    <option value="SELF_REQUEST">Patient Self-Request</option>
                    <option value="EMERGENCY">Emergency Treatment</option>
                  </select>
                </div>

                <div className="form-group-custom">
                  <label>Health Records Requested</label>
                  <div className="checkbox-grid">
                    {[
                      { id: "OPD_PRESCRIPTION", label: "OPD Prescription" },
                      { id: "DIAGNOSTIC_REPORT", label: "Diagnostic Report" },
                      { id: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
                      { id: "IMMUNIZATION_RECORD", label: "Immunization Log" }
                    ].map((t) => (
                      <div key={t.id} className="checkbox-custom-item">
                        <input
                          type="checkbox"
                          id={`type-${t.id}`}
                          checked={consentForm.hiTypes.includes(t.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setConsentForm(prev => ({
                              ...prev,
                              hiTypes: checked
                                ? [...prev.hiTypes, t.id]
                                : prev.hiTypes.filter((x) => x !== t.id)
                            }));
                          }}
                        />
                        <label htmlFor={`type-${t.id}`}>{t.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label htmlFor="consentFromDate">Data Range (From)</label>
                      <input
                        type="date"
                        id="consentFromDate"
                        className="input-custom"
                        value={consentForm.dateFrom}
                        onChange={(e) => setConsentForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label htmlFor="consentToDate">Data Range (To)</label>
                      <input
                        type="date"
                        id="consentToDate"
                        className="input-custom"
                        value={consentForm.dateTo}
                        onChange={(e) => setConsentForm(prev => ({ ...prev, dateTo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group-custom">
                  <label htmlFor="consentExpiry">Consent Expiry Date/Time</label>
                  <input
                    type="datetime-local"
                    id="consentExpiry"
                    className="input-custom"
                    value={consentForm.expiry}
                    onChange={(e) => setConsentForm(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>

                <button type="submit" className="btn-abdm btn-abdm-primary w-100 mt-2">
                  <i className="icofont-check" /> Send Consent Request via Gateway
                </button>
              </form>
            </div>

            {/* Active Consents Lists */}
            <div className="abdm-card">
              <h5 className="abdm-card-title">
                <i className="icofont-list text-success" /> Active Consent Requests Tracker
              </h5>
              <div className="abdm-table-wrapper">
                <table className="abdm-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Patient ABHA</th>
                      <th>Access Purpose</th>
                      <th>Record Types</th>
                      <th>Consent Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentsList.map((c) => (
                      <tr key={c.consentRequestId}>
                        <td>
                          <strong>{c.consentRequestId}</strong>
                        </td>
                        <td>{c.abhaAddress}</td>
                        <td>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                            {c.purpose.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.75rem", color: "var(--abdm-text-muted)" }}>
                            {c.hiTypes.map(t => t.split("_")[0]).join(", ")}
                          </span>
                        </td>
                        <td>
                          <span className={`status-tag ${c.status.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {c.status === "PENDING" && (
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleCheckConsentStatus(c.consentRequestId)}
                                title="Check status on gateway"
                              >
                                <i className="icofont-refresh" /> Refresh
                              </button>
                            )}
                            {c.status === "GRANTED" && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleFetchRecords(c)}
                              >
                                <i className="icofont-eye" /> Fetch & View
                              </button>
                            )}
                            {c.status !== "PENDING" && c.status !== "GRANTED" && (
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>No Actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {consentsList.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No consent requests logged in the gateway list yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURE LINKING OTP CONFIRMATION MODAL */}
      {showOtpModal && (
        <div className="clinical-viewer-overlay" style={{ zIndex: 1100 }}>
          <div className="clinical-viewer-modal" style={{ maxWidth: "450px" }}>
            <div className="viewer-header">
              <h4>Patient Consent Verification</h4>
              <button className="btn-close-viewer" onClick={() => setShowOtpModal(false)}>×</button>
            </div>
            <div className="viewer-body bg-white text-center">
              <div className="mb-4">
                <i className="icofont-lock text-warning" style={{ fontSize: "3.5rem" }} />
                <h5 className="mt-3 fw-bold">Enter Linking Authentication OTP</h5>
                <p className="text-muted small">
                  An OTP has been sent by the ABDM Gateway to verify linking of records with the patient ABHA address.
                </p>
                {isDemoMode && (
                  <div className="alert alert-info py-2 small">
                    Demo Mode Key: Enter <strong>123456</strong> to successfully verify.
                  </div>
                )}
              </div>

              <div className="form-group-custom">
                <input
                  type="text"
                  maxLength="6"
                  className="input-custom text-center fw-bold fs-4"
                  style={{ letterSpacing: "8px" }}
                  placeholder="000000"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn-abdm btn-abdm-secondary flex-grow-1" onClick={() => setShowOtpModal(false)}>
                  Cancel
                </button>
                <button className="btn-abdm btn-abdm-primary flex-grow-1" onClick={handleVerifyOtp}>
                  Confirm OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLINICAL DATA VIEWER OVERLAY MODAL */}
      {showClinicalViewer && activeClinicalRecord && (
        <div className="clinical-viewer-overlay">
          <div className="clinical-viewer-modal">
            <div className="viewer-header">
              <h4>Decrypted Clinical Artifact Record</h4>
              <button className="btn-close-viewer" onClick={() => setShowClinicalViewer(false)}>×</button>
            </div>
            <div className="viewer-body">
              {/* Record Metadata Banner */}
              <div className="patient-details-card mb-4" style={{ background: "#ffffff" }}>
                <div className="detail-row-grid">
                  <div className="detail-cell">
                    <span className="cell-lbl">PATIENT NAME</span>
                    <span className="cell-val">{activeClinicalRecord.patient?.name}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="cell-lbl">GENDER & AGE</span>
                    <span className="cell-val">
                      {activeClinicalRecord.patient?.gender}, {activeClinicalRecord.patient?.age} Yrs
                    </span>
                  </div>
                  <div className="detail-cell">
                    <span className="cell-lbl">HEALTH INFORMATION PROVIDER</span>
                    <span className="cell-val">{activeClinicalRecord.provider?.hospital}</span>
                  </div>
                  <div className="detail-cell">
                    <span className="cell-lbl">CONSULTING DOCTOR</span>
                    <span className="cell-val">{activeClinicalRecord.provider?.doctor}</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis details */}
              <div className="record-section-title">Clinical Indication & Diagnosis</div>
              <div className="glass-card mb-4 bg-white p-3 border rounded">
                <h6 className="fw-bold mb-1">Assessed Indication</h6>
                <p className="text-dark mb-0">{activeClinicalRecord.diagnosis}</p>
              </div>

              {/* Prescribed Medications */}
              <div className="record-section-title">Prescribed Medications</div>
              <div className="abdm-table-wrapper mb-4">
                <table className="abdm-table">
                  <thead>
                    <tr>
                      <th>Medicine Name / Formula</th>
                      <th>Dosage regimen</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClinicalRecord.prescriptions?.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{p.drug}</strong>
                        </td>
                        <td>{p.dosage}</td>
                        <td>{p.duration}</td>
                      </tr>
                    ))}
                    {(!activeClinicalRecord.prescriptions || activeClinicalRecord.prescriptions.length === 0) && (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">No medications prescribed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Laboratory Observation reports */}
              <div className="record-section-title">Diagnostic Investigations & Observations</div>
              <div className="clinical-grid">
                {activeClinicalRecord.investigations?.map((inv, idx) => (
                  <div key={idx} className="clinical-data-card">
                    <h6>{inv.test}</h6>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div>
                        <span className="clinical-meta-lbl">OBSERVED VALUE</span>
                        <span className="clinical-meta-val d-block">{inv.value}</span>
                      </div>
                      <span className="status-tag granted">{inv.status}</span>
                    </div>
                  </div>
                ))}
                {(!activeClinicalRecord.investigations || activeClinicalRecord.investigations.length === 0) && (
                  <div className="text-center w-100 py-3 text-muted">No investigations ordered.</div>
                )}
              </div>
            </div>
            <div className="viewer-header justify-content-end">
              <button className="btn-abdm btn-abdm-primary" onClick={() => setShowClinicalViewer(false)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbdmMilestone2;
