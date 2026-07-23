import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  LABOLATORY_MAIN_CHARGECODE_ID,
  MAS_INVESTIGATION,
  REDIOLOGY_MAIN_CHARGECODE_ID,
  SAVE_IPD_INVESTIGATION_ORDER,
} from "../../../config/apiConfig";

const dummyLabOrders = [
  {
    orderNo: "LAB-001",
    orderDate: "10-Apr-2026",
    patientName: "John Doe",
    mobileNo: "9876543210",
    ageGender: "45 / M",
    sampleId: "SMP-12345",
    investigationName: "CBC, LFT",
    investigationStatus: "Completed",
    report: "View / Download",
  },
  {
    orderNo: "LAB-002",
    orderDate: "09-Apr-2026",
    patientName: "Jane Smith",
    mobileNo: "9876543211",
    ageGender: "32 / F",
    sampleId: "SMP-12346",
    investigationName: "Thyroid Profile",
    investigationStatus: "In Progress",
    report: "Pending",
  },
  {
    orderNo: "LAB-003",
    orderDate: "08-Apr-2026",
    patientName: "Robert Brown",
    mobileNo: "9876543212",
    ageGender: "28 / M",
    sampleId: "SMP-12347",
    investigationName: "Urine Routine",
    investigationStatus: "Collected",
    report: "Pending",
  },
];

const dummyRadiologyOrders = [
  {
    orderNo: "RAD-001",
    orderDate: "10-Apr-2026",
    patientName: "Alice Johnson",
    mobileNo: "9876543213",
    ageGender: "55 / F",
    investigationName: "X-Ray Chest",
    investigationStatus: "Completed",
    report: "View / Download",
    dicomEye: "View Study",
  },
  {
    orderNo: "RAD-002",
    orderDate: "09-Apr-2026",
    patientName: "Michael Lee",
    mobileNo: "9876543214",
    ageGender: "62 / M",
    investigationName: "CT Scan Abdomen",
    investigationStatus: "Scheduled",
    report: "Pending",
    dicomEye: "Not Available",
  },
  {
    orderNo: "RAD-003",
    orderDate: "08-Apr-2026",
    patientName: "Emma Wilson",
    mobileNo: "9876543215",
    ageGender: "40 / F",
    investigationName: "MRI Brain",
    investigationStatus: "Report Ready",
    report: "View / Download",
    dicomEye: "View Study",
  },
];

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination justify-content-end mt-3">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)} type="button">
            Previous
          </button>
        </li>
        {[...Array(totalPages)].map((_, i) => (
          <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(i + 1)} type="button">
              {i + 1}
            </button>
          </li>
        ))}
        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)} type="button">
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

const normalizeLabInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  testName: item?.testName ?? item?.investigationName ?? item?.name ?? "",
  sample: item?.sample ?? item?.sampleName ?? item?.sampleDescription ?? "",
  container: item?.container ?? item?.collectionName ?? item?.containerName ?? "",
  resultUnit: item?.resultUnit ?? item?.uomName ?? item?.unitName ?? "",
});

const normalizeRadiologyInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  name: item?.name ?? item?.investigationName ?? "",
});

const InvestigationOrderandTracking = ({ selectedPatient }) => {
  const [activeTab, setActiveTab] = useState("lab");
  const [labTests, setLabTests] = useState([]);
  const [radiologyTests, setRadiologyTests] = useState([]);

  const createLabRow = () => ({
    id: Date.now(),
    testName: "",
    sample: "",
    container: "",
    resultUnit: "",
    remarks: "",
    dropdownOpen: false,
    searchText: "",
  });

  const createRadiologyRow = () => ({
    id: Date.now(),
    investigation: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
    dropdownOpen: false,
    searchText: "",
  });

  const [labRows, setLabRows] = useState([createLabRow()]);

  const [radiologyRows, setRadiologyRows] = useState([createRadiologyRow()]);

  const [trackingType, setTrackingType] = useState("lab");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const [labRes, radiologyRes] = await Promise.all([
          getRequest(`${MAS_INVESTIGATION}/getAll/0?mainChargeCodeId=${LABOLATORY_MAIN_CHARGECODE_ID}`),
          getRequest(`${MAS_INVESTIGATION}/getAll/0?mainChargeCodeId=${REDIOLOGY_MAIN_CHARGECODE_ID}`),
        ]);

        if (labRes?.status === 200 && Array.isArray(labRes.response)) {
          setLabTests(labRes.response.map(normalizeLabInvestigation));
        }

        if (radiologyRes?.status === 200 && Array.isArray(radiologyRes.response)) {
          setRadiologyTests(radiologyRes.response.map(normalizeRadiologyInvestigation));
        }
      } catch (error) {
        console.error("Error fetching investigations:", error);
      }
    };

    fetchInvestigations();
  }, []);

  const paginatedLabOrders = dummyLabOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedRadiologyOrders = dummyRadiologyOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleTrackingTypeChange = (type) => {
    setTrackingType(type);
    setCurrentPage(1);
  };

  const addLabRow = () => {
    setLabRows([...labRows, createLabRow()]);
  };

  const updateLabRow = (id, field, value) => {
    setLabRows(labRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const selectLabTest = (id, test) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id
          ? {
              ...row,
              testName: test.testName,
              sample: test.sample,
              container: test.container,
              resultUnit: test.resultUnit,
              searchText: test.testName,
              dropdownOpen: false,
            }
          : row,
      ),
    );
  };

  const deleteLabRow = (id) => {
    if (labRows.length === 1) return;
    setLabRows(labRows.filter((row) => row.id !== id));
  };

  const handleLabTestNameChange = (id, value) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id
          ? { ...row, searchText: value, testName: "", sample: "", container: "", resultUnit: "", dropdownOpen: true }
          : row,
      ),
    );
  };

  const toggleLabDropdown = (id, open) => {
    setLabRows(labRows.map((row) => (row.id === id ? { ...row, dropdownOpen: open } : row)));
  };

  const handleLabBlur = (id) => {
    setTimeout(() => toggleLabDropdown(id, false), 150);
  };

  const getFilteredLabTests = (searchText) => {
    if (!searchText) return labTests;
    return labTests.filter((test) => (test.testName || "").toLowerCase().includes(searchText.toLowerCase()));
  };

  const addRadiologyRow = () => {
    setRadiologyRows([...radiologyRows, createRadiologyRow()]);
  };

  const updateRadiologyRow = (id, field, value) => {
    setRadiologyRows(radiologyRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const selectRadiologyTest = (id, test) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id
          ? { ...row, investigation: test.name, searchText: test.name, dropdownOpen: false }
          : row,
      ),
    );
  };

  const deleteRadiologyRow = (id) => {
    if (radiologyRows.length === 1) return;
    setRadiologyRows(radiologyRows.filter((row) => row.id !== id));
  };

  const handleRadiologySearchChange = (id, value) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, searchText: value, investigation: "", dropdownOpen: true } : row,
      ),
    );
  };

  const toggleRadiologyDropdown = (id, open) => {
    setRadiologyRows(radiologyRows.map((row) => (row.id === id ? { ...row, dropdownOpen: open } : row)));
  };

  const handleRadiologyBlur = (id) => {
    setTimeout(() => toggleRadiologyDropdown(id, false), 150);
  };

  const getFilteredRadiologyTests = (searchText) => {
    if (!searchText) return radiologyTests;
    return radiologyTests.filter((test) => (test.name || "").toLowerCase().includes(searchText.toLowerCase()));
  };

  const handleSaveLab = () => {
    handleSaveInvestigations("lab");
  };

  const handleSaveRadiology = () => {
    handleSaveInvestigations("radiology");
  };

  const buildPayloadRows = (rows, type) =>
    rows
      .filter((row) => row.searchText?.trim())
      .map((row) => {
        const matchedTest = type === "lab"
          ? labTests.find((test) => test.testName === row.testName || test.testName === row.searchText)
          : radiologyTests.find((test) => test.name === row.investigation || test.name === row.searchText);

        return {
          id: matchedTest?.id ?? null,
          appointmentDate: type === "radiology" ? row.date || null : null,
          checkStatus: true,
          remarks: row.remarks || "",
          type,
          sample: row.sample || "",
          container: row.container || "",
          resultUnit: row.resultUnit || "",
        };
      })
      .filter((row) => row.id != null);

  const handleSaveInvestigations = async (type) => {
    if (!selectedPatient?.patientId || !selectedPatient?.inpatientId) {
      Swal.fire({
        icon: "warning",
        title: "Patient not selected",
        text: "Please select an admitted IPD patient before saving investigations.",
      });
      return;
    }

    const rows = type === "lab" ? labRows : radiologyRows;
    const investigationReq = buildPayloadRows(rows, type);

    if (investigationReq.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No investigations",
        text: "Please add at least one investigation before saving.",
      });
      return;
    }

    const payload = {
      patientId: selectedPatient.patientId,
      inpatientId: selectedPatient.inpatientId,
      investigationReq,
    };

    try {
      const response = await postRequest(SAVE_IPD_INVESTIGATION_ORDER, payload);
      if (response?.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Saved",
          text: response?.message || "Investigations saved successfully.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Save failed",
          text: response?.message || "Unable to save investigations.",
        });
      }
    } catch (error) {
      console.error("Error saving investigations:", error);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "Something went wrong while saving investigations.",
      });
    }
  };

  const handleViewReport = (order) => {
    alert(`Viewing report for order: ${order.orderNo}`);
  };

  const handleViewDicomEye = (order) => {
    alert(`Opening DICOM study for order: ${order.orderNo}`);
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === "lab" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("lab")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Lab Investigation
        </button>
        <button
          className={`btn btn-sm ${activeTab === "radiology" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("radiology")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Radiology Investigation
        </button>
        <button
          className={`btn btn-sm ${activeTab === "tracking" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("tracking")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
          type="button"
        >
          Order Tracking
        </button>
      </div>

      {activeTab === "lab" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <strong>Lab Investigation Order Entry</strong>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addLabRow}
              title="Add test"
            >
              <i className="mdi mdi-plus"></i> + Add
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "5%" }}>S.No</th>
                    <th style={{ width: "20%" }}>Test Name</th>
                    <th style={{ width: "12%" }}>Sample</th>
                    <th style={{ width: "12%" }}>Container</th>
                    <th style={{ width: "15%" }}>Result Unit</th>
                    <th style={{ width: "20%" }}>Remarks</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labRows.map((row, idx) => {
                    const filteredTests = getFilteredLabTests(row.searchText);
                    return (
                      <tr key={row.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="position-relative">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            onChange={(e) => handleLabTestNameChange(row.id, e.target.value)}
                            onFocus={() => toggleLabDropdown(row.id, true)}
                            onBlur={() => handleLabBlur(row.id)}
                            placeholder="Type or select test"
                          />
                          {row.dropdownOpen && filteredTests.length > 0 && (
                            <ul
                              className="list-group position-absolute w-100 mt-1"
                              style={{
                                zIndex: 1000,
                                maxHeight: "200px",
                                overflowY: "auto",
                                backgroundColor: "#fff",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              {filteredTests.map((test) => (
                                <li
                                  key={test.id}
                                  className="list-group-item list-group-item-action"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => selectLabTest(row.id, test)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {test.testName}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.sample}
                            onChange={(e) => updateLabRow(row.id, "sample", e.target.value)}
                            placeholder="Sample type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.container}
                            onChange={(e) => updateLabRow(row.id, "container", e.target.value)}
                            placeholder="Container"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.resultUnit}
                            onChange={(e) => updateLabRow(row.id, "resultUnit", e.target.value)}
                            placeholder="Unit"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) => updateLabRow(row.id, "remarks", e.target.value)}
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteLabRow(row.id)}
                            disabled={labRows.length === 1}
                            title="Delete row"
                          >
                            <i className="mdi mdi-delete"></i> X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-primary btn-sm" onClick={handleSaveLab} type="button">
                Save Lab Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "radiology" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
            <strong>Radiology Investigation Order Entry</strong>
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addRadiologyRow}
              title="Add investigation"
            >
              <i className="mdi mdi-plus"></i> + Add
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "5%" }}>S.No</th>
                    <th style={{ width: "35%" }}>Investigation</th>
                    <th style={{ width: "20%" }}>Date</th>
                    <th style={{ width: "25%" }}>Remarks</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {radiologyRows.map((row, idx) => {
                    const filteredTests = getFilteredRadiologyTests(row.searchText);
                    return (
                      <tr key={row.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="position-relative">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            onChange={(e) => handleRadiologySearchChange(row.id, e.target.value)}
                            onFocus={() => toggleRadiologyDropdown(row.id, true)}
                            onBlur={() => handleRadiologyBlur(row.id)}
                            placeholder="Type or select investigation"
                          />
                          {row.dropdownOpen && filteredTests.length > 0 && (
                            <ul
                              className="list-group position-absolute w-100 mt-1"
                              style={{
                                zIndex: 1000,
                                maxHeight: "200px",
                                overflowY: "auto",
                                backgroundColor: "#fff",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              {filteredTests.map((test) => (
                                <li
                                  key={test.id}
                                  className="list-group-item list-group-item-action"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => selectRadiologyTest(row.id, test)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {test.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={row.date}
                            onChange={(e) => updateRadiologyRow(row.id, "date", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) => updateRadiologyRow(row.id, "remarks", e.target.value)}
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRadiologyRow(row.id)}
                            disabled={radiologyRows.length === 1}
                            title="Delete row"
                          >
                            <i className="mdi mdi-delete"></i> X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-primary btn-sm" onClick={handleSaveRadiology} type="button">
                Save Radiology Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tracking" && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white py-2">
            <strong>Order Tracking</strong>
          </div>
          <div className="card-body">
            <div className="mb-2 d-flex align-items-center">
              <label className="me-3">
                <input
                  type="radio"
                  name="trackingType"
                  value="lab"
                  checked={trackingType === "lab"}
                  onChange={() => handleTrackingTypeChange("lab")}
                  className="me-1"
                />
                Lab Orders
              </label>
              <label>
                <input
                  type="radio"
                  name="trackingType"
                  value="radiology"
                  checked={trackingType === "radiology"}
                  onChange={() => handleTrackingTypeChange("radiology")}
                  className="me-1"
                />
                Radiology Orders
              </label>
            </div>

            {trackingType === "lab" && (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th>Order No</th>
                        <th>Order Date</th>
                        <th>Patient Name</th>
                        <th>Mobile No</th>
                        <th>Age / Gender</th>
                        <th>Sample ID</th>
                        <th>Investigation Name</th>
                        <th>Investigation Status</th>
                        <th>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLabOrders.length > 0 ? (
                        paginatedLabOrders.map((row, index) => (
                          <tr key={index}>
                            <td>{row.orderNo}</td>
                            <td>{row.orderDate}</td>
                            <td>{row.patientName}</td>
                            <td>{row.mobileNo}</td>
                            <td>{row.ageGender}</td>
                            <td>{row.sampleId}</td>
                            <td>{row.investigationName}</td>
                            <td>{row.investigationStatus}</td>
                            <td>
                              {row.report === "View / Download" ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleViewReport(row)}
                                >
                                  View
                                </button>
                              ) : (
                                <span>{row.report}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            No Lab Orders Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  totalItems={dummyLabOrders.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}

            {trackingType === "radiology" && (
              <>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                      <tr>
                        <th>Order No</th>
                        <th>Order Date</th>
                        <th>Patient Name</th>
                        <th>Mobile No</th>
                        <th>Age / Gender</th>
                        <th>Investigation Name</th>
                        <th>Investigation Status</th>
                        <th>Report</th>
                        <th>DICOM Eye</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRadiologyOrders.length > 0 ? (
                        paginatedRadiologyOrders.map((row, index) => (
                          <tr key={index}>
                            <td>{row.orderNo}</td>
                            <td>{row.orderDate}</td>
                            <td>{row.patientName}</td>
                            <td>{row.mobileNo}</td>
                            <td>{row.ageGender}</td>
                            <td>{row.investigationName}</td>
                            <td>{row.investigationStatus}</td>
                            <td>
                              {row.report === "View / Download" ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleViewReport(row)}
                                >
                                  View
                                </button>
                              ) : (
                                <span>{row.report}</span>
                              )}
                            </td>
                            <td>
                              {row.dicomEye === "View Study" && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleViewDicomEye(row)}
                                  type="button"
                                >
                                  <i className="fa fa-eye"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            No Radiology Orders Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  totalItems={dummyRadiologyOrders.length}
                  itemsPerPage={itemsPerPage}
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

export default InvestigationOrderandTracking;
