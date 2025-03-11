import React, {useState, useRef, useEffect} from "react";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import {getRequest} from "../../../service/apiService";
import {
  ALL_COUNTRY, ALL_DEPARTMENT,
  ALL_GENDER,
  ALL_RELATION,
  DEPARTMENT,
  DISTRICT_BY_STATE, DOCTOR_BY_SPECIALITY,
  STATE_BY_COUNTRY
} from "../../../config/apiConfig";
const PatientRegistration = () => {
  useEffect(() => {
    // Fetching gender data (simulated API response)
    fetchGenderData();
    fetchRelationData();
    fetchCountryData();
    fetchDepartment();
  }, []);
  const [loading, setLoading] = useState(false);
  const [genderData,setGenderData]=useState([]);
  const [relationData,setRelationData]=useState([]);
  const [countryData,setCountryData]=useState([]);
  const [stateData,setStateData]=useState([]);
  const [nokStateData,setNokStateData]=useState([]);
  const [districtData,setDistrictData]=useState([]);
  const [nokDistrictData,setNokDistrictData]=useState([]);
  const [departmentData,setDepartmentData]=useState([]);
  const [doctorData,setDoctorData]=useState([]);
  const [formData, setFormData] = useState({
      firstName: "",
      middleName: "",
      lastName: "",
      mobileNo: "",
      gender: "",
      relation: "",
      dob: "",
      age: "",
      email: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    nokFirstName: "",
    nokMiddleName: "",
    nokLastName: "",
    nokEmail: "",
    nokMobile: "",
    nokAddress1: "",
    nokAddress2: "",
    nokCountry: "",
    nokState: "",
    nokDistrict: "",
    nokCity: "",
    nokPinCode: "",
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyMobile: "",
    height: "",
    weight: "",
    temperature: "",
    systolicBP: "",
    diastolicBP: "",
    pulse: "",
    bmi: "",
    rr: "",
    spo2: "",
    speciality: "",
    doctor: "",
    session: "",
    appointmentDate: ""

  });
  const [image, setImage] = useState(placeholderImage);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let stream = null;

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
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  async function fetchGenderData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_GENDER}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setGenderData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }


  };
async function fetchRelationData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_RELATION}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setRelationData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setRelationData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }
  async function fetchCountryData() {
    setLoading(true);

    try {
      const data = await getRequest(`${ALL_COUNTRY}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setCountryData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setCountryData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStates(value) {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setStateData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNokStates(value) {
  try{

    const data = await getRequest(`${STATE_BY_COUNTRY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokStateData([]);
      }
    } catch (error) {
        console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNokDistrict(value) {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokDistrictData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setNokDistrictData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }
async function fetchDepartment() {
    try {
      const data = await getRequest(`${ALL_DEPARTMENT}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
            (dept) => dept.departmentCode === "OPD"
        );
        setDepartmentData(filteredDepartments);
      } else {
        console.error("Unexpected API response format:", data);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  function sendRegistrationRequest() {
console.log(formData);
  }

  async function fetchDoctor(value) {
    try {
      const data = await getRequest(`${DOCTOR_BY_SPECIALITY}${value}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Registration of Other Patient</h3>
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
                          <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter First Name" required />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Middle Name</label>
                          <input type="text" value={formData.middleName} name="middleName" onChange={handleChange} className="form-control" placeholder="Enter Middle Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Last Name</label>
                          <input type="text" value={formData.lastName} name="lastName" onChange={handleChange} className="form-control" placeholder="Enter Last Name" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Mobile No.</label>
                          <input type="text" className="form-control" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Enter Mobile Number" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Gender *</label>
                          <select className="form-select" name="gender" value={formData.gender} onChange={handleChange} required>
                            <option value="">Select</option>
                            {genderData.map((gender) => (
                                <option key={gender.id} value={gender.id}>
                                  {gender.genderName}
                                </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Relation *</label>
                          <select className="form-select" name="relation"  value={formData.relation} onChange={handleChange} required>
                            <option value="">Select</option>
                            {relationData.map((relation) => (
                                <option key={relation.id} value={relation.id}>
                                  {relation.relationName}
                                </option>))}
                              </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">DOB *</label>
                          <input type="date" name="dob" className="form-control" value={formData.dob}
                                 max={new Date().toISOString().split("T")[0]}
                                 onChange={handleChange} placeholder="Select Date of Birth" required />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Age</label>
                          <input type="number" name="age" className="form-control"  value={formData.age} onChange={(e) => {
                            const ageValue = e.target.value;
                            if (ageValue === "" || (Number(ageValue) >= 0 && Number(ageValue) <= 130)) {
                              setFormData({ ...formData, age: ageValue });
                            }
                          }}
                                 max="130" placeholder="Enter Age" />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Email *</label>
                          <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="Enter Email Address" required />
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
                      <input type="text" className="form-control" name="address1" value={formData.address1} onChange={handleChange} placeholder="Enter Address 1" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input type="text" className="form-control" name="address2" value={formData.address2} onChange={handleChange} placeholder="Enter Address 2" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select className="form-select" name="country" value={formData.country} onChange={(e) => {
                        handleAddChange(e);
                        fetchStates(e.target.value);
                      }}>
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.countryName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select className="form-select" name="state"  value={formData.state} onChange={(e) => {
                        handleAddChange(e);
                        fetchDistrict(e.target.value);
                      }}>
                        <option value="">Select State</option>
                        {stateData.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.stateName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select className="form-select" name="district"  value={formData.district} onChange={(e) => {
                        handleAddChange(e);
                      }}>
                        <option value="">Select District</option>
                        {districtData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>))}
                      </select>
                    </div>
                  <div className="col-md-4">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} placeholder="Enter City"/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Pin Code</label>
                      <input type="text" className="form-control" name="pinCode" value={formData.pinCode} onChange={handleChange} placeholder="Enter Pin Code" />
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
                      <input type="text" className="form-control" placeholder="Enter First Name"  name="nokFirstName"
                             value={formData.nokFirstName}
                             onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Middle Name</label>
                      <input type="text" className="form-control" placeholder="Enter Middle Name"  name="nokMiddleName"
                             value={formData.nokMiddleName}
                             onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" placeholder="Enter Last Name" name="nokLastName"
                             value={formData.nokLastName}
                             onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" placeholder="Enter Email"  name="nokEmail"
                             value={formData.nokEmail}
                             onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input type="text" className="form-control" placeholder="Enter Mobile Number" name="nokMobile"
                             value={formData.nokMobile}
                             onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 1</label>
                      <input type="text" className="form-control" placeholder="Enter Address 1" name="nokAddress1" value={formData.nokAddress1}
                             onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input type="text" className="form-control" placeholder="Enter Address 2" name="nokAddress2" value={formData.nokAddress2}
                             onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select className="form-select" name="nokCountry" value={formData.nokCountry}
                              onChange={(e) => {
                                handleAddChange(e);
                                fetchNokStates(e.target.value);
                              }}>
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.countryName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select className="form-select" name="nokState" value={formData.nokState}
                              onChange={(e) => {
                                handleAddChange(e);
                                fetchNokDistrict(e.target.value);
                              }}>>
                        <option value="">Select State</option>
                        {nokStateData.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.stateName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select className="form-select" name="nokDistrict" value={formData.nokDistrict} onChange={(e) => {
                        handleAddChange(e)}}>
                        <option value="">Select District</option>
                        {nokDistrictData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input type="text" className="form-control" placeholder="Enter City" name="nokCity" value={formData.nokCity}
                             onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input type="text" className="form-control" placeholder="Enter Pin Code" name="nokPinCode" value={formData.nokPinCode}
                             onChange={handleChange}/>
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
                      <input type="text" className="form-control" placeholder="Enter First Name" name="emergencyFirstName"  value={formData.emergencyFirstName} onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" placeholder="Enter Last Name" name="emergencyLastName"  value={formData.emergencyLastName} onChange={handleChange}/>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input type="text" className="form-control" placeholder="Enter Mobile Number" name="emergencyMobile"  value={formData.emergencyMobile} onChange={handleChange}/>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
       
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
                      <input type="number" className="form-control" placeholder="Height" name="height" value={formData.height} onChange={handleChange} />
                      <span className="input-group-text">cm</span>
                    </div>

                    {/* Weight */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">Weight<span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Weight" name="weight" value={formData.weight} onChange={handleChange}/>
                      <span className="input-group-text">kg</span>
                    </div>

                    {/* Temperature */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">Temperature<span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Temperature"  name="temperature" value={formData.temperature} onChange={handleChange}/>
                      <span className="input-group-text">°F</span>
                    </div>

                    {/* BP (Systolic / Diastolic) */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">BP<span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Systolic" name="systolicBP" value={formData.systolicBP} onChange={handleChange}/>
                      <span className="input-group-text">/</span>
                      <input type="text" className="form-control" placeholder="Diastolic" name="diastolicBP" value={formData.diastolicBP} onChange={handleChange}/>
                      <span className="input-group-text">mmHg</span>
                    </div>

                    {/* Pulse */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">Pulse<span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Pulse" name="pulse" value={formData.pulse} onChange={handleChange}/>/>
                      <span className="input-group-text">/min</span>
                    </div>

                    {/* BMI */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">BMI</label>
                      <input type="text" className="form-control" placeholder="BMI" name="bmi" value={formData.bmi} onChange={handleChange}/> disabled />
                      <span className="input-group-text">kg/m²</span>
                    </div>

                    {/* RR */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">RR</label>
                      <input type="text" className="form-control" placeholder="RR" name="rr" value={formData.rr} onChange={handleChange}/>/>
                      <span className="input-group-text">/min</span>
                    </div>

                    {/* SpO2 */}
                    <div className="col-md-4 d-flex">
                      <label className="form-label me-2">SpO2</label>
                      <input type="text" className="form-control" placeholder="SpO2" name="spo2" value={formData.spo2} onChange={handleChange}/>/>
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
                      <select className="form-select" name="speciality" value={formData.speciality}
                              onChange={(e) => {
                                handleAddChange(e);
                                fetchDoctor(e.target.value);
                              }}>
                        <option value="">Select Speciality</option>
                        {departmentData.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.departmentName}
                            </option>))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Doctor Name</label>
                      <select className="form-select">
                        <option value="">Select Doctor</option>
                        {doctorData.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {`${doctor.firstName} ${doctor.middleName?doctor.middleName:""} ${doctor.lastName?doctor.lastName:""}`}
                            </option>))}
                        {/* Add dynamic options here */}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date *</label>
                      <input type="date" name="appointmentDate" className="form-control" name="appointmentDate" value={formData.appointmentDate}
                             onChange={handleChange}
                             min={new Date().toISOString().split("T")[0]}
                             placeholder="Select Date of Appointment"/>
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

        {/* Submit and Reset Buttons */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="mt-4">
                    <button type="submit" className="btn btn-primary me-2" onClick={sendRegistrationRequest()}>Registration</button>
                    <button type="reset" className="btn btn-secondary">Reset</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Changed By, Date, and Time */}

      </div>
    </div>
  );
};

export default PatientRegistration;
