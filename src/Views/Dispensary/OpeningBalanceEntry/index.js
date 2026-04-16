import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from 'react-router-dom';
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import { ALL_REPORTS, SECTION_ID_FOR_DRUGS, GET_DEPARTMENT_BY_ID, GET_CURRENT_USER_PROFILE_BY_NAME, GET_ALL_BRANDS_FOR_DROPDOWN, GET_ALL_MANUFACTURER_FOR_DROPDOWN, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE, REQUEST_PARAM_SECTION_ID, REQUEST_PARAM_KEYWORD, GET_ALL_ITEMS_BY_NAME, REQUEST_PARAM_HOSPITAL_ID, GET_ITEM_DETAILS_BY_ID, SAVE_OPENING_BALANCE_ENTRY, SUBMIT_OPENING_BALANCE_ENTRY, OPENING_BALANCE_REPORT_URL, REQUEST_PARAM_BALANCE_M_ID } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import {WARNING_DUPLICATE_BATCH_ENTRY,WARNING_CORRECT_ERRORS,CONFIRM_SAVE_OPENING_BALANCE,SUCCESS_OPENING_BALANCE_SAVED_PRINT,
  CONFIRM_SUBMIT_OPENING_BALANCE,SUCCESS_OPENING_BALANCE_SUBMITTED_PRINT,ERROR_SUBMIT_DATA_FAILED,
  ERROR_SAVE_DATA_FAILED,
  OPENING_BALANCE_ENTRY_TITLE,
  OPENING_BALANCE_ENTRY_FILE_NAME,
  OPENING_BALANCE_ENTRY_SUBMIT_REPORT_TITLE,
  OPENING_BALANCE_ENTRY_SUBMIT_REPORT_FILE_NAME,
}  from "../../../config/constants"
import { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

// PortalDropdown Component - Fixed positioning like in IndentCreation
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,           // 4 px gap below the input
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "250px",
        overflowY: "auto",
        background: "#fff",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
  return createPortal(
    <div style={style}>{children}</div>,
    document.body
  );
};

const OpeningBalanceEntry = () => {

  const [loading, setLoading] = useState(true);
  const deptId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const crUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const [brandOptions, setBrandOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [currentDept, setCurrentDept] = useState(null);
  const [currentLogUser, setCurrentLogUser] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const [balanceType, setBalanceType] = useState("");

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

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-GB");
  };
  const [formData, setFormData] = useState({
    balanceEntryDate: getCurrentDate(),
    enteredBy: "",
    department: "",
  });

  // ── close dropdown when clicking outside any tracked input ──────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside any of the row inputs
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

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_DEPARTMENT_BY_ID}/${deptId}`);
      if (response && response.response) {
        setFormData((prev) => ({
          ...prev,
          department: deptId,
        }));
        setCurrentDept(response?.response?.departmentName);
      }
    } catch (err) {
      console.error("Error fetching department:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);

      const response = await getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${crUser}`);

      if (response && response.response) {
        const { firstName = "", middleName = "", lastName = "" } = response.response;
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        setFormData((prev) => ({
          ...prev,
          enteredBy: fullName,
        }));
        setCurrentLogUser(fullName);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_ALL_BRANDS_FOR_DROPDOWN}`);
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
      const response = await getRequest(`${GET_ALL_MANUFACTURER_FOR_DROPDOWN}`);
      if (response && response.response) {
        setManufacturerOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching manufacturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      const params = new URLSearchParams();

      if (balanceType === "drug") {
        params.append([REQUEST_PARAM_SECTION_ID], SECTION_ID_FOR_DRUGS);
      }

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

  const handleItemSearch = (value, index) => {
    if (!balanceType) {
      showPopup("Please select Balance Type first", "warning");
      return;
    }

    setItemSearch(value);
    setActiveRowIndex(index);
    
    const newEntries = [...drugEntries];
    newEntries[index] = {
      ...newEntries[index],
      drugName: value
    };
    setDrugEntries(newEntries);
    
    if (!value.trim() || (newEntries[index].drugId && !value.includes(newEntries[index].drugName))) {
      newEntries[index] = {
        ...newEntries[index],
        drugId: null,
        drugCode: "",
        unit: "",
        drugData: null
      };
      setDrugEntries(newEntries);
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

  const loadFirstItemPage = (searchText) => {
    if (!searchText.trim() || !balanceType) return;
    setItemSearch(searchText);
    fetchItems(0, searchText).then(result => {
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    });
  };

  const loadMoreItems = async () => {
    if (itemLastPage) return;
    const nextPage = itemPage + 1;
    const result = await fetchItems(nextPage, itemSearch);
    setItemDropdown(prev => [...prev, ...result.list]);
    setItemLastPage(result.last);
    setItemPage(nextPage);
  };

  const handleItemSelect = async (index, item) => {
    const isDuplicate = drugEntries.some((entry, i) => 
      i !== index && entry.drugId === item.itemId
    );

    if (isDuplicate) {
      showPopup("This item is already added in another row", "warning");
      return;
    }

    const itemDetails = await fetchItemDetails(item.itemId);
    
    if (itemDetails) {
      const newEntries = [...drugEntries];
      
      newEntries[index] = {
        ...newEntries[index],
        drugId: itemDetails.itemId,
        drugCode: itemDetails.pvmsNo || "",
        drugName: itemDetails.nomenclature || "",
        unit: itemDetails.unitAuName || itemDetails.dispUnitName || "",
        gstPercent: itemDetails.hsnGstPercent || 0,
        drugData: {
          itemId: itemDetails.itemId,
          nomenclature: itemDetails.nomenclature,
          pvmsNo: itemDetails.pvmsNo,
          unitAuName: itemDetails.unitAuName,
          dispUnitName: itemDetails.dispUnitName,
          gstPercent: itemDetails.gstPercent,
          sectionName: itemDetails.sectionName,
          itemTypeName: itemDetails.itemTypeName,
          groupName: itemDetails.groupName,
          itemClassName: itemDetails.itemClassName
        }
      };

      setDrugEntries(newEntries);
      setItemSearch("");
      setShowItemDropdown(false);
      setActiveRowIndex(null);
    }
  };

  useEffect(() => {
    fetchDepartment();
    fetchCurrentUser();
    fetchBrand();
    fetchManufacturer();
  }, []);

  const [drugEntries, setDrugEntries] = useState([
    {
      id: 1,
      drugCode: "",
      drugName: "",
      drugId: "",
      unit: "",
      batchNoSerialNo: "",
      dom: "",
      doe: "",
      qty: "",
      unitsPerPack: "",
      purchaseRatePerUnit: "",
      gstPercent: "",
      mrpPerUnit: "",
      totalCost: "",
      brandName: "",
      manufacturer: "",
      drugData: null,
    },
  ])

  const handleFormInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const [popupMessage, setPopupMessage] = useState(null)

  const handleDrugEntryChange = (index, field, value) => {
    const updatedEntries = drugEntries.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, [field]: value };

        if (field === "qty" || field === "mrpPerUnit") {
          const qty = parseFloat(field === "qty" ? value : entry.qty) || 0;
          const mrpRate = parseFloat(field === "mrpPerUnit" ? value : entry.mrpPerUnit) || 0;
          updatedEntry.totalCost = (qty * mrpRate).toFixed(2);
        }

        return updatedEntry;
      }
      return entry;
    });

    setDrugEntries(updatedEntries);
  };

  const addNewRow = () => {
    const newEntry = {
      id: Date.now(),
      drugCode: "",
      drugName: "",
      unit: "",
      batchNoSerialNo: "",
      dom: "",
      doe: "",
      qty: "",
      unitsPerPack: "",
      purchaseRatePerUnit: "",
      gstPercent: "",
      mrpPerUnit: "",
      totalCost: "",
      brandName: "",
      manufacturer: "",
      drugId: null,
      drugData: null,
    }
    setDrugEntries([...drugEntries, newEntry])
  }

  const removeRow = (index) => {
    if (drugEntries.length > 1) {
      const filteredEntries = drugEntries.filter((_, i) => i !== index)
      setDrugEntries(filteredEntries)
    }
  }

  const validateFormData = (data) => {
    const errors = {};
    if (!data.balanceEntryDate) errors.balanceEntryDate = "Balance Entry Date is required.";
    if (!data.enteredBy?.trim()) errors.enteredBy = "Entered By is required.";
    if (!data.department?.trim()) errors.department = "Department is required.";
    return errors;
  };

  const validateDrugEntries = (entries) => {
    return entries.map((entry) => {
      const errors = {};
      if (!entry.drugCode) errors.drugCode = "drugCode is required";
      if (!entry.drugName) errors.drugName = "drugName is required";
      if (!entry.unit) errors.unit = "unit is required";
      if (!entry.batchNoSerialNo) errors.batchNoSerialNo = "batchNoSerialNo is required";
      if (!entry.dom) errors.dom = "dom is required";
      if (!entry.doe) errors.doe = "doe is required";
      
      if (entry.dom && entry.doe) {
        const domDate = new Date(entry.dom);
        const doeDate = new Date(entry.doe);
        if (domDate > doeDate) {
          errors.dateValidation = "Date of Manufacturing (DOM) cannot be later than Date of Expiry (DOE)";
        }
      }
      
      if (!entry.qty || isNaN(entry.qty)) errors.qty = "qty is required";
      if (!entry.unitsPerPack || isNaN(entry.unitsPerPack)) errors.unitsPerPack = "unitsPerPack is required";
      if (!entry.purchaseRatePerUnit || isNaN(entry.purchaseRatePerUnit)) errors.purchaseRatePerUnit = "purchaseRatePerUnit is required";
      if (!entry.gstPercent || isNaN(entry.gstPercent)) errors.gstPercent = "gstPercent is required";
      if (!entry.mrpPerUnit || isNaN(entry.mrpPerUnit)) errors.mrpPerUnit = "mrpPerUnit is required";
      if (!entry.totalCost || isNaN(entry.totalCost)) errors.totalCost = "totalCost is required";
      if (!entry.brandName) errors.brandName = "brandName is required";
      if (!entry.manufacturer) errors.manufacturer = "manufacturer is required";
      return errors;
    });
  };

  const convertToISODate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return date.toISOString();
  };

  const hasDuplicateDrugEntries = (entries) => {
    const seen = new Set();
    for (const entry of entries) {
      const key = `${entry.batchNoSerialNo}|${entry.dom}|${entry.doe}`;
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
    return false;
  };

  const handleSaveOrSubmit = async (isSave = true) => {
    const formErrors = validateFormData(formData);
    const drugErrors = validateDrugEntries(drugEntries);

    const hasFormErrors = Object.keys(formErrors).length > 0;
    const hasDrugErrors = drugErrors.some(err => Object.keys(err).length > 0);

    if (hasDuplicateDrugEntries(drugEntries)) {
      showPopup(WARNING_DUPLICATE_BATCH_ENTRY, "warning");
      return null;
    }

    if (hasFormErrors || hasDrugErrors) {
      let firstErrorMsg = "";

      if (hasFormErrors) {
        const firstField = Object.keys(formErrors)[0];
        firstErrorMsg = formErrors[firstField];
      } else {
        for (let i = 0; i < drugErrors.length; i++) {
          const error = drugErrors[i];
          const errorKeys = Object.keys(error);
          if (errorKeys.length > 0) {
            if (error.dateValidation) {
              firstErrorMsg = error.dateValidation;
            } else {
              firstErrorMsg = `${errorKeys[0]} is required`;
            }
            break;
          }
        }
      }

      showPopup(firstErrorMsg || WARNING_CORRECT_ERRORS, "warning");
      return null;
    }

    const payload = {
      enteredDt: convertToISODate(formData.balanceEntryDate),
      enteredBy: formData.enteredBy,
      departmentId: formData.department,
      storeBalanceDtList: drugEntries
        .filter(entry => entry.drugCode || entry.drugName)
        .map(entry => ({
          id: entry.id,
          itemId: Number(entry.drugId),
          unit: entry.unit,
          batchNo: entry.batchNoSerialNo,
          manufactureDate: entry.dom,
          expiryDate: entry.doe,
          qty: Number(entry.qty),
          unitsPerPack: Number(entry.unitsPerPack),
          purchaseRatePerUnit: Number(entry.purchaseRatePerUnit),
          gstPercent: Number(entry.gstPercent),
          mrpPerUnit: Number(entry.mrpPerUnit),
          totalPurchaseCost: Number(entry.totalCost),
          brandId: Number(entry.brandName),
          manufacturerId: Number(entry.manufacturer),
        })),
    };

    try {
      if (isSave) {
        setIsSaving(true);
      } else {
        setIsSubmitting(true);
      }
      
      const endpoint = isSave ? `${SAVE_OPENING_BALANCE_ENTRY}` : `${SUBMIT_OPENING_BALANCE_ENTRY}`;
      const response = await postRequest(endpoint, payload);

      if (response?.status === 200 || response?.success) {
        const action = isSave ? "save" : "submit";
        return { success: true, response, action };
      } else {
        return { success: false, message: response?.message || `Failed to ${isSave ? 'save' : 'submit'} data. Please try again.` };
      }
    } catch (error) {
      console.error(`${isSave ? 'Save' : 'Submit'} Error:`, error);
      return { success: false, message: "Something went wrong. Please try again." };
    } finally {
      if (isSave) {
        setIsSaving(false);
      } else {
        setIsSubmitting(false);
      }
    }
  };

  const handleSave = async () => {
    showConfirmationPopup(
      CONFIRM_SAVE_OPENING_BALANCE,
      "info",
      async () => {
        const result = await handleSaveOrSubmit(true);
        
        if (result?.success) {
          const balanceId = result.response?.response;
          
          showConfirmationPopup(
            SUCCESS_OPENING_BALANCE_SAVED_PRINT,
            "success",
            () => {
              if (balanceId) {
                navigate('/ViewDownloadReport', {
                  state: {
                    reportUrl: `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceId}`,
                    title: OPENING_BALANCE_ENTRY_TITLE,
                    fileName: OPENING_BALANCE_ENTRY_FILE_NAME,
                    returnPath: window.location.pathname
                  }
                });
              }
              handleReset();
            },
            () => {
              handleReset();
            },
            "Yes",
            "No"
          );
        } else {
          showConfirmationPopup(
            result?.message || ERROR_SAVE_DATA_FAILED,
            "error",
            () => {},
            null,
            "OK",
            "Close"
          );
        }
      },
      () => {
        console.log("Save cancelled by user");
      },
      "Save",
      "Cancel"
    );
  };

  const handleSubmit = async () => {
    showConfirmationPopup(
      CONFIRM_SUBMIT_OPENING_BALANCE,
      "info",
      async () => {
        const result = await handleSaveOrSubmit(false);
        
        if (result?.success) {
          const balanceId = result.response?.response;
          
          showConfirmationPopup(
            SUCCESS_OPENING_BALANCE_SUBMITTED_PRINT,
            "success",
            () => {
              navigate('/ViewDownloadReport', {
                state: {
                  reportUrl: `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceId}`,
                  title: OPENING_BALANCE_ENTRY_SUBMIT_REPORT_TITLE,
                  fileName: OPENING_BALANCE_ENTRY_SUBMIT_REPORT_FILE_NAME,
                  returnPath: window.location.pathname
                }
              });
              handleReset();
            },
            () => {
              handleReset();
            },
            "Yes",
            "No"
          );
        } else {
          showConfirmationPopup(
            result?.message || ERROR_SUBMIT_DATA_FAILED,
            "error",
            () => {},
            null,
            "OK",
            "Close"
          );
        }
      },
      () => {
        console.log("Submit cancelled by user");
      },
      "Submit",
      "Cancel"
    );
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

  const handleReset = () => {
    setFormData({
      balanceEntryDate: getCurrentDate(),
      enteredBy: currentLogUser,
      department: deptId,
    })
    setBalanceType("");
    setDrugEntries([
      {
        id: 1,
        drugCode: "",
        drugName: "",
        unit: "",
        batchNoSerialNo: "",
        dom: "",
        doe: "",
        qty: "",
        unitsPerPack: "",
        purchaseRatePerUnit: "",
        gstPercent: "",
        mrpPerUnit: "",
        totalCost: "",
        brandName: "",
        manufacturer: "",
        drugId: null,
        drugData: null,
      },
    ])
    setShowItemDropdown(false);
    setActiveRowIndex(null);
    setItemSearch("");
    setItemDropdown([]);
  }

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
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Entry</h4>
            </div>

            <div className="card-body">
              <div className="mb-4">
                <h5 className="mb-3">Entry Details:</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      name="balanceEntryDate"
                      value={formData.balanceEntryDate}
                      onChange={handleFormInputChange}
                      style={{ backgroundColor: "#f8f9fa" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      name="enteredBy"
                      value={formData.enteredBy}
                      onChange={handleFormInputChange}
                      style={{ backgroundColor: "#f8f9fa" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      name="department"
                      value={currentDept}
                      onChange={handleFormInputChange}
                      style={{ backgroundColor: "#f8f9fa" }}
                      readOnly
                    />
                  </div>
                   <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={balanceType}
                      onChange={(e) => setBalanceType(e.target.value)}
                    >
                      <option value="">Select Balance Type</option>
                      <option value="drug">Drug</option>
                      <option value="nondrug">Non Drug</option>
                    </select>
                  </div>
                </div>
              </div>

              <div
                className="table-wrapper"
                style={{
                  overflowX: "auto",
                  overflowY: "visible",
                  maxWidth: "100%",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <table className="table table-bordered table-hover align-middle" style={{ minWidth: "2200px", position: "relative", zIndex: 1 }}>
                  <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                    <tr>
                      <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                        S.No.
                      </th>
                      <th style={{ width: "120px", minWidth: "120px" }}>Item Code</th>
                      <th style={{ width: "200px", minWidth: "200px" }}>Item Name</th>
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
                      <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                      <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="text-center fw-bold">{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugCode}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "100px" }}
                            placeholder="Auto-filled"
                          />
                        </td>

                        <td>
                          <div className="dropdown-search-container">
                            <input
                              ref={(el) => { itemInputRefs.current[index] = el; }}
                              type="text"
                              className="form-control form-control-sm"
                              value={entry.drugName}
                              autoComplete="off"
                              onChange={(e) => handleItemSearch(e.target.value, index)}
                              onClick={() => {
                                if (entry.drugName?.trim() && balanceType) {
                                  loadFirstItemPage(entry.drugName);
                                } else if (!balanceType) {
                                  showPopup("Please select Balance Type first", "warning");
                                }
                              }}
                              placeholder={balanceType ? "Type item name..." : "Select Balance Type first"}
                              style={{ minWidth: "180px" }}
                              disabled={!balanceType || isSaving || isSubmitting}
                            />

                            {/* PortalDropdown for item search */}
                            <PortalDropdown
                              anchorRef={{ current: itemInputRefs.current[index] }}
                              show={showItemDropdown && activeRowIndex === index && balanceType}
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
                                    const isSelectedInOtherRow = drugEntries.some(
                                      (e, i) => i !== index && e.drugId === item.itemId
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
                                  
                                  {/* Infinite scroll sentinel */}
                                  {!itemLastPage && (
                                    <div
                                      className="text-center p-2 text-primary small"
                                      onMouseEnter={loadMoreItems}
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
                            className="form-control form-control-sm"
                            value={entry.unit}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "70px" }}
                            placeholder="Auto-filled"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.batchNoSerialNo}
                            onChange={(e) => handleDrugEntryChange(index, "batchNoSerialNo", e.target.value)}
                            placeholder="Batch/Serial"
                            style={{ minWidth: "130px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={entry.dom}
                            onChange={(e) => handleDrugEntryChange(index, "dom", e.target.value)}
                            style={{ minWidth: "120px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={entry.doe}
                            onChange={(e) => handleDrugEntryChange(index, "doe", e.target.value)}
                            style={{ minWidth: "120px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.qty}
                            onChange={(e) => handleDrugEntryChange(index, "qty", e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            style={{ minWidth: "70px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.unitsPerPack}
                            onChange={(e) => handleDrugEntryChange(index, "unitsPerPack", e.target.value)}
                            placeholder="0"
                            min="0"
                            step="1"
                            style={{ minWidth: "90px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.purchaseRatePerUnit}
                            onChange={(e) => handleDrugEntryChange(index, "purchaseRatePerUnit", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            style={{ minWidth: "110px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.gstPercent}
                            onChange={(e) => handleDrugEntryChange(index, "gstPercent", e.target.value)}
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                            style={{ minWidth: "90px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={entry.mrpPerUnit}
                            onChange={(e) => handleDrugEntryChange(index, "mrpPerUnit", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            style={{ minWidth: "90px" }}
                            disabled={isSaving || isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.totalCost}
                            readOnly
                            style={{ backgroundColor: "#f8f9fa", minWidth: "90px" }}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={entry.brandName}
                            onChange={(e) => handleDrugEntryChange(index, "brandName", e.target.value)}
                            style={{ minWidth: "130px" }}
                            disabled={isSaving || isSubmitting}
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
                            className="form-select form-select-sm"
                            value={entry.manufacturer}
                            onChange={(e) => handleDrugEntryChange(index, "manufacturer", e.target.value)}
                            style={{ minWidth: "130px" }}
                            disabled={isSaving || isSubmitting}
                          >
                            <option value="">Select</option>
                            {manufacturerOptions.map((option) => (
                              <option key={option.manufacturerId} value={option.manufacturerId}>
                                {option.manufacturerName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={addNewRow}
                            style={{
                              color: "white",
                              border: "none",
                              width: "35px",
                              height: "35px",
                            }}
                            title="Add Row"
                            disabled={isSaving || isSubmitting}
                          >
                            +
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeRow(index)}
                            disabled={drugEntries.length === 1 || isSaving || isSubmitting}
                            title="Delete Row"
                            style={{
                              width: "35px",
                              height: "35px",
                            }}
                          >
                            -
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSave}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleSubmit} 
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleReset}
                  disabled={isSaving || isSubmitting}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceEntry