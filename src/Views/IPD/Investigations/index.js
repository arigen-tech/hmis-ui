import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  MAS_INVESTIGATION,
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


// PortalDropdown Component - Fixed positioning like in IndentCreation / OpeningBalanceEntry
const PortalDropdown = ({ anchorRef, show, children }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        top: rect.bottom + 4, // 4 px gap below the input
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      });
    };

    updatePosition();

    // Re-position on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, anchorRef]);

  if (!show) return null;
  return createPortal(<div style={style}>{children}</div>, document.body);
};

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination justify-content-end mt-3">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
        </li>
        {[...Array(totalPages)].map((_, i) => (
          <li
            key={i}
            className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(i + 1)}
              type="button"
            >
              {i + 1}
            </button>
          </li>
        ))}
        <li
          className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

const normalizeLabInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  investigationName: item?.investigationName ?? item?.testName ?? item?.name ?? "",
  testName: item?.testName ?? item?.investigationName ?? item?.name ?? "",
  sample: item?.sample ?? item?.sampleName ?? item?.sampleDescription ?? "",
  container:
    item?.container ?? item?.collectionName ?? item?.containerName ?? "",
  resultUnit: item?.resultUnit ?? item?.uomName ?? item?.unitName ?? "",
  price: Number(item?.price ?? item?.amount ?? item?.rate ?? 0),
  discount: Number(item?.disc ?? item?.discount ?? 0),
});

const normalizeRadiologyInvestigation = (item, index) => ({
  id: item?.investigationId ?? item?.id ?? index,
  investigationName: item?.investigationName ?? item?.name ?? "",
  name: item?.name ?? item?.investigationName ?? "",
  price: Number(item?.price ?? item?.amount ?? item?.rate ?? 0),
  discount: Number(item?.disc ?? item?.discount ?? 0),
});

const getGenderApplicable = (selectedPatient) => {
  const rawGender =
    selectedPatient?.gender ??
    selectedPatient?.patientGender ??
    selectedPatient?.sex ??
    selectedPatient?.genderCode ??
    "";

  const ageGenderPart =
    typeof selectedPatient?.ageGender === "string"
      ? selectedPatient.ageGender.split("/").pop()?.trim()
      : "";

  const genderValue = String(rawGender || ageGenderPart || "")
    .trim()
    .toLowerCase();

  if (!genderValue) return "";
  if (genderValue === "male" || genderValue === "m") return "m";
  if (genderValue === "female" || genderValue === "f") return "f";
  return genderValue.charAt(0);
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];

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
    investigationName: "",
    date: getTodayDateString(),
    remarks: "",
    dropdownOpen: false,
    searchText: "",
  });

  const [labRows, setLabRows] = useState([createLabRow()]);

  const [radiologyRows, setRadiologyRows] = useState([createRadiologyRow()]);

  const [trackingType, setTrackingType] = useState("lab");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Refs for portal-positioned dropdown inputs
  const labInputRefs = useRef({});
  const radiologyInputRefs = useRef({});

  useEffect(() => {
    const fetchInvestigations = async () => {
      const genderApplicable = getGenderApplicable(selectedPatient);

      if (!genderApplicable) {
        setLabTests([]);
        setRadiologyTests([]);
        return;
      }

      try {
        const [labRes, radiologyRes] = await Promise.all([
          getRequest(
            `${MAS_INVESTIGATION}/price-details?genderApplicable=${genderApplicable}`,
          ),
          getRequest(
            `${MAS_INVESTIGATION}/price-details?genderApplicable=${genderApplicable}&radioFlag=true`,
          ),
        ]);

        if (labRes?.status === 200 && Array.isArray(labRes.response)) {
          setLabTests(labRes.response.map(normalizeLabInvestigation));
        } else {
          setLabTests([]);
        }

        if (
          radiologyRes?.status === 200 &&
          Array.isArray(radiologyRes.response)
        ) {
          setRadiologyTests(
            radiologyRes.response.map(normalizeRadiologyInvestigation),
          );
        } else {
          setRadiologyTests([]);
        }
      } catch (error) {
        console.error("Error fetching investigations:", error);
        setLabTests([]);
        setRadiologyTests([]);
      }
    };

    fetchInvestigations();
  }, [selectedPatient]);

  const paginatedLabOrders = dummyLabOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const paginatedRadiologyOrders = dummyRadiologyOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleTrackingTypeChange = (type) => {
    setTrackingType(type);
    setCurrentPage(1);
  };

  const addLabRow = () => {
    setLabRows([...labRows, createLabRow()]);
  };

  const updateLabRow = (id, field, value) => {
    setLabRows(
      labRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const selectLabTest = (id, test) => {
    const testName = test.investigationName || test.testName || "";
    setLabRows(
      labRows.map((row) =>
        row.id === id
          ? {
              ...row,
              testName,
              sample: test.sample,
              container: test.container,
              resultUnit: test.resultUnit,
              searchText: testName,
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
          ? {
              ...row,
              searchText: value,
              testName: "",
              sample: "",
              container: "",
              resultUnit: "",
              dropdownOpen: true,
            }
          : { ...row, dropdownOpen: false },
      ),
    );
  };

  const openLabDropdown = (id) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: true } : row,
      ),
    );
  };

  const toggleLabDropdown = (id, open) => {
    setLabRows(
      labRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: open } : row,
      ),
    );
  };

  const handleLabBlur = (id) => {
    setTimeout(() => toggleLabDropdown(id, false), 150);
  };

  const getFilteredLabTests = (searchText) => {
    const query = (searchText || "").trim().toLowerCase();
    if (!query) return labTests;
    return labTests.filter((test) =>
      (test.investigationName || test.testName || "").toLowerCase().includes(query),
    );
  };

  const addRadiologyRow = () => {
    setRadiologyRows([...radiologyRows, createRadiologyRow()]);
  };

  const updateRadiologyRow = (id, field, value) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const selectRadiologyTest = (id, test) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id
          ? {
              ...row,
              investigationName: test.investigationName,
              searchText: test.investigationName,
              dropdownOpen: false,
            }
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
        row.id === id
          ? {
              ...row,
              searchText: value,
              investigationName: "",
              dropdownOpen: true,
            }
          : { ...row, dropdownOpen: false },
      ),
    );
  };

  const openRadiologyDropdown = (id) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: true } : row,
      ),
    );
  };

  const toggleRadiologyDropdown = (id, open) => {
    setRadiologyRows(
      radiologyRows.map((row) =>
        row.id === id ? { ...row, dropdownOpen: open } : row,
      ),
    );
  };

  const handleRadiologyBlur = (id) => {
    setTimeout(() => toggleRadiologyDropdown(id, false), 150);
  };

  const getFilteredRadiologyTests = (searchText) => {
    const query = (searchText || "").trim().toLowerCase();
    if (!query) return radiologyTests;
    return radiologyTests.filter((test) =>
      (test.investigationName || "").toLowerCase().includes(query),
    );
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
        const matchedTest =
          type === "lab"
            ? labTests.find(
                (test) =>
                  test.testName === row.testName ||
                  test.investigationName === row.testName ||
                  test.testName === row.searchText ||
                  test.investigationName === row.searchText,
              )
            : radiologyTests.find(
                (test) =>
                  test.investigationName === row.investigationName ||
                  test.investigationName === row.searchText,
              );

        return {
          id: matchedTest?.id ?? null,
          appointmentDate: type === "radiology" ? row.date || getTodayDateString() : null,
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
        await Swal.fire({
          icon: "success",
          title: "Saved",
          text: response?.message || "Investigations saved successfully.",
        });
        if (type === "lab") {
          setLabRows([createLabRow()]);
        } else {
          setRadiologyRows([createRadiologyRow()]);
        }
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
                    {/* <th style={{ width: "15%" }}>Result Unit</th> */}
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
                            ref={(el) => { labInputRefs.current[row.id] = el; }}
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            autoComplete="off"
                            onChange={(e) =>
                              handleLabTestNameChange(row.id, e.target.value)
                            }
                            onFocus={() => openLabDropdown(row.id)}
                            onBlur={() => handleLabBlur(row.id)}
                            placeholder="Type or select test"
                          />
                          <PortalDropdown
                            anchorRef={{ current: labInputRefs.current[row.id] }}
                            show={row.dropdownOpen && filteredTests.length > 0}
                          >
                            <ul className="list-group mb-0">
                              {filteredTests.map((test) => {
                                const hasDiscount = test.discount && test.discount > 0;
                                const displayPrice = test.price || 0;
                                const discountAmount = hasDiscount ? test.discount : 0;
                                const finalPrice = hasDiscount
                                  ? displayPrice - discountAmount
                                  : displayPrice;

                                return (
                                  <li
                                    key={test.id}
                                    className="list-group-item list-group-item-action"
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor: "#e3e8e6",
                                    }}
                                    onClick={() => selectLabTest(row.id, test)}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    <div>
                                      <strong>{test.investigationName || test.testName}</strong>
                                      <div className="d-flex justify-content-between">
                                        <span>
                                          {test.price === null || test.price === undefined
                                            ? "Price not configured"
                                            : `₹${finalPrice.toFixed(2)}`}
                                        </span>
                                        
                                      </div>
                                      {test.investigationType && (
                                        <small className="text-muted">
                                          Type: {test.investigationType}
                                        </small>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </PortalDropdown>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            disabled
                            value={row.sample}
                            onChange={(e) =>
                              updateLabRow(row.id, "sample", e.target.value)
                            }
                            placeholder="Sample type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.container}
                            disabled
                            onChange={(e) =>
                              updateLabRow(row.id, "container", e.target.value)
                            }
                            placeholder="Container"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) =>
                              updateLabRow(row.id, "remarks", e.target.value)
                            }
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
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveLab}
                type="button"
              >
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
                    <th style={{ width: "35%" }}>Remarks</th>
                    <th style={{ width: "10%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {radiologyRows.map((row, idx) => {
                    const filteredTests = getFilteredRadiologyTests(
                      row.searchText,
                    );
                    return (
                      <tr key={row.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="position-relative">
                          <input
                            ref={(el) => { radiologyInputRefs.current[row.id] = el; }}
                            type="text"
                            className="form-control form-control-sm"
                            value={row.searchText}
                            onChange={(e) =>
                              handleRadiologySearchChange(
                                row.id,
                                e.target.value,
                              )
                            }
                            onFocus={() => openRadiologyDropdown(row.id)}
                            onBlur={() => handleRadiologyBlur(row.id)}
                            placeholder="Type or select investigation"
                          />
                          <PortalDropdown
                            anchorRef={{ current: radiologyInputRefs.current[row.id] }}
                            show={row.dropdownOpen && filteredTests.length > 0}
                          >
                            <ul className="list-group mb-0">
                              {filteredTests.map((test) => (
                                <li
                                  key={test.id}
                                  className="list-group-item list-group-item-action"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => selectRadiologyTest(row.id, test)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  {test.investigationName}
                                </li>
                              ))}
                            </ul>
                          </PortalDropdown>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={row.remarks}
                            onChange={(e) =>
                              updateRadiologyRow(
                                row.id,
                                "remarks",
                                e.target.value,
                              )
                            }
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
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveRadiology}
                type="button"
              >
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
                    <thead
                      style={{ backgroundColor: "#9db4c0", color: "black" }}
                    >
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
                    <thead
                      style={{ backgroundColor: "#9db4c0", color: "black" }}
                    >
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
