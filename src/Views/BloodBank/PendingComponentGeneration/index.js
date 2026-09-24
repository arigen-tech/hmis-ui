import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import {
  COMPONENT_GENERATION_FAIL,
  COMPONENT_GENERATION_PASS,
  GET_BLOOD_COMPONENTS,
  GET_FAILURE_REASONS,
  PENDING_COMPONENT_GENERATION_LIST,
} from "../../../config/apiConfig";
import {
  BAG_COMPONENT_CONFIG,
  COMPONENT_ALIASES,
  FALLBACK_COMPONENT_NAMES,
} from "../../../config/constants";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../service/apiService";

const calculateDefaultExpiry = (collectionDateStr, shelfLifeDays) => {
  if (!shelfLifeDays) return "";
  let baseDate = new Date();
  if (collectionDateStr) {
    const parts = collectionDateStr.split(" ")[0].split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      baseDate = new Date(y, m, d);
    }
  }
  baseDate.setDate(baseDate.getDate() + Number(shelfLifeDays));
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PendingComponentGeneration = () => {
  const [pendingData, setPendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBag, setSelectedBag] = useState(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [failureRemarks, setFailureRemarks] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [componentForm, setComponentForm] = useState({});
  const [failureReasonOptions, setFailureReasonOptions] = useState([]);
  const [componentMaster, setComponentMaster] = useState([]);
  const [components, setComponents] = useState([]);
  const [componentNotes, setComponentNotes] = useState("");

  useEffect(() => {
    fetchComponentMaster();
    fetchPendingData();
    fetchFailureReasons();
  }, []);

  const generateAllUnitNumbers = (bagNo, components, collectionDate) => {
    if (!bagNo || !components?.length) return {};

    const suffix = bagNo.replace(/^BAG-?/i, "");

    const result = {};

    components.forEach((comp) => {
      result[comp.code] = {
        unitNo: `${comp.code}-${suffix}`,
        expiry: calculateDefaultExpiry(collectionDate, comp.shelfLifeDays),
      };
    });

    return result;
  };

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${PENDING_COMPONENT_GENERATION_LIST}?hospitalId=${hospitalId}`);

      if (response.status === 200 && response.response) {
        const mappedData = response.response.map((item) => ({
          id: item.donationId,
          bagNo: item.bagNumber,
          donorRegNo: item.donorCode,
          donorName: `${item.firstName} ${item.lastName}`,
          bloodGroup: item.bloodGroup,
          collectionDate: item.collectionDate,
          collectionType: item.collectionType,
          bagType: item.bagType,
          collectedVolume: item.collectedVolumeMl,
          status: item.currentStatus,
        }));

        setPendingData(mappedData);
      } else {
        setPendingData([]);
      }
    } catch (err) {
      console.error(err);
      setPendingData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const fetchComponentMaster = async () => {
    try {
      const response = await getRequest(`${GET_BLOOD_COMPONENTS}/getAll/1`);

      if (response.status === 200 && response.response) {
        const activeComponents = response.response
          .filter((item) => (item.status ? item.status.toUpperCase() === "Y" : true))
          .map((item) => ({
            id: item.componentId,
            code: (item.componentCode || "").trim().toUpperCase(),
            name: item.componentName,
            shelfLifeDays: item.shelfLifeDays,
          }));

        setComponentMaster(activeComponents);
      } else {
        setComponentMaster([]);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      setComponentMaster([]);
    }
  };

  const filteredPendingData = pendingData.filter((record) => {
    const query = searchQuery.toLowerCase();

    return (
      (record.bagNo || "").toLowerCase().includes(query) ||
      (record.donorRegNo || "").toLowerCase().includes(query) ||
      (record.donorName || "").toLowerCase().includes(query) ||
      (record.bloodGroup || "").toLowerCase().includes(query) ||
      (record.collectionType || "").toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredPendingData.slice(
    indexOfFirstItem,
    indexOfFirstItem + DEFAULT_ITEMS_PER_PAGE,
  );

  const handleRowClick = (record) => {
    setSelectedBag(record);
    setShowDetailView(true);
    setGenerationStatus("");
    setComponentForm({});
    setComponentNotes("");
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedBag(null);
    setGenerationStatus("");
    setComponentForm({});
    setComponents([]);
    setComponentNotes("");
  };

  // Update a specific component field
  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...components];
    updatedComponents[index][field] = value;
    setComponents(updatedComponents);
  };

  const handleFailure = (record) => {
    setSelectedBag(record);
    setShowFailureModal(true);
    setFailureReason("");
    setFailureRemarks("");
  };

  const getBagKey = (bagType) => {
    if (!bagType) return "";

    const type = bagType.toLowerCase();

    if (type.includes("single")) return "SINGLE";
    if (type.includes("double")) return "DOUBLE";
    if (type.includes("triple")) return "TRIPLE";
    if (type.includes("quad")) return "QUAD";

    return "";
  };

  const getComponentsForBagType = (bagType) => {
    const bagKey = getBagKey(bagType);
    const targetCodes = BAG_COMPONENT_CONFIG[bagKey] || [];

    return targetCodes.map((target) => {
      const aliases = COMPONENT_ALIASES[target] || [target];
      const match = componentMaster.find((comp) => {
        const code = (comp.code || "").trim().toUpperCase();
        const name = (comp.name || "").trim().toUpperCase();

        if (aliases.includes(code)) return true;
        if (target === "WB" && name.includes("WHOLE BLOOD")) return true;
        if (target === "PRBC" && (name.includes("PACKED RED") || name.includes("RED BLOOD"))) return true;
        if (target === "FFP" && name.includes("PLASMA")) return true;
        if (target === "PLT" && name.includes("PLATELET") && !name.includes("SINGLE DONOR")) return true;
        if (target === "CRYO" && name.includes("CRYO")) return true;
        return false;
      });

      if (match) {
        return match;
      }

      return {
        id: null,
        code: target,
        name: FALLBACK_COMPONENT_NAMES[target] || target,
      };
    });
  };

  const allowedComponents = getComponentsForBagType(selectedBag?.bagType);

  const fetchFailureReasons = async () => {
    try {
      const response = await getRequest(`${GET_FAILURE_REASONS}/getAll/1`);

      if (response.status === 200 && response.response) {
        const activeReasons = response.response
          .filter((item) => (item.status ? item.status.toUpperCase() === "Y" : true))
          .map((item) => ({
            id: item.failureReasonId || item.id,
            name: item.failureReasonName || item.reason,
            reason: item.failureReasonName || item.reason,
            description: item.description,
          }));
        setFailureReasonOptions(activeReasons);
      } else {
        setFailureReasonOptions([]);
      }
    } catch (error) {
      console.error("Error fetching failure reasons:", error);
      setFailureReasonOptions([]);
    }
  };

  const submitFailure = async () => {
    if (!failureReason) {
      showPopup("Please select a failure reason", "error");
      return;
    }

    try {
      setLoading(true);

      setTimeout(() => {
        setPendingData(
          pendingData.filter((item) => item.id !== selectedBag.id),
        );

        showPopup(
          `Component generation failed for Bag ${selectedBag.bagNo}. Status updated with reason: ${failureReason}`,
          "warning",
        );
        setShowFailureModal(false);
        setSelectedBag(null);
        setFailureReason("");
        setFailureRemarks("");
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("Error updating failure status:", err);
      showPopup("Failed to update failure status", "error");
      setLoading(false);
    }
  };

  const showPopup = (message, type = "info", shouldRefresh = false) => {
    setPopupMessage({
      message,
      type,
      onClose: async () => {
        setPopupMessage(null);

        if (shouldRefresh) {
          handleBackToList();
          await fetchPendingData();
        }
      },
    });
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchPendingData();
  };

  const handleSave = async () => {
    if (generationStatus === "fail") {
      if (!componentForm.failureReason) {
        showPopup("Please select a failure reason", "error");
        return;
      }
      try {
        setLoading(true);

        const url = `${COMPONENT_GENERATION_FAIL}?donationId=${selectedBag.id}&ComponentFailureReasonId=${Number(componentForm.failureReason)}`;

        await putRequest(url, {});

        showPopup("Component generation failed", "warning", true);

      } catch (error) {
        console.error(error);
        showPopup("Failed to update failure status", "error");
      } finally {
        setLoading(false);
      }
    } else if (generationStatus === "pass") {
      try {
        setLoading(true);

        const components = allowedComponents.map((comp) => {
          const formData = componentForm[comp.code] || {};

          return {
            componentId: comp.id,
            unitNo: formData.unitNo,
            volumeMl: Number(formData.volume),
            expiryDate: formData.expiry,
          };
        });

        for (let comp of components) {
          if (!comp.volumeMl || !comp.expiryDate) {
            showPopup("Please fill all component details", "error");
            setLoading(false);
            return;
          }
        }

        await postRequest(COMPONENT_GENERATION_PASS, {
          donationId: selectedBag.id,
          components,
        });

        showPopup(
          "Component generation completed",
          "success",
          true,
        );

      } catch (error) {
        console.error(error);
        showPopup("Failed to save component generation", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (
      generationStatus === "pass" &&
      selectedBag &&
      allowedComponents.length > 0
    ) {
      const autoData = generateAllUnitNumbers(
        selectedBag.bagNo,
        allowedComponents,
        selectedBag.collectionDate,
      );

      setComponentForm((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        allowedComponents.forEach((comp) => {
          const existing = prev[comp.code] || {};
          const unitNo = existing.unitNo || autoData[comp.code]?.unitNo || "";
          const expiry = existing.expiry || autoData[comp.code]?.expiry || "";
          if (existing.unitNo !== unitNo || existing.expiry !== expiry) {
            hasChanges = true;
          }
          updated[comp.code] = {
            ...existing,
            unitNo,
            expiry,
          };
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [generationStatus, selectedBag?.bagNo, selectedBag?.collectionDate, allowedComponents]);

  const getBagTypeBadgeClass = (bagType) => {
    if (!bagType) return "badge bg-secondary";
    const type = bagType.toLowerCase();
    if (type.includes("single")) return "badge bg-info";
    if (type.includes("double")) return "badge bg-primary";
    if (type.includes("triple")) return "badge bg-success";
    if (type.includes("quad")) return "badge bg-warning text-dark";
    return "badge bg-secondary";
  };

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {showDetailView && selectedBag ? (
        // ============= COMPONENT GENERATION DETAIL VIEW =============
        <div className="row">
          <div className="col-12">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title">
                  <i className="mdi mdi-flask me-2"></i>
                  Component Generation – Details
                </h4>
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  <i className="fa fa-arrow-left me-2"></i>
                  Back to List
                </button>
              </div>
              <div className="card-body">
                {loading && <LoadingScreen />}

                {/* Donation Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Donation Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-bold w-25">Bag No</td>
                                <td>{selectedBag.bagNo}</td>
                                <td className="fw-bold w-25">Donor Reg No</td>
                                <td>{selectedBag.donorRegNo}</td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Donor Name</td>
                                <td>{selectedBag.donorName}</td>
                                <td className="fw-bold">Blood Group</td>
                                <td>
                                  <span className="badge bg-danger">
                                    {selectedBag.bloodGroup}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold">Collection Type</td>
                                <td>{selectedBag.collectionType}</td>
                                <td className="fw-bold">Current Status</td>
                                <td>
                                  <span className="badge bg-info">
                                    COLLECTED
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

                {/* Collection Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Collection Details</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td className="fw-bold w-25">
                                  Collection Date
                                </td>
                                <td>{selectedBag.collectionDate}</td>
                                <td className="fw-bold w-25">Bag Type</td>
                                <td>
                                  <span
                                    className={getBagTypeBadgeClass(
                                      selectedBag.bagType,
                                    )}
                                  >
                                    {selectedBag.bagType}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-bold">
                                  Total Collected Volume
                                </td>
                                <td>{selectedBag.collectedVolume} ml</td>
                                <td></td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Generation Status */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">
                          Component Generation Status
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">
                              Generation Status{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={generationStatus}
                              onChange={(e) =>
                                setGenerationStatus(e.target.value)
                              }
                            >
                              <option value="">Select Status</option>
                              <option value="pass">PASS</option>
                              <option value="fail">FAIL</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Failure Form - Show only if FAIL is selected */}
                {generationStatus === "fail" && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow mb-3 ">
                        <div className="card-header py-3 bg-danger bg-opacity-10 border-bottom-1">
                          <h6 className="mb-0 fw-bold text-dark">
                            <i className="mdi mdi-alert-circle me-2"></i>
                            Component Generation Failure
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">
                                Failure Reason{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select"
                                value={componentForm.failureReason || ""}
                                onChange={(e) =>
                                  setComponentForm({
                                    ...componentForm,
                                    failureReason: e.target.value,
                                  })
                                }
                              >
                                <option value="">Select Failure Reason</option>
                                {failureReasonOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="row g-3 mt-2">
                            <div className="col-12">
                              <label className="form-label">
                                Remarks (Optional)
                              </label>
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Enter additional remarks..."
                                value={componentForm.remarks || ""}
                                onChange={(e) =>
                                  setComponentForm({
                                    ...componentForm,
                                    remarks: e.target.value,
                                  })
                                }
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Component Separation Table - Show only if PASS is selected */}
                {generationStatus === "pass" && (
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow mb-3 ">
                        <div className="card-header py-3 bg-success bg-opacity-10 border-bottom-1">
                          <h6 className="mb-0 fw-bold text-dark ">
                            <i className="mdi mdi-check-circle me-2"></i>
                            Component Separation Details (
                            {selectedBag.bagType?.toLowerCase().includes("bag")
                              ? selectedBag.bagType
                              : `${selectedBag.bagType} Bag`}
                            )
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead className="table-light">
                                <tr>
                                  <th>Component</th>
                                  <th>Unit No</th>
                                  <th>Volume (ml)</th>
                                  <th>Expiry Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allowedComponents.length > 0 ? (
                                  allowedComponents.map((comp, index) => (
                                    <tr key={index}>
                                      <td>
                                        <input
                                          value={comp.name}
                                          disabled
                                          className="form-control"
                                        />
                                      </td>

                                      <td>
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={
                                            componentForm[comp.code]?.unitNo || ""
                                          }
                                          readOnly
                                        />
                                      </td>

                                      <td>
                                        <input
                                          type="number"
                                          className="form-control"
                                          placeholder="Enter volume"
                                          value={
                                            componentForm[comp.code]?.volume || ""
                                          }
                                          onChange={(e) =>
                                            setComponentForm({
                                              ...componentForm,
                                              [comp.code]: {
                                                ...(componentForm[comp.code] ||
                                                  {}),
                                                volume: e.target.value,
                                              },
                                            })
                                          }
                                        />
                                      </td>

                                      <td>
                                        <input
                                          type="date"
                                          className="form-control"
                                          value={
                                            componentForm[comp.code]?.expiry || ""
                                          }
                                          onChange={(e) =>
                                            setComponentForm({
                                              ...componentForm,
                                              [comp.code]: {
                                                ...componentForm[comp.code],
                                                expiry: e.target.value,
                                              },
                                            })
                                          }
                                        />
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="text-center text-muted py-3">
                                      No components mapped for this bag type ({selectedBag?.bagType})
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {generationStatus && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="card shadow">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <button
                                type="button"
                                className="btn btn-primary me-2"
                                onClick={handleSave}
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <i className="fa fa-save me-2"></i>
                                    Save
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleBackToList}
                                disabled={loading}
                              >
                                <i className="fa fa-times me-2"></i>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ============= PENDING COMPONENT LIST VIEW =============
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Pending Component Generation</h4>
              <div className="d-flex justify-content-between align-items-center">
                <form className="d-inline-block searchform me-4" role="search">
                  <div className="input-group searchinput">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search Bag No, Donor, Blood Group..."
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <span className="input-group-text" id="search-icon">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>

                <div className="d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-success me-2 flex-shrink-0"
                    onClick={handleRefresh}
                  >
                    <i className="mdi mdi-refresh"></i> Show All
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Bag No</th>
                          <th>Donor Reg No</th>
                          <th>Donor Name</th>
                          <th>Blood Group</th>
                          <th>Collection Date</th>
                          <th>Collection Type</th>
                          <th>Bag Type</th>
                          <th>Collected Volume (ml)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((record) => (
                            <tr
                              key={record.id}
                              onClick={() => handleRowClick(record)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>
                                <strong>{record.bagNo}</strong>
                              </td>
                              <td>{record.donorRegNo}</td>
                              <td>{record.donorName}</td>
                              <td>
                                <span className="badge bg-danger">
                                  {record.bloodGroup}
                                </span>
                              </td>
                              <td>{record.collectionDate}</td>
                              <td>{record.collectionType}</td>
                              <td>
                                <span
                                  className={getBagTypeBadgeClass(
                                    record.bagType,
                                  )}
                                >
                                  {record.bagType}
                                </span>
                              </td>
                              <td className="text-center">
                                {record.collectedVolume}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              No pending component generation found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredPendingData.length > 0 && (
                    <Pagination
                      totalItems={filteredPendingData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

              {/* Reports Modal */}
              {showModal && (
                <div
                  className="modal fade show"
                  style={{ display: "block" }}
                  tabIndex="-1"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5">
                          Component Generation Reports
                        </h1>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowModal(false)}
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>Generate reports for component generation:</p>
                        <div className="list-group">
                          <button
                            type="button"
                            className="list-group-item list-group-item-action"
                          >
                            Pending Component List
                          </button>
                          <button
                            type="button"
                            className="list-group-item list-group-item-action"
                          >
                            Component Generation Summary
                          </button>
                          <button
                            type="button"
                            className="list-group-item list-group-item-action"
                          >
                            Failure Analysis Report
                          </button>
                          <button
                            type="button"
                            className="list-group-item list-group-item-action"
                          >
                            Bag Type-wise Component Yield
                          </button>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowModal(false)}
                        >
                          Close
                        </button>
                        <button type="button" className="btn btn-primary">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure Reason Modal */}
              {showFailureModal && (
                <div
                  className="modal fade show"
                  style={{ display: "block" }}
                  tabIndex="-1"
                  aria-hidden="true"
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5">
                          Component Generation Failure
                        </h1>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowFailureModal(false)}
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p className="mb-3">
                          <strong>Bag No:</strong> {selectedBag?.bagNo}
                          <br />
                          <strong>Donor:</strong> {selectedBag?.donorName} (
                          {selectedBag?.donorRegNo})
                        </p>
                        <p>
                          Please select the reason for component generation
                          failure:
                        </p>

                        <div className="form-group mb-3">
                          <label className="mb-2">
                            Failure Reason{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            required
                          >
                            <option value="">Select Failure Reason</option>
                            {failureReasonOptions.map((option) => (
                              <option key={option.id} value={option.name || option.reason}>
                                {option.name || option.reason}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="mb-2">Remarks (Optional)</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Enter additional remarks..."
                            value={failureRemarks}
                            onChange={(e) => setFailureRemarks(e.target.value)}
                          ></textarea>
                        </div>

                        <div className="alert alert-info mt-3 mb-0">
                          <i className="mdi mdi-information"></i>
                          Note: No component data will be saved. Only the
                          donation header will be updated with failure status.
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowFailureModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={submitFailure}
                        >
                          Confirm Failure
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Background overlay for modals */}
              {(showModal || showFailureModal) && (
                <div className="modal-backdrop fade show"></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingComponentGeneration;
