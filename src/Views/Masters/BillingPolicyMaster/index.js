import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { MAS_BILLING_POLICY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import {
  ADD_BILLING_POLICY_SUCC_MSG,
  DUPLICATE_BILLING_POLICY,
  FAIL_TO_SAVE_CHANGES,
  FETCH_BILLING_POLICY_ERR_MSG,
  UPDATE_BILLING_POLICY_SUCC_MSG
} from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BillingPolicyMaster = () => {
  const [billingPolicyData, setBillingPolicyData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    policyCode: "",
    description: "",
    applicableBillingType: "",
    followupDaysAllowed: "",
    discountPercentage: "",
  });
  const [loading, setLoading] = useState(true);

  const POLICY_CODE_MAX_LENGTH = 50;
  const DESCRIPTION_MAX_LENGTH = 500;
  const APPLICABLE_BILLING_TYPE_MAX_LENGTH = 20;

  useEffect(() => {
    fetchBillingPolicyData();
  }, []);

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const fetchBillingPolicyData = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_BILLING_POLICY}/getAll`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.billingPolicyId,
          policyCode: item.policyCode,
          description: item.description || "",
          applicableBillingType: item.applicableBillingType,
          followupDaysAllowed: item.followupDaysAllowed || "",
          discountPercentage: item.discountPercentage || "",
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setBillingPolicyData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching billing policy data:", err);
      showPopup(FETCH_BILLING_POLICY_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredBillingPolicies = (billingPolicyData || []).filter(
    (policy) =>
      policy?.policyCode?.toLowerCase().includes(searchQuery?.toLowerCase() || "")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredBillingPolicies.slice(indexOfFirst, indexOfLast);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      policyCode: record.policyCode,
      description: record.description,
      applicableBillingType: record.applicableBillingType,
      followupDaysAllowed: record.followupDaysAllowed,
      discountPercentage: record.discountPercentage,
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      const isDuplicate = billingPolicyData.some(
        (policy) =>
          policy.policyCode.toLowerCase() === formData.policyCode.toLowerCase() &&
          (!editingRecord || editingRecord.id !== policy.id)
      );

      if (isDuplicate && !editingRecord) {
        showPopup(DUPLICATE_BILLING_POLICY, "error");
        setLoading(false);
        return;
      }

      const requestData = {
        policyCode: formData.policyCode,
        description: formData.description,
        applicableBillingType: formData.applicableBillingType,
        followupDaysAllowed: formData.followupDaysAllowed ? parseInt(formData.followupDaysAllowed) : null,
        discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : null,
      };

      if (editingRecord) {
        const response = await putRequest(`${MAS_BILLING_POLICY}/update/${editingRecord.id}`, requestData);

        if (response && response.status === 200) {
          fetchBillingPolicyData();
          showPopup(UPDATE_BILLING_POLICY_SUCC_MSG, "success");
        }
      } else {
        const response = await postRequest(`${MAS_BILLING_POLICY}/create`, requestData);

        if (response && response.status === 200) {
          fetchBillingPolicyData();
          showPopup(ADD_BILLING_POLICY_SUCC_MSG, "success");
        }
      }

      setEditingRecord(null);
      setFormData({
        policyCode: "",
        description: "",
        applicableBillingType: "",
        followupDaysAllowed: "",
        discountPercentage: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving billing policy:", err);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setLoading(false);
    }
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(
      formData.policyCode.trim() !== "" &&
      formData.applicableBillingType.trim() !== ""
    );
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchBillingPolicyData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Billing Policy Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search billing policy code"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button type="button" className="btn btn-success me-2 flex-shrink-0" onClick={handleRefresh}>
                        <i className="mdi mdi-refresh"></i> Show All
                      </button>
                      <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                        <i className="mdi mdi-plus"></i> Reports
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : !showForm ? (
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Policy Code</th>
                          <th>Description</th>
                          <th>Applicable Billing Type</th>
                          <th>Follow-up Days Allowed</th>
                          <th>Discount Percentage</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ?
                          (currentItems.map((policy) => (
                            <tr key={policy.id}>
                              <td>{policy.policyCode}</td>
                              <td>{policy.description}</td>
                              <td>{policy.applicableBillingType}</td>
                              <td>{policy.followupDaysAllowed}</td>
                              <td>{policy.discountPercentage}</td>
                              <td>{policy.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(policy)}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center">
                                No billing policy found
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                  {/* PAGINATION USING REUSABLE COMPONENT */}
                  {filteredBillingPolicies.length > 0 && (
                    <Pagination
                      totalItems={filteredBillingPolicies.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Policy Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="policyCode"
                      placeholder="Enter Policy Code"
                      value={formData.policyCode}
                      onChange={handleInputChange}
                      maxLength={POLICY_CODE_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Applicable Billing Type <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="applicableBillingType"
                      placeholder="Enter Applicable Billing Type"
                      value={formData.applicableBillingType}
                      onChange={handleInputChange}
                      maxLength={APPLICABLE_BILLING_TYPE_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-4">
                    <label>Follow-up Days Allowed</label>
                    <input
                      type="number"
                      className="form-control mt-1"
                      id="followupDaysAllowed"
                      placeholder="Enter Follow-up Days"
                      value={formData.followupDaysAllowed}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3">
                    <label>Discount Percentage</label>
                    <input
                      type="number"
                      className="form-control mt-1"
                      id="discountPercentage"
                      placeholder="Enter Discount Percentage"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="form-group col-md-8 mt-3">
                    <label>Description</label>
                    <textarea
                      type="text"
                      className="form-control mt-1"
                      id="description"
                      placeholder="Enter Description"
                      rows='4'
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        {/* Your modal content goes here */}
                        ...
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Understood</button>
                      </div>
                    </div>
                  </div>
                </div>
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
  );
};

export default BillingPolicyMaster;