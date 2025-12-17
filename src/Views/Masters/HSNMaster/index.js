import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { API_HOST, MAS_HSN } from "../../../config/apiConfig";

const HSNMaster = () => {
  const [hsnData, setHsnData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, hsnId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    hsnCode: "",
    gstRate: "",
    isMedicine: false,
    hsnCategory: "",
    hsnSubcategory: "",
    effectiveFrom: "",
    effectiveTo: "",
  });

  const [dateError, setDateError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHsn, setEditingHsn] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [itemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState(1);

  useEffect(() => {
    fetchHsnData(0);
  }, []);

  const fetchHsnData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_HSN}/getAll/${flag}`);

      if (response && response.response) {
        setHsnData(response.response);
        setTotalFilteredProducts(response.response.length);
        setFilteredTotalPages(Math.ceil(response.response.length / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching HSN data:", err);
      showPopup("Failed to load HSN data", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateDates = () => {
    if (formData.effectiveTo && formData.effectiveFrom &&
      new Date(formData.effectiveTo) < new Date(formData.effectiveFrom)) {
      setDateError("Effective To date cannot be before From date");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredHsnData = hsnData.filter(hsn =>
    hsn.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hsn.hsnCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hsn.hsnSubcategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHsnData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (hsn) => {
    setEditingHsn(hsn);
    setFormData({
      hsnCode: hsn.hsnCode,
      gstRate: hsn.gstRate.toString(),
      isMedicine: hsn.isMedicine,
      hsnCategory: hsn.hsnCategory,
      hsnSubcategory: hsn.hsnSubcategory,
      effectiveFrom: hsn.effectiveFrom,
      effectiveTo: hsn.effectiveTo || ""
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // ✅ 1️⃣ Validate date fields first (your own function)
    if (!validateDates()) return;

    // ✅ 2️⃣ Validate GST rate
    const gstRateValue = parseFloat(formData.gstRate);
    if (
      isNaN(gstRateValue) ||
      gstRateValue < 0 ||
      gstRateValue > 100
    ) {
      showPopup("Please enter a valid GST Rate between 0 and 100.", "error");
      return;
    }

    try {
      setLoading(true);

      // ✅ 3️⃣ Build payload
      const payload = {
        hsnCode: formData.hsnCode,
        gstRate: gstRateValue, // use validated value
        isMedicine: formData.isMedicine,
        hsnCategory: formData.hsnCategory,
        hsnSubcategory: formData.hsnSubcategory,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || null,
        status: editingHsn ? editingHsn.status : "y", // preserve status if updating
      };

      // ✅ 4️⃣ Make request: PUT for update, POST for create
      let response;
      if (editingHsn) {
        response = await putRequest(
          `${MAS_HSN}/update/${editingHsn.hsnCode}`,
          payload
        );

        if (response && response.response) {
          setHsnData((prevData) =>
            prevData.map((hsn) =>
              hsn.hsnCode === editingHsn.hsnCode ? response.response : hsn
            )
          );
          showPopup("HSN updated successfully!", "success");
        }
      } else {
        response = await postRequest(`${MAS_HSN}/create`, payload);

        if (response && response.response) {
          setHsnData((prevData) => [...prevData, response.response]);
          showPopup("New HSN added successfully!", "success");
        }
      }

      // ✅ 5️⃣ Reset form & close modal
      setEditingHsn(null);
      setFormData({
        hsnCode: "",
        gstRate: "",
        isMedicine: false,
        hsnCategory: "",
        hsnSubcategory: "",
        effectiveFrom: "",
        effectiveTo: "",
      });
      setShowForm(false);

      // ✅ 6️⃣ Refresh table data
      fetchHsnData();

    } catch (err) {
      console.error("Error saving HSN data:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to save changes due to server error";
      showPopup(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };


  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  const handleSwitchChange = (hsnCode, newStatus) => {
    setConfirmDialog({ isOpen: true, hsnId: hsnCode, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.hsnId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_HSN}/status/${confirmDialog.hsnId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          setHsnData(prevData =>
            prevData.map(hsn =>
              hsn.hsnCode === confirmDialog.hsnId ?
                { ...hsn, status: confirmDialog.newStatus } :
                hsn
            )
          );
          showPopup(`HSN ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating HSN status:", err);
        const errorMessage = err.response?.data?.message ||
          err.message ||
          "Failed to update status due to server error";
        showPopup(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, hsnId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { id, checked } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: checked }));
  };

  const handleDateChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
    validateDates();
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchHsnData();
  };

  const handlePageNavigation = () => {
    const pageNumber = Number(pageInput);
    if (pageNumber >= 1 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
      pageNumbers.push(filteredTotalPages);
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ));
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">HSN Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search Religions"
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
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingHsn(null);
                          setFormData({
                            hsnCode: "",
                            gstRate: "",
                            isMedicine: false,
                            hsnCategory: "",
                            hsnSubcategory: "",
                            effectiveFrom: "",
                            effectiveTo: ""
                          });
                          setShowForm(true);
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
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>HSN Code</th>
                        <th>GST Rate (%)</th>
                        <th>Is Medicine</th>
                        <th>HSN Category</th>
                        <th>HSN Subcategory</th>
                        <th>Effective From</th>
                        <th>Effective To</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((hsn) => (
                          <tr key={hsn.hsnCode}>
                            <td>{hsn.hsnCode}</td>
                            <td>{hsn.gstRate.toFixed(2)}</td>
                            <td style={{ textTransform: "uppercase" }}>{hsn.isMedicine ? "TRUE" : "FALSE"}</td>
                            <td>{hsn.hsnCategory}</td>
                            <td>{hsn.hsnSubcategory}</td>
                            <td>{hsn.effectiveFrom}</td>
                            <td>{hsn.effectiveTo || "NULL"}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={hsn.status === "y"}
                                  onChange={() => handleSwitchChange(hsn.hsnCode, hsn.status === "y" ? "n" : "y")}
                                  id={`switch-${hsn.hsnCode}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${hsn.hsnCode}`}
                                >
                                  {hsn.status === "y" ? 'Active' : 'Deactivated'}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(hsn)}
                                disabled={hsn.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center">No HSN data found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredHsnData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredHsnData.length}
                        </span>
                      </div>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            &laquo; Previous
                          </button>
                        </li>
                        {renderPagination()}
                        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === filteredTotalPages}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                      <div className="d-flex align-items-center">
                        <input
                          type="number"
                          min="1"
                          max={filteredTotalPages}
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          placeholder="Go to page"
                          className="form-control me-2"
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handlePageNavigation}
                        >
                          Go
                        </button>
                      </div>
                    </nav>
                  )}
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>HSN Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="hsnCode"
                        placeholder="HSN Code"
                        value={formData.hsnCode}
                        onChange={handleInputChange}
                        required
                        disabled={!!editingHsn}
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>GST Rate (%) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mt-1"
                        id="gstRate"
                        placeholder="GST Rate"
                        value={formData.gstRate}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Is Medicine <span className="text-danger">*</span></label>
                      <select
                        className="form-control mt-1"
                        id="isMedicine"
                        value={formData.isMedicine}
                        onChange={(e) => setFormData({ ...formData, isMedicine: e.target.value === "true" })}
                        required
                      >
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div className="form-group col-md-4">
                      <label>HSN Category <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="hsnCategory"
                        placeholder="HSN Category"
                        value={formData.hsnCategory}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>HSN Subcategory <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control mt-1"
                        id="hsnSubcategory"
                        placeholder="HSN Subcategory"
                        value={formData.hsnSubcategory}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Effective From <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control mt-1"
                        id="effectiveFrom"
                        value={formData.effectiveFrom}
                        onChange={handleDateChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Effective To</label>
                      <input
                        type="date"
                        className={`form-control mt-1 ${dateError ? "is-invalid" : ""}`}
                        id="effectiveTo"
                        value={formData.effectiveTo}
                        onChange={handleDateChange}
                        min={formData.effectiveFrom || undefined}
                      />
                      {dateError && (
                        <div className="invalid-feedback">{dateError}</div>
                      )}
                    </div>
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2">
                      Save
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{hsnData.find(hsn => hsn.hsnCode === confirmDialog.hsnId)?.hsnCode}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
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

export default HSNMaster;