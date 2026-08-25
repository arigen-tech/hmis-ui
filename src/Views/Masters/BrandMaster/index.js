import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BrandMaster = () => {
  // ----- State -----
  const [formData, setFormData] = useState({
    brandName: "",
    manufacturer: "",
    itemType: ""
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    name: ""
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterItemType, setFilterItemType] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState("");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [process, setProcess] = useState(false);

  // ----- Constants -----
  const BRAND_NAME_MAX_LENGTH = 100;
  const MANUFACTURER_MAX_LENGTH = 100;

  // ----- Dummy data -----
  const dummyData = [
    { id: 1, brandName: "Dispovan", manufacturer: "Hindustan Syringes", itemType: "Medical Consumable", status: "Y" },
    { id: 2, brandName: "Polymed", manufacturer: "Poly Medicure Ltd.", itemType: "Medical Consumable", status: "Y" },
    { id: 3, brandName: "BD", manufacturer: "Becton Dickinson India", itemType: "Medical Consumable", status: "Y" }
  ];

  // Unique item types and manufacturers for filters
  const itemTypeOptions = [...new Set(dummyData.map(item => item.itemType))];
  const manufacturerOptions = [...new Set(dummyData.map(item => item.manufacturer))];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setTotalItems(dummyData.length);
      setTotalPages(Math.ceil(dummyData.length / DEFAULT_ITEMS_PER_PAGE));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    const { brandName, manufacturer, itemType } = formData;
    setIsFormValid(brandName.trim() !== "" && manufacturer.trim() !== "" && itemType !== "");
  }, [formData]);

  // ----- Filtered data -----
  const filteredData = data.filter(item => {
    const matchBrand = item.brandName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchItemType = filterItemType ? item.itemType === filterItemType : true;
    const matchManufacturer = filterManufacturer ? item.manufacturer === filterManufacturer : true;
    return matchBrand && matchItemType && matchManufacturer;
  });

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      brandName: item.brandName || "",
      manufacturer: item.manufacturer || "",
      itemType: item.itemType || ""
    });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setProcess(true);
    setTimeout(() => {
      setProcess(false);
      showPopup(editingItem ? "Updated successfully" : "Added successfully", "success", () => {
        resetForm();
        setData(dummyData);
      });
    }, 500);
  };

  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ brandName: "", manufacturer: "", itemType: "" });
    setPopupMessage(null);
  };

  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      }
    });
  };

  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup(`Brand ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`, "success", () => {
          setData(dummyData);
          setCurrentPage(1);
        });
      }, 500);
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleFilterItemType = (e) => setFilterItemType(e.target.value);
  const handleFilterManufacturer = (e) => setFilterManufacturer(e.target.value);

  const handleSearch = () => {
    // Just trigger re-render; filter is already reactive
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterItemType("");
    setFilterManufacturer("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setFilterItemType("");
    setFilterManufacturer("");
    setCurrentPage(1);
    setData(dummyData);
  };

  const handleActivate = () => {
    if (editingItem && editingItem.status?.toLowerCase() === "n") {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup("Brand activated", "success", () => {
          setData(dummyData);
          resetForm();
        });
      }, 500);
    }
  };

  // ----- Pagination slice -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Render -----
  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Brand Master</h4>
              <div className="d-flex align-items-center gap-2">
                {!showForm ? (
                  <>
                    <button className="btn btn-success" onClick={() => {
                      setEditingItem(null);
                      setFormData({ brandName: "", manufacturer: "", itemType: "" });
                      setShowForm(true);
                    }}><i className="mdi mdi-plus"></i> Add</button>
                    <button className="btn btn-success" onClick={handleRefresh}><i className="mdi mdi-refresh"></i> Show All</button>

                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={resetForm}><i className="mdi mdi-arrow-left"></i> Back</button>
                )}
              </div>
            </div>

            <div className="card-body">
              {!showForm ? (
                // ----- List view with filters -----
                <>
                  {/* Filter row */}
                  <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                    <div className="col-md-2">
                      <label className="mb-1"><b>Item Type</b></label>
                      <select className="form-select" value={filterItemType} onChange={handleFilterItemType}>
                        <option value="">All Item Types</option>
                        {itemTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="mb-1"><b>Manufacturer</b></label>
                      <select className="form-select" value={filterManufacturer} onChange={handleFilterManufacturer}>
                        <option value="">All Manufacturers</option>
                        {manufacturerOptions.map(mfg => (
                          <option key={mfg} value={mfg}>{mfg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="mb-1"><b>Brand Name</b></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Brand Name..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="col-md-2" style={{ marginTop: '28px' }}>
                      <button className="btn btn-primary me-2" onClick={handleSearch}>
                        <i className="fa fa-search"></i> Search
                      </button>
                      <button className="btn btn-secondary" onClick={handleReset}>
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>S No.</th>
                          <th>Brand Name</th>
                          <th>Manufacturer</th>
                          <th>Item Type</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item, idx) => (
                            <tr key={item.id}>
                              <td>{indexOfFirstItem + idx + 1}</td>
                              <td>{item.brandName}</td>
                              <td>{item.manufacturer}</td>
                              <td>{item.itemType}</td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={item.status === "Y"}
                                    onChange={() => handleSwitchChange(item.id, item.brandName, item.status === "Y" ? "n" : "y")}
                                  />
                                  <label className="form-check-label">{item.status === "Y" ? "Active" : "Deactivated"}</label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEdit(item)}
                                  disabled={item.status !== "Y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="text-center">No records found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    totalItems={filteredData.length}
                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                // ----- Add / Edit Form -----
                <form className="row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>Brand Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="brandName"
                        placeholder="Enter brand name"
                        value={formData.brandName}
                        onChange={handleInputChange}
                        maxLength={BRAND_NAME_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>Manufacturer <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="manufacturer"
                        placeholder="Enter manufacturer"
                        value={formData.manufacturer}
                        onChange={handleInputChange}
                        maxLength={MANUFACTURER_MAX_LENGTH}
                        required
                        disabled={process}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>Item Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="itemType"
                        value={formData.itemType}
                        onChange={handleSelectChange}
                        required
                        disabled={process}
                      >
                        <option value="">Select Item Type</option>
                        {itemTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary me-2" disabled={process || !isFormValid}>
                      {process ? "Processing..." : (editingItem ? "Update" : "Save")}
                    </button>
                    {editingItem && editingItem.status === "N" && (
                      <button type="button" className="btn btn-success me-2" onClick={handleActivate} disabled={process}>
                        Activate
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={resetForm} disabled={process}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
              {confirmDialog.isOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header"><h5>Confirm Status Change</h5><button className="btn-close" onClick={() => handleConfirm(false)}></button></div>
                      <div className="modal-body"><p>Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} <strong>{confirmDialog.name}</strong>?</p></div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>{process ? "Processing..." : "Confirm"}</button>
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

export default BrandMaster;