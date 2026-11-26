import { useState, useEffect, useRef } from "react";
import { getRequestWithSignal } from "../../service/apiService";
import { DOCTOR_SUMMARY } from "../../config/apiConfig";


export const VISIT_SUMMARY_REFRESH_INTERVAL_MS = 30_000; // 30 s


const INITIAL_FETCH_DELAY_MS = 200;

const RETRY_DELAY_MS = 1_500;

const DEFAULT_SUMMARY = {
  totalVisits: 0,
  waitingCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  cancelledCount: 0,
};

const VisitSummaryStats = () => {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const abortRef = useRef(null);
  const retryTimerRef = useRef(null);

  const fetchSummary = async ({ allowRetry = true } = {}) => {
    if (isFetchingRef.current) return;

    const hospitalId =
      sessionStorage.getItem("hospitalId") ||
      localStorage.getItem("hospitalId");
    const departmentId =
      sessionStorage.getItem("departmentId") ||
      localStorage.getItem("departmentId");
    const doctorId =
      sessionStorage.getItem("userId") || localStorage.getItem("userId");

    if (!hospitalId || !departmentId || !doctorId) return;

    isFetchingRef.current = true;

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const url = `${DOCTOR_SUMMARY}?hospitalId=${hospitalId}&doctorId=${doctorId}&departmentId=${departmentId}`;

      const response = await getRequestWithSignal(url, {
        signal: controller.signal,
      });

      if (!isMountedRef.current) return;

      if (
        response?.status === 200 &&
        Array.isArray(response.response) &&
        response.response.length > 0
      ) {
        const s = response.response[0];
        setSummary((prev) => {
          const next = {
            totalVisits: s.totalVisits || 0,
            waitingCount: s.waitingCount || 0,
            inProgressCount: s.inProgressCount || 0,
            completedCount: s.completedCount || 0,
            cancelledCount: s.cancelledCount || 0,
          };
          const unchanged =
            prev.totalVisits === next.totalVisits &&
            prev.waitingCount === next.waitingCount &&
            prev.inProgressCount === next.inProgressCount &&
            prev.completedCount === next.completedCount &&
            prev.cancelledCount === next.cancelledCount;
          return unchanged ? prev : next;
        });
      }
    } catch (err) {
      // Aborts are expected (StrictMode cleanup, unmount, retry) — not errors.
      const isAbort = err?.name === "AbortError";
      if (!isAbort) {
        console.error("[VisitSummaryStats] refresh failed:", err);

        // One quick retry — only for real failures, only if still mounted.
        if (allowRetry && isMountedRef.current) {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              fetchSummary({ allowRetry: false });
            }
          }, RETRY_DELAY_MS);
        }
      }
    } finally {
      isFetchingRef.current = false;
      abortRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // ── 1. Initial load (delayed to survive StrictMode double-mount) ──
    const initialTimer = setTimeout(() => {
      if (isMountedRef.current) fetchSummary();
    }, INITIAL_FETCH_DELAY_MS);

    // ── 2. Periodic polling ──
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchSummary();
      }
    }, VISIT_SUMMARY_REFRESH_INTERVAL_MS);

    // ── 3. Refresh when tab regains focus ──
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSummary();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="d-flex align-items-center gap-4 pe-2">
      {/* Total */}
      <div className="text-center px-2" style={{ minWidth: "90px" }}>
        <div className="fw-bold" style={{ fontSize: "24px", lineHeight: 1.1 }}>
          {summary.totalVisits}
        </div>
        <div
          className="small"
          style={{ opacity: 0.9, fontSize: "12px", letterSpacing: "0.2px" }}
        >
          Total Patients
        </div>
      </div>

      <div
        style={{
          width: "1px",
          height: "38px",
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />

      {/* Waiting */}
      <div className="text-center px-2" style={{ minWidth: "80px" }}>
        <div className="fw-bold" style={{ fontSize: "24px", lineHeight: 1.1 }}>
          {summary.waitingCount}
        </div>
        <div
          className="small"
          style={{ opacity: 0.9, fontSize: "12px", letterSpacing: "0.2px" }}
        >
          Waiting
        </div>
      </div>

      <div
        style={{
          width: "1px",
          height: "38px",
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />

      {/* In Progress */}
      <div className="text-center px-2" style={{ minWidth: "90px" }}>
        <div
          className="fw-bold"
          style={{
            fontSize: "24px",
            lineHeight: 1.1,
            color: "#ffe082",
          }}
        >
          {summary.inProgressCount}
        </div>
        <div
          className="small"
          style={{ opacity: 0.9, fontSize: "12px", letterSpacing: "0.2px" }}
        >
          In Progress
        </div>
      </div>

      <div
        style={{
          width: "1px",
          height: "38px",
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />

      {/* Completed */}
      <div className="text-center px-2" style={{ minWidth: "90px" }}>
        <div
          className="fw-bold"
          style={{
            fontSize: "24px",
            lineHeight: 1.1,
            color: "#b9f6ca",
          }}
        >
          {summary.completedCount}
        </div>
        <div
          className="small"
          style={{ opacity: 0.9, fontSize: "12px", letterSpacing: "0.2px" }}
        >
          Completed
        </div>
      </div>

      <div
        style={{
          width: "1px",
          height: "38px",
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />

      {/* Cancelled */}
      <div className="text-center px-2" style={{ minWidth: "85px" }}>
        <div
          className="fw-bold"
          style={{
            fontSize: "24px",
            lineHeight: 1.1,
            color: "#ffcdd2",
          }}
        >
          {summary.cancelledCount}
        </div>
        <div
          className="small"
          style={{ opacity: 0.9, fontSize: "12px", letterSpacing: "0.2px" }}
        >
          Cancelled
        </div>
      </div>
    </div>
  );
};

export default VisitSummaryStats;