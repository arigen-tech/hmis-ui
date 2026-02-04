import { useState, useEffect } from "react";
import { useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { API_HOST, MASTERS } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const CommonStatusMaster = () => {
  const [commonStatusData, setCommonStatusData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    entityName: "",
    tableName: "",
    columnName: "",
    statusCode: "",
    statusName: "",
    statusDesc: "",
    remarks: ""
  });

  const [entitySearch, setEntitySearch] = useState("");
  const [entityDropdown, setEntityDropdown] = useState([]);
  const [entityPage, setEntityPage] = useState(0);
  const [entityLastPage, setEntityLastPage] = useState(true);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);

  const entityDebounceRef = useRef(null);
  const entityDropdownRef = useRef(null);

  const [tableLoading, setTableLoading] = useState(false);
  const [columnDropdown, setColumnDropdown] = useState([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [columnLoading, setColumnLoading] = useState(false);

  const MAX_LENGTH = 50;

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Fetch all common status data
  const fetchCommonStatusData = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MASTERS}/mas-common-status/all/`);
      
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.commonStatusId,
          statusCode: item.statusCode,
          statusName: item.statusName,
          entityName: item.entityName,
          tableName: item.tableName,
          columnName: item.columnName,
          statusDescription: item.statusDesc,
          remark: item.remarks,
          lastUpdated: formatDate(item.updateDate)
        }));
        setCommonStatusData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching common status data:", err);
      showPopup("Failed to fetch common status data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommonStatusData();
  }, []);

  // Filter data based on search query
  const filteredData = commonStatusData.filter(item =>
    item.statusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.statusCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.entityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch entities for dropdown
  const fetchEntities = async (page = 0, keyword = "") => {
    try {
      const res = await fetch(
        `${API_HOST}${MASTERS}/mas-common-status/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=5`
      );
      const data = await res.json();
      return {
        list: data.content || [],
        last: data.last
      };
    } catch (err) {
      console.error(err);
      return { list: [], last: true };
    }
  };

  const handleEntitySearch = (value) => {
    setFormData(prev => ({ ...prev, entityName: value }));
    setEntitySearch(value);

    if (entityDebounceRef.current) {
      clearTimeout(entityDebounceRef.current);
    }

    entityDebounceRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setEntityDropdown([]);
        setShowEntityDropdown(false);
        return;
      }

      const result = await fetchEntities(0, value);
      setEntityDropdown(result.list);
      setEntityLastPage(result.last);
      setEntityPage(0);
      setShowEntityDropdown(true);
    }, 600);
  };

  const loadMoreEntities = async () => {
    if (entityLastPage) return;

    const nextPage = entityPage + 1;
    const result = await fetchEntities(nextPage, entitySearch);

    setEntityDropdown(prev => [...prev, ...result.list]);
    setEntityLastPage(result.last);
    setEntityPage(nextPage);
  };

  const fetchTableName = async (entityName) => {
    try {
      setTableLoading(true);
      const res = await fetch(
        `${API_HOST}${MASTERS}/mas-common-status/table?entityName=${encodeURIComponent(entityName)}`
      );
      const data = await res.json();
      return data.response || "";
    } catch (err) {
      console.error(err);
      return "";
    } finally {
      setTableLoading(false);
    }
  };

  const fetchColumns = async (entityName) => {
    try {
      setColumnLoading(true);
      const res = await fetch(
        `${API_HOST}${MASTERS}/mas-common-status/columns?entityName=${encodeURIComponent(entityName)}`
      );
      const data = await res.json();
      return data.response || [];
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setColumnLoading(false);
    }
  };

  const selectEntity = async (name) => {
    setFormData(prev => ({
      ...prev,
      entityName: name,
      tableName: "",
      columnName: ""
    }));

    setShowEntityDropdown(false);

    // Fetch table name
    const tableName = await fetchTableName(name);
    if (tableName) {
      setFormData(prev => ({ ...prev, tableName }));
    }

    // Fetch column names
    const columns = await fetchColumns(name);
    setColumnDropdown(columns);
    setShowColumnDropdown(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        entityDropdownRef.current &&
        !entityDropdownRef.current.contains(e.target)
      ) {
        setShowEntityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // Show popup
  const showPopup = (message, type = "success") => {
    setPopupMessage({ 
      message, 
      type, 
      onClose: () => setPopupMessage(null) 
    });
  };

  // Function to check for duplicate entry
  const checkDuplicateEntry = (entityName, tableName, columnName, statusCode, excludeId = null) => {
    return commonStatusData.some(item => {
      // Check if all four fields match
      const isDuplicate = 
        item.entityName?.toLowerCase() === entityName?.toLowerCase() &&
        item.tableName?.toLowerCase() === tableName?.toLowerCase() &&
        item.columnName?.toLowerCase() === columnName?.toLowerCase() &&
        item.statusCode?.toLowerCase() === statusCode?.toLowerCase();
      
      // If we're updating, exclude the current record from duplicate check
      if (excludeId && item.id === excludeId) {
        return false;
      }
      
      return isDuplicate;
    });
  };

  // Handle edit
  const handleEdit = async (record) => {
    setEditingRecord(record);
    setFormData({
      entityName: record.entityName || "",
      tableName: record.tableName || "",
      columnName: record.columnName || "",
      statusCode: record.statusCode || "",
      statusName: record.statusName || "",
      statusDesc: record.statusDescription || "",
      remarks: record.remark || ""
    });
    
    // Fetch columns for the entity when editing
    if (record.entityName) {
      try {
        setColumnLoading(true);
        const columns = await fetchColumns(record.entityName);
        setColumnDropdown(columns);
        
        // Also fetch table name if not already present
        if (!record.tableName) {
          const tableName = await fetchTableName(record.entityName);
          if (tableName) {
            setFormData(prev => ({ ...prev, tableName }));
          }
        }
        
        // Show column dropdown if we have columns
        if (columns.length > 0) {
          setShowColumnDropdown(true);
        }
      } catch (err) {
        console.error("Error fetching columns for edit:", err);
      } finally {
        setColumnLoading(false);
      }
    }
    
    setIsFormValid(true);
    setShowForm(true);
  };

  // Handle save (create/update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      // Check for duplicate entry before saving
      const isDuplicate = checkDuplicateEntry(
        formData.entityName,
        formData.tableName,
        formData.columnName,
        formData.statusCode,
        editingRecord?.id // Pass the ID when updating to exclude current record
      );

      if (isDuplicate) {
        showPopup("Duplicate entry found! Combination of Entity Name, Table Name, Column Name and Status Code must be unique.", "error");
        return;
      }

      setLoading(true);

      // Prepare request data according to API structure
      const requestData = {
        entityName: formData.entityName,
        tableName: formData.tableName,
        columnName: formData.columnName,
        statusCode: formData.statusCode,
        statusName: formData.statusName,
        statusDesc: formData.statusDesc,
        remarks: formData.remarks
      };

      if (editingRecord) {
        // Update existing record
        const response = await putRequest(
          `${MASTERS}/mas-common-status/update/${editingRecord.id}`,
          requestData
        );

        if (response && response.status === 200) {
          fetchCommonStatusData();
          showPopup("Common Status updated successfully", "success");
        }
      } else {
        // Create new record
        const response = await postRequest(
          `${MASTERS}/mas-common-status/create`,
          requestData
        );

        if (response && response.status === 200) {
          fetchCommonStatusData();
          showPopup("Common Status added successfully", "success");
        }
      }

      setShowForm(false);
      setEditingRecord(null);
      setFormData({
        entityName: "",
        tableName: "",
        columnName: "",
        statusCode: "",
        statusName: "",
        statusDesc: "",
        remarks: ""
      });
      setIsFormValid(false);
      setColumnDropdown([]);
      setShowColumnDropdown(false);
    } catch (err) {
      console.error("Error saving common status:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Check if all required fields are filled
    const requiredFields = [
      'entityName',
      'tableName',
      'columnName',
      'statusCode',
      'statusName',
      'statusDesc',
      'remarks'
    ];

    const allRequiredFilled = requiredFields.every(field =>
      updatedFormData[field] && updatedFormData[field].trim() !== ""
    );

    setIsFormValid(allRequiredFilled);
  };

  // Handle back/cancel
  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      entityName: "",
      tableName: "",
      columnName: "",
      statusCode: "",
      statusName: "",
      statusDesc: "",
      remarks: ""
    });
    setIsFormValid(false);
    setColumnDropdown([]);
    setShowColumnDropdown(false);
    setEntityDropdown([]);
    setShowEntityDropdown(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchCommonStatusData();
  };

  // Effect to handle click outside column dropdown
  useEffect(() => {
    const handleClickOutsideColumn = (e) => {
      const columnInput = document.querySelector('input[name="columnName"]');
      if (showColumnDropdown && columnInput && !columnInput.contains(e.target)) {
        // Check if click is on the dropdown itself
        const dropdowns = document.querySelectorAll('.position-absolute');
        let isClickInsideDropdown = false;
        dropdowns.forEach(dropdown => {
          if (dropdown.contains(e.target)) {
            isClickInsideDropdown = true;
          }
        });
        
        if (!isClickInsideDropdown) {
          setShowColumnDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutsideColumn);
    return () => document.removeEventListener("mousedown", handleClickOutsideColumn);
  }, [showColumnDropdown]);

  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Common Status Master</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <form className="searchform" role="search">
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search Common Status"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "220px" }}
                  />
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </form>
            )}

            {!showForm ? (
              <>
                <button 
                  className="btn btn-success" 
                  onClick={() => {
                    setEditingRecord(null);
                    setFormData({
                      entityName: "",
                      tableName: "",
                      columnName: "",
                      statusCode: "",
                      statusName: "",
                      statusDesc: "",
                      remarks: ""
                    });
                    setColumnDropdown([]);
                    setShowColumnDropdown(false);
                    setEntityDropdown([]);
                    setShowEntityDropdown(false);
                    setShowForm(true);
                  }}
                >
                  <i className="mdi mdi-plus"></i> Add
                </button>
                <button className="btn btn-success" onClick={handleRefresh}>
                  <i className="mdi mdi-refresh"></i> Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: "30px", whiteSpace: "nowrap" }}>Status Code</th>
                      <th style={{ width: "80px", whiteSpace: "nowrap" }}>Status Name</th>
                      <th style={{ width: "120px", whiteSpace: "nowrap" }}>Entity Name</th>
                      <th style={{ width: "120px", whiteSpace: "nowrap" }}>Table Name</th>
                      <th style={{ width: "50px", whiteSpace: "nowrap" }}>Column Name</th>
                      <th style={{ width: "200px", whiteSpace: "nowrap" }}>Status Description</th>
                      <th style={{ width: "220px", whiteSpace: "nowrap" }}>Remark</th>
                      <th style={{ width: "60px", whiteSpace: "nowrap" }}>Last Updated</th>
                      <th style={{ width: "30px", whiteSpace: "nowrap" }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length ? (
                      currentItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.statusCode}</td>
                          <td
                            style={{ maxWidth: "80px" }}
                            className="text-truncate"
                            title={item.statusName}
                          >
                            {item.statusName}
                          </td>
                          <td>{item.entityName}</td>
                          <td>{item.tableName}</td>
                          <td>{item.columnName}</td>
                          <td>{item.statusDescription}</td>
                          <td>{item.remark}</td>
                          <td>{item.lastUpdated}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleEdit(item)}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form className="forms row" onSubmit={handleSave}>
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  {/* Entity Name */}
                  <div className="form-group col-md-4 position-relative" ref={entityDropdownRef}>
                    <label>
                      Entity Name<span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="entityName"
                      value={formData.entityName}
                      onChange={(e) => handleEntitySearch(e.target.value)}
                      placeholder="Search entity name"
                      autoComplete="off"
                      required
                    />
                    {showEntityDropdown && (
                      <div
                        className="border rounded bg-white position-absolute w-100 mt-1"
                        style={{ maxHeight: "180px", overflowY: "auto", zIndex: 1000 }}
                        onScroll={(e) => {
                          if (
                            e.target.scrollHeight - e.target.scrollTop ===
                            e.target.clientHeight
                          ) {
                            loadMoreEntities();
                          }
                        }}
                      >
                        {entityDropdown.length ? (
                          entityDropdown.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 cursor-pointer hover-bg-light"
                              onMouseDown={() => selectEntity(item.entityName)}
                            >
                              {item.entityName}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-muted">No results found</div>
                        )}
                        {!entityLastPage && (
                          <div className="p-2 text-center text-primary small">Loading...</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Table Name */}
                  <div className="form-group col-md-4">
                    <label>Table Name<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="tableName"
                      value={formData.tableName}
                      readOnly
                      placeholder={tableLoading ? "Loading table..." : "Auto populated"}
                    />
                  </div>

                  {/* Column Name */}
                  <div className="form-group col-md-4 position-relative">
                    <label>
                      Column Name<span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="columnName"
                      value={formData.columnName}
                      onClick={() => {
                        if (formData.entityName && !showColumnDropdown) {
                          // If entity is selected but dropdown isn't showing, fetch columns
                          if (columnDropdown.length === 0 && formData.entityName) {
                            fetchColumns(formData.entityName).then(columns => {
                              setColumnDropdown(columns);
                              setShowColumnDropdown(true);
                            });
                          } else {
                            setShowColumnDropdown(true);
                          }
                        }
                      }}
                      readOnly
                      placeholder={columnLoading ? "Loading columns..." : "Select column"}
                      required
                    />
                    {showColumnDropdown && columnDropdown.length > 0 && (
                      <div
                        className="border rounded bg-white position-absolute w-100 mt-1"
                        style={{ maxHeight: "180px", overflowY: "auto", zIndex: 1000 }}
                      >
                        {columnDropdown.map((col, idx) => (
                          <div
                            key={idx}
                            className="p-2 cursor-pointer hover-bg-light"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, columnName: col }));
                              setShowColumnDropdown(false);
                            }}
                          >
                            {col}
                          </div>
                        ))}
                      </div>
                    )}
                    {showColumnDropdown && columnDropdown.length === 0 && !columnLoading && (
                      <div
                        className="border rounded bg-white position-absolute w-100 mt-1"
                        style={{ maxHeight: "180px", overflowY: "auto", zIndex: 1000 }}
                      >
                        <div className="p-2 text-muted">No columns found</div>
                      </div>
                    )}
                  </div>

                  {/* Status Code */}
                  <div className="form-group col-md-4">
                    <label>Status Code<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="statusCode"
                      value={formData.statusCode}
                      maxLength={10}
                      onChange={handleInputChange}
                      placeholder="Enter status code (max 10 chars)"
                      required
                    />
                  </div>

                  {/* Status Name */}
                  <div className="form-group col-md-4">
                    <label>Status Name<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="statusName"
                      value={formData.statusName}
                      maxLength={50}
                      onChange={handleInputChange}
                      placeholder="Enter status name (max 50 chars)"
                      required
                    />
                  </div>

                  {/* Status Description */}
                  <div className="form-group col-md-4">
                    <label>
                      Status Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="statusDesc"
                      rows="2"
                      maxLength={200}
                      value={formData.statusDesc}
                      onChange={handleInputChange}
                      placeholder="Enter status description"
                      required
                    />
                  </div>

                  {/* Remarks */}
                  <div className="form-group col-md-12">
                    <label>
                      Remarks <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="remarks"
                      rows="2"
                      maxLength={100}
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter remarks (max 100 chars)"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                <button 
                  className="btn btn-primary me-2" 
                  type="submit"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Saving..." : (editingRecord ? 'Update' : 'Save')}
                </button>
                <button 
                  className="btn btn-danger" 
                  type="button" 
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {popupMessage && (
            <Popup
              message={popupMessage.message}
              type={popupMessage.type}
              onClose={popupMessage.onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommonStatusMaster;