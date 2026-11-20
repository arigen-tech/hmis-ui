import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { getRequest } from "../../../service/apiService";
import {
  DENTAL_PREVIOUS_DETAILS,
  DENTAL_PROCEDURE_HISTORY,
  DENTAL_SESSION_HISTORY,
  MAS_PROCEDURES_GET_ALL,
  MAS_PROCEDURES_GET_ALL_WRT_DEPARTMENT,
  MAS_TOOTH_BY_TYPE,
  MAS_TOOTH_CONDITION,
} from "../../../config/apiConfig";
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
} from "../../../utils/dateUtils"; 
import Pagination from "../../../Components/Pagination";

// Dental history / procedure history / session history endpoints.


const DentalSection = forwardRef(
  (
    {
      patientId,
      visitId,
      patientAge,
      patientDob,
      initialDentalData = null,
      hideHeader = false,
      hideButtons = false,
    },
    ref,
  ) => {
    // ==================== STATE VARIABLES ====================

    const resolveDentalType = (dob, age) => {
      if (dob) {
        const birthDate = new Date(dob);
        if (!Number.isNaN(birthDate.getTime())) {
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            calculatedAge -= 1;
          }
          return calculatedAge < 13 ? "child" : "adult";
        }
      }

      return Number(age) > 0 && Number(age) < 13 ? "child" : "adult";
    };

    const resolvedDentalType = resolveDentalType(patientDob, patientAge);

    // Teeth conditions state
    const [teethData, setTeethData] = useState({});
    const [childTeethData, setChildTeethData] = useState({});
    const [adultToothIdMap, setAdultToothIdMap] = useState({});
    const [childToothIdMap, setChildToothIdMap] = useState({});
    const [adultToothLayout, setAdultToothLayout] = useState({
      upperRight: [],
      upperLeft: [],
      lowerLeft: [],
      lowerRight: [],
    });
    const [childToothLayout, setChildToothLayout] = useState({
      upperRight: [],
      upperLeft: [],
      lowerLeft: [],
      lowerRight: [],
    });
    const [toothConditions, setToothConditions] = useState([]);
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dental summary state
    const [adultDentalSummary, setAdultDentalSummary] = useState({
      totalTeeth: 32,
      missingTeeth: 0,
      unsalvageableTeeth: 0,
      otherConditionsCount: 0,
      affectedTeeth: 0,
      procedureCount: 0,
      dentalPoints: 0,
      notes: "",
    });

    const [childDentalSummary, setChildDentalSummary] = useState({
      totalTeeth: 20,
      missingTeeth: 0,
      unsalvageableTeeth: 0,
      otherConditionsCount: 0,
      affectedTeeth: 0,
      procedureCount: 0,
      dentalPoints: 0,
      notes: "",
    });

    // Dashboard state
    const [showAdultDashboard, setShowAdultDashboard] = useState(false);
    const [showChildDashboard, setShowChildDashboard] = useState(false);
    const [selectedDashboardDate, setSelectedDashboardDate] = useState(
      new Date().toISOString().split("T")[0],
    );
    const [dashboardAppointments, setDashboardAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // ==================== Dental History popup ====================
    const [showDentalHistoryModal, setShowDentalHistoryModal] = useState(false);
    const [dentalHistoryRecords, setDentalHistoryRecords] = useState([]);
    const [dentalHistoryLoading, setDentalHistoryLoading] = useState(false);
    const [dentalHistoryError, setDentalHistoryError] = useState(null);
    
    // Dental History Pagination State
    const [dentalHistoryPage, setDentalHistoryPage] = useState(1);
    const [dentalHistoryTotalPages, setDentalHistoryTotalPages] = useState(1);
    const [dentalHistoryTotalElements, setDentalHistoryTotalElements] = useState(0);

    // ==================== Dental Procedure History popup + View Details popup ====================
    const [showProcedureHistoryModal, setShowProcedureHistoryModal] =
      useState(false);
    const [showProcedureDetailModal, setShowProcedureDetailModal] =
      useState(false);
    const [selectedProcedureHistory, setSelectedProcedureHistory] =
      useState(null);
    const [procedureHistoryRecords, setProcedureHistoryRecords] = useState([]);
    const [procedureHistoryLoading, setProcedureHistoryLoading] =
      useState(false);
    const [procedureHistoryError, setProcedureHistoryError] = useState(null);
    
    // Procedure History Pagination State
    const [procedureHistoryPage, setProcedureHistoryPage] = useState(1);
    const [procedureHistoryTotalPages, setProcedureHistoryTotalPages] = useState(1);
    const [procedureHistoryTotalElements, setProcedureHistoryTotalElements] = useState(0);

    const [procedureSessionHistory, setProcedureSessionHistory] = useState([]);
    const [procedureDetailLoading, setProcedureDetailLoading] = useState(false);
    const [procedureDetailError, setProcedureDetailError] = useState(null);

    // ==================== Dental Procedure table (Add/Remove rows) ====================
    const [procedures, setProcedures] = useState([]);
    const [procedurePage, setProcedurePage] = useState(0);
    const [procedureTotalPages, setProcedureTotalPages] = useState(0);
    const [procedureLoading, setProcedureLoading] = useState(false);
    const [procedureRows, setProcedureRows] = useState([
      {
        id: 1,
        arch: resolvedDentalType,
        toothNumbers: [],
        procedureId: "",
        remarks: "",
        sessions: [
          {
            id: 1,
            scheduledDate: new Date().toISOString().split("T")[0],
            scheduledTime: "",
            remarks: "",
          },
        ],
      },
    ]);
    const [savedProcedures, setSavedProcedures] = useState([]);

    // Teeth selection popup (used by the Dental Procedure table's "Tooth No." cell)
    const [showTeethSelectModal, setShowTeethSelectModal] = useState(false);
    const [teethSelectRowId, setTeethSelectRowId] = useState(null);
    const [teethSelectArch, setTeethSelectArch] = useState(resolvedDentalType);
    const [tempSelectedTeeth, setTempSelectedTeeth] = useState([]);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionSelectRowId, setSessionSelectRowId] = useState(null);
    const [sessionRowErrors, setSessionRowErrors] = useState({});
    const [hasHydratedInitialDentalData, setHasHydratedInitialDentalData] =
      useState(false);

    const buildToothLayout = (items = []) => {
      const grouped = items.reduce((acc, item) => {
        const toothNumber = Number(item.toothNumber);
        const quadrant = Number(item.quadrant);
        const displayOrder = Number(item.displayOrder ?? toothNumber);

        if (!Number.isFinite(toothNumber) || !Number.isFinite(quadrant)) {
          return acc;
        }

        if (!acc[quadrant]) acc[quadrant] = [];
        acc[quadrant].push({ toothNumber, displayOrder });
        return acc;
      }, {});

      const sortAsc = (a, b) => a.displayOrder - b.displayOrder;
      const sortDesc = (a, b) => b.displayOrder - a.displayOrder;
      const mapToothNumbers = (quadrant, direction = "asc") =>
        (grouped[quadrant] || [])
          .slice()
          .sort(direction === "desc" ? sortDesc : sortAsc)
          .map((item) => item.toothNumber);

      return {
        upperRight: mapToothNumbers(1, "asc"),
        upperLeft: mapToothNumbers(2, "asc"),
        lowerLeft: mapToothNumbers(3, "asc"),
        lowerRight: mapToothNumbers(4, "asc"),
        childUpperRight: mapToothNumbers(5, "asc"),
        childUpperLeft: mapToothNumbers(6, "asc"),
        childLowerLeft: mapToothNumbers(7, "asc"),
        childLowerRight: mapToothNumbers(8, "asc"),
      };
    };

    const buildToothIdMap = (items = []) =>
      items.reduce((acc, item) => {
        const toothNumber = Number(item.toothNumber);
        const toothId = Number(item.toothId);
        if (Number.isFinite(toothNumber) && Number.isFinite(toothId)) {
          acc[toothNumber] = toothId;
        }
        return acc;
      }, {});

    const mockAppointments = {
      "2025-01-10": [
        {
          scheduleId: 1,
          patientName: "Anil Verma",
          age: 39,
          gender: "Male",
          procedureName: "Dental Implant",
          toothNumbers: "36",
          scheduledBy: "Dr. Nair",
          scheduleStatus: "CLOSED",
          isSelected: false,
        },
        {
          scheduleId: 2,
          patientName: "Pooja Sharma",
          age: 31,
          gender: "Female",
          procedureName: "Scaling & Polishing",
          toothNumbers: "11,12,21,22",
          scheduledBy: "Dr. Rao",
          scheduleStatus: "IN_PROGRESS",
          isSelected: false,
        },
      ],
      "2025-01-15": [
        {
          scheduleId: 3,
          patientName: "Vikram Singh",
          age: 46,
          gender: "Male",
          procedureName: "Crown & Bridge",
          toothNumbers: "26,27",
          scheduledBy: "Dr. Patel",
          scheduleStatus: "OPEN",
          isSelected: false,
        },
      ],
    };

    const departmentId=sessionStorage.getItem("departmentId")||localStorage.getItem("departmentId")||"";

    // ==================== FETCH TOOTH CONDITIONS FROM API ====================

    const fetchToothConditions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getRequest(`${MAS_TOOTH_CONDITION}/getAll/1`);

        // Check if response has status and response array
        if (response?.status === 200 && Array.isArray(response?.response)) {
          const mappedConditions = response.response.map((condition) => ({
            conditionId: condition.conditionId,
            conditionName: condition.conditionName,
            points: condition.points || 0,
            isMissing:
              condition.conditionName?.toLowerCase().includes("missing") ||
              false,
            isUnsalvageable:
              condition.conditionName
                ?.toLowerCase()
                .includes("unsalvageable") || false,
            isExclusive: condition.isExclusive === "y",
          }));

          setToothConditions(mappedConditions);
          console.log("Tooth conditions loaded from API:", mappedConditions);
        } else {
          setError("Failed to load tooth conditions from API");
          setToothConditions([]);
        }
      } catch (err) {
        console.error("Error fetching tooth conditions:", err);
        setError("Failed to load conditions from server");
        setToothConditions([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchProcedures = async () => {
      try {
        const response = await getRequest(
          `${MAS_PROCEDURES_GET_ALL_WRT_DEPARTMENT}/${departmentId}?page=0&size=10`,
        );

        console.log("Procedure API response:", response);

        if (
          response?.status === 200 &&
          response?.response?.content &&
          Array.isArray(response.response.content)
        ) {
          const mappedProcedures = response.response.content.map((proc) => ({
            procedureId: proc.procedureId,
            procedureName: proc.procedureName,
            defaultSittings: proc.defaultSittings,
          }));

          setProcedures(mappedProcedures);

          console.log("Procedures loaded from API:", mappedProcedures);
        } else {
          setProcedures([]);
          console.warn("No procedures found from API");
        }
      } catch (err) {
        console.error("Error fetching procedures:", err);
        setProcedures([]);
      }
    };

    // ==================== DENTAL HISTORY / PROCEDURE HISTORY APIs ====================

    const fetchDentalHistory = async (page = 1) => {
      if (!patientId) {
        setDentalHistoryRecords([]);
        return;
      }

      setDentalHistoryLoading(true);
      setDentalHistoryError(null);

      try {
        const response = await getRequest(
          `${DENTAL_PREVIOUS_DETAILS}/${patientId}?page=${page - 1}&size=5`,
        );

        const resData = response?.response;
        setDentalHistoryRecords(Array.isArray(resData?.content) ? resData.content : []);
        setDentalHistoryTotalPages(resData?.totalPages || 1);
        setDentalHistoryTotalElements(resData?.totalElements || 0);
        setDentalHistoryPage(page);
      } catch (err) {
        console.error("Error fetching dental history:", err);
        setDentalHistoryError("Failed to load dental history");
        setDentalHistoryRecords([]);
      } finally {
        setDentalHistoryLoading(false);
      }
    };

    const fetchProcedureHistory = async (page = 1) => {
      if (!patientId) {
        setProcedureHistoryRecords([]);
        return;
      }

      setProcedureHistoryLoading(true);
      setProcedureHistoryError(null);

      try {
        const response = await getRequest(
          `${DENTAL_PROCEDURE_HISTORY}/${patientId}?page=${page - 1}&size=5`,
        );

        const resData = response?.response;
        setProcedureHistoryRecords(Array.isArray(resData?.content) ? resData.content : []);
        setProcedureHistoryTotalPages(resData?.totalPages || 1);
        setProcedureHistoryTotalElements(resData?.totalElements || 0);
        setProcedureHistoryPage(page);
      } catch (err) {
        console.error("Error fetching procedure history:", err);
        setProcedureHistoryError("Failed to load procedure history");
        setProcedureHistoryRecords([]);
      } finally {
        setProcedureHistoryLoading(false);
      }
    };

    const fetchProcedureSessionHistory = async (procedureDtId) => {
      if (!procedureDtId) {
        setProcedureSessionHistory([]);
        return;
      }

      setProcedureDetailLoading(true);
      setProcedureDetailError(null);

      try {
        const response = await getRequest(
          `${DENTAL_SESSION_HISTORY}/${procedureDtId}`,
        );

        const content = Array.isArray(response?.response)
          ? response.response
          : [];
        setProcedureSessionHistory(content);
      } catch (err) {
        console.error("Error fetching procedure session history:", err);
        setProcedureDetailError("Failed to load session history");
        setProcedureSessionHistory([]);
      } finally {
        setProcedureDetailLoading(false);
      }
    };

    const hydrateFromInitialDentalData = () => {
      if (!initialDentalData) return;

      const examination = initialDentalData.dentalExamination || {};
      const procedureHeaders = Array.isArray(
        initialDentalData.procedureHdDetails,
      )
        ? initialDentalData.procedureHdDetails
        : [];

      const sourceToothIdMap =
        resolvedDentalType === "adult" ? adultToothIdMap : childToothIdMap;
      const toothNumberByIdMap = Object.entries(sourceToothIdMap).reduce(
        (acc, [toothNumber, toothId]) => {
          acc[Number(toothId)] = Number(toothNumber);
          return acc;
        },
        {},
      );

      const conditionLookup = new Map(
        toothConditions.map((condition) => [
          Number(condition.conditionId),
          condition,
        ]),
      );

      const mappedToothConditions = (Array.isArray(examination.toothConditions)
        ? examination.toothConditions
        : []
      ).reduce((acc, item) => {
        const toothNumber = toothNumberByIdMap[Number(item.toothId)];
        const condition = conditionLookup.get(Number(item.conditionId));

        if (!toothNumber || !condition) return acc;

        if (!acc[toothNumber]) acc[toothNumber] = [];
        acc[toothNumber].push(condition);
        return acc;
      }, {});

      const mappedProcedures = procedureHeaders.flatMap((header, headerIndex) => {
        const details = Array.isArray(header.procedureDetails)
          ? header.procedureDetails
          : [];

        return details.map((procedure, procedureIndex) => ({
          id: procedure.procedureDtId ?? `${headerIndex}-${procedureIndex}`,
          arch: resolvedDentalType,
          toothNumbers: Array.isArray(procedure.dentalProcedureTeeth)
            ? procedure.dentalProcedureTeeth
                .map((tooth) => toothNumberByIdMap[Number(tooth.toothId)])
                .filter(Boolean)
            : [],
          procedureId: procedure.procedureId ? String(procedure.procedureId) : "",
          procedureName: procedure.procedureName || "",
          remarks: procedure.remarks || "",
          sessions: Array.isArray(procedure.sessions)
            ? procedure.sessions.map((session, sessionIndex) => ({
                id: session.sessionNo ?? sessionIndex + 1,
                scheduledDate: session.scheduledDateTime
                  ? String(session.scheduledDateTime).split("T")[0]
                  : "",
                scheduledTime: session.scheduledDateTime
                  ? String(session.scheduledDateTime).includes("T")
                    ? String(session.scheduledDateTime).split("T")[1].slice(0, 5)
                    : ""
                  : "",
                remarks: session.remarks || "",
              }))
            : [buildDefaultSessionRow()],
        }));
      });

      const nextSummary = {
        totalTeeth: examination.totalTeeth || (resolvedDentalType === "child" ? 20 : 32),
        missingTeeth: examination.missingTeeth || 0,
        unsalvageableTeeth: examination.unsalvageableTeeth || 0,
        otherConditionsCount: examination.otherConditionsCount || 0,
        affectedTeeth: examination.affectedTeeth || 0,
        procedureCount:
          examination.ongoingProcedures || mappedProcedures.length || 0,
        dentalPoints: examination.dentalDiseaseScore || 0,
        notes: examination.notes || "",
      };

      if (resolvedDentalType === "adult") {
        setAdultDentalSummary(nextSummary);
        setTeethData(mappedToothConditions);
      } else {
        setChildDentalSummary(nextSummary);
        setChildTeethData(mappedToothConditions);
      }

      setSavedProcedures(mappedProcedures);
      setProcedureRows(
        mappedProcedures.length > 0
          ? mappedProcedures
          : [
              {
                id: 1,
                arch: resolvedDentalType,
                toothNumbers: [],
                procedureId: "",
                remarks: "",
                sessions: [buildDefaultSessionRow()],
              },
            ],
      );

      setHasHydratedInitialDentalData(true);
    };
    // ==================== INITIALIZATION ====================

    useEffect(() => {
      fetchToothConditions();
      fetchProcedures();
      fetchToothCatalog();
    }, [resolvedDentalType]);

    useEffect(() => {
      if (!initialDentalData || toothConditions.length === 0) return;
      if (hasHydratedInitialDentalData) return;

      if (Object.keys(adultToothIdMap).length === 0 && Object.keys(childToothIdMap).length === 0) {
        return;
      }

      hydrateFromInitialDentalData();
    }, [
      initialDentalData,
      toothConditions,
      adultToothIdMap,
      childToothIdMap,
      hasHydratedInitialDentalData,
    ]);

    useEffect(() => {
      if (showAdultDashboard || showChildDashboard) {
        fetchDashboardAppointments();
      }
    }, [selectedDashboardDate, showAdultDashboard, showChildDashboard]);

    // ==================== API FUNCTIONS ====================

    const fetchDashboardAppointments = () => {
      setDashboardAppointments(mockAppointments[selectedDashboardDate] || []);
    };

    // ==================== HELPER FUNCTIONS ====================

    const isExclusiveToothCondition = (condition) =>
      Boolean(
        condition?.isExclusive ||
        condition?.isMissing ||
        condition?.isUnsalvageable,
      );

    const hasExclusiveCondition = (conditions = []) =>
      conditions.some((condition) => isExclusiveToothCondition(condition));

    // Null / undefined / blank -> "N/A" (used for plain, non-date fields)
    const displayValue = (value) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "string" && value.trim() === "") return "N/A";
      return value;
    };

    // "Y" -> Completed, anything else ("N") -> Pending
    const isCompletedStatus = (status) =>
      String(status ?? "").toUpperCase() === "Y";

    const getToothColor = (toothNumber, isAdult = true) => {
      const conditions = isAdult
        ? teethData[toothNumber] || []
        : childTeethData[toothNumber] || [];

      if (conditions.some((c) => c.isMissing)) {
        return "#dc3545";
      }

      if (conditions.some((c) => c.isUnsalvageable)) {
        return "#fd7e14";
      }

      if (conditions.length > 0) {
        return "#ffc107";
      }

      return "#28a745";
    };

    // ==================== EVENT HANDLERS ====================

    const handleToothClick = (toothNumber, isAdult = true) => {
      setSelectedTooth({ number: toothNumber, isAdult });
      setShowConditionModal(true);
    };

    const handleConditionSelect = (condition) => {
      if (!selectedTooth) return;

      const { number, isAdult } = selectedTooth;

      const currentData = isAdult ? teethData : childTeethData;

      const existingConditions = currentData[number] || [];

      const alreadySelected = existingConditions.some(
        (item) => item.conditionId === condition.conditionId,
      );
      const alreadyLocked = hasExclusiveCondition(existingConditions);
      const selectingExclusive = isExclusiveToothCondition(condition);

      let updatedConditions = existingConditions;

      if (alreadySelected) {
        updatedConditions = existingConditions.filter(
          (item) => item.conditionId !== condition.conditionId,
        );
      } else if (selectingExclusive) {
        updatedConditions = [condition];
      } else if (!alreadyLocked) {
        updatedConditions = [...existingConditions, condition];
      } else {
        return;
      }

      const updatedData = {
        ...currentData,
        [number]: updatedConditions,
      };

      if (isAdult) {
        setTeethData(updatedData);
        calculateSummary(updatedData);
      } else {
        setChildTeethData(updatedData);
        calculateChildSummary(updatedData);
      }
    };

    const handleDashboardCheckbox = (scheduleId) => {
      setDashboardAppointments((prev) =>
        prev.map((app) =>
          app.scheduleId === scheduleId
            ? { ...app, isSelected: !app.isSelected }
            : app,
        ),
      );
    };

    const calculateSummary = (updatedData) => {
      let missing = 0;
      let unsalvageable = 0;
      let points = 0;
      let otherConditions = 0;
      let affected = 0;

      Object.values(updatedData).forEach((conditions) => {
        if (conditions.length > 0) affected++;

        conditions.forEach((condition) => {
          if (condition.isMissing) missing++;
          if (condition.isUnsalvageable) unsalvageable++;
          if (
            condition.conditionName !== "Normal" &&
            !condition.isMissing &&
            !condition.isUnsalvageable
          ) {
            otherConditions++;
          }
          points += condition.points || 0;
        });
      });

      setAdultDentalSummary((prev) => ({
        ...prev,
        missingTeeth: missing,
        unsalvageableTeeth: unsalvageable,
        otherConditionsCount: otherConditions,
        affectedTeeth: affected,
        dentalPoints: points,
      }));
    };

    const calculateChildSummary = (updatedData) => {
      let missing = 0;
      let unsalvageable = 0;
      let points = 0;
      let otherConditions = 0;
      let affected = 0;

      Object.values(updatedData).forEach((conditions) => {
        if (conditions.length > 0) affected++;

        conditions.forEach((condition) => {
          if (condition.isMissing) missing++;
          if (condition.isUnsalvageable) unsalvageable++;
          if (
            condition.conditionName !== "Normal" &&
            !condition.isMissing &&
            !condition.isUnsalvageable
          ) {
            otherConditions++;
          }
          points += condition.points || 0;
        });
      });

      setChildDentalSummary((prev) => ({
        ...prev,
        missingTeeth: missing,
        unsalvageableTeeth: unsalvageable,
        otherConditionsCount: otherConditions,
        affectedTeeth: affected,
        dentalPoints: points,
      }));
    };

    // Keep the "Procedure" summary count in sync with saved procedures per arch
    useEffect(() => {
      const adultCount = savedProcedures.filter(
        (p) => p.arch === "adult",
      ).length;
      const childCount = savedProcedures.filter(
        (p) => p.arch === "child",
      ).length;
      setAdultDentalSummary((prev) => ({
        ...prev,
        procedureCount: adultCount,
      }));
      setChildDentalSummary((prev) => ({
        ...prev,
        procedureCount: childCount,
      }));
    }, [savedProcedures]);

    const handleSelectAll = () => {
      const allSelected =
        dashboardAppointments.length > 0 &&
        dashboardAppointments.every((app) => app.isSelected);
      setDashboardAppointments((prev) =>
        prev.map((app) => ({ ...app, isSelected: !allSelected })),
      );
    };

    const handleSaveNotes = () => {
      console.log("Saving dental notes:", {
        adultDentalSummary,
        childDentalSummary,
      });
      alert("Dental examination saved successfully!");
    };

    // ==================== DENTAL PROCEDURE TABLE HANDLERS (Add/Remove rows) ====================

    const handleProcedureRowChange = (id, field, value) => {
      setProcedureRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
    };

    const buildDefaultSessionRow = () => ({
      id: 1,
      scheduledDate: "",
      scheduledTime: "",
      remarks: "",
    });

    const getSessionRows = (row) =>
      row?.sessions?.length ? row.sessions : [buildDefaultSessionRow()];

    const openSessionModal = (row) => {
      setSessionSelectRowId(row.id);
      setShowSessionModal(true);
    };

    const handleSessionRowChange = (rowId, sessionId, field, value) => {
      setProcedureRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            sessions: getSessionRows(row).map((session) =>
              session.id === sessionId
                ? { ...session, [field]: value }
                : session,
            ),
          };
        }),
      );
      setSessionRowErrors((prev) => ({
        ...prev,
        [`${rowId}-${sessionId}`]: {
          ...(prev[`${rowId}-${sessionId}`] || {}),
          [field]: "",
        },
      }));
    };

    const handleAddSessionRow = () => {
      setProcedureRows((prev) =>
        prev.map((row) => {
          if (row.id !== sessionSelectRowId) return row;
          const sessions = getSessionRows(row);
          return {
            ...row,
            sessions: [
              ...sessions,
              {
                id: sessions.length
                  ? Math.max(...sessions.map((s) => s.id)) + 1
                  : 1,
                scheduledDate: "",
                scheduledTime: "",
                remarks: "",
              },
            ],
          };
        }),
      );
      setSessionRowErrors((prev) => ({
        ...prev,
        [`${sessionSelectRowId}-${Date.now()}`]: {},
      }));
    };

    const handleRemoveSessionRow = (sessionId) => {
      setProcedureRows((prev) =>
        prev.map((row) => {
          if (row.id !== sessionSelectRowId) return row;
          const sessions = getSessionRows(row);
          return {
            ...row,
            sessions:
              sessions.length > 1
                ? sessions.filter((session) => session.id !== sessionId)
                : sessions,
          };
        }),
      );
    };

    const closeSessionModal = () => {
      setShowSessionModal(false);
      setSessionSelectRowId(null);
    };

    const handleSaveSessionRows = () => {
      const rowId = sessionSelectRowId;
      if (!rowId) return;

      const currentRow = procedureRows.find((row) => row.id === rowId);
      const sessions = getSessionRows(currentRow);
      const nextErrors = {};

      sessions.forEach((session) => {
        const key = `${rowId}-${session.id}`;
        const rowErrors = {
          scheduledDate:
            session.scheduledDate && String(session.scheduledDate).trim() !== ""
              ? ""
              : "Required",
          scheduledTime:
            session.scheduledTime && String(session.scheduledTime).trim() !== ""
              ? ""
              : "Required",
          remarks:
            session.remarks && String(session.remarks).trim() !== ""
              ? ""
              : "Required",
        };
        nextErrors[key] = rowErrors;
      });

      setSessionRowErrors((prev) => ({ ...prev, ...nextErrors }));

      const hasErrors = Object.values(nextErrors).some((rowErrors) =>
        Object.values(rowErrors).some(Boolean),
      );

      if (hasErrors) return;
      closeSessionModal();
    };

    const handleAddProcedureRow = () => {
      setProcedureRows((prev) => [
        ...prev,
        {
          id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
          arch: resolvedDentalType,
          toothNumbers: [],
          procedureId: "",
          remarks: "",
          sessions: [buildDefaultSessionRow()],
        },
      ]);
    };

    const handleRemoveProcedureRow = (id) => {
      setProcedureRows((prev) =>
        prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
      );
    };

    const handleResetProcedureForm = () => {
      setProcedureRows([
        {
          id: 1,
          arch: resolvedDentalType,
          toothNumbers: [],
          procedureId: "",
          remarks: "",
          sessions: [buildDefaultSessionRow()],
        },
      ]);
    };

    const handleSaveProcedures = () => {
      const invalid = procedureRows.some(
        (r) => r.toothNumbers.length === 0 || !r.procedureId,
      );
      if (invalid) {
        alert("Please select tooth number(s) and procedure for each row.");
        return;
      }

      const hasCompleteSession = (session = {}) =>
        session.scheduledDate &&
        String(session.scheduledDate).trim() !== "" &&
        session.scheduledTime &&
        String(session.scheduledTime).trim() !== "" &&
        session.remarks &&
        String(session.remarks).trim() !== "";

      const invalidSessionProcedure = procedureRows.some((r) =>
        getSessionRows(r).some((session) => !hasCompleteSession(session)),
      );

      if (invalidSessionProcedure) {
        alert("Please fill session date, time and remarks before saving the procedure.");
        return;
      }

      const newlySaved = procedureRows.map((r) => ({
        ...r,
        procedureName:
          procedures.find((p) => p.procedureId === parseInt(r.procedureId))
            ?.procedureName || "",
        sessions: getSessionRows(r),
      }));

      // Keep the saved rows in the editor so recalled procedures remain editable.
      // The table below mirrors the current editor instead of appending duplicates.
      setSavedProcedures(newlySaved);
      alert("Dental procedure(s) saved successfully!");
    };

    const getSelectedToothConditions = () => {
      const currentData =
        resolvedDentalType === "adult" ? teethData : childTeethData;
      const toothIdMap =
        resolvedDentalType === "adult" ? adultToothIdMap : childToothIdMap;

      return Object.entries(currentData).flatMap(([toothNumber, conditions]) =>
        (conditions || [])
          .filter((condition) => condition?.conditionId)
          .map((condition) => ({
            toothId: toothIdMap[Number(toothNumber)] || null,
            conditionId: Number(condition.conditionId),
          }))
          .filter((item) => item.toothId && item.conditionId),
      );
    };

    const fetchToothCatalog = async () => {
      try {
        const toothType =
          resolvedDentalType === "child" ? "primary" : "permanent";
        const response = await getRequest(
          `${MAS_TOOTH_BY_TYPE}/getAll/${toothType}`,
        );

        const toothList = Array.isArray(response?.response)
          ? response.response
          : Array.isArray(response?.data?.response)
            ? response.data.response
            : [];

        const layout = buildToothLayout(toothList);
        const toothIdMap = buildToothIdMap(toothList);
        setAdultToothLayout({
          upperRight: layout.upperRight,
          upperLeft: layout.upperLeft,
          lowerLeft: layout.lowerLeft,
          lowerRight: layout.lowerRight,
        });
        setAdultToothIdMap(
          toothType === "permanent" ? toothIdMap : {},
        );
        setChildToothLayout({
          upperRight: layout.childUpperRight,
          upperLeft: layout.childUpperLeft,
          lowerLeft: layout.childLowerLeft,
          lowerRight: layout.childLowerRight,
        });
        setChildToothIdMap(
          toothType === "primary" ? toothIdMap : {},
        );
      } catch (err) {
        console.error("Error fetching tooth catalog:", err);
      }
    };

    const buildDentalPayload = () => {
      const isChild = resolvedDentalType === "child";
      const activeSummary = isChild ? childDentalSummary : adultDentalSummary;
      const toothIdMap =
        resolvedDentalType === "adult" ? adultToothIdMap : childToothIdMap;
      const procedureSource =
        savedProcedures.length > 0
          ? savedProcedures
          : procedureRows.filter(
              (row) => row.procedureId && row.toothNumbers?.length > 0,
            );

      const buildProcedureTeeth = (procedure) =>
        (procedure.toothNumbers || [])
          .map((toothNumber) => ({
            toothId: toothIdMap[Number(toothNumber)] || null,
            toothSurface: "",
          }))
          .filter((item) => item.toothId);

      const buildScheduledDateTime = (session) => {
        if (session.scheduledDateTime) return session.scheduledDateTime;
        if (session.scheduledDate && session.scheduledTime) {
          return `${session.scheduledDate}T${session.scheduledTime}`;
        }
        if (session.scheduledDate) {
          return `${session.scheduledDate}T00:00:00`;
        }
        return null;
      };

      return {
        patientId: patientId || null,
        visitId: visitId || null,
        dentalExamination: {
          missingTeeth: activeSummary.missingTeeth,
          unsalvageableTeeth: activeSummary.unsalvageableTeeth,
          affectedTeeth: activeSummary.affectedTeeth,
          dentalDiseaseScore: activeSummary.dentalPoints,
          notes: activeSummary.notes,
          ongoingProcedures: activeSummary.procedureCount,
          totalTeeth: isChild ? 20 : 32,
          toothConditions: getSelectedToothConditions(),
        },
        proceduresDetails: procedureSource.map((procedure) => ({
          procedureId: procedure.procedureId ? Number(procedure.procedureId) : null,
          plannedSessionCount: Array.isArray(procedure.sessions)
            ? procedure.sessions.length
            : 0,
          remarks: procedure.remarks || "",
          sessions: (procedure.sessions || []).map((session) => ({
            sessionNo: session.sessionNo || session.id || null,
            scheduledDateTime: buildScheduledDateTime(session),
            remarks: session.remarks || "",
          })),
          dentalProcedureTeeth: buildProcedureTeeth(procedure),
        })),
      };
    };

    useImperativeHandle(ref, () => ({
      getDentalPayload: buildDentalPayload,
    }));

    // ---- Teeth select popup (opened from the Tooth No. cell in the procedure table) ----

    const openTeethSelectModal = (row) => {
      setTeethSelectRowId(row.id);
      setTeethSelectArch(row.arch || resolvedDentalType);
      setTempSelectedTeeth(row.toothNumbers || []);
      setShowTeethSelectModal(true);
    };

    const toggleTempTooth = (tooth) => {
      setTempSelectedTeeth((prev) =>
        prev.includes(tooth)
          ? prev.filter((t) => t !== tooth)
          : [...prev, tooth],
      );
    };

    const handleConfirmTeethSelect = () => {
      setProcedureRows((prev) =>
        prev.map((r) =>
          r.id === teethSelectRowId
            ? { ...r, toothNumbers: tempSelectedTeeth }
            : r,
        ),
      );
      setShowTeethSelectModal(false);
    };

    const handleCancelTeethSelect = () => {
      setShowTeethSelectModal(false);
      setTempSelectedTeeth([]);
      setTeethSelectRowId(null);
    };

    // ---- Dental History / Procedure History open handlers ----

    const openDentalHistoryModal = () => {
      setShowDentalHistoryModal(true);
      fetchDentalHistory(1); // Reset to page 1 on open
    };

    const openProcedureHistoryModal = () => {
      setShowProcedureHistoryModal(true);
      fetchProcedureHistory(1); // Reset to page 1 on open
    };

    // ---- Dental Procedure History -> View Details ----

    const openProcedureDetail = (item) => {
      setSelectedProcedureHistory(item);
      setShowProcedureDetailModal(true);
      setProcedureSessionHistory([]);
      setProcedureDetailError(null);
      fetchProcedureSessionHistory(item?.procedureDtId);
    };

    const closeProcedureDetail = () => {
      setShowProcedureDetailModal(false);
      setSelectedProcedureHistory(null);
      setProcedureSessionHistory([]);
      setProcedureDetailError(null);
    };

    // ==================== TOOTH BOX COMPONENT ====================
    const ToothBox = ({ tooth, toothData, bgColor, onClick }) => {
      const selectedConditions = toothData || [];

      return (
        <div className="text-center mx-1 mb-1">
          <div
            className="d-flex align-items-center justify-content-center fw-bold"
            onClick={onClick}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              backgroundColor: bgColor,
              color: "#fff",
              cursor: "pointer",
              border: "1px solid #dee2e6",
            }}
          >
            {tooth}
          </div>

          <div className="mt-1 text-start">
            {selectedConditions.map((condition) => (
              <div
                key={condition.conditionId}
                className="d-flex align-items-center gap-1"
                style={{ fontSize: "10px" }}
              >
                <input type="checkbox" checked readOnly />
                <span>{condition.conditionName}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Small chip-style tooth button used inside the "Select Teeth" popup
    const SelectableToothChip = ({ tooth, isSelected, onClick }) => (
      <span
        onClick={onClick}
        className="d-inline-flex align-items-center justify-content-center mx-1 mb-1"
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          border: isSelected ? "2px solid #0d6efd" : "1px solid #ced4da",
          backgroundColor: isSelected ? "#0d6efd" : "#fff",
          color: isSelected ? "#fff" : "#212529",
        }}
      >
        {tooth}
      </span>
    );

    // ==================== RENDER FUNCTIONS ====================

    // Compact summary card used in the 6-across stat row
    const SummaryCard = ({ label, value, bg, textDark = false }) => (
      <div className="flex-fill" style={{ minWidth: 0 }}>
        <div className={`card ${bg} ${textDark ? "text-dark" : "text-white"}`}>
          <div className="card-body px-2 py-1 text-center">
            <div
              className="small text-truncate"
              style={{ fontSize: "0.68rem", lineHeight: 1.1 }}
            >
              {label}
            </div>
            <div
              className="fw-bold"
              style={{ fontSize: "1.05rem", lineHeight: 1.2 }}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    );

    const renderSummaryRow = (summary) => (
      <div
        className="d-flex gap-2 mb-2 flex-nowrap"
        style={{ overflowX: "auto" }}
      >
        <SummaryCard
          label="Total Teeth"
          value={summary.totalTeeth}
          bg="bg-primary"
        />
        <SummaryCard
          label="Missing"
          value={summary.missingTeeth}
          bg="bg-danger"
        />
        <SummaryCard
          label="Unsalvageable"
          value={summary.unsalvageableTeeth}
          bg="bg-warning"
          textDark
        />
        <SummaryCard
          label="Affected Teeth"
          value={summary.affectedTeeth}
          bg="bg-info"
        />
        <SummaryCard
          label="Procedure"
          value={summary.procedureCount}
          bg="bg-secondary"
        />
        <SummaryCard
          label="DDS Points"
          value={summary.dentalPoints}
          bg="bg-success"
        />
      </div>
    );

    const renderToothChart = (isAdult) => {
      const layout = isAdult ? adultToothLayout : childToothLayout;
      const upperRight = layout.upperRight;
      const upperLeft = layout.upperLeft;
      const lowerLeft = layout.lowerLeft;
      const lowerRight = layout.lowerRight;
      const data = isAdult ? teethData : childTeethData;

      return (
        <div className="mb-2">
          <h6
            className={`fw-bold ${isAdult ? "text-primary" : "text-success"}`}
          >
            {isAdult ? "Adult Teeth" : "Child Teeth"}
          </h6>

          <div className="d-flex justify-content-center gap-2 mb-2 flex-wrap">
            <span>
              <span className="badge bg-success">🟢</span> Normal
            </span>
            <span>
              <span className="badge bg-warning">🟡</span> Condition
            </span>
            <span>
              <span className="badge bg-danger">🔴</span> Missing
            </span>
            <span>
              <span
                className="badge"
                style={{ backgroundColor: "#fd7e14", color: "white" }}
              >
                🟠
              </span>{" "}
              Unsalvageable
            </span>
          </div>
          <div className="small text-muted mb-2 text-center">
            Missing and unsalvageable teeth lock the rest of the conditions for
            that tooth.
          </div>

          <div className="text-center mb-2">
            <span className="badge bg-secondary">Upper Right</span>
            <span className="mx-4"></span>
            <span className="badge bg-secondary">Upper Left</span>
          </div>
          <div className="d-flex justify-content-center mb-2 flex-wrap">
            <div className="d-flex flex-wrap justify-content-center">
              {upperRight.map((tooth) => (
                <ToothBox
                  key={tooth}
                  tooth={tooth}
                  toothData={data[tooth]}
                  bgColor={getToothColor(tooth, isAdult)}
                  onClick={() => handleToothClick(tooth, isAdult)}
                />
              ))}
            </div>
            <div className="mx-2"></div>
            <div className="d-flex flex-wrap justify-content-center">
              {upperLeft.map((tooth) => (
                <ToothBox
                  key={tooth}
                  tooth={tooth}
                  toothData={data[tooth]}
                  bgColor={getToothColor(tooth, isAdult)}
                  onClick={() => handleToothClick(tooth, isAdult)}
                />
              ))}
            </div>
          </div>

          <div className="text-center small text-muted mb-2">Midline</div>

          <div className="text-center mb-2">
            <span className="badge bg-secondary">Lower Right</span>
            <span className="mx-4"></span>
            <span className="badge bg-secondary">Lower Left</span>
          </div>
          <div className="d-flex justify-content-center flex-wrap">
            <div className="d-flex flex-wrap justify-content-center">
              {lowerRight.map((tooth) => (
                <ToothBox
                  key={tooth}
                  tooth={tooth}
                  toothData={data[tooth]}
                  bgColor={getToothColor(tooth, isAdult)}
                  onClick={() => handleToothClick(tooth, isAdult)}
                />
              ))}
            </div>
            <div className="mx-2"></div>
            <div className="d-flex flex-wrap justify-content-center">
              {lowerLeft.map((tooth) => (
                <ToothBox
                  key={tooth}
                  tooth={tooth}
                  toothData={data[tooth]}
                  bgColor={getToothColor(tooth, isAdult)}
                  onClick={() => handleToothClick(tooth, isAdult)}
                />
              ))}
            </div>
          </div>
        </div>
      );
    };

    const renderDashboard = (type) => {
      const title =
        type === "adult"
          ? "Adult Dental Appointment Dashboard"
          : "Child Dental Appointment Dashboard";

      return (
        <div className="mt-4">
          <hr />
          <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap">
            <h6 className="fw-bold">{title}</h6>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() =>
                type === "adult"
                  ? setShowAdultDashboard(false)
                  : setShowChildDashboard(false)
              }
            >
              Hide Dashboard
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Select Date</label>
            <input
              type="date"
              className="form-control w-auto"
              value={selectedDashboardDate}
              onChange={(e) => setSelectedDashboardDate(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        dashboardAppointments.length > 0 &&
                        dashboardAppointments.every((app) => app.isSelected)
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Procedure</th>
                  <th>Teeth</th>
                  <th>Scheduled By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboardAppointments.length > 0 ? (
                  dashboardAppointments.map((app, idx) => (
                    <tr key={app.scheduleId}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={app.isSelected || false}
                          onChange={() =>
                            handleDashboardCheckbox(app.scheduleId)
                          }
                        />
                      </td>
                      <td>{idx + 1}</td>
                      <td>{app.patientName}</td>
                      <td>{app.age}</td>
                      <td>{app.gender}</td>
                      <td>{app.procedureName}</td>
                      <td>{app.toothNumbers}</td>
                      <td>{app.scheduledBy}</td>
                      <td>
                        <span
                          className={`badge ${app.scheduleStatus === "CLOSED" ? "bg-success" : app.scheduleStatus === "IN_PROGRESS" ? "bg-warning" : "bg-primary"}`}
                        >
                          {app.scheduleStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => setSelectedAppointment(app)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">
                      No appointments for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    // New Dental Procedure section (Add/Remove row pattern, teeth picked via popup)
    const renderDentalProcedureSection = () => (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white py-2">
          <strong>Dental Procedure</strong>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table
              className="table table-bordered table-sm align-middle"
              style={{ fontSize: "0.8rem" }}
            >
              <thead className="table-light">
                <tr>
                  <th style={{ width: "40px" }}>S.No.</th>
                  <th>
                    Tooth No. <span className="text-danger">*</span>
                  </th>
                  <th>
                    Procedure Name <span className="text-danger">*</span>
                  </th>
                  <th>Sessions</th>
                  <th>Remarks</th>
                  <th style={{ width: "50px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {procedureRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm w-100 text-start"
                        onClick={() => openTeethSelectModal(row)}
                      >
                        {row.toothNumbers.length > 0
                          ? row.toothNumbers.join(", ")
                          : "Select teeth..."}
                      </button>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={row.procedureId}
                        onChange={(e) =>
                          handleProcedureRowChange(
                            row.id,
                            "procedureId",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select Procedure</option>

                        {procedures.map((proc) => (
                          <option
                            key={proc.procedureId}
                            value={proc.procedureId}
                          >
                            {proc.procedureName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 mt-1"
                        onClick={() => openSessionModal(row)}
                      >
                        Select Session
                        {row.sessions?.length
                          ? ` (${row.sessions.length})`
                          : ""}
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Optional remarks"
                        value={row.remarks}
                        onChange={(e) =>
                          handleProcedureRowChange(
                            row.id,
                            "remarks",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveProcedureRow(row.id)}
                        disabled={procedureRows.length === 1}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-success btn-sm mb-3"
            onClick={handleAddProcedureRow}
          >
            + Add Procedure
          </button>

          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetProcedureForm}
            >
              Reset
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveProcedures}
            >
              Save Procedure
            </button>
          </div>

          {savedProcedures.length > 0 && (
            <div className="table-responsive mt-3">
              <table
                className="table table-bordered table-sm"
                style={{ fontSize: "0.75rem" }}
              >
                <thead className="table-light">
                  <tr>
                    <th>S.No.</th>
                    <th>Arch</th>
                    <th>Tooth No.</th>
                    <th>Procedure Name</th>
                    <th>Sessions</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {savedProcedures.map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="text-capitalize">{p.arch}</td>
                      <td>{p.toothNumbers.join(", ")}</td>
                      <td>{p.procedureName}</td>
                      <td>
                        {p.sessions?.length ? (
                          <div className="small">
                            {p.sessions.map((session) => (
                              <div key={session.id}>
                                {session.scheduledDate} {session.scheduledTime}
                                {session.remarks ? ` - ${session.remarks}` : ""}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{p.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );

    // ==================== MAIN RENDER ====================

    const currentSummary =
      resolvedDentalType === "adult" ? adultDentalSummary : childDentalSummary;

    // Show loading indicator
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading tooth conditions...</p>
        </div>
      );
    }

    return (
      <div>
        {/* Show error message if API fails */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <strong>Error:</strong> {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {hideHeader && (
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap">
            <h5 className="fw-bold mb-0">Dental Examination</h5>
            <div className="d-flex gap-2 mt-2 mt-sm-0 flex-wrap">
              <button
                className="btn btn-sm btn-outline-info"
                onClick={openDentalHistoryModal}
              >
                Dental History
              </button>
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={openProcedureHistoryModal}
              >
                Dental Procedure History
              </button>
            </div>
          </div>
        )}

        {/* Active (Adult or Child) Section */}
        <div className="card mb-4 p-3">
          {renderSummaryRow(currentSummary)}
          {renderToothChart(resolvedDentalType === "adult")}
          <div className="mb-3">
            <label className="form-label fw-bold">
              {resolvedDentalType === "adult" ? "Adult" : "Child"} Notes /
              Remarks
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={currentSummary.notes}
              onChange={(e) => {
                const value = e.target.value;
                if (resolvedDentalType === "adult") {
                  setAdultDentalSummary((prev) => ({ ...prev, notes: value }));
                } else {
                  setChildDentalSummary((prev) => ({ ...prev, notes: value }));
                }
              }}
              placeholder={`Enter ${resolvedDentalType} dental notes...`}
            />
          </div>
        </div>

        {/* New Dental Procedure section (replaces old Schedule Procedure button/modal) */}
        {renderDentalProcedureSection()}

        {/* Adult Dashboard */}
        {showAdultDashboard && renderDashboard("adult")}

        {/* Child Dashboard */}
        {showChildDashboard && renderDashboard("child")}

        {/* Save Button */}
        {!hideButtons && (
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary" onClick={handleSaveNotes}>
              Save Dental Examination
            </button>
          </div>
        )}

        {/* ==================== Session Selection Modal ==================== */}
        {showSessionModal && (
          <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Select Session</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeSessionModal}
                  />
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "20%" }}>Scheduled Date</th>
                          <th style={{ width: "20%" }}>Scheduled Time</th>
                          <th>Remark</th>
                          <th style={{ width: "70px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const selectedRow = procedureRows.find(
                            (row) => row.id === sessionSelectRowId,
                          );
                          return selectedRow
                            ? getSessionRows(selectedRow).map((session) => (
                                <tr key={session.id}>
                                  <td>
                                    <input
                                      type="date"
                                      className={`form-control form-control-sm ${sessionRowErrors[`${sessionSelectRowId}-${session.id}`]?.scheduledDate ? "is-invalid" : ""}`}
                                      value={session.scheduledDate}
                                      onChange={(e) =>
                                        handleSessionRowChange(
                                          sessionSelectRowId,
                                          session.id,
                                          "scheduledDate",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="time"
                                      className={`form-control form-control-sm ${sessionRowErrors[`${sessionSelectRowId}-${session.id}`]?.scheduledTime ? "is-invalid" : ""}`}
                                      value={session.scheduledTime}
                                      onChange={(e) =>
                                        handleSessionRowChange(
                                          sessionSelectRowId,
                                          session.id,
                                          "scheduledTime",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm ${sessionRowErrors[`${sessionSelectRowId}-${session.id}`]?.remarks ? "is-invalid" : ""}`}
                                      placeholder="Enter remark"
                                      value={session.remarks}
                                      onChange={(e) =>
                                        handleSessionRowChange(
                                          sessionSelectRowId,
                                          session.id,
                                          "remarks",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-sm"
                                      onClick={() =>
                                        handleRemoveSessionRow(session.id)
                                      }
                                      disabled={
                                        getSessionRows(selectedRow).length === 1
                                      }
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))
                            : null;
                        })()}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm mt-3"
                    onClick={handleAddSessionRow}
                  >
                    + Add Session Row
                  </button>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeSessionModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveSessionRows}
                  >
                    Save Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Condition Selection Modal */}
        {showConditionModal && (
          <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>
                    Tooth {selectedTooth?.number} (
                    {selectedTooth?.isAdult ? "Adult" : "Child"})
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowConditionModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row">
                    {toothConditions.length > 0 ? (
                      toothConditions
                        .filter(
                          (condition) => condition.conditionName !== "Normal",
                        )
                        .map((condition) => {
                          const checked = (
                            selectedTooth?.isAdult
                              ? teethData[selectedTooth?.number]
                              : childTeethData[selectedTooth?.number]
                          )?.some(
                            (item) =>
                              item.conditionId === condition.conditionId,
                          );

                          const selectedConditions = selectedTooth?.isAdult
                            ? teethData[selectedTooth?.number] || []
                            : childTeethData[selectedTooth?.number] || [];

                          const lockedByExclusiveCondition =
                            hasExclusiveCondition(selectedConditions);
                          const disabled =
                            !checked &&
                            lockedByExclusiveCondition &&
                            !isExclusiveToothCondition(condition);

                          return (
                            <div
                              className="col-md-6 mb-2"
                              key={condition.conditionId}
                            >
                              <div
                                className="border rounded p-2 d-flex align-items-center justify-content-between"
                                style={{
                                  cursor: disabled ? "not-allowed" : "pointer",
                                  opacity: disabled ? 0.55 : 1,
                                }}
                                onClick={() => {
                                  if (!disabled) {
                                    handleConditionSelect(condition);
                                  }
                                }}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    readOnly
                                  />
                                  <span>{condition.conditionName}</span>
                                </div>
                                <span className="badge bg-secondary">
                                  {condition.points} pts
                                </span>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="col-12 text-center text-muted py-3">
                        No conditions available
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowConditionModal(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Select Teeth Modal ==================== */}
        {showTeethSelectModal && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1040,
              }}
              onClick={handleCancelTeethSelect}
            />
            <div
              className="modal show d-block"
              tabIndex={-1}
              role="dialog"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
                zIndex: 1050,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-dialog modal-dialog-centered modal-lg"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">Select Teeth</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={handleCancelTeethSelect}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="text-center mb-2">
                      <span className="badge bg-secondary">Upper Right</span>
                      <span className="mx-4"></span>
                      <span className="badge bg-secondary">Upper Left</span>
                    </div>
                    <div className="d-flex justify-content-center mb-2 flex-wrap">
                      <div className="d-flex flex-wrap justify-content-center">
                        {(teethSelectArch === "adult"
                          ? adultToothLayout.upperRight
                          : childToothLayout.upperRight
                        ).map((tooth) => (
                          <SelectableToothChip
                            key={tooth}
                            tooth={tooth}
                            isSelected={tempSelectedTeeth.includes(tooth)}
                            onClick={() => toggleTempTooth(tooth)}
                          />
                        ))}
                      </div>
                      <div className="mx-3"></div>
                      <div className="d-flex flex-wrap justify-content-center">
                        {(teethSelectArch === "adult"
                          ? adultToothLayout.upperLeft
                          : childToothLayout.upperLeft
                        ).map((tooth) => (
                          <SelectableToothChip
                            key={tooth}
                            tooth={tooth}
                            isSelected={tempSelectedTeeth.includes(tooth)}
                            onClick={() => toggleTempTooth(tooth)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-center small text-muted mb-2">
                      Midline
                    </div>

                    <div className="text-center mb-2">
                      <span className="badge bg-secondary">Lower Right</span>
                      <span className="mx-4"></span>
                      <span className="badge bg-secondary">Lower Left</span>
                    </div>
                    <div className="d-flex justify-content-center mb-3 flex-wrap">
                      <div className="d-flex flex-wrap justify-content-center">
                        {(teethSelectArch === "adult"
                          ? adultToothLayout.lowerRight
                          : childToothLayout.lowerRight
                        ).map((tooth) => (
                          <SelectableToothChip
                            key={tooth}
                            tooth={tooth}
                            isSelected={tempSelectedTeeth.includes(tooth)}
                            onClick={() => toggleTempTooth(tooth)}
                          />
                        ))}
                      </div>
                      <div className="mx-3"></div>
                      <div className="d-flex flex-wrap justify-content-center">
                        {(teethSelectArch === "adult"
                          ? adultToothLayout.lowerLeft
                          : childToothLayout.lowerLeft
                        ).map((tooth) => (
                          <SelectableToothChip
                            key={tooth}
                            tooth={tooth}
                            isSelected={tempSelectedTeeth.includes(tooth)}
                            onClick={() => toggleTempTooth(tooth)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-top pt-2">
                      <label className="form-label fw-bold small mb-1">
                        Selected Teeth
                      </label>
                      <div>
                        {tempSelectedTeeth.length > 0 ? (
                          tempSelectedTeeth.map((tooth) => (
                            <span
                              key={tooth}
                              className="badge bg-primary me-1 mb-1"
                            >
                              {tooth}{" "}
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() => toggleTempTooth(tooth)}
                              >
                                ✕
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">
                            No teeth selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleCancelTeethSelect}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleConfirmTeethSelect}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Appointment Detail Modal */}
        {showDetailModal && selectedAppointment && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Appointment Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDetailModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    <strong>Patient:</strong> {selectedAppointment.patientName}
                  </p>
                  <p>
                    <strong>Procedure:</strong>{" "}
                    {selectedAppointment.procedureName}
                  </p>
                  <p>
                    <strong>Teeth:</strong> {selectedAppointment.toothNumbers}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedDashboardDate}
                  </p>
                  <p>
                    <strong>Scheduled By:</strong>{" "}
                    {selectedAppointment.scheduledBy}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedAppointment.scheduleStatus}
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Dental History Modal ==================== */}
        {showDentalHistoryModal && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1040,
              }}
              onClick={() => setShowDentalHistoryModal(false)}
            />
            <div
              className="modal show d-block"
              tabIndex={-1}
              role="dialog"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
                zIndex: 1050,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-dialog modal-dialog-centered modal-xl"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">Dental History</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowDentalHistoryModal(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="card shadow-sm">
                      <div className="card-header bg-secondary py-2">
                        <strong>Past Dental Visit Records</strong>
                      </div>
                      <div className="card-body p-1">
                        {dentalHistoryLoading ? (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small text-muted">
                              Loading dental history...
                            </p>
                          </div>
                        ) : dentalHistoryError ? (
                          <div className="alert alert-danger m-3 mb-3">
                            {dentalHistoryError}
                          </div>
                        ) : (
                          <>
                            <div className="table-responsive">
                              <table
                                className="table table-bordered table-hover mb-0 align-middle"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <thead className="table-light">
                                  <tr>
                                    <th>Date</th>
                                    <th>DDS</th>
                                    <th>Missing</th>
                                    <th>Unsalvageable</th>
                                    <th>Affected</th>
                                    <th>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dentalHistoryRecords.length > 0 ? (
                                    dentalHistoryRecords.map((record) => (
                                      <tr
                                        key={
                                          record.summaryId ?? record.visitId
                                        }
                                      >
                                        <td>
                                          {formatDateForDisplay(record.date)}
                                        </td>
                                        <td>
                                          {displayValue(
                                            record.dentalDigitScore,
                                          )}
                                        </td>
                                        <td>
                                          {displayValue(record.missingTeeth)}
                                        </td>
                                        <td>
                                          {displayValue(
                                            record.unsalvageableTeeth,
                                          )}
                                        </td>
                                        <td>
                                          {displayValue(record.affectedTeeth)}
                                        </td>
                                        <td>{displayValue(record.notes)}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="text-center text-muted py-3"
                                      >
                                        No dental history is available for this
                                        patient yet.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {dentalHistoryTotalElements > 0 && (
                              <div className="p-3 border-top">
                                <Pagination
                                  totalItems={dentalHistoryTotalElements}
                                  itemsPerPage={5}
                                  currentPage={dentalHistoryPage}
                                  onPageChange={(page) => fetchDentalHistory(page)}
                                  showEntriesText={true}
                                  showGoToPage={true}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowDentalHistoryModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== Dental Procedure History Modal ==================== */}
        {showProcedureHistoryModal && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1040,
              }}
              onClick={() => setShowProcedureHistoryModal(false)}
            />
            <div
              className="modal show d-block"
              tabIndex={-1}
              role="dialog"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
                zIndex: 1050,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-dialog modal-dialog-centered modal-xl"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      Past Dental Procedure History
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowProcedureHistoryModal(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="card shadow-sm">
                      <div className="card-header bg-secondary text-white py-2">
                        <strong>Procedures</strong>
                      </div>
                      <div className="card-body p-0">
                        {procedureHistoryLoading ? (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 mb-0 small text-muted">
                              Loading procedure history...
                            </p>
                          </div>
                        ) : procedureHistoryError ? (
                          <div className="alert alert-danger m-3 mb-3">
                            {procedureHistoryError}
                          </div>
                        ) : (
                          <>
                            <div className="table-responsive">
                              <table
                                className="table table-bordered table-hover mb-0 align-middle"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <thead className="table-light">
                                  <tr>
                                    <th>S.No.</th>
                                    <th>Procedure Name</th>
                                    <th>Tooth No.</th>
                                    <th>Status</th>
                                    <th>First Sitting Date</th>
                                    <th>Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {procedureHistoryRecords.length > 0 ? (
                                    procedureHistoryRecords.map(
                                      (item, idx) => {
                                        const completed = isCompletedStatus(
                                          item.status,
                                        );

                                        return (
                                          <tr key={item.procedureDtId ?? idx}>
                                            <td>{idx + 1}</td>
                                            <td className="fw-bold">
                                              {displayValue(
                                                item.procedureName,
                                              )}
                                            </td>
                                            <td>
                                              {displayValue(item.teethNumber)}
                                            </td>
                                            <td>
                                              <span
                                                className={`badge ${
                                                  completed
                                                    ? "bg-success"
                                                    : "bg-danger"
                                                }`}
                                              >
                                                {completed
                                                  ? "Completed"
                                                  : "Pending"}
                                              </span>
                                            </td>
                                            <td>
                                              {formatDateForDisplay(
                                                item.firstSittingDate,
                                              )}
                                            </td>
                                            <td>
                                              <button
                                                className="btn btn-link btn-sm p-0"
                                                onClick={() =>
                                                  openProcedureDetail(item)
                                                }
                                              >
                                                View Details
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      },
                                    )
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="text-center text-muted py-3"
                                      >
                                        No dental procedure history is available
                                        for this patient yet.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {procedureHistoryTotalElements > 0 && (
                              <div className="p-3 border-top">
                                <Pagination
                                  totalItems={procedureHistoryTotalElements}
                                  itemsPerPage={5}
                                  currentPage={procedureHistoryPage}
                                  onPageChange={(page) => fetchProcedureHistory(page)}
                                  showEntriesText={true}
                                  showGoToPage={true}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowProcedureHistoryModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== Procedure Details Modal (View Details) ==================== */}
        {showProcedureDetailModal && selectedProcedureHistory && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1065,
              }}
              onClick={closeProcedureDetail}
            />
            <div
              className="modal show d-block"
              tabIndex={-1}
              role="dialog"
              style={{
                width: "calc(100vw - 310px)",
                left: "285px",
                maxWidth: "none",
                height: "90vh",
                margin: "5vh auto",
                position: "fixed",
                zIndex: 1070,
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-dialog modal-dialog-centered modal-lg"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">Procedure Details</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeProcedureDetail}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6 mb-2">
                        <strong>Procedure:</strong>{" "}
                        {displayValue(selectedProcedureHistory.procedureName)}
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Tooth No.:</strong>{" "}
                        {displayValue(selectedProcedureHistory.teethNumber)}
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Advised By:</strong>{" "}
                        {displayValue(selectedProcedureHistory.advisedBy)}
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Advised Date:</strong>{" "}
                        {formatDateForDisplay(
                          selectedProcedureHistory.advisedDate,
                        )}
                      </div>
                      <div className="col-md-4 mb-2">
                        <strong>Planned Sittings:</strong>{" "}
                        {displayValue(
                          selectedProcedureHistory.plannedSittings,
                        )}
                      </div>
                      <div className="col-md-4 mb-2">
                        <strong>Completed Sittings:</strong>{" "}
                        {displayValue(
                          selectedProcedureHistory.completedSittings,
                        )}
                      </div>
                      <div className="col-md-4 mb-2">
                        <strong>Procedure Status:</strong>{" "}
                        <span
                          className={`badge ${
                            isCompletedStatus(
                              selectedProcedureHistory.status,
                            )
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {isCompletedStatus(
                            selectedProcedureHistory.status,
                          )
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </div>
                    </div>

                    <hr />

                    <h6 className="fw-bold mb-3">Session History</h6>

                    {procedureDetailLoading ? (
                      <div className="text-center py-4">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 mb-0 small text-muted">
                          Loading session history...
                        </p>
                      </div>
                    ) : procedureDetailError ? (
                      <div className="alert alert-danger mb-0">
                        {procedureDetailError}
                      </div>
                    ) : procedureSessionHistory.length > 0 ? (
                      procedureSessionHistory.map((session) => (
                        <div
                          key={session.sessionId}
                          className="border rounded p-3 mb-3"
                        >
                          <h6 className="text-primary mb-2">
                            Session {displayValue(session.sessionNumber)}
                          </h6>
                          <div className="row small">
                            <div className="col-md-6 mb-1">
                              <strong>Scheduled Date/Time:</strong>{" "}
                              {formatDateTimeForDisplay(
                                session.sessionDateTime,
                              )}
                            </div>
                            <div className="col-md-6 mb-1">
                              <strong>Performed Date/Time:</strong>{" "}
                              {formatDateTimeForDisplay(session.performedAt)}
                            </div>
                            <div className="col-md-6 mb-1">
                              <strong>Performed By:</strong>{" "}
                              {displayValue(session.performedBy)}
                            </div>
                            <div className="col-md-6 mb-1">
                              <strong>Status:</strong>{" "}
                              {displayValue(session.sessionStatus)}
                            </div>
                            <div className="col-md-6 mb-1">
                              <strong>Final Session:</strong>{" "}
                              {session.isFinalSession === "Y"
                                ? "Yes"
                                : session.isFinalSession === "N"
                                  ? "No"
                                  : "N/A"}
                            </div>
                            <div className="col-md-6 mb-1">
                              <strong>Complication:</strong>{" "}
                              {session.complicationFlag === "Y"
                                ? `Yes${
                                    session.complicationDetails
                                      ? ` - ${session.complicationDetails}`
                                      : ""
                                  }`
                                : session.complicationFlag === "N"
                                  ? "No"
                                  : "N/A"}
                            </div>
                            <div className="col-12 mb-1">
                              <strong>Findings:</strong>{" "}
                              {displayValue(session.procedureFindings)}
                            </div>
                            <div className="col-12 mb-1">
                              <strong>Procedure Notes:</strong>{" "}
                              {displayValue(session.procedureNotes)}
                            </div>
                            <div className="col-12 mb-1">
                              <strong>Post Procedure Advice:</strong>{" "}
                              {displayValue(session.postProcedureAdvise)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted py-3">
                        No session history is available for this procedure.
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={closeProcedureDetail}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);

export default DentalSection;