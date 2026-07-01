import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_WARD_CATEGORY_GET_ALL, MAS_WARD_GET_ALL, MAS_WARD_STATUS, MAS_WARD_UPDATE, MAS_WARD_CREATE, MAS_WARD_GET_BY_ID, MAS_CARE_LEVEL } from "../../../config/apiConfig";


const WardManagement = () => {
  const initialWardData = [];

  const [categoryOptions, setCategoryOptions] = useState([
    { value: "", label: "Select Category" }
  ]);

  const [careLevelOptions, setCareLevelOptions] = useState([
    { value: "", label: "Select Care Level" }
  ]);

  const [wardData, setWardData] = useState(initialWardData);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    wardId: null,
    newStatus: false
  });

  const [formData, setFormData] = useState({
    wardName: "",
    category: "",
    careLevel: "",
  });

  const mapApiWardToView = (ward) => ({
    id: ward.wardId,
    wardName: ward.wardName || "",
    category: ward.wardCategoryName || "",
    careLevel: ward.careLevelName || "",
    categoryId: ward.wardCategoryId || ward.categoryId || "",
    careLevelId: ward.careLevelId || ward.careId || "",
    status: (ward.status || "").toUpperCase() === "Y" ? "y" : "n",
    lastUpdated: ward.lastUpdateDate || "",
  });

  const fetchWardData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(MAS_WARD_GET_ALL);
      if (data?.status === 200) {
        setWardData((data.response || []).map(mapApiWardToView));
      } else {
        console.error("Unexpected ward API response:", data);
      }
    } catch (error) {
      console.error("Error loading ward data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const data = await getRequest(MAS_WARD_CATEGORY_GET_ALL);
      const list = Array.isArray(data?.response) ? data.response : [];
      setCategoryOptions([
        { value: "", label: "Select Category" },
        ...list.map((item) => ({
          value: item.categoryId?.toString() || item.wardCategoryId?.toString() || "",
          label: item.wardCategoryName || item.categoryName || ""
        }))
      ]);
    } catch (error) {
      console.error("Error loading ward categories:", error);
    }
  };

  const fetchCareLevelOptions = async () => {
    try {
      const data = await getRequest(`${MAS_CARE_LEVEL}/getAll/1`);
      const list = Array.isArray(data?.response) ? data.response : [];
      setCareLevelOptions([
        { value: "", label: "Select Care Level" },
        ...list.map((item) => ({
          value: item.careId?.toString() || "",
          label: item.careLevelName || ""
        }))
      ]);
    } catch (error) {
      console.error("Error loading care levels:", error);
    }
  };

  const openWardForm = async (ward = null) => {
    await Promise.all([fetchCategoryOptions(), fetchCareLevelOptions()]);
    if (ward) {
      setEditingWard(ward);
      setFormData({
        wardName: ward.wardName,
        category: ward.categoryId?.toString() || "",
        careLevel: ward.careLevelId?.toString() || "",
      });
    } else {
      setEditingWard(null);
      setFormData({ wardName: "", category: "", careLevel: "" });
    }
    setShowForm(true);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");

  const WARD_NAME_MAX_LENGTH = 100;

  // Filter data based on search query
  const filteredWardData = wardData.filter(ward =>
    ward.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ward.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ward.careLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWardData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWardData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    fetchWardData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery]);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Validate form whenever formData changes
  useEffect(() => {
    const validateForm = () => {
      const { wardName, category, careLevel } = formData;
      return (
        wardName.trim() !== "" &&
        category.trim() !== "" &&
        careLevel.trim() !== ""
      );
    };
    setIsFormValid(validateForm());
  }, [formData]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = async (ward) => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_WARD_GET_BY_ID}/${ward.id}`);
      if (data?.status === 200 && data.response) {
        const apiWard = data.response;
        const mapped = mapApiWardToView(apiWard);
        await openWardForm(mapped);
      } else {
        console.error("Failed to fetch ward by id:", data);
        showPopup("Failed to load ward details", "error");
      }
    } catch (err) {
      console.error("Error fetching ward details:", err);
      showPopup("Failed to load ward details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingWard) {
        const payload = {
          wardName: formData.wardName,
          wardCategoryId: Number(formData.category),
          careLevelId: Number(formData.careLevel)
        };

        const response = await putRequest(`${MAS_WARD_UPDATE}/${editingWard.id}`, payload);
        if (response?.status !== 200) {
          throw new Error(`Failed to update ward: ${response?.status}`);
        }

        const updatedData = wardData.map(item =>
          item.id === editingWard.id
            ? {
              ...item,
              wardName: formData.wardName,
              category: categoryOptions.find(opt => opt.value === formData.category)?.label || item.category,
              careLevel: careLevelOptions.find(opt => opt.value === formData.careLevel)?.label || item.careLevel,
              categoryId: formData.category,
              careLevelId: formData.careLevel,
              lastUpdated: new Date().toLocaleString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(',', '')
            }
            : item
        );

        setWardData(updatedData);
        showPopupWithCallback("Ward updated successfully!", "success", async () => {
          setEditingWard(null);
          setFormData({ wardName: "", category: "", careLevel: "" });
          setShowForm(false);
          await fetchWardData();
        });
      } else {
        // Add new ward
        const newWard = {
          id: wardData.length + 1,
          wardName: formData.wardName,
          category: formData.category,
          careLevel: formData.careLevel,
          status: "y",
          lastUpdated: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(',', '')
        };

          const payload = {
            wardName: formData.wardName,
            wardCategoryId: Number(formData.category),
            careLevelId: Number(formData.careLevel)
          };

          const createResp = await postRequest(`${MAS_WARD_CREATE}`, payload);
          if (createResp?.status !== 200) {
            throw new Error(`Failed to create ward: ${createResp?.status}`);
          }

          showPopupWithCallback("New ward added successfully!", "success", async () => {
            setEditingWard(null);
            setFormData({ wardName: "", category: "", careLevel: "" });
            setShowForm(false);
            await fetchWardData();
          });
      }
    } catch (err) {
      console.error("Error saving ward data:", err);
      showPopupWithCallback(`Failed to save changes: ${err.message}`, "error", async () => {
        setShowForm(false);
        setEditingWard(null);
        setFormData({ wardName: "", category: "", careLevel: "" });
        await fetchWardData();
      });
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

  // showPopup with optional afterClose callback
  const showPopupWithCallback = (message, type = 'info', afterClose = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (afterClose) afterClose();
      }
    });
  };

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, wardId: id, newStatus });
  };

  const handleConfirm = async (confirmed) => {
    // If user cancelled the confirmation dialog, just close it
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, wardId: null, newStatus: null });
      return;
    }

    if (confirmDialog.wardId === null) return;

    // Close the confirmation dialog immediately after user confirms
    setConfirmDialog({ isOpen: false, wardId: null, newStatus: null });

    try {
      setLoading(true);

      const statusValue = confirmDialog.newStatus === "y" ? "Y" : "N";
      const response = await putRequest(`${MAS_WARD_STATUS}/${confirmDialog.wardId}?status=${statusValue}`, {});

      if (response?.status === 200) {
        // Do not update list until user confirms the success popup
        showPopupWithCallback(
          `Ward ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
          "success",
          async () => {
            await fetchWardData();
            setConfirmDialog({ isOpen: false, wardId: null, newStatus: null });
          }
        );
      } else {
        throw new Error(`Status update failed: ${response?.status}`);
      }
    } catch (err) {
      console.error("Error updating ward status:", err);
      showPopupWithCallback(`Failed to update status: ${err.message}`, "error", async () => {
        await fetchWardData();
        setConfirmDialog({ isOpen: false, wardId: null, newStatus: null });
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleRefresh = async () => {
    setSearchQuery("");
    setCurrentPage(1);
    setPageInput("1");
    await fetchWardData();
    showPopup("Data refreshed!", "success");
  };

  
  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Ward Management</h4>
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
                        onClick={() => openWardForm()}
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
                <>
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Ward Name</th>
                          <th>Category</th>
                          <th>Care Level</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((ward) => (
                            <tr key={ward.id}>
                              <td>{ward.wardName}</td>
                              <td>{ward.category}</td>
                              <td>{ward.careLevel}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={ward.status === "y"}
                                    onChange={() => handleSwitchChange(ward.id, ward.status === "y" ? "n" : "y")}
                                    id={`switch-${ward.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${ward.id}`}
                                  >
                                    {ward.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>{ward.lastUpdated}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleEdit(ward)}
                                  disabled={ward.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No ward data found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    totalItems={filteredWardData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  /> 
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-4">
                    <label>Ward Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="wardName"
                      name="wardName"
                      placeholder="Enter ward name"
                      value={formData.wardName}
                      onChange={handleInputChange}
                      maxLength={WARD_NAME_MAX_LENGTH}
                      required
                    />
                    <small className="text-muted">
                      {formData.wardName.length}/{WARD_NAME_MAX_LENGTH} characters
                    </small>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Category <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleSelectChange}
                      required
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select a ward category</small>
                  </div>

                  <div className="form-group col-md-4">
                    <label>Care Level <span className="text-danger">*</span></label>
                    <select
                      className="form-select mt-1"
                      id="careLevel"
                      name="careLevel"
                      value={formData.careLevel}
                      onChange={handleSelectChange}
                      required
                    >
                      {careLevelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Select care level for this ward</small>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid}
                    >
                      {editingWard ? 'Update' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowForm(false)}
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
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'}
                          <strong> {wardData.find(ward => ward.id === confirmDialog.wardId)?.wardName}</strong>?
                        </p>
                        <p className="text-muted">
                          {confirmDialog.newStatus === "y"
                            ? "This will make the ward available for patient allocation."
                            : "This will hide the ward from patient allocation."}
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Confirm</button>
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

export default WardManagement;