// export default PendingForMandatoryTestingList;
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const PendingForMandatoryTestingList = () => {
  const [data, setData] = useState([]);
  const [searchDonorName, setSearchDonorName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [documents, setDocuments] = useState([{ file: null }]);

  const [testList, setTestList] = useState([
    {
      testName: "HIV 1 & 2",
      mandatory: true,
      result: "",
      testDate: "",
      remarks: "",
    },
    {
      testName: "HBsAg",
      mandatory: true,
      result: "",
      testDate: "",
      remarks: "",
    },
    { testName: "HCV", mandatory: true, result: "", testDate: "", remarks: "" },
    {
      testName: "Syphilis",
      mandatory: true,
      result: "",
      testDate: "",
      remarks: "",
    },
    {
      testName: "Malaria",
      mandatory: true,
      result: "",
      testDate: "",
      remarks: "",
    },
    {
      testName: "NAT",
      mandatory: false,
      result: "",
      testDate: "",
      remarks: "",
    },
  ]);

  /* ---------------- SAMPLE DATA ---------------- */
  useEffect(() => {
    setTimeout(() => {
      setData([
        {
          id: 1,
          bagNo: "BAG-2025-001",
          donorRegNo: "DON-001",
          donorName: "Rakesh Sharma",
          bloodGroup: "O+",
          collectionType: "Whole Blood",
          bagType: "Triple",
          collectionDate: "18-Aug-2025 10:15",
          componentGenDate: "18-Aug-2025 12:40",
          components: 3,
          status: "COMPONENT_GENERATED",
        },
        {
          id: 2,
          bagNo: "BAG-2025-002",
          donorRegNo: "DON-002",
          donorName: "Sunita Verma",
          bloodGroup: "A+",
          collectionDate: "18-Aug-2025 11:05",
          collectionType: "Whole Blood",
          components: 2,
        },
        {
          id: 3,
          bagNo: "BAG-2025-003",
          donorRegNo: "DON-003",
          donorName: "Mohan Das",
          bloodGroup: "B+",
          collectionDate: "18-Aug-2025 11:40",
          collectionType: "Apheresis",
          components: 2,
        },
        {
          id: 4,
          bagNo: "BAG-2025-004",
          donorRegNo: "DON-004",
          donorName: "Anjali Singh",
          bloodGroup: "AB+",
          collectionDate: "19-Aug-2025 09:20",
          collectionType: "Whole Blood",
          components: 3,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredData = data.filter((item) =>
    item.donorName.toLowerCase().includes(searchDonorName.toLowerCase()),
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */
  const handleComponentClick = (record) => {
    setSelectedRecord(record);
    setShowDetailView(true);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedRecord(null);
  };

  const handleTestChange = (index, field, value) => {
    const updated = [...testList];
    updated[index][field] = value;
    setTestList(updated);
  };

  const handleFileChange = (index, file) => {
    const updated = [...documents];
    updated[index].file = file;
    setDocuments(updated);
  };

  const handleAddDocument = () => {
    setDocuments([...documents, { file: null }]);
  };

  const handleRemoveDocument = (index) => {
    if (documents.length === 1) {
      const updated = [...documents];
      updated[0].file = null;
      setDocuments(updated);
    } else {
      setDocuments(documents.filter((_, i) => i !== index));
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
  };

  const handleSave = () => {
    console.log("Save clicked");
  };

  const handleSubmit = () => {
    console.log("Submit clicked");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      {showDetailView && selectedRecord ? (
        <>
          {/* ================= Donation / Processing Information ================= */}
          <div className="row">
            <div className="col-12">
              <div className="card form-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title ">
                    <i className="mdi mdi-flask me-2"></i>
                    Mandatory Testing – Test Entry Screen
                  </h4>
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackToList}
                  >
                    <i className="fa fa-arrow-left me-2"></i>
                    Back to List
                  </button>
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card shadow mb-3 mt-4">
                    <div className="card-header py-3 px-4 border-bottom-1">
                      <h6 className="mb-0 fw-bold">Donation Information</h6>
                    </div>

                    <div className="card-body">
                      <div className="table-responsive">
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-bold w-25">Bag No</td>
                                <td>{selectedRecord.bagNo}</td>
                                <td className="fw-bold w-25">Donor Reg No</td>
                                <td>{selectedRecord.donorRegNo}</td>
                              </tr>

                              <tr>
                                <td className="fw-bold">Donor Name</td>
                                <td>{selectedRecord.donorName}</td>
                                <td className="fw-bold">Blood Group</td>
                                <td>
                                  <span className="badge bg-danger">
                                    {selectedRecord.bloodGroup}
                                  </span>
                                </td>
                              </tr>

                              <tr>
                                <td className="fw-bold">Collection Type</td>
                                <td>{selectedRecord.collectionType}</td>
                                <td className="fw-bold">Bag Type</td>
                                <td>{selectedRecord.bagType}</td>
                              </tr>

                              <tr>
                                <td className="fw-bold">
                                  Blood Collection Date & Time
                                </td>
                                <td>{selectedRecord.collectionDate}</td>
                                <td className="fw-bold">
                                  Component Generation Date & Time
                                </td>
                                <td>{selectedRecord.componentGenDate}</td>
                              </tr>

                              <tr>
                                <td className="fw-bold">No. of Components</td>
                                <td>{selectedRecord.components}</td>
                                <td className="fw-bold">Current Status</td>
                                <td>
                                  <span className="badge bg-success">
                                    {selectedRecord.status}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= Mandatory Testing – Test Result Grid ================= */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 px-4 border-bottom-1">
                  <h6 className="fw-bold mb-0">Test Result Grid</h6>
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "25%" }}>Test Name</th>
                          <th style={{ width: "10%" }}>Mandatory</th>
                          <th style={{ width: "20%" }}>Result</th>
                          <th style={{ width: "20%" }}>Test Date</th>
                          <th style={{ width: "25%" }}>Remarks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {testList.map((test, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{test.testName}</td>
                            <td className="text-center">
                              {test.mandatory ? (
                                <span className="badge bg-danger">Yes</span>
                              ) : (
                                <span className="badge bg-secondary">No</span>
                              )}
                            </td>

                            {/* Result */}
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={test.result}
                                onChange={(e) =>
                                  handleTestChange(
                                    index,
                                    "result",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">Select</option>
                                <option value="REACTIVE">Reactive</option>
                                <option value="NON_REACTIVE">
                                  Non Reactive
                                </option>
                              </select>
                            </td>

                            {/* Test Date */}
                            <td>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={test.testDate}
                                onChange={(e) =>
                                  handleTestChange(
                                    index,
                                    "testDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            {/* Remarks */}
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Optional"
                                value={test.remarks}
                                onChange={(e) =>
                                  handleTestChange(
                                    index,
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Documents Card */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 px-4 border-bottom-1">
                  <h6 className="fw-bold mb-0">Upload Documents</h6>
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "10%" }}>Sr No</th>
                          <th>Document</th>
                          <th style={{ width: "25%" }}>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {documents.map((doc, index) => (
                          <tr key={index}>
                            <td className="fw-bold text-center">{index + 1}</td>

                            <td>
                              <input
                                type="file"
                                className="form-control form-control-sm"
                                onChange={(e) =>
                                  handleFileChange(index, e.target.files[0])
                                }
                              />
                            </td>

                            <td>
                              <div className="d-flex gap-2 justify-content-center">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={handleAddDocument}
                                >
                                  Add
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRemoveDocument(index)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons Card */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-body d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ================= LIST PAGE ================= */
        <div className="card form-card">
          <div className="card-header">
            <h4>Pending for Mandatory Testing List</h4>
          </div>

          <div className="card-body">
            {loading ? (
              <LoadingScreen />
            ) : (
              <>
                <div className="mb-3">
                  <div className="row align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-bold mb-1">
                        Donor Name
                      </label>
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Enter Donor Name"
                        value={searchDonorName}
                        onChange={(e) => setSearchDonorName(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4 d-flex">
                      <button
                        className="btn btn-primary me-2"
                        onClick={() => setCurrentPage(1)}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
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
                      {currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleComponentClick(item)}
                          style={{ cursor: "pointer" }}
                          className="table-row-hover"
                        >
                          <td>{item.bagNo}</td>
                          <td>{item.donorRegNo}</td>
                          <td>{item.donorName}</td>
                          <td>{item.bloodGroup}</td>
                          <td>{item.collectionDate}</td>
                          <td>{item.collectionType}</td>
                          <td className="text-center fw-bold">
                            {item.components}
                          </td>
                        </tr>
                      ))}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingForMandatoryTestingList;
