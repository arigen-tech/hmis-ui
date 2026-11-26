// RadiologyHistoryTable.jsx
import { useState } from "react";
import {
  RADIOLOGY_REPORT_END_URL,
  REQUEST_PARAM_RAD_ORDER_DT_ID,
  REQUEST_PARAM_FLAG,
  GET_WEASIS_LAUNCH_URL_API,
  STATUS_Y,
  STATUS_N,
  STATUS_S,
} from "../../../../config/apiConfig";
import Pagination from "../../../../Components/Pagination";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import Popup from "../../../../Components/popup";
import { getRequest } from "../../../../service/apiService";

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatDateTime = (date, time) => {
  if (!date) return "-";
  const fd = formatDateForDisplay(date);
  if (!time) return fd;
  try {
    const t = new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
    return `${fd} ${t}`;
  } catch {
    return fd;
  }
};

const getStatusBadgeClass = (status) => {
  switch (String(status || "").toLowerCase()) {
    case String(STATUS_Y).toLowerCase(): return "badge bg-success";
    case String(STATUS_N).toLowerCase(): return "badge bg-warning";
    case String(STATUS_S).toLowerCase(): return "badge bg-info";
    default: return "badge bg-secondary";
  }
};

const getStatusText = (status) => {
  switch (String(status || "").toLowerCase()) {
    case String(STATUS_Y).toLowerCase(): return "Completed";
    case String(STATUS_N).toLowerCase(): return "Pending";
    case String(STATUS_S).toLowerCase(): return "Draft";
    default: return "Unknown";
  }
};

const RadiologyHistoryTable = ({
  data = [],
  loading = false,
  currentPage = 0,
  totalElements = 0,
  pageSize = 5,
  onPageChange,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [dicomLoadingId, setDicomLoadingId] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const showPopup = (message, type = "info") =>
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });

  const handleViewReport = async (radOrderDtId) => {
    if (!radOrderDtId) return;
    try {
      setViewLoading(true);
      setSelectedReportId(radOrderDtId);
      const url = `${RADIOLOGY_REPORT_END_URL}?${REQUEST_PARAM_RAD_ORDER_DT_ID}=${radOrderDtId}&${REQUEST_PARAM_FLAG}=d`;
      const response = await fetch(url, { method: "GET", headers: { Accept: "application/pdf" } });
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      setPdfUrl(window.URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      showPopup("Failed to generate report", "error");
    } finally {
      setViewLoading(false);
      setSelectedReportId(null);
    }
  };

  const handleDicomView = async (item) => {
    try {
      setDicomLoadingId(item.radOrderDtId);
      const params = new URLSearchParams({
        uhid: item.uhidNo || "",
        orderNo: item.accessionNo || "",
      });
      const response = await getRequest(`${GET_WEASIS_LAUNCH_URL_API}?${params.toString()}`);
      const payload = response?.response ?? response;
      const weasisUrl = payload?.weasisUrl;
      if (!weasisUrl) {
        showPopup(`No DICOM study found for ${item.patientName || "patient"}.`, "info");
        return;
      }
      window.open(weasisUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      showPopup("Failed to open DICOM study.", "error");
    } finally {
      setDicomLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading radiology history...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-5">
        <i className="mdi mdi-radiology-box" style={{ fontSize: 48, color: "#6c757d" }} />
        <p className="mt-2 mb-0 text-muted">No Previous Radiology Investigations Found</p>
      </div>
    );
  }

  return (
    <>
      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name={`Radiology Report - ${selectedReportId || ""}`}
        />
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover mb-0">
          <thead>
            <tr>
              <th>Accession No</th>
              <th>Modality</th>
              <th>Investigation</th>
              <th>Order Date/Time</th>
              <th>Study Date/Time</th>
              <th>Report Status</th>
              <th>Report</th>
              <th>DICOM</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const id = row.radOrderDtId;
              const isCompleted =
                String(row.reportStatus || "").toLowerCase() === String(STATUS_Y).toLowerCase();
              return (
                <tr key={id}>
                  <td>{row.accessionNo || "-"}</td>
                  <td>{row.modality || "-"}</td>
                  <td>{row.investigationName || "-"}</td>
                  <td>{formatDateTime(row.orderDate, row.orderTime)}</td>
                  <td>{formatDateTime(row.studyDate, row.studyTime)}</td>
                  <td>
                    <span className={getStatusBadgeClass(row.reportStatus)}>
                      {getStatusText(row.reportStatus)}
                    </span>
                  </td>
                  <td className="text-center">
                    {isCompleted && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleViewReport(id)}
                        disabled={viewLoading && selectedReportId === id}
                      >
                        {viewLoading && selectedReportId === id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-eye me-1" />
                            View
                          </>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleDicomView(row)}
                      disabled={dicomLoadingId === id}
                    >
                      {dicomLoadingId === id ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <i className="fa fa-eye" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalElements > 0 && (
        <div className="mt-3">
          <Pagination
            totalItems={totalElements}
            itemsPerPage={pageSize}
            currentPage={currentPage + 1}
            onPageChange={(p) => onPageChange?.(p - 1)}
          />
        </div>
      )}
    </>
  );
};

export default RadiologyHistoryTable;