import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const PrintBarcode = () => {
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search parameters state
  const [patientName, setPatientName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [orderNo, setOrderNo] = useState("");

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Get today's date
  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Get yesterday's date
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yyyy = yesterday.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Format date for display
  const formatDateTime = (date, time) => {
    return `${date} ${time}`;
  };

  // Handle search
  const handleSearch = () => {
    setIsGenerating(true);
    
    // Simulate search
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      setCurrentPage(1);
    }, 1000);
  };

  // Handle reset
  const handlereset = () => {
    setPatientName("");
    setMobileNo("");
    setOrderNo("");
    setShowReport(false);
    setCurrentPage(1);
  };

  // Handle print barcode
  const handlePrintBarcode = (item) => {
    showPopup(`Printing barcode for ${item.patientName} - Order #${item.orderNo}`, "success");
    // In a real application, this would trigger the barcode printing
  };

  // Static data for UI demonstration (latest records - last 1-2 days)
  const barcodeData = [
    {
      id: "1",
      regNo: "REG001",
      patientName: "Ritesh Kumar",
      mobileNo: "9876543212",
      age: "35",
      gender: "M",
      orderNo: "ORD-2026-001",
      orderDate: "19-Mar-2026",
      orderTime: "09:00 AM",
      billNo: "B12345",
      billDate: "19-Mar-2026"
    },
    {
      id: "2",
      regNo: "REG002",
      patientName: "Amit Sharma",
      mobileNo: "9765432145",
      age: "28",
      gender: "M",
      orderNo: "ORD-2026-002",
      orderDate: "19-Mar-2026",
      orderTime: "09:30 AM",
      billNo: "B12346",
      billDate: "19-Mar-2026"
    },
    {
      id: "3",
      regNo: "REG003",
      patientName: "Priya Patel",
      mobileNo: "9654321876",
      age: "32",
      gender: "F",
      orderNo: "ORD-2026-003",
      orderDate: "19-Mar-2026",
      orderTime: "10:15 AM",
      billNo: "B12347",
      billDate: "19-Mar-2026"
    },
    {
      id: "4",
      regNo: "REG004",
      patientName: "Sunil Verma",
      mobileNo: "9543218765",
      age: "45",
      gender: "M",
      orderNo: "ORD-2026-004",
      orderDate: "18-Mar-2026",
      orderTime: "02:30 PM",
      billNo: "B12348",
      billDate: "18-Mar-2026"
    },
    {
      id: "5",
      regNo: "REG005",
      patientName: "Anita Desai",
      mobileNo: "9432187654",
      age: "29",
      gender: "F",
      orderNo: "ORD-2026-005",
      orderDate: "18-Mar-2026",
      orderTime: "11:45 AM",
      billNo: "B12349",
      billDate: "18-Mar-2026"
    },
    {
      id: "6",
      regNo: "REG006",
      patientName: "Rajesh Gupta",
      mobileNo: "9321876543",
      age: "52",
      gender: "M",
      orderNo: "ORD-2026-006",
      orderDate: "18-Mar-2026",
      orderTime: "04:00 PM",
      billNo: "B12350",
      billDate: "18-Mar-2026"
    },
    {
      id: "7",
      regNo: "REG007",
      patientName: "Meera Singh",
      mobileNo: "9218765432",
      age: "41",
      gender: "F",
      orderNo: "ORD-2026-007",
      orderDate: "17-Mar-2026",
      orderTime: "10:00 AM",
      billNo: "B12351",
      billDate: "17-Mar-2026"
    },
    {
      id: "8",
      regNo: "REG008",
      patientName: "Vikram Reddy",
      mobileNo: "9187654321",
      age: "38",
      gender: "M",
      orderNo: "ORD-2026-008",
      orderDate: "17-Mar-2026",
      orderTime: "03:15 PM",
      billNo: "B12352",
      billDate: "17-Mar-2026"
    }
  ];

  // Filter data based on search (simulated for UI)
  const filteredData = barcodeData.filter(item => {
    const matchesPatientName = patientName === "" || 
      item.patientName.toLowerCase().includes(patientName.toLowerCase());
    const matchesMobileNo = mobileNo === "" || 
      item.mobileNo.includes(mobileNo);
    const matchesOrderNo = orderNo === "" || 
      item.orderNo.toLowerCase().includes(orderNo.toLowerCase());
    
    return matchesPatientName && matchesMobileNo && matchesOrderNo;
  });

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  // Show latest records by default (last 1-2 days)
  useEffect(() => {
    // Automatically show report on component mount
    setShowReport(true);
  }, []);

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">PRINT BARCODE</h4>
            </div>
            <div className="card-body">
              {/* Search Parameters Section */}
              <div className="row mb-4">
                {/* Patient Name */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Patient Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                {/* Mobile No */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      setMobileNo(value);
                    }}
                    maxLength="10"
                  />
                </div>

                {/* Order No */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Order No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter order number"
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                  />
                </div>

                {/* Buttons */}
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlereset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              

              {/* Loading State */}
              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {/* Report Table */}
              {!isGenerating && showReport && (
                <>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                        <tr>
                          <th>Reg No</th>
                          <th>Patient Name</th>
                          <th>Mobile</th>
                          <th>Age/Gender</th>
                          <th>Order No</th>
                          <th>Order Date/Time</th>
                          <th>Bill No</th>
                          <th>Bill Date</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-bold">{item.regNo}</td>
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.age}/{item.gender}</td>
                              <td className="fw-bold">{item.orderNo}</td>
                              <td>{item.orderDate} {item.orderTime}</td>
                              <td>{item.billNo}</td>
                              <td>{item.billDate}</td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handlePrintBarcode(item)}
                                  style={{ minWidth: "70px" }}
                                >
                                  PRINT
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={filteredData.length}
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
  );
};

export default PrintBarcode;