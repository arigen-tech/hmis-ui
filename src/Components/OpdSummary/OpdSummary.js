import { useState, useEffect, useRef } from "react";
import { getRequestWithSignal } from "../../service/apiService";
import { DOCTOR_SUMMARY } from "../../config/apiConfig";

export const VISIT_SUMMARY_REFRESH_INTERVAL_MS = 30_000; // 30 s

const INITIAL_FETCH_DELAY_MS = 200;

const RETRY_DELAY_MS = 1_500;

const DEFAULT_SUMMARY = {
  totalVisits: 0,
  waitingCount: 0,
  completedCount: 0,
};

const OpdSummary = () => {
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
            completedCount: s.completedCount || 0,
          };
          const unchanged =
            prev.totalVisits === next.totalVisits &&
            prev.waitingCount === next.waitingCount &&
            prev.completedCount === next.completedCount;
          return unchanged ? prev : next;
        });
      }
    } catch (err) {
      // Aborts are expected (StrictMode cleanup, unmount, retry) — not errors.
      const isAbort = err?.name === "AbortError";
      if (!isAbort) {
        console.error("[OpdSummary] refresh failed:", err);

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
    <section className="opdGrid- stats-grid">
      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">Total Patients</span>
          <span className="stat-icon blue">
            <img src="images/icons/users-icon.svg" alt="users" />
          </span>
        </div>
        <div className="stat-bottom">
          <h2>{summary.totalVisits}</h2>
          <span className="stat-note">Registered Today</span>
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">Waiting Patients</span>
          <span className="stat-icon amber">
            <img src="images/icons/watch-icon.svg" alt="watch icon" />
          </span>
        </div>
        <div className="stat-bottom">
          <h2>{summary.waitingCount}</h2>
          <span className="stat-note">Awaiting Consultation</span>
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">Completed</span>
          <span className="stat-icon green">
            <img src="images/icons/check-icon.svg" alt="check icon" />
          </span>
        </div>
        <div className="stat-bottom">
          <h2>{summary.completedCount}</h2>
          <span className="stat-note">Consultations Finished</span>
        </div>
      </article>
    </section>
  );
};

export default OpdSummary;