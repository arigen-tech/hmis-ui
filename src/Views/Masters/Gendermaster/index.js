import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading"
import axios from "axios";
import { API_HOST, MAS_GENDER } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService"


const Gendermaster = () => {
  const [genderData, setGenderData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, genderId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    genderCode: "",
    genderName: "",
  })
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGender, setEditingGender] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const [itemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState(1);

  const Gender_NAME_MAX_LENGTH = 30;
  const Gender_Code_MAX_LENGTH = 1;




  useEffect(() => {
    fetchGenderData(0);
  }, []);

  const fetchGenderData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_GENDER}/getAll/${flag}`);

      if (response && response.response) {

        const transformedData = response.response.map(gender => ({
          id: gender.id,
          genderCode: gender.genderCode,
          genderName: gender.genderName,
          status: gender.status
        }));

        setGenderData(transformedData);
        setTotalFilteredProducts(transformedData.length);
        setFilteredTotalPages(Math.ceil(transformedData.length / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching gender data:", err);
      showPopup("Failed to load gender data", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredGenderData = genderData.filter(gender =>
    gender.genderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gender.genderCode.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGenderData.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (gender) => {
    setEditingGender(gender);
    setFormData({
      genderCode: gender.genderCode,
      genderName: gender.genderName
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      if (editingGender) {

        const response = await axios.put(`${MAS_GENDER}/updateById/${editingGender.id}`, {
          id: editingGender.id,
          genderCode: formData.genderCode,
          genderName: formData.genderName,
          code: null,
          status: editingGender.status
        });

        if (response && response.response) {

          setGenderData(genderData.map(gender =>
            gender.id === editingGender.id ? response.response : gender
          ));
          showPopup("Gender updated successfully!", "success");
        }
      } else {

        const response = await postRequest(`${MAS_GENDER}/create`, {
          genderCode: formData.genderCode,
          genderName: formData.genderName,
          code: null,
          status: "y"
        });

        const isDuplicate = genderData.some(
          (gender) =>
            gender.genderCode === formData.genderCode ||
            gender.genderName === formData.genderName
        );

        if (isDuplicate) {
          showPopup("Gender already exists!", "error");
          setLoading(false);
          return;
        }

        if (response && response.response) {

          setGenderData([...genderData, response.response]);
          showPopup("New gender added successfully!", "success");
        }
      }

      setEditingGender(null);
      setFormData({ genderCode: "", genderName: "" });
      setShowForm(false);
      fetchGenderData();
    } catch (err) {
      console.error("Error saving gender data:", err);
      showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
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

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, genderId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.genderId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${MAS_GENDER}/status/${confirmDialog.genderId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {

          setGenderData((prevData) =>
            prevData.map((gender) =>
              gender.id === confirmDialog.genderId ?
                { ...gender, status: confirmDialog.newStatus } :
                gender
            )
          );
          showPopup(`Gender ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating gender status:", err);
        showPopup(`Failed to update status: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    }
    setConfirmDialog({ isOpen: false, genderId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));


    if (id === "genderName") {
      setIsFormValid(value.trim() !== "");
    } else if (id === "genderCode") {

      if (!editingGender) {
        setIsFormValid(value.trim() !== "" && formData.genderName.trim() !== "");
      }
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchGenderData();
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
              <h4 className="card-title">Gender Master</h4>
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
                          setEditingGender(null);
                          setFormData({ genderCode: "", genderName: "" });
                          setIsFormValid(false);
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
                        <th>Gender Code</th>
                        <th>Gender Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((gender) => (
                          <tr key={gender.id}>
                            <td>{gender.genderCode}</td>
                            <td>{gender.genderName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={gender.status === "y"}
                                  onChange={() => handleSwitchChange(gender.id, gender.status === "y" ? "n" : "y")}
                                  id={`switch-${gender.id}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${gender.id}`}
                                >
                                  {gender.status === "y" ? 'Active' : 'Deactivated'}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(gender)}
                                disabled={gender.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No gender data found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredGenderData.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredGenderData.length}
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
                  {!editingGender && (
                    <div className="form-group col-md-4">
                      <label>Gender Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control  mt-1"
                        id="genderCode"
                        name="genderCode"
                        placeholder="Gender Code"
                        value={formData.genderCode}
                        onChange={handleInputChange}
                        maxLength={Gender_Code_MAX_LENGTH}
                        required
                      />
                    </div>
                  )}
                  <div className="form-group col-md-4">
                    <label>Gender Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control  mt-1"
                      id="genderName"
                      name="genderName"
                      placeholder="Gender Name"
                      value={formData.genderName}
                      onChange={handleInputChange}
                      maxLength={Gender_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
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
                        <h1 className="modal-title fs-5" id="staticBackdropLabel">Gender Reports</h1>
                        <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>Generate reports for gender data:</p>
                        <div className="list-group">
                          <button type="button" className="list-group-item list-group-item-action">Gender Distribution Report</button>
                          <button type="button" className="list-group-item list-group-item-action">Active/Inactive Gender Status Report</button>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary">Generate Report</button>
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{genderData.find(gender => gender.id === confirmDialog.genderId)?.genderName}</strong>?
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
  )
}

export default Gendermaster