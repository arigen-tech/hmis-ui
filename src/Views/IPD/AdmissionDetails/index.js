import React from "react";

// ---------- DUMMY JSON DATA ----------
const admissionDetailsData = {
  patientInformation: {
    patientName: "John Doe",
    uhid: "UHID000001",
    ageGender: "45 Y / Male",
    patientContactNo: "98XXXXXX11",
    emergencyContactNo: "99XXXXXX22"
  },
  admissionInformation: {
    admissionNo: "IPD/2026/00001",
    admissionDateTime: "01-Jan-2026 09:00 AM",
    admissionCategory: "IPD",
    admissionType: "Routine",
    admissionSource: "OPD",
    currentStatus: "Admitted",
    los: "2 Days"
  },
  doctorLocation: {
    admittingDoctor: "Dr. Smith",
    department: "General Medicine",
    admittingWard: "Male Medical Ward",
    currentWard: "Male Medical Ward",
    room: "Room 1",
    bed: "Bed 01",
    careLevel: "Normal"
  },
  clinicalDetails: {
    reasonForAdmission: "Fever and cough",
    initialDiagnosis: "Upper respiratory tract infection",
    icdDiagnosis: "J06 – Acute upper respiratory infection",
    patientCondition: "Stable",
    admissionPriority: "Routine",
    remarks: "Under observation"
  },
  nokDetails: {
    name: "Jane Doe",
    relationship: "Spouse",
    contactNo: "99XXXXXX22",
    address: "123 Main Street, Anytown"
  },
  referralTransfer: null, // set to object when applicable
  documents: [
    { id: 1, name: "Admission Slip", remarks: "Signed copy", fileName: "AdmissionSlip_IPD202600001.pdf" },
    { id: 2, name: "Consent Form", remarks: "Signed by patient", fileName: "ConsentForm_IPD202600001.pdf" },
    { id: 3, name: "Initial Assessment", remarks: "Completed by doctor", fileName: "InitialAssessment_IPD202600001.pdf" }
  ]
};

const AdmissionDetails = ({ selectedPatient }) => {
  // Merge selectedPatient data (if provided) with dummy JSON data
  const patientInformation = {
    ...admissionDetailsData.patientInformation,
    ...(selectedPatient && {
      patientName: selectedPatient.patientName || admissionDetailsData.patientInformation.patientName,
      uhid: selectedPatient.uhidNo || admissionDetailsData.patientInformation.uhid,
      ageGender: selectedPatient.ageGender || admissionDetailsData.patientInformation.ageGender,
      // contact numbers remain dummy unless explicitly passed
    })
  };

  const admissionInformation = {
    ...admissionDetailsData.admissionInformation,
    ...(selectedPatient && {
      admissionNo: selectedPatient.admissionNo || admissionDetailsData.admissionInformation.admissionNo,
      admissionDateTime: selectedPatient.admissionDate
        ? `${selectedPatient.admissionDate} ${selectedPatient.admissionTime || "10:30 AM"}`
        : admissionDetailsData.admissionInformation.admissionDateTime,
      los: selectedPatient.currentDay ? `${selectedPatient.currentDay} Days` : admissionDetailsData.admissionInformation.los,
    })
  };

  const doctorLocation = {
    ...admissionDetailsData.doctorLocation,
    ...(selectedPatient && {
      admittingDoctor: selectedPatient.doctorName ? `Dr. ${selectedPatient.doctorName}` : admissionDetailsData.doctorLocation.admittingDoctor,
      currentWard: selectedPatient.ward || admissionDetailsData.doctorLocation.currentWard,
      bed: selectedPatient.bedNo || admissionDetailsData.doctorLocation.bed,
    })
  };

  const clinicalDetails = admissionDetailsData.clinicalDetails;
  const nokDetails = admissionDetailsData.nokDetails;
  const referralTransfer = admissionDetailsData.referralTransfer;
  const documents = admissionDetailsData.documents;

  return (
    <div className="admission-details">
      <div className="row">
        {/* Section 1: Patient Information */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Patient Information</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="40%">Patient Name</td>
                    <td>{patientInformation.patientName}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">UHID</td>
                    <td>{patientInformation.uhid}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Age / Gender</td>
                    <td>{patientInformation.ageGender}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Patient Contact No.</td>
                    <td>{patientInformation.patientContactNo}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Emergency Contact No.</td>
                    <td>{patientInformation.emergencyContactNo}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Admission Information */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Admission Information</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="40%">Admission No.</td>
                    <td>{admissionInformation.admissionNo}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admission Date & Time</td>
                    <td>{admissionInformation.admissionDateTime}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admission Category</td>
                    <td>{admissionInformation.admissionCategory}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admission Type</td>
                    <td>{admissionInformation.admissionType}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admission Source</td>
                    <td>{admissionInformation.admissionSource}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Current Status</td>
                    <td>{admissionInformation.currentStatus}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">LOS</td>
                    <td>{admissionInformation.los}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Doctor & Location */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Doctor & Location</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="40%">Admitting Doctor</td>
                    <td>{doctorLocation.admittingDoctor}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Department / Speciality</td>
                    <td>{doctorLocation.department}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admitting Ward</td>
                    <td>{doctorLocation.admittingWard}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Current Ward</td>
                    <td>{doctorLocation.currentWard}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Room</td>
                    <td>{doctorLocation.room}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Bed</td>
                    <td>{doctorLocation.bed}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Care Level</td>
                    <td>{doctorLocation.careLevel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 4: Clinical Details at Admission */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Clinical Details at Admission</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="40%">Reason for Admission</td>
                    <td>{clinicalDetails.reasonForAdmission}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Initial Diagnosis</td>
                    <td>{clinicalDetails.initialDiagnosis}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">ICD Diagnosis</td>
                    <td>{clinicalDetails.icdDiagnosis}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Patient Condition</td>
                    <td>{clinicalDetails.patientCondition}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Admission Priority</td>
                    <td>{clinicalDetails.admissionPriority}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Remarks</td>
                    <td>{clinicalDetails.remarks}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 5: NOK Details */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">NOK Details</h6>
            </div>
            <div className="card-body">
              <table className="table table-sm table-bordered mb-0">
                <tbody>
                  <tr>
                    <td className="fw-bold" width="40%">NOK Name</td>
                    <td>{nokDetails.name}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Relationship</td>
                    <td>{nokDetails.relationship}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Contact No.</td>
                    <td>{nokDetails.contactNo}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Address</td>
                    <td>{nokDetails.address}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 6: Referral / Transfer Details (conditional) */}
        {referralTransfer && (
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header bg-light">
                <h6 className="mb-0">Referral / Transfer Details</h6>
              </div>
              <div className="card-body">
                <table className="table table-sm table-bordered mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" width="40%">From Ward</td>
                      <td>{referralTransfer.fromWard}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">To Ward</td>
                      <td>{referralTransfer.toWard}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Reason</td>
                      <td>{referralTransfer.reason}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Section 7: Document Details */}
        <div className="col-12">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Document Details</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>S.no</th>
                      <th>Document Name</th>
                      <th>Remarks</th>
                      <th>File Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, index) => (
                      <tr key={doc.id}>
                        <td>{index + 1}</td>
                        <td>{doc.name}</td>
                        <td>{doc.remarks}</td>
                        <td>{doc.fileName}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" title="View">
                            <i className="fa fa-eye"></i>
                          </button>
                          {/* <button className="btn btn-sm btn-outline-secondary" title="Download">
                            <i className="fa fa-download"></i>
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionDetails;