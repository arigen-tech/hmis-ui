
import { useState, useEffect } from "react";
import { getRequest } from "../../../service/apiService";
import { ENT_MAS_PINNA ,ENT_MAS_EAR_CANAL,ENT_MAS_TM_STATUS,MAS_ENT_RINNE,MAS_ENT_WEBER, MAS_EAR_CANAL } from "../../../config/apiConfig";
import Popup from "../../../Components/popup";

const EarExamination = ({ patientId, visitId, hideHeader = false, hideButtons = false }) => {
 const [form, setForm] = useState({
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
  mucosa: "",
  septum: "",
  turbinates: "",
  nasalPolyp: "",
  discharge: "",
  maxillaryTenderness: "",
  frontalTenderness: "",

  // ===== THROAT / OROPHARYNX =====
  oralCavity: "",
  tonsilSize: "",
  tonsilCongestion: "",
  tonsilFollicles: "",
  tonsilMembrane: "",
  peritonsillarAbscess: "",
  pharynx: "",
  uvula: "",
  voiceAssessment: "",

  // ===== NECK EXAMINATION =====
  thyroidEnlargement: "",
  cervicalNodes: "",
  neckMass: "",
  otherNeckFindings: "",
});

  const [popupMessage, setPopupMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinnaList, setPinnaList] = useState([]);
  const [earCanalList, setEarCanalList] = useState([]);
  const [tmStatusList, setTmStatusList] = useState([]);
  const [rinneList, setRinneList] = useState([]);
  const [weberList, setWeberList] = useState([]);
  // Static options
  const pinnaOptions = ["Normal", "Swelling", "Tender", "Deformity"];
  const earCanalOptions = ["Normal", "Wax", "Discharge", "Fungal Infection", "Foreign Body"];
  const tmStatusOptions = ["Normal", "Dull", "Retracted", "Bulging", "Perforated"];
  const rinneOptions = ["Positive", "Negative"];
  const weberOptions = ["Central", "Lateralised Right", "Lateralised Left"];
  
  // Nose & Sinuses Options
  const mucosaOptions = ["Normal", "Congested", "Pale"];
  const septumOptions = ["Normal", "DNS Left", "DNS Right", "Septal Spur"];
  const yesNoOptions = ["Yes", "No"];
  const dischargeOptions = ["Mucoid", "Purulent", "Bloody"];
  const tenderOptions = ["Tender", "Non-Tender"];
  
  // Throat Options
  const tonsilGradeOptions = ["Grade 0", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];
  const uvulaOptions = ["Midline", "Deviated"];
  const voiceOptions = ["Normal", "Hoarse", "Whispery"];

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  useEffect(() => {
  fetchPinna();
  fetchEarCanal();
  fetchTmStatus();
  fetchRinne();
  fetchWeber();
}, []);

const fetchWeber = async () => {
  try {
    const response = await getRequest(MAS_ENT_WEBER);
    // Handle different response structures
    if (response?.status === 200) {
      setWeberList(response.response || []);
    } else if (Array.isArray(response)) {
      setWeberList(response);
    } else if (response?.data) {
      setWeberList(response.data);
    } else {
      setWeberList([]);
    }
  } catch (error) {
    console.error("Weber Test API Error:", error);
    setWeberList([]);
  }
};

const fetchRinne = async () => {
  try {
    const response = await getRequest(MAS_ENT_RINNE);
    // Handle different response structures
    if (response?.status === 200) {
      setRinneList(response.response || []);
    } else if (Array.isArray(response)) {
      setRinneList(response);
    } else if (response?.data) {
      setRinneList(response.data);
    } else {
      setRinneList([]);
    }
  } catch (error) {
    console.error("Rinne Test API Error:", error);
    setRinneList([]);
  }
};

const fetchTmStatus = async () => {
  try {
    const response = await getRequest(ENT_MAS_TM_STATUS);
    // Handle different response structures
    if (response?.status === 200) {
      setTmStatusList(response.response || []);
    } else if (Array.isArray(response)) {
      setTmStatusList(response);
    } else if (response?.data) {
      setTmStatusList(response.data);
    } else {
      setTmStatusList([]);
    }
} catch (error) {
    console.error("TM Status API Error:", error);
    setTmStatusList([]);
  }
};

const fetchEarCanal = async () => {
  try {
    const response = await getRequest(`${MAS_EAR_CANAL}/getAll/1`);
    // Handle different response structures
    if (response?.status === 200 && response?.response) {
      setEarCanalList(response.response || []);
    } else if (Array.isArray(response)) {
      setEarCanalList(response);
    } else if (response?.data) {
      setEarCanalList(response.data);
    } else {
      setEarCanalList([]);
    }
} catch (error) {
    console.error("Ear Canal API Error:", error);
    setEarCanalList([]);
  }};


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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const missingFields = [];
    
    // Ear required fields
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

  const handleSave = (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    console.log("ENT Examination Data:", form);
    
    showPopup("ENT examination saved successfully!", "success");
    
    setIsSubmitting(false);
  };

  return (
 <div className="content-wrapper">
    <div className="row">
      <div className="col-12 grid-margin stretch-card">
        <div className="card form-card">
    <div className="ent-examination-container">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      
      <form onSubmit={handleSave}>
                

        {/* ==================== EAR EXAMINATION ==================== */}
       
  {!hideHeader && (
 <div className="card-header d-flex justify-content-between align-items-center border-bottom bg-white">
              <h4 className="card-title p-2 mb-0">ENT</h4>
            </div>
        
)}
<div className="card-body px-4 py-3">  
          <h6 className="fw-bold bg-light text-primary border-bottom pb-1">EAR</h6>
  
    {/* Pinna */}
    {/* <div className="row mb-3">
      <div className="col-md-12">
        <label className="form-label fw-bold">Pinna <span className="text-danger">*</span></label>
      </div>
      <div className="col-md-5 ">
        <label className="form-label text-muted small">Right</label>
        <select
          className="form-select"
          name="rightPinna"
          value={form.rightPinna}
          onChange={handleChange}
        >
          <option value="">Select</option>
          {pinnaOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="col-md-5">
        <label className="form-label text-muted small">Left</label>
        <select
          className="form-select"
          name="leftPinna"
          value={form.leftPinna}
          onChange={handleChange}
        >
          <option value="">Select</option>
          {pinnaOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div> */}
<div className="row mb-3">
  <div className="col-md-12">
    <label className="form-label fw-bold">Pinna <span className="text-danger">*</span></label>
  </div>
  <div className="col-md-5">
    <label className="form-label text-muted small">Right</label>
    <select
      className="form-select"
      name="rightPinna"
      value={form.rightPinna}
      onChange={handleChange}
    >
      <option value="">Select</option>
      {pinnaList.map(opt => (
        <option key={opt.id || opt.pinnaId || opt} value={opt.pinnaStatus || opt}>
          {opt.pinnaStatus || opt}
        </option>
      ))}
    </select>
  </div>
  <div className="col-md-5">
    <label className="form-label text-muted small">Left</label>
    <select
      className="form-select"
      name="leftPinna"
      value={form.leftPinna}
      onChange={handleChange}
    >
      <option value="">Select</option>
      {pinnaList.map(opt => (
        <option key={opt.id || opt.pinnaId || opt} value={opt.pinnaStatus || opt}>
          {opt.pinnaStatus || opt}
        </option>
      ))}
    </select>
  </div>
</div>
    {/* Ear Canal */}
   
<div className="row mb-3">
  <div className="col-md-12">
    <label className="form-label fw-bold">Ear Canal <span className="text-danger">*</span></label>
  </div>
  <div className="col-md-5">
    <label className="form-label text-muted small">Right</label>
    <select className="form-select" name="rightEarCanal" value={form.rightEarCanal} onChange={handleChange}>
      <option value="">Select</option>
      {earCanalList.map((opt) => (
        <option key={opt.id} value={opt.earCanalCondition}>
          {opt.earCanalCondition}
        </option>
      ))}
    </select>
  </div>
  <div className="col-md-5">
    <label className="form-label text-muted small">Left</label>
    <select className="form-select" name="leftEarCanal" value={form.leftEarCanal} onChange={handleChange}>
      <option value="">Select</option>
      {earCanalList.map((opt) => (
        <option key={opt.id} value={opt.earCanalCondition}>
          {opt.earCanalCondition}
        </option>
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
        <option key={opt.id} value={opt.tmStatusName || opt.status}>
          {opt.tmStatusName || opt.status}
        </option>
      ))}
    </select>
  </div>
  <div className="col-md-5">
    <label className="form-label text-muted small">Left</label>
    <select className="form-select" name="leftTmStatus" value={form.leftTmStatus} onChange={handleChange}>
      <option value="">Select</option>
      {tmStatusList.map((opt) => (
        <option key={opt.id} value={opt.tmStatusName || opt.status}>
          {opt.tmStatusName || opt.status}
        </option>
      ))}
    </select>
  </div>
</div>
  
</div>

        {/* ==================== HEARING TESTS ==================== */}
        <div className="card-body px-4 py-3 ">            

        <div className="col-12">
        <h6 className="fw-bold bg-light text-primary border-bottom pb-1">HEARING TESTS</h6>
          </div>
            <div className="row mb-3">
             <div className="col-md-3">
  <label className="form-label fw-bold">Rinne Test <span className="text-danger">*</span></label>
  <select className="form-select" name="rinneTest" value={form.rinneTest} onChange={handleChange}>
    <option value="">Select</option>
    {rinneList.map((opt) => (
      <option key={opt.id} value={opt.rinneName || opt.name}>
        {opt.rinneName || opt.name}
      </option>
    ))}
  </select>
</div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Weber Test <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  name="weberTest"
                  value={form.weberTest}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {weberList.map((opt) => (
                    <option key={opt.id} value={opt.weberName || opt.name}>
                      {opt.weberName || opt.name}
                        </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">ABC Test</label>
                <input
                  type="text"
                  className="form-control"
                  name="abcTest"
                  value={form.abcTest}
                  onChange={handleChange}
                  placeholder="Enter ABC test findings"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Audiometry Findings</label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="audiometryFindings"
                  value={form.audiometryFindings}
                  onChange={handleChange}
                  placeholder="Enter audiometry findings"
                ></textarea>
              </div>
            </div>

          </div>


        {/* ==================== NOSE & SINUSES (PNS) ==================== */}
        <div className="card-body px-4 py-3">            

        <div className="col-12">
       <h6 className="fw-bold bg-light text-primary border-bottom pb-1">NOSE & SINUSES (PNS)</h6>
          </div>
          <div className="row mb-3">
            
            {/* External Nose */}
            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">External Nose</label>
                <input
                  type="text"
                  className="form-control"
                  name="externalNose"
                  value={form.externalNose}
                  onChange={handleChange}
                  placeholder="Enter external nose findings"
                />
              </div>
            </div>

            {/* Nasal Cavity Examination */}
            <h6 className="fw-bold border-bottom pb-1 mt-2">Nasal Cavity Examination</h6>
            
            <div className="row mb-3 mt-2">
              <div className="col-md-3">
                <label className="form-label fw-bold">Mucosa</label>
                <select
                  className="form-select"
                  name="mucosa"
                  value={form.mucosa}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {mucosaOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Septum</label>
                <select
                  className="form-select"
                  name="septum"
                  value={form.septum}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {septumOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Turbinates</label>
                <input
                  type="text"
                  className="form-control"
                  name="turbinates"
                  value={form.turbinates}
                  onChange={handleChange}
                  placeholder="Enter turbinates findings"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">Nasal Polyp</label>
                <select
                  className="form-select"
                  name="nasalPolyp"
                  value={form.nasalPolyp}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Discharge</label>
                <select
                  className="form-select"
                  name="discharge"
                  value={form.discharge}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {dischargeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sinus Tenderness */}
            <h6 className="fw-bold border-bottom pb-1 mt-2">Sinus Tenderness</h6>
            
            <div className="row mb-3 mt-2">
              <div className="col-md-3">
                <label className="form-label fw-bold">Maxillary</label>
                <select
                  className="form-select"
                  name="maxillaryTenderness"
                  value={form.maxillaryTenderness}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {tenderOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Frontal</label>
                <select
                  className="form-select"
                  name="frontalTenderness"
                  value={form.frontalTenderness}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {tenderOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

</div>
        {/* ==================== THROAT / OROPHARYNX ==================== */}
        <div className="card-body px-4 py-3">            

        <div className="col-12">
         <h6 className="fw-bold bg-light text-primary border-bottom pb-1">THROAT / OROPHARYNX</h6>
          </div>
          <div className="row mb-3">
            
            {/* Oral Cavity */}
            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Oral Cavity</label>
                <input
                  type="text"
                  className="form-control"
                  name="oralCavity"
                  value={form.oralCavity}
                  onChange={handleChange}
                  placeholder="Enter oral cavity findings"
                />
              </div>
            </div>

            {/* Tonsils */}
            <h6 className="fw-bold border-bottom pb-1 mt-2">Tonsils</h6>
            
            <div className="row mb-3 mt-2">
              <div className="col-md-2">
                <label className="form-label fw-bold">Tonsil Size (Grade)</label>
                <select
                  className="form-select"
                  name="tonsilSize"
                  value={form.tonsilSize}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {tonsilGradeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label fw-bold">Congestion</label>
                <select
                  className="form-select"
                  name="tonsilCongestion"
                  value={form.tonsilCongestion}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label fw-bold">Follicles</label>
                <select
                  className="form-select"
                  name="tonsilFollicles"
                  value={form.tonsilFollicles}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Membrane</label>
                <select
                  className="form-select"
                  name="tonsilMembrane"
                  value={form.tonsilMembrane}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Peritonsillar Abscess</label>
                <select
                  className="form-select"
                  name="peritonsillarAbscess"
                  value={form.peritonsillarAbscess}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pharynx, Uvula, Voice Assessment */}
            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Pharynx</label>
                <input
                  type="text"
                  className="form-control"
                  name="pharynx"
                  value={form.pharynx}
                  onChange={handleChange}
                  placeholder="Enter pharynx findings"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">Uvula</label>
                <select
                  className="form-select"
                  name="uvula"
                  value={form.uvula}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {uvulaOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Voice Assessment</label>
                <select
                  className="form-select"
                  name="voiceAssessment"
                  value={form.voiceAssessment}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {voiceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
      </div>

        {/* ==================== NECK EXAMINATION ==================== */}
        <div className="card-body px-4 py-3">            

        <div className="col-12">
                                <h6 className="fw-bold bg-light text-primary border-bottom pb-1">NECK EXAMINATION</h6>
          </div>
          <div className="row mb-3">
            
            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">Thyroid Enlargement</label>
                <select
                  className="form-select"
                  name="thyroidEnlargement"
                  value={form.thyroidEnlargement}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-bold">Neck Mass</label>
                <select
                  className="form-select"
                  name="neckMass"
                  value={form.neckMass}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  {yesNoOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Cervical Nodes</label>
                <input
                  type="text"
                  className="form-control"
                  name="cervicalNodes"
                  value={form.cervicalNodes}
                  onChange={handleChange}
                  placeholder="Enter cervical nodes findings"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Other Findings</label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="otherNeckFindings"
                  value={form.otherNeckFindings}
                  onChange={handleChange}
                  placeholder="Enter other neck findings"
                ></textarea>
              </div>
            </div>

          </div>
           {/* Save Button */}
       {!hideButtons && (
                  <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save ENT Examination"}
                    </button>
                  </div>
                )}
        </div>
      </form>
    </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default EarExamination;