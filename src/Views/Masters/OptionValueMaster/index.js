
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

import { MAS_QUESTION_OPTION_VALUE } from "../../../config/apiConfig";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../service/apiService";

import {
  FETCH_OPTION_VALUE,
  CREATE_OPTION_VALUE,
  UPDATE_OPTION_VALUE ,
  SAVE_OPTION_VALUE,
  DUPLICATE_OPTION_VALUE ,
  STATUS_UPDATED,
  UPDATE_STATUS,
} from "../../../config/constants";

const OptionValueMaster = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    optionCode: "",
    optionValue: "",
    optionName: "",
    optionScore: "",
  });

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


  const MAX_LENGTH = 50;


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "N/A";
    }
  };

  const fetchData = async (flag = 0) => {
    setLoading(true);
    try {
      const { response } = await getRequest(
        `${MAS_QUESTION_OPTION_VALUE}/getAll/${flag}`
      );
      setData(response || []);
    } catch {
      showPopup(FETCH_OPTION_VALUE , "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const filteredData = data.filter(
    (rec) =>
      (rec?.optionCode ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec?.optionValue ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );


  const currentItems = filteredData.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================= POPUP =================
  const showPopup = (message, type) => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  // ================= FORM =================
  const resetForm = () => {
    setFormData({
      optionCode: "",
      optionValue: "",
      optionName: "",
      optionScore: "",
    });
    setIsFormValid(false);
    setEditingRecord(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    setIsFormValid(
      updated.optionCode.trim() !== "" &&
        updated.optionValue.trim() !== "" &&
        updated.optionName.trim() !== "" &&
        updated.optionScore !== ""
    );
  };

  // ================= SAVE =================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const newCode = formData.optionCode.trim().toLowerCase();
   const duplicate = data.find(
  (rec) =>
    rec.optionCode?.toLowerCase() === newCode &&
    (!editingRecord || rec.id !== editingRecord.id)
);

    if (duplicate) {
      showPopup(DUPLICATE_OPTION_VALUE , "error");
      return;
    }

    try {
      if (editingRecord) {
        await putRequest(
          `${MAS_QUESTION_OPTION_VALUE}/update/${editingRecord.id}`,
          formData
        );

        showPopup(UPDATE_OPTION_VALUE , "success");
      } else {
        await postRequest(`${MAS_QUESTION_OPTION_VALUE}/create`, {
          ...formData,
          status: "Y",
        });

        showPopup(CREATE_OPTION_VALUE , "success");
      }

      fetchData();
      handleCancel();
    } catch {
      showPopup(SAVE_OPTION_VALUE, "error");
    }
  };

  // ================= EDIT =================
 const handleEdit = (rec) => {
  setEditingRecord(rec);
  setFormData({
    optionCode: rec.optionCode,
    optionValue: rec.optionValue,
    optionName: rec.questionName,
    optionScore: rec.optionScore,
  });

  setIsFormValid(true);
  setShowForm(true);
};
  // ================= STATUS =================
  const handleSwitchChange = (rec) => {
    setConfirmDialog({
      isOpen: true,
      record: rec,
      newStatus: rec.status?.toLowerCase() === "y" ? "n" : "y",
    });
  };

  const handleConfirm = async (confirmed) => {
    if (!confirmed) {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
      return;
    }

    try {
      await putRequest(
        `${MAS_QUESTION_OPTION_VALUE}/status/${confirmDialog.record.id}?status=${confirmDialog.newStatus}`
      );

      showPopup(STATUS_UPDATED, "success");
      fetchData();
    } catch {
      showPopup(UPDATE_STATUS, "error");
    } finally {
      setConfirmDialog({ isOpen: false, record: null, newStatus: "" });
    }
  };

  // ================= REFRESH =================
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchData();
  };

  // ================= UI =================
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between">
          <h4>Option Value Master</h4>

          <div className="d-flex">
            {!showForm && (
              <input
                className="form-control me-2"
                style={{ width: "220px" }}
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            )}

            {!showForm ? (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  Add
                </button>

                <button className="btn btn-success" onClick={handleRefresh}>
                  Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleCancel}>
                Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Option Code</th>
                    <th>Option Value</th>
                    <th>Option Score</th>
                    <th>Option Name</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((rec) => (
                    <tr key={rec.id}>
                     <td>{rec.optionCode}</td>
<td>{rec.optionValue}</td>
<td>{rec.optionScore}</td>
<td>{rec.optionName}</td>

                      <td>
                        <input
                          type="checkbox"
checked={rec.status?.toLowerCase() === "y"}
                          onChange={() => handleSwitchChange(rec)}
                        />
                      </td>

                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEdit(rec)}
disabled={rec.status?.toLowerCase() !== "y"}                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <form onSubmit={handleSave}>
              <input
                name="optionCode"
                placeholder="Code"
                value={formData.optionCode}
                onChange={handleInputChange}
              />
              <input
                name="optionValue"
                placeholder="Value"
                value={formData.optionValue}
                onChange={handleInputChange}
              />
              <input
                name=" optionScore"
                placeholder="Score"
                value={formData.optionScore}
                onChange={handleInputChange}
              />
              <input
                name="optionName"
                placeholder="Name"
                value={formData.optionName}
                onChange={handleInputChange}
              />

              <button disabled={!isFormValid}>
                {editingRecord ? "Update" : "Save"}
              </button>
            </form>
          )}

          {popupMessage && <Popup {...popupMessage} />}

          {confirmDialog.isOpen && (
            <div className="modal d-block">
              <div className="modal-content p-3">
                <p>
                  Are you sure to{" "}
                  {confirmDialog.newStatus === "y"
                    ? "Activate"
                    : "Deactivate"}{" "}
                  ?
                </p>

                <button onClick={() => handleConfirm(true)}>Yes</button>
                <button onClick={() => handleConfirm(false)}>No</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionValueMaster;