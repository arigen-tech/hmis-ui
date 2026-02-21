import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const DetailedRadiologyReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const investigationData = location.state?.investigationData;

  // State for loading
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showTemplateSearch, setShowTemplateSearch] = useState(false);

  // Refs for CKEditor
  const reportEditorRef = useRef(null);
  const reportInclusionRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Patient Details (simplified)
    uhid: investigationData?.uhid || "UHID12345",
    patientName: investigationData?.patientName || "John Doe",
    age: investigationData?.age?.replace(" Y", "") || "45",
    gender: investigationData?.gender || "Male",
    mobileNo: investigationData?.contactNo || "9876543210",
    // Report Content
    reportContent: "<p>Heart size is within normal limits. Lungs are clear with no evidence of consolidation, effusion, or pneumothorax. Bony structures are intact. Impression: Normal chest X-ray.</p>"
  });

  // Investigation Details
  const investigationDetails = {
    accessionNo: investigationData?.accessionNo || "ACC001234",
    modality: investigationData?.modality || "X-Ray",
    investigationName: investigationData?.investigationName || "Chest X-Ray PA View",
    orderDate: investigationData?.orderDate || "20/02/2026",
    orderTime: investigationData?.orderTime || "10:30",
    studyDate: investigationData?.studyDate || "20/02/2026",
    studyTime: investigationData?.studyTime || "11:15"
  };

  // Template data for auto-search
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  
  const templateData = [
    {
      id: 1,
      templateCode: "XRC001",
      templateName: "X-Ray Chest Template",
      modalityType: "X-Ray",
      reportContent: "<p>Heart size is within normal limits. Lungs are clear with no evidence of consolidation, effusion, or pneumothorax. Bony structures are intact. Impression: Normal chest X-ray.</p>"
    },
    {
      id: 2,
      templateCode: "MRIB002",
      templateName: "MRI Brain Template",
      modalityType: "MRI",
      reportContent: "<p>Brain parenchyma appears normal. No evidence of acute infarct, hemorrhage, or mass effect. Ventricles and sulci are within normal limits for age. Impression: Normal MRI brain.</p>"
    },
    {
      id: 3,
      templateCode: "CTA003",
      templateName: "CT Abdomen Template",
      modalityType: "CT",
      reportContent: "<p>Liver, spleen, pancreas, and kidneys appear normal. No evidence of masses, fluid collections, or lymphadenopathy. Bowel loops are unremarkable. Impression: Normal CT abdomen.</p>"
    },
    {
      id: 4,
      templateCode: "USP004",
      templateName: "Ultrasound Pelvis Template",
      modalityType: "Ultrasound",
      reportContent: "<p>Uterus is normal in size and contour. Endometrial stripe is normal. Ovaries are unremarkable. No free fluid or masses noted. Impression: Normal pelvic ultrasound.</p>"
    },
    {
      id: 5,
      templateCode: "MAM005",
      templateName: "Mammography Template",
      modalityType: "Mammography",
      reportContent: "<p>Breast tissue is heterogeneously dense. No suspicious masses, calcifications, or architectural distortion. Skin and nipples are normal. Impression: Normal mammogram (BI-RADS 1).</p>"
    }
  ];

  // Filter templates based on search query
  const filteredTemplates = templateData.filter(template =>
    template.templateName.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    template.templateCode.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  // Template Details state (auto-populated from search)
  const [templateDetails, setTemplateDetails] = useState({
    templateCode: "",
    templateName: "",
    modalityType: "",
  });

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setTemplateDetails({
      templateCode: template.templateCode,
      templateName: template.templateName,
      modalityType: template.modalityType,
    });
    setFormData(prev => ({
      ...prev,
      reportContent: template.reportContent
    }));
    setTemplateSearchQuery(template.templateName);
    setShowTemplateSearch(false);
  };

  // Handle template search
  const handleTemplateSearch = (e) => {
    setTemplateSearchQuery(e.target.value);
    setShowTemplateSearch(true);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle CKEditor change
  const handleReportEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData(prev => ({ ...prev, reportContent: data }));
  };

  // Handle save
  const handleSave = () => {
    showPopup("Report saved successfully!", "success");
  };

  // Handle submit
  const handleSubmit = () => {
    showPopup("Report submitted successfully!", "success");
  };

  // Handle back
  const handleBack = () => {
    navigate(-1);
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

  // Handle view study link click
  const handleViewStudy = () => {
    window.open(`/view-study/${investigationDetails.accessionNo}`, '_blank');
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">Detailed Radiology Report</h4>
              <button className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Patient Details Section - Simplified */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-header bg-light py-3">
                          <h6 className="mb-0 fw-bold">Patient Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-borderless mb-0">
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: '15%' }}>UHID</td>
                                  <td style={{ width: '35%' }}>{formData.uhid}</td>
                                  <td className="fw-bold" style={{ width: '15%' }}>Patient Name</td>
                                  <td style={{ width: '35%' }}>{formData.patientName}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Age/Gender</td>
                                  <td>{formData.age} Y / {formData.gender}</td>
                                  <td className="fw-bold">Mobile No</td>
                                  <td>{formData.mobileNo}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investigation Details Section - Simplified */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-header bg-light py-3">
                          <h6 className="mb-0 fw-bold">Investigation Details</h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-borderless mb-0">
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: '15%' }}>Accession No</td>
                                  <td style={{ width: '35%' }}>{investigationDetails.accessionNo}</td>
                                  <td className="fw-bold" style={{ width: '15%' }}>Modality</td>
                                  <td style={{ width: '35%' }}>
                                    <span>{investigationDetails.modality}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Investigation Name</td>
                                  <td>{investigationDetails.investigationName}</td>
                                  <td className="fw-bold">Order Date/Time</td>
                                  <td>{investigationDetails.orderDate} {investigationDetails.orderTime}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Study Date/Time</td>
                                  <td>{investigationDetails.studyDate} {investigationDetails.studyTime}</td>
                                  <td className="fw-bold">View Study</td>
                                  <td>
                                    <button 
                                      className="btn btn-link p-0" 
                                      onClick={handleViewStudy}
                                      style={{ textDecoration: 'underline' }}
                                    >
                                      <i className="mdi mdi-file-image"></i> Click to View
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report Section */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="card shadow-sm">
                        <div className="card-header bg-light py-3">
                          <h6 className="mb-0 fw-bold">Radiology Report</h6>
                        </div>
                        <div className="card-body">
                          {/* Template Search */}
                          <div className="row mb-4">
                            <div className="col-md-6 position-relative">
                              <label className="form-label fw-bold">Search Template</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Type template name..."
                                value={templateSearchQuery}
                                onChange={handleTemplateSearch}
                                onFocus={() => setShowTemplateSearch(true)}
                              />
                              {showTemplateSearch && templateSearchQuery && (
                                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                  {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map(template => (
                                      <div
                                        key={template.id}
                                        className="p-2 border-bottom hover-bg-light"
                                        onClick={() => handleTemplateSelect(template)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <div className="fw-bold">{template.templateName}</div>
                                        <small className="text-muted">Code: {template.templateCode}</small>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-muted">No templates found</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Template Details */}
                          <div className="table-responsive mb-4">
                            <table className="table table-borderless">
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: '15%' }}>Template Code</td>
                                  <td style={{ width: '35%' }}>
                                    <input
                                      type="text"
                                      className="form-control "
                                      value={templateDetails.templateCode}
                                      readOnly
                                    />
                                  </td>
                                  <td className="fw-bold" style={{ width: '15%' }}>Template Name</td>
                                  <td style={{ width: '35%' }}>
                                    <input
                                      type="text"
                                      className="form-control "
                                      value={templateDetails.templateName}
                                      readOnly
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Modality Type</td>
                                      <td style={{ width: '35%' }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={templateDetails.modalityType}
                                      readOnly
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Report Content - CKEditor */}
                          <div className="mb-4">
                            <label className="form-label fw-bold">Report Content</label>
                            <div
                              style={{
                                border: "1px solid #ced4da",
                                borderRadius: "6px",
                                padding: "8px",
                                backgroundColor: "#fff",
                                minHeight:"200px"
                              }}
                            >
                              <div ref={reportInclusionRef}></div>
                              <CKEditor
                                editor={DecoupledEditor}
                                data={formData.reportContent}
                                config={{
                                  toolbar: { shouldNotGroupWhenFull: true },
                                  alignment: {
                                    options: ["left", "center", "right", "justify"],
                                  },
                                  placeholder: "Enter radiology report content...",
                                  height: 300
                                }}
                                onReady={(editor) => {
                                  reportEditorRef.current = editor;
                                  if (reportInclusionRef.current) {
                                    reportInclusionRef.current.innerHTML = "";
                                    reportInclusionRef.current.appendChild(
                                      editor.ui.view.toolbar.element,
                                    );
                                  }
                                }}
                                onChange={handleReportEditorChange}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-success me-2"
                              onClick={handleSave}
                            >
                              <i className="mdi mdi-content-save"></i> Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary me-2"
                              onClick={handleSubmit}
                            >
                              <i className="mdi mdi-check"></i> Submit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleBack}
                            >
                              <i className="mdi mdi-cancel"></i> Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Popup Message */}
              {popupMessage && (
                <Popup
                  message={popupMessage.message}
                  type={popupMessage.type}
                  onClose={popupMessage.onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>

   
    </div>
  );
};

export default DetailedRadiologyReportPage;