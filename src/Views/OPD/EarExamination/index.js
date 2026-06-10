import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  ENT_MAS_PINNA,
  ENT_MAS_EAR_CANAL,
  ENT_MAS_TM_STATUS,
  MAS_ENT_RINNE,
  MAS_ENT_WEBER,
  MAS_EAR_CANAL,
  MAS_ENT_MUCOSA,
  MAS_ENT_SEPTUM,
  MAS_TONSIL_GRADE,
  SAVE_ENT_DETAILS,
  GET_WAITING_LIST,
  GET_ENT_DETAILS_BY_VISIT,
} from "../../../config/apiConfig";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";


const defaultEntForm = {
  // ===== EAR EXAMINATION =====//
  rightPinna: "",
  leftPinna: "",
  rightEarCanal: "",
  leftEarCanal: "",
  rightTmStatus: "",
  leftTmStatus: "",

  // Hearing Tests
  rinneTest: "",
  weberTest: "",
  abcTest: "",
  audiometryFindings: "",

  // ===== NOSE & SINUSES (PNS) =====
  externalNose: "",
  nasalMucosa: "",
  septum: "",
  turbinates: "",
  nasalPolyp: "",
  nasalDischarge: "",
  maxillaryTenderness: "",
  frontalTenderness: "",

  // ===== THROAT / OROPHARYNX =====
  oralCavity: "",
  tonsilGrade: "",
  tonsilCongestion: "",
  tonsilFollicles: "",
  tonsilMembrane: "",
  peritonsillarAbscess: "",
  pharynx: "",
  uvula: "",
  voiceQuality: "",

  // ===== NECK EXAMINATION =====
  thyroidEnlargement: "",
  cervicalNodes: "",
  neckMass: "",
  neckOtherFindings: "",
};

const mapApiResponseToForm = (data) => {
  if (!data) return defaultEntForm;
  const mapped = { ...defaultEntForm };

  // Map all fields from API response to form
  Object.keys(defaultEntForm).forEach((key) => {
    if (data.hasOwnProperty(key) && data[key] !== null && data[key] !== undefined) {
      mapped[key] = data[key];
    }
  });

  return mapped;
};

const EarExamination = forwardRef(
  ({ patientId, visitId, opdDate, hideHeader = false, hideButtons = false }, ref) => {
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchData, setSearchData] = useState({ mobileNumber: "", patientName: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);

    const [form, setForm] = useState(defaultEntForm);

    // Master data options
    const [pinnaList, setPinnaList] = useState([]);
    const [earCanalList, setEarCanalList] = useState([]);
    const [tmStatusList, setTmStatusList] = useState([]);
    const [rinneList, setRinneList] = useState([]);
    const [weberList, setWeberList] = useState([]);
    const [mucosaList, setMucosaList] = useState([]);
    const [septumList, setSeptumList] = useState([]);
    const [tonsilGradeList, setTonsilGradeList] = useState([]);

    const yesNoOptions = ["Yes", "No"];
    const dischargeOptions = ["Mucoid", "Purulent", "Bloody"];
    const tenderOptions = ["Tender", "Non-Tender"];
    const uvulaOptions = ["Midline", "Deviated"];
    const voiceOptions = ["Normal", "Hoarse", "Whispery"];

    const departmentName = localStorage.getItem("departmentName") || sessionStorage.getItem("departmentName") || "";
    const initialLoadRef = useRef(false);

    // Fetch waiting list
    const fetchWaitingList = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("page", 0);
        params.append("size", 100);
        if (searchData.mobileNumber) params.append("mobileNumber", searchData.mobileNumber);
        if (searchData.patientName) params.append("patientName", searchData.patientName);
        const res = await getRequest(`${GET_WAITING_LIST}?${params.toString()}`);
        if (res?.status === 200 && res?.response?.content) {
          setWaitingList(res.response.content);
        } else {
          setWaitingList([]);
        }
      } catch (error) {
        console.error("Error fetching waiting list:", error);
        setWaitingList([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch master data functions
    const fetchPinna = async () => {
      try {
        const response = await getRequest(`${ENT_MAS_PINNA}/getAll/1`);
        if (response?.status === 200 && response?.response) {
          setPinnaList(response.response);
        } else {
          setPinnaList([]);
        }
      } catch (error) {
        console.error("Pinna fetch error:", error);
        setPinnaList([]);
      }
    };

    const fetchEarCanal = async () => {
      try {
        const response = await getRequest(`${MAS_EAR_CANAL}/getAll/1`);
        if (response?.status === 200 && response?.response) {
          setEarCanalList(response.response || []);
        } else if (Array.isArray(response)) {
          setEarCanalList(response);
        } else {
          setEarCanalList([]);
        }
      } catch (error) {
        console.error("Ear Canal API Error:", error);
        setEarCanalList([]);
      }
    };

    const fetchTmStatus = async () => {
      try {
        const response = await getRequest(`${ENT_MAS_TM_STATUS}/getAll/1`);
        if (response?.status === 200) {
          setTmStatusList(response.response || []);
        } else {
          setTmStatusList([]);
        }
      } catch (error) {
        console.error("TM Status API Error:", error);
        setTmStatusList([]);
      }
    };

    const fetchRinne = async () => {
      try {
        const response = await getRequest(`${MAS_ENT_RINNE}/getAll/1`);
        if (response?.status === 200) {
          setRinneList(response.response || []);
        } else {
          setRinneList([]);
        }
      } catch (error) {
        console.error("Rinne Test API Error:", error);
        setRinneList([]);
      }
    };

    const fetchWeber = async () => {
      try {
        const response = await getRequest(`${MAS_ENT_WEBER}/getAll/1`);
        if (response?.status === 200) {
          setWeberList(response.response || []);
        } else {
          setWeberList([]);
        }
      } catch (error) {
        console.error("Weber Test API Error:", error);
        setWeberList([]);
      }
    };

    const fetchMucosa = async () => {
      try {
        const response = await getRequest(`${MAS_ENT_MUCOSA}/getAll/1`);
        if (response?.status === 200) {
          setMucosaList(response.response || []);
        } else {
          setMucosaList([]);
        }
      } catch (error) {
        console.error("Mucosa API Error:", error);
        setMucosaList([]);
      }
    };

    const fetchSeptum = async () => {
      try {
        const response = await getRequest(`${MAS_ENT_SEPTUM}/getAll/1`);
        if (response?.status === 200) {
          setSeptumList(response.response || []);
        } else {
          setSeptumList([]);
        }
      } catch (error) {
        console.error("Septum API Error:", error);
        setSeptumList([]);
      }
    };

    const fetchTonsilGrades = async () => {
      try {
        const response = await getRequest(`${MAS_TONSIL_GRADE}/getAll/1`);
        if (response?.status === 200) {
          setTonsilGradeList(response.response || []);
        } else {
          setTonsilGradeList([]);
        }
      } catch (error) {
        console.error("Tonsil Grades API Error:", error);
        setTonsilGradeList([]);
      }
    };

    // Load all master data on mount
    useEffect(() => {
      fetchWaitingList();
      fetchPinna();
      fetchEarCanal();
      fetchTmStatus();
      fetchRinne();
      fetchWeber();
      fetchMucosa();
      fetchSeptum();
      fetchTonsilGrades();
    }, []);

    // Auto-load examination data if patientId and visitId are provided
    useEffect(() => {
      const fetchExaminationData = async () => {
        if (patientId && visitId) {
          if (initialLoadRef.current && selectedPatient?.visitId === visitId) {
            return;
          }

          setSelectedPatient({ patientId, visitId });
          setShowForm(true);
          setFormLoading(true);

          try {
            const res = await getRequest(`${GET_ENT_DETAILS_BY_VISIT}?visitId=${visitId}`);
            if (res?.status === 200 && res?.response) {
              const mappedData = mapApiResponseToForm(res.response);
              setForm(mappedData);
            } else {
              setForm(defaultEntForm);
            }
            initialLoadRef.current = true;
          } catch (error) {
            console.error("Error fetching ENT details by visit:", error);
            setForm(defaultEntForm);
          } finally {
            setFormLoading(false);
          }
        }
      };

      fetchExaminationData();
    }, [patientId, visitId]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getData: () => {
        const currentOpdDate = opdDate || new Date().toISOString().split("T")[0];
        return {
          patientId: selectedPatient?.patientId || patientId || null,
          visitId: selectedPatient?.visitId || visitId || null,
          opdDate: currentOpdDate,
          ...form,
        };
      },
      isValid: () => {
        const requiredFields = [
          "rightPinna", "leftPinna", "rightEarCanal", "leftEarCanal",
          "rightTmStatus", "leftTmStatus", "rinneTest", "weberTest"
        ];
        return requiredFields.every((field) => form[field]);
      },
      resetForm: () => {
        setForm(defaultEntForm);
      },
    }));

    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Search handlers
    const handleSearchChange = (e) => {
      const { id, value } = e.target;
      setSearchData((prev) => ({ ...prev, [id]: value }));
      setCurrentPage(1);
    };

    const handleSearch = () => {
      setCurrentPage(1);
      fetchWaitingList();
    };

    const handleReset = () => {
      setSearchData({ mobileNumber: "", patientName: "" });
      setCurrentPage(1);
      fetchWaitingList();
    };

    const closeForm = () => {
      setShowForm(false);
      setSelectedPatient(null);
      setForm(defaultEntForm);
    };

    const handleRowClick = async (patient) => {
      if (selectedPatient && selectedPatient.visitId === patient.visitId) {
        closeForm();
        return;
      }

      setSelectedPatient(patient);
      setShowForm(true);
      setForm(defaultEntForm);
      setFormLoading(true);

      try {
        const res = await getRequest(`${GET_ENT_DETAILS_BY_VISIT}?visitId=${patient.visitId}`);
        if (res?.status === 200 && res?.response) {
          const mappedData = mapApiResponseToForm(res.response);
          setForm(mappedData);
        } else {
          setForm(defaultEntForm);
        }
      } catch (error) {
        console.error("Error fetching ENT details by visit:", error);
        setForm(defaultEntForm);
      } finally {
        setFormLoading(false);
      }
    };

    const showPopup = (message, type = "info") => {
      setPopupMessage({
        message,
        type,
        onClose: () => setPopupMessage(null),
      });
    };

    const validateForm = () => {
      const missingFields = [];

      if (!form.rightPinna) missingFields.push("Right Pinna");
      if (!form.leftPinna) missingFields.push("Left Pinna");
      if (!form.rightEarCanal) missingFields.push("Right Ear Canal");
      if (!form.leftEarCanal) missingFields.push("Left Ear Canal");
      if (!form.rightTmStatus) missingFields.push("Right TM Status");
      if (!form.leftTmStatus) missingFields.push("Left TM Status");
      if (!form.rinneTest) missingFields.push("Rinne Test");
      if (!form.weberTest) missingFields.push("Weber Test");

      if (missingFields.length > 0) {
        showPopup(`Please fill the following fields:\n${missingFields.join(", ")}`, "warning");
        return false;
      }
      return true;
    };

    const handleSave = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      if (!selectedPatient && !patientId) {
        showPopup("No patient selected", "error");
        return;
      }
      if (!validateForm()) return;

      setIsSubmitting(true);

      try {
        const currentOpdDate = opdDate || new Date().toISOString().split("T")[0];
        const payload = {
          patientId: selectedPatient?.patientId || patientId,
          visitId: selectedPatient?.visitId || visitId,
          opdDate: currentOpdDate,
          rightPinna: form.rightPinna,
          leftPinna: form.leftPinna,
          rightEarCanal: form.rightEarCanal,
          leftEarCanal: form.leftEarCanal,
          rightTmStatus: form.rightTmStatus,
          leftTmStatus: form.leftTmStatus,
          rinneTest: form.rinneTest,
          weberTest: form.weberTest,
          abcTest: form.abcTest,
          audiometryFindings: form.audiometryFindings,
          externalNose: form.externalNose,
          nasalMucosa: form.nasalMucosa,
          septum: form.septum,
          turbinates: form.turbinates,
          nasalPolyp: form.nasalPolyp,
          nasalDischarge: form.nasalDischarge,
          maxillaryTenderness: form.maxillaryTenderness,
          frontalTenderness: form.frontalTenderness,
          oralCavity: form.oralCavity,
          tonsilGrade: form.tonsilGrade,
          tonsilCongestion: form.tonsilCongestion,
          tonsilFollicles: form.tonsilFollicles,
          tonsilMembrane: form.tonsilMembrane,
          peritonsillarAbscess: form.peritonsillarAbscess,
          pharynx: form.pharynx,
          uvula: form.uvula,
          voiceQuality: form.voiceQuality,
          thyroidEnlargement: form.thyroidEnlargement,
          cervicalNodes: form.cervicalNodes,
          neckMass: form.neckMass,
          neckOtherFindings: form.neckOtherFindings,
        };

        const response = await postRequest(`${SAVE_ENT_DETAILS}/${selectedPatient?.visitId}`, payload);

        if (response?.status === 200 || response?.success) {
          showPopup("ENT examination saved successfully!", "success");
          if (!patientId && !visitId) {
            closeForm();
            fetchWaitingList();
          }
        } else {
          showPopup(response?.message || "Failed to save ENT examination", "error");
        }
      } catch (error) {
        console.error("Error saving ENT examination:", error);
        showPopup(error?.response?.data?.message || "An error occurred while saving", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const filteredPatients = waitingList.filter((item) => {
      const mobileMatch = searchData.mobileNumber === "" || (item.mobileNo && item.mobileNo.includes(searchData.mobileNumber));
      const nameMatch = searchData.patientName === "" || (item.patientName && item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase()));
      return mobileMatch && nameMatch;
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredPatients.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {!hideHeader && (
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">
                    {departmentName ? `${departmentName} - ENT Examination` : "OPD ENT Examination"}
                  </h4>
                  {showForm && (
                    <button type="button" className="btn btn-secondary me-2" onClick={closeForm}>
                      Back
                    </button>
                  )}
                </div>
              )}
              <div className="card-body p-2 pb-0">
                {loading && <LoadingScreen />}
                {popupMessage && (
                  <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                  />
                )}

                {/* WAITING LIST */}
                {!patientId && !visitId && !showForm && (
                  <>
                    <div className="mb-4">
                      <div className="row g-4 align-items-end">
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Patient Mobile No.</label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNumber"
                            placeholder="Enter mobile number"
                            value={searchData.mobileNumber}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Patient Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            placeholder="Enter patient name"
                            value={searchData.patientName}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-primary flex-fill" onClick={handleSearch}>
                              Search
                            </button>
                            <button type="button" className="btn btn-secondary flex-fill" onClick={handleReset}>
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive packagelist mb-3">
                      <table className="table table-bordered table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Patient Name</th>
                            <th>Mobile No</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Relation</th>
                            <th>Department</th>
                            <th>Visit Type</th>
                            <th>Token No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                              <tr
                                key={item.visitId}
                                onClick={() => handleRowClick(item)}
                                className={selectedPatient?.visitId === item.visitId ? "table-primary" : ""}
                                style={{ cursor: "pointer" }}
                              >
                                <td>{item.patientName}</td>
                                <td>{item.mobileNo}</td>
                                <td>{item.age}</td>
                                <td>{item.gender}</td>
                                <td>{item.relation}</td>
                                <td>{item.departmentName}</td>
                                <td>{item.visitType}</td>
                                <td>{item.tokenNo}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="text-center text-muted">No records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <nav>
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                          </li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}

                {/* EXAMINATION FORM */}
                {showForm && selectedPatient && (
                  <div className="row mb-3 mt-3">
                    <div className="col-sm-12">
                      <div className="card-body p-2 pb-0">
                        {formLoading ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading examination data...</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSave}>
                            {/* Patient Info Banner */}
                            {!patientId && !visitId && (
                              <div className="alert alert-info mb-4">
                                <strong>Patient:</strong> {selectedPatient.patientName} |&nbsp;
                                <strong>Mobile:</strong> {selectedPatient.mobileNo} |&nbsp;
                                <strong>Age:</strong> {selectedPatient.age} |&nbsp;
                                <strong>Token:</strong> {selectedPatient.tokenNo}
                              </div>
                            )}

                            {/* ==================== EAR EXAMINATION ==================== */}
                            <h6 className="fw-bold bg-light text-primary border-bottom pb-1">EAR</h6>
                            
                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Pinna <span className="text-danger">*</span></label>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Right</label>
                                <select className="form-select" name="rightPinna" value={form.rightPinna} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {pinnaList.map((opt) => (
                                    <option key={opt.id || opt.pinnaId} value={opt.pinnaStatus || opt}>
                                      {opt.pinnaStatus || opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Left</label>
                                <select className="form-select" name="leftPinna" value={form.leftPinna} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {pinnaList.map((opt) => (
                                    <option key={opt.id || opt.pinnaId} value={opt.pinnaStatus || opt}>
                                      {opt.pinnaStatus || opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Ear Canal <span className="text-danger">*</span></label>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Right</label>
                                <select className="form-select" name="rightEarCanal" value={form.rightEarCanal} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {earCanalList.map((opt) => (
                                    <option key={opt.id} value={opt.earCanalCondition}>{opt.earCanalCondition}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Left</label>
                                <select className="form-select" name="leftEarCanal" value={form.leftEarCanal} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {earCanalList.map((opt) => (
                                    <option key={opt.id} value={opt.earCanalCondition}>{opt.earCanalCondition}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Tympanic Membrane (TM) Status <span className="text-danger">*</span></label>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Right</label>
                                <select className="form-select" name="rightTmStatus" value={form.rightTmStatus} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {tmStatusList.map((opt) => (
                                    <option key={opt.id} value={opt.tmStatus || opt.status}>{opt.tmStatus || opt.status}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-5">
                                <label className="form-label text-muted small">Left</label>
                                <select className="form-select" name="leftTmStatus" value={form.leftTmStatus} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {tmStatusList.map((opt) => (
                                    <option key={opt.id} value={opt.tmStatus || opt.status}>{opt.tmStatus || opt.status}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* ==================== HEARING TESTS ==================== */}
                            <h6 className="fw-bold bg-light text-primary border-bottom pb-1 mt-3">HEARING TESTS</h6>
                            
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Rinne Test <span className="text-danger">*</span></label>
                                <select className="form-select" name="rinneTest" value={form.rinneTest} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {rinneList.map((opt) => (
                                    <option key={opt.id} value={opt.rinneResult || opt.name}>{opt.rinneResult || opt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">Weber Test <span className="text-danger">*</span></label>
                                <select className="form-select" name="weberTest" value={form.weberTest} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {weberList.map((opt) => (
                                    <option key={opt.id} value={opt.weberResult || opt.name}>{opt.weberResult || opt.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">ABC Test</label>
                                <input type="text" className="form-control" name="abcTest" value={form.abcTest} onChange={handleChange} placeholder="Enter ABC test findings" />
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Audiometry Findings</label>
                                <textarea className="form-control" rows={2} name="audiometryFindings" value={form.audiometryFindings} onChange={handleChange} placeholder="Enter audiometry findings"></textarea>
                              </div>
                            </div>

                            {/* ==================== NOSE & SINUSES (PNS) ==================== */}
                            <h6 className="fw-bold bg-light text-primary border-bottom pb-1 mt-3">NOSE & SINUSES (PNS)</h6>
                            
                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">External Nose</label>
                                <input type="text" className="form-control" name="externalNose" value={form.externalNose} onChange={handleChange} placeholder="Enter external nose findings" />
                              </div>
                            </div>

                            <h6 className="fw-bold border-bottom pb-1 mt-2">Nasal Cavity Examination</h6>

                            <div className="row mb-3 mt-2">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Mucosa</label>
                                <select className="form-select" name="nasalMucosa" value={form.nasalMucosa} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {mucosaList.map((opt) => (
                                    <option key={opt.id} value={opt.mucosaStatus || opt.name}>{opt.mucosaStatus || opt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Septum</label>
                                <select className="form-select" name="septum" value={form.septum} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {septumList.map((opt) => (
                                    <option key={opt.id} value={opt.septumStatus || opt.name}>{opt.septumStatus || opt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Turbinates</label>
                                <input type="text" className="form-control" name="turbinates" value={form.turbinates} onChange={handleChange} placeholder="Enter turbinates findings" />
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Nasal Polyp</label>
                                <select className="form-select" name="nasalPolyp" value={form.nasalPolyp} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Discharge</label>
                                <select className="form-select" name="nasalDischarge" value={form.nasalDischarge} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {dischargeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                            </div>

                            <h6 className="fw-bold border-bottom pb-1 mt-2">Sinus Tenderness</h6>

                            <div className="row mb-3 mt-2">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Maxillary</label>
                                <select className="form-select" name="maxillaryTenderness" value={form.maxillaryTenderness} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {tenderOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Frontal</label>
                                <select className="form-select" name="frontalTenderness" value={form.frontalTenderness} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {tenderOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                            </div>

                            {/* ==================== THROAT / OROPHARYNX ==================== */}
                            <h6 className="fw-bold bg-light text-primary border-bottom pb-1 mt-3">THROAT / OROPHARYNX</h6>
                            
                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Oral Cavity</label>
                                <input type="text" className="form-control" name="oralCavity" value={form.oralCavity} onChange={handleChange} placeholder="Enter oral cavity findings" />
                              </div>
                            </div>

                            <h6 className="fw-bold border-bottom pb-1 mt-2">Tonsils</h6>

                            <div className="row mb-3 mt-2">
                              <div className="col-md-2">
                                <label className="form-label fw-bold">Tonsil Size (Grade)</label>
                                <select className="form-select" name="tonsilGrade" value={form.tonsilGrade} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {tonsilGradeList.map((opt) => (
                                    <option key={opt.id} value={opt.tonsilGrade}>{opt.tonsilGrade}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">Congestion</label>
                                <select className="form-select" name="tonsilCongestion" value={form.tonsilCongestion} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">Follicles</label>
                                <select className="form-select" name="tonsilFollicles" value={form.tonsilFollicles} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Membrane</label>
                                <select className="form-select" name="tonsilMembrane" value={form.tonsilMembrane} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Peritonsillar Abscess</label>
                                <select className="form-select" name="peritonsillarAbscess" value={form.peritonsillarAbscess} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Pharynx</label>
                                <input type="text" className="form-control" name="pharynx" value={form.pharynx} onChange={handleChange} placeholder="Enter pharynx findings" />
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Uvula</label>
                                <select className="form-select" name="uvula" value={form.uvula} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {uvulaOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Voice Assessment</label>
                                <select className="form-select" name="voiceQuality" value={form.voiceQuality} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {voiceOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                            </div>

                            {/* ==================== NECK EXAMINATION ==================== */}
                            <h6 className="fw-bold bg-light text-primary border-bottom pb-1 mt-3">NECK EXAMINATION</h6>
                            
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Thyroid Enlargement</label>
                                <select className="form-select" name="thyroidEnlargement" value={form.thyroidEnlargement} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">Neck Mass</label>
                                <select className="form-select" name="neckMass" value={form.neckMass} onChange={handleChange}>
                                  <option value="">Select</option>
                                  {yesNoOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Cervical Nodes</label>
                                <input type="text" className="form-control" name="cervicalNodes" value={form.cervicalNodes} onChange={handleChange} placeholder="Enter cervical nodes findings" />
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-12">
                                <label className="form-label fw-bold">Other Findings</label>
                                <textarea className="form-control" rows={2} name="neckOtherFindings" value={form.neckOtherFindings} onChange={handleChange} placeholder="Enter other neck findings"></textarea>
                              </div>
                            </div>

                            {/* Save Button */}
                            {!hideButtons && (
                              <div className="d-flex justify-content-end mt-3">
                                <button type="button" className="btn btn-secondary me-2" onClick={closeForm}>
                                  Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                  {isSubmitting ? "Saving..." : "Save ENT Examination"}
                                </button>
                              </div>
                            )}
                          </form>
                        )}
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
  }
);

export default EarExamination;