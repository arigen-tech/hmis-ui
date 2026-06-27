import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { MAS_WARD_CATEGORY, MAS_CARE_LEVEL } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { ADD_WARD_CATEGORY_SUCC_MSG, DUPLICATE_WARD_CATEGORY, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS, FETCH_CARE_LEVEL_ERR_MSG, FETCH_WARD_CATEGORY_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, UPDATE_WARD_CATEGORY_SUCC_MSG } from "../../../config/constants";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const WardCategoryMaster = () => {
  const [wardCategoryData, setWardCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    categoryId: null,
    newStatus: false,
    categoryName: ""  // Added to store category name
  });

  const [formData, setFormData] = useState({
    categoryName: "",
    description: "",
    careId: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE); // Changed to use constant

  // Dropdown options
  const [careLevelOptions, setCareLevelOptions] = useState([]);

  const CATEGORY_NAME_MAX_LENGTH = 50;
  const DESCRIPTION_MAX_LENGTH = 200;

  // Function to format date as dd/MM/yyyy (matching DesignationMaster format)
  const formatDate = (dateString) => {
    if (!dateString?.trim()) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch care level dropdown data
  const fetchCareLevelData = async () => {
    try {
      const { response } = await getRequest(`${MAS_CARE_LEVEL}/getAll/1`);
      if (response) {
        const list = Array.isArray(response) ? response : [];
        const mappedData = list.map(item => ({
          id: item.careId,
          name: item.careLevelName
        }));
        setCareLevelOptions(mappedData);
      }
    } catch (err) {
      console.error("Error fetching care level data:", err);
      // Don't use showPopup here as it might conflict
      setPopupMessage({
        message: FETCH_CARE_LEVEL_ERR_MSG,
        type: "error",
        onClose: () => setPopupMessage(null)
      });
    }
  };

  // Fetch ward category data
  const fetchWardCategoryData = async (flag = 0) => {
    try {
      setLoading(true);
      const { response } = await getRequest(`${MAS_WARD_CATEGORY}/getAll/${flag}`);
      if (response) {
        const list = Array.isArray(response) ? response : [];
        const mappedData = list.map(item => ({
          id: item.categoryId,
          categoryName: item.categoryName,
          description: item.description,
          careLevel: item.careLevelName || "",
          careId: item.careId,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate),
          createdBy: item.createdBy,
          lastUpdatedBy: item.LastUpdatedBy
        }));
        setWardCategoryData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching ward category data:", err);
      setPopupMessage({
        message: FETCH_WARD_CATEGORY_ERR_MSG,
        type: "error",
        onClose: () => setPopupMessage(null)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardCategoryData(0);
    fetchCareLevelData();
  }, []);

  // Filter data based on search query
  const filteredWardCategoryData = wardCategoryData.filter(category =>
    category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (category.careLevel && category.careLevel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWardCategoryData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWardCategoryData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { categoryName, description, careId } = formData;
      return (
        categoryName.trim() !== "" &&
        description.trim() !== "" &&
        careId.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName,
      description: category.description || "",
      careId: category.careId?.toString() || "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({ categoryName: "", description: "", careId: "" });
    setShowForm(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = wardCategoryData.some(
        (category) =>
          category.categoryName.toLowerCase() === formData.categoryName.toLowerCase() &&
          (!editingCategory || editingCategory.id !== category.id)
      );

      if (isDuplicate) {
        setPopupMessage({
          message: DUPLICATE_WARD_CATEGORY,
          type: "error",
          onClose: () => setPopupMessage(null)
        });
        setLoading(false);
        return;
      }

      if (editingCategory) {
        // Update existing ward category
        const response = await putRequest(`${MAS_WARD_CATEGORY}/update/${editingCategory.id}`, {
          categoryName: formData.categoryName,
          description: formData.description,
          careId: parseInt(formData.careId),
        });

        if (response && response.status === 200) {
          setPopupMessage({
            message: UPDATE_WARD_CATEGORY_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              handleCancel();
              fetchWardCategoryData(0);
              setShowForm(false);
            }
          });
        }
      } else {
        // Add new ward category
        const response = await postRequest(`${MAS_WARD_CATEGORY}/create`, {
          categoryName: formData.categoryName,
          description: formData.description,
          careId: parseInt(formData.careId),
        });

        if (response && response.status === 200) {
          setPopupMessage({
            message: ADD_WARD_CATEGORY_SUCC_MSG,
            type: "success",
            onClose: () => {
              setPopupMessage(null);
              handleCancel();
              fetchWardCategoryData(0);
              setShowForm(false);
            }
          });
        }
      }
    } catch (err) {
      console.error("Error saving ward category data:", err);
      setPopupMessage({
        message: FAIL_TO_SAVE_CHANGES,
        type: "error",
        onClose: () => setPopupMessage(null)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchChange = (id, newStatus, categoryName) => {
    setConfirmDialog({ 
      isOpen: true, 
      categoryId: id, 
      newStatus,
      categoryName: categoryName
    });
  };

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.categoryId !== null) {
        setLoading(true);

        try {
            const response = await putRequest(
                `${MAS_WARD_CATEGORY}/status/${confirmDialog.categoryId}?status=${confirmDialog.newStatus}`
            );

            if (response && response.status === 200) {
                setPopupMessage({
                    message: `Ward category "${
                        confirmDialog.categoryName
                    }" ${
                        confirmDialog.newStatus?.toLowerCase() === "y"
                            ? "activated"
                            : "deactivated"
                    } successfully!`,
                    type: "success",
                    onClose: () => {
                        setPopupMessage(null);
                        fetchWardCategoryData(0);
                        setCurrentPage(1);
                    },
                });
            } else {
                throw new Error(
                    response.message || "Failed to update status"
                );
            }
        } catch (error) {
            console.error("Error updating ward category status:", error);

            setPopupMessage({
                message: FAIL_TO_UPDATE_STS,
                type: "error",
                onClose: () => setPopupMessage(null),
            });
        } finally {
            setLoading(false);
        }
    }

    setConfirmDialog({
        isOpen: false,
        categoryId: null,
        newStatus: "",
        categoryName: "",
    });
};

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchWardCategoryData(0);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Ward Category Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <input
                    className="form-control w-50 me-2"
                    placeholder="Search by Name"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                )}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingCategory(null);
                          setFormData({ categoryName: "", description: "", careId: "" });
                          setShowForm(true);
                        }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-success flex-shrink-0"
                        onClick={handleRefresh}
                      >
                        Show All
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                      Back
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading && !showForm && <LoadingScreen />}

              {!showForm && !loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Ward Category Name</th>
                          <th>Description</th>
                          <th>Care Level Type</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((category) => (
                            <tr key={category.id}>
                              <td>{category.categoryName}</td>
                              <td>{category.description || "N/A"}</td>
                              <td>{category.careLevel}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={category.status?.toLowerCase() === "y"}
                                    onChange={() => handleSwitchChange(
                                      category.id, 
                                      category.status?.toLowerCase() === "y" ? "n" : "y",
                                      category.categoryName
                                    )}
                                  />
                                  <label className="form-check-label ms-2">
                                    {category.status?.toLowerCase() === "y" ? "Active" : "Inactive"}
                                  </label>
                                </div>
                              </td>
                              <td>{category.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleEdit(category)}
                                  disabled={category.status?.toLowerCase() !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No Records Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredWardCategoryData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}

              {showForm && (
                <form className="row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Ward Category Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="categoryName"
                      value={formData.categoryName}
                      onChange={handleInputChange}
                      maxLength={CATEGORY_NAME_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4">
                    <label>Care Level Type <span className="text-danger">*</span></label>
                    <select
                      className="form-control mt-1"
                      id="careId"
                      value={formData.careId}
                      onChange={handleSelectChange}
                      required
                      disabled={loading || careLevelOptions.length === 0}
                    >
                      <option value="">Select Care Level</option>
                      {careLevelOptions.map((careLevel) => (
                        <option key={careLevel.id} value={careLevel.id}>
                          {careLevel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control mt-1"
                      id="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || loading}
                    >
                      {loading ? "Saving..." : editingCategory ? "Update" : "Save"}
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

              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-body">
                        Are you sure you want to{" "}
                        {confirmDialog.newStatus?.toLowerCase() === "y" ? "activate" : "deactivate"}{" "}
                        <strong>{confirmDialog.categoryName}</strong>?
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          No
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Yes"}
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

export default WardCategoryMaster;