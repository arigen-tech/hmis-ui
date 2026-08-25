
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const OTTeamRoleMaster = () => {
  const [formData, setFormData] = useState({ roleName: "" });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, id: null, newStatus: "", name: "" });
  const [searchQuery, setSearchQuery] = useState("");
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

  const ROLE_NAME_MAX_LENGTH = 100;

  const dummyData = [
    { id: 1, roleName: "Surgeon", status: "Y" },
    { id: 2, roleName: "Anaesthetist", status: "Y" },
    { id: 3, roleName: "Scrub Nurse", status: "N" }
  ];

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
    setIsFormValid(formData.roleName.trim() !== "");
  }, [formData]);

  const filteredData = data.filter(item =>
    item.roleName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (page) => setCurrentPage(page);
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ roleName: item.roleName || "" });
    setShowForm(true);
  };
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setProcess(true);
    setTimeout(() => {
      setProcess(false);
      showPopup(editingItem ? "Updated" : "Added", "success", () => {
        resetForm();
        setData(dummyData);
      });
    }, 500);
  };
  const resetForm = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({ roleName: "" });
    setPopupMessage(null);
  };
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({ message, type, onClose: () => { setPopupMessage(null); if (onCloseCallback) onCloseCallback(); } });
  };
  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ isOpen: true, id, newStatus, name });
  };
  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.id !== null) {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup(`Role ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"}`, "success", () => {
          setData(dummyData);
          setCurrentPage(1);
        });
      }, 500);
    }
    setConfirmDialog({ isOpen: false, id: null, newStatus: "", name: "" });
  };
  const handleInputChange = (e) => {
    setFormData({ roleName: e.target.value });
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setData(dummyData);
  };
  const handleActivate = () => {
    if (editingItem && editingItem.status?.toLowerCase() === "n") {
      setProcess(true);
      setTimeout(() => {
        setProcess(false);
        showPopup("Role activated", "success", () => { setData(dummyData); resetForm(); });
      }, 500);
    }
  };

  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OT Team Role Master</h4>
              <div className="d-flex gap-2">
                {!showForm ? (
                  <>
                    <form className="d-inline-block searchform me-2">
                      <div className="input-group searchinput">
                        <input type="search" className="form-control" placeholder="Search role..." value={searchQuery} onChange={handleSearchChange} />
                        <span className="input-group-text"><i className="fa fa-search"></i></span>
                      </div>
                    </form>
                    <button className="btn btn-success" onClick={handleRefresh}><i className="mdi mdi-refresh"></i> Show All</button>
                    <button className="btn btn-success" onClick={() => { setEditingItem(null); setFormData({ roleName: "" }); setShowForm(true); }}><i className="mdi mdi-plus"></i> Add</button>
                  </>
                ) : (
                  <button className="btn btn-secondary" onClick={resetForm}><i className="mdi mdi-arrow-left"></i> Back</button>
                )}
              </div>
            </div>
            <div className="card-body">
              {!showForm ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light"><tr><th>Role Name</th><th>Status</th><th>Edit</th></tr></thead>
                      <tbody>
                        {currentItems.length > 0 ? currentItems.map(item => (
                          <tr key={item.id}>
                            <td>{item.roleName}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" checked={item.status === "Y"} onChange={() => handleSwitchChange(item.id, item.roleName, item.status === "Y" ? "n" : "y")} />
                                <label className="form-check-label">{item.status === "Y" ? "Active" : "Deactivated"}</label>
                              </div>
                            </td>
                            <td><button className="btn btn-sm btn-success" onClick={() => handleEdit(item)} disabled={item.status !== "Y"}><i className="fa fa-pencil"></i></button></td>
                          </tr>
                        )) : <tr><td colSpan="3" className="text-center">No records</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={filteredData.length} itemsPerPage={DEFAULT_ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={handlePageChange} />
                </>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-6">
                      <label>Role Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Enter role name" value={formData.roleName} onChange={handleInputChange} maxLength={ROLE_NAME_MAX_LENGTH} required disabled={process} />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-primary me-2" type="submit" disabled={process || !isFormValid}>{process ? "Processing..." : (editingItem ? "Update" : "Save")}</button>
                    {editingItem && editingItem.status === "N" && <button className="btn btn-success me-2" type="button" onClick={handleActivate} disabled={process}>Activate</button>}
                    <button className="btn btn-danger" type="button" onClick={resetForm} disabled={process}>Cancel</button>
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

export default OTTeamRoleMaster;