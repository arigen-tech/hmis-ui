import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import Popup from "../../../Components/popup";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  GET_OBG_EXAMINATION_DETAIL,
  GET_WAITING_LIST,
} from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading/index";
import {
  MAS_OB_CONCEPTION,
  MAS_OB_CONSANGUINITY,
  OB_BOOKED_STATUS,
  OB_MAS_IMMUNISED_STATUS,
  MAS_OB_TRIMESTER,
  MAS_PRESENTATION,
  MAS_OB_PVMEMBRANE,
  MAS_OB_PVLIQUOR,
  MAS_CERVIX_CONSISTENCY,
  MAS_CERVIX_POSITION,
  MAS_STATION_PRESENTATION,
  MAS_OP_PELVIS_TYPE,
  MAS_GYN_FLOW,
  MAS_MENARCHE_AGE,
  MAS_MENSTRUAl_PATTERN,
  MAS_STERILISATION,
  MAS_GYN_POPSMEAR,
  SAVE_OBG_DETAILS,
} from "../../../config/apiConfig";

const defaultOBGForm = {
  obstetricScore: { g: "", p: "", a: "", l: "" },
  conception: "",
  marriedLife: "",
  consanguinity: "",
  booked: "",
  immunised: "",
  trimesters: "",
  gc: "",
  paA: "",
  peA: "",
  tt: "",
  fhr: "",
  presentation: "",
  palpation: "",
  pv: "",
  inspectionHeight: { select: "", specify: "", remarks: "" },
  menstrual: {
    ageOfMenarche: "",
    cycles: "",
    rangeNoOfDays: "",
    interval: "",
    flow: "",
    menstrualPause: "",
  },
  respiratory: { system: "", breathSounds: "" },
  cardiovascular: { s1: "", s2: "", murmurs: "" },
  pvExam: {
    osDilatation: "",
    effacement: "",
    membrane: "",
    liquor: "",
    consistency: "",
    position: "",
    length: "",
    station: "",
    lastMenstrualPeriod: "",
    menstrualPattern: "",
    cycle: "",
    gynObstetricHistory: "",
    sterilisation: "",
    perAbdomenInspection: "",
    gynPalpation: "",
    papSmear: "",
    localExamination: "",
    perSpeculum: "",
    bimanualExamination: "",
  },
  head: "",
  pelvis: "",
  obstetricHistory: "",
  sterilisation: "",
  lastMenstrualPeriod: "",
  menstrualPattern: "",
  cycle: "",
  perAbdomenInspection: "",
  gynPalpation: "",
  papSmear: "",
  localExamination: "",
  perSpeculum: "",
  bimanualExamination: "",
};

// API endpoint for OBG examination - replace with your actual endpoint

const mapApiResponseToForm = (data) => {
  if (!data) return defaultOBGForm;

  const mapped = { ...defaultOBGForm };

  // Map obstetric score from direct fields
  mapped.obstetricScore = {
    g: data.gravida || "",
    p: data.para || "",
    a: data.abortions || "",
    l: data.livingChildren || "",
  };

  // Map main fields (using actual API response field names)
  mapped.obstetricHistory = data.obstetricHistoryNotes || "";
  mapped.conception = data.conceptionType || "";
  mapped.marriedLife = data.marriedLifeYears || "";
  mapped.consanguinity = data.consanguinity || "";
  mapped.booked = data.bookedStatus || "";
  mapped.immunised = data.immunisedStatus || "";
  mapped.trimesters = data.trimester || "";
  mapped.gc = data.gc || "";
  mapped.paA = data.pallor || ""; // Note: pallor field maps to paA
  mapped.peA = data.peA || "";
  mapped.tt = data.ttStatus || "";
  mapped.fhr = data.fhr || "";
  mapped.presentation = data.presentation || "";
  mapped.palpation = data.palpationNotes || "";
  mapped.pv = data.pvDone || "";
  mapped.remarks = data.antenatalRemarks || "";

  // Map inspection height
  mapped.inspectionHeight.select = data.uterusHeight || "";
  mapped.inspectionHeight.specify = data.uterusHeightSpecify || "";
  mapped.inspectionHeight.remarks = data.antenatalRemarks || "";

  // Map menstrual history
  mapped.menstrual = {
    ageOfMenarche: data.menarcheAge || "",
    cycles: data.cycles || "",
    rangeNoOfDays: data.rangeDays || "",
    interval: data.intervalDays || "",
    flow: data.menstrualFlow || "",
    menstrualPause: data.menstrualPause || "",
  };

  // Map respiratory
  mapped.respiratory = {
    system: data.respiratorySystem || "",
    breathSounds: data.breathSounds || "",
  };

  // Map cardiovascular
  mapped.cardiovascular = {
    s1: data.cardiovascularS1 || "",
    s2: data.cardiovascularS2 || "",
    murmurs: data.cardiovascularMurmurs || "",
  };

  // Map PV examination
  mapped.pvExam = {
    osDilatation: data.pvOsDilatation || "",
    effacement: data.pvEffacement || "",
    membrane: data.pvMembrane || "",
    liquor: data.pvLiquor || "",
    consistency: data.cervixConsistency || "",
    position: data.cervixPosition || "",
    length: data.cervixLength || "",
    station: data.stationPresenting || "",
  };

  // Map head and pelvis
  mapped.head = data.fetalHead || "";
  mapped.pelvis = data.pelvis || "";

  // Map gynaecology fields
  mapped.gynObstetricHistory = data.gynObstetricHistory || "";
  mapped.lastMenstrualPeriod = data.gynLastMenstrualPeriod || "";
  mapped.menstrualPattern = data.gynMenstrualPattern || "";
  mapped.cycle = data.gynCycleType || "";
  mapped.sterilisation = data.sterilisation || "";
  mapped.perAbdomenInspection = data.abdomenInspection || "";
  mapped.gynPalpation = data.abdomenPalpation || "";
  mapped.papSmear = data.papSmearResult || "";
  mapped.localExamination = data.localExaminationNotes || "";
  mapped.perSpeculum = data.perSpeculum || "";
  mapped.bimanualExamination = data.bimanualExamination || "";

  // Also map gyn flow and menarche age separately if they exist
  if (data.gynFlow) {
    mapped.menstrual.flow = data.gynFlow;
  }
  if (data.gynMenarcheAge) {
    mapped.menstrual.ageOfMenarche = data.gynMenarcheAge;
  }

  return mapped;
};

const OBGDetails = forwardRef(
  ({ patientId, visitId, hideHeader = false, hideButtons = false }, ref) => {
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchData, setSearchData] = useState({
      mobileNumber: "",
      patientName: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);

    const [form, setForm] = useState(defaultOBGForm);

    // Master data options
    const [conceptionOptions, setConceptionOptions] = useState([]);
    const [consanguinityOptions, setConsanguinityOptions] = useState([]);
    const [bookedStatusOptions, setBookedStatusOptions] = useState([]);
    const [immunisedStatusOptions, setImmunisedStatusOptions] = useState([]);
    const [trimesterOptions, setTrimesterOptions] = useState([]);
    const [presentationOptions, setPresentationOptions] = useState([]);
    const [pvmembraneOptions, setPvmembraneOptions] = useState([]);
    const [pvliquorOptions, setPvliquorOptions] = useState([]);
    const [consistencyOptions, setConsistencyOptions] = useState([]);
    const [positionOptions, setPositionOptions] = useState([]);
    const [stationOptions, setStationOptions] = useState([]);
    const [pelvisTypeOptions, setPelvisTypeOptions] = useState([]);
    const [flowOptions, setFlowOptions] = useState([]);
    const [menarcheAgeOptions, setMenarcheAgeOptions] = useState([]);
    const [menstrualOptions, setMenstrualOptions] = useState([]);
    const [sterilisationOptions, setSterilisationOptions] = useState([]);
    const [papSmearOptions, setPapSmearOptions] = useState([]);

    const departmentName =
      localStorage.getItem("departmentName") ||
      sessionStorage.getItem("departmentName") ||
      "";

    const initialLoadRef = useRef(false);

    // Fetch waiting list
    const fetchWaitingList = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("page", 0);
        params.append("size", 100);
        if (searchData.mobileNumber)
          params.append("mobileNumber", searchData.mobileNumber);
        if (searchData.patientName)
          params.append("patientName", searchData.patientName);
        const res = await getRequest(
          `${GET_WAITING_LIST}?${params.toString()}`,
        );
        if (res?.status === 200 && res?.response?.content) {
          setWaitingList(res.response.content);
        } else {
          setWaitingList([]);
        }
      } catch (error) {
        console.error("Error fetching waiting list:", error);
        setWaitingList([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch master data
    const fetchConceptionOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OB_CONCEPTION}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setConceptionOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchConsanguinityOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OB_CONSANGUINITY}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setConsanguinityOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchImmunisedStatusOptions = async () => {
      try {
        const res = await getRequest(`${OB_MAS_IMMUNISED_STATUS}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setImmunisedStatusOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchTrimesterOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OB_TRIMESTER}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setTrimesterOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPresentationOptions = async () => {
      try {
        const res = await getRequest(`${MAS_PRESENTATION}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPresentationOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPVMembraneOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OB_PVMEMBRANE}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPvmembraneOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPVliquorOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OB_PVLIQUOR}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPvliquorOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchConsistencyOptions = async () => {
      try {
        const res = await getRequest(`${MAS_CERVIX_CONSISTENCY}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setConsistencyOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPositionOptions = async () => {
      try {
        const res = await getRequest(`${MAS_CERVIX_POSITION}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPositionOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchStationOptions = async () => {
      try {
        const res = await getRequest(`${MAS_STATION_PRESENTATION}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setStationOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPelvisTypeOptions = async () => {
      try {
        const res = await getRequest(`${MAS_OP_PELVIS_TYPE}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPelvisTypeOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchFlowOptions = async () => {
      try {
        const res = await getRequest(`${MAS_GYN_FLOW}/getAll/1`);
        if (res?.status === 200 && res?.response) setFlowOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchMenarcheAgeOptions = async () => {
      try {
        const res = await getRequest(`${MAS_MENARCHE_AGE}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setMenarcheAgeOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchMenstrualOptions = async () => {
      try {
        const res = await getRequest(`${MAS_MENSTRUAl_PATTERN}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setMenstrualOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchSterilisationOptions = async () => {
      try {
        const res = await getRequest(`${MAS_STERILISATION}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setSterilisationOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPapSmearOptions = async () => {
      try {
        const res = await getRequest(`${MAS_GYN_POPSMEAR}/getAll/1`);
        if (res?.status === 200 && res?.response)
          setPapSmearOptions(res.response);
      } catch (error) {
        console.error(error);
      }
    };

    // Load all master data
    useEffect(() => {
      fetchWaitingList();
      fetchConceptionOptions();
      fetchConsanguinityOptions();
      fetchImmunisedStatusOptions();
      fetchTrimesterOptions();
      fetchPresentationOptions();
      fetchPVMembraneOptions();
      fetchPVliquorOptions();
      fetchConsistencyOptions();
      fetchPositionOptions();
      fetchStationOptions();
      fetchPelvisTypeOptions();
      fetchFlowOptions();
      fetchMenarcheAgeOptions();
      fetchMenstrualOptions();
      fetchSterilisationOptions();
      fetchPapSmearOptions();
    }, []);

    // Auto-load examination data if patientId and visitId are provided
    useEffect(() => {
      const fetchExaminationData = async () => {
        if (patientId && visitId) {
          if (initialLoadRef.current && selectedPatient?.visitId === visitId) {
            return;
          }

          setSelectedPatient({ patientId, visitId });
          setShowForm(true);
          setFormLoading(true);

          try {
            const res = await getRequest(
              `${GET_OBG_EXAMINATION_DETAIL}?visitId=${visitId}`,
            );
            if (res?.status === 200 && res?.response) {
              const mappedData = mapApiResponseToForm(res.response);
              setForm(mappedData);
            } else {
              setForm(defaultOBGForm);
            }
            initialLoadRef.current = true;
          } catch (error) {
            console.error("Error fetching examination detail:", error);
            setForm(defaultOBGForm);
          } finally {
            setFormLoading(false);
          }
        }
      };

      fetchExaminationData();
    }, [patientId, visitId]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getData: () => {
        return {
          patientId: selectedPatient?.patientId || patientId || null,
          visitId: selectedPatient?.visitId || visitId || null,
          opdDate: new Date().toISOString().split("T")[0],
          obgDetails: {
            obstetricHistory: form.obstetricHistory || "",
            obstetricScore: {
              gravida: form.obstetricScore?.g || "",
              para: form.obstetricScore?.p || "",
              abortion: form.obstetricScore?.a || "",
              livingChildren: form.obstetricScore?.l || "",
            },
            conception: form.conception || "",
            marriedLife: form.marriedLife || "",
            consanguinity: form.consanguinity || "",
            booked: form.booked || "",
            immunised: form.immunised || "",
            trimester: form.trimesters || "",
            gestationalCalculation: form.gc || "",
            paPalpation: form.paA || "",
            perExamination: form.peA || "",
            tetanusToxoid: form.tt || "",
            fetalHeartRate: form.fhr || "",
            presentation: form.presentation || "",
            palpation: form.palpation || "",
            pv: form.pv || "",
            inspectionHeightOfUterus: form.inspectionHeight?.select || "",
            specify: form.inspectionHeight?.specify || "",
            Remarks: form.inspectionHeight?.remarks || "",
            menstrualHistory: {
              ageOfMenarche: form.menstrual?.ageOfMenarche
                ? parseInt(form.menstrual.ageOfMenarche)
                : null,
              cycles: form.menstrual?.cycles || "",
              rangeDays: form.menstrual?.rangeNoOfDays
                ? parseInt(form.menstrual.rangeNoOfDays)
                : null,
              interval: form.menstrual?.interval || "",
              flow: form.menstrual?.flow || "",
              menstrualPause: form.menstrual?.menstrualPause || "",
            },
            systemicExamination: {
              respiratorySystem: form.respiratory?.system || "",
              breathSounds: form.respiratory?.breathSounds || "",
            },
            cardiovascularSystem: {
              s1: form.cardiovascular?.s1 || "",
              s2: form.cardiovascular?.s2 || "",
              murmurs: form.cardiovascular?.murmurs || "",
            },
            perVaginalExamination: {
              osDilatation: form.pvExam?.osDilatation || "",
              effacement: form.pvExam?.effacement || "",
              membrane: form.pvExam?.membrane || "",
              liquor: form.pvExam?.liquor || "",
              consistency: form.pvExam?.consistency || "",
              position: form.pvExam?.position || "",
              length: form.pvExam?.length || "",
              stationOfPresentingPart: form.pvExam?.station || "",
              head: form.head || "",
              pelvis: form.pelvis || "",
            },
          },
          gynaecologyHistory: {
            gynflow: form.menstrual?.flow || "",
            ageOfMenarche: form.menstrual?.ageOfMenarche
              ? parseInt(form.menstrual.ageOfMenarche)
              : null,
            lastMenstrualPeriod: form.lastMenstrualPeriod || null,
            menstrualPattern: form.menstrualPattern || "",
            gynCycle: form.cycle || "",
            gynObstetricHistory: form.gynObstetricHistory || "",
            sterilisation: form.sterilisation || "",
            perAbdomenInspection: form.perAbdomenInspection || "",
            abdomenPalpation: form.gynPalpation || "",
            papSmear: form.papSmear || "",
            localExamination: form.localExamination || "",
            perSpeculum: form.perSpeculum || "",
            bimanualExamination: form.bimanualExamination || "",
          },
        };
      },
      isValid: () => {
        const obsScore = form.obstetricScore;
        if (!obsScore.g || !obsScore.p || !obsScore.a || !obsScore.l)
          return false;
        if (!form.conception || !form.marriedLife || !form.consanguinity)
          return false;
        if (!form.booked || !form.immunised || !form.trimesters) return false;
        if (!form.gc || !form.paA || !form.peA || !form.tt) return false;
        if (!form.fhr || !form.presentation || !form.palpation || !form.pv)
          return false;
        return true;
      },
      resetForm: () => {
        setForm(defaultOBGForm);
      },
    }));

    // Helper functions for form updates
    const updateObstetricScore = (field, value) => {
      setForm((prev) => ({
        ...prev,
        obstetricScore: { ...prev.obstetricScore, [field]: value },
      }));
    };

    const updateInspection = (field, value) => {
      setForm((prev) => ({
        ...prev,
        inspectionHeight: { ...prev.inspectionHeight, [field]: value },
      }));
    };

    const updateMenstrual = (field, value) => {
      setForm((prev) => ({
        ...prev,
        menstrual: { ...prev.menstrual, [field]: value },
      }));
    };

    const updateRespiratory = (field, value) => {
      setForm((prev) => ({
        ...prev,
        respiratory: { ...prev.respiratory, [field]: value },
      }));
    };

    const updateCardiovascular = (field, value) => {
      setForm((prev) => ({
        ...prev,
        cardiovascular: { ...prev.cardiovascular, [field]: value },
      }));
    };

    const updatePvExam = (field, value) => {
      setForm((prev) => ({
        ...prev,
        pvExam: { ...prev.pvExam, [field]: value },
      }));
    };

    // Search handlers
    const handleSearchChange = (e) => {
      const { id, value } = e.target;
      setSearchData((prev) => ({ ...prev, [id]: value }));
      setCurrentPage(1);
    };

    const handleSearch = () => {
      setCurrentPage(1);
      fetchWaitingList();
    };

    const handleReset = () => {
      setSearchData({ mobileNumber: "", patientName: "" });
      setCurrentPage(1);
      fetchWaitingList();
    };

    const closeForm = () => {
      setShowForm(false);
      setSelectedPatient(null);
      setForm(defaultOBGForm);
    };

    const handleRowClick = async (patient) => {
      if (selectedPatient && selectedPatient.visitId === patient.visitId) {
        closeForm();
        return;
      }

      setSelectedPatient(patient);
      setShowForm(true);
      setForm(defaultOBGForm);
      setFormLoading(true);

      try {
        const res = await getRequest(
          `${GET_OBG_EXAMINATION_DETAIL}?visitId=${patient.visitId}`,
        );
        if (res?.status === 200 && res?.response) {
          const mappedData = mapApiResponseToForm(res.response);
          setForm(mappedData);
        } else {
          setForm(defaultOBGForm);
        }
      } catch (error) {
        console.error("Error fetching examination detail:", error);
        setForm(defaultOBGForm);
      } finally {
        setFormLoading(false);
      }
    };

    const showPopup = (message, type = "info") => {
      setPopupMessage({
        message,
        type,
        onClose: () => setPopupMessage(null),
      });
    };

    const handleSave = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      if (!selectedPatient) {
        showPopup("No patient selected", "error");
        return;
      }

      // Validation checks
      const obsScore = form.obstetricScore;
      if (!obsScore.g || !obsScore.p || !obsScore.a || !obsScore.l) {
        showPopup(
          "Please fill all Obstetric Score fields (G, P, A, L)",
          "error",
        );
        return;
      }

      const requiredFields = [
        "conception",
        "marriedLife",
        "consanguinity",
        "booked",
        "immunised",
        "trimesters",
        "gc",
        "paA",
        "peA",
        "tt",
        "fhr",
        "presentation",
        "palpation",
        "pv",
      ];
      const missingFields = requiredFields.filter((field) => !form[field]);

      if (missingFields.length > 0) {
        showPopup(`Please fill: ${missingFields.join(", ")}`, "error");
        return;
      }

      const menstrual = form.menstrual;
      if (
        !menstrual.ageOfMenarche ||
        !menstrual.cycles ||
        !menstrual.rangeNoOfDays ||
        !menstrual.interval ||
        !menstrual.flow ||
        !menstrual.menstrualPause
      ) {
        showPopup("Please fill all Menstrual History fields", "error");
        return;
      }

      if (!form.respiratory.system || !form.respiratory.breathSounds) {
        showPopup("Please fill Respiratory System fields", "error");
        return;
      }

      if (
        !form.cardiovascular.s1 ||
        !form.cardiovascular.s2 ||
        !form.cardiovascular.murmurs
      ) {
        showPopup("Please fill Cardiovascular System fields", "error");
        return;
      }

      const pvExam = form.pvExam;
      if (
        !pvExam.osDilatation ||
        !pvExam.effacement ||
        !pvExam.membrane ||
        !pvExam.liquor
      ) {
        showPopup("Please fill Per Vaginal Examination basic fields", "error");
        return;
      }

      if (!form.head || !form.pelvis) {
        showPopup("Please select Head and Pelvis", "error");
        return;
      }

      if (!form.lastMenstrualPeriod || !form.menstrualPattern || !form.cycle) {
        showPopup(
          "Please fill all Gynecology Menstrual History fields",
          "error",
        );
        return;
      }

      if (!form.obstetricHistory || !form.sterilisation) {
        showPopup("Please fill Obstetric History and Sterilisation", "error");
        return;
      }

      if (
        !form.perAbdomenInspection ||
        !form.gynPalpation ||
        !form.papSmear ||
        !form.localExamination ||
        !form.perSpeculum ||
        !form.bimanualExamination
      ) {
        showPopup("Please fill all Gynecology Examination fields", "error");
        return;
      }

      try {
        setIsSubmitting(true);
        const today = new Date().toISOString().split("T")[0];

        // Build the nested payload structure expected by backend
        const payload = {
          patientId: selectedPatient.patientId,
          visitId: selectedPatient.visitId,
          opdDate: today,
          obgDetails: {
            obstetricHistory: form.obstetricHistory || "",
            obstetricScore: {
              gravida: form.obstetricScore?.g || "",
              para: form.obstetricScore?.p || "",
              abortion: form.obstetricScore?.a || "",
              livingChildren: form.obstetricScore?.l || "",
            },
            conception: form.conception || "",
            marriedLife: form.marriedLife || "",
            consanguinity: form.consanguinity || "",
            booked: form.booked || "",
            immunised: form.immunised || "",
            trimester: form.trimesters || "",
            gestationalCalculation: form.gc || "",
            paPalpation: form.paA || "",
            perExamination: form.peA || "",
            tetanusToxoid: form.tt || "",
            fetalHeartRate: form.fhr || "",
            presentation: form.presentation || "",
            palpation: form.palpation || "",
            pv: form.pv || "",
            inspectionHeightOfUterus: form.inspectionHeight?.select || "",
            specify: form.inspectionHeight?.specify || "",
            remarks: form.inspectionHeight?.remarks || "",
            menstrualHistory: {
              ageOfMenarche: form.menstrual?.ageOfMenarche
                ? parseInt(form.menstrual.ageOfMenarche)
                : null,
              cycles: form.menstrual?.cycles || "",
              rangeDays: form.menstrual?.rangeNoOfDays
                ? parseInt(form.menstrual.rangeNoOfDays)
                : null,
              interval: form.menstrual?.interval || "",
              flow: form.menstrual?.flow || "",
              menstrualPause: form.menstrual?.menstrualPause || "",
            },
            systemicExamination: {
              respiratorySystem: form.respiratory?.system || "",
              breathSounds: form.respiratory?.breathSounds || "",
            },
            cardiovascularSystem: {
              s1: form.cardiovascular?.s1 || "",
              s2: form.cardiovascular?.s2 || "",
              murmurs: form.cardiovascular?.murmurs || "",
            },
            perVaginalExamination: {
              osDilatation: form.pvExam?.osDilatation || "",
              effacement: form.pvExam?.effacement || "",
              membrane: form.pvExam?.membrane || "",
              liquor: form.pvExam?.liquor || "",
              consistency: form.pvExam?.consistency || "",
              position: form.pvExam?.position || "",
              length: form.pvExam?.length || "",
              stationOfPresentingPart: form.pvExam?.station || "",
              head: form.head || "",
              pelvis: form.pelvis || "",
            },
          },
          gynaecologyHistory: {
            gynFlow: form.menstrual?.flow || "",
            ageOfMenarche: form.menstrual?.ageOfMenarche
              ? parseInt(form.menstrual.ageOfMenarche)
              : null,
            lastMenstrualPeriod: form.lastMenstrualPeriod || null,
            menstrualPattern: form.menstrualPattern || "",
            gynCycle: form.cycle || "",
            gynObstetricHistory: form.gynObstetricHistory || "",
            sterilisation: form.sterilisation || "",
            perAbdomenInspection: form.perAbdomenInspection || "",
            abdomenPalpation: form.gynPalpation || "",
            papSmear: form.papSmear || "",
            localExamination: form.localExamination || "",
            perSpeculum: form.perSpeculum || "",
            bimanualExamination: form.bimanualExamination || "",
          },
        };

        console.log(
          "Saving OBG Examination Payload:",
          JSON.stringify(payload, null, 2),
        );

        const response = await postRequest(
          `${SAVE_OBG_DETAILS}/${selectedPatient.visitId}`,
          payload,
        );
        if (response?.status === 200) {
          showPopup("OBG examination saved successfully!", "success");
          closeForm();
          fetchWaitingList();
        } else {
          showPopup("Failed to save. Please try again.", "error");
        }
      } catch (error) {
        console.error("Save Error:", error);
        showPopup("Failed to save examination data.", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    const filteredPatients = waitingList.filter((item) => {
      const mobileMatch =
        searchData.mobileNumber === "" ||
        (item.mobileNo && item.mobileNo.includes(searchData.mobileNumber));
      const nameMatch =
        searchData.patientName === "" ||
        (item.patientName &&
          item.patientName
            .toLowerCase()
            .includes(searchData.patientName.toLowerCase()));
      return mobileMatch && nameMatch;
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredPatients.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    return (
      <div className="content-wrapper">
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {!hideHeader && (
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2 mb-0">
                    {departmentName
                      ? `${departmentName} - OBG Examination`
                      : "OPD OBG Examination"}
                  </h4>
                  {showForm && (
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={closeForm}
                    >
                      Back
                    </button>
                  )}
                </div>
              )}
              <div className="card-body p-2 pb-0">
                {loading && <LoadingScreen />}
                {popupMessage && (
                  <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                  />
                )}

                {/* WAITING LIST */}
                {!patientId && !visitId && !showForm && (
                  <>
                    <div className="mb-4">
                      <div className="row g-4 align-items-end">
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">
                            Patient Mobile No.
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNumber"
                            placeholder="Enter mobile number"
                            value={searchData.mobileNumber}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">
                            Patient Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="patientName"
                            placeholder="Enter patient name"
                            value={searchData.patientName}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary flex-fill"
                              onClick={handleSearch}
                            >
                              Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary flex-fill"
                              onClick={handleReset}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive packagelist mb-3">
                      <table className="table table-bordered table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Patient Name</th>
                            <th>Mobile No</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Relation</th>
                            <th>Department</th>
                            <th>Visit Type</th>
                            <th>Token No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                              <tr
                                key={item.visitId}
                                onClick={() => handleRowClick(item)}
                                className={
                                  selectedPatient?.visitId === item.visitId
                                    ? "table-primary"
                                    : ""
                                }
                                style={{ cursor: "pointer" }}
                              >
                                <td>{item.patientName}</td>
                                <td>{item.mobileNo}</td>
                                <td>{item.age}</td>
                                <td>{item.gender}</td>
                                <td>{item.relation}</td>
                                <td>{item.departmentName}</td>
                                <td>{item.visitType}</td>
                                <td>{item.tokenNo}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="8"
                                className="text-center text-muted"
                              >
                                No records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <nav>
                        <ul className="pagination justify-content-center">
                          <li
                            className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li
                              key={i}
                              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}

                {/* EXAMINATION FORM */}
                {showForm && selectedPatient && (
                  <div className="row mb-3 mt-3">
                    <div className="col-sm-12">
                      <div className="card-body p-2 pb-0">
                        {formLoading ? (
                          <div className="text-center py-5">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 text-muted">
                              Loading examination data...
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleSave}>
                            {/* Patient Info Banner */}
                            {!patientId && !visitId && (
                              <div className="alert alert-info mb-4">
                                <strong>Patient:</strong>{" "}
                                {selectedPatient.patientName} |&nbsp;
                                <strong>Mobile:</strong>{" "}
                                {selectedPatient.mobileNo} |&nbsp;
                                <strong>Age:</strong> {selectedPatient.age}{" "}
                                |&nbsp;
                                <strong>Token:</strong>{" "}
                                {selectedPatient.tokenNo}
                              </div>
                            )}

                            {/* DETAILS Section */}
                            <h6 className="fw-bold text-primary border-bottom pb-1">
                              DETAILS
                            </h6>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Obstetric History
                                </label>
                                <select
                                  className="form-select"
                                  value={form.obstetricHistory}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      obstetricHistory: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Primigravida">
                                    Primigravida
                                  </option>
                                  <option value="Multigravida">
                                    Multigravida
                                  </option>
                                  <option value="Nulliparous">
                                    Nulliparous
                                  </option>
                                  <option value="Grand Multipara">
                                    Grand Multipara
                                  </option>
                                </select>
                              </div>
                              <div className="col-md-9">
                                <label className="form-label fw-bold">
                                  Obstetric Score
                                </label>
                                <div className="row">
                                  <div className="col-3">
                                    <div className="d-flex align-items-center gap-1">
                                      <span
                                        className="fw-bold"
                                        style={{ minWidth: "45px" }}
                                      >
                                        Gravida
                                      </span>
                                      <select
                                        className="form-select"
                                        value={form.obstetricScore.g}
                                        onChange={(e) =>
                                          updateObstetricScore(
                                            "g",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                          (n) => (
                                            <option key={n}>{n}</option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="fw-bold"
                                        style={{ minWidth: "25px" }}
                                      >
                                        Para
                                      </span>
                                      <select
                                        className="form-select"
                                        value={form.obstetricScore.p}
                                        onChange={(e) =>
                                          updateObstetricScore(
                                            "p",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                          (n) => (
                                            <option key={n}>{n}</option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="fw-bold"
                                        style={{ minWidth: "50px" }}
                                      >
                                        Abortion
                                      </span>
                                      <select
                                        className="form-select"
                                        value={form.obstetricScore.a}
                                        onChange={(e) =>
                                          updateObstetricScore(
                                            "a",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                          (n) => (
                                            <option key={n}>{n}</option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        className="fw-bold"
                                        style={{ minWidth: "25px" }}
                                      >
                                        Living children
                                      </span>
                                      <select
                                        className="form-select"
                                        value={form.obstetricScore.l}
                                        onChange={(e) =>
                                          updateObstetricScore(
                                            "l",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Select</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                          (n) => (
                                            <option key={n}>{n}</option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Conception
                                </label>
                                <select
                                  className="form-select"
                                  value={form.conception}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      conception: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {conceptionOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.conceptionType}
                                    >
                                      {opt.conceptionType}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Married Life
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Enter years"
                                  maxLength={2}
                                  value={form.marriedLife}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      marriedLife: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Consanguinity
                                </label>
                                <select
                                  className="form-select"
                                  value={form.consanguinity}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      consanguinity: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {consanguinityOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.consanguinityValue}
                                    >
                                      {opt.consanguinityValue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Booked
                                </label>
                                <select
                                  className="form-select"
                                  value={form.booked}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      booked: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Immunised
                                </label>
                                <select
                                  className="form-select"
                                  value={form.immunised}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      immunised: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {immunisedStatusOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.immunisationValue}
                                    >
                                      {opt.immunisationValue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  I,II,III Trimesters
                                </label>
                                <select
                                  className="form-select"
                                  value={form.trimesters}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      trimesters: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {trimesterOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.trimesterValue}
                                    >
                                      {opt.trimesterValue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  GC(Gestational Calculation)
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={form.gc}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      gc: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Pa^(Palpation)
                                </label>
                                <select
                                  className="form-select"
                                  value={form.paA}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      paA: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="positive">+</option>
                                  <option value="negative">-</option>
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Pe^(Per Examination)
                                </label>
                                <select
                                  className="form-select"
                                  value={form.peA}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      peA: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="positive">+</option>
                                  <option value="negative">-</option>
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  TT(Tetanus Toxoid)
                                </label>
                                <select
                                  className="form-select"
                                  value={form.tt}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      tt: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  FHR (Fetal Heart Rate)
                                </label>
                                <select
                                  className="form-select"
                                  value={form.fhr}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      fhr: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select FHR range</option>
                                  {[
                                    "100-109",
                                    "110-119",
                                    "120-129",
                                    "130-139",
                                    "140-149",
                                    "150-160",
                                    "161-170",
                                    "171-180",
                                  ].map((range) => (
                                    <option key={range} value={range}>
                                      {range}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Presentation
                                </label>
                                <select
                                  className="form-select"
                                  value={form.presentation}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      presentation: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {presentationOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.presentationValue}
                                    >
                                      {opt.presentationValue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Palpation
                                </label>
                                <input
                                  className="form-control"
                                  value={form.palpation}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      palpation: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  PV(Per Vaginal Examination)
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="PV finding"
                                  value={form.pv}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      pv: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Inspection-Height of Uterus
                                </label>
                                <select
                                  className="form-select"
                                  value={form.inspectionHeight.select}
                                  onChange={(e) =>
                                    updateInspection("select", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="12-14">12-14</option>
                                  <option value="14-16">14-16</option>
                                  <option value="16-18">16-18</option>
                                  <option value="18-20">18-20</option>
                                  <option value="20-22">20-22</option>
                                  <option value="22-24">22-24</option>
                                  <option value="24-26">24-26</option>
                                  <option value="26-28">26-28</option>
                                  <option value="28-30">28-30</option>
                                  <option value="30-32">30-32</option>
                                  <option value="32-34">32-34</option>
                                  <option value="34-36">34-36</option>
                                  <option value="term-size">Term-size</option>
                                  <option value="palpable">Palpable</option>
                                  <option value="non-palpable">
                                    Non-palpable
                                  </option>
                                </select>
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Specify
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={form.inspectionHeight.specify}
                                  onChange={(e) =>
                                    updateInspection("specify", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-3 mt-3">
                                <label className="form-label fw-bold">
                                  Remarks
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={form.inspectionHeight.remarks}
                                  onChange={(e) =>
                                    updateInspection("remarks", e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* MENSTRUAL HISTORY */}
                            <h6 className="fw-bold text-primary border-bottom pb-1">
                              MENSTRUAL HISTORY
                            </h6>
                            <div className="row mb-3">
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Age of Menarche
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual.ageOfMenarche}
                                  onChange={(e) =>
                                    updateMenstrual(
                                      "ageOfMenarche",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select</option>
                                  {Array.from(
                                    { length: 20 },
                                    (_, i) => i + 8,
                                  ).map((age) => (
                                    <option key={age}>{age}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Cycles
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual.cycles}
                                  onChange={(e) =>
                                    updateMenstrual("cycles", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Regular">Regular</option>
                                  <option value="Irregular">Irregular</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Range: No. of Days
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual.rangeNoOfDays}
                                  onChange={(e) =>
                                    updateMenstrual(
                                      "rangeNoOfDays",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select</option>
                                  {Array.from({ length: 20 }, (_, i) => {
                                    const start = 0 + i;
                                    const end = start + 1;
                                    const value = `${start}-${end}`;
                                    return (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Interval
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g., 28 days"
                                  value={form.menstrual.interval}
                                  onChange={(e) =>
                                    updateMenstrual("interval", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Flow
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual.flow}
                                  onChange={(e) =>
                                    updateMenstrual("flow", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Light">Normal</option>
                                  <option value="Moderate">Moderate</option>
                                  <option value="Heavy">Heavy</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Menstrual Pause
                                </label>
                                <input
                                  className="form-control"
                                  value={form.menstrual.menstrualPause}
                                  onChange={(e) =>
                                    updateMenstrual(
                                      "menstrualPause",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* SYSTEMIC EXAMINATION */}
                            <h6 className="fw-bold text-primary border-bottom pb-1">
                              SYSTEMIC EXAMINATION
                            </h6>
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Respiratory System
                                </label>
                                <select
                                  className="form-select"
                                  value={form.respiratory.system}
                                  onChange={(e) =>
                                    updateRespiratory("system", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="WBS">WBS</option>
                                  <option value="Bronchial">Bronchial</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Breath sounds
                                </label>
                                <select
                                  className="form-select"
                                  value={form.respiratory.breathSounds}
                                  onChange={(e) =>
                                    updateRespiratory(
                                      "breathSounds",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Vesicular">Normal</option>
                                  <option value="Bronchial">Crept</option>
                                  <option value="Diminished">Rhonchi</option>
                                </select>
                              </div>
                            </div>

                            {/* CARDIOVASCULAR SYSTEM */}
                            <h6 className="fw-bold text-primary border-bottom pb-1">
                              CARDIOVASCULAR SYSTEM
                            </h6>
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">S1</label>
                                <select
                                  className="form-select"
                                  value={form.cardiovascular.s1}
                                  onChange={(e) =>
                                    updateCardiovascular("s1", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Normal">Normal</option>
                                  <option value="Soft">Ab(n)</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">S2</label>
                                <select
                                  className="form-select"
                                  value={form.cardiovascular.s2}
                                  onChange={(e) =>
                                    updateCardiovascular("s2", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Normal">Normal</option>
                                  <option value="Split">Ab(n)</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Murmurs
                                </label>
                                <input
                                  className="form-control"
                                  value={form.cardiovascular.murmurs}
                                  onChange={(e) =>
                                    updateCardiovascular(
                                      "murmurs",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* PER VAGINAL EXAMINATION */}
                            <h6 className="fw-bold text-primary border-bottom pb-1">
                              PER VAGINAL EXAMINATION
                            </h6>
                            <div className="row g-3 mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  OS Dilatation of cervix
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.osDilatation}
                                  onChange={(e) =>
                                    updatePvExam("osDilatation", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {Array.from({ length: 11 }, (_, i) => (
                                    <option key={i}>{i}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Effacement of cervix
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.effacement}
                                  onChange={(e) =>
                                    updatePvExam("effacement", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const start = i * 10;
                                    const end = start + 10;
                                    const value = `${start}-${end}%`;
                                    return (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Membrane
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.membrane}
                                  onChange={(e) =>
                                    updatePvExam("membrane", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {pvmembraneOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.membraneStatus}
                                    >
                                      {opt.membraneStatus}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Liquor
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.liquor}
                                  onChange={(e) =>
                                    updatePvExam("liquor", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {pvliquorOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.liquorValue}
                                    >
                                      {opt.liquorValue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Consistency of cervix
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.consistency}
                                  onChange={(e) =>
                                    updatePvExam("consistency", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {consistencyOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.cervixConsistency}
                                    >
                                      {opt.cervixConsistency}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Position of cervix
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.position}
                                  onChange={(e) =>
                                    updatePvExam("position", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {positionOptions.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.cervixPosition}
                                    >
                                      {opt.cervixPosition}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Length of cervix
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.length}
                                  onChange={(e) =>
                                    updatePvExam("length", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="0">0 cm</option>
                                  <option value="1">1 cm</option>
                                  <option value="2">2 cm</option>
                                  <option value="3">3 cm</option>
                                  <option value="4">4 cm</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Station of Presenting Part
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pvExam.station}
                                  onChange={(e) =>
                                    updatePvExam("station", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  {[-3, -2, -1, 0, 1, 2, 3].map((station) => (
                                    <option key={station} value={station}>
                                      {station}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Head and Pelvis */}
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Head
                                </label>
                                <select
                                  className="form-select"
                                  value={form.head}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      head: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Moble">Moble</option>
                                  <option value="Fixed">Fixed</option>
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Pelvis
                                </label>
                                <select
                                  className="form-select"
                                  value={form.pelvis}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      pelvis: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {pelvisTypeOptions.map((opt) => (
                                    <option key={opt.id} value={opt.pelvisType}>
                                      {opt.pelvisType}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* GYNAECOLOGY SECTION */}
                            <h6 className="fw-bold text-primary border-bottom pb-1 mt-3">
                              GYNAECOLOGY
                            </h6>

                            <div className="row g-3 mb-4">
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Flow
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual?.flow || ""}
                                  onChange={(e) =>
                                    updateMenstrual("flow", e.target.value)
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Scanty">Scanty</option>
                                  <option value="Moderate">Moderate</option>
                                  <option value="Heavy">Heavy</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Age of Menarche
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrual?.ageOfMenarche || ""}
                                  onChange={(e) =>
                                    updateMenstrual(
                                      "ageOfMenarche",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select</option>
                                  {Array.from(
                                    { length: 13 },
                                    (_, i) => i + 8,
                                  ).map((age) => (
                                    <option key={age}>{age}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Last Menstrual Period
                                </label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={form.lastMenstrualPeriod || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      lastMenstrualPeriod: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Menstrual Pattern
                                </label>
                                <select
                                  className="form-select"
                                  value={form.menstrualPattern || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      menstrualPattern: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="0-1">0-1</option>
                                  <option value="1-2">1-2</option>
                                  <option value="2-3">2-3</option>
                                  <option value="3-4">3-4</option>
                                  <option value="4-5">4-5</option>
                                  <option value=">5">&gt;5</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label className="form-label fw-bold">
                                  Cycle
                                </label>
                                <select
                                  className="form-select"
                                  value={form.cycle || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      cycle: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="<15">&lt;15</option>
                                  <option value="15-20">15-20</option>
                                  <option value="20-25">20-25</option>
                                  <option value="25-30">25-30</option>
                                  <option value=">30">&gt;30</option>
                                </select>
                              </div>
                            </div>

                            <div className="row g-3 align-items-end mb-4">
                              <div className="col-md-7">
                                <label className="form-label fw-bold">
                                  Obstetric History
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.gynObstetricHistory || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      gynObstetricHistory: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-bold">
                                  Sterilisation
                                </label>
                                <select
                                  className="form-select"
                                  value={form.sterilisation || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      sterilisation: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>

                            <h6 className="fw-bold text-primary border-bottom pb-1 mb-3">
                              EXAMINATION
                            </h6>
                            <div className="row g-4">
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Per Abdomen - Inspection
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.perAbdomenInspection || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      perAbdomenInspection: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Palpation
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.gynPalpation || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      gynPalpation: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Pap-smear
                                </label>
                                <select
                                  className="form-select"
                                  value={form.papSmear || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      papSmear: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div className="col-md-8">
                                <label className="form-label fw-bold">
                                  Local Examination
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.localExamination || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      localExamination: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Per Speculum
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.perSpeculum || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      perSpeculum: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Bimanual Examination
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={form.bimanualExamination || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      bimanualExamination: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            {!hideButtons && (
                              <div className="col-12 mt-3 d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-secondary me-2"
                                  onClick={closeForm}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting
                                    ? "Saving..."
                                    : "Save Examination"}
                                </button>
                              </div>
                            )}
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default OBGDetails;
