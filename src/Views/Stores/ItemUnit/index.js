import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { MAS_STORE_UNIT } from "../../../config/apiConfig";

const StoreUnitMaster = () => {
  const [storeUnits, setStoreUnits] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, unitId: null, newStatus: false });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    unitName: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [totalFilteredUnits, setTotalFilteredUnits] = useState(0);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState(1);

  const UNIT_NAME_MAX_LENGTH = 30;

  useEffect(() => {
    fetchStoreUnits(0);
  }, []);

  const fetchStoreUnits = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_STORE_UNIT}/getAll/${flag}`);
  
      if (response && response.response) {
        const transformedData = response.response.map(unit => ({
          // Map unitId to id for consistency in the frontend
          id: unit.unitId || unit.id,
          unitName: unit.unitName,
          status: unit.status
        }));
  
        setStoreUnits(transformedData);
        setTotalFilteredUnits(transformedData.length);
        setFilteredTotalPages(Math.ceil(transformedData.length / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching store unit data:", err);
      if (err.response) {
        console.error("Error response:", err.response);
      }
      showPopup(`Failed to load store unit data: ${err.message || "Unknown server error"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredStoreUnits = storeUnits.filter(unit =>
    unit.unitName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStoreUnits.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitName: unit.unitName
    });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      if (editingUnit) {
        const response = await putRequest(`${MAS_STORE_UNIT}/updateById/${editingUnit.id}`, {
          id: editingUnit.id,
          unitName: formData.unitName,
          status: editingUnit.status
        });

        if (response && response.response) {
          // Make sure to map unitId to id if needed
          const updatedUnit = {
            id: response.response.unitId || response.response.id,
            unitName: response.response.unitName,
            status: response.response.status
          };
          
          setStoreUnits(storeUnits.map(unit =>
            unit.id === editingUnit.id ? updatedUnit : unit
          ));
          showPopup("Store unit updated successfully!", "success");
        }
      } else {
        const isDuplicate = storeUnits.some(
          (unit) => unit.unitName.toLowerCase() === formData.unitName.toLowerCase()
        );

        if (isDuplicate) {
          showPopup("Store unit already exists!", "error");
          setLoading(false);
          return;
        }

        const response = await postRequest(`${MAS_STORE_UNIT}/create`, {
          unitName: formData.unitName,
          status: "y"
        });

        if (response && response.response) {
          // Map the response to match our frontend structure
          const newUnit = {
            id: response.response.unitId || response.response.id,
            unitName: response.response.unitName,
            status: response.response.status
          };
          
          setStoreUnits([...storeUnits, newUnit]);
          showPopup("New store unit added successfully!", "success");
        }
      }

      setEditingUnit(null);
      setFormData({ unitName: "" });
      setShowForm(false);
      fetchStoreUnits();
    } catch (err) {
      console.error("Error saving store unit data:", err);
      showPopup(`Failed to save changes: ${err.response?.message || err.message}`, "error");
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
    // Make sure id is defined before proceeding
    if (id === undefined || id === null) {
      showPopup("Unit ID is invalid. Cannot update status.", "error");
      return;
    }
    setConfirmDialog({ isOpen: true, unitId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.unitId !== null) {
      try {
        setLoading(true);
        
        // Verify unitId exists and is not undefined
        if (confirmDialog.unitId === undefined) {
          throw new Error("Unit ID is undefined");
        }

        const response = await putRequest(
          `${MAS_STORE_UNIT}/status/${confirmDialog.unitId}?stat=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          // Handle the response consistently
          const updatedUnit = {
            id: response.response.unitId || response.response.id,
            unitName: response.response.unitName,
            status: response.response.status
          };
          
          setStoreUnits((prevData) =>
            prevData.map((unit) =>
              unit.id === confirmDialog.unitId ? 
                { ...unit, status: updatedUnit.status } : 
                unit
            )
          );
          showPopup(`Store unit ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success");
        }
      } catch (err) {
        console.error("Error updating store unit status:", err);
        showPopup(`Failed to update status: ${err.response?.message || err.message}`, "error");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    }
    setConfirmDialog({ isOpen: false, unitId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    setIsFormValid(value.trim() !== "");
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchStoreUnits();
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
              <h4 className="card-title">Store Unit Master</h4>
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
                          setEditingUnit(null);
                          setFormData({ unitName: "" });
                          setIsFormValid(false);
                          setShowForm(true);
                        }}
                      >
                        <i className="mdi mdi-plus"></i> Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success me-2"
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
                        <th>Unit Name</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((unit) => (
                          <tr key={unit.id}>
                            <td>{unit.unitName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={unit.status === "y"}
                                  onChange={() => handleSwitchChange(unit.id, unit.status === "y" ? "n" : "y")}
                                  id={`switch-${unit.id}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${unit.id}`}
                                >
                                  {unit.status === "y" ? 'Active' : 'Deactivated'}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(unit)}
                                disabled={unit.status !== "y"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">No store units found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredStoreUnits.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredStoreUnits.length}
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
                  <div className="form-group col-md-4">
                    <label>Unit Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="unitName"
                      name="unitName"
                      placeholder="Unit Name"
                      value={formData.unitName}
                      onChange={handleInputChange}
                      maxLength={UNIT_NAME_MAX_LENGTH}
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{storeUnits.find(unit => unit.id === confirmDialog.unitId)?.unitName}</strong>?
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

export default StoreUnitMaster;