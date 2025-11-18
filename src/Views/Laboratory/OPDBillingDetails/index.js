import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MAS_SERVICE_CATEGORY } from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";




const OPDBillingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: false,
    gstPercent: 0,
  });

  async function fetchGstConfiguration(optionalCategoryId) {
    try {
      optionalCategoryId = 1;
      const url = `${MAS_SERVICE_CATEGORY}/getGstConfig/1` +
        (optionalCategoryId ? `?categoryId=${optionalCategoryId}` : "");

      const data = await getRequest(url);
      console.log("GST:", gstConfig);
      if (
        data &&
        data.status === 200 &&
        data.response &&
        typeof data.response.gstApplicable !== "undefined"
      ) {
        setGstConfig({
          gstApplicable: !!data.response.gstApplicable,
          gstPercent: Number(data.response.gstPercent) || 0,
        });
      } else {
        setGstConfig({ gstApplicable: false, gstPercent: 0 });
      }
    } catch (error) {
      console.error("GST Fetch Error:", error);
      setGstConfig({ gstApplicable: false, gstPercent: 0 });
    }
  }

  //Confirm dialog for activate/deactivate (optional)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    patientId: null,
    newStatus: false,
  });

  //Form data for all OPD fields
  const [formData, setFormData] = useState({
    billingType: "",
    billingHeaderId: "",
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
    registrationCost: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);

  //Step 1: Auto-fill details from previous page (location.state)
  useEffect(() => {
    if (!location.state || !location.state.billingData) {
      console.log("No billingData passed. Redirecting back to pending list.");
      navigate("/PendingForBilling");
      return;
    }

    const response = location.state.billingData;
    const billing = Array.isArray(response) ? response[0] : response;

    const mapped = {
      billingType: billing.billingType || "",
      billingHeaderId: billing.billingHeaderId || billing.billinghdid || "",
      patientName: billing.patientName || billing.patientFn || "",
      mobileNo: billing.mobileNo || billing.patientMobileNumber || "",
      age: billing.age || billing.patientAge || "",
      sex: billing.sex || billing.patientGender || "",
      relation: billing.relation || "",
      patientId: billing.patientid?.toString() || billing.patientId?.toString() || "",
      address: billing.address || `${billing.patientAddress1 || ""}, ${billing.patientCity || ""}`,
      visitDate: billing.visitDate || new Date().toISOString().split("T")[0],
      doctorName: billing.consultedDoctor || billing.consultedDoctor || "",
      department: billing.department || "",
      visitType: billing.visitType || "",
      visitId: billing.visitId || billing.visitNo || "",
      room: billing.room || "",
      opdSession: billing.opdSession || "",
      tariffPlan: billing.tariffPlan || "",
      basePrice: billing.basePrice ?? billing.amount ?? "",
      discount: billing.discount || billing.details?.[0]?.discount || 0,
      netAmount: "",
      gst: "",
      totalAmount: "",
      registrationCost: billing.registrationCost,
      visitType: billing.visitType === "N" ? "New" : "Follow-up",

    };
    const optionalCategoryId = billing.categoryId || null;
    fetchGstConfiguration(optionalCategoryId);
    setFormData((prev) => ({ ...prev, ...mapped }));
  }, [location.state, navigate]);

  //Auto-calculate net, GST, and total whenever base or discount changes
useEffect(() => {
  const base = parseFloat(formData.basePrice) || 0;
  const discountVal = parseFloat(formData.discount) || 0;
  const regCost = formData.visitType === "New" ? Number(formData.registrationCost) || 0: 0;

  const net = Math.max(0, base - discountVal);

  const gstPercent = gstConfig?.gstApplicable ? gstConfig?.gstPercent : 0;

  const gstAmount = (net * gstPercent) / 100;
  const total = net + gstAmount + regCost;

  setFormData((prev) => ({
    ...prev,
    netAmount: net.toFixed(2),
    gst: gstAmount.toFixed(2),
    totalAmount: total.toFixed(2),
  }));
}, [
  formData.basePrice,
  formData.discount,
  formData.visitType,
  gstConfig
]);


  //Validate required fields
  useEffect(() => {
    const valid =
      !!formData.patientName &&
      !!formData.mobileNo &&

      !!formData.visitDate &&
      !!formData.doctorName;
    setIsFormValid(valid);
  }, [formData.patientName, formData.mobileNo, formData.visitDate, formData.doctorName]);

  //Step 4: Handle input change
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  //Step 5: Handle Save (Navigate to payment)
  const handleSave = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      Swal.fire("Missing", "Please fill required fields", "warning");
      return;
    }

    navigate("/payment", {
      state: {
        billingType: formData.billingType,
        amount: parseFloat(formData.totalAmount) || 0,
        patientId: formData.patientId,
        opdData: formData,
        billingHeaderId: formData.billingHeaderId
      },
    });
  };

  // Step 6: Handle Back Button
  const handleBack = () => {
    navigate("/PendingForBilling");
  };

  // Step 7: Optional - Confirm Dialog Handlers
  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, patientId: id, newStatus });
  };

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.patientId !== null) {
      alert(
        `Patient status ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"
        } successfully!`
      );
    }
    setConfirmDialog({ isOpen: false, patientId: null, newStatus: null });
  };

  // Step 8: Render UI
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
                        {[
                          ["Patient Name", "patientName", "text", true, true],
                          ["Age", "age", "patientAge", "text", false, true],
                          ["Mobile No.", "mobileNo", "text", true, true],
                        ].map(([label, id, type, required, readOnly]) => (
                          <div className="form-group col-md-4 mt-3" key={id}>
                            <label>
                              {label} {required && <span className="text-danger">*</span>}
                            </label>
                            <input
                              type={type}
                              className="form-control"
                              id={id}
                              placeholder={label}
                              onChange={handleInputChange}
                              value={formData[id]}
                              required={required}
                              readOnly
                            />
                          </div>
                        ))}

                        <div className="form-group col-md-4 mt-3">
                          <label>Sex</label>
                          <input
                            type="text"
                            className="form-control"
                            id="sex"
                            placeholder="Relation"
                            onChange={handleInputChange}
                            value={formData.sex}
                            readOnly
                          />
                          {/* <select
                            className="form-select"
                            id="sex"
                            value={formData.sex}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select> */}
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
                            readOnly
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
                            readOnly
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
                            readOnly
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
                        {/* Visit date, doctor, dept, etc. */}
                        <div className="form-group col-md-4 mt-3">
                          <label>Visit Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            id="visitDate"
                            onChange={handleInputChange}
                            value={formData.visitDate}
                            required
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Doctor Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="doctorName"
                            placeholder="Doctor Name"
                            onChange={handleInputChange}
                            value={formData.doctorName}
                            required
                            readOnly
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
                            readOnly
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
                        {/* <div className="form-group col-md-4 mt-3">
                          <label>Visit ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="visitId"
                            placeholder="Visit ID"
                            onChange={handleInputChange}
                            value={formData.visitId}
                          />
                        </div> */}
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

                {/* Billing & Payment Information */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">
                        <i className="mdi mdi-currency-inr"></i> Billing & Payment
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
                            <option value="">Select Tariff</option>
                            <option value="General Tariff">General Tariff</option>
                            <option value="Premium Tariff">Premium Tariff</option>
                            <option value="VIP Tariff">VIP Tariff</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Base Price</label>
                          <input
                            type="number"
                            className="form-control"
                            id="basePrice"
                            onChange={handleInputChange}
                            value={formData.basePrice}
                            readOnly
                          />
                        </div>
                        {formData.visitType === "New" && (
                          <div className="form-group col-md-4 mt-3">
                            <label>Registration Cost</label>
                            <input
                              type="text"
                              className="form-control"
                              id="registrationCost"
                              value={formData.registrationCost}
                              readOnly
                            />
                          </div>
                        )}


                        <div className="form-group col-md-4 mt-3">
                          <label>Discount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="discount"
                            onChange={handleInputChange}
                            value={formData.discount}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Net Amount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="netAmount"
                            value={formData.netAmount}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>GST {gstConfig.gstPercent}%</label>
                          <input
                            type="number"
                            className="form-control"
                            id="gst"
                            value={formData.gst}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Total Amount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="totalAmount"
                            value={formData.totalAmount}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                    Pay Now
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBack}>
                    Cancel
                  </button>
                </div>
              </form>

              {/* Confirm Dialog */}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button
                          type="button"
                          className="close"
                          onClick={() => handleConfirm(false)}
                        >
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to{" "}
                          {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>{formData.patientName || "this patient"}</strong>?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleConfirm(false)}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleConfirm(true)}
                        >
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
  );
};

export default OPDBillingDetails;
