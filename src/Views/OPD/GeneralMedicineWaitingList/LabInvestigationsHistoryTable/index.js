// LabInvestigationsHistoryTable.jsx
import { useState, useEffect, useRef } from "react";
import {
  LAB_REPORT_URL_WRT_ORDER_HD,
  REQUEST_PARAM_ORDER_HD_ID,
  REQUEST_PARAM_FLAG,
  STATUS_D,
  STATUS_P,
} from "../../../../config/apiConfig";
import { checkInRange, getResultTextStyle } from "../../../../utils/rangeCheckService";
import { formatDateForDisplay } from "../../../../utils/dateUtils";
import Pagination from "../../../../Components/Pagination";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import Popup from "../../../../Components/popup";

const isTextInvestigation = (type) =>
  String(type || "").toLowerCase() === "t";

const htmlToPlainText = (html) => {
  if (!html) return "";
  try {
    const spaced = String(html)
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|table)>/gi, " </$1>")
      .replace(/<br\s*\/?>/gi, " ");
    const doc = new DOMParser().parseFromString(spaced, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
};

const sanitizeHtml = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    doc.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((el) => el.remove());
    doc.body.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const val = (attr.value || "").trim().toLowerCase();
        if (name.startsWith("on") || val.startsWith("javascript:")) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  } catch {
    return "";
  }
};

const clampedTextStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "380px",
  cursor: "pointer",
  color: "#0d6efd",
  wordBreak: "break-word",
};

const LabInvestigationsHistoryTable = ({
  data = [],
  loading = false,
  currentPage = 0,
  totalElements = 0,
  pageSize = 5,
  onPageChange,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [printingIds, setPrintingIds] = useState(new Set());
  const [hoverPopup, setHoverPopup] = useState(null);
  const [resultPopup, setResultPopup] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);

  const hoverOpenTimer = useRef(null);
  const hoverCloseTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(hoverOpenTimer.current);
      clearTimeout(hoverCloseTimer.current);
    },
    [],
  );

  const showPopup = (message, type = "info") =>
    setPopupMessage({ message, type, onClose: () => setPopupMessage(null) });

  const handleResultMouseEnter = (e, item) => {
    e.currentTarget.style.textDecoration = "underline";
    clearTimeout(hoverCloseTimer.current);
    clearTimeout(hoverOpenTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    hoverOpenTimer.current = setTimeout(() => {
      const popupWidth = 520;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 8));
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 320 && rect.top > spaceBelow;
      setHoverPopup({
        title: item.investigationName || "Result",
        html: sanitizeHtml(item.result),
        left,
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        openUp,
      });
    }, 250);
  };

  const handleResultMouseLeave = (e) => {
    e.currentTarget.style.textDecoration = "none";
    clearTimeout(hoverOpenTimer.current);
    clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setHoverPopup(null), 200);
  };

  const openResultPopup = (item) => {
    clearTimeout(hoverOpenTimer.current);
    clearTimeout(hoverCloseTimer.current);
    setHoverPopup(null);
    setResultPopup({
      title: item.investigationName || "Result",
      html: sanitizeHtml(item.result),
    });
  };

  const generateLabReport = async (record, flag) => {
    const orderHdId = record.orderHdId;
    if (!orderHdId) {
      showPopup("Missing order id for report", "error");
      return;
    }
    const id = record.resultEntryDetailsId || record.orderHdId;
    try {
      if (flag === STATUS_D) {
        setGeneratingIds((prev) => new Set(prev).add(id));
        setSelectedRecord(record);
        const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${orderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_D}`;
        const response = await fetch(url, { method: "GET", headers: { Accept: "application/pdf" } });
        if (!response.ok) throw new Error("Failed to generate PDF");
        const blob = await response.blob();
        setPdfUrl(window.URL.createObjectURL(blob));
      } else {
        setPrintingIds((prev) => new Set(prev).add(id));
        const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${orderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_P}`;
        const response = await fetch(url, { method: "GET", headers: { Accept: "application/pdf" } });
        if (response.status !== 200) showPopup("Print failed", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("Failed to generate report", "error");
    } finally {
      setGeneratingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      setPrintingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading lab investigations...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-5">
        <i className="mdi mdi-flask-empty-outline" style={{ fontSize: 48, color: "#6c757d" }} />
        <p className="mt-2 mb-0 text-muted">No Previous Lab Investigations Found</p>
      </div>
    );
  }

  return (
    <>
      {popupMessage && (
        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
      )}
      {pdfUrl && selectedRecord && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
            setSelectedRecord(null);
          }}
          name={`Lab Report - ${selectedRecord.patientName || "Patient"}`}
        />
      )}

      {/* Hover preview */}
      {hoverPopup && !resultPopup && (
        <div
          onMouseEnter={() => clearTimeout(hoverCloseTimer.current)}
          onMouseLeave={() => {
            clearTimeout(hoverCloseTimer.current);
            hoverCloseTimer.current = setTimeout(() => setHoverPopup(null), 200);
          }}
          style={{
            position: "fixed",
            left: hoverPopup.left,
            ...(hoverPopup.openUp ? { bottom: hoverPopup.bottom } : { top: hoverPopup.top }),
            width: 520,
            maxWidth: "calc(100vw - 16px)",
            maxHeight: 320,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 1300,
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #dee2e6", fontWeight: 600 }}>
            {hoverPopup.title}
          </div>
          <div style={{ padding: "10px 12px", overflowY: "auto" }} dangerouslySetInnerHTML={{ __html: hoverPopup.html }} />
        </div>
      )}

      {/* Full result popup */}
      {resultPopup && (
        <div
          onClick={() => setResultPopup(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1310, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 8, width: "100%", maxWidth: 800,
              maxHeight: "85vh", display: "flex", flexDirection: "column",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center" style={{ padding: "12px 16px", borderBottom: "1px solid #dee2e6" }}>
              <h5 className="mb-0">{resultPopup.title}</h5>
              <button type="button" className="btn-close" onClick={() => setResultPopup(null)} />
            </div>
            <div style={{ padding: 16, overflowY: "auto" }} dangerouslySetInnerHTML={{ __html: resultPopup.html }} />
            <div className="d-flex justify-content-end" style={{ padding: "10px 16px", borderTop: "1px solid #dee2e6" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setResultPopup(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle mb-0">
          <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
            <tr>
              <th>Investigation Date</th>
              <th>Investigation Name</th>
              <th>Unit</th>
              <th>Result</th>
              <th>Range</th>
              <th>Entered By</th>
              <th>Validated By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const isText = isTextInvestigation(item.investigationType);
              const inRange = isText ? null : checkInRange(item.result, item.range);
              const id = item.resultEntryDetailsId || item.orderHdId || idx;
              const isGen = generatingIds.has(id);
              const isPrn = printingIds.has(id);
              return (
                <tr key={id}>
                  <td>{formatDateForDisplay(item.investigationDate)}</td>
                  <td>{item.investigationName || "-"}</td>
                  <td>{item.unit || "-"}</td>
                  <td style={isText ? {} : getResultTextStyle(inRange)}>
                    {isText ? (
                      (() => {
                        const plain = htmlToPlainText(item.result);
                        if (!plain) return "";
                        return (
                          <div
                            style={clampedTextStyle}
                            role="button"
                            tabIndex={0}
                            onClick={() => openResultPopup(item)}
                            onMouseEnter={(e) => handleResultMouseEnter(e, item)}
                            onMouseLeave={handleResultMouseLeave}
                          >
                            {plain}
                          </div>
                        );
                      })()
                    ) : (
                      item.result
                    )}
                  </td>
                  <td>{item.range || "-"}</td>
                  <td>{item.resultEnteredBy || "-"}</td>
                  <td>{item.resultValidatedBy || "-"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => generateLabReport(item, STATUS_D)}
                        disabled={isGen || isPrn}
                      >
                        {isGen ? (<><span className="spinner-border spinner-border-sm me-1" />Loading...</>) : "View"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => generateLabReport(item, STATUS_P)}
                        disabled={isGen || isPrn}
                      >
                        {isPrn ? (<><span className="spinner-border spinner-border-sm me-1" />Printing...</>) : "Print"}
                      </button>
                    </div>
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

export default LabInvestigationsHistoryTable;