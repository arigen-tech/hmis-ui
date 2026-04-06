import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const InsuranceTPAMapping = () => {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    insurance: "",
    tpa: "",
    effFrom: "",
    effTo: "",
    mode: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    setData([
      {
        id: 1,
        insurance: "ICICI",
        tpa: "TPA1",
        effFrom: new Date(),
        effTo: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        mode: "Online",
        status: "y",
      },
    ]);
  }, []);

  const filteredData = data.filter((rec) =>
    rec.insurance.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    const valid = updatedForm.insurance || updatedForm.tpa || updatedForm.mode;
    setIsFormValid(valid !== "");
  };

  const resetForm = () => {
    setFormData({
      insurance: "",
      tpa: "",
      effFrom: "",
      effTo: "",
      mode: "",
    });
    setIsFormValid(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (editingRecord) {
      const updated = data.map((item) =>
        item.id === editingRecord.id ? { ...editingRecord, ...formData } : item
      );
      setData(updated);
      showPopup("Updated Successfully", "success");
    } else {
      const newRecord = {
        ...formData,
        id: Date.now(),
        status: "y",
      };
      setData([...data, newRecord]);
      showPopup("Added Successfully", "success");
    }

    handleCancel();
  };

  const handleEdit = (rec) => {
    setEditingRecord(rec);
    setFormData(rec);
    setShowForm(true);
    setIsFormValid(true);
  };

  const toggleStatus = (rec) => {
    const updated = data.map((item) =>
      item.id === rec.id ? { ...item, status: item.status === "y" ? "n" : "y" } : item
    );
    setData(updated);
  };

  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleCancel = () => {
    resetForm();
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
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
              {!showForm ? (
                <>
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
                          <tr key={rec.id}>
                            <td>{rec.insurance}</td>
                            <td>{rec.tpa}</td>
                            <td>{formatDate(rec.effFrom)}</td>
                            <td>{formatDate(rec.effTo)}</td>
                            <td>{rec.mode}</td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={rec.status === "y"}
                                  onChange={() => toggleStatus(rec)}
                                  id={`switch-${rec.id}`}
                                />
                                <label className="form-check-label px-0" htmlFor={`switch-${rec.id}`}>
                                  {rec.status === "y" ? "Active" : "Deactivated"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleEdit(rec)}
                                disabled={rec.status !== "y"}
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
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label>Insurance</label>
                      <input
                        className="form-control mt-1"
                        name="insurance"
                        value={formData.insurance}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>TPA</label>
                      <input
                        className="form-control mt-1"
                        name="tpa"
                        value={formData.tpa}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Effective From</label>
                      <input
                        className="form-control mt-1"
                        name="effFrom"
                        type="date"
                        value={formData.effFrom}
                        onChange={handleInputChange}
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
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label>Mode</label>
                      <input
                        className="form-control mt-1"
                        name="mode"
                        value={formData.mode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2">
                      {editingRecord ? "Update" : "Save"}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleCancel}>
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
    </div>
  );
};

export default InsuranceTPAMapping;