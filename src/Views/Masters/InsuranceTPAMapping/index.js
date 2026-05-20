import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, putRequest } from "../../../service/apiService";
import {
  INSURANCE_TPA_MAPPING,
  MAS_INSURANCE,
  MAS_TPA,
} from "../../../config/apiConfig";
import {
  REQUIRED_FIELDS_ERROR,
  DUPLICATE_INSURANCE_TPA_MAPPING,
  RECORD_ADDED_SUCCESSFULLY,
  RECORD_UPDATED_SUCCESSFULLY,
   STATUS_UPDATED_SUCCESSFULLY,
   FAILED_TO_UPDATE_STATUS,
} from "../../../config/constants";


const InsuranceTPAMapping = () => {
  const [data, setData] = useState([]);
  const [insuranceOptions, setInsuranceOptions] = useState([]);
  const [tpaOptions, setTpaOptions] = useState([]);
 const [formData, setFormData] = useState({
    mappingId: "",
  insuranceId: "",
  tpaId: "",
  effFrom: "",
  effTo: "",
  mode: "",
});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    record: null,
    newStatus: "",
  });
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async (flag = 0) => {
  try {
    const res = await getRequest(`${INSURANCE_TPA_MAPPING}/getAll/${flag}`
    );

    console.log("API RESPONSE =>", res);

    if (Array.isArray(res)) {
      setData(res);
    }
    else if (Array.isArray(res?.response)) {
      setData(res.response);
    }
    else if (Array.isArray(res?.data)) {
      setData(res.data);
    }
    else {
      setData([]);
    }

  } catch (error) {
    console.log(error);
    setData([]);
  }
};


  const fetchInsuranceOptions = async () => {
    try {
      const res = await getRequest(`${MAS_INSURANCE}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setInsuranceOptions(res.response);
      } else {
        setInsuranceOptions([]);
      }
    } catch (error) {
      console.error("Insurance fetch error:", error);
      setInsuranceOptions([]);
    }
  };

  const fetchTPAOptions = async () => {
    try {
      const res = await getRequest(`${MAS_TPA}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setTpaOptions(res.response);
      } else {
        setTpaOptions([]);
      }
    } catch (error) {
      console.error("TPA fetch error:", error);
      setTpaOptions([]);
    }
  };

  useEffect(() => {
    fetchData(0);
    fetchInsuranceOptions();
    fetchTPAOptions();
  }, []);

  const filteredData = (data || []).filter((rec) =>
    (rec?.insuranceName || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

 const validateForm = (values) => {
  return (
    values.insuranceId &&
    values.tpaId &&
    values.mode
  );
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setIsFormValid(validateForm(updatedForm));
  };

  const resetForm = () => {
    setFormData({
       mappingId: "",
      insuranceId: "",
      tpaId: "",
      effFrom: "",
      effTo: "",
      mode: "",
    });
    setIsFormValid(false);
  };

const isDuplicate = () => {
  return data.some((rec) => {
    if (
      editingRecord &&
      rec.mappingId === editingRecord.mappingId
    )
      return false;

    return (
      String(rec.insuranceId) ===
        String(formData.insuranceId) &&
      String(rec.tpaId) ===
        String(formData.tpaId)
    );
  });
};

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      showPopup(REQUIRED_FIELDS_ERROR, "error");
      return;
    }

    if (isDuplicate()) {
      showPopup(DUPLICATE_INSURANCE_TPA_MAPPING, "error");
      return;
    }

    setLoading(true);

    try {
     const payload = {
  insuranceId: Number(formData.insuranceId),
  tpaId: Number(formData.tpaId),
  effectiveFrom: formData.effFrom,
  effectiveTo: formData.effTo,
  mode: formData.mode,
};

      if (editingRecord) {
        await putRequest(
          `${INSURANCE_TPA_MAPPING}/update/${formData.mappingId}`,
          payload
        );
        showPopup(RECORD_UPDATED_SUCCESSFULLY, "success");
      } else {
        await postRequest(`${INSURANCE_TPA_MAPPING}/create`, payload);
        showPopup(RECORD_ADDED_SUCCESSFULLY, "success");
      }

      await fetchData();
      handleCancel();
    } catch (error) {
      console.error("Save error:", error);
      showPopup(editingRecord ? "Update Failed" : "Add Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec) => {
  console.log("EDIT RECORD =>", rec);
  setEditingRecord(rec);

  setFormData({
    mappingId: rec.mappingId || "",
    insuranceId: rec.insuranceId || "",
    tpaId: rec.tpaId || "",
    effFrom: rec.effectiveFrom
      ? rec.effectiveFrom.split("T")[0]
      : "",
    effTo: rec.effectiveTo
      ? rec.effectiveTo.split("T")[0]
      : "",
    mode: rec.mode || "",
  });

  setShowForm(true);
  setIsFormValid(true);
};

  const handleStatusChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status === "y" ? "n" : "y",
    });
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    setLoading(true);
    try {
      await putRequest(
        `${INSURANCE_TPA_MAPPING}/status/${confirmDialog.record.mappingId}?status=${confirmDialog.newStatus}`
      );
      showPopup( STATUS_UPDATED_SUCCESSFULLY, "success");
      await fetchData();
    } catch (error) {
      console.error("Status update error:", error);
      showPopup(FAILED_TO_UPDATE_STATUS, "error");
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Insurance TPA Mapping</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : (
                  <></>
                )}
                <div className="d-flex align-items-center ms-auto">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setSearchQuery("");
                          fetchData(1);
                        }}
                      >
                        <i className="mdi mdi-view-list"></i> Show All
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                <>
                  {loading && <div className="text-center">Loading...</div>}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Insurance</th>
                          <th>TPA</th>
                          <th>Effective From</th>
                          <th>Effective To</th>
                          <th>Mode</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((rec) => (
                          <tr key={rec.mappingId}>
                            <td>{rec.insuranceName}</td>
                            <td>{rec.tpaName}</td>
                            <td>{formatDate(rec.effectiveFrom)}</td>
                            <td>{formatDate(rec.effectiveTo)}</td>
                            <td>{rec.mode}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => handleStatusChange(rec)}
                                  id={`switch-${rec.mappingId}`}
                                  disabled={loading}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.mappingId}`}>
                                  {rec.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y" || loading}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredData.length > 0 && (
                    <Pagination
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                  {filteredData.length === 0 && !loading && (
                    <div className="text-center mt-3">No records found</div>
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Insurance <span className="text-danger">*</span></label>
                      <select
                        className="form-select mt-1"
                        name="insuranceId"
                        value={formData.insuranceId}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Insurance</option>
                        {insuranceOptions.map((option) => (
                          <option key={option.insuranceId} value={option.insuranceId}>
  {option.insuranceName}
</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4">
                      <label>TPA <span className="text-danger">*</span></label>
                      <select
                        className="form-select mt-1"
                        name="tpaId"
                        value={formData.tpaId}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select TPA</option>
                        {tpaOptions.map((option) => (
                          <option key={option.tpaId} value={option.tpaId}>
                            {option.tpaName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group col-md-4">
                      <label>Effective From</label>
                      <input
                        className="form-control mt-1"
                        name="effFrom"
                        type="date"
                        value={formData.effFrom}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Effective To</label>
                      <input
                        className="form-control mt-1"
                        name="effTo"
                        type="date"
                        value={formData.effTo}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Mode <span className="text-danger">*</span></label>
                      <select
                        className="form-control mt-1"
                        name="mode"
                        value={formData.mode}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Mode</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingRecord ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && <Popup {...popupMessage} />}
            </div>
          </div>
        </div>
      </div>

      
      {confirmDialog.isOpen && (
                 <div className="modal d-block">
                   <div className="modal-dialog">
                     <div className="modal-content">
                       <div className="modal-header">
                         <h5 className="modal-title">Confirm Status Change</h5>
                         <button
                           type="button"
                           className="close"
                           onClick={() => handleConfirm(false)}
                         >
                           <span>&times;</span>
                         </button>
                       </div>
                       <div className="modal-body">
                         <p>
                           Are you sure you want to{" "}
                           {confirmDialog.newStatus === "y"
                             ? "activate"
                             : "deactivate"}{" "}
                           <strong>{confirmDialog.record?.insuranceName}</strong>?
                         </p>
                       </div>
                       <div className="modal-footer">
                         <button
                           className="btn btn-secondary"
                           onClick={() => handleConfirm(false)}
                         >
                           No
                         </button>
                         <button
                           className="btn btn-primary"
                           onClick={() => handleConfirm(true)}
                         >
                           Yes
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
    </div>
  );
};

export default InsuranceTPAMapping;