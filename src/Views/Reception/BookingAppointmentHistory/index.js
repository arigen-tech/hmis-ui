import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import DatePicker from "../../../Components/DatePicker";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
    DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import {
    GET_ALL_REASONS,
    GET_APPOINTMENT_HISTORY,
    GET_AVAILABILITY_TOKENS,
    GET_SESSION,
} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";

const formatAppointmentTime = (startTime, endTime, useLocalTime = false) => {
    if (!startTime || !endTime) return "N/A";
    
    const formatTime = (isoString, useLocal) => {
        try {
            if (useLocal) {
                // Convert to local time
                const date = new Date(isoString);
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            } else {
                // Extract UTC time directly from ISO string
                const match = isoString.match(/T(\d{2}):(\d{2})/);
                if (match) {
                    return `${match[1]}:${match[2]}`;
                }
                return "";
            }
        } catch (error) {
            console.error("Error formatting time:", error);
            return "";
        }
    };
    
    const start = formatTime(startTime, useLocalTime);
    const end = formatTime(endTime, useLocalTime);
    
    return start && end ? `${start} - ${end}` : "N/A";
};


const BookingAppointmentHistory = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
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
  const [availableSessions, setAvailableSessions] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);

  // Cancel Popup States
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [patientToCancel, setPatientToCancel] = useState(null);

  useEffect(() => {
    fetchSessions();
    fetchCancellationReasons();
  }, []);

  // Fetch sessions
  async function fetchSessions() {
    try {
      const data = await getRequest(`${GET_SESSION}1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSessions(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  }
  async function fetchCancellationReasons() {
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
        console.log("Cancellation reasons loaded:", activeReasons.length);
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
  }

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

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return "";
    }
  };

  const handleSearch = async () => {
    if (!mobileNumber.trim()) {
      showPopup("Please enter Mobile Number", "error");
      return;
    }

    if (mobileNumber.trim() && !/^\d{10}$/.test(mobileNumber.trim())) {
      showPopup("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setIsGenerating(true);
    setShowReport(false);

    try {
      // Simple request body - check your API documentation

      console.log("Fetching appointment history...");
      const data = await getRequest(`${GET_APPOINTMENT_HISTORY}`);

      console.log("API Response:", data);

      if (data.status === 200) {
        // Handle response - adjust based on your actual API response
        let appointments = [];

        if (Array.isArray(data.response)) {
          appointments = data.response;
        } else if (data.response && Array.isArray(data.response.appointments)) {
          appointments = data.response.appointments;
        } else if (data.response && Array.isArray(data.response.data)) {
          appointments = data.response.data;
        }

        if (!appointments || appointments.length === 0) {
          setReportData([]);
          setShowReport(true);
          showPopup("No appointments found for this mobile number", "info");
          return;
        }

      const formatTimeFromISO = (isoString) => {
    if (!isoString) return "";
    try {
        // Parse the UTC time string
        const date = new Date(isoString);
        
        // Extract local time hours and minutes
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        // For debugging - check what timezone conversion is happening
        console.log("Original UTC:", isoString, "Local:", `${hours}:${minutes}`);
        
        return `${hours}:${minutes}`;
    } catch (error) {
        console.error("Error formatting time:", error);
        return "";
    }
};

        // Transform data to match your UI
        const transformedData = appointments.map((appointment, index) => {
          const appointmentSlot = formatAppointmentTime(
            appointment.appointmentStartTime,
            appointment.appointmentEndTime,
            false
            
          );
          return {
            id:
              appointment.id ||
              appointment.appointmentId ||
              appointment.visitId ||
              index + 1,
            patientName:
              appointment.patientName || appointment.name || "Unknown",
            mobileNumber:
              appointment.mobileNo ||
              appointment.mobileNumber ||
              appointment.phone ||
              mobileNumber.trim(),
            patientAge: appointment.age || appointment.patientAge || "N/A",
            appointmentDate: appointment.appointmentDate
              ? formatDateForDisplay(appointment.appointmentDate)
              : "N/A",
            doctorName: appointment.doctorName || "Unknown Doctor",
            departmentName:
              appointment.departmentName || appointment.speciality || "N/A",
            appointmentSlot: appointmentSlot,
            originalDoctorId: appointment.doctorId || 0,
            originalDepartmentId: appointment.departmentId || 0,
            originalDate: appointment.appointmentDate
              ? appointment.appointmentDate.split("T")[0]
              : "",
            originalSessionId: appointment.sessionId || 0,
            visitId: appointment.visitId,
            tokenNo: appointment.tokenNo,
          };
        });

        setReportData(transformedData);
        setShowReport(true);
      } else {
        // API error
        setReportData([]);
        setShowReport(true);
        showPopup(data.message || "No data found", "info");
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

  // Open Reschedule Popup
  const handleReschedule = (patientData) => {
    setSelectedPatient(patientData);

    // Set initial data from existing appointment
    setRescheduleData({
      department: patientData.departmentName,
      doctor: patientData.doctorName,
      date: patientData.originalDate || getTodayDate(),
      session: patientData.originalSessionId || "",
      doctorName: patientData.doctorName,
      departmentName: patientData.departmentName,
      sessionName:
        sessions.find((s) => s.id == patientData.originalSessionId)
          ?.sessionName || "",
    });

    setShowReschedulePopup(true);
  };

  // Open Cancel Popup
  const handleCancel = (patientData) => {
    setPatientToCancel(patientData);
    setSelectedReason(""); // Reset selected reason
    setShowCancelPopup(true);
  };

  // Submit Cancellation
  const submitCancellation = async () => {
    if (!selectedReason) {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please select a cancellation reason.",
      });
      return;
    }

    // Get selected reason details
    const reason = cancellationReasons.find(
      (r) => r.reasonCode === selectedReason
    );

    Swal.fire({
      title: "Confirm Cancellation",
      html: `
                <p>Are you sure you want to cancel this appointment?</p>
                <p><strong>Patient:</strong> ${patientToCancel.patientName}</p>
                <p><strong>Date:</strong> ${patientToCancel.appointmentDate}</p>
                <p><strong>Slot:</strong> ${patientToCancel.appointmentSlot}</p>
                <p><strong>Reason:</strong> ${
                  reason ? reason.reasonName : selectedReason
                }</p>
            `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No, Keep It",
      confirmButtonColor: "#dc3545",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {

          const cancelData = {
            appointmentId: patientToCancel.id,
            reasonCode: selectedReason,
            reasonName: reason ? reason.reasonName : selectedReason,
            cancelledBy: "SYSTEM",
            cancelledDate: new Date().toISOString(),
            patientName: patientToCancel.patientName,
            mobileNumber: patientToCancel.mobileNumber,
            appointmentDate: patientToCancel.originalDate,
            timeSlot: patientToCancel.appointmentSlot,
          };

          Swal.fire({
            icon: "success",
            title: "Appointment Cancelled",
            text: "Appointment has been successfully cancelled.",
            timer: 2000,
          });

          // Close popup
          setShowCancelPopup(false);
          setSelectedReason("");
          setPatientToCancel(null);

          // Refresh the appointment list
          handleSearch();
        } catch (error) {
          console.error("Error cancelling appointment:", error);
          Swal.fire({
            icon: "error",
            title: "Cancellation Failed",
            text: "Failed to cancel appointment. Please try again.",
          });
        }
      }
    });
  };

  // Handle Date Change in Reschedule
  const handleDateChange = (date) => {
    if (!date) return;

    // Check if date is in past
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

    setSelectedToken(null);
  };

  // Handle Session Change in Reschedule
  const handleSessionChange = (sessionId) => {
    const selectedSession = sessions.find((s) => s.id == sessionId);
    setRescheduleData((prev) => ({
      ...prev,
      session: sessionId,
      sessionName: selectedSession ? selectedSession.sessionName : "",
    }));

    // Clear token when session changes
    setSelectedToken(null);
  };

  // Show Available Tokens
  const showAvailableTokens = async () => {
    if (!selectedPatient || !rescheduleData.date || !rescheduleData.session) {
      Swal.fire({
        icon: "warning",
        title: "Missing Details",
        text: "Please select Date and Session first.",
      });
      return;
    }

    setLoadingTokens(true);
    try {
      // Use original doctor and department IDs from selected patient
      const params = new URLSearchParams({
        deptId: 854,
        doctorId: 30,
        appointmentDate: rescheduleData.date,
        sessionId: rescheduleData.session,
      }).toString();

      const url = `${GET_AVAILABILITY_TOKENS}?${params}`;
      const data = await getRequest(url);

      if (data.status === 200 && Array.isArray(data.response)) {
        setAvailableTokens(data.response);
        showTokenPopup(data.response);
      } else {
        Swal.fire({
          icon: "error",
          title: "No Tokens Available",
          text:
            data.message || "No tokens available for the selected criteria.",
        });
        setAvailableTokens([]);
      }
    } catch (error) {
      console.error("Error fetching token availability:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch token availability. Please try again.",
      });
    } finally {
      setLoadingTokens(false);
    }
  };

  // Show Token Popup
  const showTokenPopup = (tokens = []) => {
    if (tokens.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Tokens Available",
        text: "No tokens are available for the selected session.",
      });
      return;
    }

    Swal.fire({
      title: `Available Time Slots`,
      html: `
                <div class="container-fluid">
                    <div class="text-center mb-2">
                        <h5 class="fw-bold mb-1">Available Time Slots</h5>
                        <p class="text-muted small">
                            Date: ${rescheduleData.date} | 
                            Session: ${rescheduleData.sessionName}
                        </p>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <div class="card border-0 shadow-sm">
                                <div class="card-body p-3">
                                    <div class="row row-cols-4 g-1" id="token-slots">
                                        ${tokens
                                          .map(
                                            (token) => `
                                            <div class="col">
                                                <button type="button" 
                                                        class="btn ${
                                                          token.available
                                                            ? "btn-outline-success"
                                                            : "btn-outline-secondary disabled"
                                                        } w-100 d-flex flex-column align-items-center justify-content-center p-1" 
                                                        style="height: 65px; font-size: 0.75rem;"
                                                        data-token-id="${
                                                          token.tokenNo || ""
                                                        }"
                                                        data-token-starttime="${
                                                          token.startTime || ""
                                                        }"
                                                        data-token-endtime="${
                                                          token.endTime || ""
                                                        }"
                                                        ${
                                                          !token.available
                                                            ? "disabled"
                                                            : ""
                                                        }>
                                                    <span class="fw-bold">${
                                                      token.startTime.split(
                                                        ":"
                                                      )[0]
                                                    }:${
                                              token.startTime.split(":")[1]
                                            }</span>
                                                    <span>${
                                                      token.endTime.split(
                                                        ":"
                                                      )[0]
                                                    }:${
                                              token.endTime.split(":")[1]
                                            }</span>
                                                    ${
                                                      !token.available
                                                        ? '<span class="badge bg-danger mt-0" style="font-size: 0.6rem;">Booked</span>'
                                                        : ""
                                                    }
                                                </button>
                                            </div>
                                        `
                                          )
                                          .join("")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 550,
      padding: "1rem",
      didOpen: () => {
        document.querySelectorAll(".btn-outline-success").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const tokenNo = e.target
              .closest("button")
              .getAttribute("data-token-id");
            const tokenStartTime = e.target
              .closest("button")
              .getAttribute("data-token-starttime");
            const tokenEndTime = e.target
              .closest("button")
              .getAttribute("data-token-endtime");
            selectToken(tokenNo, tokenStartTime, tokenEndTime);
          });
        });
      },
    });
  };

  // Select Token
  const selectToken = (tokenNo, tokenStartTime, tokenEndTime) => {
    setSelectedToken({
      tokenNo,
      tokenStartTime,
      tokenEndTime,
      timeSlot: `${tokenStartTime} - ${tokenEndTime}`,
    });

    Swal.fire({
      icon: "success",
      title: "Time Slot Selected",
      text: `Time slot ${tokenStartTime} to ${tokenEndTime} has been selected.`,
      timer: 1500,
      showConfirmButton: false,
    });

    Swal.close();
  };

  // Submit Reschedule
  const submitReschedule = () => {
    if (!selectedToken) {
      Swal.fire({
        icon: "warning",
        title: "No Time Slot Selected",
        text: "Please select a time slot first.",
      });
      return;
    }

    // Here you would call your reschedule API
    Swal.fire({
      title: "Confirm Reschedule",
      html: `
                <p>Are you sure you want to reschedule the appointment?</p>
                <p><strong>Patient:</strong> ${selectedPatient.patientName}</p>
                <p><strong>New Date:</strong> ${rescheduleData.date}</p>
                <p><strong>New Time Slot:</strong> ${selectedToken.timeSlot}</p>
            `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Reschedule",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Call API to reschedule
        console.log("Rescheduling appointment:", {
          patientId: selectedPatient.id,
          newDate: rescheduleData.date,
          newTimeSlot: selectedToken,
          doctorId: selectedPatient.originalDoctorId,
          departmentId: selectedPatient.originalDepartmentId,
          sessionId: rescheduleData.session,
        });

        Swal.fire({
          icon: "success",
          title: "Appointment Rescheduled",
          text: "Appointment has been successfully rescheduled.",
          timer: 2000,
        });

        // Close popup and refresh data
        setShowReschedulePopup(false);
        setSelectedToken(null);

        // Refresh the appointment list
        handleSearch();
      }
    });
  };

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
                            <thead
                              style={{
                                backgroundColor: "#9db4c0",
                                color: "black",
                              }}
                            >
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
                          <strong>Patient:</strong>{" "}
                          {selectedPatient.patientName}
                        </p>
                        <p>
                          <strong>Mobile:</strong>{" "}
                          {selectedPatient.mobileNumber}
                        </p>
                        <p>
                          <strong>Age:</strong> {selectedPatient.patientAge}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p>
                          <strong>Current Date:</strong>{" "}
                          {selectedPatient.appointmentDate}
                        </p>
                        <p>
                          <strong>Current Slot:</strong>{" "}
                          {selectedPatient.appointmentSlot}
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

                      {/* Date Selection */}
                      <div className="col-md-6">
                        <DatePicker
                          value={rescheduleData.date}
                          onChange={handleDateChange}
                          placeholder="Select New Date"
                          className="form-control"
                        />
                      </div>

                      {/* Session Selection */}
                      <div className="col-md-6">
                        <label className="form-label">Session</label>
                        <select
                          className="form-select"
                          value={rescheduleData.session}
                          onChange={(e) => handleSessionChange(e.target.value)}
                        >
                          <option value="">Select Session</option>
                          {sessions.map((ses) => (
                            <option key={ses.id} value={ses.id}>
                              {ses.sessionName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected Time Slot */}
                      <div className="col-md-12">
                        <label className="form-label">Selected Time Slot</label>
                        <input
                          type="text"
                          className="form-control"
                          value={
                            selectedToken
                              ? selectedToken.timeSlot
                              : "No time slot selected"
                          }
                          readOnly
                          style={{
                            backgroundColor: selectedToken
                              ? "#f0fff0"
                              : "#f8f9fa",
                            fontWeight: selectedToken ? "bold" : "normal",
                          }}
                        />
                      </div>

                      {/* Show Token Button */}
                      <div className="col-md-12 mt-3">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={showAvailableTokens}
                          disabled={
                            !rescheduleData.date ||
                            !rescheduleData.session ||
                            loadingTokens
                          }
                        >
                          {loadingTokens ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Loading Tokens...
                            </>
                          ) : (
                            "Show Available Time Slots"
                          )}
                        </button>
                      </div>
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
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitReschedule}
                  disabled={!selectedToken}
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
                          <strong>Patient:</strong>{" "}
                          {patientToCancel.patientName}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {patientToCancel.appointmentDate}
                        </p>
                        <p>
                          <strong>Time Slot:</strong>{" "}
                          {patientToCancel.appointmentSlot}
                        </p>
                        <p>
                          <strong>Doctor:</strong> {patientToCancel.doctorName}
                        </p>
                        <p>
                          <strong>Department:</strong>{" "}
                          {patientToCancel.departmentName}
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
                          {cancellationReasons
                            .filter((reason) => reason.status === "Y")
                            .map((reason) => (
                              <option
                                key={reason.reasonCode}
                                value={reason.reasonCode}
                              >
                                {reason.reasonName}
                              </option>
                            ))}
                        </select>
                      )}
                      {cancellationReasons.length === 0 && !loadingReasons && (
                        <div className="text-danger small mt-1">
                          No cancellation reasons available. Please contact
                          administrator.
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
