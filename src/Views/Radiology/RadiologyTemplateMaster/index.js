import React, { useState, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const RadiologyTemplateMaster = () => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, templateId: null, newStatus: false });
  
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

  // Mock template data
  const [templateData, setTemplateData] = useState([
    {
      id: 1,
      code: "XRC001",
      templateName: "X-Ray Chest Template",
      modality: "X-Ray",
      templateDescription: "<p>Standard template for chest X-ray reporting including heart size, lung fields, and bony structures.</p>",
      status: "y"
    },
    {
      id: 2,
      code: "MRIB002",
      templateName: "MRI Brain Template",
      modality: "MRI",
      templateDescription: "<p>Comprehensive template for brain MRI including T1, T2, FLAIR sequences and contrast enhancement.</p>",
      status: "y"
    },
    {
      id: 3,
      code: "CTA003",
      templateName: "CT Abdomen Template",
      modality: "CT",
      templateDescription: "<p>Template for CT abdomen reporting covering liver, pancreas, kidneys, and other abdominal organs.</p>",
      status: "n"
    },
    {
      id: 4,
      code: "USP004",
      templateName: "Ultrasound Pelvis Template",
      modality: "Ultrasound",
      templateDescription: "<p>Standard template for pelvic ultrasound including uterus, ovaries, and bladder assessment.</p>",
      status: "y"
    },
    {
      id: 5,
      code: "MAM005",
      templateName: "Mammography Template",
      modality: "Mammography",
      templateDescription: "<p>Template for mammography reporting including breast density, masses, calcifications, and architectural distortion.</p>",
      status: "y"
    }
  ]);

  // Modality options
  const modalityOptions = [
    "X-Ray",
    "MRI",
    "CT",
    "Ultrasound",
    "Mammography",
    "Fluoroscopy",
    "Angiography",
    "Nuclear Medicine",
    "PET-CT",
    "DEXA"
  ];

  const TEMPLATE_NAME_MAX_LENGTH = 100;
  const CODE_MAX_LENGTH = 10;

  // Filter templates based on search query
  const filteredTemplateData = templateData.filter(template =>
    template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.modality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredTemplateData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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

  // Handle edit
  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      code: template.code,
      templateName: template.templateName,
      modality: template.modality,
      templateDescription: template.templateDescription,
      status: template.status
    });
    setShowForm(true);
  };

  // Handle save
  const handleSave = (e) => {
    e.preventDefault();
    
    if (editingTemplate) {
      // Update existing template
      setTemplateData(templateData.map(template =>
        template.id === editingTemplate.id 
          ? { ...template, ...formData }
          : template
      ));
      showPopup("Template updated successfully!", "success");
    } else {
      // Add new template
      const newTemplate = {
        id: templateData.length + 1,
        ...formData,
        status: "y"
      };
      setTemplateData([...templateData, newTemplate]);
      showPopup("Template added successfully!", "success");
    }

    // Reset form
    setEditingTemplate(null);
    setFormData({ code: "", templateName: "", modality: "", templateDescription: "", status: "y" });
    setShowForm(false);
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
  };

  // Handle status change
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, templateId: id, newStatus });
  };

  // Handle confirm status change
  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.templateId !== null) {
      setTemplateData((prevData) =>
        prevData.map((template) =>
          template.id === confirmDialog.templateId
            ? { ...template, status: confirmDialog.newStatus }
            : template
        )
      );
      showPopup(
        `Template ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
        "success"
      );
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
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingTemplate(null);
                        setFormData({ code: "", templateName: "", modality: "", templateDescription: "", status: "y" });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add 
                    </button>
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
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((template) => (
                            <tr key={template.id}>
                              <td>
                                <span >{template.code}</span>
                              </td>
                              <td>{template.templateName}</td>
                              <td>
                                <span >{template.modality}</span>
                              </td>
                              <td>
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: template.templateDescription.length > 50 
                                      ? template.templateDescription.substring(0, 50) + "..." 
                                      : template.templateDescription 
                                  }} 
                                />
                              </td>
                              <td>
                                <div className="form-check form-switch">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={template.status === "y"}
                                    onChange={() => handleSwitchChange(template.id, template.status === "y" ? "n" : "y")}
                                    id={`switch-${template.id}`}
                                  />
                                  <label
                                    className="form-check-label px-0"
                                    htmlFor={`switch-${template.id}`}
                                  >
                                    {template.status === "y" ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleEdit(template)}
                                  disabled={template.status !== "y"}
                                >
                                  <i className="fa fa-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No templates found</td>
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
                      {modalityOptions.map((modality, index) => (
                        <option key={index} value={modality}>
                          {modality}
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
                      disabled={!formData.code || !formData.templateName || !formData.modality || !formData.templateDescription}
                    >
                      <i className="mdi mdi-content-save"></i> Save
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleCancel}
                    >
                      <i className="mdi mdi-cancel"></i> Cancel
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
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button 
                          type="button" 
                          className="close" 
                          onClick={() => handleConfirm(false)}
                        >
                          <span>&times;</span>
                        </button>
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
                        >
                          No
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleConfirm(true)}
                        >
                          Yes
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