import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { Link } from "react-router-dom";

// Current logged-in user for the auto-filled "Cleared By" field (dummy - no auth wiring)
const CURRENT_USER = "Nurse Priya";

const PACClearance = () => {
  // ----- State -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Clear PAC modal states
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [clearRemarks, setClearRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [editPACClearance, setEditPACClearance] = useState(false);

  const [activeTab, setActiveTab] = useState("lab");

  const tabs = [
    { id: "lab", label: "LAB" },
    { id: "radiology", label: "Radiology" },
    { id: "previous", label: "Previous Visits" }
  ];

  // ----- Dummy data (PAC Pending List - Updated Grid) -----
  // Both OPD and IPD requests appear together; OPD shows UHID with no
  // Ward/Bed, IPD shows IP No. with Ward/Bed - matching the source table
  // (ot_booking joined with ot_booking_request_hd/dt + Patient/IPD/Visit).
  const dummyData = [
    {
      id: 1,
      uhidOrIp: "UHID/00125",
      patientName: "Rajesh Kumar",
      type: "OPD",
      department: "Orthopaedics",
      surgery: "Total Knee Replacement",
      surgeon: "Dr. Sharma",
      ot: "OT-01",
      scheduledDateTime: "20-Aug-2026 10:00",
      wardBed: null,
    },
    {
      id: 2,
      uhidOrIp: "IPD/26/00128",
      patientName: "Amit Kumar",
      type: "IPD",
      department: "General Surgery",
      surgery: "Hernia Repair",
      surgeon: "Dr. Gupta",
      ot: "OT-02",
      scheduledDateTime: "20-Aug-2026 14:00",
      wardBed: "Surgical Ward / B-12",
    },
    {
      id: 3,
      uhidOrIp: "IPD/26/00135",
      patientName: "Sunita Devi",
      type: "IPD",
      department: "Gynaecology",
      surgery: "Hysterectomy",
      surgeon: "Dr. Verma",
      ot: "OT-03",
      scheduledDateTime: "21-Aug-2026 09:00",
      wardBed: "Gynae Ward / C-05",
    },
  ];

  // ----- Effects -----
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(dummyData);
      setLoading(false);
    }, 300);
  }, []);

  // ----- Filtered data -----
  const filteredData = data.filter((item) => {
    const matchSearch =
      item.uhidOrIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.surgeon.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter ? item.type === typeFilter : true;
    return matchSearch && matchType;
  });

  // ----- Pagination slice -----
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // ----- Handlers -----
  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchQuery("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  const getCurrentDateTimeLabel = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // ----- Open modal for Clear PAC -----
  const openClearModal = (record) => {
    setSelectedRecord(record);
    setClearRemarks("");
    setShowClearModal(true);
  };

  // ----- Close modal -----
  const closeClearModal = () => {
    setShowClearModal(false);
    setSelectedRecord(null);
    setClearRemarks("");
  };

  // ----- Confirm action (Clear PAC) -----
  // Marks is_pac_done = 'Y' on the backend equivalent - the record then
  // drops off this Pending List, same as the "patient automatically
  // disappears from the PAC Pending List" rule.
  const handleConfirmClear = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const updatedData = data.filter((item) => item.id !== selectedRecord.id);
      setData(updatedData);
      setIsProcessing(false);
      closeClearModal();
      showPopup("PAC cleared successfully!", "success");
    }, 500);
  };

  // ----- Popup helper -----
  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  // ============================================================
  // PAC Assessment / Clearance
  // ============================================================

  if (editPACClearance) {
    return (
      <>
        <div className="content-wrapper">

          <div className="card form-card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-1">
                <button className="btn-back" title="Back to PAC Pending List" onClick={() => setEditPACClearance(false)}><i className="icofont-arrow-left"></i></button>
                <h4 className="card-title p-2 mb-0">PAC Assessment / Clearance</h4>
              </div>
            </div>

            <div className="card-body">

              {/* Patient & Surgery Details */}
              <div className="mb-2">

                <h4 className="fw-bold mb-2">Patient & Surgery Details</h4>
                <div className="row g-3 mb-4">

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="PatientName">Patient Name</label>
                    <input type="text" id="PatientName" name="PatientName" className="form-control" value="Rajesh Kumar" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="ipdNo">IPD No.</label>
                    <input type="text" id="ipdNo" name="ipdNo" className="form-control" value="IPD/26/00125" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="uhidNo">UHID/10025</label>
                    <input type="text" id="uhidNo" name="uhidNo" className="form-control" value="UHID/10025" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="ageSex">Age / Sex</label>
                    <input type="text" id="ageSex" name="ageSex" className="form-control" value="58 / Male" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="wardBed">Ward / Bed</label>
                    <input type="text" id="wardBed" name="wardBed" className="form-control" value="Ortho / B-12" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeonName">Surgeon</label>
                    <input type="text" id="surgeonName" name="surgeonName" className="form-control" value="Dr. Sharma" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeryId">Surgery</label>
                    <input type="text" id="surgeryId" name="surgeryId" className="form-control" value="Total Knee Replacement" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="OtId">OT</label>
                    <input type="text" id="OtId" name="OtId" className="form-control" value="Main OT-01" readonly="" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label mb-1" htmlFor="surgeryDate">Surgery Date</label>
                    <input type="text" id="surgeryDate" name="surgeryDate" className="form-control" value="06 Nov 2026" readonly="" />
                  </div>

                </div>

                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Medical & Anaesthesia History</h4>

                  <div className="adviceWrapper">
                    <div className="cardProcedure">
                      <div className="row g-3 mb-2">
                        <div className="col-md-7">
                          <label className="form-label fw-bold">Disease</label>
                          <input type="text" className="form-control" placeholder="Disease" />
                        </div>

                        <div className="col-md-2">
                          <label className="form-label fw-bold">Status</label>
                          <select className="form-select ">
                            <option value="">Select</option>
                            <option value=""></option>
                          </select>
                        </div>

                        <div className="col-md-2">
                          <label className="form-label fw-bold">Duration</label>
                          <input type="text" className="form-control" placeholder="Years" />
                        </div>
                        <div className="col-md-1">
                          <label className="form-label fw-bold text-center">Action</label>
                          <div className="">
                            <button className="btn btn-primary btnAdd" title="Add Disease"><i className="icofont-plus"></i></button>
                            <button className="btn btn-outline-danger btnDel" title="Delete"><i className="icofont-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-2">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Current Medications</label>
                      <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>Medication details from IPD chart / reconciliation notes</textarea>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Allergy History</label>
                      <select className="form-select ">
                        <option value="">No Known Allergies</option>
                        <option value=""></option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Previous Anaesthesia</label>
                      <select className="form-select ">
                        <option value="">No</option>
                        <option value=""></option>
                      </select>
                    </div>
                  </div>
                </div>


                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold">Vitals & General Examination</h4>
                    <div className="row g-3 mb-4">
                      <div className="col-md-2">
                        <label className="form-label">Weight (kg)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">BP (mmHg)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Pulse (/min)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">RR (/min)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">SpO2 (%)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Temperature (°C)</label>
                        <input type="text" className="form-control" placeholder="Enter value" />
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold">General Examination</h5>
                    <div className="row g-3 mb-4">
                      <div className="col-md-2">
                        <label className="form-label">Pallor</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Icterus</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Cyanosis</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Koilonychia</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Oedema</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Lymphadenopathy</label>
                        <select className="form-select ">
                          <option value="">No</option>
                          <option value=""></option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold">Airway & Systemic Examination</h4>
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <label className="form-label">Mallampati Class (MPC)</label>
                        <select className="form-select ">
                          <option value="">Select</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Thyromental Distance (TMD)</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Mouth Opening</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">TMJ</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Teeth / Dentures</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Neck Movement</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">IV Access</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Spine</label>
                        <input type="text" className="form-control" placeholder="Findings" />
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold">Systemic Examination</h5>
                    <div className="row g-3 mb-2">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CVS</label>
                        <textarea className="form-control" rows="6" placeholder="Clinical findings" style={{ height: "60px" }}></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">RS</label>
                        <textarea className="form-control" rows="6" placeholder="Clinical findings" style={{ height: "60px" }}></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CNS</label>
                        <textarea className="form-control" rows="6" placeholder="Clinical findings" style={{ height: "60px" }}></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Abdomen</label>
                        <textarea className="form-control" rows="6" placeholder="Clinical findings" style={{ height: "60px" }}></textarea>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Airway Examination</h4>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Field</th>
                          <th>Example Value to Save</th>
                          <th>Recommended Input</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Mallampati Class (MPC)</td>
                          <td>II</td>
                          <td>Dropdown: I, II, III, IV</td>
                        </tr>
                        <tr>
                          <td>Thyromental Distance (TMD)</td>
                          <td>7 cm</td>
                          <td>Numeric (cm)</td>
                        </tr>
                        <tr>
                          <td>Mouth Opening</td>
                          <td>4 cm</td>
                          <td>Numeric (cm)</td>
                        </tr>
                        <tr>
                          <td>TM</td>
                          <td>Normal</td>
                          <td>Dropdown: Normal, Restricted, Abnormal</td>
                        </tr>
                        <tr>
                          <td>Teeth / Dentures</td>
                          <td>Natural teeth, no loose teeth</td>
                          <td>Text</td>
                        </tr>
                        <tr>
                          <td>Neck Movement</td>
                          <td>Normal</td>
                          <td>Dropdown: Normal, Restricted</td>
                        </tr>
                        <tr>
                          <td>IV Access</td>
                          <td>Peripheral IV access available</td>
                          <td>Text</td>
                        </tr>
                        <tr>
                          <td>Spine</td>
                          <td>Normal</td>
                          <td>Dropdown: Normal, Abnormal, with remarks</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>


                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold">Airway & Systemic Examination</h4>
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <label className="form-label">Mallampati Class (MPC)</label>
                        <select className="form-select ">
                          <option value="">II</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Thyromental Distance (cm)</label>
                        <input type="text" className="form-control" placeholder="Enter value" value="7" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Mouth Opening (cm)</label>
                        <input type="text" className="form-control" placeholder="Enter value" value="4" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">TMJ</label>
                        <select className="form-select ">
                          <option value="">Normal</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Teeth / Dentures</label>
                        <input type="text" className="form-control" placeholder="Enter value" value="Natural teeth, no loose teeth" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Neck Movement</label>
                        <select className="form-select ">
                          <option value="">Normal</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">IV Access</label>
                        <input type="text" className="form-control" placeholder="Enter value" value="Peripheral IV access available" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Spine</label>
                        <input type="text" className="form-control" placeholder="Normal" />
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold">Systemic Examination</h5>
                    <div className="row g-3 mb-2">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CVS</label>
                        <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>S1, S2 heard; no murmur</textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">RS</label>
                        <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>Bilateral air entry equal; no added sounds</textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">CNS</label>
                        <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>Conscious, oriented; no focal neurological deficit</textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Abdomen</label>
                        <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>Soft, non-tender; no palpable organomegaly</textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Previous Investigations / Review</h4>

                  {/* Tabs beginning here ------ */}
                  <div className="tabs-container">
                    <div className="tabs-header">
                      {tabs.map((tab) => (
                        <button key={tab.id} className={`tab-button ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "lab" && <div className="tab-content">
                      <div className="row g-3 mb-4">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Previous LAB Investigations</label>
                          <textarea className="form-control" rows="6" value="Show investigation, result, date, abnormal flag and report preview." readOnly style={{ height: "60px" }}></textarea>
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Investigation Review Status</label>
                          <label class="radioLabel">
                            <input type="radio" name="reviewStatusType" value="Reviewed" />
                            <span>Reviewed</span>
                          </label>
                          <label class="radioLabel mt-2">
                            <input type="radio" name="reviewStatusType" value="Additional Investigation Required" />
                            <span>Additional Investigation Required</span>
                          </label>
                          <label class="radioLabel mt-2">
                            <input type="radio" name="reviewStatusType" value="Not Indicated" />
                            <span>Not Indicated</span>
                          </label>
                        </div>
                      </div>

                      <div className="row g-3 mb-1">
                        <div className="col-md-12">
                          <label className="form-label fw-bold">Investigation Findings / Additional Tests</label>
                          <textarea className="form-control" rows="6" placeholder="" style={{ height: "60px" }}>ECG, Echo, Chest X-Ray, laboratory findings or further tests</textarea>
                        </div>
                      </div>

                    </div>
                    }

                    {activeTab === "radiology" && <div className="tab-content">
                      <h4 className="fw-bold">Radiology Data here...</h4>
                    </div>
                    }

                    {activeTab === "previous" && <div className="tab-content">
                      <h4 className="fw-bold">Previous Visits Data here.....</h4>
                    </div>
                    }

                  </div>
                  {/* Tabs end here---- */}

                </div>

                <div className="card card-body mb-4">
                  <div className="">
                    <h4 className="fw-bold">Anaesthesia Plan</h4>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="infoStatus mb-1">
                          <label className="form-label mb-0">ASA Physical Status <span className="text-danger">*</span></label>
                          <Link><i class="icofont-info"></i></Link>
                        </div>
                        <select className="form-select ">
                          <option value="">Select ASA Grade</option>
                          <option value=""></option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Planned Anaesthesia <span className="text-danger">*</span></label>
                        <select className="form-select ">
                          <option value="">General Anaesthesia (GA)</option>
                          <option value=""></option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <h5 className="fw-bold">Pre-Anaesthesia Instructions</h5>
                    <div className="mb-3">
                      <label class="radioLabel">
                        <input type="radio" name="instructionsType" value="" />
                        <span>Review allergies and current medications</span>
                      </label>
                      <label class="radioLabel mt-2">
                        <input type="radio" name="instructionsType" value="" />
                        <span>Verify required consent</span>
                      </label>
                      <label class="radioLabel mt-2">
                        <input type="radio" name="instructionsType" value="" />
                        <span>Confirm fasting instructions and status</span>
                      </label>
                      <label class="radioLabel mt-2">
                        <input type="radio" name="instructionsType" value="" />
                        <span>Review airway assessment and anaesthesia plan</span>
                      </label>
                    </div>
                    <button class="btn btn-sm btn-outline-primary addBtn"><i class="icofont-plus"></i><span>Add Instruction</span></button>
                  </div>

                </div>


                <div className="card card-body mb-4">
                  <h4 className="fw-bold">Supporting Documents / Scanned PAC Copy</h4>
                  <div className="row mb-1">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Document Name</label>
                      <input type="text" className="form-control" placeholder="Enter document name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Upload Document</label>
                      <input type="file" className="form-control" />
                      <small>PDF, JPG, PNG</small>
                    </div>
                  </div>
                </div>

                <div className="card card-body mb-3">
                  <h4 className="fw-bold">PAC Clearance</h4>
                  <div className="row g-3 mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">Clearance Status <span className="text-danger">*</span></label>
                      <div class="radio-options">
                        <label class="radioLabel">
                          <input type="radio" name="pacClearanceType" value="Cleared" />
                          <span>Cleared</span>
                        </label>
                        <label class="radioLabel">
                          <input type="radio" name="pacClearanceType" value="Pending" />
                          <span>Pending</span>
                        </label>
                        <label class="radioLabel">
                          <input type="radio" name="pacClearanceType" value="Not Cleared" />
                          <span>Not Cleared</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-md-12">
                      <label className="form-label fw-bold">PAC Remarks</label>
                      <textarea className="form-control" rows="6" placeholder="Enter PAC remarks" style={{ height: "60px" }}></textarea>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-center">
                  <div class="">
                    <button class="btn btnOutline" onClick={() => setEditPACClearance(false)}><i class="icofont-arrow-left"></i> <span>Back</span></button>
                  </div>
                  <div class="">
                    <button class="btn btn btn-secondary me-3">Save Draft</button>
                    <button type="button" class="btn btn-primary me-3">Save PAC Assessment</button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </>
    );
  }



  // ============================================================
  // RENDER: MAIN LIST VIEW
  // ============================================================
  return (
    <div className="content-wrapper">
      {loading && <LoadingScreen />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">PAC Pending List</h4>
            </div>

            <div className="card-body">
              {/* Search / Filter Section */}
              <div className="mb-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">UHID/IP No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="UHID/IP No., Patient, Surgery or Surgeon"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-bold">Type</label>
                    <select
                      className="form-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="OPD">OPD</option>
                      <option value="IPD">IPD</option>
                    </select>
                  </div>
                  <div className="col-md-2 d-flex gap-2">
                    <button className="btn btn-primary" onClick={handleSearch}>
                      Search
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>UHID / IP No.</th>
                      <th>Patient Name</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Surgery</th>
                      <th>Surgeon</th>
                      <th>OT</th>
                      <th>Scheduled Date / Time</th>
                      <th>Ward / Bed</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.uhidOrIp}</td>
                          <td>{item.patientName}</td>
                          <td>
                            {item.type}
                          </td>
                          <td>{item.department}</td>
                          <td>{item.surgery}</td>
                          <td>{item.surgeon}</td>
                          <td>
                            {item.ot}
                          </td>
                          <td>{item.scheduledDateTime}</td>
                          <td>{item.wardBed || "—"}</td>
                          <td className="text-center">
                            <div className="btnCenter">
                              <button className="btn btn-sm btn-success" onClick={() => openClearModal(item)} title="Clear PAC">Clear PAC</button>
                              <button className="btn btn-sm btn-primary" onClick={() => setEditPACClearance(true)}>PAC Assessment</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          No patients pending PAC clearance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== CLEAR PAC MODAL ===== */}
      {showClearModal && selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Clear PAC</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Patient:</strong> {selectedRecord.patientName} ({selectedRecord.uhidOrIp})
                  {selectedRecord.type}
                </p>
                <p>
                  <strong>Department:</strong> {selectedRecord.department}
                </p>
                <p>
                  <strong>Surgery:</strong> {selectedRecord.surgery}
                </p>
                <p>
                  <strong>Surgeon:</strong> {selectedRecord.surgeon}
                </p>
                <p>
                  <strong>OT:</strong> {selectedRecord.ot}
                </p>
                <p>
                  <strong>Scheduled Date/Time:</strong> {selectedRecord.scheduledDateTime}
                </p>
                {selectedRecord.wardBed && (
                  <p>
                    <strong>Ward / Bed:</strong> {selectedRecord.wardBed}
                  </p>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={clearRemarks}
                    onChange={(e) => setClearRemarks(e.target.value)}
                    placeholder="Any additional notes..."
                    disabled={isProcessing}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Cleared By</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={`${CURRENT_USER} (Auto)`}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label fw-bold small mb-1">Date / Time</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={`${getCurrentDateTimeLabel()} (Auto)`}
                      readOnly
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeClearModal}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmClear}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
    </div>
  );
};

export default PACClearance;