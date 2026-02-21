import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const RadiologyPACSStudyList = () => {
  const [data, setData] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchContact, setSearchContact] = useState("");
  const [searchModality, setSearchModality] = useState("");

  /* ---------------- SAMPLE DATA ---------------- */
  useEffect(() => {
    setTimeout(() => {
      setData([
        {
          id: 1,
          patientName: "Rahul Sharma",
          uhid: "UHID0001",
          age: 45,
          gender: "M",
          modality: "CT",
          contactNo: "9876543210",
          investigationName: "CT Brain",
          orderDate: "27-Jan-2026 9:10",
          studyDate: "28-Jan-2026 10:30",
          status: "Pending",
        },
        {
          id: 2,
          patientName: "Sunita Verma",
          uhid: "UHID0002",
          age: 32,
          gender: "F",
          modality: "MRI",
          contactNo: "9123456780",
          investigationName: "MRI Knee Joint",
          orderDate: "26-Jan-2026 1:02",
          studyDate: "27-Jan-2026 1:10",
          status: "Drafed",
        },
        {
          id: 3,
          patientName: "Ajay Kumar",
          uhid: "UHID0003",
          age: 60,
          gender: "M",
          modality: "XRAY",
          contactNo: "9988776655",
          investigationName: "XRAY Chest PA",
          orderDate: "27-Jan-2026 10:30",
          studyDate: "27-Jan-2026 11:10",
          status: "Completed",
        },
        {
          id: 4,
          patientName: "Neha Singh",
          uhid: "UHID0004",
          age: 29,
          gender: "F",
          modality: "USG",
          contactNo: "9012345678",
          investigationName: "USG Whole Abdomen",
          orderDate: "25-Jan-2026 9:20",
          studyDate: "26-Jan-2026 7:23",
          status: "Drafed",
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = data.filter((item) => {
    const matchesName =
      searchName.trim() === "" ||
      item.patientName?.toLowerCase().includes(searchName.trim().toLowerCase());
    const matchesModality =
      searchModality.trim() === "" ||
      item.modality
        ?.toLowerCase()
        .includes(searchModality.trim().toLowerCase());
    const matchesContact =
      searchContact.trim() === "" ||
      item.contactNo?.includes(searchContact.trim());

    return matchesName && matchesModality && matchesContact;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchModality]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- POPUP ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ---------------- ACTIONS ---------------- */
  const handleView = (row) => {
    showPopup(`Viewing record of ${row.patientName}`, "success");
  };

  const handleReport = (row) => {
    showPopup(`Opening report for ${row.patientName}`, "success");
  };

  const handleSearch = () => {
    // filtering logic yahan lagega
  };

  const handleReset = () => {
    setSearchName("");
    setSearchContact("");
    setSearchModality("");
  };
  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header">
          <h4 className="card-title">Radiology PACS Study List</h4>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {/* SEARCH */}
              <div className="row mb-3 align-items-end">
                {/* Patient Name */}
                <div className="col-md-3">
                  <label className="fw-bold mb-1">Patient Name</label>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search patient name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>

                {/* Contact No */}
                <div className="col-md-3">
                  <label className="fw-bold mb-1">Contact No.</label>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search contact number"
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                  />
                </div>

                {/* Modality */}
                <div className="col-md-3">
                  <label className="fw-bold mb-1">Modality</label>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search modality"
                    value={searchModality}
                    onChange={(e) => setSearchModality(e.target.value)}
                  />
                </div>

                {/* Buttons */}
                <div className="col-md-3 d-flex gap-2">
                  <button className="btn btn-primary" onClick={handleSearch}>
                    Search
                  </button>

                  <button className="btn btn-secondary" onClick={handleReset}>
                    Reset
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Patient Name</th>
                      <th>UHID</th>
                      <th>Age / Gender</th>
                      <th>Modality</th>
                      <th>Contact No.</th>
                      <th>Investigation Name</th>
                      <th>Order Date</th>
                      <th>Study Date</th>
                      <th> Report Status</th>
                      <th>Report</th>
                      <th>Dicom</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.patientName}</td>
                          <td>{item.uhid}</td>
                          <td>
                            {item.age} / {item.gender}
                          </td>
                          <td>{item.modality}</td>
                          <td>{item.contactNo}</td>
                          <td>{item.investigationName}</td>
                          <td>{item.orderDate}</td>
                          <td>{item.studyDate}</td>
                          <td>{item.status}</td>

                          <td>
                            {item.status === "Completed" && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleReport(item)}
                              >
                                View
                              </button>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleReport(item)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="text-center text-muted py-4"
                        >
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {popupMessage && <Popup {...popupMessage} />}
        </div>
      </div>
    </div>
  );
};

export default RadiologyPACSStudyList;
