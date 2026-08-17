import React, { useState, useEffect } from "react";
import { getRequest } from "../../../service/apiService";
import { GET_ADMISSION_DETAILS_BY_INPATIENT, API_HOST } from "../../../config/apiConfig";

const AdmissionDetails = ({ selectedPatient }) => {
  const [loading, setLoading] = useState(false);
  const [patientInformation, setPatientInformation] = useState({});
  const [admissionInformation, setAdmissionInformation] = useState({});
  const [doctorLocation, setDoctorLocation] = useState({});
  const [clinicalDetails, setClinicalDetails] = useState({});
  const [nokDetails, setNokDetails] = useState({});
  const [documents, setDocuments] = useState([]);
  const [referralTransfer, setReferralTransfer] = useState(null);

  useEffect(() => {
    const fetchAdmissionDetails = async () => {
      const inpatientId = selectedPatient?.inpatientId || selectedPatient?.id;
      if (!inpatientId) return;

      setLoading(true);
      try {
        const response = await getRequest(`${GET_ADMISSION_DETAILS_BY_INPATIENT}/${inpatientId}`);
        if (response?.status === 200 && response?.response) {
          const data = response.response;

          setPatientInformation({
            patientName: data.patientName || "",
            uhid: data.uhid || "",
            ageGender: `${data.age || ""} / ${data.gender || ""}`,
            patientContactNo: data.contactNo || "",
            emergencyContactNo: data.emergencyContactNo || ""
          });

          setAdmissionInformation({
            admissionNo: data.admissionNo || "",
            admissionDateTime: `${data.admissionDate || ""} ${data.admissionTime || ""}`.trim(),
            admissionCategory: data.admissionCategory || "",
            admissionType: data.admissionType || "",
            admissionSource: data.admissionSource || "",
            currentStatus: data.currentStatus || "",
            los: data.los || ""
          });

          setDoctorLocation({
            admittingDoctor: data.admittingDoctor ? `Dr. ${data.admittingDoctor}` : "",
            department: data.department || "",
            admittingWard: data.admittingWard || "",
            currentWard: data.currentWard || "",
            room: data.room || "",
            bed: data.bed || "",
            careLevel: data.careLevel || ""
          });

          setClinicalDetails({
            reasonForAdmission: data.reasonForAdmission || "",
            initialDiagnosis: data.initialDiagnosis || "",
            icdDiagnosis: data.icdDiagnosis || "",
            patientCondition: data.patientCondition || "",
            admissionPriority: data.admissionPriority || "",
            remarks: data.remark || ""
          });

          setNokDetails({
            name: data.nokName || "",
            relationship: data.relationship || "",
            contactNo: data.contact || "",
            address: data.address || ""
          });

          const docs = Array.isArray(data.documentListList) ? data.documentListList.map((doc, idx) => ({
            id: idx + 1,
            name: doc.documentName || "",
            remarks: doc.documentRemarks || "",
            fileName: doc.fileName || "",
            filePath: doc.filePath || ""
          })) : [];
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Error fetching admission details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissionDetails();
  }, [selectedPatient]);

  if (loading) {
    return <div className="p-4 text-center">Loading Admission Details...</div>;
  }

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
                          <button 
                            className="btn btn-sm btn-outline-primary me-1" 
                            title="View"
                            onClick={() => {
                              if (doc.filePath) {
                                const normalizedPath = doc.filePath.replace(/\\/g, '/');
                                window.open(`${API_HOST}/${normalizedPath}`, '_blank');
                              }
                            }}
                          >
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