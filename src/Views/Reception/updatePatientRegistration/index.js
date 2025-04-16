import React, { useState, useRef } from "react";
import placeholderImage from "../../../assets/images/placeholder.jpg";
const UpdatePatientRegistration = () => {
    const [image, setImage] = useState(placeholderImage);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [showDetails, setShowDetails] = useState(false);

    let stream = null;
    const patients = [
        { name: "min", mobile: "9971182412", uhid: "997118241202", age: "52 Yrs", gender: "MALE", type: "" },
        { name: "vineet", mobile: "9971182412", uhid: "997118241203", age: "25 Yrs", gender: "MALE", type: "" },
        { name: "test", mobile: "9971182412", uhid: "997118241204", age: "26 Yrs", gender: "MALE", type: "" },
        { name: "test", mobile: "9971182412", uhid: "997118241207", age: "51 Yrs", gender: "FEMALE", type: "" },
        { name: "Amit Saini -1", mobile: "9971182412", uhid: "997118241205", age: "58 Yrs", gender: "MALE", type: "" }
      ];


  const handleRadioChange = (event) => {
    if (event.target.value === "appointment") {
      setShowDetails(true);
    } else {
      setShowDetails(false);
    }
  };
    const startCamera = async () => {
      try {
        setIsCameraOn(true); // Ensure the video element is rendered before accessing ref
        setTimeout(async () => {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };
  
    const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
        setImage(canvas.toDataURL("image/png"));
        stopCamera();
      }
    };
    
  
    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        setIsCameraOn(false);
      }
    };
  
    const clearPhoto = () => {
      setImage(placeholderImage);
    };
    const handleEdit = (patient) => {
        alert(`Editing patient: ${patient.name}`);
      };
return (
    <div className="body d-flex py-3">
    <div className="container-xxl">
      <div className="row align-items-center">
        <div className="border-0 mb-4">
          <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
            <h3 className="fw-bold mb-0">Update Patient Registration and Followup Appointment
            </h3>
          </div>
        </div>
      </div>
      
      {/* Patient address */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-header py-3 bg-light border-bottom-1">
              <h6 className="mb-0 fw-bold">Appointment of Patient </h6>
            </div>
            <div className="card-body">
              <form>
              <div className="row g-3">
                {/* Radio Buttons */}
                <div className="">
                <div className="form-check form-check-inline">
                    <input
                    className="form-check-input"
                    type="radio"
                    name="appointmentType"
                    id="updateInfo"
                    value="updateInfo"
                    onChange={handleRadioChange}
                    defaultChecked
                    />
                    <label className="form-check-label" htmlFor="updateInfo">
                    Update Information
                    </label>
                </div>
                <div className="form-check form-check-inline">
                    <input
                    className="form-check-input"
                    type="radio"
                    name="appointmentType"
                    id="appointment"
                    value="appointment"
                    onChange={handleRadioChange}
                    />
                    <label className="form-check-label" htmlFor="appointment">
                    Appointment
                    </label>
                </div>
                </div>

            {/* Mobile No, Patient Name, UHID No */}
                <div className="row g-3">
                <div className="col-md-3">
                    <label className="form-label">Mobile No.</label>
                    <input type="text" className="form-control" placeholder="Enter Mobile No." />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Patient Name</label>
                    <input type="text" className="form-control" placeholder="Enter Patient Name" />
                </div>
                <div className="col-md-3">
                    <label className="form-label">UHID No.</label>
                    <input type="text" className="form-control" placeholder="Enter UHID No." />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Appointment Date</label>
                    <input type="date" className="form-control" />
                </div>
                </div>


                {/* Buttons */}
                <div className="mt-3">
                <button type="submit" className="btn btn-primary me-2">
                    Search
                </button>
                <button type="reset" className="btn btn-secondary">
                    Reset
                </button>
                </div>
                
                <div className="col-md-12">
                    <table className="table table-bordered">
                    <thead className="table-secondary">
                        <tr>
                        <th>Patient Name</th>
                        <th>Mobile No.</th>
                        <th>UHID No.</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Type of Patient</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map((patient, index) => (
                        <tr key={index}>
                            <td>{patient.name}</td>
                            <td>{patient.mobile}</td>
                            <td>{patient.uhid}</td>
                            <td>{patient.age}</td>
                            <td>{patient.gender}</td>
                            <td>{patient.type}</td>
                            <td>
                            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(patient)}>
                            Edit
                            <span className="ms-2">
                              <i className="icofont-edit"></i>
                            </span>
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="d-flex align-items-center justify-content-end">
                    <span className="me-2">Go To Page</span>
                    <input type="text" className="form-control me-2" style={{ width: "60px" }} />
                    <button className="btn btn-warning">Go</button>
                    <span className="mx-3">Page 1 of 2</span>
                    <button className="btn btn-light" disabled>&laquo;</button>
                    <button className="btn btn-light" disabled>&lsaquo;</button>
                    <button className="btn btn-light">&rsaquo;</button>
                    <button className="btn btn-light">&raquo;</button>
                </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>


       {/* Patient Personal Details */}
       <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 bg-light border-bottom-1">
                <h6 className="mb-0 fw-bold">Personal Details</h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">First Name *</label>
                          <input type="text" className="form-control" placeholder="Enter First Name" required />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Middle Name</label>
                          <input type="text" className="form-control" placeholder="Enter Middle Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Last Name</label>
                          <input type="text" className="form-control" placeholder="Enter Last Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Mobile No.</label>
                          <input type="text" className="form-control" placeholder="Enter Mobile Number" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Gender *</label>
                          <select className="form-select" required>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Relation *</label>
                          <select className="form-select" required>
                            <option value="">Select</option>
                            <option value="male">Wife</option>
                            <option value="female">Mother</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">DOB *</label>
                          <input type="date" className="form-control" placeholder="Select Date of Birth" required />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Age</label>
                          <input type="number" className="form-control" placeholder="Enter Age" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Email *</label>
                          <input type="email" className="form-control" placeholder="Enter Email Address" required />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-3">
                    <div className="text-center">
                      <div className="card p-3 shadow">
                        {isCameraOn ? (
                          <video ref={videoRef} autoPlay className="d-block mx-auto" style={{ width: "100%", height: "150px" }}></video>
                        ) : (
                          <img src={image} alt="Profile" className="img-fluid border" style={{ width: "100%", height: "150px" }} />
                        )}
                        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                        <div className="mt-2">
                          <button type="button" className="btn btn-primary me-2 mb-2" onClick={startCamera} disabled={isCameraOn}>
                            Start Camera
                          </button>
                          {isCameraOn && (
                            <button type="button" className="btn btn-success me-2 mb-2" onClick={capturePhoto}>
                              Take Photo
                            </button>
                          )}
                          <button type="button" className="btn btn-danger mb-2" onClick={clearPhoto}>
                            Clear Photo
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>  

                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      
      {/* Patient address */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-header py-3 bg-light border-bottom-1">
              <h6 className="mb-0 fw-bold">Patient Address</h6>
            </div>
            <div className="card-body">
              <form>
              <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Address 1</label>
                    <input type="text" className="form-control" placeholder="Enter Address 1" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Address 2</label>
                    <input type="text" className="form-control" placeholder="Enter Address 2" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <select className="form-select">
                      <option value="">Select Country</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <select className="form-select">
                      <option value="">Select State</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">District</label>
                    <select className="form-select">
                      <option value="">Select District</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <select className="form-select">
                      <option value="">Select City</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Pin Code</label>
                    <input type="text" className="form-control" placeholder="Enter Pin Code" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* NOK Details */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-header py-3 bg-light border-bottom-1">
              <h6 className="mb-0 fw-bold">NOK Details</h6>
            </div>
            <div className="card-body">
              <form>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" placeholder="Enter First Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Middle Name</label>
                    <input type="text" className="form-control" placeholder="Enter Middle Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" placeholder="Enter Last Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" placeholder="Enter Email" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Mobile No.</label>
                    <input type="text" className="form-control" placeholder="Enter Mobile Number" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Address 1</label>
                    <input type="text" className="form-control" placeholder="Enter Address 1" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Address 2</label>
                    <input type="text" className="form-control" placeholder="Enter Address 2" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Country</label>
                    <select className="form-select">
                      <option value="">Select Country</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State</label>
                    <select className="form-select">
                      <option value="">Select State</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">District</label>
                    <select className="form-select">
                      <option value="">Select District</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" placeholder="Enter City" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Pin Code</label>
                    <input type="text" className="form-control" placeholder="Enter Pin Code" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Details Section */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-header py-3 bg-light border-bottom-1">
              <h6 className="mb-0 fw-bold">Emergency Contact Details</h6>
            </div>
            <div className="card-body">
              <form>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" placeholder="Enter First Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" placeholder="Enter Last Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Mobile No.</label>
                    <input type="text" className="form-control" placeholder="Enter Mobile Number" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
     

      {showDetails && (
        <>

            {/* Vital Details Section */}
            <div className="row mb-3">
                <div className="col-sm-12">
                <div className="card shadow mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                    <h6 className="mb-0 fw-bold">Vital Details</h6>
                    </div>
                    <div className="card-body">
                    <form className="vital">
                        <div className="row g-3 align-items-center">
                        {/* Patient Height */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">Patient Height<span className="text-danger">*</span></label>
                            <input type="text" className="form-control" placeholder="Height" />
                            <span className="input-group-text">cm</span>
                        </div>

                        {/* Weight */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">Weight<span className="text-danger">*</span></label>
                            <input type="text" className="form-control" placeholder="Weight" />
                            <span className="input-group-text">kg</span>
                        </div>

                        {/* Temperature */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">Temperature<span className="text-danger">*</span></label>
                            <input type="text" className="form-control" placeholder="Temperature" />
                            <span className="input-group-text">°F</span>
                        </div>

                        {/* BP (Systolic / Diastolic) */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">BP<span className="text-danger">*</span></label>
                            <input type="text" className="form-control" placeholder="Systolic" />
                            <span className="input-group-text">/</span>
                            <input type="text" className="form-control" placeholder="Diastolic" />
                            <span className="input-group-text">mmHg</span>
                        </div>

                        {/* Pulse */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">Pulse<span className="text-danger">*</span></label>
                            <input type="text" className="form-control" placeholder="Pulse" />
                            <span className="input-group-text">/min</span>
                        </div>

                        {/* BMI */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">BMI</label>
                            <input type="text" className="form-control" placeholder="BMI" disabled />
                            <span className="input-group-text">kg/m²</span>
                        </div>

                        {/* RR */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">RR</label>
                            <input type="text" className="form-control" placeholder="RR" />
                            <span className="input-group-text">/min</span>
                        </div>

                        {/* SpO2 */}
                        <div className="col-md-4 d-flex">
                            <label className="form-label me-2">SpO2</label>
                            <input type="text" className="form-control" placeholder="SpO2" />
                            <span className="input-group-text">%</span>
                        </div>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            </div>


            {/* Appointment Details Section */}
            <div className="row mb-3">
                <div className="col-sm-12">
                <div className="card shadow mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                    <h6 className="mb-0 fw-bold">Appointment Details</h6>
                    </div>
                    <div className="card-body">
                    <form>
                        <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Speciality</label>
                            <select className="form-select">
                            <option value="">Select Speciality</option>
                            {/* Add dynamic options here */}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Doctor Name</label>
                            <select className="form-select">
                            <option value="">Select Doctor</option>
                            {/* Add dynamic options here */}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Session</label>
                            <select className="form-select">
                            <option value="">Select Session</option>
                            {/* Add dynamic options here */}
                            </select>
                        </div>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            </div>
            </>
        )}

      {/* Submit and Reset Buttons */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary me-2">Registration</button>
                  <button type="reset" className="btn btn-secondary">Reset</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Changed By, Date, and Time */}
      <div className="row mb-3">
        <div className="col-sm-12">
          <div className="card shadow mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Changed By</label>
                  <input type="text" className="form-control" value="54321" readOnly />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Changed Date</label>
                  <input type="text" className="form-control" value="22/02/2025" readOnly />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Changed Time</label>
                  <input type="text" className="form-control" value="19:19" readOnly />
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
export default UpdatePatientRegistration;
