import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import { getRequest, postRequest } from "../../../service/apiService";
import { RADIOLOGY_REPORT_SAVE_URL, RADIOLOGY_TEMPLATE_LIST_GET_BY_ID, REQUEST_PARAM_STATUS, STATUS_Y ,STATUS_S} from "../../../config/apiConfig";
import { FETCH_RADIOLOGY_TEMPLATE_ERR_MSG,REPORT_SAVE_FAILED_ERR_MSG,REPORT_SAVED_SUCC_MSG, REPORT_SUBMIT_FAILED_ERR_MSG, REPORT_SUBMITTED_SUCC_MSG } from "../../../config/constants";

const DetailedRadiologyReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportData = location.state; // Data passed from PendingListRadiologyReport

  // State for loading
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showTemplateSearch, setShowTemplateSearch] = useState(false);

  // Refs for CKEditor
  const reportEditorRef = useRef(null);
  const reportInclusionRef = useRef(null);

  // Form data state - populated from passed data
  const [formData, setFormData] = useState({
    // Patient Details
    uhid: reportData?.uhid || "",
    patientName: reportData?.patientName || "",
    age: reportData?.age?.replace("Y", "").trim() || "",
    gender: reportData?.gender || "",
    mobileNo: reportData?.contactNo || "",
    // Report Content
    reportContent: "",
    // Template Details
    templateCode: "",
    templateName: "",
    modalityType: reportData?.modality || "",
    // IDs
    radOrderDtId: reportData?.radOrderDtId || "",
    modalityId: reportData?.modalityId || ""
  });

  // Investigation Details from passed data
  const investigationDetails = {
    accessionNo: reportData?.accessionNo || "",
    modality: reportData?.modality || "",
    investigationName: reportData?.investigationName || "",
    orderDate: reportData?.orderDate || "",
    orderTime: reportData?.orderTime || "",
    studyDate: reportData?.studyDate || "",
    studyTime: reportData?.studyTime || ""
  };

  // Template data state
  const [templateData, setTemplateData] = useState([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");

  // Fetch template data based on modalityId
  const fetchTemplateData = async () => {
    if (!formData.modalityId) return;
    
    try {
      setTemplateLoading(true);
      const response = await getRequest(`${RADIOLOGY_TEMPLATE_LIST_GET_BY_ID}/${formData.modalityId}`);
      
      if (response?.status === 200 && response?.response) {
        setTemplateData(response.response);
      } else {
        setTemplateData([]);
      }
    } catch (error) {
      console.error("Error fetching template data:", error);
      showPopup(FETCH_RADIOLOGY_TEMPLATE_ERR_MSG, "error");
      setTemplateData([]);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Fetch templates when component mounts
  useEffect(() => {
    if (formData.modalityId) {
      fetchTemplateData();
    }
  }, [formData.modalityId]);

  // Filter templates based on search query
  const filteredTemplates = templateData.filter(template =>
    template.templateName?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    template.templateCode?.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      reportContent: template.templateText || "",
      templateCode: template.templateCode || "",
      templateName: template.templateName || ""
    }));
    setTemplateSearchQuery(template.templateName || "");
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

  // Prepare payload for API - Updated to match RadiologyReportRequest
  const preparePayload = () => {
    return {
      radOrderDtId: formData.radOrderDtId,
      reportDesc: formData.reportContent
    };
  };

  // Handle save (status = 's')
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = preparePayload();
      
      // Call API to save report with status 's'
      const response = await postRequest(`${RADIOLOGY_REPORT_SAVE_URL}?${REQUEST_PARAM_STATUS}=${STATUS_S.toLowerCase()}`, payload);
      
      if (response?.status === 200 || response?.status === 201) {
        showPopup(REPORT_SAVED_SUCC_MSG, "success");
      } else {
        showPopup(REPORT_SAVE_FAILED_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      showPopup(REPORT_SAVE_FAILED_ERR_MSG, "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle submit (status = 'y')
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = preparePayload();
      
      // Call API to submit report with status 'y'
      const response = await postRequest(`${RADIOLOGY_REPORT_SAVE_URL}?${REQUEST_PARAM_STATUS}=${STATUS_Y.toLowerCase()}`, payload);
      
      if (response?.status === 200 || response?.status === 201) {
        showPopup(REPORT_SUBMITTED_SUCC_MSG, "success");
        // Optionally navigate back after successful submit
        setTimeout(() => navigate(-1), 2000);
      } else {
        showPopup(REPORT_SUBMIT_FAILED_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      showPopup(REPORT_SUBMIT_FAILED_ERR_MSG, "error");
    } finally {
      setSubmitting(false);
    }
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
                                  <td>{formData.age} / {formData.gender}</td>
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
                              {templateLoading ? (
                                <div className="text-center py-2">
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading templates...</span>
                                  </div>
                                  <span className="ms-2">Loading templates...</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type template name..."
                                  value={templateSearchQuery}
                                  onChange={handleTemplateSearch}
                                  onFocus={() => setShowTemplateSearch(true)}
                                  disabled={templateData.length === 0}
                                />
                              )}
                              {showTemplateSearch && templateSearchQuery && templateData.length > 0 && (
                                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                  {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map(template => (
                                      <div
                                        key={template.pacsTemplateId || template.id}
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
<div className="row mb-4">
  <div className="col-md-4">
    <div className="mb-3">
      <label className="form-label fw-bold">Template Code</label>
      <input
        type="text"
        className="form-control"
        name="templateCode"
        value={formData.templateCode}
        onChange={handleChange}
        readOnly
      />
    </div>
  </div>
  <div className="col-md-4">
    <div className="mb-3">
      <label className="form-label fw-bold">Template Name</label>
      <input
        type="text"
        className="form-control"
        name="templateName"
        value={formData.templateName}
        onChange={handleChange}
        readOnly
      />
    </div>
  </div>
  <div className="col-4">
    <div className="mb-3">
      <label className="form-label fw-bold">Modality Type</label>
      <input
        type="text"
        className="form-control"
        value={investigationDetails.modality}
        readOnly
      />
    </div>
  </div>
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
                                minHeight: "350px"
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
                              disabled={saving || submitting || templateLoading}
                            >
                              {saving ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <i className="mdi mdi-content-save"></i> Save
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary me-2"
                              onClick={handleSubmit}
                              disabled={saving || submitting || templateLoading}
                            >
                              {submitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <i className="mdi mdi-check"></i> Submit
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleBack}
                              disabled={saving || submitting}
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