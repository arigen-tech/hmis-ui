import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAX_MONTHS_BACK } from "../../../../config/apiConfig";


const LabReports = () => {
  const [mobileNo, setMobileNo] = useState("")
  const [patientName, setPatientName] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [labData, setLabData] = useState([])
  const [filteredLabData, setFilteredLabData] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [popupMessage, setPopupMessage] = useState(null);


   

  // Function to calculate 4 months ago date
  const getFourMonthsAgoDate = () => {
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    return fourMonthsAgo.toISOString().split('T')[0];
  };

  // Function to validate from date is within last 4 months
  const isValidFromDate = (date) => {
    if (!date) return false;
    
    const selectedDate = new Date(date);
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    // Set time to 00:00:00 for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    fourMonthsAgo.setHours(0, 0, 0, 0);
    
    return selectedDate >= fourMonthsAgo && selectedDate <= today;
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Function to get min and max date for fromDate input
  const getFromDateMinMax = () => {
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    return {
      min: fourMonthsAgo.toISOString().split('T')[0],
      max: today.toISOString().split('T')[0]
    };
  };

  // Format date from API (YYYY-MM-DD) to DD/MM/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Build gender/age string from separate fields
  const getGenderAge = (gender, age) => {
    return `${gender || ""} / ${age || ""}`.trim();
  };

  // Fetch lab reports from API
  const fetchLabReports = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (mobileNo) params.append('mobileNo', mobileNo);
      if (patientName) params.append('patientName', patientName);
      
      // Dates are mandatory for API
      const apiFromDate = fromDate || new Date().toISOString().split('T')[0];
      const apiToDate = toDate || new Date().toISOString().split('T')[0];
      
      params.append('fromDate', apiFromDate);
      params.append('toDate', apiToDate);

      // Make API call
      const response = await getRequest(`/report/lab-history/all?${params.toString()}`);
      
      if (response && response.response) {
        // Map API response to match frontend structure
        const mappedData = response.response.map(item => ({
          id: item.resultEntryDetailsId || item.orderHdId,
          investigationDate: formatDateForDisplay(item.investigationDate),
          patientName: item.patientName || "",
          mobileNo: item.phnNum || "",
          genderAge: getGenderAge(item.gender, item.age),
          investigationName: item.investigationName || "",
          unit: item.unit || "",
          result: item.result || "",
          range: item.range || "",
          enteredBy: item.resultEnteredBy || "",
          validatedBy: item.resultValidatedBy || ""
        }));
        
        setLabData(mappedData);
        setFilteredLabData(mappedData);
      } else {
        // Fallback to empty array if no data
        setLabData([]);
        setFilteredLabData([]);
      }
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      // Keep existing data or set empty arrays
      if (labData.length === 0) {
        setLabData([]);
        setFilteredLabData([]);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Handle search (calls API)
  const handleSearch = () => {
    if (!fromDate || !toDate) {
      showPopup("Please select both From Date and To Date","error");
      return;
    }
    
    // Validate from date is within last 4 months
    if (!isValidFromDate(fromDate)) {
      showPopup(`From Date must be within the last ${MAX_MONTHS_BACK} months (from ${getFourMonthsAgoDate()} to today)`,"error")
      return;
    }
    
    // Validate that from date is not after to date
    if (new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be after To Date");
      return;
    }
    
    fetchLabReports();
    setCurrentPage(1);
  }

  // Handle show all (reset filters and fetch all data)
  const handleShowAll = () => {
    setMobileNo("")
    setPatientName("")
    
    // Set default dates (last 4 months to today)
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    setFromDate(fourMonthsAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    // Trigger API call with default dates
    setTimeout(() => {
      fetchLabReports();
      setCurrentPage(1);
    }, 100);
  }

  // Handle from date change with validation
  const handleFromDateChange = (e) => {
    const selectedDate = e.target.value;
    
    // Validate date is within last 4 months
    if (selectedDate && !isValidFromDate(selectedDate)) {
      alert(`From Date must be within the last ${MAX_MONTHS_BACK} months (from ${getFourMonthsAgoDate()} to today)`);
      
      // Reset to default 4 months ago
      const fourMonthsAgo = getFourMonthsAgoDate();
      setFromDate(fourMonthsAgo);
    } else {
      setFromDate(selectedDate);
    }
  };

  // View report handler
  const handleViewReport = (record) => {
    console.log("View report for:", record)
    // You might want to navigate to a detailed view or open a modal
  }

  // Print report handler
  const handlePrintReport = (record) => {
    console.log("Print report for:", record)
    // Implement print functionality
  }

  // Initialize with default dates on component mount
  useEffect(() => {
    const today = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(today.getMonth() - MAX_MONTHS_BACK);
    
    setFromDate(fourMonthsAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    // Fetch initial data after setting dates
    setTimeout(() => {
      fetchLabReports();
    }, 100);
  }, []);

  // Calculate current items for pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredLabData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">LAB REPORTS</h4>
            </div>
            <div className="card-body">
              {initialLoading ? (
                <div className="text-center py-5">
                  <LoadingScreen />
                </div>
              ) : (
                <>
                  <div className="row mb-4">
                    <div className="col-md-2">
                      <label className="form-label">Mobile No</label>
                      <input
                        type="text"
                        className="form-control"
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">From Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={fromDate}
                        onChange={handleFromDateChange}
                        min={getFromDateMinMax().min}
                        max={getFromDateMinMax().max}
                        required
                      />
                      {/* <small className="text-muted">
                        Max {MAX_MONTHS_BACK} months back from today
                      </small> */}
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">To Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        readOnly
                      />
                      {/* <small className="text-muted">
                        Today's date
                      </small> */}
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button 
                        type="button" 
                        className="btn btn-primary me-2" 
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {loading ? "Searching..." : "Search"}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleShowAll}
                        disabled={loading}
                      >
                        Show All
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="fw-bold">{filteredLabData.length} matches</span>
                    {loading && <span className="ms-2 text-muted">Loading...</span>}
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Investigation Date</th>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Gender / Age</th>
                          <th>Investigation Name</th>
                          <th>Unit</th>
                          <th>Result</th>
                          <th>Range</th>
                          <th>Entered By</th>
                          <th>Validated By</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={11} className="text-center py-4">
                              <div className="d-flex justify-content-center">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : currentItems.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.investigationDate}</td>
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.genderAge}</td>
                              <td>{item.investigationName}</td>
                              <td>{item.unit}</td>
                              <td>{item.result}</td>
                              <td>{item.range}</td>
                              <td>{item.enteredBy}</td>
                              <td>{item.validatedBy}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleViewReport(item)}
                                  >
                                    View
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handlePrintReport(item)}
                                  >
                                    Print
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredLabData.length > 0 && (
                    <Pagination
                      totalItems={filteredLabData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabReports