import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  CREATE_BLOOD_REQUEST,
  GET_WARD_WISE_INPATIENT,
  MAS_BLOOD_COMPONENT_GET_ALL,
  MAS_BLOODGROUP,
  MAS_WARD_GET_ALL_ACTIVE,
} from "../../../config/apiConfig";

const newBloodRequest = (id) => ({
  id,
  componentType: "",
  unitsRequired: "",
  urgency: "",
  requiredDateTime: "",
  indication: "",
  remarks: "",
});

const urgencyOptions = ["Routine", "Emergency", "Urgent"];
const indicationOptions = [
  "Anemia",
  "Surgery",
  "Bleeding",
  "Trauma",
  "Thalassemia",
  "Hemophilia",
  "Cancer",
  "Liver Disease",
];

const RequestForBlood = () => {
  const [wardId, setWardId] = useState("");
  const [inpatientId, setInpatientId] = useState("");
  const [wardOptions, setWardOptions] = useState([]);
  const [inpatientOptions, setInpatientOptions] = useState([]);
  const [componentOptions, setComponentOptions] = useState([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState([]);
  const [bloodGroupId, setBloodGroupId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bloodRequests, setBloodRequests] = useState([newBloodRequest(1)]);

  useEffect(() => {
    const fetchWards = async () => {
      setIsLoading(true);
      try {
        const [wardsResponse, componentsResponse, bloodGroupsResponse] = await Promise.all([
          getRequest(MAS_WARD_GET_ALL_ACTIVE),
          getRequest(MAS_BLOOD_COMPONENT_GET_ALL),
          getRequest(`${MAS_BLOODGROUP}/getAll/1`),
        ]);
        const wards = wardsResponse?.response || [];
        const components = componentsResponse?.response || [];
        const bloodGroups = bloodGroupsResponse?.response || [];
        setWardOptions(Array.isArray(wards) ? wards : []);
        setComponentOptions(Array.isArray(components) ? components : []);
        setBloodGroupOptions(Array.isArray(bloodGroups) ? bloodGroups : []);
      } catch (error) {
        console.error("Error fetching wards and blood components:", error);
        setWardOptions([]);
        setComponentOptions([]);
        setBloodGroupOptions([]);
        Swal.fire("Unable to Load Data", "Ward and blood component data could not be loaded.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWards();
  }, []);

  const handleWardChange = async (event) => {
    const selectedWardId = event.target.value;
    setWardId(selectedWardId);
    setInpatientId("");
    setSelectedPatient(null);
    setInpatientOptions([]);

    if (!selectedWardId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await getRequest(
        `${GET_WARD_WISE_INPATIENT}?wardId=${encodeURIComponent(selectedWardId)}`,
      );
      const inpatientData = response?.response || [];
      setInpatientOptions(Array.isArray(inpatientData) ? inpatientData : []);
    } catch (error) {
      console.error("Error fetching ward-wise inpatients:", error);
      setInpatientOptions([]);
      Swal.fire("Unable to Load Inpatients", "Inpatient data could not be loaded for this ward.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = () => {
    const patient = inpatientOptions.find(
      (inpatient) => String(inpatient.inpatientId) === String(inpatientId),
    );

    if (!patient) {
      Swal.fire("Inpatient Required", "Please select an inpatient before creating the request.", "info");
      return;
    }

    setSelectedPatient({
      ...patient,
      id: patient.inpatientId,
      patientId: patient.patientId || patient.patientDetailsId || null,
      uhidNo: patient.uhid || "",
      wardOt: patient.ward || "",
      treatingDoctor: patient.doctorName || patient.consultantName || "",
      bloodGroup: patient.bloodGroup || "",
    });
    setBloodRequests([newBloodRequest(1)]);
  };

  const resetSearch = () => {
    setWardId("");
    setInpatientId("");
    setInpatientOptions([]);
    setSelectedPatient(null);
    setBloodGroupId("");
  };

  const updateRequest = (index, field, value) => {
    setBloodRequests((previous) =>
      previous.map((request, requestIndex) =>
        requestIndex === index ? { ...request, [field]: value } : request,
      ),
    );
  };

  const updateUnits = (index, value) => {
    updateRequest(index, "unitsRequired", value.replace(/\D/g, ""));
  };

  const addRequestRow = () => {
    setBloodRequests((previous) => [
      ...previous,
      newBloodRequest(previous.length + 1),
    ]);
  };

  const removeRequestRow = (index) => {
    setBloodRequests((previous) =>
      previous.length > 1
        ? previous.filter((_, requestIndex) => requestIndex !== index)
        : previous,
    );
  };

  const submitRequest = () => {
    const patientId = Number(selectedPatient?.patientId);
    const selectedBloodGroupId = Number(bloodGroupId);
    const requestDepartment = Number(
      sessionStorage.getItem("departmentId") ||
      localStorage.getItem("departmentId"),
    );

    if (!Number.isInteger(patientId) || patientId < 1) {
      Swal.fire(
        "Patient ID Missing",
        "The selected inpatient response does not contain a valid patient ID.",
        "error",
      );
      return;
    }

    if (!Number.isInteger(selectedBloodGroupId) || selectedBloodGroupId < 1) {
      Swal.fire("Blood Group Required", "Please select a blood group.", "error");
      return;
    }

    if (!Number.isInteger(requestDepartment) || requestDepartment < 1) {
      Swal.fire(
        "Department Required",
        "A valid department could not be found. Please log in again.",
        "error",
      );
      return;
    }

    const hasMissingFields = bloodRequests.some((request) =>
      [
        "componentType",
        "unitsRequired",
        "urgency",
        "requiredDateTime",
        "indication",
      ].some((field) => !request[field]),
    );

    const hasInvalidUnits = bloodRequests.some(
      (request) =>
        !Number.isInteger(Number(request.unitsRequired)) ||
        Number(request.unitsRequired) < 1,
    );

    if (hasMissingFields || hasInvalidUnits) {
      Swal.fire("Incomplete Request", "Please complete all required blood details.", "warning");
      return;
    }

    const payload = {
      inpatientId: Number(selectedPatient.inpatientId),
      wardId: Number(selectedPatient.wardId || wardId),
      patientId,
      requestDepartment,
      bloodGroupId: selectedBloodGroupId,
      bloodRequirementDetails: bloodRequests.map((request) => ({
        componentId: Number(request.componentType),
        unitsRequired: Number(request.unitsRequired),
        urgency: request.urgency,
        requiredDateTime: request.requiredDateTime,
        indication: request.indication,
        remarks: request.remarks,
      })),
    };

    const saveRequest = async () => {
      setIsSubmitting(true);
      try {
        const response = await postRequest(CREATE_BLOOD_REQUEST, payload);
        if (response?.status === 200 || response?.status === 201) {
          await Swal.fire({
            title: "Success",
            text: response.message || "Blood request submitted successfully.",
            icon: "success",
            confirmButtonText: "OK",
            allowOutsideClick: false,
          });
          window.location.reload();
        } else {
          Swal.fire("Unable to Submit", response?.message || "Blood request could not be submitted.", "error");
        }
      } catch (error) {
        console.error("Error submitting blood request:", error);
        Swal.fire("Unable to Submit", "Blood request could not be submitted.", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    saveRequest();
  };

  if (selectedPatient) {
    return (
      <div className="body d-flex py-3">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="border-0 mb-4 w-100">
              <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom">
                <h3 className="fw-bold mb-0">BLOOD REQUEST TO BLOOD BANK</h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPatient(null)}
                >
                  <i className="icofont-arrow-left me-1" /> Back to Search
                </button>
              </div>
            </div>
          </div>

          <div className="card shadow mb-3">
            <div className="card-header py-3 border-bottom-1">
              <h6 className="mb-0 fw-bold">Patient Details</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {[
                  ["Patient Name", selectedPatient.patientName],
                  ["Age / Gender", `${selectedPatient.age} / ${selectedPatient.gender}`],
                  // ["Mobile No.", selectedPatient.mobileNo],
                  // ["UHID No.", selectedPatient.uhidNo],
                  // ["Admission No.", selectedPatient.admissionNo],
                  // ["Blood Group", selectedPatient.bloodGroup],
                  ["Ward / OT", selectedPatient.wardOt],
                  ["Room / Bed", `${selectedPatient.room || ""} / ${selectedPatient.bed || ""}`],
                  ["Treating Doctor", selectedPatient.treatingDoctor],
                ].map(([label, value]) => (
                  <div className="col-md-4" key={label}>
                    <label className="form-label">{label}</label>
                    <input className="form-control" value={value || ""} readOnly />
                  </div>
                ))}
                <div className="col-md-4">
                  <label className="form-label">Blood Group <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={bloodGroupId}
                    onChange={(event) => setBloodGroupId(event.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroupOptions.map((bloodGroup) => (
                      <option
                        key={bloodGroup.bloodGroupId}
                        value={bloodGroup.bloodGroupId}
                      >
                        {bloodGroup.bloodGroupName || bloodGroup.bloodGroupCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow mb-3">
            <div className="card-header py-3 border-bottom-1">
              <h6 className="mb-0 fw-bold">Blood Requirement Details</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Component Type *</th>
                      <th>Units *</th>
                      <th>Urgency *</th>
                      <th>Required Date &amp; Time *</th>
                      <th>Indication *</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloodRequests.map((request, index) => (
                      <tr key={request.id}>
                        <td>
                          <select className="form-select form-select-sm" value={request.componentType} onChange={(event) => updateRequest(index, "componentType", event.target.value)}>
                            <option value="">Select Component</option>
                            {componentOptions.map((component) => (
                              <option key={component.componentId} value={component.componentId}>
                                {component.componentName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            className="form-control form-control-sm"
                            value={request.unitsRequired}
                            onKeyDown={(event) =>
                              ["-", "+", ".", "e", "E"].includes(event.key) &&
                              event.preventDefault()
                            }
                            onChange={(event) => updateUnits(index, event.target.value)}
                          />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={request.urgency} onChange={(event) => updateRequest(index, "urgency", event.target.value)}>
                            <option value="">Select</option>
                            {urgencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </td>
                        <td><input type="datetime-local" className="form-control form-control-sm" value={request.requiredDateTime} onChange={(event) => updateRequest(index, "requiredDateTime", event.target.value)} /></td>
                        <td>
                          <select className="form-select form-select-sm" value={request.indication} onChange={(event) => updateRequest(index, "indication", event.target.value)}>
                            <option value="">Select Indication</option>
                            {indicationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </td>
                        <td><input className="form-control form-control-sm" value={request.remarks} onChange={(event) => updateRequest(index, "remarks", event.target.value)} /></td>
                        <td className="text-center">
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRequestRow(index)} disabled={bloodRequests.length === 1}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button type="button" className="btn btn-success" onClick={addRequestRow}>+ Add Another Component</button>
                <div>
                  <button type="button" className="btn btn-primary me-2" onClick={submitRequest} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setBloodRequests([newBloodRequest(1)])}>Reset</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="border-0 mb-4 w-100">
            <div className="card-header py-3 no-bg bg-transparent border-bottom">
              <h3 className="fw-bold mb-0">BLOOD REQUEST TO BLOOD BANK</h3>
            </div>
          </div>
        </div>

        <div className="card shadow mb-3">
          <div className="card-header py-3 border-bottom-1"><h6 className="mb-0 fw-bold">Create Blood Request</h6></div>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Ward Name</label>
                <select
                  className="form-select"
                  value={wardId}
                  onChange={handleWardChange}
                  disabled={isLoading}
                >
                  <option value="">Select Ward</option>
                  {wardOptions.map((ward) => (
                    <option key={ward.wardId || ward.id} value={ward.wardId || ward.id}>
                      {ward.wardName || ward.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Inpatient</label>
                <select
                  className="form-select"
                  value={inpatientId}
                  onChange={(event) => setInpatientId(event.target.value)}
                  disabled={!wardId || isLoading}
                >
                  <option value="">Select Inpatient</option>
                  {inpatientOptions.map((patient) => (
                    <option key={patient.inpatientId} value={patient.inpatientId}>
                      {patient.patientName?.trim()} - {patient.admissionNo || patient.uhid}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-primary" onClick={createRequest} disabled={isLoading || !inpatientId}>
                  Create Request
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetSearch} disabled={isLoading}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForBlood;
