
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const CommonStatusMaster = () => {
  const [CommonStatusData, setCommonStatusData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: null,
    newStatus: "",
    commonStatus: ""
  });

  
  const [popupMessage, setPopupMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    commonStatus: ""
  });

  const [loading, setLoading] = useState(true);

  const MAX_LENGTH = 50;

  /* ---------------- MOCK DATA (5 RECORDS) ---------------- */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCommonStatusData([
  {
    id: 1,
    statusCode: "ACT",
    statusName: "Active",
    entityName: "GLOBAL",
    tableName: "ALL_MODULES",
    columnName: "STATUS",
    statusDescription: "Record is active and available for use",
    //status: "y",
    remark: "Default enabled status across all modules"
  },
  {
    id: 2,
    statusCode: "INA",
    statusName: "Inactive",
    entityName: "GLOBAL",
    tableName: "ALL_MODULES",
    columnName: "STATUS",
    statusDescription: "Record is inactive and not available for use",
   // status: "y",
   remark: "Used when record is disabled by administrator"
  },
  {
    id: 3,
    statusCode: "PND",
    statusName: "Pending",
    entityName: "WORKFLOW",
    tableName: "REQUEST_MASTER",
    columnName: "APPROVAL_STATUS",
    statusDescription: "Request is pending for approval",
   // status: "y",
   remark: "Waiting for approval from authorized user"
  },
  {
    id: 4,
    statusCode: "APR",
    statusName: "Approved",
    entityName: "WORKFLOW",
    tableName: "REQUEST_MASTER",
    columnName: "APPROVAL_STATUS",
    statusDescription: "Request has been approved successfully",
  //  status: "y",
   remark: "Approved and ready for further processing"
  },
  {
    id: 5,
    statusCode: "REJ",
    statusName: "Rejected",
    entityName: "WORKFLOW",
    tableName: "REQUEST_MASTER",
    columnName: "APPROVAL_STATUS",
    statusDescription: "Request has been rejected",
  //  status: "n",
   remark: "Rejected due to validation or business rule failure"
  },
  {
    id: 6,
    statusCode: "SUS",
    statusName: "Suspended",
    entityName: "USER_MANAGEMENT",
    tableName: "USER_MASTER",
    columnName: "ACCOUNT_STATUS",
    statusDescription: "User account is temporarily suspended",
  //  status: "n",
     remark: "Suspended due to policy violation or security reason"
  }
]);
      setLoading(false);
    }, 600);
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filteredData = CommonStatusData.filter(item =>
  item.statusName.toLowerCase().includes(searchQuery.toLowerCase())
);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */
  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({ commonStatus: record.commonStatus });
    setIsFormValid(true);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (editingRecord) {
      setCommonStatusData(prev =>
        prev.map(item =>
          item.id === editingRecord.id
            ? { ...item, commonStatus: formData.commonStatus }
            : item
        )
      );
      showPopup("Common Status updated successfully");
    } else {
      setCommonStatusData(prev => [
        ...prev,
        {
          id: Date.now(),
          commonStatus: formData.commonStatus,
          status: "y",
          lastUpdated: new Date().toLocaleDateString("en-GB")
        }
      ]);
      showPopup("Common Status added successfully");
    }

    setShowForm(false);
    setEditingRecord(null);
    setFormData({ commonStatus: "" });
    setIsFormValid(false);
  };

  //const handleSwitchChange = (id, newStatus, commonStatus) => {
   // setConfirmDialog({ isOpen: true, id, newStatus, commonStatus });
  //};

  //const handleConfirm = (confirmed) => {
   // if (confirmed) {
    //  setCommonStatusData(prev =>
      //  prev.map(item =>
      //    item.id === confirmDialog.id
       //     ? { ...item, status: confirmDialog.newStatus }
       //     : item
      //  )
     // );
     // showPopup(
     //   `Common Status ${
      //    confirmDialog.newStatus === "y" ? "activated" : "deactivated"
      //  } successfully`
    //  );
   // }
   // setConfirmDialog({ isOpen: false, id: null, newStatus: "", commonStatus: "" });
 // };

  const handleInputChange = (e) => {
    setFormData({ commonStatus: e.target.value });
    setIsFormValid(e.target.value.trim() !== "");
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({ commonStatus: "" });
    setIsFormValid(false);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="content-wrapper">
      <div className="card form-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title">Common Status Master</h4>

          <div className="d-flex align-items-center gap-2">
            {!showForm && (
              <form className="searchform" role="search">
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search Common Status"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "220px" }}
                  />
                  <span className="input-group-text">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </form>
            )}

            {!showForm ? (
              <>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                  <i className="mdi mdi-plus"></i> Add
                </button>
                <button className="btn btn-success" onClick={() => setSearchQuery("")}>
                  <i className="mdi mdi-refresh"></i> Show All
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingScreen />
          ) : !showForm ? (
            <>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th style={{ width: "100px", whiteSpace: "nowrap" }}>Status Code</th>
                    <th style={{ width: "100px", whiteSpace: "nowrap" }}>Status Name</th>
                    <th style={{ width: "120px", whiteSpace: "nowrap" }}>Entity Name</th>
                    <th style={{ width: "120px", whiteSpace: "nowrap" }}>Table Name</th>
                    <th style={{ width: "100px", whiteSpace: "nowrap" }}>Column Name</th>
                    <th>Status Description</th>
                    <th >Remark</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length ? (
                    currentItems.map(item => (
                       <tr key={item.id}>
                      <td style={{ width: "90px", whiteSpace: "nowrap" }}>
  {item.statusCode}
</td>
<td
  style={{ maxWidth: "140px" }}
  className="text-truncate"
  title={item.statusName}
>
  {item.statusName}
</td>

                        <td>{item.entityName}</td>
                        <td>{item.tableName}</td>
                        <td>{item.columnName}</td>
                        <td>{item.statusDescription}</td>               
                        <td>{item.remark}</td>    
                        <td>
                          <button
                            className="btn btn-sm btn-success"
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
                      <td colSpan="4" className="text-center">
                        No data found
                      </td>
                    </tr>
                  )}
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
            <form className="forms row" onSubmit={handleSave}>
                 <div className="card-body">
             <div className="row g-3 align-items-center">
             <div className="form-group col-md-4">
           <label>Status Code<span className="text-danger">*</span></label>
         <input
                type="text"
                className="form-control"
                value={formData.commonStatus}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
                placeholder="Enter status code"
                required
              />
              </div>
                 <div className="form-group col-md-4">
         <label> Status Name<span className="text-danger">*</span></label>
 <input
                type="text"
                className="form-control"
                value={formData.statusName}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
                placeholder="Enter status name"
                required
              />
              </div>
               <div className="form-group col-md-4">
          <label>Entity Name<span className="text-danger">*</span></label>
           <input
                type="text"
                className="form-control"
                value={formData.entityName}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
               placeholder="Enter entity name"
                required
              />
              </div>
               <div className="form-group col-md-4">
           <label>Table Name<span className="text-danger">*</span></label>
            <input
                type="text"
                className="form-control"
                value={formData.tableName}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
               placeholder="Enter table name"
                required
              />
              </div>
               <div className="form-group col-md-4">
             <label>Column Name<span className="text-danger">*</span></label>
          <input
                type="text"
                className="form-control"
                value={formData.columnName}
                maxLength={MAX_LENGTH}
                onChange={handleInputChange}
             placeholder="Enter column name"
                required
              />
              </div>
 <div className="form-group col-md-4">
    <label>
      Status Description <span className="text-danger">*</span>
    </label>
    <textarea
      className="form-control"
      name="description"
      rows="2"
      maxLength={150}
      value={formData.description}
      onChange={handleInputChange}
      placeholder="Enter status description"
      required
    />
    </div>
 <div className="form-group col-md-4">
  <label>
    Remarks <span className="text-danger">*</span>
  </label>

  <textarea
    className="form-control"
    name="remarks"
    rows="2"
    maxLength={150}
    value={formData.remarks}
    onChange={handleInputChange}
    placeholder="Enter remarks"
    required
  />

</div>

</div>
</div>


               <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                <button className="btn btn-primary me-2" disabled={!isFormValid}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={handleBack}>
                  Cancel
                </button>
              </div>
            
            </form>
          )}
                </div>
              </div>
            </div>
          
  );
};

export default CommonStatusMaster;
