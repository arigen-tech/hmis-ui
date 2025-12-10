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

  const [formData, setFormData] = useState({
    patientUhid:"",
    billingType: "",
    billingHeaderId: "",
    patientName: "",
    mobileNo: "",
    age: "",
    sex: "",
    relation: "",
    patientId: "",
    address: "",
    registrationCost: 0,
    billingHeaderIds: [],
  });

  const [appointments, setAppointments] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);

  async function fetchGstConfiguration(optionalCategoryId) {
    try {
      optionalCategoryId = 1;
      const url =
        `${MAS_SERVICE_CATEGORY}/getGstConfig/1` +
        (optionalCategoryId ? `?categoryId=${optionalCategoryId}` : "");

      const data = await getRequest(url);
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

  const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

  const safeSex = (sexField) => {
    if (!sexField) return "";
    if (typeof sexField === "string") return sexField;
    if (typeof sexField === "object") {
      return sexField.genderName || sexField.name || sexField.displayName || "";
    }
    return "";
  };

  const normalizeVisitType = (visitType) => {
    if (!visitType) return "New";
    if (visitType === "N") return "New";
    if (visitType === "F") return "Follow-up";
    if (visitType === "E") return "Emergency";
    return visitType;
  };

  useEffect(() => {
    if (!location.state || !location.state.billingData) {
      navigate("/PendingForBilling");
      return;
    }

    const data = location.state.billingData;

    fetchGstConfiguration(data.categoryId || null);

    const topLevelRegCost = Number(data.registrationCost || 0);

    // Build appointments array
    const incomingAppointments = Array.isArray(data.appointments) && data.appointments.length > 0
      ? data.appointments
      : [];

    // Get details array
    const details = Array.isArray(data.details) ? data.details : [];

    if (incomingAppointments.length === 0) {
      Swal.fire("Error", "No appointment data found", "error");
      navigate("/PendingForBilling");
      return;
    }

    const processedAppointments = incomingAppointments.map((appt, idx) => {
      let detail = details[idx] || details[0];

      const visitType = normalizeVisitType(appt.visitType);

      const basePrice = Number(detail?.basePrice || 0);
      const discount = Number(detail?.discount || 0);
      const totalAmount = basePrice-discount;
      const taxAmount = Number(detail?.taxAmount || 0);
      const registrationCost = visitType === "New" ? Number(detail?.registrationCost || 0) : 0;
      const netAmount = Number(detail?.netAmount|| (basePrice + registrationCost + taxAmount));
      

      return {
        billinghdid: appt.billingHdId || null,   // FIXED
        visitId: appt.visitId,
        tokenNo: appt.tokenNo,
        department: appt.department,
        consultedDoctor: appt.consultedDoctor,
        sessionName: appt.sessionName,
        visitDate: appt.visitDate.split("T")[0],
        visitType,
        room: appt.room || "",
        tariffPlan: "General Tariff",

        basePrice,
        discount,
        netAmount,
        gst: taxAmount,
        registrationCost,
        totalAmount,

        rawDetail: detail,
      };
    });


    setAppointments(processedAppointments);

    // Set patient form data
    setFormData({
      patientName: data.patientName || "",
      mobileNo: data.mobileNo || "",
      age: data.age || "",
      sex: safeSex(data.sex),
      relation: data.relation || "",
      patientId: data.patientid || "",
      address: data.address || "",
      billingType: data.billingType || "Consultation Services",
      billingHeaderIds: Array.isArray(data.billingHeaderIds)? data.billingHeaderIds: [data.billingHeaderIds],
      registrationCost: topLevelRegCost,
      patientUhid:data.patientUhid,
    });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!appointments || appointments.length === 0 || !gstConfig) return;

    const gstPercent = gstConfig.gstApplicable ? gstConfig.gstPercent : 0;

    const recalculated = appointments.map((appt) => {
      const base = Number(appt.basePrice || 0);
      const discount = Number(appt.discount || 0);
      const taxFromDetail = appt.rawDetail?.taxAmount;
      const gstAmount = (taxFromDetail !== undefined && taxFromDetail !== null && taxFromDetail > 0) ? Number(taxFromDetail) : (net * gstPercent) / 100;
      const reg = Number(appt.registrationCost || 0);
      const net = Number(appt.rawDetail?.netAmount + reg || Math.max(0, base + reg + gstAmount));
      const total = base-discount;

      return {
        ...appt,
        netAmount: Number(net.toFixed(2)),
        gst: Number(gstAmount.toFixed(2)),
        totalAmount: net,
      };
    });

    setAppointments(recalculated);
  }, [gstConfig]);

  useEffect(() => {
    const hasPatient = !!formData.patientName && !!formData.mobileNo;
    const hasValidAppointments = appointments.length > 0 &&
      appointments.every(a => a.visitDate && a.consultedDoctor);
    setIsFormValid(hasPatient && hasValidAppointments);
  }, [formData.patientName, formData.mobileNo, appointments]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!isFormValid) {
      Swal.fire("Missing Information", "Please ensure all required fields are filled", "warning");
      return;
    }

    const totalAmount = appointments.reduce((sum, appt) => sum + Number(appt.totalAmount || 0), 0) ;


    Swal.fire({
      title: 'Confirm Payment',
      html: `
      <p>Patient: <strong>${formData.patientName}</strong></p>
      <p>Total Amount: <strong>₹${totalAmount.toFixed(2)}</strong></p>
      <p>Appointments: <strong>${appointments.length}</strong></p>
    `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Proceed to Pay',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/payment", {
          state: {
            billingType: formData.billingType,
            amount: totalAmount,
            patientId: formData.patientId,
            billingHeaderIds: formData.billingHeaderIds,
            opdData: {
              patient: formData,
              appointments,
              gstConfig,
            },
          },
        });
      }
    });
  };


  const handleBack = () => {
    navigate("/PendingForBilling");
  };

  // Calculate totals for display
  const totalBasePrice = appointments.reduce((sum, a) => sum + Number(a.basePrice || 0), 0);
  const totalDiscount = appointments.reduce((sum, a) => sum + Number(a.discount || 0), 0);
  const totalAmount = appointments.reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);
  const totalGST = appointments.reduce((sum, a) => sum + Number(a.gst || 0), 0);
  const totalRegistration = appointments.reduce((sum, a) => sum + Number(a.registrationCost || 0), 0);
  const grandTotal = appointments.reduce((sum, a) => sum + Number(a.netAmount || 0), 0);

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
                {/* Patient Details */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header bg-light">
                      <h5 className="mb-0"><i className="mdi mdi-account"></i> Patient Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="form-group col-md-4 mt-3">
                          <label>Patient Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            value={formData.patientName}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Mobile No. <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNo"
                            value={formData.mobileNo}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Age</label>
                          <input
                            type="text"
                            className="form-control"
                            id="age"
                            value={formData.age}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Sex</label>
                          <input type="text" className="form-control" id="sex" value={formData.sex} readOnly />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Relation</label>
                          <input type="text" className="form-control" id="relation" value={formData.relation} readOnly />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Patient ID</label>
                          <input type="text" className="form-control" id="patientId" value={formData.patientUhid} readOnly />
                        </div>
                        <div className="form-group col-md-12 mt-3">
                          <label>Address</label>
                          <textarea className="form-control" id="address" value={formData.address} rows="2" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                {appointments.map((appointment, index) => (
                  <div className="col-12 mt-4" key={appointment.visitId || index}>
                    <div className="card">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="mdi mdi-hospital-building"></i> OPD Visit
                          {appointments.length > 1 ? ` ${index + 1}` : ""}
                          <span className="badge bg-primary ms-2">{appointment.visitType}</span>
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="form-group col-md-3 mt-3">
                            <label>Visit Date</label>
                            <input type="text" className="form-control" value={formatDateDDMMYYYY(appointment.visitDate)} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Doctor Name</label>
                            <input type="text" className="form-control" value={appointment.consultedDoctor} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Department</label>
                            <input type="text" className="form-control" value={appointment.department} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>OPD Session</label>
                            <input type="text" className="form-control" value={appointment.sessionName} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Visit Type</label>
                            <input type="text" className="form-control" value={appointment.visitType} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Token No</label>
                            <input type="text" className="form-control" value={appointment.tokenNo || "N/A"} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Room</label>
                            <input type="text" className="form-control" value={appointment.room || "N/A"} readOnly />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Tariff Plan</label>
                            <input type="text" className="form-control" value={appointment.tariffPlan} readOnly />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing for this appointment */}
                    <div className="card mt-2">
                      <div className="card-header bg-light">
                        <h5 className="mb-0"><i className="mdi mdi-currency-inr"></i> Billing Details</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="form-group col-md-2 mt-3">
                            <label>Base Price</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.basePrice.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label>Discount</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.discount.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label>Total</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.totalAmount.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label>GST ({gstConfig.gstPercent}%)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.gst.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label>Registration</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.registrationCost.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label><strong>Net Amount</strong></label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.netAmount.toFixed(2)}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total Summary */}
                {appointments.length > 1 && (
                  <div className="col-12 mt-4">
                    <div className="card border-primary">
                      <div className="card-header bg-primary text-white">
                        <h5 className="mb-0"><i className="mdi mdi-calculator"></i> Grand Total Summary</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-2">
                            <strong>Total Base:</strong>
                            <p className="mb-0">₹{totalBasePrice.toFixed(2)}</p>
                          </div>
                          <div className="col-md-2">
                            <strong>Total Discount:</strong>
                            <p className="mb-0">₹{totalDiscount.toFixed(2)}</p>
                          </div>
                          <div className="col-md-2">
                            <strong>Total:</strong>
                            <p className="mb-0">₹{totalAmount.toFixed(2)}</p>
                          </div>
                          <div className="col-md-2">
                            <strong>Total GST:</strong>
                            <p className="mb-0">₹{totalGST.toFixed(2)}</p>
                          </div>
                          <div className="col-md-2">
                            <strong>Registration Cost:</strong>
                            <p className="mb-0">₹{totalRegistration.toFixed(2)}</p>
                          </div>
                          <div className="col-md-2">
                            <strong className="text-primary">Grand Net Total:</strong>
                            <h4 className="mb-0 text-primary">₹{grandTotal.toFixed(2)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                    <i className="mdi mdi-cash"></i> Pay Now - ₹{grandTotal.toFixed(2)}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBack}>
                    <i className="mdi mdi-close"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPDBillingDetails;