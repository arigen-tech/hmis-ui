
import { useState } from "react";

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



const OBGDetails = ({ patientId, visitId, hideHeader = false, hideButtons = false }) => {
    const [form, setForm] = useState(defaultOBGForm);
  const updateObstetricScore = (field, value) => {
    setForm((prev) => ({
      ...prev,
      obstetricScore: { ...prev.obstetricScore, [field]: value },
    }));
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
    console.log("OBG Examination Data:", form);
    alert("OBG examination data saved (logged to console).");
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
)}            <div className="card-body">
              {/* Obstetric Score Row */}
                  <h6 className="fw-bold text-primary border-bottom pb-1">DETAILS</h6>

              <div className="row mb-3">
                <div className="col-md-3">
                  
                  <label className="form-label fw-bold">Obstretic History</label>
                  <select className="form-select" defaultValue="">
                    <option value="">Select</option>
                    <option value="option1">Option 1</option>
                  </select>
                </div>
                <div className="col-md-9">
                  <label className="form-label fw-bold">Obstetric Score</label>
                  <div className="row g-2">
                    <div className="col">
                      <select
                        className="form-select"
                        value={form.obstetricScore.g}
                        onChange={(e) => updateObstetricScore("g", e.target.value)}
                      >
                        <option value="">G</option>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <select
                        className="form-select"
                        value={form.obstetricScore.p}
                        onChange={(e) => updateObstetricScore("p", e.target.value)}
                      >
                        <option value="">P</option>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <select
                        className="form-select"
                        value={form.obstetricScore.a}
                        onChange={(e) => updateObstetricScore("a", e.target.value)}
                      >
                        <option value="">A</option>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <select
                        className="form-select"
                        value={form.obstetricScore.l}
                        onChange={(e) => updateObstetricScore("l", e.target.value)}
                      >
                        <option value="">L</option>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conception, Married Life, Consanguinity, Booked */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Conception</label>
                  <select className="form-select" value={form.conception} onChange={(e) => setForm(prev => ({...prev, conception: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Spontaneous">Spontaneous</option>
                    <option value="Assisted">Assisted</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Married Life</label>
                  <input type="text" className="form-control" placeholder="Enter years" value={form.marriedLife} onChange={(e) => setForm(prev => ({...prev, marriedLife: e.target.value}))} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Consanguinity</label>
                  <select className="form-select" value={form.consanguinity} onChange={(e) => setForm(prev => ({...prev, consanguinity: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Booked</label>
                  <select className="form-select" value={form.booked} onChange={(e) => setForm(prev => ({...prev, booked: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Immunised, Trimesters, GC, Pa^A, Pe^A, TT, FHR, Presentation, Palpation, PV, Inspection */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Immunised</label>
                  <select className="form-select" value={form.immunised} onChange={(e) => setForm(prev => ({...prev, immunised: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">I,II,III Trimesters</label>
                  <select className="form-select" value={form.trimesters} onChange={(e) => setForm(prev => ({...prev, trimesters: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">GC</label>
                  <input type="text" className="form-control" value={form.gc} onChange={(e) => setForm(prev => ({...prev, gc: e.target.value}))} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Pa^</label>
                  <select className="form-select" value={form.paA} onChange={(e) => setForm(prev => ({...prev, paA: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Pe^</label>
                  <select className="form-select" value={form.peA} onChange={(e) => setForm(prev => ({...prev, peA: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">TT</label>
                  <select className="form-select" value={form.tt} onChange={(e) => setForm(prev => ({...prev, tt: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="Booster">Booster</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">FHR</label>
                  <input type="text" className="form-control" placeholder="FHR" value={form.fhr} onChange={(e) => setForm(prev => ({...prev, fhr: e.target.value}))} />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Presentation</label>
                  <select className="form-select" value={form.presentation} onChange={(e) => setForm(prev => ({...prev, presentation: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Cephalic">Cephalic</option>
                    <option value="Breech">Breech</option>
                    <option value="Transverse">Transverse</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Palpation</label>
                  <select className="form-select" value={form.palpation} onChange={(e) => setForm(prev => ({...prev, palpation: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">PV</label>
                  <input type="text" className="form-control" placeholder="PV finding" value={form.pv} onChange={(e) => setForm(prev => ({...prev, pv: e.target.value}))} />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Inspection-Height of Uterus</label>
                  <select className="form-select" value={form.inspectionHeight.select} onChange={(e) => updateInspection("select", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Specify</label>
                  <input type="text" className="form-control" value={form.inspectionHeight.specify} onChange={(e) => updateInspection("specify", e.target.value)} />
                </div>
                <div className="col-md-3 mt-3">
                  <label className="form-label fw-bold">Remarks</label>
                  <input type="text" className="form-control" value={form.inspectionHeight.remarks} onChange={(e) => updateInspection("remarks", e.target.value)} />
                </div>
              </div>

              {/* Menstrual History Section */}
              <h6 className="fw-bold text-primary border-bottom pb-1">MENSTRUAL HISTORY</h6>
              <div className="row mb-3">
                <div className="col-md-2">
                  <label className="form-label fw-bold">Age of Menarche</label>
                  <select className="form-select" value={form.menstrual.ageOfMenarche} onChange={(e) => updateMenstrual("ageOfMenarche", e.target.value)}>
                    <option value="">Select</option>
                    {Array.from({ length: 20 }, (_, i) => i + 8).map(age => <option key={age}>{age}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Cycles</label>
                  <select className="form-select" value={form.menstrual.cycles} onChange={(e) => updateMenstrual("cycles", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Range: No. of Days</label>
                  <input type="text" className="form-control" placeholder="e.g., 3-7" value={form.menstrual.rangeNoOfDays} onChange={(e) => updateMenstrual("rangeNoOfDays", e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Interval</label>
                  <input type="text" className="form-control" placeholder="e.g., 28 days" value={form.menstrual.interval} onChange={(e) => updateMenstrual("interval", e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Flow</label>
                  <select className="form-select" value={form.menstrual.flow} onChange={(e) => updateMenstrual("flow", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">Menstrual Pause</label>
                  <select className="form-select" value={form.menstrual.menstrualPause} onChange={(e) => updateMenstrual("menstrualPause", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Systemic Examination */}
              <h6 className="fw-bold text-primary border-bottom pb-1">SYSTEMIC EXAMINATION</h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Respiratory System</label>
                  <select className="form-select" value={form.respiratory.system} onChange={(e) => updateRespiratory("system", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Breath sounds</label>
                  <select className="form-select" value={form.respiratory.breathSounds} onChange={(e) => updateRespiratory("breathSounds", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Vesicular">Vesicular</option>
                    <option value="Bronchial">Bronchial</option>
                    <option value="Diminished">Diminished</option>
                  </select>
                </div>
              </div>

              {/* Cardiovascular System */}
              <h6 className="fw-bold text-primary border-bottom pb-1">CARDIOVASCULAR SYSTEM</h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">S1</label>
                  <select className="form-select" value={form.cardiovascular.s1} onChange={(e) => updateCardiovascular("s1", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Soft">Soft</option>
                    <option value="Loud">Loud</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">S2</label>
                  <select className="form-select" value={form.cardiovascular.s2} onChange={(e) => updateCardiovascular("s2", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Split">Split</option>
                    <option value="Loud">Loud</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Murmurs</label>
                  <select className="form-select" value={form.cardiovascular.murmurs} onChange={(e) => updateCardiovascular("murmurs", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              {/* Per Vaginal Examination */}
              <h6 className="fw-bold text-primary border-bottom pb-1">PER VAGINAL EXAMINATION</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">OS Dilatation of cervix</label>
                  <select className="form-select" value={form.pvExam.osDilatation} onChange={(e) => updatePvExam("osDilatation", e.target.value)}>
                    <option value="">Select</option>
                    {Array.from({ length: 11 }, (_, i) => <option key={i}>{i} cm</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Effacement of cervix</label>
                  <select className="form-select" value={form.pvExam.effacement} onChange={(e) => updatePvExam("effacement", e.target.value)}>
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
                  <select className="form-select" value={form.pvExam.membrane} onChange={(e) => updatePvExam("membrane", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Intact">Intact</option>
                    <option value="Ruptured">Ruptured</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Liquor</label>
                  <select className="form-select" value={form.pvExam.liquor} onChange={(e) => updatePvExam("liquor", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Clear">Clear</option>
                    <option value="Meconium stained">Meconium stained</option>
                    <option value="Blood stained">Blood stained</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Consistency of cervix</label>
                  <select className="form-select" value={form.pvExam.consistency} onChange={(e) => updatePvExam("consistency", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Firm">Firm</option>
                    <option value="Soft">Soft</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Position of cervix</label>
                  <select className="form-select" value={form.pvExam.position} onChange={(e) => updatePvExam("position", e.target.value)}>
                    <option value="">Select</option>
                    <option value="Posterior">Posterior</option>
                    <option value="Mid">Mid</option>
                    <option value="Anterior">Anterior</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Length of cervix</label>
                  <input type="text" className="form-control" placeholder="e.g., 2 cm" value={form.pvExam.length} onChange={(e) => updatePvExam("length", e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Station of Presenting Part</label>
                  <select className="form-select" value={form.pvExam.station} onChange={(e) => updatePvExam("station", e.target.value)}>
                    <option value="">Select</option>
                    {[-3,-2,-1,0,1,2,3].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Head and Pelvis */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Head</label>
                  <select className="form-select" value={form.head} onChange={(e) => setForm(prev => ({...prev, head: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Pelvis</label>
                  <select className="form-select" value={form.pelvis} onChange={(e) => setForm(prev => ({...prev, pelvis: e.target.value}))}>
                    <option value="">Select</option>
                    <option value="Gynecoid">Gynecoid</option>
                    <option value="Android">Android</option>
                    <option value="Anthropoid">Anthropoid</option>
                    <option value="Platypelloid">Platypelloid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ================= GYNAECOLOGY SECTION ================= */}
          <div className="card">
            <h6 className="fw-bold text-primary border-bottom p-2">GYNAECOLOGY</h6>
            <div className="card-body">
              {/* MENSTRUAL HISTORY */}
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">MENSTRUAL HISTORY</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-2">
                  <label className="form-label fw-bold">Flow</label>
                  <select
                    className="form-select"
                    value={form.menstrual?.flow || ""}
                    onChange={(e) => updateMenstrual("flow", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Scanty">Scanty</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-bold">Age of Menarche</label>
                  <select
                    className="form-select"
                    value={form.menstrual?.ageOfMenarche || ""}
                    onChange={(e) => updateMenstrual("ageOfMenarche", e.target.value)}
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 20 }, (_, i) => i + 8).map((age) => (
                      <option key={age}>{age}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Last Menstrual Period</label>
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
                  <label className="form-label fw-bold">Menstrual Pattern</label>
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
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
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
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">OBSTETRIC H/O</h6>
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
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* EXAMINATION SECTION */}
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-4">EXAMINATION</h6>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Per Abdomen - Inspection</label>
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
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-bold">Local Examination</label>
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
                  <label className="form-label fw-bold">Bimanual Examination</label>
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
              </div>
            </div>
          </div>

          {/* Save Button */}
         {!hideButtons && (
  <div className="col-12 mt-3 d-flex justify-content-end">
    <button type="submit" className="btn btn-primary" onClick={handleSave}>
      Save Examination
    </button>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default OBGDetails;