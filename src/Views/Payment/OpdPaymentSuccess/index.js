import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import {
  ALL_REPORTS,
  OPD_INVOICE_API,
  OPD_SERVICE_CATAGORY,
  RADIOLOGY_SERVICE_CATAGORY,
} from "../../../config/apiConfig";
import { useEffect } from "react";

const OpdPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    generating: null, 
    printing: null, 
    allBills: false,
  });

  const {
    amount = 0,
    paymentResponse,
    source,
    billingType,
  } = state;
  const paymentResponseData = paymentResponse?.response || {};
  const requestBillPayments = Array.isArray(state.opdBillPayments)
    ? state.opdBillPayments
    : Array.isArray(state.paymentRequest?.opdBillPayments)
      ? state.paymentRequest.opdBillPayments
      : [];
  const visitRowsFromAppointments = Array.isArray(state.opdData?.appointments)
    ? state.opdData.appointments.map((appt) => ({
        visitId: appt.visitId ?? appt.id,
        tokenNo: appt.tokenNo ?? appt.tokenNumber ?? "N/A",
        doctorName:
          appt.doctorName ??
          appt.consultedDoctor ??
          appt.consultedDoctorName ??
          "N/A",
        patientName:
          appt.patientName ??
          state.patientName ??
          state.opdData?.patient?.patientName ??
          "N/A",
        netAmount: Number(appt.netAmount ?? appt.amount ?? 0),
        billHeaderId:
          appt.billHeaderId ??
          appt.billingHdId ??
          appt.billinghdid ??
          appt.billingHeaderId ??
          null,
      }))
    : [];
  const billPayments = Array.isArray(paymentResponseData.billPayments) &&
    paymentResponseData.billPayments.length > 0
      ? paymentResponseData.billPayments
      : requestBillPayments;
  const visitData = Array.isArray(state.visits) && state.visits.length > 0
    ? state.visits
    : Array.isArray(paymentResponseData.visits) && paymentResponseData.visits.length > 0
      ? paymentResponseData.visits
      : visitRowsFromAppointments;
  const receiptSourceRows = billPayments.length > 0 ? billPayments : visitData;
  const receiptRows = receiptSourceRows.map((row, index) => {
    const mergedRow = {
      ...(visitData[index] || {}),
      ...(billPayments[index] || {}),
      ...row,
    };

    return {
      ...mergedRow,
      visitId: mergedRow.visitId ?? mergedRow.id,
      tokenNo: mergedRow.tokenNo ?? mergedRow.tokenNumber ?? "N/A",
      doctorName:
        mergedRow.doctorName ?? mergedRow.consultedDoctorName ?? "N/A",
      patientName: mergedRow.patientName ?? state.patientName ?? "N/A",
      netAmount: Number(mergedRow.netAmount ?? mergedRow.amount ?? 0),
      billHeaderId:
        mergedRow.billHeaderId ?? mergedRow.billingHdId ?? mergedRow.billinghdid ?? null,
    };
  });
  const hasBillingData =
    state.hasBillingData ??
    receiptRows.some((bp) => bp.billHeaderId != null || bp.billingHdId != null);
  const isBillingAvailable =
    hasBillingData &&
    receiptRows.some((bp) => bp.billHeaderId != null || bp.billingHdId != null);
  const showBillActions = isBillingAvailable && receiptRows.length > 0;
  const isOpdBilling =
    billingType === OPD_SERVICE_CATAGORY || billingType === "Consultation Services";

  const setLoading = (type, value) => {
    setLoadingStates((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const BILLING_ROUTES = {
    opd: "/OPDBillingDetails",
    lab: "/LabBillingDetails",
    radiology: "/RadiologyBillingDetails",
  };

  const getBackRoute = () => {
    if (!location.state) {
      return "/OPDBillingDetails"; // fallback
    }

    if (source === "followup-update") {
      return "/AppointmentForFollowUpPatient";
    }

    if (source === "registration") {
      return "/NewPatientAppointment";
    }

    if (isOpdBilling) {
      return BILLING_ROUTES.opd;
    }

    if (billingType === RADIOLOGY_SERVICE_CATAGORY) {
      return BILLING_ROUTES.radiology;
    }

    return BILLING_ROUTES.lab;
  };

  // Generic function to generate report
  const generateReport = async (visitId, receiptType = "bill", flag = "d") => {
    if (!visitId) {
      alert(`Missing visit ID for generating ${receiptType} receipt`);
      return;
    }

    setLoading("generating", `${receiptType}-${visitId}`);
    setPdfUrl(null);

    try {
      const endpoint = receiptType === "token" ? "opdToken" : "opdInvoice";
      const url = `${ALL_REPORTS}/${endpoint}?visit=${visitId}&flag=${flag}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${receiptType} receipt`);
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
    } catch (err) {
      console.error(`Error generating ${receiptType} receipt`, err);
      alert(`Failed to generate ${receiptType} receipt`);
    } finally {
      setLoading("generating", null);
    }
  };

  // Generic function to print
  const handlePrint = async (visitId, receiptType = "bill") => {
    if (!visitId) {
      alert(`Missing visit ID for printing ${receiptType} receipt`);
      return;
    }

    setLoading("printing", `${receiptType}-${visitId}`);

    try {
      const endpoint = receiptType === "token" ? "opdToken" : "opdInvoice";
      const url = `${ALL_REPORTS}/${endpoint}?visit=${visitId}&flag=p`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (response.status === 200) {
        // Success
      } else {
        alert(`Failed to print ${receiptType} receipt`);
      }
    } catch (error) {
      console.error(`Error printing ${receiptType} receipt`, error);
      alert(`Failed to print ${receiptType} receipt`);
    } finally {
      setLoading("printing", null);
    }
  };

  // View/Download functions
  const handleViewDownloadToken = (visitId) => {
    generateReport(visitId, "token", "d");
  };

  const handleViewDownloadBill = (visitId) => {
    generateReport(visitId, "bill", "d");
  };

  // Print functions
  const handlePrintToken = (visitId) => {
    handlePrint(visitId, "token");
  };

  const handlePrintBill = (visitId) => {
    handlePrint(visitId, "bill");
  };

  // Download all billing receipts
  const downloadAllBillingReceipts = async () => {
    setLoading("allBills", true);

    try {
      for (const bp of receiptRows.filter(
        (row) => row.billHeaderId != null || row.billingHdId != null,
      )) {
        const url = `${OPD_INVOICE_API}?visit=${bp.visitId}&flag=d`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/pdf" },
        });

        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `Opd_Receipt_${bp.billHeaderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        }
      }
    } catch (err) {
      console.error("Error downloading all receipts", err);
      alert("Failed to download some receipts");
    } finally {
      setLoading("allBills", false);
    }
  };

  useEffect(() => {
    const handleBack = () => {
      navigate(getBackRoute(), { replace: true });
    };

    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [source, billingType, navigate]);

  // Print all billing receipts
  const printAllBillingReceipts = async () => {
    setLoading("printing", "all-bills");

    try {
      for (const bp of receiptRows.filter(
        (row) => row.billHeaderId != null || row.billingHdId != null,
      )) {
        const url = `${OPD_INVOICE_API}?visit=${bp.visitId}&flag=p`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/pdf" },
        });

        if (!response.ok) {
          console.error(`Failed to print receipt for visit ${bp.visitId}`);
        }
      }
    } catch (err) {
      console.error("Error printing all receipts", err);
      alert("Failed to print some receipts");
    } finally {
      setLoading("printing", null);
    }
  };

  const getBackLabel = () => {
    if (source === "registration") {
      return "Back to Registration";
    }

    if (isOpdBilling) {
      return "Back to OPD Billing";
    }

    if (billingType === RADIOLOGY_SERVICE_CATAGORY) {
      return "Back to Radiology Billing";
    }

    return "Back to Lab Billing";
  };

  // Check if a specific button is loading
  const isGenerating = (visitId, type) =>
    loadingStates.generating === `${type}-${visitId}`;

  const isPrinting = (visitId, type) =>
    loadingStates.printing === `${type}-${visitId}`;

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="text-center mb-4">
          <h3 className="fw-bold text-primary">Booking Confirmation</h3>
        </div>

        <div className="row">
          <div className="col-lg-10 col-xl-8 mx-auto">
            <div className="card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div
                    className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "100px", height: "100px" }}
                  >
                    <i
                      className="fa fa-check-circle text-success"
                      style={{ fontSize: "3.5rem" }}
                    ></i>
                  </div>
                  <h4 className="mt-3 fw-bold text-success">
                    {showBillActions ? "Payment Successful!" : "Token Generated Successfully"}
                  </h4>
                  <p className="text-muted mb-0">
                    {showBillActions
                      ? "Your payment has been processed successfully"
                      : "Billing details were not generated. You can download the token slip only."}
                  </p>
                </div>

                <div className="border border-success border-2 rounded-3 p-3 mb-4 text-center">
  <p className="text-muted mb-1 small">{showBillActions ? "Total Amount Paid" : "Token Slip Generated"}</p>
  <h2 className="text-success fw-bold mb-0">
    {showBillActions ? `Rs. ${amount.toFixed(2)}` : "Token Only"}
  </h2>
</div>

                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fa fa-calendar-check text-primary me-2"></i>
                    <h5 className="mb-0 fw-bold">OPD Appointment Details</h5>
                  </div>

                  {receiptRows.map((bp, index) => (
                    <div
                      key={index}
                      className="card border border-primary mb-3 shadow-sm"
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold text-primary mb-2">
                              <i className="fa fa-file-medical me-2"></i>
                              Appointment #{index + 1}
                            </h6>
                          </div>
                          <span className={showBillActions ? "badge bg-success" : "badge bg-warning text-dark"}>{showBillActions ? "Paid" : "Token Ready"}</span>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-hashtag text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">
                                  Token No
                                </small>
                                <strong>{bp.tokenNo}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-user-md text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">
                                  Doctor Name
                                </small>
                                <strong>{bp.doctorName}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-user text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">
                                  Patient Name
                                </small>
                                <strong>{bp.patientName}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="d-flex align-items-start">
                              <i className="fa fa-rupee-sign text-muted me-2 mt-1"></i>
                              <div>
                                <small className="text-muted d-block">
                                  Amount Paid
                                </small>
                                <strong className="text-success">
                                  ₹{bp.netAmount.toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="my-3" />

                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                          {/* Token Buttons */}
                          <div className="d-flex flex-column align-items-center gap-2">
                            <button
                              className="btn btn-primary d-flex align-items-center gap-2"
                              onClick={() =>
                                handleViewDownloadToken(bp.visitId)
                              }
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isGenerating(bp.visitId, "token") ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-eye"></i> View/Download
                                  Token
                                </>
                              )}
                            </button>

                            <button
                              className="btn btn-warning d-flex align-items-center gap-2"
                              onClick={() => handlePrintToken(bp.visitId)}
                              disabled={loadingStates.generating || loadingStates.printing}
                            >
                              {isPrinting(bp.visitId, "token") ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                  Printing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-print"></i> Print Token
                                </>
                              )}
                            </button>
                          </div>

                          {/* Bill Buttons */}
                          <div className="d-flex flex-column align-items-center gap-2">
                            <button
                              className="btn btn-success d-flex align-items-center gap-2"
                              onClick={() => handleViewDownloadBill(bp.visitId)}
                              disabled={!showBillActions || loadingStates.generating || loadingStates.printing}
                            >
                              {isGenerating(bp.visitId, "bill") ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-eye"></i> View/Download
                                  Bill
                                </>
                              )}
                            </button>

                            <button
                              className="btn btn-warning d-flex align-items-center gap-2"
                              onClick={() => handlePrintBill(bp.visitId)}
                              disabled={!showBillActions || loadingStates.generating || loadingStates.printing}
                            >
                              {isPrinting(bp.visitId, "bill") ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                  Printing...
                                </>
                              ) : (
                                <>
                                  <i className="fa fa-print"></i> Print Bill
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-center gap-3 flex-wrap pt-3 border-top">
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={downloadAllBillingReceipts}
                    disabled={!showBillActions || loadingStates.allBills || loadingStates.generating || loadingStates.printing}
                  >
                    {loadingStates.allBills ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-file-invoice me-2"></i>
                        Download All Bills
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-warning d-flex align-items-center gap-2"
                    onClick={printAllBillingReceipts}
                    disabled={!showBillActions || loadingStates.printing === "all-bills" || loadingStates.generating || loadingStates.printing}
                  >
                    {loadingStates.printing === "all-bills" ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                        Printing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-print me-2"></i>
                        Print All Bills
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary d-flex align-items-center gap-2"
                    onClick={() => navigate(getBackRoute())}
                  >
                    <i className="fa fa-arrow-left me-2"></i>
                    {getBackLabel()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          name="OPD Receipt"
          onClose={() => setPdfUrl(null)}
        />
      )}
    </div>
  );
};

export default OpdPaymentSuccess;
