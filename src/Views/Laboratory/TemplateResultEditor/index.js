import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { CKEditor } from "@ckeditor/ckeditor5-react"
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document"
import Popup from "../../../Components/popup"
import { getRequest } from "../../../service/apiService"
import { RADIOLOGY_TEMPLATE_LIST_GET_BY_ID } from "../../../config/apiConfig"
import { FETCH_RADIOLOGY_TEMPLATE_ERR_MSG } from "../../../config/constants"


const HEADER_SELECTOR = ".navbar.fixed-top, .navbar, header"
const SIDEBAR_SELECTOR = ".sidebar, #sidebar, aside"

const ensureStyles = () => {
  if (document.getElementById("tre-modal-styles-v2")) return
  const old = document.getElementById("tre-modal-styles")
  if (old) old.remove()
  const style = document.createElement("style")
  style.id = "tre-modal-styles-v2"
  style.innerHTML = `
    .tre-backdrop {
      position: fixed !important;
      top: var(--tre-top, 0px) !important;
      left: var(--tre-left, 0px) !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0,0,0,0.5) !important;
      z-index: 1000 !important;
    }
    .tre-wrapper {
      position: fixed !important;
      top: var(--tre-top, 0px) !important;
      left: var(--tre-left, 0px) !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 1001 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      pointer-events: none !important;
      transform: none !important;
    }
    .tre-dialog {
      pointer-events: auto !important;
      background: #fff !important;
      border-radius: 8px !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      max-width: 1200px !important;
      max-height: 100% !important;
      overflow: hidden !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.35) !important;
      position: relative !important;
    }
    .tre-header {
      flex-shrink: 0 !important;
      background: #0d6efd !important;
      color: #fff !important;
      padding: 10px 16px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .tre-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 16px !important;
      min-height: 0 !important;
    }
    .tre-footer {
      flex-shrink: 0 !important;
      padding: 10px 16px !important;
      border-top: 1px solid #dee2e6 !important;
      background: #f8f9fa !important;
      display: flex !important;
      justify-content: flex-end !important;
      gap: 8px !important;
    }
  `
  document.head.appendChild(style)
}

const computeInsets = () => {
  const header = document.querySelector(HEADER_SELECTOR)
  const sidebar = document.querySelector(SIDEBAR_SELECTOR)
  const top = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0
  const left = sidebar ? Math.max(0, Math.round(sidebar.getBoundingClientRect().right)) : 0
  return { top, left }
}

const TemplateResultEditor = ({
  show,
  onClose,
  onSave,
  modalityId,
  modalityType,
  initialData,
}) => {
  const [templateLoading, setTemplateLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)

  const [templateData, setTemplateData] = useState([])
  const [templateSearchQuery, setTemplateSearchQuery] = useState(
    initialData?.templateName || ""
  )
  const [showTemplateSearch, setShowTemplateSearch] = useState(false)

  const [insets, setInsets] = useState({ top: 0, left: 0 })

  const [formData, setFormData] = useState({
    templateCode: initialData?.templateCode || "",
    templateName: initialData?.templateName || "",
    modalityType: modalityType || "",
    reportContent: initialData?.templateResult || "",
  })

  const reportEditorRef = useRef(null)
  const reportInclusionRef = useRef(null)

  useEffect(() => {
    if (show) ensureStyles()
  }, [show])

  useEffect(() => {
    if (!show) return
    const update = () => setInsets(computeInsets())
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [show])

  useEffect(() => {
    if (show) {
      setFormData({
        templateCode: initialData?.templateCode || "",
        templateName: initialData?.templateName || "",
        modalityType: modalityType || "",
        reportContent: initialData?.templateResult || "",
      })
      setTemplateSearchQuery(initialData?.templateName || "")
      setShowTemplateSearch(false)
    }
  }, [show])

  useEffect(() => {
    if (!show) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [show])

  const showPopup = (message, type = "info", closeModalOnOk = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (closeModalOnOk) onClose?.()
      },
    })
  }

  const fetchTemplateData = async () => {
    if (!modalityId) return
    try {
      setTemplateLoading(true)
      const response = await getRequest(
        `${RADIOLOGY_TEMPLATE_LIST_GET_BY_ID}/${modalityId}`
      )
      if (response?.status === 200 && response?.response) {
        setTemplateData(response.response)
      } else {
        setTemplateData([])
      }
    } catch (error) {
      console.error("Error fetching template data:", error)
      showPopup(FETCH_RADIOLOGY_TEMPLATE_ERR_MSG || "Failed to fetch templates", "error")
      setTemplateData([])
    } finally {
      setTemplateLoading(false)
    }
  }

  useEffect(() => {
    if (show && modalityId) fetchTemplateData()
  }, [show, modalityId])

  const filteredTemplates = templateData.filter(
    (template) =>
      template.templateName?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.templateCode?.toLowerCase().includes(templateSearchQuery.toLowerCase())
  )

  const handleTemplateSelect = (template) => {
    setFormData((prev) => ({
      ...prev,
      reportContent: template.templateText || "",
      templateCode: template.templateCode || "",
      templateName: template.templateName || "",
    }))
    setTemplateSearchQuery(template.templateName || "")
    setShowTemplateSearch(false)
  }

  const handleTemplateSearch = (e) => {
    setTemplateSearchQuery(e.target.value)
    setShowTemplateSearch(true)
  }

  const handleReportEditorChange = (event, editor) => {
    const data = editor.getData()
    setFormData((prev) => ({ ...prev, reportContent: data }))
  }

  const handleSave = () => {
    setSaving(true)
    try {
      onSave?.({
        templateResult: formData.reportContent || "",
        templateCode: formData.templateCode || "",
        templateName: formData.templateName || "",
      })
      showPopup("Template result saved.", "success", true)
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  const insetVars = {
    "--tre-top": `${insets.top}px`,
    "--tre-left": `${insets.left}px`,
  }

  const modalContent = (
    <>
      {/* Backdrop (click to close) - covers content area only */}
      <div className="tre-backdrop" style={insetVars} onClick={onClose} />

      {/* Centering wrapper - covers content area only */}
      <div className="tre-wrapper" style={insetVars} role="dialog" aria-modal="true">
        <div className="tre-dialog">
          {/* Header */}
          <div className="tre-header">
            <h5 className="mb-0">Template Result</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          {/* Body — scrollable */}
          <div className="tre-body">
            {/* Search Template */}
            <div className="row mb-4">
              <div className="col-md-6 position-relative">
                <label className="form-label fw-bold">Search Template</label>
                {templateLoading ? (
                  <div className="text-center py-2">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    >
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
                {showTemplateSearch &&
                  templateSearchQuery &&
                  templateData.length > 0 && (
                    <div
                      className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm"
                      style={{ zIndex: 10000, maxHeight: "200px", overflowY: "auto" }}
                    >
                      {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => (
                          <div
                            key={template.pacsTemplateId || template.id}
                            className="p-2 border-bottom"
                            onClick={() => handleTemplateSelect(template)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="fw-bold">{template.templateName}</div>
                            <small className="text-muted">
                              Code: {template.templateCode}
                            </small>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-muted">No templates found</div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Code / Name / Modality */}
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Template Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.templateCode}
                  readOnly
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Template Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.templateName}
                  readOnly
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Modality Type</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.modalityType}
                  readOnly
                />
              </div>
            </div>

            {/* CKEditor */}
            <div className="mb-2">
              <label className="form-label fw-bold">Report Content</label>
              <div
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "6px",
                  padding: "8px",
                  backgroundColor: "#fff",
                  minHeight: "350px",
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
                    placeholder: "Enter template result content...",
                  }}
                  onReady={(editor) => {
                    reportEditorRef.current = editor
                    if (reportInclusionRef.current) {
                      reportInclusionRef.current.innerHTML = ""
                      reportInclusionRef.current.appendChild(
                        editor.ui.view.toolbar.element
                      )
                    }
                  }}
                  onChange={handleReportEditorChange}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="tre-footer">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving}
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
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              <i className="mdi mdi-cancel"></i> Cancel
            </button>
          </div>
        </div>
      </div>

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </>
  )

  return createPortal(modalContent, document.body)
}

export default TemplateResultEditor