import { useState } from "react";

const mockPatients = [
  {
    id: 1,
    employeeNo: "33503",
    patientName: "BHMAN K B",
    age: 34,
    gender: "Male",
    relation: "Son 1",
    department: "Ophthalmology",
    mobileNo: "9876543210",
    visitType: "OPD",
    doctorName: "Dr. Sharma",
    appointmentTime: "10:00 AM",
  },
  {
    id: 2,
    employeeNo: "33504",
    patientName: "SNEHA VERMA",
    age: 28,
    gender: "Female",
    relation: "Self",
    department: "Ophthalmology",
    mobileNo: "9123456789",
    visitType: "OPD",
    doctorName: "Dr. Patel",
    appointmentTime: "10:30 AM",
  },
  {
    id: 3,
    employeeNo: "33505",
    patientName: "RAMESH GUPTA",
    age: 52,
    gender: "Male",
    relation: "Employee",
    department: "Ophthalmology",
    mobileNo: "9988776655",
    visitType: "Review",
    doctorName: "Dr. Sharma",
    appointmentTime: "11:00 AM",
  },
];

const defaultVisionForm = {
  vision: { distance: "", near: "" },
  fundusGlow: {
    re: { uncorrected: "", pinhole: "", bestCorrected: "" },
    le: { uncorrected: "", pinhole: "", bestCorrected: "" },
  },
  retinoscopy: {
    re: { axis: "" },
    le: { axis: "" },
  },
  measurements: {
    re: { keratometry: "", pachymetry: "", nonContactTonometry: "", fieldOfVN: "", iol: "" },
    le: { keratometry: "", pachymetry: "", nonContactTonometry: "", fieldOfVN: "", icl: "" },
  },
  spectacle: {
    re: { sph: "", cyl: "", axis: "" },
    le: { sph: "", cyl: "", axis: "" },
  },
  ipd: { value: "", use: "", typeOfLens: "" },
  anteriorSegment: {
    eyebrow: "N", eyelid: "N", cornea: "N", conjunctiva: "N",
    fornix: "N", limbus: "N", sclera: "N", anteriorChamber: "N",
    iris: "N", pupils: "N", 
  },
  posteriorSegment: {
    re: { opticDisc: "N", foveaMacula: "N", vitreous: "N", bloodVessels: "N", retina: "N" },
    le: { opticDisc: "N", foveaMacula: "N", vitreous: "N", bloodVessels: "N", retina: "N" },
  },
  colourVision: { re: "", le: "" },
};

const anteriorLabels = {
  eyebrow: "Eyebrow", eyelid: "Eyelid", cornea: "Cornea",
  conjunctiva: "Conjunctiva", fornix: "Fornix", limbus: "Limbus",
  sclera: "Sclera", anteriorChamber: "Ant. Chamber", iris: "Iris",
  pupils: "Pupils", 
};

const posteriorLabels = {
  opticDisc: "Optic Disc", foveaMacula: "Fovea & Macula",
  vitreous: "Vitreous", bloodVessels: "Blood Vessels", retina: "Retina",
};

const OpdVision = () => {
  const [searchData, setSearchData] = useState({ mobileNo: "", patientName: "" });
  const [patients] = useState(mockPatients);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(defaultVisionForm);
  const [showForm, setShowForm] = useState(false);

  // Search filter
  const filteredPatients = patients.filter((item) => {
    const mobileMatch =
      searchData.mobileNo === "" ||
      (item.mobileNo && item.mobileNo.includes(searchData.mobileNo));
    const nameMatch =
      searchData.patientName === "" ||
      (item.patientName &&
        item.patientName.toLowerCase().includes(searchData.patientName.toLowerCase()));
    return mobileMatch && nameMatch;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirst, indexOfLast);

  const handleSearchChange = (e) => {
    const { id, value } = e.target;
    setSearchData((prev) => ({ ...prev, [id]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchData({ mobileNo: "", patientName: "" });
    setCurrentPage(1);
  };

  const handleRowClick = (patient) => {
    if (selectedPatient && selectedPatient.id === patient.id) {
      // Deselect and go back to list
      setSelectedPatient(null);
      setShowForm(false);
      setFormData(defaultVisionForm);
    } else {
      setSelectedPatient(patient);
      setShowForm(true);
      setFormData(defaultVisionForm);
    }
  };

  // ---- Form change handlers ----
  const handleVisionChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, vision: { ...prev.vision, [name]: value } }));
  };

  const handleFundusGlowChange = (eye, field, value) => {
    setFormData((prev) => ({
      ...prev,
      fundusGlow: { ...prev.fundusGlow, [eye]: { ...prev.fundusGlow[eye], [field]: value } },
    }));
  };

  const handleRetinoscopyChange = (eye, value) => {
    setFormData((prev) => ({
      ...prev,
      retinoscopy: { ...prev.retinoscopy, [eye]: { axis: value } },
    }));
  };

  const handleMeasurementsChange = (eye, field, value) => {
    setFormData((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [eye]: { ...prev.measurements[eye], [field]: value } },
    }));
  };

  const handleSpectacleChange = (eye, field, value) => {
    setFormData((prev) => ({
      ...prev,
      spectacle: { ...prev.spectacle, [eye]: { ...prev.spectacle[eye], [field]: value } },
    }));
  };

  const handleIpdChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, ipd: { ...prev.ipd, [name]: value } }));
  };

  const handleAnteriorChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      anteriorSegment: { ...prev.anteriorSegment, [name]: value },
    }));
  };

  const handlePosteriorChange = (eye, field, value) => {
    setFormData((prev) => ({
      ...prev,
      posteriorSegment: {
        ...prev.posteriorSegment,
        [eye]: { ...prev.posteriorSegment[eye], [field]: value },
      },
    }));
  };

  const handleColourVisionChange = (eye, value) => {
    setFormData((prev) => ({
      ...prev,
      colourVision: { ...prev.colourVision, [eye]: value },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Vision Exam Data:", { patient: selectedPatient, ...formData });
    alert("Examination data saved (logged to console).");
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">

            {/* ---- Card Header ---- */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">OPD Vision Examination</h4>
              <div className="d-flex justify-content-end align-items-center">
                

                {showForm ? ( <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={()=>setShowForm(false)}
                >
Back
                </button>):
                
                 <button
                  type="button"
                  className="btn btn-success me-2"
                >
 Refresh All
                </button>
                
                }
              </div>
            </div>

            <div className="card-body">
              {/* ---- Search Section (only when form not shown) ---- */}
              {!showForm && (
                <div className="mb-4">
                  <div className="row g-4 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Patient Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        id="mobileNo"
                        placeholder="Enter mobile number"
                        value={searchData.mobileNo}
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
              )}

              {/* ---- Patients Table (only when form not shown) ---- */}
              {!showForm && (
                <div className="table-responsive packagelist mb-3">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Patient Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Department</th>
                        <th>Mobile No</th>
                        <th>Type</th>
                        <th>Doctor Name</th>
                        <th>Time Slot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems && currentItems.length > 0 ? (
                        currentItems.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className={selectedPatient?.id === item.id ? "table-primary" : ""}
                            style={{ cursor: "pointer" }}
                          >
                            <td>{item.patientName}</td>
                            <td>{item.age}</td>
                            <td>{item.gender}</td>
                            <td>{item.department}</td>
                            <td>{item.mobileNo}</td>
                            <td>{item.visitType}</td>
                            <td>{item.doctorName}</td>
                            <td>{item.appointmentTime}</td>
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
              )}

              {/* ---- Vision Form (shown when showForm is true) ---- */}
              {showForm && selectedPatient && (
                <div className="row mb-3 mt-3">
                  <div className="col-sm-12">
                    <div className="card shadow mb-3">

                     

                      <div className="card-body">
                        <form onSubmit={handleSave}>

                          {/* ---- Vision (Table) ---- */}
                          <div className="row mb-4">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold bg-light text-primary border-bottom pb-1">Vision</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th></th>
                                      <th colSpan="3" className="text-center">R.E.</th>
                                      <th colSpan="3" className="text-center">L.E.</th>
                                    </tr>
                                    <tr>
                                      <th></th>
                                      <th>Uncorrected</th>
                                      <th>Pinhole</th>
                                      <th>Best Corrected</th>
                                      <th>Uncorrected</th>
                                      <th>Pinhole</th>
                                      <th>Best Corrected</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">Distance</td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.fundusGlow.re.uncorrected}
                                          onChange={(e) => handleFundusGlowChange("re", "uncorrected", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="6/6">6/6</option>
                                          <option value="6/9">6/9</option>
                                          <option value="6/12">6/12</option>
                                          <option value="6/18">6/18</option>
                                          <option value="6/24">6/24</option>
                                          <option value="6/36">6/36</option>
                                          <option value="6/60">6/60</option>
                                          <option value="CF">CF</option>
                                          <option value="HM">HM</option>
                                          <option value="PL">PL</option>
                                          <option value="NPL">NPL</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.fundusGlow.re.pinhole}
                                          onChange={(e) => handleFundusGlowChange("re", "pinhole", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="6/6">6/6</option>
                                          <option value="6/9">6/9</option>
                                          <option value="6/12">6/12</option>
                                          <option value="6/18">6/18</option>
                                          <option value="6/24">6/24</option>
                                          <option value="6/36">6/36</option>
                                          <option value="6/60">6/60</option>
                                          <option value="CF">CF</option>
                                          <option value="HM">HM</option>
                                          <option value="PL">PL</option>
                                          <option value="NPL">NPL</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g., 6/6-20/25"
                                          value={formData.fundusGlow.re.bestCorrected}
                                          onChange={(e) => handleFundusGlowChange("re", "bestCorrected", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.fundusGlow.le.uncorrected}
                                          onChange={(e) => handleFundusGlowChange("le", "uncorrected", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="6/6">6/6</option>
                                          <option value="6/9">6/9</option>
                                          <option value="6/12">6/12</option>
                                          <option value="6/18">6/18</option>
                                          <option value="6/24">6/24</option>
                                          <option value="6/36">6/36</option>
                                          <option value="6/60">6/60</option>
                                          <option value="CF">CF</option>
                                          <option value="HM">HM</option>
                                          <option value="PL">PL</option>
                                          <option value="NPL">NPL</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.fundusGlow.le.pinhole}
                                          onChange={(e) => handleFundusGlowChange("le", "pinhole", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="6/6">6/6</option>
                                          <option value="6/9">6/9</option>
                                          <option value="6/12">6/12</option>
                                          <option value="6/18">6/18</option>
                                          <option value="6/24">6/24</option>
                                          <option value="6/36">6/36</option>
                                          <option value="6/60">6/60</option>
                                          <option value="CF">CF</option>
                                          <option value="HM">HM</option>
                                          <option value="PL">PL</option>
                                          <option value="NPL">NPL</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g., 6/6-20/25"
                                          value={formData.fundusGlow.le.bestCorrected}
                                          onChange={(e) => handleFundusGlowChange("le", "bestCorrected", e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-semibold">Near</td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.vision.distance}
                                          onChange={handleVisionChange}
                                          name="distance"
                                        >
                                          <option value="">Select</option>
                                          <option value="N6">N6</option>
                                          <option value="N8">N8</option>
                                          <option value="N10">N10</option>
                                          <option value="N12">N12</option>
                                          <option value="N14">N14</option>
                                          <option value="N18">N18</option>
                                          <option value="N24">N24</option>
                                          <option value="N36">N36</option>
                                          <option value="N48">N48</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.vision.near}
                                          onChange={handleVisionChange}
                                          name="near"
                                        >
                                          <option value="">Select</option>
                                          <option value="N6">N6</option>
                                          <option value="N8">N8</option>
                                          <option value="N10">N10</option>
                                          <option value="N12">N12</option>
                                          <option value="N14">N14</option>
                                          <option value="N18">N18</option>
                                          <option value="N24">N24</option>
                                          <option value="N36">N36</option>
                                          <option value="N48">N48</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g., N5-J2"
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.vision.distance}
                                          onChange={handleVisionChange}
                                          name="distance"
                                        >
                                          <option value="">Select</option>
                                          <option value="N6">N6</option>
                                          <option value="N8">N8</option>
                                          <option value="N10">N10</option>
                                          <option value="N12">N12</option>
                                          <option value="N14">N14</option>
                                          <option value="N18">N18</option>
                                          <option value="N24">N24</option>
                                          <option value="N36">N36</option>
                                          <option value="N48">N48</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.vision.near}
                                          onChange={handleVisionChange}
                                          name="near"
                                        >
                                          <option value="">Select</option>
                                          <option value="N6">N6</option>
                                          <option value="N8">N8</option>
                                          <option value="N10">N10</option>
                                          <option value="N12">N12</option>
                                          <option value="N14">N14</option>
                                          <option value="N18">N18</option>
                                          <option value="N24">N24</option>
                                          <option value="N36">N36</option>
                                          <option value="N48">N48</option>
                                        </select>
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="e.g., N5-J2"
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* ---- RETINOSCOPY (Table) ---- */}
                          <div className="row mb-4">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold  text-primary border-bottom pb-1">RETINOSCOPY</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th style={{ width: "130px" }}></th>
                                      <th colSpan="2" className="text-center">R.E.</th>
                                      <th colSpan="2" className="text-center">L.E.</th>
                                    </tr>
                                    <tr>
                                      <th style={{ width: "130px" }}></th>
                                      <th colSpan="1" className="text-center"></th>
                                      <th colSpan="1" className="text-center">AXIS</th>
                                      <th colSpan="1" className="text-center"></th>
                                      <th colSpan="1" className="text-center">AXIS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">V</td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.re.axis}
                                          onChange={(e) => handleRetinoscopyChange("re", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.le.axis}
                                          onChange={(e) => handleRetinoscopyChange("le", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.le.axis}
                                          onChange={(e) => handleRetinoscopyChange("le", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.le.axis}
                                          onChange={(e) => handleRetinoscopyChange("le", e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-semibold">H</td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value=""
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.le.axis}
                                          onChange={(e) => handleRetinoscopyChange("le", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value={formData.retinoscopy.le.axis}
                                          onChange={(e) => handleRetinoscopyChange("le", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Axis"
                                          value=""
                                        />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                {/* ---- Additional Measurements (Table) ---- */}
                                <div className="row ">
                                  <div className="col-12">
                                    <div className="table-responsive">
                                      <table className="table table-bordered table-sm align-middle">
                                        <thead className="table-light">
                                          <tr>
                                            <th colSpan="5" className="text-center">R.E.</th>
                                            <th colSpan="5" className="text-center">L.E.</th>
                                          </tr>
                                          <tr>
                                            <th>Keratometry</th>
                                            <th>Pachymetry</th>
                                            <th>Non-contact Tonometry</th>
                                            <th>Field of VN</th>
                                            <th>IOL</th>
                                            <th>Keratometry</th>
                                            <th>Pachymetry</th>
                                            <th>Non-contact Tonometry</th>
                                            <th>Field of VN</th>
                                            <th>ICL</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.re.keratometry}
                                                onChange={(e) => handleMeasurementsChange("re", "keratometry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.re.pachymetry}
                                                onChange={(e) => handleMeasurementsChange("re", "pachymetry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.re.nonContactTonometry}
                                                onChange={(e) => handleMeasurementsChange("re", "nonContactTonometry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.re.fieldOfVN}
                                                onChange={(e) => handleMeasurementsChange("re", "fieldOfVN", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.re.iol}
                                                onChange={(e) => handleMeasurementsChange("re", "iol", e.target.value)}
                                              />
                                            </td>
                                            <td colSpan="5"> </td>
                                          </tr>
                                          <tr>
                                            <td colSpan="5"> </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.le.keratometry}
                                                onChange={(e) => handleMeasurementsChange("le", "keratometry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.le.pachymetry}
                                                onChange={(e) => handleMeasurementsChange("le", "pachymetry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.le.nonContactTonometry}
                                                onChange={(e) => handleMeasurementsChange("le", "nonContactTonometry", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.le.fieldOfVN}
                                                onChange={(e) => handleMeasurementsChange("le", "fieldOfVN", e.target.value)}
                                              />
                                            </td>
                                            <td>
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={formData.measurements.le.icl}
                                                onChange={(e) => handleMeasurementsChange("le", "icl", e.target.value)}
                                              />
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ---- Spectacle Correction (Table) ---- */}
                          <div className="row">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold text-primary border-bottom pb-1">Spectacle Correction</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th></th>
                                      <th colSpan="3" className="text-center">R.E.</th>
                                      <th colSpan="3" className="text-center">L.E.</th>
                                    </tr>
                                    <tr>
                                      <th></th>
                                      <th>SPH</th>
                                      <th>CYL</th>
                                      <th>Axis</th>
                                      <th>SPH</th>
                                      <th>CYL</th>
                                      <th>Axis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">Dist</td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.re.sph}
                                          onChange={(e) => handleSpectacleChange("re", "sph", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.re.cyl}
                                          onChange={(e) => handleSpectacleChange("re", "cyl", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.re.axis}
                                          onChange={(e) => handleSpectacleChange("re", "axis", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.le.sph}
                                          onChange={(e) => handleSpectacleChange("le", "sph", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.le.cyl}
                                          onChange={(e) => handleSpectacleChange("le", "cyl", e.target.value)}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={formData.spectacle.le.axis}
                                          onChange={(e) => handleSpectacleChange("le", "axis", e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="fw-semibold">Near</td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Add"
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder=""
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder=""
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Add"
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder=""
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder=""
                                          value=""
                                          readOnly
                                        />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="col-12">
                                  <div className="table-responsive">
                                    <table className="table table-bordered table-sm w-auto">
                                      <tbody>
                                        <tr>
                                          <td className="fw-semibold">IPD (50–70)</td>
                                          <td>
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              name="value"
                                              value={formData.ipd.value}
                                              onChange={handleIpdChange}
                                              placeholder="mm"
                                            />
                                          </td>
                                          <td className="fw-semibold">Use</td>
                                          <td>
                                            <select
                                              className="form-select form-select-sm"
                                              name="use"
                                              value={formData.ipd.use}
                                              onChange={handleIpdChange}
                                            >
                                              <option value="">Select</option>
                                              <option value="Distance">Distance</option>
                                              <option value="Near">Near</option>
                                            </select>
                                          </td>
                                          <td className="fw-semibold">Type of Lens</td>
                                          <td>
                                            <select
                                              className="form-select form-select-sm"
                                              name="typeOfLens"
                                              value={formData.ipd.typeOfLens}
                                              onChange={handleIpdChange}
                                            >
                                              <option value="">Select</option>
                                              <option value="Single Vision">Single Vision</option>
                                              <option value="Bifocal">Bifocal</option>
                                              <option value="Progressive">Progressive</option>
                                            </select>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ---- Anterior Segment (Table) ---- */}
                          <div className="row mb-4">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold text-primary border-bottom pb-1">Anterior Segment</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th></th>
                                      {Object.keys(anteriorLabels).map(key => (
                                        <th key={key} className="text-center" style={{ fontSize: "12px" }}>
                                          {anteriorLabels[key]}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">R.E.</td>
                                      {Object.keys(formData.anteriorSegment).map(key => (
                                        <td key={key}>
                                          <select
                                            className="form-select form-select-sm"
                                            name={key}
                                            value={formData.anteriorSegment[key]}
                                            onChange={handleAnteriorChange}
                                          >
                                            <option value="N">N</option>
                                            <option value="Abnormal">Abnormal</option>
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                    <tr>
                                      <td className="fw-semibold">L.E.</td>
                                      {Object.keys(formData.anteriorSegment).map(key => (
                                        <td key={key}>
                                          <select
                                            className="form-select form-select-sm"
                                            name={key}
                                            value={formData.anteriorSegment[key]}
                                            onChange={handleAnteriorChange}
                                          >
                                            <option value="N">N</option>
                                            <option value="Abnormal">Abnormal</option>
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* ---- Posterior Segment (Table) ---- */}
                          <div className="row mb-4">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold text-primary border-bottom pb-1">Posterior Segment</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th></th>
                                      {Object.keys(posteriorLabels).map(key => (
                                        <th key={key} className="text-center" style={{ fontSize: "12px" }}>
                                          {posteriorLabels[key]}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">R.E.</td>
                                      {Object.keys(formData.posteriorSegment.re).map(field => (
                                        <td key={field}>
                                          <select
                                            className="form-select form-select-sm"
                                            value={formData.posteriorSegment.re[field]}
                                            onChange={(e) => handlePosteriorChange("re", field, e.target.value)}
                                          >
                                            <option value="N">N</option>
                                            <option value="Abnormal">Abnormal</option>
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                    <tr>
                                      <td className="fw-semibold">L.E.</td>
                                      {Object.keys(formData.posteriorSegment.le).map(field => (
                                        <td key={field}>
                                          <select
                                            className="form-select form-select-sm"
                                            value={formData.posteriorSegment.le[field]}
                                            onChange={(e) => handlePosteriorChange("le", field, e.target.value)}
                                          >
                                            <option value="N">N</option>
                                            <option value="Abnormal">Abnormal</option>
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* ---- Colour Vision (Table) ---- */}
                          <div className="row mb-4">
                            <div className="col-12 mb-2">
                              <h6 className="fw-bold text-primary border-bottom pb-1">Colour Vision</h6>
                            </div>
                            <div className="col-12">
                              <div className="table-responsive">
                                <table className="table table-bordered table-sm w-auto">
                                  <thead className="table-light">
                                    <tr>
                                      <th></th>
                                      <th>R.E.</th>
                                      <th>L.E.</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td className="fw-semibold">Select</td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.colourVision.re}
                                          onChange={(e) => handleColourVisionChange("re", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="Normal">Normal</option>
                                          <option value="Defective">Defective</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          value={formData.colourVision.le}
                                          onChange={(e) => handleColourVisionChange("le", e.target.value)}
                                        >
                                          <option value="">Select</option>
                                          <option value="Normal">Normal</option>
                                          <option value="Defective">Defective</option>
                                        </select>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* ---- Submit ---- */}
                          <div className="col-12 mt-3 d-flex justify-content-end">
                            <button type="submit" className="btn btn-primary">
                              Save Examination
                            </button>
                          </div>

                        </form>
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