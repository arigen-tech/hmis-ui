// OTBookingHistory/OTTeamAssignment.js
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";

const OTTeamAssignment = ({ bookingRecord, onClose, onSave }) => {
  // ----- State -----
  const [popupMessage, setPopupMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teamData, setTeamData] = useState({
    primarySurgeon: "",
    assistantSurgeon: "",
    anaesthetist: "",
    assistantAnaesthetist: "",
    scrubNurse: "",
    circulatingNurse: "",
    otTechnician: "",
  });

  // Dummy dropdown options – replace with API data
  const surgeonOptions = ["Dr. Sharma", "Dr. Gupta", "Dr. Verma", "Dr. Patel", "Dr. Mehta", "Dr. Rao", "Dr. Singh", "Dr. Kumar"];
  const anaesthetistOptions = ["Dr. Kumar", "Dr. Singh", "Dr. Reddy", "Dr. Pillai", "Dr. Joshi"];
  const nurseOptions = ["Nurse Priya", "Nurse Anita", "Nurse Sneha", "Nurse Rani", "Nurse Kavita"];
  const technicianOptions = ["Ravi Kumar", "Suresh", "Mahesh", "Ramesh", "Anand"];

  // Initialize from booking record
  useEffect(() => {
    if (bookingRecord) {
      setTeamData({
        primarySurgeon: bookingRecord.primarySurgeon || bookingRecord.surgeon || "",
        assistantSurgeon: bookingRecord.assistantSurgeon || "",
        anaesthetist: bookingRecord.anaesthetist || "",
        assistantAnaesthetist: bookingRecord.assistantAnaesthetist || "",
        scrubNurse: bookingRecord.scrubNurse || "",
        circulatingNurse: bookingRecord.circulatingNurse || "",
        otTechnician: bookingRecord.otTechnician || "",
      });
    }
  }, [bookingRecord]);

  // ----- Handlers -----
  const handleFieldChange = (field, value) => {
    setTeamData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleEdit = () => setIsEditing(true);

  const handleSave = () => {
    if (!teamData.anaesthetist) {
      showPopup("Anaesthetist is required.", "error");
      return;
    }
    if (!teamData.scrubNurse) {
      showPopup("Scrub Nurse is required.", "error");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      showPopup("OT Team assigned successfully!", "success", () => {
        if (onSave) onSave(teamData);
      });
    }, 500);
  };

  const handleCancel = () => {
    if (isEditing) {
      // Revert changes
      setTeamData({
        primarySurgeon: bookingRecord.primarySurgeon || bookingRecord.surgeon || "",
        assistantSurgeon: bookingRecord.assistantSurgeon || "",
        anaesthetist: bookingRecord.anaesthetist || "",
        assistantAnaesthetist: bookingRecord.assistantAnaesthetist || "",
        scrubNurse: bookingRecord.scrubNurse || "",
        circulatingNurse: bookingRecord.circulatingNurse || "",
        otTechnician: bookingRecord.otTechnician || "",
      });
      setIsEditing(false);
    } else {
      onClose();
    }
  };

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

  if (!bookingRecord) return null;

  // ----- Render -----
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                {isEditing ? "Assign OT Team" : "VIEW / Modify OT Team"}
              </h4>
              <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            </div>
            <div className="card-body">
              {/* Patient & Surgery Details */}
              <div className="card mb-4">
                <div className="card-header"><h5 className="mb-0">PATIENT & SURGERY DETAILS</h5></div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input type="text" className="form-control" readOnly value={bookingRecord.patientName} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">UHID / IP No.</label>
                      <input type="text" className="form-control" readOnly value={bookingRecord.patientType === "OPD" ? bookingRecord.uhid : bookingRecord.ipNo} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Surgery</label>
                      <input type="text" className="form-control" readOnly value={bookingRecord.surgery} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">OT</label>
                      <input type="text" className="form-control" readOnly value={bookingRecord.otName} />
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Scheduled Date</label>
                      <input type="text" className="form-control" readOnly value={bookingRecord.date} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Scheduled Time</label>
                      <input type="text" className="form-control" readOnly value={`${bookingRecord.time} - ${bookingRecord.endTime || "12:00 PM"}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Assignment Form */}
              <div className="card mb-4">
                <div className="card-header"><h5 className="mb-0">{isEditing ? "ASSIGN OT TEAM" : "VIEW / MODIFY OT TEAM"}</h5></div>
                <div className="card-body">
                  <div className="row">
                    {/* Primary Surgeon - Read Only */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Primary Surgeon</label>
                      <input type="text" className="form-control" readOnly value={teamData.primarySurgeon || "Not Assigned"} />
                    </div>

                    {/* Assistant Surgeon */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Assistant Surgeon</label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.assistantSurgeon} onChange={(e) => handleFieldChange("assistantSurgeon", e.target.value)}>
                          <option value="">Select Assistant Surgeon</option>
                          {surgeonOptions.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.assistantSurgeon || "Not Assigned"} />
                      )}
                    </div>

                    {/* Anaesthetist - Required */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Anaesthetist <span className="text-danger">*</span></label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.anaesthetist} onChange={(e) => handleFieldChange("anaesthetist", e.target.value)}>
                          <option value="">Select Anaesthetist</option>
                          {anaesthetistOptions.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.anaesthetist || "Not Assigned"} />
                      )}
                    </div>

                    {/* Assistant Anaesthetist */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Assistant Anaesthetist</label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.assistantAnaesthetist} onChange={(e) => handleFieldChange("assistantAnaesthetist", e.target.value)}>
                          <option value="">Select Anaesthetist</option>
                          {anaesthetistOptions.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.assistantAnaesthetist || "Not Assigned"} />
                      )}
                    </div>

                    {/* Scrub Nurse - Required */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Scrub Nurse <span className="text-danger">*</span></label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.scrubNurse} onChange={(e) => handleFieldChange("scrubNurse", e.target.value)}>
                          <option value="">Select Nurse</option>
                          {nurseOptions.map((nurse) => <option key={nurse} value={nurse}>{nurse}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.scrubNurse || "Not Assigned"} />
                      )}
                    </div>

                    {/* Circulating Nurse */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Circulating Nurse</label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.circulatingNurse} onChange={(e) => handleFieldChange("circulatingNurse", e.target.value)}>
                          <option value="">Select Nurse</option>
                          {nurseOptions.map((nurse) => <option key={nurse} value={nurse}>{nurse}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.circulatingNurse || "Not Assigned"} />
                      )}
                    </div>

                    {/* OT Technician */ }
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">OT Technician</label>
                      {isEditing ? (
                        <select className="form-select" value={teamData.otTechnician} onChange={(e) => handleFieldChange("otTechnician", e.target.value)}>
                          <option value="">Select Technician</option>
                          {technicianOptions.map((tech) => <option key={tech} value={tech}>{tech}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="form-control" readOnly value={teamData.otTechnician || "Not Assigned"} />
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="d-flex justify-content-end mt-4 gap-2">
                      <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>Cancel</button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : "Save Team Assignment"}
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-end mt-4">
                      <button className="btn btn-primary" onClick={handleToggleEdit}>
                        <i className="fa fa-pencil"></i> Modify Team
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  );
};

export default OTTeamAssignment;