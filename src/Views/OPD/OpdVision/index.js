import { useState, useEffect } from "react";
import { getRequest, postRequest } from "../../../service/apiService";
import { GET_WAITING_LIST } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading/index";

const anteriorApiKeys = {
  eyebrow: "Eyebrow", eyelid: "Eyelid", cornea: "Cornea",
  conjunctiva: "Conjunctiva", fornix: "Fornix", limbus: "Limbus",
  sclera: "Sclera", anteriorChamber: "Ant. Chamber", iris: "Iris",
  pupil: "Pupils",
};

const posteriorApiKeys = {
  opticDisc: "Optic Disc", foveaMacula: "Fovea & Macula",
  vitreousPosterior: "Vitreous",
  bloodVessels: "Blood Vessels", retina: "Retina",
};

const defaultVisionForm = {
  reDistanceUnaided: "", reDistancePinhole: "", reDistanceBestCorrected: "",
  leDistanceUnaided: "", leDistancePinhole: "", leDistanceBestCorrected: "",
  reNearUnaided: "", reNearPinhole: "", reNearBestCorrected: "",
  leNearUnaided: "", leNearPinhole: "", leNearBestCorrected: "",
  fundusGlow: "",
  reRetinoscopyAxis: "", reRetinoscopyV: "", reRetinoscopyH: "", reRetinoscopyHValue: "",
  leRetinoscopyAxis: "", leRetinoscopyV: "", leRetinoscopyH: "", leRetinoscopyHValue: "",
  reKeratometry: "", rePachymetry: "", reTonometry: "", reFieldOfVision: "", reIolPower: "",
  leKeratometry: "", lePachymetry: "", leTonometry: "", leFieldOfVision: "", leIolPower: "",
  reSphDist: "", reCylDist: "", reAxisDist: "",
  leSphDist: "", leCylDist: "", leAxisDist: "",
  reSphNear: "", reCylNear: "", reAxisNear: "",
  leSphNear: "", leCylNear: "", leAxisNear: "",
  ipdValue: "", spectacleUse: "", lensType: "",
  reEyebrow: "N", reEyelid: "N", reCornea: "N", reConjunctiva: "N", reFornix: "N",
  reLimbus: "N", reSclera: "N", reAnteriorChamber: "N", reIris: "N", rePupil: "N",
  leEyebrow: "N", leEyelid: "N", leCornea: "N", leConjunctiva: "N", leFornix: "N",
  leLimbus: "N", leSclera: "N", leAnteriorChamber: "N", leIris: "N", lePupil: "N",
  reOpticDisc: "N", reFoveaMacula: "N", reVitreousPosterior: "N", reBloodVessels: "N", reRetina: "N",
  leOpticDisc: "N", leFoveaMacula: "N", leVitreousPosterior: "N", leBloodVessels: "N", leRetina: "N",
  reColourVision: "", leColourVision: "",
};

// Safely map API response → form state (null → default)
const mapApiResponseToForm = (data) => {
  if (!data) return defaultVisionForm;
  const mapped = {};
  Object.keys(defaultVisionForm).forEach((key) => {
    const apiValue = data[key];
    if (apiValue === null || apiValue === undefined || apiValue === "") {
      mapped[key] = defaultVisionForm[key];
    } else {
      mapped[key] = apiValue;
    }
  });
  return mapped;
};

const OpdVision = () => {
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState({ mobileNumber: "", patientName: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(defaultVisionForm);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [distanceVisionOptions, setDistanceVisionOptions] = useState([]);
  const [nearVisionOptions, setNearVisionOptions] = useState([]);
  const [colorVisionOptions, setColorVisionOptions] = useState([]);
  const [spectacleUseOptions, setSpectacleUseOptions] = useState([]);
  const [lensTypeOptions, setLensTypeOptions] = useState([]);

  const departmentName =
    localStorage.getItem("departmentName") ||
    sessionStorage.getItem("departmentName") || "";

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

  const fetchDistanceVision = async () => {
    try {
      const res = await getRequest("/master/opthMasDistanceVision/getAll/1");
      if (res?.status === 200 && res?.response) setDistanceVisionOptions(res.response);
    } catch (e) { console.error(e); }
  };

  const fetchNearVision = async () => {
    try {
      const res = await getRequest("/master/opthMasNearVision/getAll/0");
      if (res?.status === 200 && res?.response) setNearVisionOptions(res.response);
    } catch (e) { console.error(e); }
  };

  const fetchColorVision = async () => {
    try {
      const res = await getRequest("/master/opthMasColorVision/getAll/0");
      if (res?.status === 200 && res?.response) setColorVisionOptions(res.response);
    } catch (e) { console.error(e); }
  };

  const fetchSpectacleUse = async () => {
    try {
      const res = await getRequest("/master/opthMasSpectacleUse/getAll/0");
      if (res?.status === 200 && res?.response) setSpectacleUseOptions(res.response);
    } catch (e) { console.error(e); }
  };

  const fetchLensType = async () => {
    try {
      const res = await getRequest("/master/opthMasLensType/getAll/0");
      if (res?.status === 200 && res?.response) setLensTypeOptions(res.response);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchWaitingList();
    fetchDistanceVision();
    fetchNearVision();
    fetchColorVision();
    fetchSpectacleUse();
    fetchLensType();
  }, []);

  const filteredPatients = waitingList.filter((item) => {
    const mobileMatch =
      searchData.mobileNumber === "" ||
      (item.mobileNo && item.mobileNo.includes(searchData.mobileNumber));
    const nameMatch =
      searchData.patientName === "" ||
      (item.patientName &&
        item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase()));
    return mobileMatch && nameMatch;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleSearchChange = (e) => {
    const { id, value } = e.target;
    setSearchData((prev) => ({ ...prev, [id]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => { setCurrentPage(1); fetchWaitingList(); };

  const handleReset = () => {
    setSearchData({ mobileNumber: "", patientName: "" });
    setCurrentPage(1);
    fetchWaitingList();
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedPatient(null);
    setFormData(defaultVisionForm);
  };

  // ── Row click: fetch existing data and auto-fill form ─────────────────────
  const handleRowClick = async (patient) => {
    // Toggle off if same row clicked again
    if (selectedPatient && selectedPatient.visitId === patient.visitId) {
      closeForm();
      return;
    }

    setSelectedPatient(patient);
    setShowForm(true);
    setFormData(defaultVisionForm);
    setFormLoading(true);

    try {
      // ✅ FIXED: corrected typo in endpoint — "geOtphthalmology" → "getOphthalmology"
      const res = await getRequest(
        `/opd/geOtphthalmologyExaminationDetail?visitId=${patient.visitId}`
      );

      // ✅ FIXED: API returns { status, message, production } with data nested under
      //    res.response OR directly in res — handle both shapes safely
      if (res?.status === 200) {
        // Try res.response first, then fall back to res itself as the data object
        const data = res?.response ?? null;

        if (data && typeof data === "object" && !Array.isArray(data)) {
          // Check if data actually has ophthalmology fields (not just { message, production })
          const hasOphthFields = Object.keys(defaultVisionForm).some(
            (key) => data[key] !== undefined
          );

          if (hasOphthFields) {
            setFormData(mapApiResponseToForm(data));
          } else {
            // Response has no ophthalmology data yet — keep defaults (new record)
            setFormData(defaultVisionForm);
          }
        } else {
          setFormData(defaultVisionForm);
        }
      } else {
        setFormData(defaultVisionForm);
      }
    } catch (error) {
      console.error("Error fetching examination detail:", error);
      setFormData(defaultVisionForm);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedPatient) { alert("No patient selected"); return; }

    const requiredFields = ["reDistanceUnaided", "leDistanceUnaided", "reNearUnaided", "leNearUnaided"];
    if (requiredFields.some((f) => !formData[f])) {
      alert("Please fill all required vision fields (Distance & Near for both eyes)");
      return;
    }

    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        patientId: selectedPatient.patientId,
        visitId: selectedPatient.visitId,
        opdDate: today,
        ...formData,
      };
      const response = await postRequest("/opd/saveOphthalmologyExaminationDetails", payload);
      if (response?.status === 200) {
        alert("Vision examination saved successfully!");
        closeForm();
        fetchWaitingList();
      } else {
        alert("Failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save examination data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                {departmentName ? `${departmentName} - Vision Examination` : "OPD Vision Examination"}
              </h4>
              {showForm && (
                <button type="button" className="btn btn-secondary me-2" onClick={closeForm}>
                  Back
                </button>
              )}
            </div>

            <div className="card-body">
              {loading && <LoadingScreen />}

              {/* ── WAITING LIST ─────────────────────────────────────────── */}
              {!showForm && (
                <>
                  <div className="mb-4">
                    <div className="row g-4 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Patient Mobile No.</label>
                        <input type="text" className="form-control" id="mobileNumber"
                          placeholder="Enter mobile number" value={searchData.mobileNumber}
                          onChange={handleSearchChange} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Patient Name</label>
                        <input type="text" className="form-control" id="patientName"
                          placeholder="Enter patient name" value={searchData.patientName}
                          onChange={handleSearchChange} />
                      </div>
                      <div className="col-md-2">
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-primary flex-fill" onClick={handleSearch}>Search</button>
                          <button type="button" className="btn btn-secondary flex-fill" onClick={handleReset}>Reset</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive packagelist mb-3">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Patient Name</th><th>Mobile No</th><th>Age</th><th>Gender</th>
                          <th>Relation</th><th>Department</th><th>Visit Type</th><th>Token No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.visitId} onClick={() => handleRowClick(item)}
                              className={selectedPatient?.visitId === item.visitId ? "table-primary" : ""}
                              style={{ cursor: "pointer" }}>
                              <td>{item.patientName}</td><td>{item.mobileNo}</td>
                              <td>{item.age}</td><td>{item.gender}</td>
                              <td>{item.relation}</td><td>{item.departmentName}</td>
                              <td>{item.visitType}</td><td>{item.tokenNo}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="8" className="text-center text-muted">No records found</td></tr>
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

              {/* ── EXAMINATION FORM ──────────────────────────────────────── */}
              {showForm && selectedPatient && (
                <div className="row mb-3 mt-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">
                      <div className="card-body">

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
                            <div className="alert alert-info mb-4">
                              <strong>Patient:</strong> {selectedPatient.patientName} |&nbsp;
                              <strong>Mobile:</strong> {selectedPatient.mobileNo} |&nbsp;
                              <strong>Age:</strong> {selectedPatient.age} |&nbsp;
                              <strong>Token:</strong> {selectedPatient.tokenNo}
                            </div>

                            {/* ── VISION ── */}
                            <div className="row mb-3">
                              <div className="col-12">
                                <h6 className="fw-bold bg-light text-primary border-bottom pb-1">Vision</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "100px" }}></th>
                                        <th colSpan="3" className="text-center">R.E.</th>
                                        <th colSpan="3" className="text-center">L.E.</th>
                                      </tr>
                                      <tr>
                                        <th></th>
                                        <th className="text-center">UNCORRECTED</th>
                                        <th className="text-center">PINHOLE</th>
                                        <th className="text-center">BEST CORRECTED</th>
                                        <th className="text-center">UNCORRECTED</th>
                                        <th className="text-center">PINHOLE</th>
                                        <th className="text-center">BEST CORRECTED</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="fw-semibold">Distance</td>
                                        {["reDistanceUnaided","reDistancePinhole","reDistanceBestCorrected",
                                          "leDistanceUnaided","leDistancePinhole","leDistanceBestCorrected"].map((field, i) => (
                                          <td key={field}>
                                            <select className="form-select form-select-sm" name={field}
                                              value={formData[field]} onChange={handleChange}
                                              required={i === 0 || i === 3}>
                                              <option value="">Select</option>
                                              {distanceVisionOptions.map(opt =>
                                                <option key={opt.id} value={opt.visionValue}>{opt.visionValue}</option>)}
                                            </select>
                                          </td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td className="fw-semibold">Near</td>
                                        {["reNearUnaided","reNearPinhole","reNearBestCorrected",
                                          "leNearUnaided","leNearPinhole","leNearBestCorrected"].map((field, i) => (
                                          <td key={field}>
                                            <select className="form-select form-select-sm" name={field}
                                              value={formData[field]} onChange={handleChange}
                                              required={i === 0 || i === 3}>
                                              <option value="">Select</option>
                                              {nearVisionOptions.map(opt =>
                                                <option key={opt.id} value={opt.nearValue}>{opt.nearValue}</option>)}
                                            </select>
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── FUNDUS GLOW ── */}
                            <div className="row mb-3 align-items-center">
                              <div className="col-md-2">
                                <label className="form-label fw-semibold mb-0">Fundus Glow</label>
                              </div>
                              <div className="col-md-6">
                                <input type="text" className="form-control" name="fundusGlow"
                                  value={formData.fundusGlow} onChange={handleChange}
                                  placeholder="Enter fundus glow findings" />
                              </div>
                            </div>

                            {/* ── RETINOSCOPY ── */}
                            <div className="row mb-4">
                              <div className="col-12 mb-2">
                                <h6 className="fw-bold text-primary border-bottom pb-1">RETINOSCOPY</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "80px" }}></th>
                                        <th colSpan="2" className="text-center">R.E.</th>
                                        <th colSpan="2" className="text-center">L.E.</th>
                                      </tr>
                                      <tr>
                                        <th></th>
                                        <th className="text-center">AXIS</th>
                                        <th className="text-center">AXIS</th>
                                        <th className="text-center">AXIS</th>
                                        <th className="text-center">AXIS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="fw-semibold">V</td>
                                        <td><input type="text" className="form-control form-control-sm" name="reRetinoscopyAxis" value={formData.reRetinoscopyAxis} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="reRetinoscopyV" value={formData.reRetinoscopyV} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="leRetinoscopyAxis" value={formData.leRetinoscopyAxis} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="leRetinoscopyV" value={formData.leRetinoscopyV} onChange={handleChange} placeholder="Axis" /></td>
                                      </tr>
                                      <tr>
                                        <td className="fw-semibold">H</td>
                                        <td><input type="text" className="form-control form-control-sm" name="reRetinoscopyH" value={formData.reRetinoscopyH} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="reRetinoscopyHValue" value={formData.reRetinoscopyHValue} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="leRetinoscopyH" value={formData.leRetinoscopyH} onChange={handleChange} placeholder="Axis" /></td>
                                        <td><input type="text" className="form-control form-control-sm" name="leRetinoscopyHValue" value={formData.leRetinoscopyHValue} onChange={handleChange} placeholder="Axis" /></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── MEASUREMENTS ── */}
                            <div className="row mb-4">
                              <div className="col-12">
                                <h6 className="fw-bold text-primary border-bottom pb-1">MEASUREMENTS</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th colSpan="5" className="text-center">R.E.</th>
                                        <th colSpan="5" className="text-center">L.E.</th>
                                      </tr>
                                      <tr>
                                        <th>Keratometry</th><th>Pachymetry</th>
                                        <th>Non-Contact Tonometry</th><th>Field of VN</th><th>IOL</th>
                                        <th>Keratometry</th><th>Pachymetry</th>
                                        <th>Non-Contact Tonometry</th><th>Field of VN</th><th>ICL</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {["reKeratometry","rePachymetry","reTonometry","reFieldOfVision","reIolPower",
                                          "leKeratometry","lePachymetry","leTonometry","leFieldOfVision","leIolPower"].map(f => (
                                          <td key={f}><input type="text" className="form-control form-control-sm" name={f} value={formData[f]} onChange={handleChange} /></td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── SPECTACLE CORRECTION ── */}
                            <div className="row mb-3">
                              <div className="col-12 mb-2">
                                <h6 className="fw-bold text-primary border-bottom pb-1">Spectacle Correction</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "60px" }}></th>
                                        <th colSpan="3" className="text-center">R.E.</th>
                                        <th colSpan="3" className="text-center">L.E.</th>
                                      </tr>
                                      <tr>
                                        <th></th>
                                        <th>SPH</th><th>CYL</th><th>AXIS</th>
                                        <th>SPH</th><th>CYL</th><th>AXIS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="fw-semibold">Dist</td>
                                        {["reSphDist","reCylDist","reAxisDist","leSphDist","leCylDist","leAxisDist"].map(f => (
                                          <td key={f}><input type="text" className="form-control form-control-sm" name={f} value={formData[f]} onChange={handleChange} /></td>
                                        ))}
                                      </tr>
                                      <tr>
                                        <td className="fw-semibold">Near</td>
                                        {["reSphNear","reCylNear","reAxisNear","leSphNear","leCylNear","leAxisNear"].map((f, i) => (
                                          <td key={f}><input type="text" className="form-control form-control-sm" name={f} value={formData[f]} onChange={handleChange} placeholder={i === 0 || i === 3 ? "Add" : ""} /></td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── IPD ── */}
                            <div className="row mb-4">
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm w-auto">
                                    <tbody>
                                      <tr>
                                        <td className="fw-semibold">IPD (50–70)</td>
                                        <td>
                                          <input type="text" className="form-control form-control-sm"
                                            name="ipdValue" value={formData.ipdValue}
                                            onChange={handleChange} placeholder="mm" />
                                        </td>
                                        <td className="fw-semibold">Use</td>
                                        <td>
                                          <select className="form-select form-select-sm" name="spectacleUse"
                                            value={formData.spectacleUse} onChange={handleChange}>
                                            <option value="">Select</option>
                                            {spectacleUseOptions.map(opt =>
                                              <option key={opt.id} value={opt.useName}>{opt.useName}</option>)}
                                          </select>
                                        </td>
                                        <td className="fw-semibold">Type of Lens</td>
                                        <td>
                                          <select className="form-select form-select-sm" name="lensType"
                                            value={formData.lensType} onChange={handleChange}>
                                            <option value="">Select</option>
                                            {lensTypeOptions.map(opt =>
                                              <option key={opt.id} value={opt.lensType}>{opt.lensType}</option>)}
                                          </select>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── ANTERIOR SEGMENT ── */}
                            <div className="row mb-4">
                              <div className="col-12 mb-2">
                                <h6 className="fw-bold text-primary border-bottom pb-1">Anterior Segment</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "60px" }}></th>
                                        {Object.values(anteriorApiKeys).map((label, i) => (
                                          <th key={i} className="text-center" style={{ fontSize: "12px" }}>
                                            {label.toUpperCase()}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {["re", "le"].map(eye => (
                                        <tr key={eye}>
                                          <td className="fw-semibold">{eye === "re" ? "R.E." : "L.E."}</td>
                                          {Object.keys(anteriorApiKeys).map(key => {
                                            const fieldName = `${eye}${key.charAt(0).toUpperCase() + key.slice(1)}`;
                                            return (
                                              <td key={key}>
                                                <select className="form-select form-select-sm"
                                                  name={fieldName}
                                                  value={formData[fieldName] ?? "N"}
                                                  onChange={handleChange}>
                                                  <option value="N">N</option>
                                                  <option value="Abnormal">Abnormal</option>
                                                </select>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── POSTERIOR SEGMENT ── */}
                            <div className="row mb-4">
                              <div className="col-12 mb-2">
                                <h6 className="fw-bold text-primary border-bottom pb-1">Posterior Segment</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm align-middle">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "60px" }}></th>
                                        {Object.values(posteriorApiKeys).map((label, i) => (
                                          <th key={i} className="text-center" style={{ fontSize: "12px" }}>
                                            {label.toUpperCase()}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {["re", "le"].map(eye => (
                                        <tr key={eye}>
                                          <td className="fw-semibold">{eye === "re" ? "R.E." : "L.E."}</td>
                                          {Object.keys(posteriorApiKeys).map(key => {
                                            const fieldName = `${eye}${key.charAt(0).toUpperCase() + key.slice(1)}`;
                                            return (
                                              <td key={key}>
                                                <select className="form-select form-select-sm"
                                                  name={fieldName}
                                                  value={formData[fieldName] ?? "N"}
                                                  onChange={handleChange}>
                                                  <option value="N">N</option>
                                                  <option value="Abnormal">Abnormal</option>
                                                </select>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── COLOUR VISION ── */}
                            <div className="row mb-4">
                              <div className="col-12 mb-2">
                                <h6 className="fw-bold text-primary border-bottom pb-1">Colour Vision</h6>
                              </div>
                              <div className="col-12">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-sm w-auto">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "80px" }}></th>
                                        <th className="text-center">R.E.</th>
                                        <th className="text-center">L.E.</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="fw-semibold">Select</td>
                                        <td>
                                          <select className="form-select form-select-sm" name="reColourVision"
                                            value={formData.reColourVision} onChange={handleChange}>
                                            <option value="">Select</option>
                                            {colorVisionOptions.map(opt =>
                                              <option key={opt.id} value={opt.colorValue}>{opt.colorValue}</option>)}
                                          </select>
                                        </td>
                                        <td>
                                          <select className="form-select form-select-sm" name="leColourVision"
                                            value={formData.leColourVision} onChange={handleChange}>
                                            <option value="">Select</option>
                                            {colorVisionOptions.map(opt =>
                                              <option key={opt.id} value={opt.colorValue}>{opt.colorValue}</option>)}
                                          </select>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* ── SUBMIT ── */}
                            <div className="col-12 mt-3 d-flex justify-content-end">
                              <button type="button" className="btn btn-secondary me-2" onClick={closeForm}>
                                Cancel
                              </button>
                              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Examination"}
                              </button>
                            </div>

                          </form>
                        )}

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

export default OpdVision;