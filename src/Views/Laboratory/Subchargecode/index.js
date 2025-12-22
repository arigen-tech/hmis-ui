import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_SUB_CHARGE_CODE, MAS_MAIN_CHARGE_CODE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  ADD_SUB_CHARGE_CODE_SUCC_MSG,
  DUPLICATE_SUB_CHARGE_CODE_ERR_MSG,
  FAIL_TO_SAVE_CHANGES,
  FAIL_TO_UPDATE_STS,
  FETCH_MAIN_CHARGE_CODE_ERR_MSG,
  FETCH_SUB_CHARGE_CODES_ERR_MSG,
  MIS_MATCH_ERR_MSG,
  UPDATE_SUB_CHARGE_CODE_SUCC_MSG,
  INVALID_PAGE_NO_WARN_MSG
} from "../../../config/constants";

const SubChargeCode = () => {
  const [subChargeCodes, setSubChargeCodes] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, subChargeId: null, newStatus: false });
  const [formData, setFormData] = useState({
    subChargeCode: "",
    subChargeName: "",
    mainChargeCode: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingSubCharge, setEditingSubCharge] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [mainChargeCodes, setMainChargeCodes] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchSubChargeCodes(0);
    fetchMainChargeCodes(1);
  }, []);

  // Fetch sub charge codes
  const fetchSubChargeCodes = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/${flag}`);

      if (response && response.status === 200) {
        const responseData = response.response || response.data || response;

        if (Array.isArray(responseData)) {
          const mappedData = responseData.map((item) => ({
            id: item.subId,
            subChargeCode: item.subCode,
            subChargeName: item.subName,
            mainChargeCode: item.mainChargeId ? item.mainChargeId.toString() : "",
            mainChargeCodeName: item.mainChargeCodeName || "N/A",
            status: item.status,
            lastChgBy: item.lastChgBy,
            lastChgDate: item.lastChgDate,
            lastChgTime: item.lastChgTime,
          }));
          setSubChargeCodes(mappedData);
        } else if (responseData && responseData.response && Array.isArray(responseData.response)) {
          const mappedData = responseData.response.map((item) => ({
            id: item.subId,
            subChargeCode: item.subCode,
            subChargeName: item.subName,
            mainChargeCode: item.mainChargeId,
            mainChargeCodeName: item.mainChargeCodeName || "N/A",
            status: item.status,
            lastChgBy: item.lastChgBy,
            lastChgDate: item.lastChgDate,
            lastChgTime: item.lastChgTime,
          }));
          setSubChargeCodes(mappedData);
        } else {
          console.error("Unexpected response structure:", responseData);
          showPopup(MIS_MATCH_ERR_MSG, "error");
        }
      } else {
        console.error("Invalid response:", response);
        showPopup(FETCH_SUB_CHARGE_CODES_ERR_MSG, "error");
      }
    } catch (err) {
      console.error("Error fetching sub-charge codes:", err);
      showPopup(FETCH_SUB_CHARGE_CODES_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch main charge codes
  const fetchMainChargeCodes = async (flag = 1) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_MAIN_CHARGE_CODE}/getAll/${flag}`);
      if (response && response.data && response.data.response) {
        setMainChargeCodes(response.data.response);
      } else if (response && response.response) {
        setMainChargeCodes(response.response);
      }
    } catch (err) {
      console.error("Error fetching main charge codes:", err);
      showPopup(FETCH_MAIN_CHARGE_CODE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Filter sub charge codes based on search
  const filteredSubChargeCodes = (subChargeCodes || []).filter(
    (item) =>
      item.subChargeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subChargeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mainChargeCodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mainChargeCode && item.mainChargeCode.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredSubChargeCodes.slice(indexOfFirst, indexOfLast);


  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Edit functionality
  const handleEdit = (item) => {
    setEditingSubCharge(item);
    setShowForm(true);
    setFormData({
      subChargeCode: item.subChargeCode,
      subChargeName: item.subChargeName,
      mainChargeCode: item.mainChargeCode,
    });
    setIsFormValid(true);
  };

  // Save functionality
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = subChargeCodes.some(
        (code) =>
          code.subChargeCode.toLowerCase() === formData.subChargeCode.toLowerCase() &&
          (!editingSubCharge || code.id !== editingSubCharge.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_SUB_CHARGE_CODE_ERR_MSG, "error");
        setLoading(false);
        return;
      }

      if (editingSubCharge) {
        const response = await putRequest(`${MAS_SUB_CHARGE_CODE}/updateById/${editingSubCharge.id}`, {
          subCode: formData.subChargeCode,
          subName: formData.subChargeName,
          mainChargeId: formData.mainChargeCode,
        });

        if (response && response.status === 200) {
          fetchSubChargeCodes();
          showPopup(UPDATE_SUB_CHARGE_CODE_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${MAS_SUB_CHARGE_CODE}/create`, {
          subCode: formData.subChargeCode,
          subName: formData.subChargeName,
          mainChargeId: formData.mainChargeCode,
        });

        if (response && response.status === 200) {
          fetchSubChargeCodes();
          showPopup(ADD_SUB_CHARGE_CODE_SUCC_MSG, "success");
        }
      }

      setEditingSubCharge(null);
      setFormData({ subChargeCode: "", subChargeName: "", mainChargeCode: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving sub-charge code:", err);
      showPopup(`${FAIL_TO_SAVE_CHANGES} ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Popup functionality
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Status change functionality
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, subChargeId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.subChargeId !== null) {
      try {
        setLoading(true);
        const response = await putRequest(
          `${MAS_SUB_CHARGE_CODE}/status/${confirmDialog.subChargeId}?status=${confirmDialog.newStatus}`,
          {}
        );

        if (response && response.status === 200) {
          setSubChargeCodes((prevData) =>
            prevData.map((item) =>
              item.id === confirmDialog.subChargeId ? { ...item, status: confirmDialog.newStatus } : item
            )
          );
          showPopup(
            `Sub charge code ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating sub-charge code status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, subChargeId: null, newStatus: null });
  };

  // Form input handling
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));

    const updatedFormData = { ...formData, [id]: value };
    setIsFormValid(
      !!updatedFormData.subChargeCode &&
      !!updatedFormData.subChargeName &&
      !!updatedFormData.mainChargeCode
    );
  };

  // Refresh functionality
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchSubChargeCodes();
    fetchMainChargeCodes();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Sub Charge Code</h4>

              <div className="d-flex justify-content-between align-items-center">
                {/* Search form */}
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code, name, or main charge"
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
                        className="btn btn-success me-2"
                        onClick={() => {
                          setShowForm(true);
                          setEditingSubCharge(null);
                          setFormData({ subChargeCode: "", subChargeName: "", mainChargeCode: "" });
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2 flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    <i className="mdi mdi-arrow-left"></i> Back
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {/* LOADING */}
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  {/* TABLE */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Sub Charge Code</th>
                          <th>Sub Charge Name</th>
                          <th>Main Charge Code</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.subChargeCode}</td>
                              <td>{item.subChargeName}</td>
                              <td>{item.mainChargeCodeName}</td>

                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "y"}
                                    onChange={() =>
                                      handleSwitchChange(item.id, item.status === "y" ? "n" : "y")
                                    }
                                    id={`switch-${item.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${item.id}`}
                                  >
                                    {item.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>

                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">
                              No sub charge codes found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredSubChargeCodes.length > 0 && (
                    <Pagination
                      totalItems={filteredSubChargeCodes.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                // FORM
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Sub Charge Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="subChargeCode"
                        placeholder="Enter sub charge code"
                        value={formData.subChargeCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Sub Charge Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="subChargeName"
                        placeholder="Enter sub charge name"
                        value={formData.subChargeName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Main Charge Code <span className="text-danger">*</span></label>
                      <select
                        className="form-select mt-1"
                        id="mainChargeCode"
                        value={formData.mainChargeCode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Main Charge Code</option>
                        {mainChargeCodes && mainChargeCodes.length > 0 ? (
                          mainChargeCodes.map((code) => (
                            <option key={code.chargecodeId} value={code.chargecodeId}>
                              {code.chargecodeName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No main charge codes available
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : (editingSubCharge ? 'Update' : 'Save')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* POPUP */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {/* CONFIRM DIALOG */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => handleConfirm(false)}
                          aria-label="Close"
                          disabled={loading}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'}
                          <strong> {subChargeCodes.find(item => item.id === confirmDialog.subChargeId)?.subChargeName}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubChargeCode;