import { useState, useEffect, useRef } from "react"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import { MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, OPEN_BALANCE, MAS_DRUG_MAS, ALL_REPORTS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"
import ReactDOM from 'react-dom';
import LoadingScreen from "../../../Components/Loading";
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import {WARNING_DUPLICATE_BATCH_ENTRY, CONFIRM_OPENING_BALANCE_ACTION,ERROR_UPDATE_ENTRIES_FAILED,
  CONFIRM_OPENING_BALANCE_SUBMIT_UPDATE_PRINT,
}  from "../../../config/constants";

const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [approvalData, setApprovalData] = useState([])
  const [brandOptions, setBrandOptions] = useState([])
  const [dtRecord, setDtRecord] = useState([])
  const [manufacturerOptions, setManufacturerOptions] = useState([])
  const [drugCodeOptions, setDrugCodeOptions] = useState([])
  const crUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const [currentLogUser, setCurrentLogUser] = useState(null);
  const deptId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  
  const navigate = useNavigate();
  
  const getCurrentDateTime = () => new Date().toISOString();

  const [formData, setFormData] = useState({
    balanceEntryDate: getCurrentDateTime(),
    enteredBy: "",
    department: "",
  });

  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : () => setConfirmationPopup(null),
      confirmText,
      cancelText
    });
  };

  const fetchOpenBalance = async () => {
    try {
      setLoading(true);
      const status = "p,s,a,r";
      const response = await getRequest(`${OPEN_BALANCE}/list/${status}/${hospitalId}/${departmentId}`);

      if (response && Array.isArray(response)) {
        setApprovalData(response);
        console.log("Transformed approval data:", response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BRAND}/getAll/1`);
      if (response && response.response) {
        setBrandOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching brand:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturer = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_MANUFACTURE}/getAll/1`);
      if (response && response.response) {
        setManufacturerOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching manufacturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const fatchDrugCodeOptions = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll2/1`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`/authController/getUsersForProfile/${crUser}`);

      if (response && response.response) {
        const { firstName = "", middleName = "", lastName = "" } = response.response;
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        setFormData((prev) => ({
          ...prev,
          enteredBy: fullName,
        }));
        setCurrentLogUser(response);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DEPARTMENT}/getById/${deptId}`);
      if (response && response.response) {
        setFormData((prev) => ({
          ...prev,
          department: deptId,
        }));
      }
    } catch (err) {
      console.error("Error fetching department:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenBalance();
    fatchDrugCodeOptions();
    fetchBrand();
    fetchManufacturer();
    fetchCurrentUser();
    fetchDepartment();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [detailEntries, setDetailEntries] = useState([])
  const statusOrder = { s: 1, p: 3, r: 2, a: 4 };
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const filteredApprovalData = approvalData.filter((item) => {
    if (!fromDate || !toDate) return true;
    const itemDate = formatDate(item.enteredDt);
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    return itemDate >= from && itemDate <= to;
  });

  const currentItems = [...filteredApprovalData]
    .sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (record, e) => {
    e.stopPropagation();
    setSelectedRecord(record);
    const entriesWithId = (record.openingBalanceDtResponseList || []).map((entry, idx) => ({
      ...entry,
      id: entry.id || entry.balanceTId || `row-${idx + 1}`,
    }));
    setDetailEntries(entriesWithId);
    setCurrentView("detail");
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
  }

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  }

  const addNewEntry = () => {
    const newId = Date.now() + Math.random();
    const newEntry = {
      id: newId,
      sNo: detailEntries.length + 1,
      itemCode: "",
      itemName: "",
      unit: "",
      batchNo: "",
      dom: "",
      doe: "",
      qty: "",
      unitRate: "",
      amount: "",
      medicineSource: "",
      manufacturer: "",
    };
    setDetailEntries([...detailEntries, newEntry]);
  }

  const deleteEntry = (id) => {
    setDetailEntries(detailEntries.filter((entry) => entry.id !== id));
    setDtRecord((prev) => {
      const updated = [...prev, id];
      return updated;
    });
  };

  console.log("deleteEntry :", dtRecord)

  const updateEntry = (id, field, value) => {
    const updatedEntries = detailEntries.map((entry) => {
      if (entry.id === id) {
        if (entry[field] === value) return entry;

        const updatedEntry = { ...entry, [field]: value };

        const dom = field === "dom" ? value : entry.dom;
        const doe = field === "doe" ? value : entry.doe;
        if (dom && doe && new Date(dom) > new Date(doe)) {
          alert("Date of Manufacturing (DOM) cannot be later than Date of Expiry (DOE).");
          return entry;
        }

        const qty = parseFloat(field === "qty" ? value : entry.qty) || 0;
        const rate = parseFloat(field === "mrpPerUnit" ? value : entry.mrpPerUnit) || 0;
        if (field === "qty" || field === "mrpPerUnit") {
          updatedEntry.totalCost = (qty * rate).toFixed(2);
        }

        return updatedEntry;
      }
      return entry;
    });

    setDetailEntries(updatedEntries);
  };

  console.log("currentLogUser:", currentLogUser);

  const formatToDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  };

  const hasDuplicateDetailEntries = (entries) => {
    const seen = new Map();
    for (const entry of entries) {
      const key = `${entry.batchNo}|${entry.dom || entry.manufactureDate}|${entry.doe || entry.expiryDate}`;
      if (seen.has(key)) {
        const prev = seen.get(key);
        if (
          (prev.balanceId && entry.balanceId && prev.balanceId !== entry.balanceId) ||
          (!prev.balanceId || !entry.balanceId)
        ) {
          return true;
        }
      } else {
        seen.set(key, entry);
      }
    }
    return false;
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const parseNumber = (value) => (value ? parseFloat(value) : null);

  const handleUpdateLogic = async (status) => {
    if (hasDuplicateDetailEntries(detailEntries)) {
      showPopup(WARNING_DUPLICATE_BATCH_ENTRY, "warning");
      return { success: false, message: "Duplicate entry found for Batch No/Serial No, DOM, and DOE." };
    }

    const storeBalanceDtList = detailEntries.map(entry => ({
      balanceId: entry.balanceTId ?? null,
      itemId: entry.itemId ?? entry.id ?? null,
      batchNo: entry.batchNo ?? "",
      manufactureDate: formatToDate(entry.dom ?? entry.manufactureDate),
      expiryDate: formatToDate(entry.doe ?? entry.expiryDate),
      unitsPerPack: parseNumber(entry.unitsPerPack),
      purchaseRatePerUnit: parseNumber(entry.purchaseRatePerUnit),
      gstPercent: parseNumber(entry.gstPercent),
      mrpPerUnit: parseNumber(entry.mrpPerUnit),
      qty: parseNumber(entry.qty),
      totalPurchaseCost: parseFloat(entry.totalPurchaseCost ?? entry.totalCost ?? 0),
      brandId: parseNumber(entry.brandId),
      manufacturerId: parseNumber(entry.manufacturerId),
    }));

    const requestPayload = {
      id: selectedRecord.balanceMId,
      departmentId: formData.department,
      enteredBy: formData.enteredBy,
      enteredDt: new Date(formData.balanceEntryDate).toISOString(),
      status: status,
      deletedDt: Array.isArray(dtRecord) && dtRecord.length > 0 ? dtRecord : null,
      storeBalanceDtList,
    };

    try {
      const response = await putRequest(
        `${OPEN_BALANCE}/updateById/${selectedRecord.balanceMId}`,
        requestPayload
      );

      console.log("Payload to submit:", requestPayload);

      return { success: true, response, balanceMId: selectedRecord.balanceMId };

    } catch (error) {
      console.error("Error submitting data:", error);
      return { success: false, message: "Failed to update entries!" };
    }
  };

  const handleUpdate = async (status) => {
    const actionText = status === "p" ? "submit" : "update";
    
    showConfirmationPopup(
      CONFIRM_OPENING_BALANCE_ACTION(actionText),
      "info",
      async () => {
        const result = await handleUpdateLogic(status);
        
        if (result?.success) {
          const balanceMId = result.balanceMId;
          
          showConfirmationPopup(    
          CONFIRM_OPENING_BALANCE_SUBMIT_UPDATE_PRINT(status),
            "success",
            () => {
              if (balanceMId) {
                navigate('/ViewDownloadReport', {
                  state: {
                    reportUrl: `${ALL_REPORTS}/openingBalanceReport?balanceMId=${balanceMId}`,
                    title: status === "p" ? 'Opening Balance Submit Report' : 'Opening Balance Update Report',
                    fileName: status === "p" ? 'Opening Balance Submit Report' : 'Opening Balance Update Report',
                    returnPath: window.location.pathname
                  }
                });
              }
              
              fetchOpenBalance();
              setSelectedRecord(null);
              setDetailEntries([]);
              setDtRecord([]);
              setCurrentView("list");
            },
            () => {
              fetchOpenBalance();
              setSelectedRecord(null);
              setDetailEntries([]);
              setDtRecord([]);
              setCurrentView("list");
            },
            "Yes",
            "No"
          );
        } else {
          showConfirmationPopup(
            result?.message || ERROR_UPDATE_ENTRIES_FAILED,
            "error",
            () => {},
            null,
            "OK",
            "Close"
          );
        }
      },
      () => {
        console.log(`${actionText} cancelled by user`);
      },
      `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      "Cancel"
    );
  };

  const handleReset = () => {
    setDetailEntries([
      {
        id: 1,
        sNo: 1,
        drugCode: "",
        drugName: "",
        unit: "",
        batchNo: "",
        dom: "",
        doe: "",
        qty: "",
        unitRate: "",
        amount: "",
        medicineSource: "",
        manufacturer: "",
      },
    ])
  }

  const generatereport = async (id) => {
    if (!id) {
      alert("Please select List");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const url = `${ALL_REPORTS}/openingBalanceReport?balanceMId=${id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "DrugExpiryReport.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const dropdownClickedRef = useRef(false)
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null)
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null)

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />
        
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">View And Edit Opening Balance Entry</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedRecord?.enteredDt
                          ? new Date(selectedRecord.enteredDt).toLocaleDateString("en-GB")
                          : ""
                      }
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.enteredBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <button
                      onClick={() => generatereport(selectedRecord?.balanceMId)}
                      className="btn btn-success"
                      disabled={isGeneratingPDF}
                      type="button"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        " Download Invoice"
                      )}
                    </button>
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "200px", minWidth: "200px" }}>Drug Name</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Unit</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Batch No/ Serial No</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOM</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Qty</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Units Per Pack</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Purchase Rate/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>GST Percent</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>MRP/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Total Cost</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Brand Name</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Manufacturer</th>
                        {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                          <>
                            <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                            <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="text-center">
                            <input
                              type="text"
                              className="form-control text-center"
                              value={index + 1}
                              style={{ width: "50px" }}
                              readOnly
                            />
                          </td>

                          <td style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemCode}
                              onChange={(e) => {
                                updateEntry(entry.id, "itemCode", e.target.value);
                                if (e.target.value.length > 0) {
                                  setActiveDrugCodeDropdown(index);
                                } else {
                                  setActiveDrugCodeDropdown(null);
                                }
                              }}
                              style={{ width: "110px" }}
                              autoComplete="off"
                              onFocus={() => setActiveDrugCodeDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) setActiveDrugCodeDropdown(null);
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            {(activeDrugCodeDropdown === index &&
                              (selectedRecord?.status === "s" || selectedRecord?.status === "r")) && (
                                <ul
                                  className="list-group position-fixed"
                                  style={{
                                    zIndex: 9999,
                                    maxHeight: 180,
                                    overflowY: "auto",
                                    width: "200px",
                                    top: `${document.querySelector(`input[value="${entry.itemCode}"]`)?.getBoundingClientRect().bottom + window.scrollY}px`,
                                    left: `${document.querySelector(`input[value="${entry.itemCode}"]`)?.getBoundingClientRect().left + window.scrollX}px`,
                                    backgroundColor: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "0.375rem",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)"
                                  }}
                                >
                                  {drugCodeOptions
                                    .filter((opt) => {
                                      const search = entry.itemCode?.toLowerCase() || "";
                                      return (
                                        (opt.code && opt.code.toLowerCase().includes(search)) ||
                                        (opt.name && opt.name.toLowerCase().includes(search)) ||
                                        (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                        (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                      );
                                    })
                                    .map((opt) => (
                                      <li
                                        key={opt.id}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          dropdownClickedRef.current = true;
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDetailEntries(
                                            detailEntries.map((row, i) =>
                                              i === index
                                                ? {
                                                  ...row,
                                                  itemCode: opt.code,
                                                  itemName: opt.name,
                                                  unit: opt.unit,
                                                  itemId: opt.id,
                                                  gstPercent: opt.hsnGstPercentage,
                                                }
                                                : row
                                            )
                                          );
                                          setActiveDrugCodeDropdown(null);
                                          dropdownClickedRef.current = false;
                                        }}
                                      >
                                        {opt.code} - {opt.name}
                                      </li>
                                    ))}
                                  {drugCodeOptions.filter((opt) => {
                                    const search = entry.itemCode?.toLowerCase() || "";
                                    return (
                                      (opt.code && opt.code.toLowerCase().includes(search)) ||
                                      (opt.name && opt.name.toLowerCase().includes(search)) ||
                                      (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                      (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                    );
                                  }).length === 0 &&
                                    entry.itemCode && (
                                      <li className="list-group-item text-muted">No matches found</li>
                                    )}
                                </ul>
                              )}
                          </td>

                          <td style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemName}
                              onChange={(e) => {
                                updateEntry(entry.id, "drugName", e.target.value);
                                if (e.target.value.length > 0) {
                                  setActiveDrugNameDropdown(index);
                                } else {
                                  setActiveDrugNameDropdown(null);
                                }
                              }}
                              style={{ width: "190px" }}
                              autoComplete="off"
                              onFocus={() => setActiveDrugNameDropdown(index)}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (!dropdownClickedRef.current) setActiveDrugNameDropdown(null);
                                  dropdownClickedRef.current = false;
                                }, 150);
                              }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            {(activeDrugNameDropdown === index &&
                              (selectedRecord?.status === "s" || selectedRecord?.status === "r")) &&
                              ReactDOM.createPortal(
                                <ul
                                  className="list-group position-fixed"
                                  style={{
                                    zIndex: 9999,
                                    maxHeight: 180,
                                    overflowY: "auto",
                                    width: "250px",
                                    top: `${document.querySelector(`input[value="${entry.itemName}"]`)?.getBoundingClientRect().bottom + window.scrollY}px`,
                                    left: `${document.querySelector(`input[value="${entry.itemName}"]`)?.getBoundingClientRect().left + window.scrollX}px`,
                                    backgroundColor: "white",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "0.375rem",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)"
                                  }}
                                >
                                  {drugCodeOptions
                                    .filter((opt) => {
                                      const search = entry.itemName?.toLowerCase() || "";
                                      return (
                                        (opt.name && opt.name.toLowerCase().includes(search)) ||
                                        (opt.code && opt.code.toLowerCase().includes(search)) ||
                                        (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                        (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                      );
                                    })
                                    .map((opt) => (
                                      <li
                                        key={opt.id}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          dropdownClickedRef.current = true;
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDetailEntries(
                                            detailEntries.map((row, i) =>
                                              i === index
                                                ? {
                                                  ...row,
                                                  drugCode: opt.code,
                                                  drugName: opt.name,
                                                  unit: opt.unit,
                                                  itemId: opt.id,
                                                  itemUnit: opt.unit,
                                                  gstPercent: opt.hsnGstPercentage,
                                                }
                                                : row
                                            )
                                          );
                                          setActiveDrugCodeDropdown(null);
                                          dropdownClickedRef.current = false;
                                        }}
                                      >
                                        {opt.name}
                                      </li>
                                    ))}
                                  {drugCodeOptions.filter((opt) => {
                                    const search = entry.itemName?.toLowerCase() || "";
                                    return (
                                      (opt.name && opt.name.toLowerCase().includes(search)) ||
                                      (opt.code && opt.code.toLowerCase().includes(search)) ||
                                      (opt.unit && opt.unit.toLowerCase().includes(search)) ||
                                      (opt.hsnCode && opt.hsnCode.toLowerCase().includes(search))
                                    );
                                  }).length === 0 &&
                                    entry.itemName && (
                                      <li className="list-group-item text-muted">No matches found</li>
                                    )}
                                </ul>,
                                document.body
                              )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.unit || entry.itemUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "unit", e.target.value)}
                              style={{ width: "70px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              onChange={(e) => updateEntry(entry.id, "batchNo", e.target.value)}
                              style={{ width: "140px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={entry.dom || entry.manufactureDate}
                              max={entry.doe ? new Date(new Date(entry.doe).getTime() - 86400000).toISOString().split("T")[0] : undefined}
                              onChange={(e) => updateEntry(entry.id, "dom", e.target.value)}
                              style={{ minWidth: "120px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={entry.doe || entry.expiryDate}
                              min={entry.dom ? new Date(new Date(entry.dom).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                              onChange={(e) => updateEntry(entry.id, "doe", e.target.value)}
                              style={{ minWidth: "120px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.qty}
                              onChange={(e) => updateEntry(entry.id, "qty", e.target.value)}
                              style={{ width: "70px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.unitsPerPack || ""}
                              onChange={(e) => updateEntry(entry.id, "unitsPerPack", e.target.value)}
                              style={{ width: "90px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.purchaseRatePerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "purchaseRatePerUnit", e.target.value)}
                              style={{ width: "110px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.gstPercent || ""}
                              onChange={(e) => updateEntry(entry.id, "gstPercent", e.target.value)}
                              style={{ width: "90px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.mrpPerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "mrpPerUnit", e.target.value)}
                              style={{ width: "90px" }}
                              readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.totalCost || entry.totalMrpValue || ""}
                              readOnly
                              style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select"
                              value={entry.brandId || ""}
                              onChange={(e) => updateEntry(entry.id, "brandId", e.target.value)}
                              style={{ minWidth: "130px" }}
                              disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            >
                              <option value="">Select Brand</option>
                              {brandOptions.map((option) => (
                                <option key={option.brandId} value={option.brandId}>
                                  {option.brandName}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <select
                              className="form-select"
                              value={entry.manufacturerId || ""}
                              onChange={(e) => updateEntry(entry.id, "manufacturerId", e.target.value)}
                              style={{ minWidth: "170px" }}
                              disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            >
                              <option value="">Select</option>
                              {manufacturerOptions.map((option) => (
                                <option key={option.manufacturerId} value={option.manufacturerId}>
                                  {option.manufacturerName}
                                </option>
                              ))}
                            </select>
                          </td>

                          {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                            <>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ backgroundColor: "#e67e22", color: "white" }}
                                  onClick={addNewEntry}
                                >
                                  +
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteEntry(entry.id)}
                                  disabled={detailEntries.length === 1}
                                >
                                  -
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn me-2"
                      style={{ backgroundColor: "#e67e22", color: "white" }}
                      onClick={() => handleUpdate("s")}
                    >
                      Update
                    </button>

                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={() => handleUpdate("p")}
                    >
                      Submit
                    </button>

                    <button type="button" className="btn btn-danger" onClick={handleReset}>
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen/>}
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />
      
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval List</h4>
            </div>

            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end"></div>
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-success" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Balance No.</th>
                      <th>Opening Balance Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.balanceNo}</td>
                        <td>{new Date(item.enteredDt).toLocaleDateString("en-GB")}</td>
                        <td>{item.departmentName}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                item.status === "p"
                                  ? "#ffc107"
                                  : item.status === "a"
                                    ? "#28a745"
                                    : item.status === "r"
                                      ? "#dc3545"
                                      : "#6c757d",
                              color: item.status === "p" ? "#000" : "#fff",
                            }}
                          >
                            {item.status === "s"
                              ? "Saved"
                              : item.status === "p"
                                ? "Waiting for Approval"
                                : item.status === "a"
                                  ? "Approved"
                                  : item.status === "r"
                                    ? "Rejected"
                                    : item.status}
                          </span>
                        </td>

                        <td>{item.enteredBy}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={(e) => handleEditClick(item, e)}
                            title={item.status === "s" || item.status === "r" ? "Edit Entry" : "View Entry"}
                          >
                            <i
                              className={
                                item.status === "s" || item.status === "r"
                                  ? "fa fa-pencil"
                                  : "fa fa-eye"
                              }
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredApprovalData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval