"use client"

import { useState, useRef } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"

const Labregistration = () => {
  // Update form data state for both investigation and package
  const [formData, setFormData] = useState({
    type: "investigation", // Default to investigation
    rows: [
      {
        id: 1,
        name: "",
        date: "",
        originalAmount: 0,
      },
    ],
    paymentMode: "",
  })

  // Add max length constant
  const mlenght = 15

  const [image, setImage] = useState(placeholderImage)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  let stream = null

  const startCamera = async () => {
    try {
      setIsCameraOn(true) // Ensure the video element is rendered before accessing ref
      setTimeout(async () => {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      setImage(canvas.toDataURL("image/png"))
      stopCamera()
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      setIsCameraOn(false)
    }
  }

  const clearPhoto = () => {
    setImage(placeholderImage)
  }

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }))
  }

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addRow = (e) => {
    e.preventDefault()
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: prev.rows.length + 1,
          name: "",
          date: "",
          originalAmount: 0,
        },
      ],
    }))
  }

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
  }

  // Calculate total amount based on selected type
  const calculateTotalAmount = () => {
    return formData.rows
      .reduce((total, item) => {
        return total + (Number.parseFloat(item.originalAmount) || 0)
      }, 0)
      .toFixed(2)
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0"> Lab Registration</h3>
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
                            <video
                              ref={videoRef}
                              autoPlay
                              className="d-block mx-auto"
                              style={{ width: "100%", height: "150px" }}
                            ></video>
                          ) : (
                            <img
                              src={image || "/placeholder.svg"}
                              alt="Profile"
                              className="img-fluid border"
                              style={{ width: "100%", height: "150px" }}
                            />
                          )}
                          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-primary me-2 mb-2"
                              onClick={startCamera}
                              disabled={isCameraOn}
                            >
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

        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header bg-light border-bottom-1 py-3">
                <h6 className="fw-bold mb-0">
                  {formData.type === "investigation" ? "Investigation Details" : "Package Details"}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="investigation"
                      value="investigation"
                      checked={formData.type === "investigation"}
                      onChange={() => handleTypeChange("investigation")}
                    />
                    <label className="form-check-label" htmlFor="investigation">
                      Investigation
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="package"
                      value="package"
                      checked={formData.type === "package"}
                      onChange={() => handleTypeChange("package")}
                    />
                    <label className="form-check-label" htmlFor="package">
                      Package
                    </label>
                  </div>
                </div>

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{formData.type === "investigation" ? "Investigation Name" : "Package Name"}</th>
                      <th>Date</th>
                      <th>Original Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.rows.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={row.name}
                            placeholder={formData.type === "investigation" ? "Investigation Name" : "Package Name"}
                            onChange={(e) => handleRowChange(index, "name", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-control"
                            value={row.date}
                            onChange={(e) => handleRowChange(index, "date", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={row.originalAmount}
                            onChange={(e) => handleRowChange(index, "originalAmount", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-danger" onClick={() => removeRow(index)}>
                            <i className="icofont-close"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total Amount</td>
                      <td colSpan="2" className="text-end">
                        {calculateTotalAmount()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <button type="button" className="btn btn-success" onClick={addRow}>
                  Add {formData.type === "investigation" ? "Investigation" : "Package"} +
                </button>
                <div className="col-md-4 mt-2">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={formData.paymentMode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentMode: e.target.value }))}
                  >
                    <option value="">Select Mode</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="pending">Set as payment pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="mt-4">
                    <button type="submit" className="btn btn-primary me-2">
                      Registration
                    </button>
                    <button type="reset" className="btn btn-secondary">
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
  )
}

export default Labregistration
