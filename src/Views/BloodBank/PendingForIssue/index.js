import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";

const PendingForIssue = () => {
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  
  const [searchParams, setSearchParams] = useState({
    requestNo: "",
    patientName: "",
    department: "",
  })
  
  const [filteredList, setFilteredList] = useState([])
  

  useEffect(() => {
    fetchPendingForIssueData()
  }, [])

  const fetchPendingForIssueData = async () => {
    setLoading(true)
    try {
      const mockData = [
        
        {
          id: 3,
          requestNo: "BR-00127",
          inpatientNo: "IP-1067",
          patientName: "Amit Patel",
          bloodGroup: "A+",
          component: "FFP",
          unitsReserved: 2,
          requestDept: "ICU",
          urgency: "Urgent",
          requiredBy: "15-Aug-2025 16:00",
          reservedOn: "15-Aug-2025 10:30",
          status: "CROSSMATCHDONE"
        },
        {
          id: 4,
          requestNo: "BR-00128",
          inpatientNo: "IP-1089",
          patientName: "Priya Sharma",
          bloodGroup: "AB+",
          component: "PRBC",
          unitsReserved: 3,
          requestDept: "Surgery",
          urgency: "Emergency",
          requiredBy: "ASAP",
          reservedOn: "15-Aug-2025 09:45",
          status: "CROSSMATCHDONE"
        },
        {
          id: 5,
          requestNo: "BR-00129",
          inpatientNo: "IP-1092",
          patientName: "Vikram Singh",
          bloodGroup: "O-",
          component: "PRBC",
          unitsReserved: 2,
          requestDept: "Emergency",
          urgency: "Emergency",
          requiredBy: "ASAP",
          reservedOn: "14-Aug-2025 23:15",
          status: "CROSSMATCHDONE"
        },
        {
          id: 6,
          requestNo: "BR-00130",
          inpatientNo: "IP-1101",
          patientName: "Meera Reddy",
          bloodGroup: "B-",
          component: "Cryo",
          unitsReserved: 5,
          requestDept: "Pediatrics",
          urgency: "Urgent",
          requiredBy: "16-Aug-2025 10:00",
          reservedOn: "15-Aug-2025 08:20",
          status: "CROSSMATCHDONE"
        },
        {
          id: 7,
          requestNo: "BR-00131",
          inpatientNo: "IP-1115",
          patientName: "Suresh Nair",
          bloodGroup: "A-",
          component: "PRBC",
          unitsReserved: 2,
          requestDept: "General Ward",
          urgency: "Routine",
          requiredBy: "17-Aug-2025 09:00",
          reservedOn: "15-Aug-2025 14:30",
          status: "CROSSMATCHDONE"
        },
        {
          id: 8,
          requestNo: "BR-00132",
          inpatientNo: "IP-1128",
          patientName: "Lakshmi K",
          bloodGroup: "O+",
          component: "Platelet",
          unitsReserved: 1,
          requestDept: "ICU",
          urgency: "Emergency",
          requiredBy: "ASAP",
          reservedOn: "15-Aug-2025 13:10",
          status: "CROSSMATCHDONE"
        }
      ];
      
      setPendingList(mockData);
      setFilteredList(mockData);
    } catch (error) {
      console.error("Error fetching pending for issue data:", error);
      setPendingList([]);
      setFilteredList([]);
      showPopup("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSearch = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  // Dynamic search effect
  useEffect(() => {
    let filtered = pendingList;
    
    if (searchParams.requestNo.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.requestNo?.toLowerCase().includes(searchParams.requestNo.trim().toLowerCase())
      );
    }
    
    if (searchParams.patientName.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.patientName?.toLowerCase().includes(searchParams.patientName.trim().toLowerCase())
      );
    }
    
    if (searchParams.department.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.requestDept?.toLowerCase().includes(searchParams.department.trim().toLowerCase())
      );
    }
    
    setFilteredList(filtered);
    setCurrentPage(1);
  }, [searchParams, pendingList]);

  // Keep filteredList in sync if pendingList changes
  useEffect(() => {
    setFilteredList(pendingList)
  }, [pendingList])

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredList.slice(indexOfFirst, indexOfLast);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleIssue = async (requestNo) => {
    // Handle issue action - can be expanded later
    showPopup(`Issue action for request ${requestNo}`, "info");
  }

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return <span className="badge bg-danger">Emergency</span>;
      case "urgent":
        return <span className="badge bg-warning text-dark">Urgent</span>;
      case "routine":
        return <span className="badge bg-info">Routine</span>;
      default:
        return <span className="badge bg-secondary">{urgency}</span>;
    }
  };

  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Pending for Issue</h4>
            </div>
            
            <div className="card-body">
             

              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Request No</th>
                      <th>Inpatient</th>
                      <th>Patient</th>
                      <th>Blood Group</th>
                      <th>Component</th>
                      <th>Units Reserved</th>
                      <th>Request Dept</th>
                      <th>Urgency</th>
                      <th>Required By</th>
                      <th>Reserved On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.requestNo}</td>
                          <td>{item.inpatientNo}</td>
                          <td>{item.patientName}</td>
                          <td><span className="badge bg-danger">{item.bloodGroup}</span></td>
                          <td>{item.component}</td>
                          <td className="text-center fw-bold">{item.unitsReserved}</td>
                          <td>{item.requestDept}</td>
                          <td>{getUrgencyBadge(item.urgency)}</td>
                          <td className={item.requiredBy === "ASAP" ? "fw-bold text-danger" : ""}>
                            {item.requiredBy}
                          </td>
                          <td>{item.reservedOn}</td>
                         
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          <div className="text-muted">
                            <h6 className="mt-2">No pending issue requests found</h6>
                            <p className="mb-0">All cross-matched requests have been issued</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredList.length > 0 && (
                <Pagination
                  totalItems={filteredList.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
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
      </div>
    </div>
  )
}

export default PendingForIssue