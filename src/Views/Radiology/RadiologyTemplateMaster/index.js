import React, { useState, useRef, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { RADIOLOGY_TEMPLATE } from "../../../config/apiConfig";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import { 
  ADD_RADIOLOGY_TEMPLATE_SUCC_MSG, 
  DUPLICATE_RADIOLOGY_TEMPLATE, 
  FAIL_TO_SAVE_CHANGES, 
  FAIL_TO_UPDATE_STS, 
  FETCH_RADIOLOGY_TEMPLATE_ERR_MSG, 
  UPDATE_RADIOLOGY_TEMPLATE_SUCC_MSG,
  FETCH_MODALITY_ERR_MSG 
} from "../../../config/constants";

const RadiologyTemplateMaster = () => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, templateId: null, newStatus: false });
  const [modalityDropdown, setModalityDropdown] = useState([]);
  const [templateData, setTemplateData] = useState([]);
  
  // Refs for CKEditor toolbar and editor instance for Template Description
  const templateEditorRef = useRef(null);
  const templateInclusionRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    code: "",
    templateName: "",
    modality: "",
    templateDescription: "",
    status: "y"
  });

  const TEMPLATE_NAME_MAX_LENGTH = 100;
  const CODE_MAX_LENGTH = 10;

  // Function to format date as dd-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };


  const stripHtmlTags = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

  // Fetch radiology template data - FIXED: Changed item.templateId to item.pacsTemplateId
  const fetchRadiologyTemplateData = async (flag = 0) => {
    try {
      setLoading(true);
      const response = await getRequest(`${RADIOLOGY_TEMPLATE}/getAll/${flag}`);
      if (response && response.response) {
        const mappedData = response.response.map(item => ({
          id: item.pacsTemplateId, // FIXED: Changed from item.templateId to item.pacsTemplateId
          code: item.templateCode,
          templateName: item.templateName,
          modalityId: item.subChargecodeId,        
          modalityName: item.subChargeCodeName,    
          templateDescription: item.templateText,
          status: item.status,
          lastUpdated: formatDate(item.lastUpdateDate)
        }));
        setTemplateData(mappedData);
      }
    } catch (err) {
      console.error("Error fetching radiology template data:", err);
      showPopup(FETCH_RADIOLOGY_TEMPLATE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch modality dropdown data
  const fetchModalityDropdownData = async () => {
    try {
      const response = await getRequest(`/general/getModalityDetailsByDepartment?code=RADIMG`);
      if (response && response.response) {
        const modalityValue = response.response.map(mod => ({
          id: mod.id,
          modality: mod.modalityName
        }));
        setModalityDropdown(modalityValue);
      }
    } catch (err) {
      console.error("Error fetching modality dropdown data:", err);
      showPopup(FETCH_MODALITY_ERR_MSG, "error");
    }
  };

  useEffect(() => {
    fetchRadiologyTemplateData(0);
    fetchModalityDropdownData();
  }, []);

  // Filter templates based on search query
  const filteredTemplateData = templateData.filter(template =>
    template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredTemplateData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  // Handle CKEditor change
  const handleTemplateEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData((prevData) => ({ ...prevData, templateDescription: data }));
  };

  // Handle edit - Added console log for debugging
  const handleEdit = (template) => {
    console.log("Editing template:", template); // Debug log
    setEditingTemplate(template);
    setFormData({
      code: template.code,
      templateName: template.templateName,
      modality: template.modalityId ? String(template.modalityId) : "",       
      templateDescription: template.templateDescription,
      status: template.status
    });
    setShowForm(true);
  };

  // Handle save - FIXED: Updated the request body property names
  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Check for duplicates
      const isDuplicate = templateData.some(
        (template) =>
          (template.code.toLowerCase() === formData.code.toLowerCase() ||
           template.templateName.toLowerCase() === formData.templateName.toLowerCase()) &&
          (!editingTemplate || editingTemplate.id !== template.id)
      );

      if (isDuplicate) {
        showPopup(DUPLICATE_RADIOLOGY_TEMPLATE, "error");
        setLoading(false);
        return;
      }

      // Convert modality to number
      const modalityId = parseInt(formData.modality, 10);

      if (editingTemplate) {
        console.log("Updating template with ID:", editingTemplate.id); // Debug log
        
        // Update existing template - FIXED: Using pacsTemplateId instead of templateId
        const response = await putRequest(`${RADIOLOGY_TEMPLATE}/update/${editingTemplate.id}`, {
          pacsTemplateId: editingTemplate.id, // FIXED: Changed from templateId to pacsTemplateId
          templateCode: formData.code,
          templateName: formData.templateName,
          subChargecodeId: modalityId,
          templateText: formData.templateDescription,
        });

        if (response && response.status === 200) {
          fetchRadiologyTemplateData();
          showPopup(UPDATE_RADIOLOGY_TEMPLATE_SUCC_MSG, "success");
        }
      } else {
        // Add new template
        const response = await postRequest(`${RADIOLOGY_TEMPLATE}/create`, {
          templateCode: formData.code,
          templateName: formData.templateName,
          subChargecodeId: modalityId,
          templateText: formData.templateDescription,
        });

        if (response && response.status === 200) {
          fetchRadiologyTemplateData();
          showPopup(ADD_RADIOLOGY_TEMPLATE_SUCC_MSG, "success");
        }
      }

      // Reset form
      setEditingTemplate(null);
      setFormData({ code: "", templateName: "", modality: "", templateDescription: "", status: "y" });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving radiology template data:", err);
      showPopup(`${FAIL_TO_SAVE_CHANGES} ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingTemplate(null);
    setFormData({ code: "", templateName: "", modality: "", templateDescription: "", status: "y" });
    setShowForm(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchRadiologyTemplateData();
    fetchModalityDropdownData();
  };

  // Handle status change
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, templateId: id, newStatus });
  };

  // Handle confirm status change
  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.templateId !== null) {
      try {
        setLoading(true);

        const response = await putRequest(
          `${RADIOLOGY_TEMPLATE}/update-status/${confirmDialog.templateId}?status=${confirmDialog.newStatus}`
        );

        if (response && response.response) {
          setTemplateData((prevData) =>
            prevData.map((template) =>
              template.id === confirmDialog.templateId
                ? {
                    ...template,
                    status: confirmDialog.newStatus,
                    lastUpdated: formatDate(new Date().toISOString())
                  }
                : template
            )
          );
          showPopup(
            `Template ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error updating radiology template status:", err);
        showPopup(FAIL_TO_UPDATE_STS, "error");
      } finally {
        setLoading(false);
      }
    }
    setConfirmDialog({ isOpen: false, templateId: null, newStatus: null });
  };

  // Show popup
  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Radiology Template Master</h4>
              <div className="d-flex justify-content-between align-items-center">
                {!showForm ? (
                  <form className="d-inline-block searchform me-4" role="search">
                    <div className="input-group searchinput">
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by Code, Template or Modality"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <span className="input-group-text" id="search-icon">
                        <i className="fa fa-search"></i>
                      </span>
                    </div>
                  </form>
                ) : null}

                <div className="d-flex align-items-center">
                  {!showForm ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-success me-2"
                        onClick={() => {
                          setEditingTemplate(null);
                          setFormData({ code: "", templateName: "", modality: "", templateDescription: "", status: "y" });
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
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancel}
                    >
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
                          <th>Code</th>
                          <th>Template Name</th>
                          <th>Modality</th>
                          <th>Description</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((template) => (
                            <tr key={template.id}>
                              <td>
                                <span>{template.code}</span>
                              </td>
                              <td>{template.templateName}</td>
                              <td>{template.modalityName}</td>
                              <td>{stripHtmlTags(template.templateDescription)}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEdit(template)}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No templates found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredTemplateData.length > 0 && (
                    <Pagination
                      totalItems={filteredTemplateData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="form-group col-md-6">
                    <label>Code <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="code"
                      placeholder="Enter template code"
                      value={formData.code}
                      onChange={handleInputChange}
                      maxLength={CODE_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-6">
                    <label>Template Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control mt-1"
                      id="templateName"
                      placeholder="Enter template name"
                      value={formData.templateName}
                      onChange={handleInputChange}
                      maxLength={TEMPLATE_NAME_MAX_LENGTH}
                      required
                    />
                  </div>

                  <div className="form-group col-md-6 mt-2">
                    <label>Modality <span className="text-danger">*</span></label>
                    <select
                      className="form-control mt-1"
                      id="modality"
                      value={formData.modality}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Modality</option>
                      {modalityDropdown.map((modality, index) => (
                        <option key={index} value={modality.id}>
                          {modality.modality}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-12 mt-3">
                    <label className="form-label">
                      Template Description <span className="text-danger">*</span>
                    </label>
                    <div className="form-group">
                      <div
                        className="form-label"
                        style={{
                          border: "1px solid #ced4da",
                          borderRadius: "6px",
                          padding: "8px",
                          minHeight: "200px"
                        }}
                      >
                        <div ref={templateInclusionRef}></div>
                        <CKEditor
                          editor={DecoupledEditor}
                          data={formData.templateDescription}
                          config={{
                            toolbar: { shouldNotGroupWhenFull: true },
                            alignment: {
                              options: ["left", "center", "right", "justify"],
                            },
                            placeholder: "Enter template description with formatting...",
                          }}
                          onReady={(editor) => {
                            templateEditorRef.current = editor;
                            if (templateInclusionRef.current) {
                              templateInclusionRef.current.innerHTML = "";
                              templateInclusionRef.current.appendChild(
                                editor.ui.view.toolbar.element,
                              );
                            }
                          }}
                          onChange={handleTemplateEditorChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary me-2"
                      disabled={!formData.code || !formData.templateName || !formData.modality || !formData.templateDescription || loading}
                    >
                      {loading ? "Saving..." : (editingTemplate ? 'Update' : 'Save')}
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

              {/* Popup Message */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}

              {/* Confirmation Dialog */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => handleConfirm(false)}
                          aria-label="Close"
                          disabled={loading}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} this template?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => handleConfirm(false)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleConfirm(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm"}
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

export default RadiologyTemplateMaster;