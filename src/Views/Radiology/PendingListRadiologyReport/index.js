import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingListRadiologyReport = () => {
  const navigate = useNavigate();
  
  // State for data
  const [xrayData, setXrayData] = useState([
    {
      id: 1,
      accessionNo: "ACC001234",
      uhid: "UHID12345",
      patientName: "John Doe",
      age: "45 Y",
      gender: "Male",
      contactNo: "9876543210",
      modality: "X-Ray",
      investigationName: "Chest X-Ray PA View",
      orderDate: "20/02/2026",
      orderTime: "10:30",
      studyDate: "20/02/2026",
      studyTime: "11:15"
    },
    {
      id: 2,
      accessionNo: "ACC001235",
      uhid: "UHID12346",
      patientName: "Jane Smith",
      age: "32 Y",
      gender: "Female",
      contactNo: "9876543211",
      modality: "X-Ray",
      investigationName: "X-Ray Both Knees AP/Lateral",
      orderDate: "20/02/2026",
      orderTime: "11:45",
      studyDate: "20/02/2026",
      studyTime: "12:30"
    },
    {
      id: 3,
      accessionNo: "ACC001236",
      uhid: "UHID12347",
      patientName: "Robert Johnson",
      age: "58 Y",
      gender: "Male",
      contactNo: "9876543212",
      modality: "X-Ray",
      investigationName: "X-Ray Lumbar Spine AP/Lateral",
      orderDate: "20/02/2026",
      orderTime: "09:15",
      studyDate: "20/02/2026",
      studyTime: "10:00"
    },
    {
      id: 4,
      accessionNo: "ACC001237",
      uhid: "UHID12348",
      patientName: "Mary Williams",
      age: "28 Y",
      gender: "Female",
      contactNo: "9876543213",
      modality: "X-Ray",
      investigationName: "X-Ray Right Wrist PA/Lateral",
      orderDate: "19/02/2026",
      orderTime: "15:20",
      studyDate: "19/02/2026",
      studyTime: "16:05"
    },
    {
      id: 5,
      accessionNo: "ACC001238",
      uhid: "UHID12349",
      patientName: "David Brown",
      age: "67 Y",
      gender: "Male",
      contactNo: "9876543214",
      modality: "X-Ray",
      investigationName: "X-Ray Chest PA View",
      orderDate: "19/02/2026",
      orderTime: "14:10",
      studyDate: "19/02/2026",
      studyTime: "14:55"
    },
    {
      id: 6,
      accessionNo: "ACC001239",
      uhid: "UHID12350",
      patientName: "Sarah Davis",
      age: "41 Y",
      gender: "Female",
      contactNo: "9876543215",
      modality: "CT",
      investigationName: "CT Brain Plain",
      orderDate: "20/02/2026",
      orderTime: "13:00",
      studyDate: "20/02/2026",
      studyTime: "13:45"
    },
    {
      id: 7,
      accessionNo: "ACC001240",
      uhid: "UHID12351",
      patientName: "Michael Wilson",
      age: "52 Y",
      gender: "Male",
      contactNo: "9876543216",
      modality: "MRI",
      investigationName: "MRI Lumbar Spine",
      orderDate: "20/02/2026",
      orderTime: "08:30",
      studyDate: "20/02/2026",
      studyTime: "09:15"
    }
  ]);

  // State for loading
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);

  // Search states
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchMobileNo, setSearchMobileNo] = useState("");
  const [searchModality, setSearchModality] = useState("");

  // Modality options for filter
  const modalityOptions = [
    "All Modalities",
    "X-Ray",
    "MRI",
    "CT",
    "Ultrasound",
    "Mammography",
    "Fluoroscopy",
    "Angiography",
    "Nuclear Medicine",
    "PET-CT",
    "DEXA"
  ];

  // Filter data based on search criteria
  const filteredData = xrayData.filter(item => {
    const matchesName = item.patientName.toLowerCase().includes(searchPatientName.toLowerCase());
    const matchesMobile = item.contactNo.includes(searchMobileNo);
    const matchesModality = searchModality === "" || searchModality === "All Modalities" || item.modality === searchModality;
    
    return matchesName && matchesMobile && matchesModality;
  });

  // Pagination
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    showPopup("Search completed", "success");
  };

  // Handle reset
  const handleReset = () => {
    setSearchPatientName("");
    setSearchMobileNo("");
    setSearchModality("");
    setCurrentPage(1);
    showPopup("Filters reset successfully", "info");
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Navigate to detailed report page
  const handleRowClick = (item) => {
    navigate('/DetailedRadiologyReportPage');
  };

  // Show popup
  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title"> Pending List for Radiology Report</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Search Fields */}
                  <div className="mb-4">
                    <div className="row align-items-end">
                      {/* Patient Name Search */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter patient name"
                            value={searchPatientName}
                            onChange={(e) => setSearchPatientName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Mobile Number Search */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Mobile Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter mobile number"
                            value={searchMobileNo}
                            onChange={(e) => setSearchMobileNo(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Modality Filter */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="form-label fw-bold">Modality</label>
                          <select
                            className="form-select"
                            value={searchModality}
                            onChange={(e) => setSearchModality(e.target.value)}
                          >
                            <option value="">All Modalities</option>
                            {modalityOptions.slice(1).map((modality, index) => (
                              <option key={index} value={modality}>
                                {modality}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Search and Reset Buttons */}
                      <div className="col-md-2">
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary flex-grow-1"
                            onClick={handleSearch}
                          >
                            <i className="mdi mdi-magnify"></i> Search
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleReset}
                          >
                            <i className="mdi mdi-refresh"></i> Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Record count */}
                    
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Accession No</th>
                          <th>UHID</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile No</th>
                          <th>Modality</th>
                          <th>Investigation</th>
                          <th>Order Date/Time</th>
                          <th>Study Date/Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr 
                              key={item.id} 
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: 'pointer' }}
                              className="table-row-hover"
                            >
                              <td>
                                <span>{item.accessionNo}</span>
                              </td>
                              <td>
                                <span >{item.uhid}</span>
                              </td>
                              <td>
                                <span>
                                  {item.patientName}
                                </span>
                              </td>
                              <td>{item.age} / {item.gender}</td>
                              <td>{item.contactNo}</td>
                              <td>
                                <span>{item.modality}</span>
                              </td>
                              <td>{item.investigationName}</td>
                              <td>
                                <div>{item.orderDate}         {item.orderTime}</div>
                              </td>
                              <td>
                                <div>{item.studyDate} {item.studyTime}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <i className="mdi mdi-alert-circle-outline" style={{ fontSize: '48px', color: '#ccc' }}></i>
                              <p className="mt-2 text-muted">No investigations found matching your criteria</p>
                              {(searchPatientName || searchMobileNo || searchModality) && (
                                <button
                                  className="btn btn-sm btn-outline-secondary mt-2"
                                  onClick={handleReset}
                                >
                                  Clear Filters
                                </button>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}

              {/* Popup Message */}
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

      {/* Custom Styles */}
      <style jsx>{`
        .table-row-hover:hover {
          background-color: rgba(0, 123, 255, 0.05);
          transition: background-color 0.2s ease;
        }
        .table-row-hover:hover td span.fw-bold {
          color: #0056b3 !important;
        }
      `}</style>
    </div>
  );
};

export default PendingListRadiologyReport;