import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_SERVICE_CATEGORY } from "../../../config/apiConfig";


const ServiceCategoryMaster = () => {
  const [formData, setFormData] = useState({
    serviceCatName: "",
    sacCode: "",
    gstApplicable: false,
  });


  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null, newStatus: false })
  const [loading, setLoading] = useState(false);
  const [process, setProcess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("")
  const [serviceCategoryData, setServiceCategoryData] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentItem, setCurrentItem] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  useEffect(() => {
    fetchServicecategoryData();
  }, []);

  const fetchServicecategoryData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_SERVICE_CATEGORY}/getAll/0`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setServiceCategoryData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setServiceCategoryData([]);
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredServiceList = serviceCategoryData.filter(
    (item) =>
      (item?.serviceCatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item?.sacCode?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false
  )

  console.log("filteredServiceList", filteredServiceList);

  const filteredTotalPages = Math.ceil(filteredServiceList.length / itemsPerPage)

  const currentItems = filteredServiceList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  console.log("currentItems", currentItems);

  const handleEdit = (item) => {
    setEditingService(item);
    setShowForm(true);
    setFormData({
      serviceCatName: item.serviceCatName,
      sacCode: item.sacCode,
      gstApplicable: !!item.gstApplicable,
    });
    setIsFormValid(true);
  };


  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);
    try {
      let response;
      const payload = {
        serviceCatName: formData.serviceCatName,
        sacCode: formData.sacCode,
        gstApplicable: formData.gstApplicable,
      };

      if (editingService) {
        response = await putRequest(`${MAS_SERVICE_CATEGORY}/update/${editingService.id}`, payload);
      } else {
        response = await postRequest(`${MAS_SERVICE_CATEGORY}/save`, payload);
      }

      if (response.status === 200) {
        showPopup(
          editingService
            ? "Service Category updated successfully!"
            : "New Service Category added successfully!",
          "success"
        );

        await fetchServicecategoryData();

        setEditingService(null);
        setShowForm(false);
        setFormData({
          serviceCatName: "",
          sacCode: "",
          gstApplicable: false,
        });
      } else {
        throw new Error(response.message || 'Failed to save service category');
      }
    } catch (error) {
      console.error("Error saving service category:", error);
      showPopup(error.message || "Error saving service category. Please try again.", "error");
    } finally {
      setProcess(false);
    }
  };


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSwitchChange = (id, name, newStatus) => {
    setCurrentItem(name);
    setConfirmDialog({ isOpen: true, serviceId: id, newStatus });
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.serviceId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_SERVICE_CATEGORY}/updateStatus/${confirmDialog.serviceId}?status=${confirmDialog.newStatus}`
        );

        if (response.status === 200) {
          showPopup(
            `Service Category ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
            "success"
          );
          await fetchServicecategoryData();
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(error.message || "Error updating status. Please try again.", "error");
      } finally {
        setProcess(false);
      }
      setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null });
    } else {
      setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null });
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.serviceCatName &&
      !!updatedFormData.sacCode &&
      (updatedFormData.gstApplicable === true || updatedFormData.gstApplicable === false)
    )
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.serviceCatName &&
      !!updatedFormData.sacCode &&
      (updatedFormData.gstApplicable === true || updatedFormData.gstApplicable === false)
    )
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
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
    ))
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {loading && (
              <LoadingScreen />
            )}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Service Category Master</h4>

              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Service Category Code</th>
                        <th>Service Category</th>
                        <th>SAC Code</th>
                        <th>Last Changed By</th>
                        <th>Last Changed Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.serviceCateCode}</td>
                            <td>{item.serviceCatName}</td>
                            <td>{item.sacCode}</td>
                            <td>{item.lastChgBy}</td>
                            <td>{new Date(item.lastChgDt).toLocaleDateString()}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.status === "y"}
                                  onChange={() => handleSwitchChange(item.id, item.serviceCatName, item.status === "y" ? "n" : "y")}
                                  id={`switch-${item.id}`}
                                />
                                <label
                                  className="form-check-label px-0"
                                  htmlFor={`switch-${item.id}`}
                                >
                                  {item.status === "y" ? "Active" : "Deactivated"}
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
                          <td colSpan="7" className="text-center">
                            <div className="p-3">
                              <i className="fa fa-folder-open fa-2x text-muted"></i>
                              <p className="text-muted mb-0">No records found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="d-flex justify-content-end">
                    
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      setShowForm(false);
                      setFormData({
                        serviceCatName: "",
                        sacCode: "",
                        gstApplicable: false,
                      });
                      setEditingService(null);
                    }}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Category Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceCatName"
                        placeholder="Service Category Name"
                        onChange={handleInputChange}
                        value={formData.serviceCatName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        SAC Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="sacCode"
                        placeholder="SAC Code"
                        onChange={handleInputChange}
                        value={formData.sacCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        GST Applicable <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="gstApplicable"
                        onChange={(e) =>
                          setFormData({ ...formData, gstApplicable: e.target.value === "true" })
                        }
                        value={formData.gstApplicable === true ? "true" : formData.gstApplicable === false ? "false" : ""}
                        required
                      >
                        <option value="">Select GST Applicable</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>



                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {editingService ? 'Update' : 'Save'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          serviceCatName: "",
                          sacCode: "",
                          gstApplicable: false,
                        });
                        setEditingService(null);
                      }}
                      disabled={process}
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              )}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
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
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {currentItem}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredServiceList.length}
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
                    <button className="btn btn-primary" onClick={handlePageNavigation}>
                      Go
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCategoryMaster
