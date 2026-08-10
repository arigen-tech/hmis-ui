import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getRequest, postRequest } from '../../../service/apiService';
import { MAS_FREQUENCY_GET_ALL, MAS_ROUTE_GET_ALL, GET_ALL_DRUGS_BY_SECTION, GET_MEDICATION_TREATMENT_BY_INPATIENT_ID, SAVE_IPD_MEDICATION_TREATMENT, STOP_IPD_MEDICATION_TREATMENT, GET_STOCK_BATCHES_ITEM_WISE, GET_CURRENT_USER_PROFILE_BY_NAME, GET_MAR_MEDICINE_LIST, GET_MAR_ADMINISTRATION_LOG, SAVE_MAR_DETAILS } from '../../../config/apiConfig';
import ConfirmationPopup from '../../../Components/ConfirmationPopup';

// PortalDropdown Component - Fixed positioning like in IndentCreation / OpeningBalanceEntry
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4, // 4 px gap below the input
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      });
    };

    updatePosition();

    // Re-position on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const MedicationModule = ({ selectedPatient }) => {
  // ---------- Tab State ----------
  const [activeView, setActiveView] = useState("medications"); // "medications" | "adverse"

  // ---------- State ----------
  const [currentUserName, setCurrentUserName] = useState('');

  // Active medications (only those with stopDate === null)
  const [activeMeds, setActiveMeds] = useState([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medSaving, setMedSaving] = useState(false);
  const [medStopping, setMedStopping] = useState(false);
  const [marEntrySaving, setMarEntrySaving] = useState(false);

  const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id;

  const fetchActiveMeds = async () => {
    if (!inpatientId) return;
    setMedLoading(true);
    try {
      const res = await getRequest(`${GET_MEDICATION_TREATMENT_BY_INPATIENT_ID}/${inpatientId}`);
      if (res && Array.isArray(res.response)) {
        const mapped = res.response.map((item) => ({
          id: item.prescriptionId,
          itemId: item.itemId,
          medicineName: item.itemName,
          route: item.routeName,
          dose: item.dose,
          frequency: item.frequencyName,
          startDate: item.startDate,
          administeredBy: item.administratedBy,
          stopDate: item.stopDate,
          stopReason: item.stopReason || null,
        }));
        setActiveMeds(mapped);
      } else {
        setActiveMeds([]);
      }
    } catch (error) {
      console.error("Error fetching medication list:", error);
      setActiveMeds([]);
    } finally {
      setMedLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const username = localStorage.getItem("username") || sessionStorage.getItem("username");
      if (!username) return;
      try {
        const res = await getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${username}`);
        if (res && res.status === 200 && res.response) {
          const docName = res.response.firstName
            ? [res.response.firstName, res.response.middleName, res.response.lastName].filter(Boolean).join(" ")
            : (res.response.name || res.response.userName || username);
          setCurrentUserName(docName);
        } else {
          setCurrentUserName(username);
        }
      } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        setCurrentUserName(username);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchActiveMeds();
  }, [inpatientId]);

  // Dynamic MAR states
  const [dynamicMarLogs, setDynamicMarLogs] = useState([]);
  const [dynamicMarLogsLoading, setDynamicMarLogsLoading] = useState(false);
  const [marMedicineList, setMarMedicineList] = useState([]);

  const [logFilterItemId, setLogFilterItemId] = useState('');
  const [marLogPage, setMarLogPage] = useState(0);
  const [marLogSize, setMarLogSize] = useState(10);
  const [marLogTotalElements, setMarLogTotalElements] = useState(0);
  const [marLogTotalPages, setMarLogTotalPages] = useState(0);

  const fetchMarMedicineList = async () => {
    if (!inpatientId) return;
    try {
      const res = await getRequest(`${GET_MAR_MEDICINE_LIST}?inpatientId=${inpatientId}`);
      if (res && res.status === 200 && Array.isArray(res.response)) {
        setMarMedicineList(res.response);
      } else {
        setMarMedicineList([]);
      }
    } catch (error) {
      console.error("Error fetching MAR medicine list:", error);
      setMarMedicineList([]);
    }
  };

  const fetchMarLogs = async () => {
    if (!inpatientId) return;
    setDynamicMarLogsLoading(true);
    let url = `${GET_MAR_ADMINISTRATION_LOG}?inpatientId=${inpatientId}&page=${marLogPage}&size=${marLogSize}`;
    if (logFilterItemId) {
      url += `&itemId=${logFilterItemId}`;
    }
    try {
      const res = await getRequest(url);
      if (res && res.status === 200 && res.response && res.response.content) {
        setDynamicMarLogs(res.response.content);
        setMarLogTotalElements(res.response.totalElements || 0);
        setMarLogTotalPages(res.response.totalPages || 0);
      } else {
        setDynamicMarLogs([]);
        setMarLogTotalElements(0);
        setMarLogTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching MAR administration logs:", error);
      setDynamicMarLogs([]);
    } finally {
      setDynamicMarLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarMedicineList();
  }, [inpatientId]);

  useEffect(() => {
    fetchMarLogs();
  }, [inpatientId, marLogPage, marLogSize, logFilterItemId]);

  // MAR administration logs (history)
  const [marLogs, setMarLogs] = useState([
    {
      id: 101,
      dateTime: '2025-04-05T10:30',
      medicineName: 'Paracetamol',
      route: 'Oral',
      dose: '500 mg',
      qty: 1,
      batch: 'B123',
      expiry: '2026-12-30',
      givenBy: 'Nurse A',
      total: 50,
      remarks: '',
    },
    {
      id: 102,
      dateTime: '2025-04-05T11:00',
      medicineName: 'Ceftriaxone',
      route: 'IV',
      dose: '1 gm',
      qty: 1,
      batch: 'B456',
      expiry: '2026-02-28',
      givenBy: 'Nurse B',
      total: 120,
      remarks: '',
    },
    {
      id: 103,
      dateTime: '2025-04-05T12:00',
      medicineName: 'DNS',
      route: 'IV',
      dose: '500 ml',
      qty: 1,
      batch: 'B789',
      expiry: '2027-01-15',
      givenBy: 'Nurse A',
      total: 80,
      remarks: '',
    },
    {
      id: 104,
      dateTime: '2025-04-05T16:00',
      medicineName: 'Paracetamol',
      route: 'Oral',
      dose: '500 mg',
      qty: 1,
      batch: 'B124',
      expiry: '2026-12-30',
      givenBy: 'Nurse B',
      total: 50,
      remarks: '',
    },
  ]);

  // Adverse events
  const [adverseEvents, setAdverseEvents] = useState([]);

  // UI states
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showMarEntryModal, setShowMarEntryModal] = useState(false);
  const [showAdverseModal, setShowAdverseModal] = useState(false);

  // Selected medication for stop/logs
  const [selectedMedForAction, setSelectedMedForAction] = useState(null);
  const [stopReason, setStopReason] = useState('');

  // Multi-select for MAR entry
  const [selectedMedIds, setSelectedMedIds] = useState([]);

  // MAR entry form data
  const [marEntryItems, setMarEntryItems] = useState([]);

  // Filter for MAR log
  const [logFilterMedicine, setLogFilterMedicine] = useState('');

  // New medication form (no class, added totalDays)
  const [newMed, setNewMed] = useState({
    medicineName: '',
    itemId: '',
    route: '',
    routeId: '',
    dose: '',
    frequency: '',
    frequencyId: '',
    totalDays: '',
    startDate: '',
    prescribedBy: '',
    administeredBy: '',
    remarks: '',
  });

  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "OK", cancelText = "") => {
    setConfirmationPopup({
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        setConfirmationPopup(null);
        if (onConfirm) onConfirm();
      },
      onCancel: onCancel ? () => {
        setConfirmationPopup(null);
        onCancel();
      } : null
    });
  };

  // Medication search & master options
  const [dynamicMedicineList, setDynamicMedicineList] = useState([]);
  const [searchTimeoutId, setSearchTimeoutId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [frequencyOptions, setFrequencyOptions] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const medicineInputRef = useRef(null);

  useEffect(() => {
    // Fetch frequencies
    getRequest(MAS_FREQUENCY_GET_ALL)
      .then((res) => {
        if (res && res.response) {
          setFrequencyOptions(
            res.response.map((f) => ({
              frequencyId: f.frequencyId,
              frequencyName: f.frequencyName,
            }))
          );
        } else if (Array.isArray(res)) {
          setFrequencyOptions(
            res.map((f) => ({
              frequencyId: f.frequencyId,
              frequencyName: f.frequencyName,
            }))
          );
        }
      })
      .catch(console.error);

    // Fetch routes
    getRequest(MAS_ROUTE_GET_ALL)
      .then((res) => {
        if (res && res.response) {
          setRouteOptions(
            res.response.map((r) => ({
              routeId: r.routeId,
              routeName: r.routeName,
            }))
          );
        } else if (Array.isArray(res)) {
          setRouteOptions(
            res.map((r) => ({
              routeId: r.routeId,
              routeName: r.routeName,
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  const fetchMedicines = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setDynamicMedicineList([]);
      return;
    }
    try {
      const response = await getRequest(`${GET_ALL_DRUGS_BY_SECTION}?flag=1&search=${searchText}&page=0&size=20`);
      if (response && response.response && response.response.content) {
        setDynamicMedicineList(
          response.response.content.map((item) => ({
            itemId: item.itemId,
            nomenclature: item.nomenclature,
          }))
        );
      } else if (response && response.response && Array.isArray(response.response)) {
        setDynamicMedicineList(
          response.response.map((item) => ({
            itemId: item.itemId,
            nomenclature: item.nomenclature,
          }))
        );
      } else if (Array.isArray(response)) {
        setDynamicMedicineList(
          response.map((item) => ({
            itemId: item.itemId,
            nomenclature: item.nomenclature,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMedicineNameChange = (value) => {
    setNewMed((prev) => ({ ...prev, medicineName: value, itemId: '' }));
    setDropdownOpen(true);

    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    setSearchTimeoutId(setTimeout(() => fetchMedicines(value), 300));
  };

  const selectMedicine = (item) => {
    setNewMed((prev) => ({
      ...prev,
      medicineName: item.nomenclature,
      itemId: item.itemId,
    }));
    setDropdownOpen(false);
  };

  // New adverse event form
  const [newAdverse, setNewAdverse] = useState({
    medicineName: '',
    reaction: '',
    severity: '',
    actionTaken: '',
    reportedBy: '',
  });

  // Helper: get current datetime-local string
  const nowDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  const openAddMedModal = () => {
    setNewMed((prev) => ({
      ...prev,
      startDate: nowDateTimeLocal(),
    }));
    setShowAddMedModal(true);
  };

  // ---------- Handlers: Add Medication ----------
  const handleAddMed = async () => {
    if (!newMed.medicineName || !newMed.routeId || !newMed.dose || !newMed.frequencyId || !newMed.startDate || !newMed.totalDays) {
      alert('Please fill all required fields (Medicine Name, Route, Dose, Frequency, Start Date, Total Days)');
      return;
    }
    
    setMedSaving(true);
    const payload = {
      inpatientId: Number(inpatientId) || 0,
      itemId: Number(newMed.itemId) || 0,
      routeId: Number(newMed.routeId) || 0,
      dose: String(newMed.dose),
      frequencyId: Number(newMed.frequencyId) || 0,
      startDate: newMed.startDate ? new Date(newMed.startDate).toISOString() : new Date().toISOString(),
      administratedBy: String(newMed.administeredBy || ""),
      day: Number(newMed.totalDays) || 0
    };

    try {
      const response = await postRequest(SAVE_IPD_MEDICATION_TREATMENT, payload);
      showConfirmationPopup(
        response?.message || "Medication saved successfully!",
        "success",
        () => {
          setShowAddMedModal(false);
          fetchActiveMeds();
          setNewMed({
            medicineName: '',
            itemId: '',
            route: '',
            routeId: '',
            dose: '',
            frequency: '',
            frequencyId: '',
            totalDays: '',
            startDate: nowDateTimeLocal(),
            prescribedBy: '',
            administeredBy: '',
            remarks: '',
          });
        }
      );
    } catch (error) {
      console.error("Error saving medication:", error);
      showConfirmationPopup(
        error?.message || "Failed to save medication.",
        "danger",
        () => {}
      );
    } finally {
      setMedSaving(false);
    }
  };

  // ---------- Handlers: Stop Medication ----------
  const openStopModal = (med) => {
    setSelectedMedForAction(med);
    setStopReason('');
    setShowStopModal(true);
  };

  const confirmStop = async () => {
    if (!stopReason.trim()) {
      alert('Please enter a reason for stopping the medication.');
      return;
    }

    setMedStopping(true);
    const payload = {
      prescriptionId: Number(selectedMedForAction.id),
      stopReason: String(stopReason).trim()
    };

    try {
      const response = await postRequest(STOP_IPD_MEDICATION_TREATMENT, payload);
      showConfirmationPopup(
        response?.message || "Medication stopped successfully!",
        "success",
        () => {
          fetchActiveMeds();
        }
      );
      setShowStopModal(false);
      setSelectedMedForAction(null);
      setStopReason('');
    } catch (error) {
      console.error("Error stopping medication:", error);
      showConfirmationPopup(
        error?.message || "Failed to stop medication.",
        "danger",
        () => { }
      );
    } finally {
      setMedStopping(false);
    }
  };

  // ---------- Handlers: View Logs ----------
  const [specificMedLogs, setSpecificMedLogs] = useState([]);
  const [specificMedLogsLoading, setSpecificMedLogsLoading] = useState(false);

  const openLogsModal = async (med) => {
    setSelectedMedForAction(med);
    setShowLogsModal(true);
    setSpecificMedLogs([]);
    setSpecificMedLogsLoading(true);
    try {
      const url = `${GET_MAR_ADMINISTRATION_LOG}?inpatientId=${inpatientId}&itemId=${med.itemId}&page=0&size=100`;
      const res = await getRequest(url);
      if (res && res.status === 200 && res.response && res.response.content) {
        setSpecificMedLogs(res.response.content);
      } else {
        setSpecificMedLogs([]);
      }
    } catch (error) {
      console.error("Error fetching specific med logs:", error);
      setSpecificMedLogs([]);
    } finally {
      setSpecificMedLogsLoading(false);
    }
  };

  // ---------- Handlers: MAR Entry ----------
  const toggleSelectMed = (medId) => {
    setSelectedMedIds(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  const openMarEntry = () => {
    if (selectedMedIds.length === 0) {
      alert('Please select at least one medication.');
      return;
    }

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const tokenData = token ? parseJwt(token) : null;
    const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId") || (tokenData ? tokenData.hospitalId : "");
    const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId") || (tokenData ? tokenData.departmentId : "");

    const selectedMeds = activeMeds.filter(med => selectedMedIds.includes(med.id));
    const initialItems = selectedMeds.map(med => ({
      medId: med.id,
      itemId: med.itemId,
      medicineName: med.medicineName,
      route: med.route,
      dose: med.dose,
      qty: 1,
      batch: '',
      expiry: '',
      givenBy: currentUserName,
      remarks: '',
      dateTime: nowDateTimeLocal(),
      batches: [],
      loadingBatches: med.itemId ? true : false,
      availableStock: null,
      selected: false,
    }));

    setMarEntryItems(initialItems);
    setShowMarEntryModal(true);

    selectedMeds.forEach((med) => {
      if (!med.itemId) return;

      getRequest(`${GET_STOCK_BATCHES_ITEM_WISE}/${med.itemId}?hospitalId=${hospitalId}&departmentId=${departmentId}`)
        .then(res => {
          let fetchedBatches = [];
          let defaultBatch = '';
          let defaultExpiry = '';

          if (res && Array.isArray(res.response)) {
            fetchedBatches = res.response;
            if (fetchedBatches.length > 0) {
              defaultBatch = fetchedBatches[0].batchName || '';
              defaultExpiry = fetchedBatches[0].doe || '';
            }
          }

          setMarEntryItems(prevItems => {
            const updated = [...prevItems];
            const itemIndex = updated.findIndex(item => item.medId === med.id);
            if (itemIndex !== -1) {
              updated[itemIndex].batches = fetchedBatches;
              updated[itemIndex].batch = defaultBatch;
              updated[itemIndex].expiry = defaultExpiry;
              updated[itemIndex].availableStock = fetchedBatches.length > 0 ? (fetchedBatches[0].availableStock ?? null) : null;
              updated[itemIndex].loadingBatches = false;
              updated[itemIndex].selected = !!(defaultBatch || updated[itemIndex].availableStock != null);
            }
            return updated;
          });
        })
        .catch(err => {
          console.error("Error fetching batches for item ID " + med.itemId, err);
          setMarEntryItems(prevItems => {
            const updated = [...prevItems];
            const itemIndex = updated.findIndex(item => item.medId === med.id);
            if (itemIndex !== -1) {
              updated[itemIndex].loadingBatches = false;
            }
            return updated;
          });
        });
    });
  };

  const handleMarEntryChange = (index, fieldOrObj, value) => {
    setMarEntryItems(prevItems => {
      const updated = [...prevItems];
      if (typeof fieldOrObj === 'object') {
        updated[index] = { ...updated[index], ...fieldOrObj };
      } else {
        updated[index] = { ...updated[index], [fieldOrObj]: value };
      }
      return updated;
    });
  };

  const saveMarEntries = async () => {
    const itemsToSave = marEntryItems.filter(item => item.selected);
    if (itemsToSave.length === 0) {
      alert('Please select at least one medication to save.');
      return;
    }

    for (let item of itemsToSave) {
      if (!item.batch || !item.expiry || !item.givenBy) {
        alert('Please fill Batch, Expiry, and Given By for all selected medications.');
        return;
      }
    }

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const tokenData = token ? parseJwt(token) : null;
    const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId") || (tokenData ? tokenData.departmentId : "");

    setMarEntrySaving(true);
    const payload = itemsToSave.map(item => ({
      prescriptionId: Number(item.medId) || 0,
      itemId: Number(item.itemId) || 0,
      dateTime: item.dateTime ? new Date(item.dateTime).toISOString() : new Date().toISOString(),
      requestQty: Number(item.qty) || 0,
      batchNo: String(item.batch || ""),
      expiryDate: item.expiry ? new Date(item.expiry).toISOString().split('T')[0] : "",
      givenBy: String(item.givenBy || ""),
      remark: String(item.remarks || ""),
      departmentId: Number(departmentId) || 0,
      inpatientId: Number(inpatientId) || 0
    }));

    try {
      const res = await postRequest(SAVE_MAR_DETAILS, payload);
      showConfirmationPopup(
        res?.message || "MAR entries saved successfully!",
        "success",
        () => {
          fetchMarLogs();
        }
      );
      setShowMarEntryModal(false);
      setSelectedMedIds([]);
      setMarEntryItems([]);
    } catch (error) {
      console.error("Error saving MAR entries:", error);
      showConfirmationPopup(
        error?.message || "Failed to save MAR entries.",
        "danger",
        () => { }
      );
    } finally {
      setMarEntrySaving(false);
    }
  };

  // ---------- Handlers: Adverse Events ----------
  const handleAddAdverse = () => {
    if (!newAdverse.medicineName || !newAdverse.reaction || !newAdverse.severity || !newAdverse.actionTaken || !newAdverse.reportedBy) {
      alert('Please fill all fields.');
      return;
    }
    setAdverseEvents([...adverseEvents, { id: Date.now(), ...newAdverse }]);
    setShowAdverseModal(false);
    setNewAdverse({
      medicineName: '',
      reaction: '',
      severity: '',
      actionTaken: '',
      reportedBy: '',
    });
  };

  // Active medicine names for dropdowns
  const activeMedicineNames = [...new Set(activeMeds.map(m => m.medicineName))];


  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "medications" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("medications")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Medications
        </button>
        <button
          className={`btn btn-sm ${activeView === "adverse" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("adverse")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Adverse Events ({adverseEvents.length})
        </button>
      </div>

      {/* ─── MEDICATIONS TAB ─── */}
      {activeView === "medications" && (
        <>
          {/* Current Medications Section */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <strong>Current Medications (Active Orders)</strong>
              <button className="btn btn-sm btn-light" onClick={openAddMedModal}>
                + Add Medication
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>Select</th>
                      <th>Medicine</th>
                      <th>Route</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Start Date</th>
                      <th>Administered By</th>
                      <th>Stop Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medLoading ? (
                      <tr>
                        <td colSpan="9" className="text-center py-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading medications...</span>
                        </td>
                      </tr>
                    ) : activeMeds.length > 0 ? (
                      activeMeds.map(med => (
                        <tr key={med.id}>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedMedIds.includes(med.id)}
                              onChange={() => toggleSelectMed(med.id)}
                              disabled={!!med.stopDate}
                            />
                          </td>
                          <td>{med.medicineName}</td>
                          <td>{med.route}</td>
                          <td>{med.dose}</td>
                          <td>{med.frequency}</td>
                          <td>{med.startDate ? new Date(med.startDate).toLocaleString() : ''}</td>
                          <td>{med.administeredBy || '—'}</td>
                          <td>{med.stopDate ? new Date(med.stopDate).toLocaleString() : '—'}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger me-1"
                              onClick={() => openStopModal(med)}
                              disabled={!!med.stopDate}
                            >
                              Stop
                            </button>
                            <button className="btn btn-sm btn-outline-info" onClick={() => openLogsModal(med)}>Logs</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" className="text-center">No active medications.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end">
              <button className="btn btn-success btn-sm" onClick={openMarEntry}>
                Enter MAR for Selected
              </button>
            </div>
          </div>

          {/* MAR Administration Log */}
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <strong>MAR Administration Log</strong>
              <div style={{ width: '250px' }}>
                <select
                  className="form-select form-select-sm"
                  value={logFilterItemId}
                  onChange={(e) => {
                    setLogFilterItemId(e.target.value);
                    setMarLogPage(0);
                  }}
                >
                  <option value="">All (active medications only)</option>
                  {marMedicineList.map(med => (
                    <option key={med.itemId} value={med.itemId}>{med.nomenclature}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Date & Time</th>
                      <th>Medicine</th>
                      <th>Route</th>
                      <th>Dose</th>
                      <th>Qty</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th>Given By</th>
                      <th>Total</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicMarLogsLoading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading logs...</span>
                        </td>
                      </tr>
                    ) : dynamicMarLogs.length > 0 ? (
                      dynamicMarLogs.map((log, index) => (
                        <tr key={index}>
                          <td>{log.administrationTime ? new Date(log.administrationTime).toLocaleString() : ''}</td>
                          <td>{log.nomenclature}</td>
                          <td>{log.routeName}</td>
                          <td>{log.dose}</td>
                          <td>{log.administeredQty}</td>
                          <td>{log.batchNo}</td>
                          <td>{log.expiryDate}</td>
                          <td>{log.administeredBy}</td>
                          <td>{/* API doesn't provide total */}—</td>
                          <td>{log.remarks || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="10" className="text-center">No administration records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="d-flex justify-content-between align-items-center mt-3 p-2 border-top">
                <div className="d-flex align-items-center">
                  <span className="me-2" style={{ fontSize: '0.85rem' }}>Show:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={marLogSize}
                    onChange={(e) => {
                      setMarLogSize(Number(e.target.value));
                      setMarLogPage(0);
                    }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    disabled={marLogPage === 0}
                    onClick={() => setMarLogPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="me-2" style={{ fontSize: '0.85rem' }}>
                    Page {marLogPage + 1} of {marLogTotalPages || 1}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={marLogPage >= marLogTotalPages - 1 || marLogTotalPages === 0}
                    onClick={() => setMarLogPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── ADVERSE EVENTS TAB ─── */}
      {activeView === "adverse" && (
        <div className="card shadow-sm">
          <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
            <strong>Adverse Events</strong>
            <button className="btn btn-sm btn-light" onClick={() => setShowAdverseModal(true)}>
              + Report Event
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Medicine Name</th>
                    <th>Reaction</th>
                    <th>Severity</th>
                    <th>Action Taken</th>
                    <th>Reported By</th>
                  </tr>
                </thead>
                <tbody>
                  {adverseEvents.map(event => (
                    <tr key={event.id}>
                      <td>{event.medicineName}</td>
                      <td>{event.reaction}</td>
                      <td>{event.severity}</td>
                      <td>{event.actionTaken}</td>
                      <td>{event.reportedBy}</td>
                    </tr>
                  ))}
                  {adverseEvents.length === 0 && (
                    <tr><td colSpan="5" className="text-center">No adverse events reported.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODALS ---------- */}

      {/* Add Medication Modal - Updated */}
      {showAddMedModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Add New Medication</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddMedModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  {/* Medicine Name - full row */}
                  <div className="col-12 position-relative">
                    <label className="form-label small">Medicine Name *</label>
                    <input
                      ref={medicineInputRef}
                      type="text"
                      className="form-control form-control-sm"
                      autoComplete="off"
                      value={newMed.medicineName}
                      onChange={e => handleMedicineNameChange(e.target.value)}
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                      placeholder="Type medicine name to search..."
                    />
                    <PortalDropdown
                      anchorRef={medicineInputRef}
                      show={dropdownOpen && dynamicMedicineList.length > 0}
                    >
                      <ul className="list-group mb-0">
                        {dynamicMedicineList.map((item) => (
                          <li
                            key={item.itemId}
                            className="list-group-item list-group-item-action"
                            style={{ cursor: "pointer" }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectMedicine(item)}
                          >
                            {item.nomenclature}
                          </li>
                        ))}
                      </ul>
                    </PortalDropdown>
                  </div>
                  {/* Route, Dose, Frequency */}
                  <div className="col-md-4">
                    <label className="form-label small">Route *</label>
                    <select
                      className="form-select form-select-sm"
                      value={newMed.routeId || ""}
                      onChange={e => {
                        const val = e.target.value;
                        const opt = routeOptions.find(o => String(o.routeId) === String(val));
                        setNewMed({
                          ...newMed,
                          routeId: val ? Number(val) : "",
                          route: opt ? opt.routeName : ""
                        });
                      }}
                    >
                      <option value="">Select</option>
                      {routeOptions.map((opt) => (
                        <option key={opt.routeId} value={opt.routeId}>{opt.routeName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Dose *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.dose}
                      onChange={e => setNewMed({ ...newMed, dose: e.target.value })}
                      placeholder="e.g., 500 mg"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Frequency *</label>
                    <select
                      className="form-select form-select-sm"
                      value={newMed.frequencyId || ""}
                      onChange={e => {
                        const val = e.target.value;
                        const opt = frequencyOptions.find(o => String(o.frequencyId) === String(val));
                        setNewMed({
                          ...newMed,
                          frequencyId: val ? Number(val) : "",
                          frequency: opt ? opt.frequencyName : ""
                        });
                      }}
                    >
                      <option value="">Select</option>
                      {frequencyOptions.map((opt) => (
                        <option key={opt.frequencyId} value={opt.frequencyId}>{opt.frequencyName}</option>
                      ))}
                    </select>
                  </div>
                  {/* Start Date, Total Days, Administered By */}
                  <div className="col-md-4">
                    <label className="form-label small">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={newMed.startDate}
                      onChange={e => setNewMed({ ...newMed, startDate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Total No. of Days *</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={newMed.totalDays}
                      onChange={e => setNewMed({ ...newMed, totalDays: e.target.value })}
                      placeholder="e.g., 7"
                      min="1"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Administered By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newMed.administeredBy}
                      onChange={e => setNewMed({ ...newMed, administeredBy: e.target.value })}
                      placeholder="Doctor name"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMedModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddMed} disabled={medSaving}>
                  {medSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stop Medication Modal (unchanged) */}
      {showStopModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Stop Medication</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowStopModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Stopping: <strong>{selectedMedForAction?.medicineName}</strong></p>
                <label className="form-label">Reason / Doctor's Advice *</label>
                <textarea className="form-control" rows="3" value={stopReason} onChange={e => setStopReason(e.target.value)} placeholder="Enter reason or reference of instruction..."></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowStopModal(false)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={confirmStop} disabled={medStopping}>
                  {medStopping ? "Stopping..." : "Confirm Stop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal (unchanged) */}
      {showLogsModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">MAR Logs: {selectedMedForAction?.medicineName}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogsModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr><th>Date & Time</th><th>Dose</th><th>Qty</th><th>Batch</th><th>Given By</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {specificMedLogsLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-info" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="ms-2">Loading records...</span>
                          </td>
                        </tr>
                      ) : specificMedLogs.length > 0 ? (
                        specificMedLogs.map((log, index) => (
                          <tr key={index}>
                            <td>{log.administrationTime ? new Date(log.administrationTime).toLocaleString() : ''}</td>
                          <td>{log.dose}</td>
                            <td>{log.administeredQty}</td>
                            <td>{log.batchNo}</td>
                            <td>{log.administeredBy}</td>
                          <td>{log.remarks || '—'}</td>
                        </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" className="text-center">No administration records.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowLogsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAR Entry Modal (unchanged) */}
      {showMarEntryModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
            onClick={() => setShowMarEntryModal(false)}
          />
          <div
            className="modal show d-block"
            tabIndex={-1}
            role="dialog"
            style={{
              width: "calc(100vw - 310px)",
              left: "285px",
              maxWidth: "none",
              height: "90vh",
              margin: "5vh auto",
              position: "fixed",
              zIndex: 1050,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">MAR Entry</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowMarEntryModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <input 
                              type="checkbox" 
                              onChange={e => {
                                const checked = e.target.checked;
                                setMarEntryItems(prev => prev.map(item => ({
                                  ...item,
                                  selected: (item.batch || item.availableStock != null) ? checked : false
                                })));
                              }}
                              checked={marEntryItems.length > 0 && marEntryItems.every(item => item.selected || (!item.batch && item.availableStock == null))}
                            />
                          </th>
                          <th>Medicine</th><th>Route</th><th>Dose</th>
                          <th>Date & Time</th><th>Qty</th><th>Batch *</th><th>Expiry *</th>
                          <th>Available Stock</th>
                          <th>Given By *</th><th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marEntryItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              {(item.batch || item.availableStock != null) ? (
                                <input type="checkbox" checked={item.selected} onChange={e => handleMarEntryChange(idx, 'selected', e.target.checked)} />
                              ) : null}
                            </td>
                            <td>{item.medicineName}</td><td>{item.route}</td><td>{item.dose}</td>
                            <td><input type="datetime-local" className="form-control form-control-sm" value={item.dateTime} onChange={e => handleMarEntryChange(idx, 'dateTime', e.target.value)} /></td>
                            <td><input type="number" className="form-control form-control-sm" value={item.qty} onChange={e => handleMarEntryChange(idx, 'qty', parseInt(e.target.value) || 0)} min="1" /></td>
                            <td>
                              {item.loadingBatches ? (
                                <div className="d-flex align-items-center">
                                  <span className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true"></span>
                                  <span className="small text-muted">Loading...</span>
                                </div>
                              ) : item.batches && item.batches.length > 0 ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={item.batch}
                                  onChange={e => {
                                    const selectedBatch = e.target.value;
                                    const batchObj = item.batches.find(b => b.batchName === selectedBatch);
                                    const expiryDate = batchObj ? batchObj.doe : '';
                                    const availStock = batchObj ? batchObj.availableStock : null;
                                    handleMarEntryChange(idx, {
                                      batch: selectedBatch,
                                      expiry: expiryDate,
                                      availableStock: availStock,
                                      selected: !!(selectedBatch || availStock != null)
                                    });
                                  }}
                                >
                                  {item.batches.map((b, bIdx) => (
                                    <option key={bIdx} value={b.batchName}>{b.batchName}</option>
                                  ))}
                                </select>
                              ) : (
                                <select className="form-select form-select-sm" disabled>
                                  <option value="">No Batch Available</option>
                                </select>
                              )}
                            </td>
                            <td><input type="date" className="form-control form-control-sm" value={item.expiry} onChange={e => handleMarEntryChange(idx, 'expiry', e.target.value)} /></td>
                            <td>{item.availableStock ?? '—'}</td>
                            <td><input type="text" className="form-control form-control-sm" value={item.givenBy} onChange={e => handleMarEntryChange(idx, 'givenBy', e.target.value)} placeholder="Nurse name" /></td>
                            <td><input type="text" className="form-control form-control-sm" value={item.remarks} onChange={e => handleMarEntryChange(idx, 'remarks', e.target.value)} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowMarEntryModal(false)}>Cancel</button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={saveMarEntries}
                    disabled={marEntrySaving || marEntryItems.some(item => item.loadingBatches)}
                  >
                    {marEntrySaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      "Save All Entries"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Adverse Event Modal (unchanged) */}
      {showAdverseModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Report Adverse Event</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAdverseModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label small">Medicine Name *</label>
                  <select className="form-select form-select-sm" value={newAdverse.medicineName} onChange={e => setNewAdverse({ ...newAdverse, medicineName: e.target.value })}>
                    <option value="">Select</option>
                    {activeMedicineNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Reaction *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.reaction} onChange={e => setNewAdverse({ ...newAdverse, reaction: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Severity *</label>
                  <select className="form-select form-select-sm" value={newAdverse.severity} onChange={e => setNewAdverse({ ...newAdverse, severity: e.target.value })}>
                    <option value="">Select</option><option>Mild</option><option>Moderate</option><option>Severe</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Action Taken *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.actionTaken} onChange={e => setNewAdverse({ ...newAdverse, actionTaken: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Reported By *</label>
                  <input type="text" className="form-control form-control-sm" value={newAdverse.reportedBy} onChange={e => setNewAdverse({ ...newAdverse, reportedBy: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAdverseModal(false)}>Cancel</button>
                <button className="btn btn-success btn-sm" onClick={handleAddAdverse}>Save Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmationPopup && (
        <ConfirmationPopup
          show={!!confirmationPopup}
          message={confirmationPopup.message}
          type={confirmationPopup.type}
          confirmText={confirmationPopup.confirmText}
          cancelText={confirmationPopup.cancelText}
          onConfirm={confirmationPopup.onConfirm}
          onCancel={confirmationPopup.onCancel}
        />
      )}
    </div>
  );
};

export default MedicationModule;