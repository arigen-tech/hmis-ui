import { useState, useEffect, useRef } from "react";
import { ALL_REPORTS, INVENTORY, MASTERS, SECTION_ID_FOR_DRUGS } from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ItemIssueRegister = () => {
  // State variables
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [itemName, setItemName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [reportType, setReportType] = useState("itemwise");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  
  // Item Type state
  const [itemType, setItemType] = useState("");
  const itemTypeOptions = ["Drug", "Non Drug"];

  // Drug search state with debounce - Same as ReceivingReport
  const [itemDropdown, setItemDropdown] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  
  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const dropdownItemRef = useRef(null);

  const hospitalId = sessionStorage.getItem("hospitalId");
  const token = sessionStorage.getItem("token");

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // Get departmentId and departmentName from sessionStorage
      const sessionDeptId = sessionStorage.getItem("departmentId");
      const sessionDeptName = sessionStorage.getItem("departmentName");
      
      // Check if departmentId is 1
      if (sessionDeptId === "1") {
        // Fetch all indent-departments
        const response = await getRequest(`${MASTERS}/indent-department/getAll?status=Y`);
        console.log("Departments API Response:", response);

        if (response && response.response && Array.isArray(response.response)) {
          setDepartments(response.response);
        } else if (response && Array.isArray(response)) {
          setDepartments(response);
        } else {
          console.error("Unexpected departments response structure:", response);
          showPopup("Failed to load departments", "error");
        }
      } else {
        // Directly set the single department from sessionStorage
        if (sessionDeptId && sessionDeptName) {
          const singleDepartment = [{
            deptId: parseInt(sessionDeptId),
            deptName: sessionDeptName
          }];
          setDepartments(singleDepartment);
          // Auto-select this department
          setDepartment(sessionDeptId);
        } else {
          console.error("Department info not found in sessionStorage");
          showPopup("Department information not found", "error");
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      showPopup("Failed to load departments", "error");
    }
  };

  // Fetch items from API with debounce - Same as ReceivingReport
  const fetchItems = async (page, searchText = "") => {
    try {
      setIsItemLoading(true);
      // Determine section ID based on item type
      const params = new URLSearchParams();

      if (itemType === "Drug") {
        params.append("sectionId", SECTION_ID_FOR_DRUGS);
      }

      params.append("keyword", searchText);
      params.append("page", page);
      params.append("size", DEFAULT_ITEMS_PER_PAGE);

      const url = `${INVENTORY}/item/search?${params.toString()}`;
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

  // Fetch item details by ID
  const fetchItemDetails = async (itemId) => {
    try {
      const url = `${INVENTORY}/item/${itemId}?hospitalId=${hospitalId}`;
      const response = await getRequest(url);
      
      if (response.status === 200 && response.response) {
        return response.response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching item details:", error);
      showPopup("Failed to fetch item details", "error");
      return null;
    } 
  };

  // Handle item search with debounce - Same as ReceivingReport
  const handleItemSearch = (value) => {
    // Check if item type is selected
    if (!itemType) {
      showPopup("Please select Item Type first", "warning");
      return;
    }

    setItemSearch(value);
    setItemName(value);
    
    // Clear selections when user types
    if (!value.trim() || (selectedItem && !value.includes(selectedItem.nomenclature))) {
      setSelectedItem(null);
    }

    // Debounce API call
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

  // Load first page of items for dropdown
  const loadFirstItemPage = (searchText) => {
    if (!searchText.trim() || !itemType) return;
    setItemSearch(searchText);
    fetchItems(0, searchText).then(result => {
      setItemDropdown(result.list);
      setItemLastPage(result.last);
      setItemPage(0);
      setShowItemDropdown(true);
    });
  };

  // Load more items for infinite scroll
  const loadMoreItems = async () => {
    if (itemLastPage) return;
    const nextPage = itemPage + 1;
    const result = await fetchItems(nextPage, itemSearch);
    setItemDropdown(prev => [...prev, ...result.list]);
    setItemLastPage(result.last);
    setItemPage(nextPage);
  };

  // Handle item selection from dropdown
  const handleItemSelect = async (item) => {
    // Fetch complete item details
    const itemDetails = await fetchItemDetails(item.itemId);
    
    if (itemDetails) {
      setItemName(itemDetails.nomenclature || "");
      setSelectedItem(itemDetails);
      setItemSearch(""); // Clear the search after selection
      setShowItemDropdown(false); // Hide dropdown
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownItemRef.current && !dropdownItemRef.current.contains(e.target)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  // Check if all mandatory fields are filled based on report type
  const areMandatoryFieldsFilled = () => {
    // Common fields for both report types
    if (!itemType || !department || !fromDate || !toDate || !hospitalId) {
      return false;
    }

    // For item-wise report, check item selection
    if (reportType === "itemwise" && !selectedItem) {
      return false;
    }

    return true;
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
    try {
      // Convert item type to indentType parameter (D for Drug, N for Non Drug)
      const indentType = itemType === "Drug" ? "D" : "N";

      let url = "";
      
      if (reportType === "itemwise") {
        // Item-wise report - include itemId, don't pass indentType
        url = `${ALL_REPORTS}/indentMedicineIssueRegister?hospitalId=${hospitalId}&departmentId=${department}&itemId=${selectedItem.itemId}&fromDate=${fromDate}&toDate=${toDate}&flag=d`;
      } else {
        // Date-wise report - no itemId, pass indentType
        url = `${ALL_REPORTS}/indentMedicineIssueRegister?hospitalId=${hospitalId}&departmentId=${department}&fromDate=${fromDate}&toDate=${toDate}&indentType=${indentType}&flag=d`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Report generation failed", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!validateForm()) {
      return;
    }

    setIsPrinting(true);
    
    try {
      // Convert item type to indentType parameter (D for Drug, N for Non Drug)
      const indentType = itemType === "Drug" ? "D" : "N";

      let url = "";
      
      if (reportType === "itemwise") {
        // Item-wise report - include itemId, don't pass indentType
        url = `${ALL_REPORTS}/indentMedicineIssueRegister?hospitalId=${hospitalId}&departmentId=${department}&itemId=${selectedItem.itemId}&fromDate=${fromDate}&toDate=${toDate}&flag=p`;
      } else {
        // Date-wise report - no itemId, pass indentType
        url = `${ALL_REPORTS}/indentMedicineIssueRegister?hospitalId=${hospitalId}&departmentId=${department}&fromDate=${fromDate}&toDate=${toDate}&indentType=${indentType}&flag=p`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to send to printer");
      }

      // showPopup("Report sent to printer successfully!", "success");
      
    } catch (error) {
      console.error("Error printing report", error);
      showPopup("Report printing failed", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!itemType) {
      showPopup("Please select Item Type", "error");
      return false;
    }

    if (!department) {
      showPopup("Please select Department", "error");
      return false;
    }

    if (reportType === "itemwise" && !selectedItem) {
      showPopup("Please select an Item for item-wise report", "error");
      return false;
    }

    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date", "error");
      return false;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup("From Date cannot be later than To Date", "error");
      return false;
    }

    if (new Date(fromDate) > new Date() || new Date(toDate) > new Date()) {
      showPopup("Dates cannot be in the future", "error");
      return false;
    }

    return true;
  };

  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      showPopup("From date cannot be in the future", "error");
      return;
    }

    setFromDate(selectedDate);

    // Reset To Date if it's now invalid
    if (toDate && selectedDate > toDate) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate > today) {
      showPopup("To date cannot be in the future", "error");
      return;
    }

    if (fromDate && selectedDate < fromDate) {
      showPopup("To date cannot be earlier than From date", "error");
      return;
    }

    setToDate(selectedDate);
  };

  const handleToDateFocus = (e) => {
    if (!fromDate) {
      e.preventDefault();
      e.target.blur();
      showPopup("Please select From Date first", "error");
    }
  };

  const handleReset = () => {
    setDepartment("");
    setItemName("");
    setSelectedItem(null);
    setItemSearch("");
    setItemDropdown([]);
    setShowItemDropdown(false);
    setFromDate("");
    setToDate("");
    setItemType("");
    setReportType("itemwise");
  };

  // Clear item dropdown when item type changes
  useEffect(() => {
    setItemName("");
    setSelectedItem(null);
    setItemSearch("");
    setItemDropdown([]);
    setShowItemDropdown(false);
  }, [itemType]);

  // Reset item selection when switching to date-wise report
  useEffect(() => {
    if (reportType === "datewise") {
      setItemName("");
      setSelectedItem(null);
      setItemSearch("");
      setItemDropdown([]);
      setShowItemDropdown(false);
    }
  }, [reportType]);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
    
    // Cleanup timeout
    return () => {
      if (debounceItemRef.current) {
        clearTimeout(debounceItemRef.current);
      }
    };
  }, []);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Item Issue Register
              </h4>
            </div>
            <div className="card-body">
              {/* Report Type Selection */}
              <div className="row mb-4">
                <div className="col-md-12 mb-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="itemwise"
                      value="itemwise"
                      checked={reportType === "itemwise"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="itemwise">
                      ITEM-WISE ISSUE REPORT
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="datewise"
                      value="datewise"
                      checked={reportType === "datewise"}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="datewise">
                      DATE-WISE ISSUE REPORT
                    </label>
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Department <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.deptId} value={dept.deptId}>
                        {dept.deptName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Item Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    required
                  >
                    <option value="">Select Item Type</option>
                    {itemTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Item Name (Autocomplete) - Only for item-wise */}
                {reportType === "itemwise" && (
                  <div className="col-md-4 position-relative" ref={dropdownItemRef}>
                    <label className="form-label fw-bold">
                      Item Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={itemType ? "Type item name or code..." : "Select Item Type first"}
                        value={itemName}
                        onChange={(e) => handleItemSearch(e.target.value)}
                        onClick={() => {
                          if (itemName?.trim() && itemType) {
                            loadFirstItemPage(itemName);
                          } else if (!itemType) {
                            showPopup("Please select Item Type first", "warning");
                          }
                        }}
                        autoComplete="off"
                        required
                        disabled={!itemType}
                      />
                      {itemName && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => {
                            setItemName("");
                            setSelectedItem(null);
                            setItemSearch("");
                            setItemDropdown([]);
                            setShowItemDropdown(false);
                          }}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    {/* Search Dropdown - Same as ReceivingReport */}
                    {showItemDropdown && itemType && (
                      <div 
                        className="border rounded mt-1 bg-white position-absolute w-100"
                        style={{ maxHeight: "250px", zIndex: 1000, overflowY: "auto" }}
                        onScroll={(e) => {
                          const target = e.target;
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
                            loadMoreItems();
                          }
                        }}
                      >
                        {isItemLoading && itemDropdown.length === 0 ? (
                          <div className="text-center p-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : itemDropdown.length > 0 ? (
                          <>
                            {itemDropdown.map((item) => (
                              <div
                                key={item.itemId}
                                className="p-2 cursor-pointer hover-bg-light"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleItemSelect(item);
                                }}
                                style={{ 
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0'
                                }}
                              >
                                <div className="fw-bold">{item.nomenclature}</div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <small className="text-muted">PVMS: {item.pvmsNo}</small>
                                </div>
                              </div>
                            ))}
                            
                            {!itemLastPage && (
                              <div className="text-center p-2 text-primary small">
                                {isItemLoading ? 'Loading...' : 'Scroll to load more...'}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-2 text-muted text-center">No items found</div>
                        )}
                      </div>
                    )}
                    
                    {selectedItem && (
                      <div className="alert alert-success mt-2 py-2">
                        <small className="d-block">
                          <strong>Selected Item:</strong> {selectedItem.nomenclature || selectedItem.itemName}
                        </small>
                        <small className="d-block">
                          <strong>PVMS No:</strong> {selectedItem.pvmsNo}
                        </small>
                        <small className="d-block">
                          <strong>Category:</strong> {selectedItem.sectionName}
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* Date Range - Adjust column widths based on report type */}
                <div className={reportType === "itemwise" ? "col-md-4 mt-3" : "col-md-2"}>
                  <label className="form-label fw-bold">
                    From Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={handleFromDateChange}
                    required
                  />
                </div>

                <div className={reportType === "itemwise" ? "col-md-4 mt-3" : "col-md-2"}>
                  <label className="form-label fw-bold">
                    To Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    min={fromDate}
                    onChange={handleToDateChange}
                    disabled={!fromDate}
                    onFocus={handleToDateFocus}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-12 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGeneratePDF}
                    disabled={!areMandatoryFieldsFilled() || isGeneratingPDF || isPrinting}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-eye me-2"></i>
                        VIEW / DOWNLOAD
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handlePrint}
                    disabled={!areMandatoryFieldsFilled() || isPrinting || isGeneratingPDF}
                  >
                    {isPrinting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i>
                        PRINT
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name="Item Issue Register"
        />
      )}

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  );
};

export default ItemIssueRegister;