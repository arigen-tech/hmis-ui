//  export const API_HOST = 'http://103.133.215.182:8081/hims';

 export const API_HOST = 'http://localhost:8080';
//  export const API_HOST = 'http://localhost:8080';
//  export const API_HOST = 'http://192.168.1.8:8080';

// export const API_HOST = 'http://localhost:8080';
// export const API_HOST = 'http://localhost:8080';
// export const API_HOST = 'http://103.133.215.182:8081/hims';

//export const API_HOST = 'http://192.168.1.8:8080';






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
export const DG_MAS_INVESTIGATION_CATEGORY=`${MASTERS}/masInvestigationCategory`;
export const DG_MAS_INVESTIGATION_METHODOLOGY=`${MASTERS}/masInvestigationMethodology`;
export const MAS_DESIGNATION = `${MASTERS}/masDesignation`;
export const MAS_SPECIALITY_CENTER = `${MASTERS}/masSpecialty`;
export const MAS_EMPLOYEE_TYPE = `${MASTERS}/employeeType`;
export const CHECK_AVAILABILITY_TOKEN = `/doctor/checkAllAvailableTokens`;
export const GET_ALL_REASONS = `${MASTERS}/cancel-payment-reason`;
export const MAS_LANGUAGES= `${MASTERS}/masLanguage`;



export const DG_UOM = `${MASTERS}/dgUom`;
export const MAS_BRAND = `${MASTERS}/masBrand`;
export const MAS_MANUFACTURE = `${MASTERS}/masManufacturer`;
export const OPEN_BALANCE = "/openingBalanceEntry";
export const ALL_REPORTS = `${API_HOST}/report`;
export const OPD_PATIENT = "/patient";


export const FILTER_OPD_DEPT = `OPD`;
export const ALL_LAB_HISTORY_REPORT=`${ALL_REPORTS}/lab-histrory`;
export const OPD_REPORT_API=`${ALL_REPORTS}/opdReport`;
export const LAB_REPORT_API=`${ALL_REPORTS}/labReport`;


























export const DEPARTMENT = `/department`;

export const ALL_DEPARTMENT = `${MASTERS}/department/getAll`;
export const DOCTOR = `/users`;
export const SESSION = `/opd-session`;
export const APPOINTMENT = `/app`;
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
export const ALL_USER_APPLICATION = `/applications/getAllUserApplications`;
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
export const USER_APPLICATION = `/applications`;
export const TEMPLATES = `/mas-templates`;
export const APPLICATION = `/mas-applications`;
export const ASSIGN_TEMPLATES = `/template-applications`;
export const ROLE_TEMPLATE = `/role-template`;
export const IDENTITY_TYPE = `/identification-types`;
export const DOCTOR_ROSTER = `/doctor`;
export const GET_DOCTOR_SESSION = `/doctor/rosterfind?`;

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



export const ITEM_CLASS = {
  TABLET: 1,
  CAPSULE: 2,
  EARDROPS: 7,
  LIQUID: 15,
  EYEEARDROPS:52,
  SYRUP: 57
};

export const DRUG_TYPE = {
  SOLID: [ITEM_CLASS.TABLET, ITEM_CLASS.CAPSULE],
  LIQUID: [ITEM_CLASS.EARDROPS, ITEM_CLASS.LIQUID, ITEM_CLASS.EYEEARDROPS, ITEM_CLASS.SYRUP]
};

//For Department Master showing that ward category dropdown on the basis of Department Type as Ward
export const WARD_ID=10;
export const MAS_ROOM_CATEGORY=`${MASTERS}/mas-room-category`
export const MAS_BED_STATUS = `${MASTERS}/mas-bed-status`;
export const MAS_WARD_CATEGORY =`${MASTERS}/masWardCategory`;
export const MAS_CARE_LEVEL = `${MASTERS}/mas-care-level`;
export const MAS_BED_TYPE = `${MASTERS}/masBedType`;
export const MAS_ROOM= `${MASTERS}/mas-room`;
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
export const MAS_QUESTION_HEADING =`${MASTERS}/masQuestionHeading`;

export const BILLING = `${LAB}/billingStatus`;
export const MAS_OB_CONCEPTION = `${MASTERS}/obMasConception`;
export const MAS_CERVIX_POSITION = `${MASTERS}/ObMasCervixPosition`;
export const MAS_OPTH_COLOR_VISION = `${MASTERS}/opthMasColorVision`;
export const MAS_OP_PELVIS_TYPE = `${MASTERS}/obMasPelvisType`;
export const MAS_PRESENTATION = `${MASTERS}/obMasPresentation`;
export const MAS_STERILISATION = `${MASTERS}/gynMasSterilisation`;
export const MAS_STATION_PRESENTATION =`${MASTERS}/obMasStationPresenting`;
export const MAS_OPTH_LENSTYPE =`${MASTERS}/opthMasLensType`;
export const MAS_EAR_CANAL = `${MASTERS}/entMasEarCanal`;
export const MAS_ENT_RINNE = `${MASTERS}/entMasRinne`;
export const MAS_OPTH_NEAR_VISION =`${MASTERS}/opthMasNearVision`;
export const MAS_OB_CONSANGUINITY =`${MASTERS}/obMasConsanguinity`;
export const MAS_GYN_FLOW =`${MASTERS}/gynMasFlow`;
export const MAS_ENT_SEPTUM =`${MASTERS}/entMasSeptum`;
export const MAS_OB_PVLIQUOR=`${MASTERS}/ObMasPvLiquor`;
export const MAS_ENT_MUCOSA=`${MASTERS}/entMasMucosa`;
export const MAS_OB_PVMEMBRANE =`${MASTERS}/ObMasPvMembrane`;
export const MAS_COMMON_STATUS =`${MASTERS}/mas-common-status`;
export const ENT_MAS_TM_STATUS =`${MASTERS}/entMasTmStatus`;
export const OB_MAS_IMMUNISED_STATUS = `${MASTERS}/obMasImmunisedStatus`;export const MAS_GYN_POPSMEAR = `${MASTERS}/gynMasPapSmear`;
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



//patient Registration 
export const PATIENT_IMAGE_UPLOAD = `/registration/uploadPatientImage`;
export const PATIENT_REGISTRATION=`/registration/createPatient`;
export const PATIENT_FOLLOW_UP = `/registration/updatePatient`;
export const SEARCH_PATIENT = `/registration/searchPatient`;
export const CHECH_DUPLICATE_PATIENT = `/registration/checkDuplicatePatient`
export const CANCEL_APPOINTMENT = `/registration/cancelAppointment`;
export const RESCHEDULE_APPOINTMENT = `/registration/rescheduleAppointment`;
export const PATIENT_FOLLOW_UP_DETAILS = "/registration/getPatientDetails";
export const GET_CANCELLED_APPOINTMENTS ="/registration/getCancelledAppointments";
export const UPDATE_PATIENT_STATUS = `/registration/updatepaymentstatus`;
export const GET_PRECONSULTATION=`/patient/getPendingPreConsultations`;
export const SET_VITALS=`/patient/saveVitalDetails`;
export const GET_WAITING_LIST=`/patient/getWaitingList`;

