// export const API_HOST = 'http://103.133.215.182:8081/hims';
export const API_HOST = 'http://localhost:8080'



//common Apis Endponints
export const MASTERS = `/master`;

export const MAS_APPLICATION = `${MASTERS}/mas-applications`;
export const MAS_BLOODGROUP = `${MASTERS}/blood-group`;
export const MAS_COUNTRY = `${MASTERS}/country`;
export const MAS_STATE = `${MASTERS}/state`;
export const MAS_DISTRICT = `${MASTERS}/district`;
export const MAS_DEPARTMENT = `${MASTERS}/department`;
export const MAS_DEPARTMENT_TYPE = `${MASTERS}/department-type`;
export const MAS_GENDER = `${MASTERS}/gender`;
export const MAS_MARITAL_STATUS = `${MASTERS}/marital-status`;
export const MAS_ROLES = `${MASTERS}/roles`;
export const MAS_RELIGION = `${MASTERS}/religion`;
export const MAS_RELATION = `${MASTERS}/relation`;
export const MAS_DG_SAMPLE = `${MASTERS}/dg-mas-sample`;
export const MAS_DG_UOM = `${MASTERS}/dgUom`;
export const MAS_FREQUENCY = `${MASTERS}/masFrequency`;
export const MAS_IDENTIFICATION_TYPE = `${MASTERS}/identification-types`;
export const MAS_ITEM_TYPE = `${MASTERS}/masItemType`;
export const MAS_MAIN_CHARGE_CODE = `${MASTERS}/main-charge-code`;
export const MAS_TEMPLATE = `${MASTERS}/mas-templates`;
export const MAS_OPD_SESSION = `${MASTERS}/opd-session`;
export const MAS_STORE_UNIT = `${MASTERS}/store-unit`;
export const MAS_STORE_GROUP = `${MASTERS}/masStoreGroup`;
export const MAS_SUB_CHARGE_CODE = `${MASTERS}/sub-charge-code`;
export const MAS_USER_TYPE = `${MASTERS}/userType`;
export const MAS_USER_DEPARTMENT = `${MASTERS}/user-departments`;
export const MAS_HOSPITAL = `${MASTERS}/hospital`;
export const MAS_EMPLOYMENT_TYPE = `${MASTERS}/employmentType`;
export const MAIN_CHARGE_CODE = "/main-charge-code";
export const ALL_MAIN_CHARGE_CODE = "/main-charge-code/getAllChargeCode";
export const MAS_SERVICE_CATEGORY = `${MASTERS}/masServiceCategory`;
export const MAS_OPD_SERVICE = `${MASTERS}/masServiceOpd`;
export const MAS_ITEM_CLASS = `${MASTERS}/masItemClass`;
export const MAS_ITEM_SECTION = `${MASTERS}/storeSection`;
export const MAS_ITEM_CATEGORY = `${MASTERS}/masItemCategory`;
export const MAS_DRUG_MAS = `${MASTERS}/masStoreItem`;
export const MAS_HSN = `${MASTERS}/masHSN`;
export const DG_MAS_COLLECTION = `${MASTERS}/DgMasCollection`;
export const DG_MAS_INVESTIGATION_CATEGORY = `${MASTERS}/masInvestigationCategory`;
export const DG_MAS_INVESTIGATION_METHODOLOGY = `${MASTERS}/masInvestigationMethodology`;
export const MAS_DESIGNATION = `${MASTERS}/masDesignation`;
export const MAS_SPECIALITY_CENTER = `${MASTERS}/masSpecialty`;
export const MAS_EMPLOYEE_TYPE = `${MASTERS}/employeeType`;
export const CHECK_AVAILABILITY_TOKEN = `/doctor/checkAllAvailableTokens`;
export const GET_ALL_REASONS = `${MASTERS}/cancel-payment-reason`;
export const MAS_LANGUAGES = `${MASTERS}/masLanguage`;



export const DG_UOM = `${MASTERS}/dgUom`;
export const MAS_BRAND = `${MASTERS}/masBrand`;
export const MAS_MANUFACTURE = `${MASTERS}/masManufacturer`;
export const OPEN_BALANCE = "/openingBalanceEntry";
export const ALL_REPORTS = `${API_HOST}/report`;
export const OPD_PATIENT = "/patient";


export const FILTER_OPD_DEPT = `OPD`;
export const ALL_LAB_HISTORY_REPORT=`${ALL_REPORTS}/lab-histrory`;
export const OPD_INVOICE_API=`${ALL_REPORTS}/opdInvoice`;
export const LAB_INVOICE_API=`${ALL_REPORTS}/labInvoice`;
export const RADIOLOGY_INVOICE_API=`${ALL_REPORTS}/radiologyInvoice`;


























export const DEPARTMENT = `/department`;

export const ALL_DEPARTMENT = `${MASTERS}/department/getAll`;
export const DOCTOR = `/users`;
export const SESSION = `/opd-session`;
export const APPOINTMENT = `/admin`;
export const LOGIN = `/authController/login`;
export const ALL_GENDER = `${MASTERS}/gender/getAll`;
export const ALL_RELATION = `${MASTERS}/relation/getAll`;
export const DISTRICT_BY_STATE = `${MASTERS}/district/getByState/`;
export const ALL_COUNTRY = `${MASTERS}/country/getAll`;
export const STATE_BY_COUNTRY = `${MASTERS}/state/getByCountryId/`;
export const DOCTOR_BY_SPECIALITY = `/users/doctorBySpeciality/`;
export const ALL_BLOODGROUPS = `/blood-group/getAllBloodGroups`;
export const ALL_DEPARTMENT_TYPE = `/department-type/getAllDepartmentTypes`;
export const ALL_STATE = `${MASTERS}/state/getAll`;
export const ALL_DISTRICT = `${MASTERS}/district/getAll`;
export const ALL_ROLE = `/roles/getAllRoles`;
export const ALL_HOSPITAL = `/hospital/getAllHospitals`;
export const ALL_MARITAL_STATUS = `/marital-status/getAllMaritalStatuses`;
export const ALL_RELIGION = `/religion/getAllReligions`;
export const ALL_USER_DEPARTMENT = `/user-departments/getAllUserDepartments`;
export const ALL_USER_APPLICATION = `/configuration/getApplications`;
export const ALL_TEMPLATES = `/mas-templates/getAllTemplates`;
export const ALL_APPLICATIONS = `/mas-applications/getAllApplications`;
export const ALL_IDENTIFICATION_TYPE = `/identification-types/getAllIdentificationTypes`;
export const COUNTRYAPI = `/country`;
export const STATEAPI = `/state`;
export const DISTRICTAPI = `/district`;
export const GENDERAPI = `/gender`;
export const EMPLOYEE = `/employees`;
export const BLOOD_GROUPS = `/blood-group`;
export const DEPARTMENT_TYPE = `/department-type`;
export const ROLE = `/roles`;
export const HOSPITAL = `${MASTERS}/hospital/getById`;
export const MARITAL_STATUS = `/marital-status`;
export const RELATION = `/relation`;
export const RELIGION = `/religion`;
export const USER_DEPARTMENT = `/user-departments`;
export const USER_APPLICATION = `/configuration`;
export const CREATE_USER_APPLICATION = `/configuration/createApplication`;
export const UPDATE_USER_APPLICATION = `/configuration/updateApplication`;
export const UPDATE_STATUS_USER_APPLICATION = `/configuration/changeApplicationStatus`;
export const GET_URL_BY_ROLES = `/configuration/getUrlsByRoles`;



export const TEMPLATES = `/mas-templates`;
export const APPLICATION = `/mas-applications`;
export const ASSIGN_TEMPLATES = `/configuration`;
export const GET_APPS_BY_TEMPLATE_ID = `/configuration/getTemplateApplicationsByTemplate`;

export const ROLE_TEMPLATE = `/role-template`;
export const IDENTITY_TYPE = `/identification-types`;
export const DOCTOR_ROSTER = `/admin`;
export const GET_DOCTOR_SESSION = `/admin/getDoctorRoster?`;

export const GET_AVAILABILITY_TOKENS = `/doctor/checkAllAvailableTokens`;
export const GET_APPOINTMENT_HISTORY = `/mobileController/getAppointmentHistoryList`;
export const POLICY_API = `${MASTERS}/billingPolicy`



export const GET_SESSION = `${MASTERS}/opd-session/getAll/`;
export const ALL_FREQUENCY = `/MasFrequencyController/getByAll`;
export const FREQUENCY = `/MasFrequencyController`;
export const EMPLOYMENT_TYPE = `/employmentType`;
export const EMPLOYEE_TYPE = `/userType`;
export const OPD_SESSION = `/opd-session`
export const STORE_UNIT_API = `/store-unit`;
export const ALL_STORE_UNITS = `/store-unit/getAllUnits`;
export const ITEM_TYPE = `/MasItemType`;
export const ALL_ITEM_TYPE = `/MasItemType/getByAllMasItemTypeStatus`;
export const STORE_GROUP = `/masStoreGroup`;
export const ALL_STORE_GROUP = `/masStoreGroup/getByAllId`;
export const SUBCHARGE = `/sub-charge-code`;
export const ALL_SUBCHARGE = `/sub-charge-code/getAllSubCharge/`;
export const INVESTIGATION_PRICE_DETAILS = `/investigation-price-details`;
export const ALL_INVESTIGATION = `/DgMasInvestigation/getAll`;
export const ALL_INVESTIGATION_PRICE_DETAILS = `/investigation-price-details/getAllPriceDetails`;
export const MAS_INVESTIGATION = `/DgMasInvestigation`;
export const MAS_PACKAGE_INVESTIGATION = `/investigation-package`;
export const LAB_REGISTRATION = `/lab/registration`;
export const INVESTIGATION_PACKAGE_Mapping = `/package-investigation-mapping`;
export const INVESTIGATION_PACKAGE_API = `/investigation-package`;
export const LAB = `/lab`;
export const OPD_TEMPLATE = `/opdTemplate`
export const Store_Internal_Indent = `/storeInternalIndent`


export const RADIOLOGY = `/radiology`;
export const REGISTER_AND_ADD_RADIOLOGY_INVESTIGATION = `${RADIOLOGY}/registerWithInv`;
export const REGISTER_RADIOLOGY = `${RADIOLOGY}/radiologyRegistration`;
export const UPDATE_RADIOLOGY = `${RADIOLOGY}/updateDetailsAndBookingRadiology`;

export const PACS_STUDY_LIST_GET_API = `${RADIOLOGY}/getPACSStudyList`;



export const ITEM_CLASS = {
  TABLET: 1,
  CAPSULE: 2,
  EARDROPS: 7,
  LIQUID: 15,
  EYEEARDROPS: 52,
  SYRUP: 57
};

export const DRUG_TYPE = {
  SOLID: [ITEM_CLASS.TABLET, ITEM_CLASS.CAPSULE],
  LIQUID: [ITEM_CLASS.EARDROPS, ITEM_CLASS.LIQUID, ITEM_CLASS.EYEEARDROPS, ITEM_CLASS.SYRUP]
};

//For Department Master showing that ward category dropdown on the basis of Department Type as Ward
export const WARD_ID = 10;
export const MAS_ROOM_CATEGORY = `${MASTERS}/mas-room-category`
export const MAS_BED_STATUS = `${MASTERS}/mas-bed-status`;
export const MAS_WARD_CATEGORY = `${MASTERS}/masWardCategory`;
export const MAS_CARE_LEVEL = `${MASTERS}/mas-care-level`;
export const MAS_BED_TYPE = `${MASTERS}/masBedType`;
export const MAS_ROOM = `${MASTERS}/mas-room`;
export const MAS_BED = `${MASTERS}/masBed`;
export const MAS_PROCEDURE_TYPE = `${MASTERS}/masProcedureType`;
export const MAS_PROCEDURE = `${MASTERS}/masProcedure`;
export const MAS_MEDICAL_HISTORY = `${MASTERS}/masMedicalHistory`;
export const MAS_TREATMENT_ADVISE = `${MASTERS}/masTreatmentAdvise`;
export const MAS_MEAL_TYPE = `${MASTERS}/masMealType`;
export const MAS_DIET_SCHEDULE = `${MASTERS}/masDietSchedule`;
export const MAS_DIET_TYPE = `${MASTERS}/masDietType`;
export const MAS_DIET_PREFERENCE = `${MASTERS}/masDietPreference`;
export const MAS_INTAKE_ITEM = `${MASTERS}/masIntakeItem`;
export const MAS_INTAKE_TYPE = `${MASTERS}/masIntakeType`;
export const MAS_PATIENT_ACUITY = `${MASTERS}/masPatientAcuity`;
export const MAS_OUTPUT_TYPE = `${MASTERS}/masOutputType`;
export const PRINT = `/print`;
export const MAS_ADMISSION_STATUS = `${MASTERS}/masAdmissionStatus`;
export const MAS_SPECIALTY = `${MASTERS}/masSpecialty`;
export const MAS_BILLING_POLICY = `${MASTERS}/billingPolicy`;
export const OPTH_SPECTACLE_USE = `${MASTERS}/opthMasSpectacleUse`;
export const OB_BOOKED_STATUS = `${MASTERS}/obMasBookedStatus`;
export const MAS_TOOTH_CONDITION = `${MASTERS}/masToothCondition`;
export const LAB_AMENDMENT_TYPE_API = `${MASTERS}/lab-amendment-type`;
export const MAS_PATIENT_PREPARATION = `${MASTERS}/patient-preparation`;
export const MAS_TONSIL_GRADE = `${MASTERS}/entMasTonsilGrade`;
export const MAS_OB_TRIMESTER = `${MASTERS}/obMasTrimester`;
export const MAS_QUESTION_HEADING = `${MASTERS}/masQuestionHeading`;
export const MAS_BLOOD_DONATION_TYPE = `${MASTERS}/masBloodDonationType`;
export const MAS_BLOOD_UNIT = `${MASTERS}/masBloodUnitStatus`;
export const MAS_BLOOD_COMPONENT = `${MASTERS}/masBloodComponent`
export const MAS_BLOOD_COMPATIBILITY = `${MASTERS}/masBloodCompatibility`;
export const MAS_BLOOD_BAG_TYPE = `${MASTERS}/masBloodBagType`;
export const MAS_CROSS_MATCH_TYPE   = `${MASTERS}/masCrossMatchType`;
export const MAS_BLOOD_COLLECTION = `${MASTERS}/masBloodCollectionType`;
export const MAS_MENSTRUAl_PATTERN = `${MASTERS}/gynMasMenstrualPattern`;
export const MAS_CERVIX_CONSISTENCY = `${MASTERS}/ObMasCervixConsistency`;
export const MAS_BLOOD_DONATION_STATUS = `${MASTERS}/masBloodDonationStatus`;
export const MAS_BAG_TYPE = `${MASTERS}/masBloodBagType`;
export const BILLING = `${LAB}/billingStatus`;
export const MAS_OB_CONCEPTION = `${MASTERS}/obMasConception`;
export const MAS_CERVIX_POSITION = `${MASTERS}/ObMasCervixPosition`;
export const MAS_OPTH_COLOR_VISION = `${MASTERS}/opthMasColorVision`;
export const MAS_OP_PELVIS_TYPE = `${MASTERS}/obMasPelvisType`;
export const MAS_PRESENTATION = `${MASTERS}/obMasPresentation`;
export const MAS_STERILISATION = `${MASTERS}/gynMasSterilisation`;
export const MAS_STATION_PRESENTATION = `${MASTERS}/obMasStationPresenting`;
export const MAS_OPTH_LENSTYPE = `${MASTERS}/opthMasLensType`;
export const MAS_OPD_QUESTION  = `${MASTERS}/opdQuestionMaster`;
export const MAS_OPTH_DISTANCE = `${MASTERS}/opthMasDistanceVision`;
export const MAS_MENARCHE_AGE = `${MASTERS}/gynMasMenarcheAge`;
export const MAS_OPTH_SPECTACLE_USE = `${MASTERS}/opthMasSpectacleUse`;
export const MAS_EAR_CANAL = `${MASTERS}/entMasEarCanal`;
export const MAS_ENT_RINNE = `${MASTERS}/entMasRinne`;
export const MAS_OPTH_NEAR_VISION = `${MASTERS}/opthMasNearVision`;
export const MAS_OB_CONSANGUINITY = `${MASTERS}/obMasConsanguinity`;
export const MAS_GYN_FLOW = `${MASTERS}/gynMasFlow`;
export const MAS_ENT_SEPTUM = `${MASTERS}/entMasSeptum`;
export const MAS_OB_PVLIQUOR = `${MASTERS}/ObMasPvLiquor`;
export const MAS_ENT_MUCOSA = `${MASTERS}/entMasMucosa`;
export const MAS_OB_PVMEMBRANE = `${MASTERS}/ObMasPvMembrane`;
export const MAS_COMMON_STATUS = `${MASTERS}/mas-common-status`;
export const ENT_MAS_TM_STATUS = `${MASTERS}/entMasTmStatus`;
export const OB_MAS_IMMUNISED_STATUS = `${MASTERS}/obMasImmunisedStatus`; export const MAS_GYN_POPSMEAR = `${MASTERS}/gynMasPapSmear`;
export const MAS_ENT_WEBER = `${MASTERS}/entMasWeber`;
export const XRAY_MODALITY = 40;
export const USG_MODALITY = 41;
export const MRI_MODALITY = 43;
export const CT_MODALITY = 42;
export const PET_MODALITY = 48;

// Constants for date validation for Lab report
export const MAX_MONTHS_BACK = 4; // 4 months maximum back date
export const MAX_DAYS_BACK = MAX_MONTHS_BACK * 30;



//Blood bank
export const DONOR_REGISTER = `/bloodBank/registerDonor`
export const DONOR_SEARCH_LIST = `/bloodBank/getAllDonorScreeningResultList`
export const GET_DONOR_AND_SCREENING_DETAILS = `/bloodBank/getDonorAndScreeningDetails`
export const UPDATE_DONOR_AND_SCREENING = `/bloodBank/updateDonorAndAddNewScreening`
export const GET_PENDING_COLLECTION_LIST = `/bloodBank/pendingBloodCollectionList`
export const GET_PENDING_COLLECTION_DETAILS = `/bloodBank/pendingBloodCollectionDetails`
export const PENDING_COMPONENT_GENERATION_LIST = `/bloodBank/pendingComponentGenerationList`
export const SAVE_BLOOD_COLLECTION_DATA = `/bloodBank/saveBloodCollection` 
export const GET_FAILURE_REASONS = `${MASTERS}/masComponentFailureReason`;
export const COMPONENT_GENERATION_FAIL = "/bloodBank/componentGenerationFail";
export const COMPONENT_GENERATION_PASS = "/bloodBank/componentGenerationPass"; 
export const GET_BLOOD_COMPONENTS = `${MASTERS}/masBloodComponent`;
export const GET_BLOOD_TEST_MASTER = `${MASTERS}/masBloodTest`;
export const PENDING_MANDATORY_TESTING_LIST = "/bloodBank/pendingForMandatoryTestingList";
export const SAVE_MANDATORY_TESTING = "/bloodBank/mandatoryTestingTestEntry";
export const BANK_BLOOD_STOCK_AVAILABILITY = `/bloodBank/bloodBankStockAndAvailability`;


//Employee
export const CREATE_EMPLOYEE = `/employee/createEmployee`;
export const UPDATE_EMPLOYEE = `/employee/updateEmployee`;
export const CREATE_APPROVE_EMPLOYEE = `/employee/createAndApproveEmployee`;
export const GET_ALL_EMPLOYEES = `/employee/getAllEmployees`;
export const GET_EMPLOYEE_BY_ID = `/employee/getEmployeeById`;
export const GET_EMPLOYEE_PROFILE = `/employee/getEmployeeProfileImage`;
export const VIEW_EMPLOYEE_DOCUMENT = `/employee/viewEmployeeDocument`;
export const GET_EMPLOYEE_BY_STATUS = `/employee/getEmployeesByStatus`;
export const APPROVE_EMPLOYEE = `/employee/approveEmployee`;


export const MAS_BLOOD_TEST = `${MASTERS}/masBloodTest`;


//patient Registration 
export const PATIENT_IMAGE_UPLOAD = `/registration/uploadPatientImage`;
export const PATIENT_REGISTRATION = `/registration/createPatient`;
export const PATIENT_FOLLOW_UP = `/registration/updatePatient`;
export const FOLLOWUP_PATIENTS_LIST = `/registration/searchPatient`;
export const SEARCH_PATIENT = `/patient/search`;
export const CHECH_DUPLICATE_PATIENT = `/registration/checkDuplicatePatient`
export const CANCEL_APPOINTMENT = `/registration/cancelAppointment`;
export const RESCHEDULE_APPOINTMENT = `/registration/rescheduleAppointment`;
export const PATIENT_FOLLOW_UP_DETAILS = "/registration/getPatientDetails";
export const GET_CANCELLED_APPOINTMENTS = "/registration/getCancelledAppointments";
export const GET_TOKENS = `/registration/getAppointmentSlots`;
export const GET_PRECONSULTATION = `/patient/getPendingPreConsultations`;
export const SET_VITALS = `/patient/saveVitalDetails`;
export const GET_WAITING_LIST = `/patient/getWaitingList`;

//billing
export const RADIOLOGY_SERVICE_CATAGORY = "SC004";
export const OPD_SERVICE_CATAGORY = "SC001";
export const LAB_SERVICE_CATAGORY = "SC002"

export const PROCESS_OPD_PAYMENT = `/billing/processOpdPayment`;
export const PROCESS_LAB_PAYMENT = `/billing/processLabPayment`
export const PROCESS_RADIOLOGY_PAYMENT = `/billing/processRadiologyPayment`
export const PENDING_BILLINGS_BY_CATAGORY = `/billing/pendingBillingsByCategory`
export const LAB_RADIO_BILLING_DETAILS = "/billing/getLabRadiologyBillingDetails"
export const OPD_PATIENT_BILL_DETAILS = `/billing/OPDPatientBillDetails`
export const INVOICE_REPORTS = `/billing/searchInvoiceDetails`

export const PENDING_BILLING_PATIENTS = `/billing/pendingBillingPatients`







export const RADIOLOGY_TEMPLATE = "/master/radiologyTemplate"; 
export const INVENTORY = `/inventory`
export const SECTION_ID_FOR_DRUGS = 18;

export const MAS_BLOOD_COLLECTION_TYPE = `${MASTERS}/masBloodCollectionType`;
export const GENERAL = "/general";
export const GET_MODALITY_DROPDOWN_WRT_DEPARTMENT = `${GENERAL}/getModalityDetailsByDepartment`;
export const REQUEST_PARAM_CODE = "code";
export const RADIOLOGY_DEPARTMENT_CODE = "RADIMG";

export const RADIOLOGY_REPORT_END_URL = `${ALL_REPORTS}/radiologyReport`;
export const REQUEST_PARAM_FLAG = `flag`;
export const REQUEST_PARAM_RAD_ORDER_DT_ID = `radOrderDtId`;
export const STATUS_Y = `Y`;
export const STATUS_N = `N`;
export const STATUS_S = `S`;
export const STATUS_P = `P`;
export const STATUS_D = `D`;
export const RADIOLOGY_TEMPLATE_LIST_GET_BY_ID = `${MASTERS}/radiologyTemplateList/getById`;
export const RADIOLOGY_REPORT_SAVE_URL = `${RADIOLOGY}/saveDetailsReportForRadiology`;
export const REQUEST_PARAM_STATUS = "status";



export const GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL = `${MAS_DEPARTMENT}/allForDropdowns`;
export const REGISTRATION = `/registration`;
export const REQUEST_PARAM_FROM_DATE = "fromDate";
export const REQUEST_PARAM_TO_DATE = "toDate";
export const REQUEST_PARAM_DEPARTMENT_ID = "departmentId";
export const REQUEST_PARAM_DOCTOR_ID = "doctorId";
export const REQUEST_PARAM_HOSPITAL_ID = "hospitalId";
export const REQUEST_PARAM_DEPARTMENT_TYPE_CODE="departmentTypeCode";
export const REQUEST_PARAM_GENDER_ID="genderId";
export const REQUEST_PARAM_ICD_ID="icdId";
export const REQUEST_PARAM_PAGE="page";
export const REQUEST_PARAM_SIZE="size";
export const REQUEST_PARAM_CANCELLATION_ID="cancellationId";
export const REQUEST_PARAM_CANCELLATION_REASON_ID="cancellationReasonId";
export const ELEMENT_SIZE_PER_PAGE_FOR_ICD=20
export const ACTIVE_STATUS_FOR_DROPDOWN="1";
export const REQUEST_PARAM_SEARCH="search";






export const GET_APPOINTMENT_SUMMARY_REPORT_END_URL = `${REGISTRATION}/getAppointmentSummaryReport`;
export const APPOINTMENT_SUMMARY_DEPT_REPORT_END_URL = `${ALL_REPORTS}/appointSummaryDeptDash`;
export const APPOINTMENT_SUMMARY_DOCTOR_REPORT_END_URL = `${ALL_REPORTS}/appointSummaryDoctorDash`;
export const DAILY_CANCELLATION_REPORT_END_URL=`${ALL_REPORTS}/dailyCancellation`;
export const OPD_REGISTER_END_URL=`${ALL_REPORTS}/opdRegister`;
export const MAS_GENDER_GET_ALL_END_URL=`${MASTERS}/gender/getAll`;
export const MAS_ICD_GET_ALL_END_URL=`${MASTERS}/masIcd/all`;
export const OPD_BILLING_REGISTER_END_URL = `${ALL_REPORTS}/opdBillingRegister`;
export const LAB_BILLING_REGISTER_END_URL = `${ALL_REPORTS}/labBillingRegister`;
export const RADIOLOGY_BILLING_REGISTER_END_URL = `${ALL_REPORTS}/radiologyBillingRegister`; 
export const DAILY_CASH_COLLECTION_END_URL = `${ALL_REPORTS}/dailyCashCollection`;
export const CASHIER_WISE_COLLECTION_END_URL = `${ALL_REPORTS}/cashierWiseCollection`;
// Update path as needed


export const MAS_BLOOD_INVENTORY_STATUS = `${MASTERS}/masBloodInventoryStatus`;

export const MAS_COMPONENT_FAILURE_REASON = `${MASTERS}/masComponentFailureReason`;

export const SAVE_PENDING_SAMPLES_FOR_COLLECTION_END_URL=`${LAB}/savePendingSamplesForCollection`;
export const GET_PENDING_SAMPLE_HEADERS_FOR_COLLECTION_END_URL=`${LAB}/pendingSampleForCollection/headers`;
export const GET_PENDING_SAMPLE_DETAILS_FOR_COLLECTION_END_URL=`${LAB}/pendingSampleForCollection/details`;
export const GET_PENDING_SAMPLE_HEADERS_FOR_SAMPLE_VALIDATION_END_URL=`${LAB}/pendingSampleForValidation/headers`;
export const GET_PENDING_SAMPLE_DEATAILS_FOR_SAMPLE_VALIDATION_END_URL=`${LAB}/pendingSampleForValidation/details`;
export const SAMPLE_VALIDATION_END_URL=`${LAB}/sampleValidate`;


export const PENDING_SAMPLE_HEADERS_FOR_RESULT_VALIDATION_END_URL=`${LAB}/pendingSampleForResultValidation/headers`;
export const PENDING_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL=`${LAB}/investigationsForResultValidation/details`;
export const PENDING_SUB_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL=`${LAB}/subInvestigationsForResultValidation/details`;
export const FIXED_VALUE_DROPDOWNS_END_URL=`${LAB}/fixedValues/dropdown`;
export const RESULT_VALIDATE_END_URL=`${LAB}/resultValidate`;


export const PENDING_SAMPLE_HEADERS_FOR_RESULT_ENTRY_END_URL=`${LAB}/pendingSampleForResultEntry/headers`;
export const PENDING_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL=`${LAB}/investigationsForResult/details`;
export const PENDING_SUB_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL=`${LAB}/subInvestigationsForResult/details`;
export const SAVE_RESULT_ENTRY_END_URL=`${LAB}/saveResultEntry`;



export const PENDING_SAMPLE_HEADERS_FOR_RESULT_UPDATE_END_URL=`${LAB}/resultUpdate/headers`;
export const PENDING_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL=`${LAB}/investigationsForResultUpdate/details`;
export const PENDING_SUB_INVESTIGATIONS_FOR_RESULT_UPDATE_END_URL=`${LAB}/subInvestigationsForResultUpdate/details`;
export const UPDATE_RESULT_END_URL=`${LAB}/updateResult`;





export const REQUEST_PARAM_ORDER_HD_ID="orderHdId";
export const REQUEST_PARAM_SAMPLE_COLLECTION_HD_ID="sampleCollectionHeaderId";
export const REQUEST_PARAM_RESULT_ENTRY_HD_ID="resultEntryHeaderId";
export const REQUEST_PARAM_RESULT_ENTRY_DT_ID="resultEntryDetailId";
export const REQUEST_PARAM_INVESTIGATION_ID="investigationId";
export const REQUEST_PARAM_SUB_INVESTIGATION_ID="subInvestigationId";
export const REQUEST_PARAM_PATIENT_NAME="patientName";
export const REQUEST_PARAM_MOBILE_NO="patientMobileNumber";
export const REQUEST_PARAM_GENDER_CODE="genderCode";
export const REQUEST_PARAM_AGE="age";
export const REQUEST_PARAM_SUB_CHARGE_CODE_ID="subChargeCodeId";





export const MAS_CONTAINER_DROPDOWN_END_URL=`${DG_MAS_COLLECTION}/getAll`;
export const LAB_AMENDMENT_ALL_TYPE = `${MASTERS}/lab-amendment-type/all`;
export const MAS_SUB_CHARGE_CODE_DROPDOWN_END_URL = `${MAS_SUB_CHARGE_CODE}/getAll/${ACTIVE_STATUS_FOR_DROPDOWN}`;
export const REJECTED_INVESTIGATIONS_END_URL = `${LAB}/rejectedInvestigations`;
export const REJECTED_INVESTIGATIONS_REPORT_URL = `${ALL_REPORTS}/sampleRejection`;
export const PENDING_INVESTIGATIONS_REPORT_URL = `${ALL_REPORTS}/pendingInvestigation`;
export const PENDING_INVESTIGATIONS_END_URL = `${LAB}/incompleteInvestigations`;
export const ORDER_TRACKING_END_URL = `${LAB}/orderTracking`;
export const LAB_REPORT_URL_WRT_ORDER_HD = `${ALL_REPORTS}/labInvestigationReport`;
export const AMENDMENT_REPORT_URL = `${ALL_REPORTS}/resultAmendment`;
export const AMENDMENT_AUDIT_END_URL = `${LAB}/amendAudit/result`;
export const MAS_INVESTIGATION_DROPDOWN = `${MAS_INVESTIGATION}/mas-investigation/all`;
export const INVESTIGATIONS_END_URL= `${LAB}/investigationsReport/all`;
export const TAT_DETAIL_END_URL= `${LAB}/lab-tat/details`;
export const TAT_DETAIL_REPORT_URL= `${ALL_REPORTS}/detailTat`;
export const TAT_SUMMARY_REPORT_URL= `${ALL_REPORTS}/summaryTat`;
export const TAT_SUMMARY_END_URL= `${LAB}/lab-tat/summary`;


//opening balance entry

export const OPENING_BALANCE_REPORT_URL = `${ALL_REPORTS}/openingBalanceReport`;
export const SAVE_OPENING_BALANCE_ENTRY = `${INVENTORY}/openingBalanceEntry/save`;
export const SUBMIT_OPENING_BALANCE_ENTRY = `${INVENTORY}/openingBalanceEntry/submit`;
export const GET_DEPARTMENT_BY_ID = `${MAS_DEPARTMENT}/getById`;
export const GET_CURRENT_USER_PROFILE_BY_NAME = `/authController/getUsersForProfile`;
export const GET_ALL_BRANDS_FOR_DROPDOWN = `${MAS_BRAND}/getAll/${ACTIVE_STATUS_FOR_DROPDOWN}`;
export const GET_ALL_MANUFACTURER_FOR_DROPDOWN = `${MAS_MANUFACTURE}/getAll/${ACTIVE_STATUS_FOR_DROPDOWN}`;
export const REQUEST_PARAM_SECTION_ID = "sectionId";
export const REQUEST_PARAM_KEYWORD = "keyword";
export const GET_ALL_ITEMS_BY_NAME = `${INVENTORY}/item/search`;
export const GET_ITEM_DETAILS_BY_ID = `${INVENTORY}/item`;
export const GET_DRUG_CODE_FOR_DROPDOWN = `${MAS_DRUG_MAS}/getAll2/${ACTIVE_STATUS_FOR_DROPDOWN}`;
export const REQUEST_PARAM_BALANCE_M_ID= "balanceMId";


//View And Update Opening Balance Entry

export const GET_OPENING_BALANCE_ENTRY_HEADERS = `${INVENTORY}/openingBalanceEntry/headers`;
export const GET_OPENING_BALANCE_ENTRY_DETAILS = `${INVENTORY}/openingBalanceEntry/details`;
export const UPDATE_OPENING_BALANCE_ENTRY_BY_ID = `${INVENTORY}/openingBalanceEntry/updateById`;

//Opening Balance Approval List


export const GET_OPENING_BALANCE_ENTRY_HEADERS_WITHOUT_PAGINATION = `${INVENTORY}/openingBalanceEntry/headers/withoutPagination`;
export const APPROVE_OPENING_BALANCE_ENTRY = `${INVENTORY}/openingBalanceEntry/approve`;

//create indent

export const GET_CURRENT_DEPARTMENT=`${INVENTORY}/currentDepartment`;
export const GET_INDENT_APPLICABLE_DEPARTEMENTS = `${INVENTORY}/indentApplicable/departments`;
export const REQUEST_PARAM_CURRENT_DEPT_ID = "currentDeptId";
export const REQUEST_PARAM_REQUESTED_DEPT_ID = "requestedDeptId";
export const GET_ROL_ITEMS=`${Store_Internal_Indent}/rol-items`;
export const SAVE_INDENT=`${INVENTORY}/indent/save`;
export const SUBMIT_INDENT=`${INVENTORY}/indent/submit`;
export const INDENT_REPORT_URL = `${ALL_REPORTS}/indentReport`;
export const REQUERST_PARAM_INDENT_M_ID = "indentMId";

//view and update indent

export const GET_INDENT_HEADERS_FOR_VIEW_UPDATE = `${INVENTORY}/indents/viewUpdate`;
export const GET_INDENT_DETAILS_FOR_VIEW_UPDATE = `${INVENTORY}/indents/viewUpdate/details`;

//Approve indent request department

export const GET_INDENT_HEADERS_FOR_APPROVAL = `${INVENTORY}/indents/approval/pending`;
export const GET_INDENT_DETAILS_FOR_APPROVAL = `${INVENTORY}/indents/viewUpdate/details`;
export const APPROVE_INDENT = `${INVENTORY}/indent/approve`;


//approve indent issue department

export const GET_INDENT_HEADERS_FOR_ISSUE_APPROVAL = `${INVENTORY}/indents/approvedForIssueDept`;
export const GET_INDENT_DETAILS_FOR_ISSUE_APPROVAL = `${INVENTORY}/indentDetailsForIssueWithAvailableStock`;
export const APPROVE_INDENT_FOR_ISSUE = `${INVENTORY}/indent/approvedByIssueDept`;

//indent issue

export const GET_INDENT_HEADERS_FOR_ISSUE = `${INVENTORY}/indents/forIssue`;
export const GET_INDENT_DETAILS_FOR_ISSUE = `${INVENTORY}/indentDetailsForIssue`;
export const GET_STOCK_BATCHES_ITEM_WISE = `${INVENTORY}/item/batches`;
export const GET_ISSUE_M_ID_FROM_INDENT_M_ID = `${INVENTORY}/indent/getIssueMId`;
export const ISSUE_REPORT_URL = `${ALL_REPORTS}/indentIssue`;
export const REQUEST_PARAM_ISSUE_M_ID = "issueMId";
export const GET_PREVIOUS_ISSUE_DETAILS = `${INVENTORY}/indents/getPrevIssueInfos`;
export const REQUEST_PARAM_ITEM_ID = "itemId";
export const ISSUE_INDENT = `${INVENTORY}/indent/issue`;


//indent receiving

export const GET_INDENT_HEADERS_FOR_RECEIVING = `${INVENTORY}/indents/forReceiving`;
export const GET_INDENT_DETAILS_FOR_RECEIVING = `${INVENTORY}/indentDetailsForReceive`;
export const SAVE_INDENT_RECEIVING = `${INVENTORY}/indent/receive`;
export const RECEIVING_REPORT_URL = `${ALL_REPORTS}/indentReceiving`;
export const RETURN_REPORT_URL = `${ALL_REPORTS}/indentReturn`;
export const REQUEST_PARAM_RECEIVED_M_ID = "receiveMId";

//Track Indent
export const INDENT_TRACKING = `${INVENTORY}/indent/tracking`;
export const INDENT_TRACKING_STATUS_MAP = `${INVENTORY}/indent/tracking/statusMap`;
export const INDENT_TRACKING_SEARCH = `${INVENTORY}/indent/tracking/search`;
export const INDENT_DEPARTMENT_GET_ALL = `/master/indent-department/getAll`;
export const BATCH_DETAILS = `/batch/details`;
export const INDENT_GET_RETURN_MID = `${INVENTORY}/indent/getReturnMId`;
export const REQUEST_PARAM_FROM_DEPARTMENT_ID = "fromDepartmentId";
export const REQUEST_PARAM_INDENT_NO = "indentNo";
export const GET_RECEIVE_MID_FROM_INDENT_MID = `${INVENTORY}/indent/getReceiveMId`;
export const REQUEST_PARAM_RETURN_M_ID = "returnMId";














export const CONFIGURATION = `/configuration`;

export const GET_ALL_CHILDREN_BY_PARENT_ID_END_URL = `${CONFIGURATION}/getAllChildrenByParentId`;


export const MAS_QUESTION_OPTION_VALUE = `${MASTERS}/masQuestionOptionValue`;