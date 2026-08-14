import React, { useState, useEffect } from "react"
import { getRequest, postRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService"
import Popup from "../../../Components/popup"
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import {
  DOCTOR_VISIT_SELECT_DOCTOR_WARN,
  DOCTOR_VISIT_SAVE_SUCC,
  DOCTOR_VISIT_SAVE_ERR,
  DOCTOR_VISIT_API_ERR,
  DOCTOR_VISIT_SELECT_DIAG_TYPE_WARN,
  DOCTOR_VISIT_SELECT_STATUS_WARN,
  DOCTOR_VISIT_ENTER_DIAG_TEXT_WARN,
  DOCTOR_VISIT_SELECT_ICD_WARN,
  DOCTOR_VISIT_DIAG_ADDED_SUCC,
  DIAGNOSIS_TYPE_WORKING,
  DIAGNOSIS_TYPE_ICD,
  DIAGNOSIS_TYPE_WORKING_LABEL,
  DIAGNOSIS_TYPE_ICD_LABEL,
  DIAGNOSIS_STATUS_ACTIVE,
  DIAGNOSIS_STATUS_CONFIRMED,
  DIAGNOSIS_STATUS_INACTIVE,
  DIAGNOSIS_STATUS_ACTIVE_LABEL,
  DIAGNOSIS_STATUS_CONFIRMED_LABEL,
  DIAGNOSIS_STATUS_INACTIVE_LABEL,
  SAVE_IP_DIAGNOSIS_SUCC,
  SAVE_IP_DIAGNOSIS_ERR,
  SAVE_IP_DIAGNOSIS_API_ERR,
  DEBOUNCE_SEARCH_IN_MILLIS,
  REPORT_GEN_FAILED_ERR_MSG
} from "../../../config/constants"

import { GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, DOCTOR_BY_SPECIALITY, MAS_VISIT_TYPE_GET_ALL, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, FILTER_OPD_DEPT, SAVE_DAILY_CASE_SHEET_ENTRY, GET_DAILY_CASE_SHEET_ENTRY, SAVE_IP_DIAGNOSIS_ENTRY, MAS_ICD_GET_ALL_END_URL, GET_IP_DIAGNOSIS_ENTRY, IP_DAILY_CASE_SHEET_REPORT_URL, STATUS_D } from "../../../config/apiConfig"

const DoctorVisitCaseNotes = ({ selectedPatient }) => {
  const [activeView, setActiveView] = useState("doctorVisit") // "doctorVisit" | "diagnosis"
  const [popupMessage, setPopupMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false)
  const [modalError, setModalError] = useState("")
  const [reportPdfUrl, setReportPdfUrl] = useState(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (onCloseCallback) {
          onCloseCallback()
        }
      }
    })
  }

  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [visitTypes, setVisitTypes] = useState([])

  // State for Doctor Visit Form
  const [doctorVisitForm, setDoctorVisitForm] = useState({
    visitDateTime: "",
    doctorId: "",
    doctorName: "",
    departmentId: "",
    department: "",
    visitTypeId: "",
    visitType: "",
    doctorNotes: "",
    investigationSummary: "",
    medicineSummary: "",
    procedureSummary: "",
    carePlanChanges: "",
    nextFollowUpPlan: ""
  })

  const [loadingHistory, setLoadingHistory] = useState(false)

  // State for storing doctor visit history
  const [doctorVisitHistory, setDoctorVisitHistory] = useState([])

  // Diagnosis state
  const [diagnosisList, setDiagnosisList] = useState([])
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false)

  // Diagnosis modals state
  const [showViewDiagnosisModal, setShowViewDiagnosisModal] = useState(false)
  const [showAddDiagnosisModal, setShowAddDiagnosisModal] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null)

  // Add Diagnosis Form state
  const [addDiagnosisForm, setAddDiagnosisForm] = useState({
    diagnosisType: "",
    diagnosisText: "",
    icdSearch: "",
    icdCode: "",
    icdName: "",
    icdId: 0,
    status: "",
    date: new Date().toISOString().slice(0, 16),
    remarks: ""
  })

  // ICD search results mock
  const icdDatabase = [
    { code: "A90", name: "Dengue Fever" },
    { code: "A91", name: "Dengue Haemorrhagic Fever" },
    { code: "J18", name: "Pneumonia" },
    { code: "I10", name: "Hypertension" },
    { code: "E11", name: "Type 2 Diabetes Mellitus" },
    { code: "K37", name: "Appendicitis" },
    { code: "N20", name: "Calculus of Kidney" },
    { code: "J45", name: "Asthma" },
    { code: "A01", name: "Typhoid Fever" },
    { code: "G43", name: "Migraine" }
  ]
  const [icdSearchResults, setIcdSearchResults] = useState([])

  const fetchDoctorVisitHistory = async () => {
    const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 27;
    if (!inpatientId) return;
    setLoadingHistory(true);
    try {
      const response = await getRequest(`${GET_DAILY_CASE_SHEET_ENTRY}/${inpatientId}`);
      if (response && response.response && Array.isArray(response.response)) {
        setDoctorVisitHistory(response.response);
      } else if (Array.isArray(response)) {
        setDoctorVisitHistory(response);
      } else {
        setDoctorVisitHistory([]);
      }
    } catch (error) {
      console.error("Error fetching doctor visit history:", error);
      setDoctorVisitHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      }).replace(/ /g, '-');
    } catch (e) {
      return dateStr;
    }
  };

  const fetchDiagnosisList = async () => {
    const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId;
    if (!inpatientId) return;
    setLoadingDiagnosis(true);
    try {
      const response = await getRequest(`${GET_IP_DIAGNOSIS_ENTRY}/${inpatientId}`);
      if (response && response.response && Array.isArray(response.response)) {
        const mappedList = response.response.map((diag, index) => {
          const typeLabel = diag.diagnosisType === "I" ? DIAGNOSIS_TYPE_ICD_LABEL : (diag.diagnosisType === "W" ? DIAGNOSIS_TYPE_WORKING_LABEL : "-");
          const statusLabel = diag.status === "A" ? DIAGNOSIS_STATUS_ACTIVE_LABEL : (diag.status === "C" ? DIAGNOSIS_STATUS_CONFIRMED_LABEL : (diag.status === "I" ? DIAGNOSIS_STATUS_INACTIVE_LABEL : "-"));
          return {
            id: index + 1,
            date: formatDate(diag.dateTime),
            type: typeLabel,
            diagnosisText: diag.diagnosis || diag.icdName || "",
            icdCode: diag.icdCode || "-",
            status: statusLabel,
            remarks: diag.remark || "",
            dateTime: diag.dateTime
          };
        });
        setDiagnosisList(mappedList);
      } else {
        setDiagnosisList([]);
      }
    } catch (error) {
      console.error("Error fetching diagnosis list:", error);
      setDiagnosisList([]);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  useEffect(() => {
    fetchDoctorVisitHistory();
    fetchDiagnosisList();
  }, [selectedPatient]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const deptRes = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
        if (deptRes && deptRes.response) {
          setDepartments(deptRes.response);
        } else if (Array.isArray(deptRes)) {
          setDepartments(deptRes);
        }

        const visitTypeRes = await getRequest(MAS_VISIT_TYPE_GET_ALL);
        let loadedVisitTypes = [];
        if (visitTypeRes && visitTypeRes.response) {
          loadedVisitTypes = visitTypeRes.response;
        } else if (Array.isArray(visitTypeRes)) {
          loadedVisitTypes = visitTypeRes;
        }
        setVisitTypes(loadedVisitTypes);

        const normalType = loadedVisitTypes.find(vt => vt.visitTypeCode === "NORMAL" || vt.visitTypeName?.toLowerCase().includes("normal"));
        if (normalType) {
          setDoctorVisitForm(prev => ({
            ...prev,
            visitTypeId: normalType.visitTypeId || normalType.id || "",
            visitType: normalType.visitTypeName || ""
          }));
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const handleVisitTypeChange = (e) => {
    const val = e.target.value;
    const selectedVt = visitTypes.find(vt => (vt.visitTypeId == val || vt.id == val || vt.visitTypeName === val || vt.visitTypeCode === val));
    setDoctorVisitForm(prev => ({
      ...prev,
      visitTypeId: selectedVt?.visitTypeId || selectedVt?.id || val,
      visitType: selectedVt?.visitTypeName || val
    }));
  };

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    const selectedDept = departments.find(d => (d.id == deptId || d.departmentId == deptId));
    const deptName = selectedDept ? (selectedDept.departmentName || selectedDept.name) : "";

    setDoctorVisitForm(prev => ({
      ...prev,
      departmentId: deptId,
      department: deptName,
      doctorId: "",
      doctorName: ""
    }));

    if (deptId) {
      try {
        const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${deptId}`);
        if (response && response.response) {
          setDoctors(response.response);
        } else if (Array.isArray(response)) {
          setDoctors(response);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("Error fetching doctors by speciality:", error);
        setDoctors([]);
      }
    } else {
      setDoctors([]);
    }
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    const selectedDoc = doctors.find(d => (d.userId == docId || d.id == docId));
    let docName = "";
    if (selectedDoc) {
      if (selectedDoc.firstName) {
        docName = [selectedDoc.firstName, selectedDoc.middleName, selectedDoc.lastName].filter(Boolean).join(" ");
      } else if (selectedDoc.name) {
        docName = selectedDoc.name;
      } else if (selectedDoc.userName) {
        docName = selectedDoc.userName;
      }
    }

    setDoctorVisitForm(prev => ({
      ...prev,
      doctorId: docId,
      doctorName: docName
    }));
  };

  const handleDoctorVisitFormChange = (e) => {
    const { name, value } = e.target
    setDoctorVisitForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDoctorVisit = async () => {
    if (!doctorVisitForm.doctorId) {
      showPopup(DOCTOR_VISIT_SELECT_DOCTOR_WARN, "warning")
      return
    }

    setIsSaving(true)

    const inpatientId = Number(selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 27)

    const payload = {
      inpatientId: inpatientId,
      doctorId: Number(doctorVisitForm.doctorId),
      visitType: Number(doctorVisitForm.visitTypeId || 0),
      visitDepartmentId: Number(doctorVisitForm.departmentId),
      doctorNotes: doctorVisitForm.doctorNotes || "",
      investigationSummary: doctorVisitForm.investigationSummary || "",
      medicineSummary: doctorVisitForm.medicineSummary || "",
      procedureSummary: doctorVisitForm.procedureSummary || "",
      carePlanChanges: doctorVisitForm.carePlanChanges || "",
      nextFollowUpPlan: doctorVisitForm.nextFollowUpPlan || ""
    }

    try {
      const response = await postRequest(SAVE_DAILY_CASE_SHEET_ENTRY, payload)
      if (response && (response.status === 200 || response.status === 201 || response.status === "200" || response.message === "success" || response.response || response.caseSheetEntryId)) {
        await fetchDoctorVisitHistory()
        const normalType = visitTypes.find(vt => vt.visitTypeCode === "NORMAL" || vt.visitTypeName?.toLowerCase().includes("normal"));
        setDoctorVisitForm({
          visitDateTime: "",
          doctorId: "",
          doctorName: "",
          departmentId: "",
          department: "",
          visitTypeId: normalType?.visitTypeId || normalType?.id || "",
          visitType: normalType?.visitTypeName || "",
          doctorNotes: "",
          investigationSummary: "",
          medicineSummary: "",
          procedureSummary: "",
          carePlanChanges: "",
          nextFollowUpPlan: ""
        })
        setDoctors([])
        showPopup(DOCTOR_VISIT_SAVE_SUCC, "success", () => setIsSaving(false))
      } else {
        showPopup(response?.message || DOCTOR_VISIT_SAVE_ERR, "error", () => setIsSaving(false))
      }
    } catch (error) {
      console.error("Error saving doctor visit notes:", error)
      showPopup(DOCTOR_VISIT_API_ERR, "error", () => setIsSaving(false))
    }
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    const date = new Date(dateTimeStr)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrintClick = async () => {
    const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 27;
    if (inpatientId) {
      try {
        setIsGeneratingReport(true)
        const reportUrl = `${IP_DAILY_CASE_SHEET_REPORT_URL}?inPatientId=${inpatientId}`
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D)
        const fileURL = window.URL.createObjectURL(blob)
        setReportPdfUrl(fileURL)
      } catch (error) {
        console.error("Error generating report:", error)
        showPopup(REPORT_GEN_FAILED_ERR_MSG, "error")
      } finally {
        setIsGeneratingReport(false)
      }
    } else {
      showPopup("Patient ID not found", "error")
    }
  }

  // Diagnosis handlers
  useEffect(() => {
    const isSelected = addDiagnosisForm.icdCode && addDiagnosisForm.icdSearch === `${addDiagnosisForm.icdCode} - ${addDiagnosisForm.icdName}`;
    if (addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD && addDiagnosisForm.icdSearch.trim().length > 0 && !isSelected) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const response = await getRequest(`${MAS_ICD_GET_ALL_END_URL}?flag=1&page=0&size=10&search=${addDiagnosisForm.icdSearch}`);
          if (response && response.response && response.response.content) {
            setIcdSearchResults(response.response.content);
          } else if (response && response.response && Array.isArray(response.response)) {
            setIcdSearchResults(response.response);
          } else if (Array.isArray(response)) {
            setIcdSearchResults(response);
          } else {
            setIcdSearchResults([]);
          }
        } catch (error) {
          console.error("Error searching ICD codes:", error);
          setIcdSearchResults([]);
        }
      }, DEBOUNCE_SEARCH_IN_MILLIS);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setIcdSearchResults([]);
    }
  }, [addDiagnosisForm.icdSearch, addDiagnosisForm.diagnosisType]);

  const handleViewDiagnosis = (diag) => {
    setSelectedDiagnosis(diag)
    setShowViewDiagnosisModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewDiagnosisModal(false)
    setSelectedDiagnosis(null)
  }

  const handleOpenAddDiagnosis = () => {
    setAddDiagnosisForm({
      diagnosisType: "",
      diagnosisText: "",
      icdSearch: "",
      icdCode: "",
      icdName: "",
      icdId: 0,
      status: "",
      date: new Date().toISOString().slice(0, 16),
      remarks: ""
    })
    setIcdSearchResults([])
    setModalError("")
    setShowAddDiagnosisModal(true)
  }

  const handleCloseAddModal = () => {
    setModalError("")
    setShowAddDiagnosisModal(false)
  }

  const handleAddDiagnosisFormChange = (e) => {
    const { name, value } = e.target
    setAddDiagnosisForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectIcd = (icd) => {
    setAddDiagnosisForm(prev => ({
      ...prev,
      icdSearch: `${icd.icdCode} - ${icd.icdName}`,
      icdCode: icd.icdCode,
      icdName: icd.icdName,
      icdId: icd.icdId
    }))
    setIcdSearchResults([])
  }

  const handleSaveDiagnosis = async () => {
    setModalError("")

    if (!addDiagnosisForm.diagnosisType) {
      setModalError(DOCTOR_VISIT_SELECT_DIAG_TYPE_WARN)
      return
    }
    if (!addDiagnosisForm.status) {
      setModalError(DOCTOR_VISIT_SELECT_STATUS_WARN)
      return
    }
    if (addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_WORKING && !addDiagnosisForm.diagnosisText) {
      setModalError(DOCTOR_VISIT_ENTER_DIAG_TEXT_WARN)
      return
    }
    if (addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD && !addDiagnosisForm.icdCode) {
      setModalError(DOCTOR_VISIT_SELECT_ICD_WARN)
      return
    }

    setIsSavingDiagnosis(true)

    const inpatientId = Number(selectedPatient?.inpatientId || selectedPatient?.id || selectedPatient?.inPatientId || 0)
    const patientId = Number(selectedPatient?.patientId || 0)
    const departmentId = Number(sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId") || 40)

    const payload = {
      inpatientId: inpatientId,
      patientId: patientId,
      departmentId: departmentId,
      diagnosisType: addDiagnosisForm.diagnosisType,
      diagnosisText: addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD
        ? addDiagnosisForm.icdName
        : addDiagnosisForm.diagnosisText,
      status: addDiagnosisForm.status,
      dateTime: new Date(addDiagnosisForm.date).toISOString(),
      remark: addDiagnosisForm.remarks || "",
      icdId: addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD ? Number(addDiagnosisForm.icdId || 0) : 0
    }

    try {
      const response = await postRequest(SAVE_IP_DIAGNOSIS_ENTRY, payload)
      if (response && (response.status === 200 || response.message === "success" || response.response === "IP diagnosis entry saved successfully")) {
        showPopup(SAVE_IP_DIAGNOSIS_SUCC, "success", () => {
          setIsSavingDiagnosis(false)
          setShowAddDiagnosisModal(false)
          fetchDiagnosisList()
        })
      } else {
        setModalError(response?.message || SAVE_IP_DIAGNOSIS_ERR)
        setIsSavingDiagnosis(false)
      }
    } catch (error) {
      console.error("Error saving diagnosis:", error)
      setModalError(SAVE_IP_DIAGNOSIS_API_ERR)
      setIsSavingDiagnosis(false)
    }
  }

  return (
    <div>
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      {reportPdfUrl && (
        <PdfViewer
          pdfUrl={reportPdfUrl}
          name="Doctor Visit Report"
          onClose={() => setReportPdfUrl(null)}
        />
      )}
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeView === "doctorVisit" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("doctorVisit")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Doctor Visit / Case Notes
        </button>
        <button
          className={`btn btn-sm ${activeView === "diagnosis" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveView("diagnosis")}
          style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}
        >
          Diagnosis ({diagnosisList.length})
        </button>
      </div>

      {/* ─── DOCTOR VISIT SECTION ─── */}
      {activeView === "doctorVisit" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>Doctor Visit / Case Notes</strong>
          </div>
          <div className="card-body">
            {/* Form Fields */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label">Department/Speciality</label>
                <select
                  className="form-select"
                  name="departmentId"
                  value={doctorVisitForm.departmentId}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                      {dept.departmentName || dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Doctor Name</label>
                <select
                  className="form-select"
                  name="doctorId"
                  value={doctorVisitForm.doctorId}
                  onChange={handleDoctorChange}
                  disabled={!doctorVisitForm.departmentId}
                >
                  <option value="">
                    {!doctorVisitForm.departmentId ? "Select Department First" : "Select Doctor"}
                  </option>
                  {doctors.map((doctor) => {
                    const docName = doctor.firstName
                      ? [doctor.firstName, doctor.middleName, doctor.lastName].filter(Boolean).join(" ")
                      : (doctor.name || doctor.userName || `Doctor #${doctor.userId || doctor.id}`);
                    return (
                      <option key={doctor.userId || doctor.id} value={doctor.userId || doctor.id}>
                        {docName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Visit Type</label>
                <select
                  className="form-select"
                  name="visitType"
                  value={doctorVisitForm.visitTypeId || doctorVisitForm.visitType}
                  onChange={handleVisitTypeChange}
                >
                  <option value="">Select Visit Type</option>
                  {visitTypes.map((vt) => (
                    <option key={vt.visitTypeId || vt.id} value={vt.visitTypeId || vt.id || vt.visitTypeName}>
                      {vt.visitTypeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Doctor Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="doctorNotes"
                  placeholder="Enter doctor's notes..."
                  value={doctorVisitForm.doctorNotes}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Investigation Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="investigationSummary"
                  placeholder="Enter investigation summary..."
                  value={doctorVisitForm.investigationSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Medicine Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="medicineSummary"
                  placeholder="Enter medicine summary..."
                  value={doctorVisitForm.medicineSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Procedure Summary</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="procedureSummary"
                  placeholder="Enter procedure summary..."
                  value={doctorVisitForm.procedureSummary}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Care Plan Changes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="carePlanChanges"
                  placeholder="Enter care plan changes..."
                  value={doctorVisitForm.carePlanChanges}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Next Follow-up Plan</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="nextFollowUpPlan"
                  placeholder="Enter next follow-up plan..."
                  value={doctorVisitForm.nextFollowUpPlan}
                  onChange={handleDoctorVisitFormChange}
                />
              </div>
              <div className="col-12 gap-3 d-flex">
              <div>
                  <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveDoctorVisit}
                  disabled={isSaving}
                >
                  <i className="fa fa-save me-1"></i> {isSaving ? "Saving..." : "Save Visit"}
                </button>
                </div>

                <div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handlePrintClick}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      "Print"
                    )}
                  </button>
                </div>

              </div>

               

            </div>

            <hr />

            {/* Doctor Visit History */}
            <div>
              <h6 className="mb-3">Doctor Visit History</h6>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : doctorVisitHistory.length === 0 ? (
                <div className="text-muted text-center py-3">No doctor visit history found.</div>
              ) : (
                doctorVisitHistory.map((visit) => (
                  <div key={visit.caseSheetEntryId || visit.id} className="card mb-3">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{formatDateTime(visit.visitDateTime)}</strong> | 
                          <span className="ms-2">{visit.doctorName}</span> | 
                          <span className="ms-2 text-muted">{visit.departmentName || visit.department}</span>
                          {visit.visitTypeName && (
                            <>
                              {" | "}
                              <span className="ms-2 text-info">{visit.visitTypeName}</span>
                            </>
                          )}
                        </div>
                        {visit.capturedBy && (
                          <div className="text-muted small">
                            Captured By: {visit.capturedBy}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-2"><strong>Notes:</strong> {visit.notes || visit.doctorNotes}</div>
                      <div className="mb-2"><strong>Investigation:</strong> {visit.investigation || visit.investigationSummary}</div>
                      <div className="mb-2"><strong>Medicines:</strong> {visit.medicines || visit.medicineSummary}</div>
                      <div className="mb-2"><strong>Procedure:</strong> {visit.procedure || visit.procedureSummary}</div>
                      <div className="mb-2"><strong>Plan:</strong> {visit.plan || visit.carePlanChanges}</div>
                      <div><strong>Follow-up:</strong> {visit.followUp || visit.nextFollowUpPlan}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSIS SECTION ─── */}
      {activeView === "diagnosis" && (
        <div className="card">
          <div className="card-header bg-primary text-white py-2">
            <strong>Diagnosis List</strong>
          </div>
          <div className="card-body">
            <div className="table-responsive mb-3">
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDiagnosis ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Loading diagnoses...
                      </td>
                    </tr>
                  ) : diagnosisList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3 text-muted">No diagnoses found.</td>
                    </tr>
                  ) : (
                    diagnosisList.map((diag) => (
                      <tr key={diag.id}>
                        <td>{diag.date}</td>
                        <td>{diag.type}</td>
                        <td>{diag.diagnosisText}</td>
                        <td>{diag.status}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-info"
                            style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}
                            onClick={() => handleViewDiagnosis(diag)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-success btn-sm"
              onClick={handleOpenAddDiagnosis}
            >
              <i className="fa fa-plus me-1"></i> Add Diagnosis
            </button>
          </div>
        </div>
      )}

      {/* View Diagnosis Modal */}
      {showViewDiagnosisModal && selectedDiagnosis && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={handleCloseViewModal}>
          <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Diagnosis Details</h6>
                <button type="button" className="btn-close" onClick={handleCloseViewModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Type:</strong> {selectedDiagnosis.type}</p>
                <p><strong>Diagnosis:</strong> {selectedDiagnosis.diagnosisText}</p>
                <p><strong>ICD Code:</strong> {selectedDiagnosis.icdCode}</p>
                <p><strong>Status:</strong> {selectedDiagnosis.status}</p>
                <p><strong>Date:</strong> {selectedDiagnosis.date}</p>
                {selectedDiagnosis.remarks && <p><strong>Remarks:</strong> {selectedDiagnosis.remarks}</p>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseViewModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Diagnosis Modal */}
      {showAddDiagnosisModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }} onClick={handleCloseAddModal}>
          <div className="modal-dialog modal-md modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Add Diagnosis</h6>
                <button type="button" className="btn-close" onClick={handleCloseAddModal}></button>
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger py-2 px-3 small mb-3 d-flex justify-content-between align-items-center">
                    <span>{modalError}</span>
                    <button type="button" className="btn-close small" style={{ fontSize: "0.5rem" }} onClick={() => setModalError("")}></button>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Diagnosis Type:</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="diagnosisType" value={DIAGNOSIS_TYPE_WORKING} checked={addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_WORKING} onChange={handleAddDiagnosisFormChange} />
                      <label className="form-check-label">{DIAGNOSIS_TYPE_WORKING_LABEL}</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="diagnosisType" value={DIAGNOSIS_TYPE_ICD} checked={addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD} onChange={handleAddDiagnosisFormChange} />
                      <label className="form-check-label">{DIAGNOSIS_TYPE_ICD_LABEL}</label>
                    </div>
                  </div>
                </div>

                {addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_WORKING && (
                  <div className="mb-3">
                    <label className="form-label">Diagnosis Text:</label>
                    <input type="text" className="form-control" name="diagnosisText" value={addDiagnosisForm.diagnosisText} onChange={handleAddDiagnosisFormChange} />
                  </div>
                )}

                {addDiagnosisForm.diagnosisType === DIAGNOSIS_TYPE_ICD && (
                  <div className="mb-3">
                    <label className="form-label">Search ICD Code:</label>
                    <input type="text" className="form-control" name="icdSearch" placeholder="Search by code or name..." value={addDiagnosisForm.icdSearch} onChange={handleAddDiagnosisFormChange} autoComplete="off" />
                    {icdSearchResults.length > 0 && (
                      <div className="border rounded bg-white mt-1" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {icdSearchResults.map((icd) => (
                          <div key={icd.icdId || icd.id || icd.icdCode} className="px-3 py-2 border-bottom" style={{ cursor: "pointer" }} onClick={() => handleSelectIcd(icd)}>
                            <strong>{icd.icdCode}</strong> - {icd.icdName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Status:</label>
                  <div className="d-flex gap-3">
                    {[
                      { value: DIAGNOSIS_STATUS_ACTIVE, label: DIAGNOSIS_STATUS_ACTIVE_LABEL },
                      { value: DIAGNOSIS_STATUS_CONFIRMED, label: DIAGNOSIS_STATUS_CONFIRMED_LABEL },
                      { value: DIAGNOSIS_STATUS_INACTIVE, label: DIAGNOSIS_STATUS_INACTIVE_LABEL }
                    ].map((s) => (
                      <div className="form-check" key={s.value}>
                        <input className="form-check-input" type="radio" name="status" value={s.value} checked={addDiagnosisForm.status === s.value} onChange={handleAddDiagnosisFormChange} />
                        <label className="form-check-label">{s.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Date:</label>
                  <input type="datetime-local" className="form-control" name="date" value={addDiagnosisForm.date} onChange={handleAddDiagnosisFormChange} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Remarks:</label>
                  <input type="text" className="form-control" name="remarks" placeholder="Enter remarks..." value={addDiagnosisForm.remarks} onChange={handleAddDiagnosisFormChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseAddModal} disabled={isSavingDiagnosis}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveDiagnosis} disabled={isSavingDiagnosis}>
                  {isSavingDiagnosis ? "Saving..." : "Save Diagnosis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorVisitCaseNotes