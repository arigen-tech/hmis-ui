import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import DatePicker from "../../../Components/DatePicker";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import {
  GET_ALL_REASONS,
  GET_APPOINTMENT_HISTORY,
  GET_AVAILABILITY_TOKENS,
  GET_SESSION,
  CANCEL_APPOINTMENT,
  GET_DOCTOR_SESSION,
  RESCHEDULE_APPOINTMENT,
} from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService";
import {MISSING_MOBILE_NUMBER, NO_DATA_FOUND} from "../../../config/constants";


// Helper functions
const formatTimeToHHMM = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes('T')) {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  return timeString.substring(0, 5);
};

const formatAppointmentTime = (start, end) => {
  if (!start || !end) return "N/A";

  const startTime = formatTimeToHHMM(start);
  const endTime = formatTimeToHHMM(end);

  return `${startTime}-${endTime}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return "";
  }
};

const BookingAppointmentHistory = () => {
  // UI States
  const [mobileNumber, setMobileNumber] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportData, setReportData] = useState([]);

  // Reschedule Popup States
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    department: "",
    doctor: "",
    date: "",
    session: "",
    doctorName: "",
    departmentName: "",
    sessionName: "",
  });
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Cancel Popup States
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [patientToCancel, setPatientToCancel] = useState(null);

  // Functionality States
  const [newDate, setNewDate] = useState("");
  const [newSession, setNewSession] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchCancellationReasons();
  }, []);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const data = await getRequest(`${GET_SESSION}1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSessions(data.response);
      } else {
        console.error("Invalid response format:", data);
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  };

  // Fetch cancellation reasons
  const fetchCancellationReasons = async () => {
    setLoadingReasons(true);
    try {
      const data = await getRequest(`${GET_ALL_REASONS}/1`);

      if (data.status === 200) {
        let reasonsArray = [];
        if (Array.isArray(data.response)) {
          reasonsArray = data.response;
        } else if (data.response && Array.isArray(data.response.data)) {
          reasonsArray = data.response.data;
        }
        const activeReasons = reasonsArray.filter(
          (reason) =>
            reason &&
            (reason.status === "Y" ||
              reason.status === true ||
              reason.status === 1)
        );

        setCancellationReasons(activeReasons);
      } else {
        console.error("API Error:", data.message);
        setCancellationReasons([]);
      }
    } catch (error) {
      console.error("Error fetching cancellation reasons:", error);
      setCancellationReasons([]);
    } finally {
      setLoadingReasons(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // Search appointments
  const handleSearch = async () => {
    if (!mobileNumber.trim()) {
      showPopup(`${MISSING_MOBILE_NUMBER}`);
      return;
    }

    if (mobileNumber.trim() && !/^\d{10}$/.test(mobileNumber.trim())) {
      showPopup("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setIsGenerating(true);
    setShowReport(false);

    try {
      const res = await getRequest(`${GET_APPOINTMENT_HISTORY}?flag=0&mobileNo=${mobileNumber}`);

      if (res.status === 200) {
        const appointments = res.response?.appointments || res.response?.data || res.response || [];

        if (!appointments || appointments.length === 0) {
          setReportData([]);
          setShowReport(true);
          showPopup("No appointments found for this mobile number", "info");
          return;
        }

        // Transform data to match UI
        const transformedData = appointments.map((appointment, index) => {
          const appointmentSlot = formatAppointmentTime(
            appointment.appointmentStartTime,
            appointment.appointmentEndTime
          );

          return {
            id: appointment.id || appointment.appointmentId || appointment.visitId || index + 1,
            patientName: appointment.patientName || appointment.name || "Unknown",
            mobileNumber: appointment.mobileNo || appointment.mobileNumber || appointment.phone || mobileNumber.trim(),
            patientAge: appointment.age || appointment.patientAge || "N/A",
            appointmentDate: appointment.appointmentDate ? formatDateForDisplay(appointment.appointmentDate) : "N/A",
            doctorName: appointment.doctorName || "Unknown Doctor",
            departmentName: appointment.departmentName || appointment.speciality || "N/A",
            appointmentSlot: appointmentSlot,
            originalDoctorId: appointment.doctorId || 0,
            originalDepartmentId: appointment.departmentId || 0,
            originalDate: appointment.appointmentDate ? appointment.appointmentDate.split("T")[0] : "",
            originalSessionId: appointment.sessionId || 0,
            visitId: appointment.visitId,
            tokenNo: appointment.tokenNo,
            doctorId: appointment.doctorId,
            departmentId: appointment.departmentId,
            displayDate: formatDateForDisplay(appointment.appointmentDate),
            displayTime: appointmentSlot,
            shortDate: appointment.appointmentDate?.split("T")[0]
          };
        });

        setReportData(transformedData);
        setShowReport(true);
      } else {
        setReportData([]);
        setShowReport(true);
        showPopup(res.message || `${NO_DATA_FOUND}`, "info");
      }
    } catch (error) {
      console.error("Error:", error);
      setReportData([]);
      setShowReport(true);
      showPopup("Error fetching data. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check session validity
  const checkSession = async (doctorId, deptId, sessionId) => {
    if (!doctorId || !deptId || !sessionId) return true;
    try {
      const res = await getRequest(
        `${GET_DOCTOR_SESSION}deptId=${deptId}&doctorId=${doctorId}&rosterDate=${new Date().toISOString().split("T")[0]}&sessionId=${sessionId}`
      );
      if (res.status !== 200) {
        Swal.fire({
          icon: "warning",
          title: "Session Not Available",
          text: res.message || "This session is not available.",
          timer: 2000,
        });
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  // Open Reschedule Popup
  const handleReschedule = (patientData) => {
    setSelectedPatient(patientData);

    // Set initial data from existing appointment
    const initialDate = patientData.shortDate || getTodayDate();

    setRescheduleData({
      department: patientData.departmentName,
      doctor: patientData.doctorName,
      date: initialDate,
      session: patientData.originalSessionId || "",
      doctorName: patientData.doctorName,
      departmentName: patientData.departmentName,
      sessionName: sessions.find((s) => s.id == patientData.originalSessionId)?.sessionName || "",
    });

    setNewDate(initialDate);
    setNewSession(patientData.originalSessionId || "");
    setSelectedSlot(null);
    setSelectedToken(null);
    setShowTimeSlots(false);
    setAvailableTokens([]);
    setShowReschedulePopup(true);
  };

  // Open Cancel Popup
  const handleCancel = (patientData) => {
    setPatientToCancel(patientData);
    setSelectedReason("");
    setShowCancelPopup(true);
  };

  // Handle Date Change in Reschedule
  const handleDateChange = async (date) => {
    if (!date) return;
    const selectedDate = new Date(date);
    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date",
        text: "You cannot select a past date",
        timer: 2000,
      });
      return;
    }

    setRescheduleData((prev) => ({
      ...prev,
      date: date,
    }));

    setNewDate(date);
    setSelectedSlot(null);
    setSelectedToken(null);
    setShowTimeSlots(false);

    if (newSession && selectedPatient) {
      await fetchTokensForDate(date);
    }
  };

  // Handle Session Change in Reschedule
  const handleSessionChange = async (sessionId) => {
    if (!selectedPatient) return;

    const session = sessions.find((s) => s.id == sessionId);
    setRescheduleData((prev) => ({
      ...prev,
      session: sessionId,
      sessionName: session ? session.sessionName : "",
    }));

    const valid = await checkSession(
      selectedPatient.doctorId,
      selectedPatient.departmentId,
      sessionId
    );

    if (valid) {
      setNewSession(String(sessionId));
      setSelectedSlot(null);
      setSelectedToken(null);
      setShowTimeSlots(false);

      // Automatically fetch tokens if date is already selected
      if (newDate) {
        await fetchTokensForSession(sessionId);
      }
    } else {
      setNewSession("");
      setSelectedSlot(null);
      setSelectedToken(null);
      setShowTimeSlots(false);
    }
  };

  // Fetch tokens for selected date
  const fetchTokensForDate = async (date) => {
    if (!selectedPatient || !newSession) return;

    setLoadingTokens(true);
    setIsFetchingTokens(true);

    try {
      const params = new URLSearchParams({
        deptId: selectedPatient.departmentId,
        doctorId: selectedPatient.doctorId,
        appointmentDate: date,
        sessionId: newSession
      });

      const res = await getRequest(`${GET_AVAILABILITY_TOKENS}?${params}`);

      if (res.status === 200 && Array.isArray(res.response)) {
        setAvailableTokens(res.response);
        setShowTimeSlots(true);
      } else {
        Swal.fire({
          icon: "info",
          title: "No Tokens Available",
          text: res.message || "No tokens available for the selected criteria.",
          timer: 2000,
        });
        setAvailableTokens([]);
        setShowTimeSlots(false);
      }
    } catch (error) {
      console.error("Error fetching token availability:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch token availability. Please try again.",
        timer: 2000,
      });
      setAvailableTokens([]);
      setShowTimeSlots(false);
    } finally {
      setLoadingTokens(false);
      setIsFetchingTokens(false);
    }
  };

  // Fetch tokens for selected session
  const fetchTokensForSession = async (sessionId) => {
    if (!selectedPatient || !newDate) return;

    setLoadingTokens(true);
    setIsFetchingTokens(true);

    try {
      const params = new URLSearchParams({
        deptId: selectedPatient.departmentId,
        doctorId: selectedPatient.doctorId,
        appointmentDate: newDate,
        sessionId: sessionId
      });

      const res = await getRequest(`${GET_AVAILABILITY_TOKENS}?${params}`);

      if (res.status === 200 && Array.isArray(res.response)) {
        setAvailableTokens(res.response);
        setShowTimeSlots(true);
      } else {
        Swal.fire({
          icon: "info",
          title: "No Tokens Available",
          text: res.message || "No tokens available for the selected criteria.",
          timer: 2000,
        });
        setAvailableTokens([]);
        setShowTimeSlots(false);
      }
    } catch (error) {
      console.error("Error fetching token availability:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch token availability. Please try again.",
        timer: 2000,
      });
      setAvailableTokens([]);
      setShowTimeSlots(false);
    } finally {
      setLoadingTokens(false);
      setIsFetchingTokens(false);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token) => {
    const startHHMM = formatTimeToHHMM(token.startTime);
    const endHHMM = formatTimeToHHMM(token.endTime);
    const slot = `${startHHMM}-${endHHMM}`;

    setSelectedSlot({
      tokenNo: token.tokenNo,
      start: startHHMM,
      end: endHHMM,
      slot
    });

    setSelectedToken({
      tokenNo: token.tokenNo,
      tokenStartTime: token.startTime,
      tokenEndTime: token.endTime,
      timeSlot: slot
    });

    Swal.fire({
      icon: "success",
      title: "Time Slot Selected",
      text: `Time slot ${startHHMM} to ${endHHMM} has been selected.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Submit Reschedule
  const submitReschedule = async () => {
    if (!selectedSlot && !selectedToken) {
      Swal.fire({
        icon: "warning",
        title: "No Time Slot Selected",
        text: "Please select a time slot first.",
        timer: 2000,
      });
      return;
    }

    const slotToUse = selectedSlot || selectedToken;

    const result = await Swal.fire({
      title: "Confirm Reschedule",
      html: `
        <p>Reschedule ${selectedPatient.patientName} to ${newDate} at ${slotToUse.slot}?</p>
        <p><strong>Current:</strong> ${selectedPatient.displayDate} at ${selectedPatient.displayTime}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Reschedule",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      Swal.showLoading();
      try {
        // Correctly create ISO strings for the backend
        const appointmentDateInstant = new Date(newDate).toISOString();
        const startTimeInstant = new Date(`${newDate}T${slotToUse.start}:00`).toISOString();
        const endTimeInstant = new Date(`${newDate}T${slotToUse.end}:00`).toISOString();

        const reschedulePayload = {
          visitId: selectedPatient.visitId,
          tokenNumber: slotToUse.tokenNo,
          sessionId: parseInt(newSession, 10),
          visitDate: appointmentDateInstant,
          appointmentStartTime: startTimeInstant,
          appointmentEndTime: endTimeInstant
        };

        const res = await postRequest(RESCHEDULE_APPOINTMENT, reschedulePayload);

        if (res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Appointment rescheduled successfully.",
            timer: 2000,
          });
          setShowReschedulePopup(false);
          setSelectedToken(null);
          setSelectedSlot(null);
          setShowTimeSlots(false);
          setAvailableTokens([]);
          handleSearch(); // Refresh the list
        } else {
          throw new Error(res.message || "Server error");
        }
      } catch (error) {
        console.error("Reschedule failed:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Reschedule failed.",
          timer: 2000,
        });
      }
    }
  };

  // Submit Cancellation
  const submitCancellation = async () => {
    if (!selectedReason) {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please select a cancellation reason.",
        timer: 2000,
      });
      return;
    }

    // Get the full reason object
    const selectedReasonObj = cancellationReasons.find(r => {
      const reasonId = r.id || r.reasonId || r.reasonCode;
      return String(reasonId) === String(selectedReason);
    });

    const reasonName = selectedReasonObj?.reasonName || selectedReasonObj?.name || "Unknown";

    const result = await Swal.fire({
      title: "Confirm Cancellation",
      html: `
        <div class="text-start">
          <p>Cancel appointment for <strong>${patientToCancel.patientName}</strong>?</p>
          <div class="alert alert-warning p-2">
            <p class="mb-0"><strong>Reason:</strong> ${reasonName}</p>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No",
      confirmButtonColor: "#dc3545",
    });

    if (result.isConfirmed) {
      Swal.showLoading();
      try {
        const cancelRequest = {
          visitId: patientToCancel.visitId,
          cancelReasonId: parseInt(selectedReason, 10),
          cancelledBy: "SYSTEM",
          cancelledDateTime: new Date().toISOString(),
        };

        const res = await postRequest(CANCEL_APPOINTMENT, cancelRequest);

        if (res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Cancelled",
            text: "Appointment cancelled successfully",
            timer: 2000,
          });
          setShowCancelPopup(false);
          setSelectedReason("");
          setPatientToCancel(null);
          handleSearch();
        } else {
          throw new Error(res.message || "Server error");
        }
      } catch (error) {
        console.error("Cancellation failed:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Cancellation failed",
          timer: 2000,
        });
      }
    }
  };

  // Pagination
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = reportData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Reschedule Appointment or Cancel Appointment
              </h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Mobile Number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    maxLength="10"
                  />
                </div>

                <div className="col-md-4 d-flex align-items-end">
                  <button
                    className="btn btn-success"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {showReport && !isGenerating && reportData.length > 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
                            Reschedule Appointment or Cancel Appointment
                          </h5>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                              <tr>
                                <th>Patient Name</th>
                                <th>Mobile Number</th>
                                <th>Patient Age</th>
                                <th>Doctor Name</th>
                                <th>Department Name</th>
                                <th>Appointment Date</th>
                                <th>Appointment Slot</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.map((row, index) => (
                                <tr key={index}>
                                  <td>{row.patientName}</td>
                                  <td>{row.mobileNumber}</td>
                                  <td>{row.patientAge}</td>
                                  <td>{row.doctorName}</td>
                                  <td>{row.departmentName}</td>
                                  <td>{row.appointmentDate}</td>
                                  <td>{row.appointmentSlot}</td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleReschedule(row)}
                                      >
                                        Reschedule
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleCancel(row)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {reportData.length > DEFAULT_ITEMS_PER_PAGE && (
                          <Pagination
                            totalItems={reportData.length}
                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showReport && !isGenerating && reportData.length === 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-info">
                      No appointment records found for the selected criteria.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Popup Modal */}
      {showReschedulePopup && selectedPatient && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Reschedule Appointment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowReschedulePopup(false);
                    setSelectedToken(null);
                    setSelectedSlot(null);
                    setLoadingTokens(false);
                    setShowTimeSlots(false);
                    setAvailableTokens([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0 fw-bold">Patient Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p>
                          <strong>Patient:</strong> {selectedPatient.patientName}
                        </p>
                        <p>
                          <strong>Mobile:</strong> {selectedPatient.mobileNumber}
                        </p>
                        <p>
                          <strong>Age:</strong> {selectedPatient.patientAge}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Current Date:</strong> {selectedPatient.appointmentDate}
                        </p>
                        <p>
                          <strong>Current Slot:</strong> {selectedPatient.appointmentSlot}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0 fw-bold">New Appointment Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {/* Fixed Department (Read-only) */}
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={rescheduleData.departmentName}
                          readOnly
                        />
                      </div>

                      {/* Fixed Doctor (Read-only) */}
                      <div className="col-md-6">
                        <label className="form-label">Doctor</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={rescheduleData.doctorName}
                          readOnly
                        />
                      </div>

                      {/* Session Selection */}
                      <div className="col-md-6">
                        <label className="form-label">Session</label>
                        <select
                          className="form-select"
                          value={rescheduleData.session}
                          onChange={(e) => handleSessionChange(e.target.value)}
                          disabled={isFetchingTokens}
                        >
                          <option value="">Select Session</option>
                          {sessions.map((ses) => (
                            <option key={ses.id} value={ses.id}>
                              {ses.sessionName}
                            </option>
                          ))}
                        </select>
                      </div>

                      
                      {/* Date Selection */}
                      <div className="col-md-6">
                        <DatePicker
                          value={rescheduleData.date}
                          onChange={handleDateChange}
                          placeholder="Select New Date"
                          className="form-control"
                          min={new Date().toISOString().split("T")[0]}
                          disabled={isFetchingTokens}
                        />
                        {isFetchingTokens && (
                          <div className="text-info small mt-1">
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Loading available time slots...
                          </div>
                        )}
                      </div>

                      {/* Selected Time Slot Display */}
                      <div className="col-md-12">
                        <label className="form-label">Selected Time Slot</label>
                        <input
                          type="text"
                          className="form-control"
                          value={
                            selectedSlot
                              ? selectedSlot.slot
                              : (selectedToken ? selectedToken.timeSlot : "No time slot selected")
                          }
                          readOnly
                          style={{
                            backgroundColor: selectedSlot || selectedToken ? "#f0fff0" : "#f8f9fa",
                            fontWeight: selectedSlot || selectedToken ? "bold" : "normal",
                          }}
                        />
                      </div>

                      {/* Available Time Slots Section */}
                      {showTimeSlots && newSession && newDate && (
                        <div className="col-md-12 mt-3">
                          <div className="card">
                            <div className="card-header bg-light">
                              <h6 className="mb-0 fw-bold">Available Time Slots</h6>
                              <p className="mb-0 text-muted small">
                                Date: {newDate.split('-').reverse().join('/')} | 
                                Session: {sessions.find(s => String(s.id) === String(newSession))?.sessionName || "Selected Session"}
                              </p>
                            </div>
                            <div className="card-body">
                              {loadingTokens ? (
                                <div className="text-center py-3">
                                  <div className="spinner-border spinner-border-sm me-2"></div>
                                  Loading time slots...
                                </div>
                              ) : availableTokens.length > 0 ? (
                                <div>
                                  <p className="text-primary fw-bold small mb-2">
                                    {sessions.find(s => String(s.id) === String(newSession))?.sessionName || "Selected Session"} Session
                                  </p>
                                  <div className="row row-cols-4 g-2 justify-content-center">
                                    {availableTokens.map((token, index) => {
                                      const isAvailable = token.available;
                                      const startTime = formatTimeToHHMM(token.startTime);
                                      const endTime = formatTimeToHHMM(token.endTime);
                                      const isSelected = selectedSlot?.tokenNo === token.tokenNo;

                                      return (
                                        <div className="col" key={index}>
                                          <button
                                            type="button"
                                            className={`btn ${isSelected ? "btn-success" : (isAvailable ? "btn-outline-success" : "btn-outline-secondary disabled")} 
                                              w-100 d-flex flex-column align-items-center justify-content-center`}
                                            style={{
                                              height: '60px',
                                              fontSize: '0.8rem',
                                              borderRadius: '8px',
                                              borderWidth: isSelected ? '2px' : '1.5px'
                                            }}
                                            onClick={() => isAvailable && handleTokenSelect(token)}
                                            disabled={!isAvailable}
                                          >
                                            <span className="fw-bold">{startTime}</span>
                                            <span style={{ opacity: 0.8 }}>{endTime}</span>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="alert alert-info text-center py-2">
                                  No time slots available for this session and date.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowReschedulePopup(false);
                    setSelectedToken(null);
                    setSelectedSlot(null);
                    setShowTimeSlots(false);
                    setAvailableTokens([]);
                  }}
                  disabled={isFetchingTokens}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitReschedule}
                  disabled={(!selectedSlot && !selectedToken) || isFetchingTokens}
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Popup Modal */}
      {showCancelPopup && patientToCancel && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-md">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Cancel Appointment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowCancelPopup(false);
                    setSelectedReason("");
                    setPatientToCancel(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0 fw-bold">Appointment Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <p>
                          <strong>Patient:</strong> {patientToCancel.patientName}
                        </p>
                        <p>
                          <strong>Date:</strong> {patientToCancel.appointmentDate}
                        </p>
                        <p>
                          <strong>Time Slot:</strong> {patientToCancel.appointmentSlot}
                        </p>
                        <p>
                          <strong>Doctor:</strong> {patientToCancel.doctorName}
                        </p>
                        <p>
                          <strong>Department:</strong> {patientToCancel.departmentName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0 fw-bold">Cancellation Reason</h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">
                        Select Cancellation Reason
                      </label>
                      {loadingReasons ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Loading reasons...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={selectedReason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                        >
                          <option value="">-- Select Reason --</option>
                          {cancellationReasons.map((reason) => {
                            const reasonId = reason.id || reason.reasonId || reason.reasonCode;
                            const reasonName = reason.reasonName || reason.name;
                            return (
                              <option key={reasonId} value={reasonId}>
                                {reasonName}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      {cancellationReasons.length === 0 && !loadingReasons && (
                        <div className="text-danger small mt-1">
                          No cancellation reasons available. Please contact administrator.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCancelPopup(false);
                    setSelectedReason("");
                    setPatientToCancel(null);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={submitCancellation}
                  disabled={!selectedReason}
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default BookingAppointmentHistory;