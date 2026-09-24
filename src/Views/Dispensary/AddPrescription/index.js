import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest } from "../../../service/apiService";
import {
  GET_ALL_ITEMS_BY_NAME,
  REQUEST_PARAM_KEYWORD,
  REQUEST_PARAM_PAGE,
  REQUEST_PARAM_SECTION_CODE,
  REQUEST_PARAM_SIZE,
  SECTION_CODE_FOR_DRUGS,
  GET_ITEM_DETAILS_BY_ID,
  REQUEST_PARAM_HOSPITAL_ID,
  DISPENSARY_DEPARTMENT_ID,
  MAS_FREQUENCY
} from "../../../config/apiConfig";
import { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const GET_ITEM_BATCHES = "/inventory/item/batches";

// PortalDropdown Component - Renders dropdown above table using portal
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "250px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
};

const AddPrescription = () => {
  // ----- State for Medicine Dropdown Search -----
  const [itemDropdown, setItemDropdown] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);

  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const itemInputRefs = useRef({});
  const batchInputRefs = useRef({});
  const [activeBatchDropdown, setActiveBatchDropdown] = useState(null);
  const [batchOptions, setBatchOptions] = useState({});

  // ----- State – only patient fields: patientName, mobileNo -----
  const [formData, setFormData] = useState({
    patientName: "",
    mobileNo: "",
  });

  // ----- Frequencies state (same API as TreatmentModal) -----
  const [allFrequencies, setAllFrequencies] = useState([]);

  // ----- State for Medicine Grid -----
  const [detailEntries, setDetailEntries] = useState([
    {
      id: Date.now(),
      sNo: 1,
      itemId: null,
      medicineName: "",
      dosage: "",
      unit: "",
      frequency: "",
      frequencyId: null,
      days: "",
      prescribedQty: "",
      batchNo: "",
      expiryDate: "",
      issueQty: "",
      batchStock: "",
      totalStock: "",
      stockId: null,
      instruction: "",
    },
  ]);

  // ----- UI States -----
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  // ── Fetch frequencies on mount ────────────────────────────────────
  useEffect(() => {
    const fetchFrequencies = async () => {
      try {
        const response = await getRequest(`${MAS_FREQUENCY}/getAll/1`);
        if (response && response.response) {
          setAllFrequencies(response.response);
        } else {
          console.warn("No frequencies found in response");
          setAllFrequencies([]);
        }
      } catch (error) {
        console.error("Error fetching frequencies:", error);
        setAllFrequencies([]);
      }
    };
    fetchFrequencies();
  }, []);

  // ── close dropdown when clicking outside any tracked input ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideInput = Object.values(itemInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!clickedInsideInput) {
        setShowItemDropdown(false);
        setActiveRowIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleBatchClickOutside = (e) => {
      const clickedInsideBatchInput = Object.values(batchInputRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!clickedInsideBatchInput) {
        setActiveBatchDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleBatchClickOutside);
    return () => document.removeEventListener("mousedown", handleBatchClickOutside);
  }, []);

  // ----- Fetch Medicine Items with Search -----
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      const params = new URLSearchParams();

      params.append([REQUEST_PARAM_SECTION_CODE], SECTION_CODE_FOR_DRUGS);
      params.append([REQUEST_PARAM_KEYWORD], searchText);
      params.append([REQUEST_PARAM_PAGE], page);
      params.append([REQUEST_PARAM_SIZE], DEFAULT_ITEMS_PER_PAGE);

      const url = `${GET_ALL_ITEMS_BY_NAME}?${params.toString()}`;
      const data = await getRequest(url);

      if (data.status === 200 && data.response?.content) {
        return {
          list: data.response.content,
          last: data.response.last,
          totalPages: data.response.totalPages,
          totalElements: data.response.totalElements
        };
      }
      return { list: [], last: true, totalPages: 0, totalElements: 0 };
    } catch (error) {
      console.error("Error fetching items:", error);
      return { list: [], last: true, totalPages: 0, totalElements: 0 };
    } finally {
      setIsItemLoading(false);
    }
  };

  const fetchItemDetails = async (itemId) => {
    try {
      const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
      const url = `${GET_ITEM_DETAILS_BY_ID}/${itemId}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}`;
      const response = await getRequest(url);

      if (response.status === 200 && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      return null;
    }
  };

  const fetchBatchesForItem = async (itemId) => {
    try {
      const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
      const url = `${GET_ITEM_BATCHES}/${itemId}?hospitalId=${hospitalId}&departmentId=${DISPENSARY_DEPARTMENT_ID}&minimumClosingStock=0`;
      const response = await getRequest(url);

      if (response?.status === 200 && Array.isArray(response.response)) {
        const mapped = response.response.map((batch) => ({
          stockId: batch.stockId || null,
          batchNo: batch.batchName || "",
          dom: batch.dom || "",
          doe: batch.doe || "",
          batchStock: Number(batch.batchStock) || 0,
          totalAvailableStock: Number(batch.availableStock) || 0,
        }));

        setBatchOptions((prev) => ({
          ...prev,
          [itemId]: mapped,
        }));
        return mapped;
      }

      setBatchOptions((prev) => ({
        ...prev,
        [itemId]: [],
      }));
      return [];
    } catch (error) {
      console.error("Error fetching batches for item:", error);
      return [];
    }
  };

  const toDateInputValue = (dateStr) => {
    if (!dateStr) return "";
    return String(dateStr).split("T")[0];
  };

  // ----- Handle Medicine Name Search with Debounce -----
  const handleItemSearch = (value, index) => {
    setItemSearch(value);
    setActiveRowIndex(index);

    const newEntries = detailEntries.map((entry, i) =>
      i === index ? {
        ...entry,
        medicineName: value,
        itemId: null,
        unit: "",
        batchNo: "",
        expiryDate: "",
        batchStock: "",
        totalStock: "",
        stockId: null,
      } : entry
    );
    setDetailEntries(newEntries);

    if (!value.trim()) {
      const clearedEntries = newEntries.map((entry, i) =>
        i === index ? {
          ...entry,
          medicineName: "",
          itemId: null,
          dosage: "",
          unit: "",
          frequency: "",
          frequencyId: null,
          batchNo: "",
          expiryDate: "",
          batchStock: "",
          totalStock: "",
          stockId: null,
        } : entry
      );
      setDetailEntries(clearedEntries);
      setActiveBatchDropdown(null);
    }

    if (debounceItemRef.current) clearTimeout(debounceItemRef.current);
    debounceItemRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setItemDropdown([]);
        setShowItemDropdown(false);
        return;
      }
      const result = await fetchItems(0, value);
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    }, 700);
  };

  // ----- Load First Page of Items -----
  const loadFirstItemPage = (searchText) => {
    if (!searchText.trim()) return;
    setItemSearch(searchText);
    fetchItems(0, searchText).then(result => {
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    });
  };

  // ----- Load More Items for Pagination -----
  const loadMoreItems = async (e) => {
    if (itemLastPage || isItemLoading) return;
    if (e) e.preventDefault();
    const nextPage = itemPage + 1;
    const result = await fetchItems(nextPage, itemSearch);
    setItemDropdown(prev => [...prev, ...result.list]);
    setItemLastPage(result.last);
    setItemPage(nextPage);
  };

  // ----- Handle Medicine Selection -----
  const handleItemSelect = async (index, item) => {
    const isDuplicate = detailEntries.some((entry, i) =>
      i !== index && entry.medicineName === item.nomenclature
    );

    if (isDuplicate) {
      return;
    }

    const itemDetails = await fetchItemDetails(item.itemId);

    const newEntries = [...detailEntries];
    newEntries[index] = {
      ...newEntries[index],
      itemId: item.itemId || null,
      medicineName: item.nomenclature || "",
      unit: itemDetails ? (itemDetails.unitAuName || itemDetails.dispUnitName || "") : "",
      batchNo: "",
      expiryDate: "",
      batchStock: "",
      totalStock: "",
      stockId: null,
    };
    setDetailEntries(newEntries);
    setItemSearch("");
    setShowItemDropdown(false);
    setActiveRowIndex(null);
    setActiveBatchDropdown(null);
    if (item.itemId) {
      await fetchBatchesForItem(item.itemId);
    }
  };

  // ----- Helper Functions -----
  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  const updateDetailEntry = (id, field, value) => {
    const updatedEntries = detailEntries.map((entry) => {
      if (entry.id === id) return { ...entry, [field]: value };
      return entry;
    });
    setDetailEntries(updatedEntries);
  };

  const handleBatchChange = (index, value) => {
    const updatedEntries = [...detailEntries];
    const currentEntry = updatedEntries[index];
    const matchingBatch = batchOptions[currentEntry.itemId]?.find(
      (batch) => batch.batchNo === value
    );

    updatedEntries[index] = {
      ...currentEntry,
      batchNo: value,
      expiryDate: matchingBatch ? matchingBatch.doe : "",
      batchStock: matchingBatch ? matchingBatch.batchStock : "",
      totalStock: matchingBatch ? matchingBatch.totalAvailableStock : "",
      stockId: matchingBatch ? matchingBatch.stockId : null,
    };

    setDetailEntries(updatedEntries);
  };

  const handleBatchFocus = async (index) => {
    const entry = detailEntries[index];
    if (!entry?.itemId) return;

    if (!batchOptions[entry.itemId]) {
      await fetchBatchesForItem(entry.itemId);
    }

    setActiveBatchDropdown(index);
  };

  const addMedicineRow = () => {
    const newEntry = {
      id: Date.now(),
      sNo: detailEntries.length + 1,
      itemId: null,
      medicineName: "",
      dosage: "",
      unit: "",
      frequency: "",
      frequencyId: null,
      days: "",
      prescribedQty: "",
      batchNo: "",
      expiryDate: "",
      issueQty: "",
      batchStock: "",
      totalStock: "",
      stockId: null,
      instruction: "",
    };
    setDetailEntries([...detailEntries, newEntry]);
  };

  const deleteMedicineRow = (id) => {
    if (detailEntries.length <= 1) {
      showPopup("At least one medicine row is required.", "warning");
      return;
    }
    setDetailEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ----- Submit -----
  const handleSubmit = () => {
    if (!formData.patientName?.trim()) {
      showPopup("Please enter patient name.", "warning");
      return;
    }
    if (!formData.mobileNo?.trim()) {
      showPopup("Please enter mobile number.", "warning");
      return;
    }
    if (detailEntries.some((e) => !e.medicineName.trim())) {
      showPopup("Please enter medicine names for all rows.", "warning");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      console.log("Submitting:", { ...formData, medicines: detailEntries });
      showPopup("Prescription saved successfully!", "success", resetForm);
    } catch (error) {
      showPopup("Failed to save.", "error");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: "",
      mobileNo: "",
    });
    setDetailEntries([
      {
        id: Date.now(),
        sNo: 1,
        itemId: null,
        medicineName: "",
        dosage: "",
        unit: "",
        frequency: "",
        frequencyId: null,
        days: "",
        prescribedQty: "",
        batchNo: "",
        expiryDate: "",
        issueQty: "",
        batchStock: "",
        totalStock: "",
        stockId: null,
        instruction: "",
      },
    ]);
  };

  // ----- Render -----
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Add New Prescription</h4>
            </div>
            <div className="card-body">
              {/* ----- Patient Details (only two fields) ----- */}
              <div className="card shadow mb-4">
                <div className="card-header py-3 bg-light">
                  <h6 className="mb-0 fw-bold">Patient Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="form-group col-md-4">
                      <label>Patient Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Full name"
                        value={formData.patientName}
                        onChange={(e) => handleFormChange("patientName", e.target.value)}
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Mobile No. <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mobile number"
                        value={formData.mobileNo}
                        onChange={(e) => handleFormChange("mobileNo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ----- Medicine Grid ----- */}
              <h6 className="fw-bold mt-4">Medicine Details</h6>
              <div className="d-flex justify-content-end mb-2">
                <button type="button" className="btn btn-success" onClick={addMedicineRow}>
                  Add Medicine +
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                    <tr>
                      <th className="text-center" style={{ width: "60px" }}>S.No</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Unit</th>
                      <th>Frequency</th>
                      <th>Days</th>
                      <th>Prescribed Qty</th>
                      <th style={{ width: "150px", minWidth: "150px" }}>Batch No.</th>
                      <th>Expiry Date</th>
                      <th>Issue Qty</th>
                      <th>Batch Stock</th>
                      <th>Total Stock</th>
                      <th>Instruction</th>
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <div className="dropdown-search-container">
                            <input
                              ref={(el) => { itemInputRefs.current[index] = el; }}
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.medicineName}
                              autoComplete="off"
                              onChange={(e) => handleItemSearch(e.target.value, index)}
                              onClick={() => {
                                if (entry.medicineName?.trim()) {
                                  loadFirstItemPage(entry.medicineName);
                                }
                              }}
                              placeholder="Type medicine name..."
                              style={{ minWidth: "360px" }}
                            />

                            <PortalDropdown
                              anchorRef={{ current: itemInputRefs.current[index] }}
                              show={showItemDropdown && activeRowIndex === index}
                            >
                              {isItemLoading && itemDropdown.length === 0 ? (
                                <div className="text-center p-3">
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              ) : itemDropdown.length > 0 ? (
                                <>
                                  {itemDropdown.map((item) => {
                                    const isSelectedInOtherRow = detailEntries.some(
                                      (e, i) => i !== index && e.medicineName === item.nomenclature
                                    );
                                    return (
                                      <div
                                        key={item.itemId}
                                        className="p-2"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          if (!isSelectedInOtherRow) {
                                            handleItemSelect(index, item);
                                          }
                                        }}
                                        style={{
                                          cursor: isSelectedInOtherRow ? 'not-allowed' : 'pointer',
                                          backgroundColor: isSelectedInOtherRow ? '#fff3cd' : 'transparent',
                                          borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isSelectedInOtherRow) e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isSelectedInOtherRow ? '#fff3cd' : 'transparent';
                                        }}
                                      >
                                        <div className="fw-bold">{item.nomenclature}</div>
                                        <div className="d-flex justify-content-between align-items-center">
                                          <small className="text-muted">PVMS: {item.pvmsNo}</small>
                                          {isSelectedInOtherRow && (
                                            <span className="badge bg-warning text-dark">Already Added</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {!itemLastPage && (
                                    <div
                                      className="text-center p-2 text-primary small"
                                      onMouseEnter={(e) => loadMoreItems(e)}
                                    >
                                      {isItemLoading ? 'Loading...' : 'Scroll to load more...'}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="p-2 text-muted text-center">No items found</div>
                              )}
                            </PortalDropdown>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.dosage}
                            onChange={(e) => updateDetailEntry(entry.id, "dosage", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.unit}
                            onChange={(e) => updateDetailEntry(entry.id, "unit", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          {/* Frequency Dropdown – Corrected version */}
                          <select
                            className="form-control"
                            value={entry.frequencyId || ""}
                            onChange={(e) => {
                              const freqId = parseInt(e.target.value);
                              const freq = allFrequencies.find(f => f.frequencyId === freqId);
                              const freqName = freq ? freq.frequencyName : "";
                              
                              // Update both frequencyId and frequency in one state update
                              setDetailEntries(prev =>
                                prev.map(item =>
                                  item.id === entry.id
                                    ? { ...item, frequencyId: freqId, frequency: freqName }
                                    : item
                                )
                              );
                            }}
                            style={{ width: "100px" }}
                          >
                            <option value="">Select</option>
                            {allFrequencies.map(freq => (
                              <option key={freq.frequencyId} value={freq.frequencyId}>
                                {freq.frequencyName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.days}
                            onChange={(e) => updateDetailEntry(entry.id, "days", e.target.value)}
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.prescribedQty}
                            onChange={(e) => updateDetailEntry(entry.id, "prescribedQty", e.target.value)}
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <div style={{ position: "relative", overflow: "visible" }}>
                            <input
                              ref={(el) => { batchInputRefs.current[index] = el; }}
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleBatchChange(index, value);
                                if (value.trim()) {
                                  setActiveBatchDropdown(index);
                                }
                              }}
                              onFocus={() => handleBatchFocus(index)}
                              onClick={() => handleBatchFocus(index)}
                              placeholder="Batch"
                              autoComplete="off"
                              style={{ width: "150px", minWidth: "150px" }}
                            />
                            <PortalDropdown
                              anchorRef={{ current: batchInputRefs.current[index] }}
                              show={activeBatchDropdown === index && !!entry.itemId}
                            >
                              {batchOptions[entry.itemId]?.filter((batch) =>
                                batch.batchNo.toLowerCase().includes((entry.batchNo || "").toLowerCase())
                              ).length > 0 ? (
                                batchOptions[entry.itemId]
                                  ?.filter((batch) =>
                                    batch.batchNo.toLowerCase().includes((entry.batchNo || "").toLowerCase())
                                  )
                                  .map((batch, batchIndex) => (
                                    <div
                                      key={`${batch.batchNo}-${batchIndex}`}
                                      className="p-2"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleBatchChange(index, batch.batchNo);
                                        setActiveBatchDropdown(null);
                                      }}
                                      style={{
                                        cursor: "pointer",
                                        borderBottom: "1px solid #f0f0f0",
                                      }}
                                    >
                                      <div className="fw-bold">{batch.batchNo}</div>
                                      <small className="text-muted">
                                        DOM: {toDateInputValue(batch.dom)} | DOE: {toDateInputValue(batch.doe)}
                                        <br />
                                        Stock: {batch.batchStock} | Total: {batch.totalAvailableStock}
                                      </small>
                                    </div>
                                  ))
                              ) : (
                                <div className="p-2 text-muted text-center">No stock available</div>
                              )}
                            </PortalDropdown>
                          </div>
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control"
                            value={entry.expiryDate?.split("T")[0] || ""}
                            onChange={(e) => updateDetailEntry(entry.id, "expiryDate", e.target.value)}
                            style={{ minWidth: "130px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.issueQty}
                            onChange={(e) => updateDetailEntry(entry.id, "issueQty", e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={entry.batchStock}
                            onChange={(e) => updateDetailEntry(entry.id, "batchStock", e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.totalStock}
                            onChange={(e) => updateDetailEntry(entry.id, "totalStock", e.target.value)}
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={entry.instruction}
                            onChange={(e) => updateDetailEntry(entry.id, "instruction", e.target.value)}
                            style={{ minWidth: "240px" }}
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteMedicineRow(entry.id)}
                            disabled={detailEntries.length === 1}
                          >
                            <i className="icofont-close"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {detailEntries.length === 0 && (
                      <tr><td colSpan="14" className="text-center py-4 text-muted">No medicines added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="button" className="btn btn-success me-2" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Prescription"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPrescription;