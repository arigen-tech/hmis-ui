import { useState } from "react"
import { useNavigate } from "react-router-dom"

const OPDBillingDetails = () => {
  const navigate = useNavigate()

  // Sample patient data - in real app, this would come from API
  // (No longer used, but kept for reference)
  // const [patientData] = useState([...])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, patientId: null, newStatus: false })
  const [formData, setFormData] = useState({
    patientName: "",
    mobileNo: "",
    age: "",
    sex: "",
    relation: "",
    patientId: "",
    address: "",
    visitDate: "",
    doctorName: "",
    department: "",
    visitType: "",
    visitId: "",
    room: "",
    opdSession: "",
    tariffPlan: "",
    basePrice: "",
    discount: "",
    netAmount: "",
    gst: "",
    totalAmount: "",
  })
  const [isFormValid, setIsFormValid] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    // Here you would typically save to database
    console.log("Saving patient data:", formData)
    alert("Patient billing details saved successfully!")
    navigate("/PendingForBilling")
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, patientId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.patientId !== null) {
      // Update patient status
      console.log("Status updated for patient:", confirmDialog.patientId)
      alert(`Patient status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`)
    }
    setConfirmDialog({ isOpen: false, patientId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.patientName &&
        !!updatedFormData.mobileNo &&
        !!updatedFormData.age &&
        !!updatedFormData.sex &&
        !!updatedFormData.visitDate &&
        !!updatedFormData.doctorName,
    )
  }

  const handleBack = () => {
    navigate("/PendingForBilling")
  }

  // Always show the form, no patient lookup or blocking state

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OPD Billing Details</h4>
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                <i className="mdi mdi-arrow-left"></i> Back to Pending List
              </button>
            </div>
            <div className="card-body">
              <form className="forms row" onSubmit={handleSave}>
                {/* Patient Status Section */}
               

                {/* Patient Details Section */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-account"></i> Patient Details
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Patient Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            placeholder="Patient Name"
                            onChange={handleInputChange}
                            value={formData.patientName}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Age <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="age"
                            placeholder="Age"
                            onChange={handleInputChange}
                            value={formData.age}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Mobile No. <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNo"
                            placeholder="Mobile Number"
                            onChange={handleInputChange}
                            value={formData.mobileNo}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Sex <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            id="sex"
                            value={formData.sex}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Relation</label>
                          <input
                            type="text"
                            className="form-control"
                            id="relation"
                            placeholder="Relation"
                            onChange={handleInputChange}
                            value={formData.relation}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Patient ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientId"
                            placeholder="Patient ID"
                            onChange={handleInputChange}
                            value={formData.patientId}
                          />
                        </div>
                        <div className="form-group col-md-12 mt-3">
                          <label>Address</label>
                          <textarea
                            className="form-control"
                            id="address"
                            placeholder="Address"
                            onChange={handleInputChange}
                            value={formData.address}
                            rows="2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPD Visit Information Section */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-hospital-building"></i> OPD Visit Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Visit Date <span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="visitDate"
                            onChange={handleInputChange}
                            value={formData.visitDate}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>
                            Doctor Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="doctorName"
                            placeholder="Doctor Name"
                            onChange={handleInputChange}
                            value={formData.doctorName}
                            required
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Department</label>
                          <input
                            type="text"
                            className="form-control"
                            id="department"
                            placeholder="Department"
                            onChange={handleInputChange}
                            value={formData.department}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Visit Type</label>
                          <select
                            className="form-select"
                            id="visitType"
                            value={formData.visitType}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Visit Type</option>
                            <option value="New">New</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Emergency">Emergency</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Visit ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="visitId"
                            placeholder="Visit ID"
                            onChange={handleInputChange}
                            value={formData.visitId}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Room</label>
                          <input
                            type="text"
                            className="form-control"
                            id="room"
                            placeholder="Room"
                            onChange={handleInputChange}
                            value={formData.room}
                          />
                        </div>
                        <div className="form-group col-md-12 mt-3">
                          <label>OPD Session</label>
                          <select
                            className="form-select"
                            id="opdSession"
                            value={formData.opdSession}
                            onChange={handleInputChange}
                          >
                            <option value="">Select OPD Session</option>
                            <option value="Morning (9-1 PM)">Morning (9-1 PM)</option>
                            <option value="Evening (2-6 PM)">Evening (2-6 PM)</option>
                            <option value="Night (7-11 PM)">Night (7-11 PM)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing & Payment Information Section */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-currency-inr"></i> Billing & Payment Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="form-group col-md-4 mt-3">
                          <label>Tariff Plan</label>
                          <select
                            className="form-select"
                            id="tariffPlan"
                            value={formData.tariffPlan}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Tariff Plan</option>
                            <option value="General Tariff">General Tariff</option>
                            <option value="Premium Tariff">Premium Tariff</option>
                            <option value="VIP Tariff">VIP Tariff</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Base Price</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="basePrice"
                            placeholder="Base Price"
                            onChange={handleInputChange}
                            value={formData.basePrice}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Discount (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="discount"
                            placeholder="Discount Percentage"
                            onChange={handleInputChange}
                            value={formData.discount}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Net Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="netAmount"
                            placeholder="Net Amount"
                            onChange={handleInputChange}
                            value={formData.netAmount}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>GST (18%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="gst"
                            placeholder="GST Amount"
                            onChange={handleInputChange}
                            value={formData.gst}
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Total Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="totalAmount"
                            placeholder="Total Amount"
                            onChange={handleInputChange}
                            value={formData.totalAmount}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBack}>
                    Cancel
                  </button>
                </div>
              </form>

              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"} {" "}
                          <strong>{formData.patientName || "this patient"}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
                        </button>
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
  )
}

export default OPDBillingDetails
