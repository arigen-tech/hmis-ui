import { useState } from "react";

const RequestForBlood = () => {
    // Mock data for patient auto-fill
    const [inpatientNo, setInpatientNo] = useState("");
    const [patientDetails, setPatientDetails] = useState({
        patientName: "",
        ageGender: "",
        bloodGroup: "",
        wardOT: "",
        treatingDoctor: "",
    });

    // Mock data for blood requirement rows
    const [bloodRequests, setBloodRequests] = useState([
        {
            id: 1,
            componentType: "",
            unitsRequired: "",
            urgency: "",
            requiredDateTime: "",
            indication: "",
            remarks: "",
        },
    ]);

    // Mock data for dropdowns
    const componentTypes = [
        { id: 1, name: "PRBC - Packed Red Blood Cells" },
        { id: 2, name: "Platelet" },
        { id: 3, name: "Plasma" },
        { id: 4, name: "Cryo" },
        { id: 5, name: "Whole Blood" },
    ];

    const urgencyOptions = [
        { id: 1, name: "Routine", badge: "bg-info" },
        { id: 2, name: "Emergency", badge: "bg-danger" },
        { id: 3, name: "Urgent", badge: "bg-warning" },
    ];

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

    // Handle inpatient number change with auto-fill
    const handleInpatientChange = (e) => {
        const value = e.target.value;
        setInpatientNo(value);

        // Mock auto-fill - in real app this would fetch from API
        if (value === "IP-000123") {
            setPatientDetails({
                patientName: "Rahul Sharma",
                ageGender: "45 / Male",
                bloodGroup: "B+",
                wardOT: "ICU",
                treatingDoctor: "Dr. Mehta",
            });
        } else if (value === "IP-000456") {
            setPatientDetails({
                patientName: "Priya Patel",
                ageGender: "32 / Female",
                bloodGroup: "O+",
                wardOT: "Emergency",
                treatingDoctor: "Dr. Kumar",
            });
        } else if (value === "IP-000789") {
            setPatientDetails({
                patientName: "Amit Singh",
                ageGender: "58 / Male",
                bloodGroup: "A-",
                wardOT: "OT-2",
                treatingDoctor: "Dr. Sharma",
            });
        } else {
            setPatientDetails({
                patientName: "",
                ageGender: "",
                bloodGroup: "",
                wardOT: "",
                treatingDoctor: "",
            });
        }
    };

    // Handle blood request row changes
    const handleRequestChange = (index, field, value) => {
        const updatedRequests = [...bloodRequests];
        updatedRequests[index][field] = value;
        setBloodRequests(updatedRequests);
    };

    // Add new row
    const addRow = () => {
        setBloodRequests([
            ...bloodRequests,
            {
                id: bloodRequests.length + 1,
                componentType: "",
                unitsRequired: "",
                urgency: "",
                requiredDateTime: "",
                indication: "",
                remarks: "",
            },
        ]);
    };

    // Delete row
    const deleteRow = (index) => {
        if (bloodRequests.length > 1) {
            const updatedRequests = bloodRequests.filter((_, i) => i !== index);
            setBloodRequests(updatedRequests);
        }
    };

    // Handle form submit
    const handleSubmit = () => {
        console.log("Blood Request Submitted:", {
            inpatientNo,
            patientDetails,
            bloodRequests,
        });
        alert("Blood request submitted successfully!");
    };

    // Handle reset
    const handleReset = () => {
        setInpatientNo("");
        setPatientDetails({
            patientName: "",
            ageGender: "",
            bloodGroup: "",
            wardOT: "",
            treatingDoctor: "",
        });
        setBloodRequests([
            {
                id: 1,
                componentType: "",
                unitsRequired: "",
                urgency: "",
                requiredDateTime: "",
                indication: "",
                remarks: "",
            },
        ]);
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">
                                BLOOD REQUEST TO BLOOD BANK
                            </h4>
                            
                        </div>

                        <div className="card-body">




                            <div className="row mb-3">
                                <div className="col-sm-12">
                                       
                                        <div className="card-body">
                                            <div className="row">

                                             <div className="col-md-3">
  <label className="form-label fw-semibold">
    Inpatient Number <span className="text-danger">*</span>
  </label>
  <input
    type="text"
    className="form-control"
    placeholder="Enter IP-000XXX"
    value={inpatientNo}
    onChange={handleInpatientChange}
  />
</div>

<div className="col-md-3">
  <label className="form-label fw-semibold">
    Patient Name
  </label>
  <input
    type="text"
    className="form-control"
    placeholder="Enter Patient Name"
  /> 
</div>

<div className="col-md-3">
  <label className="form-label fw-semibold">
    Mobile Number
  </label>
  <input
    type="tel"
    className="form-control"
    placeholder="Enter Mobile Number"
  />
</div>

                                                <div className="col-md-2 d-flex align-items-end">
                                                    <button
                                                        type="button"
                                                       className="btn btn-success">
                                                        Search
                                                    </button>
                                                </div>

                                            </div>
                                    </div>
                                </div>
                            </div>






                            {/* Patient Details - Auto-filled Fields */}
                            <div className="row mb-3">
                                <div className="col-sm-12">
                                    <div className="card shadow mb-3">
                                        <div className="card-header py-3 border-bottom-1">
                                            <h6 className="mb-0 fw-bold">Patient Details</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">Patient Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={patientDetails.patientName}
                                                        readOnly
                                                        placeholder="Will auto-fill"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Age / Gender</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={patientDetails.ageGender}
                                                        readOnly
                                                        placeholder="-"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Blood Group</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={patientDetails.bloodGroup}
                                                        readOnly
                                                        placeholder="-"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Ward / OT</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={patientDetails.wardOT}
                                                        readOnly
                                                        placeholder="-"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Treating Doctor</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={patientDetails.treatingDoctor}
                                                        readOnly
                                                        placeholder="-"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Blood Requirement Section */}
                            <div className="row mb-3">
                                <div className="col-sm-12">
                                    <div className="card shadow mb-3">
                                        <div className="card-header py-3 border-bottom-1">
                                            <h6 className="mb-0 fw-bold">Blood Requirement Details</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: "20%" }}>
                                                                Component Type <span className="text-danger">*</span>
                                                            </th>
                                                            <th style={{ width: "10%" }}>
                                                                Units <span className="text-danger">*</span>
                                                            </th>
                                                            <th style={{ width: "12%" }}>
                                                                Urgency <span className="text-danger">*</span>
                                                            </th>
                                                            <th style={{ width: "18%" }}>
                                                                Required Date & Time{" "}
                                                                <span className="text-danger">*</span>
                                                            </th>
                                                            <th style={{ width: "20%" }}>
                                                                Indication <span className="text-danger">*</span>
                                                            </th>
                                                            <th style={{ width: "15%" }}>Remarks</th>
                                                            <th style={{ width: "5%" }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bloodRequests.map((request, index) => (
                                                            <tr key={request.id}>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={request.componentType}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "componentType",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">Select Component</option>
                                                                        {componentTypes.map((type) => (
                                                                            <option key={type.id} value={type.name}>
                                                                                {type.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="Units"
                                                                        min="1"
                                                                        value={request.unitsRequired}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "unitsRequired",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={request.urgency}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "urgency",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">Select</option>
                                                                        {urgencyOptions.map((option) => (
                                                                            <option key={option.id} value={option.name}>
                                                                                {option.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {request.urgency && (
                                                                        <span
                                                                            className={`badge ${urgencyOptions.find(
                                                                                (o) => o.name === request.urgency
                                                                            )?.badge || "bg-secondary"
                                                                                } mt-1`}
                                                                        >
                                                                            {request.urgency}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="datetime-local"
                                                                        className="form-control form-control-sm"
                                                                        value={request.requiredDateTime}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "requiredDateTime",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={request.indication}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "indication",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">Select Indication</option>
                                                                        {indicationOptions.map((option, i) => (
                                                                            <option key={i} value={option}>
                                                                                {option}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        placeholder="Optional remarks"
                                                                        value={request.remarks}
                                                                        onChange={(e) =>
                                                                            handleRequestChange(
                                                                                index,
                                                                                "remarks",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => deleteRow(index)}
                                                                        disabled={bloodRequests.length === 1}
                                                                        title="Delete Row"
                                                                    >
                                                                        X

                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={addRow}
                                                >
                                                    <i className="mdi mdi-plus me-2"></i>
                                                    + Add Another Component
                                                </button>

                                                <div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary me-2"
                                                        onClick={handleSubmit}
                                                    >
                                                        <i className="mdi mdi-checkbox-marked-circle me-2"></i>
                                                        Submit Request
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={handleReset}
                                                    >
                                                        <i className="mdi mdi-refresh me-2"></i>
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestForBlood;