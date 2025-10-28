import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService"



const OpeningBalanceEntry = () => {

  const [loading, setLoading] = useState(true);
  const deptId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const crUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const [activeSearchField, setActiveSearchField] = useState(null);
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null);
  const [brandOptions, setBrandOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [currentDept, setCurrentDept] = useState(null);
  const [currentLogUser, setCurrentLogUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");



  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-GB");
  };
  const [formData, setFormData] = useState({
    balanceEntryDate: getCurrentDate(),
    enteredBy: "",
    department: "",
  });



  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DEPARTMENT}/getById/${deptId}`);
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

      const response = await getRequest(`/authController/getUsersForProfile/${crUser}`);


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

  useEffect(() => {
    fetchDepartment();
    fetchCurrentUser();
    fetchBrand();
    fetchManufacturer();
    fatchDrugCodeOptions();
  }, []);

  // const drugCodeOptions = [
  //   { id: 12916, code: "PCM001", name: "Paracetamol", unit: 'mg', gstPercent: 5 },
  //   { id: 12917, code: "PCM002", name: "Paracetamol 500mg", unit: 'ml', gstPercent: 7 },
  //   { id: 12918, code: "IBU001", name: "Ibuprofen", unit: 'ml', gstPercent: 28 },
  //   { id: 4, code: "ASP001", name: "Aspirin", unit: 'mg', gstPercent: 0 },
  //   { id: 5, code: "DOL001", name: "Dolo", unit: 'mg', gstPercent: 12 },
  // ];

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

        // DOM and DOE validation
        const dom = field === "dom" ? value : entry.dom;
        const doe = field === "doe" ? value : entry.doe;

        if (dom && doe && new Date(dom) > new Date(doe)) {
          alert("Date of Manufacturing (DOM) cannot be later than Date of Expiry (DOE).");
          return entry;
        }



        // Auto-calculate totalCost
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
      id: Date.now(), // Use timestamp for unique ID
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


  // Add this function to check for duplicates
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

  const handleSave = async () => {
    const formErrors = validateFormData(formData);
    const drugErrors = validateDrugEntries(drugEntries);

    const hasFormErrors = Object.keys(formErrors).length > 0;
    const hasDrugErrors = drugErrors.some(err => Object.keys(err).length > 0);

    // Duplicate check
    if (hasDuplicateDrugEntries(drugEntries)) {
      showPopup("Duplicate entry found for Batch No/Serial No, DOM, and DOE.", "warning");
      return;
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
            firstErrorMsg = `${errorKeys[0]} is required`;
            break;
          }
        }
      }

      showPopup(firstErrorMsg || "Please correct the errors and try again.", "warning");
      return;
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
      setProcessing(true);
      const response = await postRequest(`${OPEN_BALANCE}/create`, payload);

      if (response?.status === 200 || response?.success) {
        showPopup("Opening Balance Save successfully!", "success");
      } else {
        showPopup("Failed to save data. Please try again.", "error");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showPopup("Something went wrong. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const formErrors = validateFormData(formData);
    const drugErrors = validateDrugEntries(drugEntries);

    const hasFormErrors = Object.keys(formErrors).length > 0;
    const hasDrugErrors = drugErrors.some(err => Object.keys(err).length > 0);

    // Duplicate check
    if (hasDuplicateDrugEntries(drugEntries)) {
      showPopup("Duplicate entry found for Batch No/Serial No, DOM, and DOE.", "warning");
      return;
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
            firstErrorMsg = `${errorKeys[0]} is required`;
            break;
          }
        }
      }

      showPopup(firstErrorMsg || "Please correct the errors and try again.", "warning");
      return;
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
      setProcessing(true);
      const response = await postRequest(`${OPEN_BALANCE}/submit`, payload);

      if (response?.status === 200 || response?.success) {
        showPopup("Opening Balance Submit successfully!", "success");
        handleReset();
      } else {
        showPopup("Failed to Submit data. Please try again.", "error");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showPopup("Something went wrong. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
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
      },
    ])
  }

  const dropdownClickedRef = useRef(false);
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Entry</h4>
            </div>

            <div className="card-body">
              {/* Entry Details Section */}
              <div className="mb-4">
                <h5 className=" mb-3">Entry Details:</h5>
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
                </div>
              </div>

              {/* Drug Entry Table - Horizontally Scrollable */}
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
                      <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                      <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className="text-center fw-bold">{index + 1}</td>
                        {/* Drug Code Input with its own dropdown */}
                        <td style={{ position: "relative", overflow: "visible", zIndex: activeDrugCodeDropdown === index ? 999 : 'auto' }}>


                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugCode}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleDrugEntryChange(index, "drugCode", value);
                              if (value.length > 0) {
                                setActiveDrugCodeDropdown(index);
                              } else {
                                setActiveDrugCodeDropdown(null);
                              }
                            }}
                            placeholder="Code"
                            style={{ minWidth: "100px" }}
                            autoComplete="off"
                            onFocus={() => setActiveDrugCodeDropdown(index)}
                            onBlur={() => {
                              setTimeout(() => {
                                if (!dropdownClickedRef.current) {
                                  setActiveDrugCodeDropdown(null);
                                }
                                dropdownClickedRef.current = false;
                              }, 150);
                            }}
                          />

                          {activeDrugCodeDropdown === index && (
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
                                .filter((opt) =>
                                  opt.code.toLowerCase().includes(entry.drugCode.toLowerCase())
                                )
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

                                      const updatedEntries = drugEntries.map((entry, i) => {
                                        if (i === index) {
                                          return {
                                            ...entry,
                                            drugCode: opt.code,
                                            drugName: opt.name,
                                            unit: opt.unit,
                                            drugId: opt.id,
                                            gstPercent: opt.hsnGstPercentage || 0,
                                          };
                                        }
                                        return entry;
                                      });

                                      setDrugEntries(updatedEntries);
                                      setActiveDrugCodeDropdown(null);
                                      dropdownClickedRef.current = false;
                                    }}
                                  >
                                    <strong>{opt.code}</strong> — {opt.name}
                                  </li>
                                ))}
                              {drugCodeOptions.filter((opt) =>
                                opt.code.toLowerCase().includes(entry.drugCode.toLowerCase())
                              ).length === 0 && entry.drugCode !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                            </ul>
                          )}
                        </td>

                        {/* Drug Name Input with its own dropdown */}
                        <td style={{ position: "relative", overflow: "visible", zIndex: activeDrugCodeDropdown === index ? 999 : 'auto' }}>

                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.drugName}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleDrugEntryChange(index, "drugName", value);
                              if (value.length > 0) {
                                setActiveDrugNameDropdown(index);
                              } else {
                                setActiveDrugNameDropdown(null);
                              }
                            }}
                            placeholder="Drug Name"
                            style={{ minWidth: "180px" }}
                            autoComplete="off"
                            onFocus={() => setActiveDrugNameDropdown(index)}
                            onBlur={() => {
                              setTimeout(() => {
                                if (!dropdownClickedRef.current) {
                                  setActiveDrugNameDropdown(null);
                                }
                                dropdownClickedRef.current = false;
                              }, 150);
                            }}
                          />

                          {activeDrugNameDropdown === index && (
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
                                .filter((opt) =>
                                  opt.name.toLowerCase().includes(entry.drugName.toLowerCase())
                                )
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

                                      const updatedEntries = drugEntries.map((entry, i) => {
                                        if (i === index) {
                                          return {
                                            ...entry,
                                            drugCode: opt.code,
                                            drugName: opt.name,
                                            unit: opt.unit,
                                            drugId: opt.id,
                                            gstPercent: opt.hsnGstPercentage || 0,
                                          };
                                        }
                                        return entry;
                                      });

                                      setDrugEntries(updatedEntries);
                                      setActiveDrugNameDropdown(null);
                                      dropdownClickedRef.current = false;
                                    }}
                                  >
                                    <strong>{opt.name}</strong> — {opt.code}
                                  </li>
                                ))}
                              {drugCodeOptions.filter((opt) =>
                                opt.name.toLowerCase().includes(entry.drugName.toLowerCase())
                              ).length === 0 && entry.drugName !== "" && (
                                  <li className="list-group-item text-muted">No matches found</li>
                                )}
                            </ul>
                          )}
                        </td>


                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.unit}
                            onChange={(e) => handleDrugEntryChange(index, "unit", e.target.value)}
                            placeholder="Unit"
                            style={{ minWidth: "70px" }}
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
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={entry.dom}
                            max={entry.doe ? new Date(new Date(entry.doe).getTime() - 86400000).toISOString().split("T")[0] : undefined}
                            onChange={(e) => handleDrugEntryChange(index, "dom", e.target.value)}
                            style={{ minWidth: "120px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={entry.doe}
                            min={entry.dom ? new Date(new Date(entry.dom).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                            onChange={(e) => handleDrugEntryChange(index, "doe", e.target.value)}
                            style={{ minWidth: "120px" }}
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
                          >
                            +
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeRow(index)}
                            disabled={drugEntries.length === 1}
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

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-warning"
                  disabled={processing}
                  onClick={handleSave}
                >
                  Save
                </button>
                <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={processing}>
                  Submit
                </button>
                <button type="button" className="btn btn-danger" onClick={handleReset}>
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