import { useState,useEffect } from "react";
import Popup from "../../../Components/popup";
import {getRequest} from "../../../service/apiService";
import { MAS_OB_CONCEPTION,MAS_OB_CONSANGUINITY,OB_BOOKED_STATUS,
  OB_MAS_IMMUNISED_STATUS,MAS_OB_TRIMESTER,MAS_PRESENTATION,MAS_OB_PVMEMBRANE,MAS_OB_PVLIQUOR,
  MAS_CERVIX_CONSISTENCY,MAS_CERVIX_POSITION,MAS_STATION_PRESENTATION,MAS_OP_PELVIS_TYPE,
  MAS_GYN_FLOW,MAS_MENARCHE_AGE,MAS_MENSTRUAl_PATTERN,MAS_STERILISATION,MAS_GYN_POPSMEAR
 } from "../../../config/apiConfig";


const defaultOBGForm = {
  obstetricScore: { g: "", p: "", a: "", l: "" },
  conception: "",
  marriedLife: "",
  consanguinity: "",
  booked: "",
  immunised: "",
  trimesters: "",
  gc: "",
  paA: "",
  peA: "",
  tt: "",
  fhr: "",
  presentation: "",
  palpation: "",
  pv: "",
  inspectionHeight: { select: "", specify: "", remarks: "" },
  menstrual: {
    ageOfMenarche: "",
    cycles: "",
    rangeNoOfDays: "",
    interval: "",
    flow: "",
    menstrualPause: "",
  },
  respiratory: { system: "", breathSounds: "" },
  cardiovascular: { s1: "", s2: "", murmurs: "" },
  pvExam: {
    osDilatation: "",
    effacement: "",
    membrane: "",
    liquor: "",
    consistency: "",
    position: "",
    length: "",
    station: "",
    lastMenstrualPeriod: "",
    menstrualPattern: "",
    cycle: "",
    obstetricHistory: "",
    sterilisation: "",
    perAbdomenInspection: "",
    gynPalpation: "",
    papSmear: "",
    localExamination: "",
    perSpeculum: "",
    bimanualExamination: "",
  },
  head: "",
  pelvis: "",
};

const OBGDetails = ({
  patientId,
  visitId,
  hideHeader = false,
  hideButtons = false,
}) => {
  const [popupMessage, setPopupMessage] = useState(null);
  const [conceptionOptions, setConceptionOptions] = useState([]);
  const [consanguinityOptions, setConsanguinityOptions] = useState([]);
  const [bookedStatusOptions, setBookedStatusOptions] = useState([]);
  const [immunisedStatusOptions, setImmunisedStatusOptions] = useState([]);
  const [trimesterOptions, setTrimesterOptions] = useState([]);
  const [presentationOptions, setPresentationOptions] = useState([]);
  const [pvmembraneOptions, setPvmembraneOptions] = useState([]);
  const [pvliquorOptions, setPvliquorOptions] = useState([]);
  const [consistencyOptions, setConsistencyOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);
  const [stationOptions, setStationOptions] = useState([]);
  const [pelvisTypeOptions, setPelvisTypeOptions] = useState([]);
  const [flowOptions, setFlowOptions] = useState([]);
  const [menarcheAgeOptions, setMenarcheAgeOptions] = useState([]);
  const [menstrualOptions, setMenstrualOptions] = useState([]);
  const [sterilisationOptions, setSterilisationOptions] = useState([]);
  const [papSmearOptions, setPapSmearOptions] = useState([]);

  const [form, setForm] = useState(defaultOBGForm);
  const updateObstetricScore = (field, value) => {
    setForm((prev) => ({
      ...prev,
      obstetricScore: { ...prev.obstetricScore, [field]: value },
    }));
  };

  const fetchPapSmearOptions = async () => {
  try {    const res = await getRequest(`${MAS_GYN_POPSMEAR}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setPapSmearOptions(res.response);
    } else {
      setPapSmearOptions([]);
    }
  } catch (error) {
    console.error("Pap smear options fetch error:", error);
    setPapSmearOptions([]);
  }
};

  const fetchSterilisationOptions = async () => {
  try {    const res = await getRequest(`${MAS_STERILISATION}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setSterilisationOptions(res.response);
    } else {
      setSterilisationOptions([]);
    }
  } catch (error) {
    console.error("Sterilisation options fetch error:", error);
    setSterilisationOptions([]);
  }
};

const fetchMenstrualOptions = async () => {
  try {    const res = await getRequest(`${MAS_MENSTRUAl_PATTERN}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setMenstrualOptions(res.response);
    } else {
      setMenstrualOptions([]);
    }
  } catch (error) {
    console.error("Menstrual options fetch error:", error);
    setMenstrualOptions([]);
  }
};

  const fetchMenarcheAgeOptions = async () => {
  try {    const res = await getRequest(`${MAS_MENARCHE_AGE}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setMenarcheAgeOptions(res.response);
    } else {
      setMenarcheAgeOptions([]);
    }
  } catch (error) {
    console.error("Menarche age options fetch error:", error);
    setMenarcheAgeOptions([]);
  }
};

  const fetchFlowOptions = async () => {
  try {    const res = await getRequest(`${MAS_GYN_FLOW}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setFlowOptions(res.response);
    } else {
      setFlowOptions([]);
    }
  } catch (error) {
    console.error("Flow options fetch error:", error);
    setFlowOptions([]);
  }
};

const fetchPelvisTypeOptions = async () => {
  try {
    const res = await getRequest(`${MAS_OP_PELVIS_TYPE}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setPelvisTypeOptions(res.response);
    } else {
      setPelvisTypeOptions([]);
    }
  } catch (error) {
    console.error("Pelvis type options fetch error:", error);
    setPelvisTypeOptions([]);
  }
};

  const fetchStationOptions = async () => {
    try {
      const res = await getRequest(`${MAS_STATION_PRESENTATION}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setStationOptions(res.response);
      } else {
        setStationOptions([]);
      }
    } catch (error) {
      console.error("Station options fetch error:", error);
      setStationOptions([]);
    }
  };

  const fetchPositionOptions = async () => {
    try {
      const res = await getRequest(`${MAS_CERVIX_POSITION}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setPositionOptions(res.response);
      } else {
        setPositionOptions([]);
      }
    } catch (error) {
      console.error("Position options fetch error:", error);
      setPositionOptions([]);
    }
  };

  const fetchConsistencyOptions = async () => {
    try {
      const res = await getRequest(`${MAS_CERVIX_CONSISTENCY}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setConsistencyOptions(res.response);
      } else {
        setConsistencyOptions([]);
      }
    } catch (error) {
      console.error("Consistency options fetch error:", error);
      setConsistencyOptions([]);
    }
  };


  const fetchPVMembraneOptions = async () => {
  try {
    const res = await getRequest(`${MAS_OB_PVMEMBRANE}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setPvmembraneOptions(res.response);
    } else {
      setPvmembraneOptions([]);
    }
  } catch (error) {
    console.error("PVMembrane options fetch error:", error);
    setPvmembraneOptions([]);
  }
};

const fetchPVliquorOptions = async () => {
  try {
    const res = await getRequest(`${MAS_OB_PVLIQUOR}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setPvliquorOptions(res.response);
    } else {
      setPvliquorOptions([]);
    }
  } catch (error) {
    console.error("PVliquor options fetch error:", error);
    setPvliquorOptions([]);
  }
};

const fetchPresentationOptions = async () => {
  try {
    const res = await getRequest(`${MAS_PRESENTATION}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setPresentationOptions(res.response);
      } else {
        setPresentationOptions([]);
      }
    } catch (error) {
      console.error("Presentation options fetch error:", error);
      setPresentationOptions([]);
    }
  };

  const fetchTrimesterOptions = async () => {
    try {
      const res = await getRequest(`${MAS_OB_TRIMESTER}/getAll/1`); 
      if (res?.status === 200 && res?.response) {
        setTrimesterOptions(res.response);
      } else {
        setTrimesterOptions([]);
      }
    } catch (error) {
      console.error("Trimester options fetch error:", error);
      setTrimesterOptions([]);
    }
  };

  const fetchImmunisedStatusOptions = async () => {
    try {
      const res = await getRequest(`${OB_MAS_IMMUNISED_STATUS}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setImmunisedStatusOptions(res.response);
      } else {
        setImmunisedStatusOptions([]);
      }
    } catch (error) {
      console.error("Immunised status fetch error:", error);
      setImmunisedStatusOptions([]);
    }
  };

  const fetchBookedStatusOptions = async () => {
    try {
      const res = await getRequest(`${OB_BOOKED_STATUS}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        setBookedStatusOptions(res.response);
      } else {
        setBookedStatusOptions([]);
      }
    } catch (error) {
      console.error("Booked status fetch error:", error);
      setBookedStatusOptions([]);
    }
  };

  const fetchConsanguinityOptions = async () => {
  try {
    const res = await getRequest(`${MAS_OB_CONSANGUINITY}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setConsanguinityOptions(res.response);
    } else {
      setConsanguinityOptions([]);
    }
  } catch (error) {
    console.error("Consanguinity fetch error:", error);
    setConsanguinityOptions([]);
  }
};

 const fetchConceptionOptions = async () => {
  try {
    const res = await getRequest(`${MAS_OB_CONCEPTION}/getAll/1`);
    if (res?.status === 200 && res?.response) {
      setConceptionOptions(res.response);
    } else {
      setConceptionOptions([]);
    }
  } catch (error) {
    console.error("Conception fetch error:", error);
    setConceptionOptions([]);
  }
};

   useEffect(() => {
    fetchConceptionOptions();
    fetchConsanguinityOptions();
    fetchBookedStatusOptions();
    fetchImmunisedStatusOptions();
    fetchTrimesterOptions();
    fetchPresentationOptions();
    fetchPVMembraneOptions();
    fetchPVliquorOptions();
    fetchConsistencyOptions();
    fetchPositionOptions();
    fetchStationOptions();
    fetchPelvisTypeOptions();
    fetchFlowOptions();
    fetchMenarcheAgeOptions();
    fetchMenstrualOptions();
    fetchSterilisationOptions();
    fetchPapSmearOptions();
  }, []);


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const updateInspection = (field, value) => {
    setForm((prev) => ({
      ...prev,
      inspectionHeight: { ...prev.inspectionHeight, [field]: value },
    }));
  };

  const updateMenstrual = (field, value) => {
    setForm((prev) => ({
      ...prev,
      menstrual: { ...prev.menstrual, [field]: value },
    }));
  };

  const updateRespiratory = (field, value) => {
    setForm((prev) => ({
      ...prev,
      respiratory: { ...prev.respiratory, [field]: value },
    }));
  };

  const updateCardiovascular = (field, value) => {
    setForm((prev) => ({
      ...prev,
      cardiovascular: { ...prev.cardiovascular, [field]: value },
    }));
  };

  const updatePvExam = (field, value) => {
    setForm((prev) => ({
      ...prev,
      pvExam: { ...prev.pvExam, [field]: value },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Validation checks
    const requiredFields = {
      obstetricScore: ["g", "p", "a", "l"],
      conception: "conception",
      marriedLife: "marriedLife",
      consanguinity: "consanguinity",
      booked: "booked",
      immunised: "immunised",
      trimesters: "trimesters",
      gc: "gc",
      paA: "paA",
      peA: "peA",
      tt: "tt",
      fhr: "fhr",
      presentation: "presentation",
      palpation: "palpation",
      pv: "pv",
    };

    // Check obstetric score
    const obsScore = form.obstetricScore;
    if (!obsScore.g || !obsScore.p || !obsScore.a || !obsScore.l) {
      showPopup("Please fill all Obstetric Score fields (G, P, A, L)", "error");
      return;
    }

    // Check main required fields
    const missingFields = [];
    for (const [key, value] of Object.entries(requiredFields)) {
      if (key === "obstetricScore") continue;
      if (!form[value]) {
        missingFields.push(value.replace(/([A-Z])/g, " $1").trim());
      }
    }

    if (missingFields.length > 0) {
      showPopup(`Please fill: ${missingFields.join(", ")}`, "error");
      return;
    }

    // Check menstrual history
    const menstrual = form.menstrual;
    if (
      !menstrual.ageOfMenarche ||
      !menstrual.cycles ||
      !menstrual.rangeNoOfDays ||
      !menstrual.interval ||
      !menstrual.flow ||
      !menstrual.menstrualPause
    ) {
      showPopup("Please fill all Menstrual History fields", "error");
      return;
    }

    // Check respiratory
    if (!form.respiratory.system || !form.respiratory.breathSounds) {
      showPopup("Please fill Respiratory System fields", "error");
      return;
    }

    // Check cardiovascular
    if (
      !form.cardiovascular.s1 ||
      !form.cardiovascular.s2 ||
      !form.cardiovascular.murmurs
    ) {
      showPopup("Please fill Cardiovascular System fields", "error");
      return;
    }

    // Check PV Exam (at least some basic fields)
    const pvExam = form.pvExam;
    if (
      !pvExam.osDilatation ||
      !pvExam.effacement ||
      !pvExam.membrane ||
      !pvExam.liquor
    ) {
      showPopup("Please fill Per Vaginal Examination basic fields", "error");
      return;
    }

    // Check head and pelvis
    if (!form.head || !form.pelvis) {
      showPopup("Please select Head and Pelvis", "error");
      return;
    }

    // Gynecology section validation
    if (
      !form.menstrual?.flow ||
      !form.menstrual?.ageOfMenarche ||
      !form.lastMenstrualPeriod ||
      !form.menstrualPattern ||
      !form.cycle
    ) {
      showPopup("Please fill all Gynecology Menstrual History fields", "error");
      return;
    }

    if (!form.obstetricHistory || !form.sterilisation) {
      showPopup("Please fill Obstetric History and Sterilisation", "error");
      return;
    }

    if (
      !form.perAbdomenInspection ||
      !form.gynPalpation ||
      !form.papSmear ||
      !form.localExamination ||
      !form.perSpeculum ||
      !form.bimanualExamination
    ) {
      showPopup("Please fill all Gynecology Examination fields", "error");
      return;
    }
    showPopup("OBG examination data saved successfully!", "success");
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          {/* ================= OBG SECTION ================= */}
          <div className="card mb-3">
            {!hideHeader && (
              <div className="card form-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">OBG Details</h4>
                </div>
              </div>
            )}{" "}
            <div className="card-body">
              {/* Obstetric Score Row */}
              <h6 className="fw-bold text-primary border-bottom pb-1">
                DETAILS
              </h6>

              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Obstetric History
                  </label>
                  <select className="form-select" defaultValue="">
                    <option value="">Select</option>
                    <option value="option1">Option 1</option>
                  </select>
                </div>
                <div className="col-md-9">
                  <label className="form-label fw-bold">Obstetric Score</label>
                  <div className="row">
                    <div className="col-3">
                      <div className="d-flex align-items-center gap-1">
                        <span className="fw-bold" style={{ minWidth: "45px" }}>
                          Gravida
                        </span>
                        <select
                          className="form-select"
                          value={form.obstetricScore.g}
                          onChange={(e) =>
                            updateObstetricScore("g", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{ minWidth: "25px" }}>
                          Para
                        </span>
                        <select
                          className="form-select"
                          value={form.obstetricScore.p}
                          onChange={(e) =>
                            updateObstetricScore("p", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{ minWidth: "50px" }}>
                          Abortion
                        </span>
                        <select
                          className="form-select"
                          value={form.obstetricScore.a}
                          onChange={(e) =>
                            updateObstetricScore("a", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{ minWidth: "25px" }}>
                          Living children
                        </span>
                        <select
                          className="form-select"
                          value={form.obstetricScore.l}
                          onChange={(e) =>
                            updateObstetricScore("l", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conception, Married Life, Consanguinity, Booked */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Conception</label>
                 <select
  className="form-select"
  value={form.conception}
  onChange={(e) => setForm((prev) => ({ ...prev, conception: e.target.value }))}
>
  <option value="">Select</option>
  {conceptionOptions.map((opt) => (
    <option key={opt.id} value={opt.conceptionType}>
      {opt.conceptionType}
    </option>
  ))}
</select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Married Life</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter years"
                    value={form.marriedLife}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        marriedLife: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Consanguinity</label>
                  <select
      className="form-select"
      value={form.consanguinity}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          consanguinity: e.target.value,
        }))
      }
    >
      <option value="">Select</option>
     {consanguinityOptions.map((opt) => (
  <option key={opt.id} value={opt.consanguinityValue}>
    {opt.consanguinityValue}
  </option>
))}
    </select>
                </div>
               <div className="col-md-3">
  <label className="form-label fw-bold">Booked</label>
  <select
    className="form-select"
    value={form.booked}
    onChange={(e) =>
      setForm((prev) => ({ ...prev, booked: e.target.value }))
    }
  >
    <option value="">Select</option>
    {bookedStatusOptions.map((opt) => (
      <option key={opt.id} value={opt.bookedStatus}>
        {opt.bookedStatus}
      </option>
    ))}
  </select>
</div>
              </div>

              {/* Immunised, Trimesters, GC, Pa^A, Pe^A, TT, FHR, Presentation, Palpation, PV, Inspection */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Immunised</label>
                  <select
                    className="form-select"
                    value={form.immunised}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        immunised: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                  {immunisedStatusOptions.map((opt) => (
  <option key={opt.id} value={opt.immunisationValue}>
    {opt.immunisationValue}
  </option>

))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    I,II,III Trimesters
                  </label>
                  <select
                    className="form-select"
                    value={form.trimesters}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        trimesters: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                   {trimesterOptions.map((opt) => (
  <option key={opt.id} value={opt.trimesterValue}>
    {opt.trimesterValue}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">GC(Gestational Calculation / Gestational Age)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.gc}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, gc: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Pa^(Palpation)</label>
                  <select
                    className="form-select"
                    value={form.paA}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, paA: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Pe^(Per Examination)</label>
                  <select
                    className="form-select"
                    value={form.peA}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, peA: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">TT(Tetanus Toxoid Vaccination)</label>
                  <select
                    className="form-select"
                    value={form.tt}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tt: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="Booster">Booster</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">FHR(Fetal Heart Rate) </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="FHR"
                    value={form.fhr}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fhr: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Presentation</label>
                  <select
                    className="form-select"
                    value={form.presentation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        presentation: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {presentationOptions.map((opt) => (
  <option key={opt.id} value={opt.presentationValue}>
    {opt.presentationValue}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Palpation</label>
                  <select
                    className="form-select"
                    value={form.palpation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        palpation: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">PV(Per Vaginal Examination)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="PV finding"
                    value={form.pv}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pv: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">
                    Inspection-Height of Uterus
                  </label>
                  <select
                    className="form-select"
                    value={form.inspectionHeight.select}
                    onChange={(e) => updateInspection("select", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Specify</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.inspectionHeight.specify}
                    onChange={(e) =>
                      updateInspection("specify", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Remarks</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.inspectionHeight.remarks}
                    onChange={(e) =>
                      updateInspection("remarks", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Menstrual History Section */}
              <h6 className="fw-bold text-primary border-bottom pb-1">
                MENSTRUAL HISTORY
              </h6>
              <div className="row mb-3">
                <div className="col-md-2">
                  <label className="form-label fw-bold">Age of Menarche</label>
                  <select
                    className="form-select"
                    value={form.menstrual.ageOfMenarche}
                    onChange={(e) =>
                      updateMenstrual("ageOfMenarche", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 20 }, (_, i) => i + 8).map((age) => (
                      <option key={age}>{age}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Cycles</label>
                  <select
                    className="form-select"
                    value={form.menstrual.cycles}
                    onChange={(e) => updateMenstrual("cycles", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">
                    Range: No. of Days
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 3-7"
                    value={form.menstrual.rangeNoOfDays}
                    onChange={(e) =>
                      updateMenstrual("rangeNoOfDays", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Interval</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 28 days"
                    value={form.menstrual.interval}
                    onChange={(e) =>
                      updateMenstrual("interval", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Flow</label>
                  <select
                    className="form-select"
                    value={form.menstrual.flow}
                    onChange={(e) => updateMenstrual("flow", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Menstrual Pause</label>
                  <select
                    className="form-select"
                    value={form.menstrual.menstrualPause}
                    onChange={(e) =>
                      updateMenstrual("menstrualPause", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Systemic Examination */}
              <h6 className="fw-bold text-primary border-bottom pb-1">
                SYSTEMIC EXAMINATION
              </h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Respiratory System
                  </label>
                  <select
                    className="form-select"
                    value={form.respiratory.system}
                    onChange={(e) =>
                      updateRespiratory("system", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Breath sounds</label>
                  <select
                    className="form-select"
                    value={form.respiratory.breathSounds}
                    onChange={(e) =>
                      updateRespiratory("breathSounds", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Vesicular">Vesicular</option>
                    <option value="Bronchial">Bronchial</option>
                    <option value="Diminished">Diminished</option>
                  </select>
                </div>
              </div>

              {/* Cardiovascular System */}
              <h6 className="fw-bold text-primary border-bottom pb-1">
                CARDIOVASCULAR SYSTEM
              </h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">S1</label>
                  <select
                    className="form-select"
                    value={form.cardiovascular.s1}
                    onChange={(e) => updateCardiovascular("s1", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Soft">Soft</option>
                    <option value="Loud">Loud</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">S2</label>
                  <select
                    className="form-select"
                    value={form.cardiovascular.s2}
                    onChange={(e) => updateCardiovascular("s2", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Split">Split</option>
                    <option value="Loud">Loud</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Murmurs</label>
                  <select
                    className="form-select"
                    value={form.cardiovascular.murmurs}
                    onChange={(e) =>
                      updateCardiovascular("murmurs", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              {/* Per Vaginal Examination */}
              <h6 className="fw-bold text-primary border-bottom pb-1">
                PER VAGINAL EXAMINATION
              </h6>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    OS Dilatation of cervix
                  </label>
                  <select
                    className="form-select"
                    value={form.pvExam.osDilatation}
                    onChange={(e) =>
                      updatePvExam("osDilatation", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i}>{i} cm</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Effacement of cervix
                  </label>
                  <select
                    className="form-select"
                    value={form.pvExam.effacement}
                    onChange={(e) => updatePvExam("effacement", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="0%">0%</option>
                    <option value="25%">25%</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                    <option value="100%">100%</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Membrane</label>
                  <select
                    className="form-select"
                    value={form.pvExam.membrane}
                    onChange={(e) => updatePvExam("membrane", e.target.value)}
                  >
                    <option value="">Select</option>
                    {pvmembraneOptions.map((opt) => (
  <option key={opt.id} value={opt.membraneStatus}>
    {opt.membraneStatus}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Liquor</label>
                  <select
                    className="form-select"
                    value={form.pvExam.liquor}
                    onChange={(e) => updatePvExam("liquor", e.target.value)}
                  >
                    <option value="">Select</option>
                   {pvliquorOptions.map((opt) => (
  <option key={opt.id} value={opt.liquorValue}>
    {opt.liquorValue}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Consistency of cervix
                  </label>
                  <select
                    className="form-select"
                    value={form.pvExam.consistency}
                    onChange={(e) =>
                      updatePvExam("consistency", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {consistencyOptions.map((opt) => (
  <option key={opt.id} value={opt.cervixConsistency}>
    {opt.cervixConsistency}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Position of cervix
                  </label>
                  <select
                    className="form-select"
                    value={form.pvExam.position}
                    onChange={(e) => updatePvExam("position", e.target.value)}
                  >
                    <option value="">Select</option>
                   {positionOptions.map((opt) => (
  <option key={opt.id} value={opt.cervixPosition}>
    {opt.cervixPosition}
  </option>
))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Length of cervix</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 2 cm"
                    value={form.pvExam.length}
                    onChange={(e) => updatePvExam("length", e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Station of Presenting Part
                  </label>
                  <select
                    className="form-select"
                    value={form.pvExam.station}
                    onChange={(e) => updatePvExam("station", e.target.value)}
                  >
                    <option value="">Select</option>
                   {stationOptions.map((opt) => (
  <option key={opt.id} value={opt.stationValue}>
    {opt.stationValue}
  </option>
))}
                    
                  </select>
                </div>
              </div>

              {/* Head and Pelvis */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Head</label>
                  <select
                    className="form-select"
                    value={form.head}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, head: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Pelvis</label>
                  <select
                    className="form-select"
                    value={form.pelvis}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pelvis: e.target.value }))
                    }
                  >
                    <option value="">Select</option>
                   {pelvisTypeOptions.map((opt) => (
  <option key={opt.id} value={opt.pelvisType}>
    {opt.pelvisType}
  </option>
))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ================= GYNAECOLOGY SECTION ================= */}
          <div className="card">
            <h6 className="fw-bold text-primary border-bottom p-2">
              GYNAECOLOGY
            </h6>
            <div className="card-body">
              {/* MENSTRUAL HISTORY */}
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">
                MENSTRUAL HISTORY
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-2">
                  <label className="form-label fw-bold">Flow</label>
                  <select
                    className="form-select"
                    value={form.menstrual?.flow || ""}
                    onChange={(e) => updateMenstrual("flow", e.target.value)}
                  >
                    <option value="">Select</option>
                      {flowOptions.map((opt) => (
  <option key={opt.id} value={opt.flowValue}>
    {opt.flowValue}
  </option>
))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold">Age of Menarche</label>
                  <select
                    className="form-select"
                    value={form.menstrual?.ageOfMenarche || ""}
                    onChange={(e) =>
                      updateMenstrual("ageOfMenarche", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                   {menarcheAgeOptions.map((opt) => (
  <option key={opt.id} value={opt.menarcheAge}>
    {opt.menarcheAge}
  </option>
))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Last Menstrual Period
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.lastMenstrualPeriod || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lastMenstrualPeriod: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold">
                    Menstrual Pattern
                  </label>
                  <select
                    className="form-select"
                    value={form.menstrualPattern || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        menstrualPattern: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                   {menstrualOptions.map((opt) => (
  <option key={opt.id} value={opt.patternValue}>
    {opt.patternValue}
  </option>
))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold">Cycle</label>
                  <select
                    className="form-select"
                    value={form.cycle || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        cycle: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="21 Days">21 Days</option>
                    <option value="28 Days">28 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>
              </div>

              {/* OBSTETRIC HISTORY */}
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">
                OBSTETRIC H/O
              </h6>
              <div className="row g-3 align-items-end mb-4">
                <div className="col-md-7">
                  <label className="form-label fw-bold">History</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.obstetricHistory || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        obstetricHistory: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Sterilisation</label>
                  <select
                    className="form-select"
                    value={form.sterilisation || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sterilisation: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {sterilisationOptions.map((opt) => (
  <option key={opt.id} value={opt.sterilisationType}>
    {opt.sterilisationType}
  </option>
))}
                  </select>
                </div>
              </div>

              {/* EXAMINATION SECTION */}
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-4">
                EXAMINATION
              </h6>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Per Abdomen - Inspection
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.perAbdomenInspection || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        perAbdomenInspection: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Palpation</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.gynPalpation || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        gynPalpation: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Pap-smear</label>
                  <select
                    className="form-select"
                    value={form.papSmear || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        papSmear: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                  {papSmearOptions.map((opt) => (
  <option key={opt.id} value={opt.papResult}>
    {opt.papResult}
  </option>
))}
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-bold">
                    Local Examination
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.localExamination || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        localExamination: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Per Speculum</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.perSpeculum || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        perSpeculum: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Bimanual Examination
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.bimanualExamination || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bimanualExamination: e.target.value,
                      }))
                    }
                  />
                </div>
                {popupMessage && (
                  <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                  />
                )}
                {/* Save Button */}
                {!hideButtons && (
                  <div className="col-12 mt-3 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      onClick={handleSave}
                    >
                      Save Examination
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBGDetails;
