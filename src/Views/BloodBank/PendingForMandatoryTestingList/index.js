import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingForMandatoryTestingList = () => {
  const [data, setData] = useState([]);
  const [searchBagNo, setSearchBagNo] = useState("");
  const [searchDonorName, setSearchDonorName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [popupMessage, setPopupMessage] = useState(null);

  /* ---------------- SAMPLE DATA (AS PER IMAGE) ---------------- */
  useEffect(() => {
  setTimeout(() => {
    setData([
      {
        id: 1,
        bagNo: "BAG-2025-001",
        donorRegNo: "DON-001",
        donorName: "Rakesh Sharma",
        bloodGroup: "O+",
        collectionDate: "18-Aug-2025 10:15",
        collectionType: "Whole Blood",
        components: 3
      },
      {
        id: 2,
        bagNo: "BAG-2025-002",
        donorRegNo: "DON-002",
        donorName: "Sunita Verma",
        bloodGroup: "A+",
        collectionDate: "18-Aug-2025 11:05",
        collectionType: "Whole Blood",
        components: 2
      },
      {
        id: 3,
        bagNo: "BAG-2025-003",
        donorRegNo: "DON-003",
        donorName: "Mohan Das",
        bloodGroup: "B+",
        collectionDate: "18-Aug-2025 11:40",
        collectionType: "Apheresis",
        components: 2
      },
      {
        id: 4,
        bagNo: "BAG-2025-004",
        donorRegNo: "DON-004",
        donorName: "Anjali Singh",
        bloodGroup: "AB+",
        collectionDate: "19-Aug-2025 09:20",
        collectionType: "Whole Blood",
        components: 3
      },
      {
        id: 5,
        bagNo: "BAG-2025-005",
        donorRegNo: "DON-005",
        donorName: "Vikas Gupta",
        bloodGroup: "O-",
        collectionDate: "19-Aug-2025 10:50",
        collectionType: "Apheresis",
        components: 1
      },
      {
        id: 6,
        bagNo: "BAG-2025-006",
        donorRegNo: "DON-006",
        donorName: "Neha Kapoor",
        bloodGroup: "B-",
        collectionDate: "19-Aug-2025 12:10",
        collectionType: "Whole Blood",
        components: 2
      },
      {
        id: 7,
        bagNo: "BAG-2025-007",
        donorRegNo: "DON-007",
        donorName: "Rahul Mehra",
        bloodGroup: "A-",
        collectionDate: "20-Aug-2025 09:00",
        collectionType: "Whole Blood",
        components: 3
      },
      {
        id: 8,
        bagNo: "BAG-2025-008",
        donorRegNo: "DON-008",
        donorName: "Pooja Nair",
        bloodGroup: "AB-",
        collectionDate: "20-Aug-2025 11:30",
        collectionType: "Apheresis",
        components: 2
      },
      {
        id: 9,
        bagNo: "BAG-2025-009",
        donorRegNo: "DON-009",
        donorName: "Suresh Yadav",
        bloodGroup: "O+",
        collectionDate: "20-Aug-2025 02:15",
        collectionType: "Whole Blood",
        components: 3
      },
      {
        id: 10,
        bagNo: "BAG-2025-010",
        donorRegNo: "DON-010",
        donorName: "Kavita Joshi",
        bloodGroup: "A+",
        collectionDate: "21-Aug-2025 10:00",
        collectionType: "Whole Blood",
        components: 2
      }
    ]);

    setLoading(false);
  }, 600);
}, []);


  /* ---------------- SEARCH ---------------- */
  const filteredData = data.filter(item => {
    const bagMatch = searchBagNo === "" || item.bagNo.toLowerCase().includes(searchBagNo.toLowerCase());
    const donorMatch = searchDonorName === "" || item.donorName.toLowerCase().includes(searchDonorName.toLowerCase());
    return bagMatch && donorMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchBagNo, searchDonorName]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- RESET ---------------- */
  const handleReset = () => {
    setSearchBagNo("");
    setSearchDonorName("");
    setCurrentPage(1);
  };

  /* ---------------- POPUP ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Pending for Mandatory Testing List</h4>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {/* SEARCH SECTION (SAME STYLE AS RADIOLOGY) */}
              <div className="mb-3">
                <div className="row align-items-end">
                  
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Donor Name</label>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Enter Donor Name"
                      value={searchDonorName}
                      onChange={e => setSearchDonorName(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 d-flex">
                    <button className="btn btn-primary me-2" onClick={() => setCurrentPage(1)}>
                      Search
                    </button>
                   
                  </div>
                </div>

              </div>

              {/* TABLE */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Bag No</th>
                      <th>Donor Reg No</th>
                      <th>Donor Name</th>
                      <th>Blood Group</th>
                      <th>Collection Date</th>
                      <th>Collection Type</th>
                      <th>No. of Components</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.bagNo}</td>
                          <td>{item.donorRegNo}</td>
                          <td>{item.donorName}</td>
                          <td>{item.bloodGroup}</td>
                          <td>{item.collectionDate}</td>
                          <td>{item.collectionType}</td>
                          <td className="text-center">{item.components}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No records found
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
          )}

          {popupMessage && <Popup {...popupMessage} />}
        </div>
      </div>
    </div>
  );
};

export default PendingForMandatoryTestingList;
