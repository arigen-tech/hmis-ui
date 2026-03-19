import { useState, useEffect } from "react"
import { getRequest } from "../../../service/apiService"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"
import { INVENTORY, ALL_REPORTS } from "../../../config/apiConfig"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import Popup from "../../../Components/popup";

const TrackIndent = () => {
  const [currentView, setCurrentView] = useState("list")
  const [selectedIndent, setSelectedIndent] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [indentData, setIndentData] = useState([])
  const [showReceivedQtyPopup, setShowReceivedQtyPopup] = useState(false)
  const [selectedItemForPopup, setSelectedItemForPopup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [userSessionData, setUserSessionData] = useState(null)
  const [statusMap, setStatusMap] = useState(null)
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false)
  
  // State for PDF viewer
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  // Track which specific report button is loading by indentId and report type
  const [reportLoading, setReportLoading] = useState({});
  
  // Popup state
  const [popupMessage, setPopupMessage] = useState(null);

  // Fetch departments list and initial indent data
  useEffect(() => {
    fetchStatusMap()
    // Get user data from session storage
    const userData = getUserDataFromSession()
    setUserSessionData(userData)

    if (userData && userData.departmentId === 1) {
      // If departmentId is 1, fetch all departments for dropdown
      fetchDepartments()
    } else {
      // If departmentId is not 1, set user's department from session
      if (userData && userData.departmentName) {
        setSelectedDepartment({
          deptId: userData.departmentId,
          deptName: userData.departmentName
        })
      }
    }
  }, [])

  useEffect(() => {
    if (isInitialLoadDone && statusMap) {
      fetchIndentData(0)
    }
  }, [isInitialLoadDone, statusMap])

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const formatDateTimeForDisplay = (dateTimeString) => {
    if (!dateTimeString) return "";
    try {
      const date = new Date(dateTimeString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date time:", error);
      return "";
    }
  };

  // Get user data from session storage
  const getUserDataFromSession = () => {
    try {
      // Get departmentId and departmentName directly from sessionStorage
      const departmentId = sessionStorage.getItem('departmentId')
      const departmentName = sessionStorage.getItem('departmentName')

      if (departmentId && departmentName) {
        return {
          departmentId: parseInt(departmentId),
          departmentName: departmentName
        }
      }

      // Fallback: try to get from a user object if stored differently
      const userDataStr = sessionStorage.getItem('userData')
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        return {
          departmentId: userData.departmentId || null,
          departmentName: userData.departmentName || ''
        }
      }

      return null
    } catch (error) {
      console.error("Error getting user data from session:", error)
      return null
    }
  }

  // Fetch indent data when page changes in non-search mode
  useEffect(() => {
    if (!isSearchMode) {
      fetchIndentData(currentPage)
    }
  }, [currentPage])

  const fetchStatusMap = async () => {
    try {
      const response = await getRequest(`${INVENTORY}/indent/tracking/statusMap`);

      if (response?.response?.length) {
        const map = {}
        response.response.forEach(status => {
          map[status.statusCode] = status.statusName
        })
        setStatusMap(map)
        setIsInitialLoadDone(true)
      } else {
        setStatusMap({})
      }
      
    } catch (error) {
      console.error("Error fetching status:", error)
      setStatusMap({})
    }
  }

  // Fetch departments from API using the new endpoint
  const fetchDepartments = async () => {
    try {
      // Call the new endpoint with status=y parameter
      const response = await getRequest("/master/indent-department/getAll?status=y")

      if (response && response.response && Array.isArray(response.response)) {
        // Map the response to extract department names and IDs
        const departmentList = response.response.map(dept => ({
          deptId: dept.deptId,
          deptName: dept.deptName
        }))
        setDepartments(departmentList)
      } else {
        // Fallback to empty array if API fails
        console.error("Invalid department response:", response)
        setDepartments([])
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
      setDepartments([])
    }
  }

  // Fetch initial indent data (without filters)
  const fetchIndentData = async (page = 0) => {
    try {
      setLoading(true)

      // If user has a specific department and it's not admin (departmentId !== 1),
      // filter by their department
      let url = `${INVENTORY}/indent/tracking?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}`

      if (userSessionData && userSessionData.departmentId && userSessionData.departmentId !== 1) {
        url += `&fromDepartmentId=${userSessionData.departmentId}`
      }

      const response = await getRequest(url)

      if (response && response.response) {
        const mappedData = mapApiData(response.response.content)
        setIndentData(mappedData)
        setTotalPages(response.response.totalPages)
        setTotalElements(response.response.totalElements)
      } else {
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      console.error("Error fetching indent data:", error)
      setIndentData([])
      setTotalPages(0)
      setTotalElements(0)
      showPopup("Error fetching indent data", "error");
    } finally {
      setLoading(false)
    }
  }

  // Search with filters API
  const searchWithFilters = async (page = 0) => {
    try {
      setIsSearching(true)

      // Build search parameters according to controller
      const params = {
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      }

      // Add fromDepartmentId if selected
      if (selectedDepartment && selectedDepartment.deptId) {
        params.fromDepartmentId = selectedDepartment.deptId
      }

      // Add fromDate if provided
      if (fromDate) {
        params.fromDate = fromDate
      }

      // Add toDate if provided
      if (toDate) {
        params.toDate = toDate
      }

      // Build query string
      const queryParams = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')

      // Call search API endpoint
      const response = await getRequest(`${INVENTORY}/indent/tracking/search?${queryParams}`)

      if (response && response.response) {
        const mappedData = mapApiData(response.response.content)
        setIndentData(mappedData)
        setTotalPages(response.response.totalPages)
        setTotalElements(response.response.totalElements)
        setIsSearchMode(true)
      } else {
        setIndentData([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      console.error("Error searching indent data:", error)
      setIndentData([])
      setTotalPages(0)
      setTotalElements(0)
      showPopup("Error searching indent data", "error");
    } finally {
      setIsSearching(false)
    }
  }

  // Check if search button should be enabled
const isSearchEnabled = () => {
  // For admin users (departmentId === 1), require department selection
  if (userSessionData?.departmentId === 1) {
    // Admin must select a department OR provide at least one date
    const hasDepartment = selectedDepartment && selectedDepartment.deptId;
    const hasFromDate = fromDate !== "";
    const hasToDate = toDate !== "";
    
    return hasDepartment || hasFromDate || hasToDate;
  }
  
  // For non-admin users, department is always present, so just check dates
  const hasFromDate = fromDate !== "";
  const hasToDate = toDate !== "";
  
  return hasFromDate || hasToDate;
}

  // Helper function to map API data - UPDATED to include isReturn field
  const mapApiData = (apiData) => {
    return apiData.map(item => ({
      indentId: item.indentMId,
      indentDate: formatDateTimeForDisplay(item.indentDate),
      indentNo: item.indentNo,
      department: item.deptName,
      toDepartment: item.toDepartmentName,
      approvedDate: formatDateTimeForDisplay(item.approvedDate),
      issuedDate: formatDateTimeForDisplay(item.issueDate),
      status: statusMap?.[item.statusName],
      statusCode: item.statusName,
      isReturn: item.isReturn, // Added isReturn field
      items: [] // Items will be populated when row is clicked
    }))
  }

  // Handle search button click
  const handleSearch = () => {
    // Validate at least one search criteria is provided
    if (!isSearchEnabled()) {
      showPopup("Please select at least one search criteria (Department or Date)", "warning");
      return
    }

    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)

      // Validate date range
      if (from > to) {
        showPopup("From Date cannot be greater than To Date", "warning");
        return
      }

      const diffTime = Math.abs(to - from)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 365) {
        showPopup("Date range cannot be more than 1 year", "warning");
        return
      }
    }

    setCurrentPage(0)
    searchWithFilters(0)
  }

  // Handle show all button click
  const handleShowAll = () => {
    // Reset department based on user type
    if (userSessionData && userSessionData.departmentId === 1) {
      setSelectedDepartment(null) // Admin can reset to all departments
    } else if (userSessionData && userSessionData.departmentName) {
      setSelectedDepartment({
        deptId: userSessionData.departmentId,
        deptName: userSessionData.departmentName
      })
    }

    setFromDate("")
    setToDate("")
    setCurrentPage(0)
    setIsSearchMode(false)
    fetchIndentData(0)
  }

  // Handle page change
  const handlePageChange = (page) => {
    const newPage = page - 1
    setCurrentPage(newPage)

    if (isSearchMode) {
      searchWithFilters(newPage)
    } else {
      fetchIndentData(newPage)
    }
  }

  // Handle department change (only for admin users)
  const handleDepartmentChange = (deptValue) => {
    // Find the selected department object
    const selectedDept = departments.find(dept => dept.deptId === parseInt(deptValue)) || null
    setSelectedDepartment(selectedDept)
  }

  // Fetch indent details by indentMId
  const fetchIndentDetails = async (indentMId) => {
    try {
      const response = await getRequest(`${INVENTORY}/indent/tracking/${indentMId}`)
      if (response && response.response && Array.isArray(response.response)) {
        return response.response.map(item => ({
          id: item.indentTId,
          drugCode: item.itemId, // Note: itemId is not in the response, keeping for compatibility
          drugName: item.itemName,
          apu: item.itemUnitName,
          qtyRequested: item.qtyRequested,
          approvedQty: item.qtyApproved,
          receivedQty: item.qtyReceived || 0,
          reasonForIndent: item.reasonForIndent
        }))
      }
      return []
    } catch (error) {
      console.error("Error fetching indent details:", error)
      showPopup("Error fetching indent details", "error");
      return []
    }
  }

  // Fetch batch details (you'll need to implement this API)
  const fetchBatchDetails = async (itemId, indentNo) => {
    try {
      // Replace with your actual API call
      const response = await getRequest(`/batch/details?itemId=${itemId}&indentNo=${indentNo}`)
      if (response && response.response) {
        return response.response
      }
      return []
    } catch (error) {
      console.error("Error fetching batch details:", error)
      return []
    }
  }

  // Fetch Issue MId
  const fetchIssueMId = async (indentMId) => {
    try {
      const response = await getRequest(`${INVENTORY}/indent/getIssueMId?indentMId=${indentMId}`)
      if (response && response.response) {
        return response.response
      }
      return null
    } catch (error) {
      console.error("Error fetching issue MId:", error)
      return null
    }
  }

  // Fetch Receive MId
  const fetchReceiveMId = async (indentMId) => {
    try {
      const response = await getRequest(`${INVENTORY}/indent/getReceiveMId?indentMId=${indentMId}`)
      if (response && response.response) {
        return response.response
      }
      return null
    } catch (error) {
      console.error("Error fetching receive MId:", error)
      return null
    }
  }

  // Fetch Return MId
  const fetchReturnMId = async (indentMId) => {
    try {
      const response = await getRequest(`${INVENTORY}/indent/getReturnMId?indentMId=${indentMId}`)
      if (response && response.response) {
        return response.response
      }
      return null
    } catch (error) {
      console.error("Error fetching return MId:", error)
      return null
    }
  }

  const handleRowClick = async (record, e) => {
    e.stopPropagation()
    setLoading(true)

    // Fetch indent details using indentMId
    const items = await fetchIndentDetails(record.indentId)

    // Fetch batch details for items with received quantity
    if (items && items.length > 0) {
      const itemsWithBatchDetails = await Promise.all(
        items.map(async (item) => {
          if (item.receivedQty > 0) {
            const batchDetails = await fetchBatchDetails(item.drugCode, record.indentNo)
            return { ...item, batchDetails }
          }
          return item
        })
      )

      setSelectedIndent({
        ...record,
        items: itemsWithBatchDetails
      })
    } else {
      setSelectedIndent({
        ...record,
        items: []
      })
    }

    setCurrentView("detail")
    setLoading(false)
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedIndent(null)
  }

  const handleReceivedQtyClick = (item) => {
    if (item.receivedQty > 0 && item.batchDetails) {
      setSelectedItemForPopup(item)
      setShowReceivedQtyPopup(true)
    }
  }

  const handleClosePopup = () => {
    setShowReceivedQtyPopup(false)
    setSelectedItemForPopup(null)
  }

  // Modified handleIndentReport with per-button loading
  const handleIndentReport = async (indentMId) => {
    console.log("Generating Indent Report for indentMId:", indentMId)
    const buttonId = `indent-${indentMId}`;
    try {
      setReportLoading(prev => ({ ...prev, [buttonId]: true }));
      const reportUrl = `${ALL_REPORTS}/indentReport?indentMId=${indentMId}&flag=d`
      
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      setPdfFileName(`Indent_Report_${indentMId}`);
    } catch (error) {
      console.error("Error generating indent report:", error)
      showPopup("Error generating indent report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  }

  // Modified handleIssueReport with per-button loading
  const handleIssueReport = async (indentMId) => {
    console.log("Fetching Issue MId for indentMId:", indentMId)
    const buttonId = `issue-${indentMId}`;
    try {
      setReportLoading(prev => ({ ...prev, [buttonId]: true }));
      const issueMId = await fetchIssueMId(indentMId)
      if (issueMId) {
        console.log("Issue MId received:", issueMId)
        const reportUrl = `${ALL_REPORTS}/indentIssue?issueMId=${issueMId}&flag=d`
        
        const response = await fetch(reportUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
        setPdfFileName(`Issue_Report_${issueMId}`);
      } else {
        showPopup("Issue report not available for this indent", "info");
      }
    } catch (error) {
      console.error("Error generating issue report:", error)
      showPopup("Error generating issue report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  }

  // Modified handleReceivingReport with per-button loading
  const handleReceivingReport = async (indentMId, statusCode) => {
    console.log("Generating Receiving Report for indentMId:", indentMId)
    const buttonId = `receiving-${indentMId}`;
    try {
      setReportLoading(prev => ({ ...prev, [buttonId]: true }));
      let reportUrl;
      
      // If status is RC, use the direct indentReceiving endpoint
      if (statusCode === 'RC') {
        reportUrl = `${ALL_REPORTS}/indentReceiving?indentMId=${indentMId}&flag=d`;
      } else {
        // For other statuses, try to get receiveMId
        const receiveMId = await fetchReceiveMId(indentMId)
        if (receiveMId) {
          console.log("Receive MId received:", receiveMId)
          reportUrl = `${ALL_REPORTS}/receivingReport?receiveMId=${receiveMId}&flag=d`;
        } else {
          showPopup("Receiving report not available for this indent", "info");
          setReportLoading(prev => ({ ...prev, [buttonId]: false }));
          return;
        }
      }
      
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      setPdfFileName(`Receiving_Report_${indentMId}`);
    } catch (error) {
      console.error("Error generating receiving report:", error)
      showPopup("Error generating receiving report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  }

  // Modified handleReturnReport with per-button loading
  const handleReturnReport = async (indentMId) => {
    console.log("Fetching Return MId for indentMId:", indentMId)
    const buttonId = `return-${indentMId}`;
    try {
      setReportLoading(prev => ({ ...prev, [buttonId]: true }));
      const returnMId = await fetchReturnMId(indentMId)
      if (returnMId) {
        console.log("Return MId received:", returnMId)
        const reportUrl = `${ALL_REPORTS}/indentReturn?returnMId=${returnMId}&flag=d`
        
        const response = await fetch(reportUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
        setPdfFileName(`Return_Report_${returnMId}`);
      } else {
        showPopup("Return report not available for this indent", "info");
      }
    } catch (error) {
      console.error("Error generating return report:", error)
      showPopup("Error generating return report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, [buttonId]: false }));
    }
  }

  // Modified detail view report handlers with per-button loading
  const handleDetailIndentReport = async (indentMId) => {
    console.log("Generating Indent Report for indentMId:", indentMId)
    try {
      setReportLoading(prev => ({ ...prev, detailIndent: true }));
      const reportUrl = `${ALL_REPORTS}/indentReport?indentMId=${indentMId}&flag=d`
      
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      setPdfFileName(`Indent_Report_${indentMId}`);
    } catch (error) {
      console.error("Error generating indent report:", error)
      showPopup("Error generating indent report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, detailIndent: false }));
    }
  }

  const handleDetailIssueReport = async (indentMId) => {
    console.log("Fetching Issue MId for indentMId:", indentMId)
    try {
      setReportLoading(prev => ({ ...prev, detailIssue: true }));
      const issueMId = await fetchIssueMId(indentMId)
      if (issueMId) {
        console.log("Issue MId received:", issueMId)
        const reportUrl = `${ALL_REPORTS}/indentIssue?issueMId=${issueMId}&flag=d`
        
        const response = await fetch(reportUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
        setPdfFileName(`Issue_Report_${issueMId}`);
      } else {
        showPopup("Issue report not available for this indent", "info");
      }
    } catch (error) {
      console.error("Error generating issue report:", error)
      showPopup("Error generating issue report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, detailIssue: false }));
    }
  }

  const handleDetailReceivingReport = async (indentMId, statusCode) => {
    console.log("Generating Receiving Report for indentMId:", indentMId)
    try {
      setReportLoading(prev => ({ ...prev, detailReceiving: true }));
      let reportUrl;
      
      // If status is RC, use the direct indentReceiving endpoint
      if (statusCode === 'RC') {
        reportUrl = `${ALL_REPORTS}/indentReceiving/indentMId=${indentMId}&flag=d`;
      } else {
        // For other statuses, try to get receiveMId
        const receiveMId = await fetchReceiveMId(indentMId)
        if (receiveMId) {
          console.log("Receive MId received:", receiveMId)
          reportUrl = `${ALL_REPORTS}/receivingReport?receiveMId=${receiveMId}&flag=d`;
        } else {
          showPopup("Receiving report not available for this indent", "info");
          setReportLoading(prev => ({ ...prev, detailReceiving: false }));
          return;
        }
      }
      
      const response = await fetch(reportUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      setPdfFileName(`Receiving_Report_${indentMId}`);
    } catch (error) {
      console.error("Error generating receiving report:", error)
      showPopup("Error generating receiving report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, detailReceiving: false }));
    }
  }

  const handleDetailReturnReport = async (indentMId) => {
    console.log("Fetching Return MId for indentMId:", indentMId)
    try {
      setReportLoading(prev => ({ ...prev, detailReturn: true }));
      const returnMId = await fetchReturnMId(indentMId)
      if (returnMId) {
        console.log("Return MId received:", returnMId)
        const reportUrl = `${ALL_REPORTS}/indentReturn?returnMId=${returnMId}&flag=d`
        
        const response = await fetch(reportUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
        setPdfFileName(`Return_Report_${returnMId}`);
      } else {
        showPopup("Return report not available for this indent", "info");
      }
    } catch (error) {
      console.error("Error generating return report:", error)
      showPopup("Error generating return report", "error");
    } finally {
      setReportLoading(prev => ({ ...prev, detailReturn: false }));
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  // Check if report buttons should be enabled
  const canShowIssueReport = (indent) => indent.statusCode === "FI"
  // Updated condition for receiving report - show when status is RC
  const canShowReceivingReport = (indent) => {
    return indent.statusCode === 'RC';
  }
  // UPDATED condition for return report - show when isReturn is "N"
  const canShowReturnReport = (indent) => {
    return indent.isReturn === "N";
  }

  // Add function to close PDF viewer
  const handleClosePdfViewer = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfFileName("");
  };

  // Detail View
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
        
        {loading && <LoadingScreen />}
        
        {/* Add PdfViewer component at the top level */}
        {pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            name={pdfFileName}
            onClose={handleClosePdfViewer}
          />
        )}
        
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">INDENT DETAILS</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {/* Detail view content */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.indentNo || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Indent Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedIndent?.indentDate) || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">From Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.department || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">To Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.toDepartment || ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approved Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedIndent?.approvedDate) || "-"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Issued Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedIndent?.issuedDate) || "-"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedIndent?.status || ""}
                      readOnly
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>A/U</th>
                        <th>Qty Requested</th>
                        <th>Approved Qty</th>
                        <th>Received Qty</th>
                        <th>Reason for Indent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIndent?.items && selectedIndent.items.length > 0 ? (
                        selectedIndent.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.drugName || ""}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.apu || ""}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.qtyRequested || 0}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.approvedQty || 0}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.receivedQty || 0}
                                onClick={() => handleReceivedQtyClick(item)}
                                style={{ cursor: item.receivedQty > 0 ? 'pointer' : 'default' }}
                                readOnly
                              />
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={item.reasonForIndent || ""}
                                readOnly
                                rows="1"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center">
                            No items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => handleDetailIndentReport(selectedIndent?.indentId)}
                    disabled={reportLoading.detailIndent}
                  >
                    {reportLoading.detailIndent ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Generating...
                      </>
                    ) : "Indent Report"}
                  </button>
                  {canShowIssueReport(selectedIndent) && (
                    <button 
                      type="button" 
                      className="btn btn-primary flex-shrink-0" 
                      onClick={() => handleDetailIssueReport(selectedIndent?.indentId)}
                      disabled={reportLoading.detailIssue}
                    >
                      {reportLoading.detailIssue ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Generating...
                        </>
                      ) : "Issue Report"}
                    </button>
                  )}
                  {canShowReceivingReport(selectedIndent) && (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => handleDetailReceivingReport(selectedIndent?.indentId, selectedIndent?.statusCode)}
                      disabled={reportLoading.detailReceiving}
                    >
                      {reportLoading.detailReceiving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Generating...
                        </>
                      ) : "Receiving Report"}
                    </button>
                  )}
                  {canShowReturnReport(selectedIndent) && (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => handleDetailReturnReport(selectedIndent?.indentId)}
                      disabled={reportLoading.detailReturn}
                    >
                      {reportLoading.detailReturn ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Generating...
                        </>
                      ) : "Return Report"}
                    </button>
                  )}
                  <button type="button" className="btn btn-danger" onClick={handleBackToList}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Received Qty Popup Modal */}
        {showReceivedQtyPopup && selectedItemForPopup && (
          <div className="modal show d-block" onClick={handleClosePopup}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Received Quantity Details</h5>
                  <button type="button" className="btn-close" onClick={handleClosePopup}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedItemForPopup.drugName}
                      readOnly
                    />
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Batch No</th>
                          <th>Expiry Date</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItemForPopup.batchDetails && selectedItemForPopup.batchDetails.length > 0 ? (
                          selectedItemForPopup.batchDetails.map((batch, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={batch.batchNo}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formatDate(batch.expiryDate)}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={batch.qty}
                                  readOnly
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center">
                              No batch details available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-bold">Total Received Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      value={selectedItemForPopup.receivedQty || 0}
                      readOnly
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleClosePopup}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List View with Search Filters
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      
      {!isInitialLoadDone && <LoadingScreen />}
      
      {/* Add PdfViewer component at the top level */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          name={pdfFileName}
          onClose={handleClosePdfViewer}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">INDENT TRACKING LIST</h4>
            </div>
            <div className="card-body">
              {/* Search Filters */}
              <div className="row mb-4">
                {/* Department Field */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Department</label>
                  {userSessionData && userSessionData.departmentId === 1 ? (
                    // Admin users (departmentId = 1) see dropdown with all departments
                    <select
                      className="form-select text-center"
                      value={selectedDepartment ? selectedDepartment.deptId : ""}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={!departments.length}
                    >
                      <option value="">---- Select Departments-----</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept.deptId}>{dept.deptName}</option>
                      ))}
                    </select>
                  ) : (
                    // Non-admin users see their department as read-only
                    <input
                      type="text"
                      className="form-control"
                      value={userSessionData?.departmentName || "Loading..."}
                      readOnly
                    />
                  )}
                </div>

                {/* From Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* To Date */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Search and Show All Buttons */}
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isSearching || !isSearchEnabled()}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Searching...
                      </>
                    ) : "Search"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary flex-shrink-0"
                    onClick={handleShowAll}
                    disabled={loading}
                  >
                    Show All
                  </button>
                </div>

               
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Indent Date</th>
                      <th>Indent No</th>
                      <th>From Department</th>
                      <th>To Department</th>
                      <th>Approved Date</th>
                      <th>Issued Date</th>
                      <th>Status</th>
                      <th>Indent Report</th>
                      <th>Issue Report</th>
                      <th>Receiving Report</th>
                      <th>Return Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentData.length === 0 && !loading && !isSearching ? (
                      <tr>
                        <td colSpan={11} className="text-center">
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      indentData.map((item) => (
                        <tr key={item.indentId}>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.indentDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.indentNo}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.department}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.toDepartment}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.approvedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {formatDate(item.issuedDate)}
                          </td>
                          <td onClick={(e) => handleRowClick(item, e)} style={{ cursor: 'pointer' }}>
                            {item.status}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-success btn-sm text-nowrap"
                              onClick={() => handleIndentReport(item.indentId)}
                              disabled={reportLoading[`indent-${item.indentId}`]}
                            >
                              {reportLoading[`indent-${item.indentId}`] ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : "Report"}
                            </button>
                          </td>
                          <td>
                            {canShowIssueReport(item) ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm text-nowrap"
                                onClick={() => handleIssueReport(item.indentId)}
                                disabled={reportLoading[`issue-${item.indentId}`]}
                              >
                                {reportLoading[`issue-${item.indentId}`] ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : "Report"}
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            {canShowReceivingReport(item) ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm text-nowrap"
                                onClick={() => handleReceivingReport(item.indentId, item.statusCode)}
                                disabled={reportLoading[`receiving-${item.indentId}`]}
                              >
                                {reportLoading[`receiving-${item.indentId}`] ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : "Report"}
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            {canShowReturnReport(item) ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm text-nowrap"
                                onClick={() => handleReturnReport(item.indentId)}
                                disabled={reportLoading[`return-${item.indentId}`]}
                              >
                                {reportLoading[`return-${item.indentId}`] ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : "Report"}
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                totalItems={totalElements}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage + 1}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackIndent;