import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MAS_SERVICE_CATEGORY, POLICY_API, UPDATE_PATIENT_STATUS } from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  APPOINTMENT_NOT_FOUND_ERR_MSG,
  ERROR,
  SUCCESS,
  MISSING_MANDOTORY_FIELD,
  MISSING_MANDOTORY_FIELD_MSG,
} from "../../../config/constants";

const OPDBillingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: false,
    gstPercent: 0,
  });

  const [policyInfo, setPolicyInfo] = useState({
    policyName: "",
    policyType: "",
    eligibility: "",
    discountApplied: "",
    remarks: "",
  });

  const [formData, setFormData] = useState({
    patientUhid: "",
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
    billingPolicyId: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [appointmentPolicies, setAppointmentPolicies] = useState({});
  const [loading, setLoading] = useState(false);
  const generateFreePaymentReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FREE${timestamp}${random}`;
  };

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

    const incomingAppointments =
      Array.isArray(data.appointments) && data.appointments.length > 0
        ? data.appointments
        : [];

    // Get details array
    const details = Array.isArray(data.details) ? data.details : [];

    if (incomingAppointments.length === 0) {
      Swal.fire(ERROR, APPOINTMENT_NOT_FOUND_ERR_MSG, "error");
      navigate("/PendingForBilling");
      return;
    }

    const processedAppointments = incomingAppointments.map((appt, idx) => {
      let detail = details[idx] || details[0];

      const visitType = normalizeVisitType(appt.visitType);
      const basePrice = Number(detail?.basePrice || 0);
      const discount = Number(detail?.discount || 0);
      const taxAmount = Number(detail?.taxAmount || 0);
      const detailNetAmount = Number(detail?.netAmount || 0);

      // Calculate registration cost: only for "New" visits
      let registrationCost = 0;
      if (visitType === "New") {
        if (incomingAppointments.length === 1) {
          registrationCost = topLevelRegCost;
        } else {
          const newAppointmentsCount = incomingAppointments.filter(
            (a) => normalizeVisitType(a.visitType) === "New",
          ).length;
          registrationCost =
            newAppointmentsCount > 0
              ? topLevelRegCost / newAppointmentsCount
              : 0;
        }
      }

      // Calculate amounts correctly
      const totalAmount = basePrice - discount + taxAmount; // base - discount + tax
      const netAmount = totalAmount + registrationCost; // total + registration

      return {
        billingHdId: appt.billingHdId || null, // Fixed variable name
        visitId: appt.visitId,
        tokenNo: appt.tokenNo,
        department: appt.department,
        consultedDoctor: appt.consultedDoctor,
        sessionName: appt.sessionName,
        visitDate: appt.visitDate?.split("T")[0] || "",
        visitType,
        room: appt.room || "",
        tariffPlan: "General Tariff",

        basePrice,
        discount,
        gst: taxAmount,
        registrationCost,
        totalAmount, // base - discount + tax
        netAmount, // totalAmount + registrationCost

        rawDetail: detail,

        billingPolicyId: appt.billingPolicyId,
        policyInfo: null,
        isPolicyLoading: false,
      };
    });

    setAppointments(processedAppointments);
    console.log(data);
    setFormData({
      patientName: data.patientName || "",
      mobileNo: data.mobileNo || "",
      age: data.age || "",
      sex: safeSex(data.sex),
      relation: data.relation || "",
      patientId: data.patientid || "",
      address: data.address || "",
      billingType: data.billingType || "Consultation Services",
      billingHeaderIds: Array.isArray(data.billingHeaderIds)
        ? data.billingHeaderIds
        : [data.billingHdId || data.billinghdid].filter(Boolean),
      registrationCost: topLevelRegCost,
      patientUhid: data.patientUhid || "",
      billingPolicyId: data.billingPolicyId,
    });

    processedAppointments.forEach((appointment, index) => {
      if (appointment.billingPolicyId) {
        fetchPolicyForAppointment(appointment.billingPolicyId, index);
      }
    });
  }, [location.state, navigate]);

  async function fetchPolicyForAppointment(policyId, appointmentIndex) {
    try {
      // Set loading state for this appointment
      setAppointments((prev) =>
        prev.map((appt, idx) =>
          idx === appointmentIndex ? { ...appt, isPolicyLoading: true } : appt,
        ),
      );

      const url = `${POLICY_API}/getById/${policyId}`;
      const data = await getRequest(url);

      if (data && data.status === 200) {
        let policyData;

        if (Array.isArray(data.response)) {
          policyData = data.response[0] || data.response[1] || data.response;
        } else if (typeof data.response === "object") {
          policyData = data.response;
        }

        if (policyData) {
          const policyInfo = {
            policyName: policyData.policyCode || policyData.policyName || "N/A",
            policyType:
              policyData.applicableBillingType ||
              policyData.policyType ||
              "N/A",
            eligibility:
              policyData.followupDaysAllowed ||
              policyData.eligibilityDays ||
              "N/A",
            discountApplied: policyData.discountPercentage
              ? `${policyData.discountPercentage}%`
              : policyData.discount || "0%",
            remarks:
              policyData.description || policyData.remarks || "No remarks",
          };

          // Update the specific appointment with policy info
          setAppointments((prev) =>
            prev.map((appt, idx) =>
              idx === appointmentIndex
                ? { ...appt, policyInfo, isPolicyLoading: false }
                : appt,
            ),
          );
        }
      }
    } catch (error) {
      console.error(
        `Error fetching policy for appointment ${appointmentIndex}:`,
        error,
      );

      // Set error state for this appointment
      setAppointments((prev) =>
        prev.map((appt, idx) =>
          idx === appointmentIndex
            ? {
                ...appt,
                policyInfo: {
                  policyName: "Error Loading Policy",
                  policyType: "N/A",
                  eligibility: "N/A",
                  discountApplied: "0%",
                  remarks: "Failed to load policy data",
                },
                isPolicyLoading: false,
              }
            : appt,
        ),
      );
    }
  }

  useEffect(() => {
    if (!appointments || appointments.length === 0 || !gstConfig) return;

    const gstPercent = gstConfig.gstApplicable ? gstConfig.gstPercent : 0;

    const recalculated = appointments.map((appt) => {
      const base = Number(appt.basePrice || 0);
      const discount = Number(appt.discount || 0);
      const taxFromDetail = appt.rawDetail?.taxAmount;
      const gstAmount =
        taxFromDetail !== undefined &&
        taxFromDetail !== null &&
        taxFromDetail > 0
          ? Number(taxFromDetail)
          : 0;
      const reg = Number(appt.registrationCost || 0);

      // Calculate total amount: base - discount + GST
      const totalAmount = Math.max(0, base - discount + gstAmount);
      // Calculate net amount: total + registration
      const netAmount = Math.max(0, totalAmount + reg);

      return {
        ...appt,
        basePrice: Number(base.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        gst: Number(gstAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        registrationCost: Number(reg.toFixed(2)),
        netAmount: Number(netAmount.toFixed(2)),
      };
    });

    setAppointments(recalculated);
  }, [gstConfig]);

  useEffect(() => {
    const hasPatient = !!formData.patientName && !!formData.mobileNo;
    const hasValidAppointments =
      appointments.length > 0 &&
      appointments.every((a) => a.visitDate && a.consultedDoctor);
    setIsFormValid(hasPatient && hasValidAppointments);
  }, [formData.patientName, formData.mobileNo, appointments]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const getEligibilityDisplay = (eligibilityValue) => {
    if (!eligibilityValue && eligibilityValue !== 0) return "N/A";
    const strValue = String(eligibilityValue).trim();
    if (!isNaN(strValue) && strValue !== "") {
      const numValue = Number(strValue);

      if (Number.isInteger(numValue)) {
        return `${numValue} Day${numValue !== 1 ? "s" : ""}`;
      } else {
        return `${numValue.toFixed(1)} Days`;
      }
    }
    return strValue || "N/A";
  };

  const showPaymentConfirmation = (billingHeaderIds, netTotal) => {
    // Calculate other totals for display
    const totalBasePrice = appointments.reduce(
      (sum, a) => sum + Number(a.basePrice || 0),
      0,
    );
    const totalDiscount = appointments.reduce(
      (sum, a) => sum + Number(a.discount || 0),
      0,
    );
    const totalGST = appointments.reduce(
      (sum, a) => sum + Number(a.gst || 0),
      0,
    );
    const totalRegistration = appointments.reduce(
      (sum, a) => sum + Number(a.registrationCost || 0),
      0,
    );

    Swal.fire({
      title: "Confirm Payment",
      html: `
      <div style="text-align: left;">
        <p><strong>Patient:</strong> ${formData.patientName}</p>
        <p><strong>Mobile:</strong> ${formData.mobileNo}</p>
        <hr style="margin: 10px 0;" />
        <p><strong>Payment Summary:</strong></p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0;">Base Price:</td>
            <td style="text-align: right; padding: 4px 0;">₹${totalBasePrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Discount:</td>
            <td style="text-align: right; padding: 4px 0;">- ₹${totalDiscount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">GST:</td>
            <td style="text-align: right; padding: 4px 0;">+ ₹${totalGST.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Registration:</td>
            <td style="text-align: right; padding: 4px 0;">+ ₹${totalRegistration.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 1px solid #ddd; font-weight: bold;">
            <td style="padding: 8px 0; color: #dc3545;">NET AMOUNT:</td>
            <td style="text-align: right; padding: 8px 0; color: #dc3545; font-size: 16px;">
              ₹${netTotal.toFixed(2)}
            </td>
          </tr>
        </table>
        <hr style="margin: 10px 0;" />
        <p><small>Appointments: ${appointments.length}</small></p>
      </div>
    `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: `Pay ₹${netTotal.toFixed(2)}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#28a745",
      width: "450px",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/payment", {
          state: {
            billingType: formData.billingType,
            amount: netTotal,
            patientId: formData.patientId,
            billingHeaderIds: billingHeaderIds,
            registrationCost: formData.registrationCost,
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

  const navigateToSuccessPage = (response, request) => {
    navigate("/opd-payment-success", {
      state: {
        billingType: "Consultation Services",
        amount: request.amount,
        paymentMethod: request.mode,
        paymentReferenceNo: request.paymentReferenceNo,
        patientId: formData.patientId,
        billNo: response?.response?.billNo,
        paymentStatus: response?.response?.paymentStatus,
        paymentResponse: response,
      },
    });
  };

  const handleZeroAmountPayment = async (billingHeaderIds, netTotal) => {
    try {
      setLoading(true);
      Swal.fire({
        title: "Generating Bill",
        text: "Please wait while we generate the bill...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Build payment request for zero amount
      const paymentRequest = {
        billingType: "Consultation Services",
        billHeaderIds: billingHeaderIds,
        opdBillPayments: appointments
          .map((appt) => ({
            billHeaderId: Number(appt.billingHdId),
            netAmount: Number(appt.netAmount || 0),
          }))
          .filter((p) => p.billHeaderId),
        amount: 0,
        mode: "free", // or "cash"
        paymentReferenceNo: generateFreePaymentReference(),
        isPaymentUpdate: true,
        shouldNotCreateNewBilling: true,
        useExistingBillingHeader: true,
        patientId: Number(formData.patientId),
        registrationCost: Number(formData.registrationCost || 0),
      };

      const response = await postRequest(
        `${UPDATE_PATIENT_STATUS}`,
        paymentRequest,
      );

      Swal.close();

      if (response?.status === 200 && response?.response?.msg === "Success") {
        navigateToSuccessPage(response, paymentRequest);
      } else {
        throw new Error(response?.response?.msg || "Failed to generate bill");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.message || "Failed to generate bill. Please try again.",
        "error",
      );
      console.error("Zero amount payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      Swal.fire(
        MISSING_MANDOTORY_FIELD,
        MISSING_MANDOTORY_FIELD_MSG,
        "warning",
      );
      return;
    }

    // Calculate NET TOTAL (sum of all netAmount)
    const netTotal = appointments.reduce(
      (sum, a) => sum + Number(a.netAmount || 0),
      0,
    );

    // Collect all billing header IDs from appointments
    const billingHeaderIds = appointments
      .map((a) => a.billingHdId)
      .filter((id) => id != null);

    if (billingHeaderIds.length === 0) {
      Swal.fire("Error", "No billing header IDs found", "error");
      return;
    }

    // Check if amount is zero
    if (netTotal === 0) {
      // For zero amount, directly call API and navigate to success
      await handleZeroAmountPayment(billingHeaderIds, netTotal);
    } else {
      // For non-zero amount, show payment confirmation
      showPaymentConfirmation(billingHeaderIds, netTotal);
    }
  };

  const handleBack = () => {
    navigate("/PendingForBilling");
  };

  // Calculate totals for display
  const totalBasePrice = appointments.reduce(
    (sum, a) => sum + Number(a.basePrice || 0),
    0,
  );
  const totalDiscount = appointments.reduce(
    (sum, a) => sum + Number(a.discount || 0),
    0,
  );
  const totalGST = appointments.reduce((sum, a) => sum + Number(a.gst || 0), 0);
  const totalRegistration = appointments.reduce(
    (sum, a) => sum + Number(a.registrationCost || 0),
    0,
  );
  const totalAmount = appointments.reduce(
    (sum, a) => sum + Number(a.totalAmount || 0),
    0,
  );
  const grandTotal = appointments.reduce(
    (sum, a) => sum + Number(a.netAmount || 0),
    0,
  );

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OPD Billing Details</h4>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
              >
                <i className="mdi mdi-arrow-left"></i> Back to Pending List
              </button>
            </div>

            <div className="card-body">
              <form className="forms row" onSubmit={handleSave}>
                {/* Patient Details */}
                <div className="col-12 mt-4">
                  <div className="card">
                    <div className="card-header  ">
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
                            value={formData.patientName}
                            readOnly
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
                          <input
                            type="text"
                            className="form-control"
                            id="sex"
                            value={formData.sex}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-4 mt-3">
                          <label>Relation</label>
                          <input
                            type="text"
                            className="form-control"
                            id="relation"
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
                            value={formData.patientUhid}
                            readOnly
                          />
                        </div>
                        <div className="form-group col-md-12 mt-3">
                          <label>Address</label>
                          <textarea
                            className="form-control"
                            id="address"
                            value={formData.address}
                            rows="2"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                {appointments.map((appointment, index) => (
                  <div
                    className="col-12 mt-4"
                    key={appointment.visitId || index}
                  >
                    <div className="card">
                      <div className="card-header   d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="mdi mdi-hospital-building"></i> OPD
                          Visit
                          {appointments.length > 1 ? ` ${index + 1}` : ""}
                          <span className="badge bg-primary ms-2">
                            {appointment.visitType}
                          </span>
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="form-group col-md-3 mt-3">
                            <label>Visit Date</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formatDateDDMMYYYY(appointment.visitDate)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Doctor Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.consultedDoctor}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Department</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.department}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>OPD Session</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.sessionName}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Visit Type</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.visitType}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Token No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.tokenNo || "N/A"}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Room</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.room || "N/A"}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-3 mt-3">
                            <label>Tariff Plan</label>
                            <input
                              type="text"
                              className="form-control"
                              value={appointment.tariffPlan}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing for this appointment */}
                    <div className="card mt-2">
                      <div className="card-header  ">
                        <h5 className="mb-0">
                          <i className="mdi mdi-currency-inr"></i> Billing
                          Policies and Details
                        </h5>
                      </div>
                      <div className="card-body">
                        {appointment.isPolicyLoading ? (
                          <div className="text-center py-3">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading policy...
                              </span>
                            </div>
                            <p className="mt-2">Loading policy details...</p>
                          </div>
                        ) : appointment.policyInfo ? (
                          <>
                            <div className="row">
                              <div className="form-group col-md-4 mt-3">
                                <label>Policy Name</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={appointment.policyInfo.policyName}
                                  readOnly
                                />
                              </div>
                              <div className="form-group col-md-4 mt-3">
                                <label>Policy Type</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={appointment.policyInfo.policyType}
                                  readOnly
                                />
                              </div>
                              <div className="form-group col-md-4 mt-3">
                                <label>Eligibility</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={getEligibilityDisplay(
                                    appointment.policyInfo.eligibility,
                                  )}
                                  readOnly
                                />
                              </div>
                              <div className="form-group col-md-4 mt-3">
                                <label>Discount Applied</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={appointment.policyInfo.discountApplied}
                                  readOnly
                                />
                              </div>
                              <div className="form-group col-md-8 mt-3">
                                <label>Remarks</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={appointment.policyInfo.remarks}
                                  readOnly
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="alert alert-warning">
                            <i className="mdi mdi-alert"></i> No policy
                            information available
                          </div>
                        )}
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
                            <label>GST ({gstConfig.gstPercent}%)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.gst.toFixed(2)}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-2 mt-3">
                            <label>Total (Base-Disc+GST)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={appointment.totalAmount.toFixed(2)}
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
                            <label>
                              <strong>Net Amount</strong>
                            </label>
                            <input
                              type="number"
                              className="form-control  "
                              value={appointment.netAmount.toFixed(2)}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total Summary - Show always, not just when multiple */}
                <div className="col-12 mt-4">
                  <div className="card border-primary">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="mdi mdi-calculator"></i> Grand Total
                        Summary
                      </h5>
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
                          <strong>Total GST:</strong>
                          <p className="mb-0">₹{totalGST.toFixed(2)}</p>
                        </div>
                        <div className="col-md-2">
                          <strong>Total (Base-Disc+GST):</strong>
                          <p className="mb-0">₹{totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="col-md-2">
                          <strong>Registration Cost:</strong>
                          <p className="mb-0">
                            ₹{totalRegistration.toFixed(2)}
                          </p>
                        </div>
                        <div className="col-md-2">
                          <strong className="text-primary">NET AMOUNT:</strong>
                          <h4 className="mb-0 text-primary">
                            ₹{grandTotal.toFixed(2)}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                  {grandTotal === 0 ? (
                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={handleSave}
                      disabled={!isFormValid || loading} // Add loading state
                      style={{ minWidth: "200px" }}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="mdi mdi-file-check"></i> Generate Bill
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button" // Change from submit to button
                      className="btn btn-primary me-2"
                      onClick={handleSave}
                      disabled={!isFormValid}
                      style={{ minWidth: "200px" }}
                    >
                      <i className="mdi mdi-cash"></i> Pay Now - ₹
                      {grandTotal.toFixed(2)}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleBack}
                  >
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
