import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"

const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [approvalData, setApprovalData] = useState([])
  const [brandOptions, setBrandOptions] = useState([])
  const [manufacturerOptions, setManufacturerOptions] = useState([])
  const [drugCodeOptions, setDrugCodeOptions] = useState([])
  const crUser = localStorage.getItem("username") || sessionStorage.getItem("username");
  const [currentLogUser, setCurrentLogUser] = useState(null);

  const getCurrentDateTime = () => new Date().toISOString();

  const [formData, setFormData] = useState({
    balanceEntryDate: getCurrentDateTime(),
    enteredBy: "",
    department: "",
  });







  const fetchOpenBalance = async () => {
    try {
      setLoading(true);
      const status = "p,s,a";
      const response = await getRequest(`${OPEN_BALANCE}/list/${status}`);

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

  useEffect(() => {
    fetchOpenBalance();
    fatchDrugCodeOptions();
    fetchBrand();
    fetchManufacturer();
    fetchCurrentUser();
  }, []);




  const [fromDate, setFromDate] = useState("29/05/2025")
  const [toDate, setToDate] = useState("29/05/2025")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [detailEntries, setDetailEntries] = useState([])
  const statusOrder = { s: 1, p: 2, r: 3, a: 4 };
  const itemsPerPage = 10
  const totalPages = Math.ceil(approvalData.length / itemsPerPage)
  const currentItems = [...approvalData]
    .sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)
    setDetailEntries(record.openingBalanceDtResponseList)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
  }

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const addNewEntry = () => {
    const newEntry = {
      id: detailEntries.length + 1,
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
    }
    setDetailEntries([...detailEntries, newEntry])
  }

  const deleteEntry = (id) => {
    setDetailEntries(detailEntries.filter((entry) => entry.id !== id))
  }
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
        const rate = parseFloat(field === "purchaseRatePerUnit" ? value : entry.purchaseRatePerUnit) || 0;
        if (field === "qty" || field === "purchaseRatePerUnit") {
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

  const handleUpdate = async (status) => {
    const requestPayload = {
      id: selectedRecord.balanceMId,
      departmentId: selectedRecord.departmentId,
      enteredBy: formData.enteredBy,
      enteredDt: new Date(formData.balanceEntryDate).toISOString(),
      status: status,
      storeBalanceDtList: detailEntries.map(entry => ({
        balanceId: entry.balanceTId ?? null,
        itemId: entry.itemId ?? entry.id ?? null,
        batchNo: entry.batchNo ?? "",
        manufactureDate: formatToDate(entry.manufactureDate ?? entry.dom),
        expiryDate: formatToDate(entry.expiryDate ?? entry.doe),
        unitsPerPack: entry.unitsPerPack ? parseInt(entry.unitsPerPack) : null,
        purchaseRatePerUnit: entry.purchaseRatePerUnit ? parseFloat(entry.purchaseRatePerUnit) : null,
        gstPercent: entry.gstPercent ? parseFloat(entry.gstPercent) : null,
        mrpPerUnit: entry.mrpPerUnit ? parseFloat(entry.mrpPerUnit) : null,
        qty: entry.qty ? parseInt(entry.qty) : null,
        totalPurchaseCost: entry.totalPurchaseCost
          ? parseFloat(entry.totalPurchaseCost)
          : entry.totalCost
            ? parseFloat(entry.totalCost)
            : null,
        brandId: entry.brandId ? parseInt(entry.brandId) : null,
        manufacturerId: entry.manufacturerId ? parseInt(entry.manufacturerId) : null,
      })),
    };

    try {
      const response = await putRequest(
        `${OPEN_BALANCE}/updateById/${selectedRecord.balanceMId}`,
        requestPayload
      );
      console.log("Payload to submit:", requestPayload);
      alert(status === "p" ? "Entries submitted successfully!" : "Entries updated successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to update entries!");
    }
  };


  console.log("Detail Entries:", detailEntries)

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

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...")
      pageNumbers.push(totalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }



  const dropdownClickedRef = useRef(false)
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null)
  const [activeDrugNameDropdown, setActiveDrugNameDropdown] = useState(null)

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">View And Edit Opening Balance Entry</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Entry Details Header */}
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
                    <button className="btn btn-success">Download Invoice</button>
                  </div>
                </div>

                {/* Detail Table */}
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
                        <th style={{ width: "60px", minWidth: "60px" }}>Add</th>
                        <th style={{ width: "70px", minWidth: "70px" }}>Delete</th>
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
                            />
                            {activeDrugCodeDropdown === index && (
                              <ul
                                className="list-group position-absolute w-100 mt-1"
                                style={{ zIndex: 1000, maxHeight: 180, overflowY: "auto" }}
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
                                {
                                  // No match case
                                  drugCodeOptions.filter((opt) => {
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
                                  )
                                }
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
                            />
                            {activeDrugNameDropdown === index && (
                              <ul
                                className="list-group position-absolute w-100 mt-1"
                                style={{ zIndex: 1000, maxHeight: 180, overflowY: "auto" }}
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
                                                itemUnit: opt.unit,               // match your input field
                                                gstPercent: opt.hsnGstPercentage,
                                              }
                                              : row
                                          )
                                        );
                                        setActiveDrugCodeDropdown(null);
                                        dropdownClickedRef.current = false;
                                      }}

                                    >
                                      {opt.name} - {opt.code}
                                    </li>
                                  ))}
                                {
                                  // No match case
                                  drugCodeOptions.filter((opt) => {
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
                                  )
                                }
                              </ul>
                            )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.unit || entry.itemUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "unit", e.target.value)}
                              style={{ width: "70px" }}
                            />

                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              onChange={(e) => updateEntry(entry.id, "batchNo", e.target.value)}
                              style={{ width: "140px" }}
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
                            />

                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.qty}
                              onChange={(e) => updateEntry(entry.id, "qty", e.target.value)}
                              style={{ width: "70px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.unitsPerPack || ""}
                              onChange={(e) => updateEntry(entry.id, "unitsPerPack", e.target.value)}
                              style={{ width: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.purchaseRatePerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "purchaseRatePerUnit", e.target.value)}
                              style={{ width: "110px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.gstPercent || ""}
                              onChange={(e) => updateEntry(entry.id, "gstPercent", e.target.value)}
                              style={{ width: "90px" }}
                            />

                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.mrpPerUnit || ""}
                              onChange={(e) => updateEntry(entry.id, "mrpPerUnit", e.target.value)}
                              style={{ width: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.totalCost || entry.totalPurchaseCost || ""}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval List</h4>
            </div>

            <div className="card-body">
              {/* Date Filter Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button type="button" className="btn me-2 btn-success" onClick={handleSearch}>
                    Search
                  </button>
                </div>
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-success" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              {/* Table Section */}
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
                            title="Edit Entry"
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Page {currentPage} of {totalPages} | Total Records: {approvalData.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval
