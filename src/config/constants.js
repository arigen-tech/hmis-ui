import { COUNTRYAPI } from "./apiConfig";

export const DEPARTMENT_CODE_OPD=5;



//Common

export const FAIL_TO_SAVE_CHANGES="Failed to save changes";
export const FAIL_TO_UPDATE_STS="Failed to update status";
export const INVALID_PAGE_NO_WARN_MSG="Please enter a valid page number.";




//Laboratory

//LabBillingDetails
export const ERROR="Error!";
export const UNEXPECTED_ERROR="Something went wrong ,  Please try again"
export const SELECT_INVESTIGATIONS_ERROR_MSG="Please select at least one investigation or package.";
export const INVALID_INVESTIGATION_ERROR="One or more selected rows have no valid investigation/package. Please select from dropdown.";
export const INVALID_PATIENT_ID= "Patient ID not found. Please go back and try again.";
export const INVALID_INVESTIGATION_ID="No valid items found for registration. Please check the investigation data."
export const REGISTRATION="Registered !"
export const REGISTRATION_SUCCESS_MSG="New billing header created Successfully. Billing ID:"
export const REGISTRATION_ERR_MSG="Registration Error!"
export const PAYMENT_ERROR="Please select at least one investigation or package for payment."


//Lab registration
export const IMAGE_TITLE="Confirm Upload";
export const IMAGE_TEXT="Do you want to upload this photo?";
export const INVALID_DATE_TITLE="Invalid Date";
export const INVALID_DATE_TEXT="Cannot select past dates. Please select today or a future date.";
export const MISSING_FIELD="Missing Fields";
export const ADD_ROW_WARNING="Please fill investigation/package name before adding new row.";
export const DUPLICATE="Duplicate Found!";
export const DUPLICATE_PATIENT="A patient with these details already exists.";
export const SUCCESS="Success!";
export const LAB_REG_SUCC_MSG="Patient and Lab registered successfully! Redirecting to payment.";
export const WARNING="Warning";
export const INV_PRICE_WARNING_MSG="Price has not been configured for this Investigation";
export const PACKAGE_PRICE_WARNING_MSG="Price has not been configured for this Package";
export const MISSING_MANDOTORY_FIELD= "Missing Mandatory Fields";
export const MISSING_MANDOTORY_FIELD_MSG="Please fill all mandatory fields before proceeding.";
export const IMAGE_UPLOAD_SUCC_MSG= "Image uploaded successfully!";
export const IMAGE_UPLOAD_FAIL_MSG= "Failed to upload image!";



//MainChargecode

export const FETCH_MAIN_CHARGE_CODE_ERR_MSG="Failed to load main charge code data";
export const DUPLICATE_MAIN_CHARGE_CODE_MSG="Main charge code with the same code already exists!";
export const UPDATE_MAIN_CHARGE_CODE_SUCC_MSG="Main charge code updated successfully!";
export const ADD_MAIN_CHARGE_CODE_SUCC_MSG="New main charge code added successfully!";


//PendingForResultEntry

export const FETCH_RESULT_VALIDATE_ERR_MSG="Failed to load pending result entries";
export const RESULT_ENTRY_WARN_MSG="Please enter at least one result before submitting";
export const FETCH_AUTO_FILL_ERR_MSG="Missing required data. Please contact administrator.";
export const RESULT_SUBMIT_SUCC_MSG="Results submitted successfully!";
export const RESULT_SUBMIT_ERR_MSG="Error submitting results";


//PendingForSampleCollection


export const FETCH_PENDING_SAMPLE_ERR_MSG="Failed to load pending samples";
export const FETCH_CONTAINER_ERR_MSG="Failed to load containers";
export const SAMPLE_COLLECTION_SUCC_MSG="Sample collection data saved successfully!";
export const SAMPLE_COLLECTION_ERR_MSG="Failed to save sample collection";


//ResultValidation


export const FETCH_RESULT_ENTRY_ERR_MSG="Failed to load unvalidated results";
export const RESULT_VALIDATE_WARN_MSG="Please validate or reject at least one investigation before submitting.";
export const RESULT_SELECT_WARN_MSG="No investigations selected for validation.";
export const RESULT_VALIDATE_ERR_MSG="Failed to validate results";
export const RESULT_VALIDATE_SUCC_MSG="Validation has been done successfully! Do you want to print the report?";


//ViewDownload

export const FETCH_RESULT_DATA_ERR_MSG="No result data found. Redirecting back...";
export const INVALID_ORDER_ID_ERR_MSG="Order ID not found";
export const LAB_REPORT_GENERATION_ERR_MSG="Error generating lab report. Please try again.";
export const LAB_REPORT_PRINT_ERR_MSG="Error generating lab report. Please try again.";


//Sample Collection Master

export const FETCH_SAMPLE_COLLECTION_ERR_MSG="Failed to load sample collection data";
export const DUPLICATE_SAMPLE_COLLECTION_ERR_MSG="Sample collection with the same code already exists!";
export const UPDATE_SAMPLE_COLLECTION_SUCC_MSG="Sample collection updated successfully!";
export const ADD_SAMPLE_COLLECTION_SUCC_MSG="New sample collection added successfully!";


//SasmpleValidation


export const FETCH_SAMPLE_VALIDATIONS_ERR_MSG="Failed to load pending validation samples";
export const VALIDATION_WARN_MSG="Please make a decision for ALL investigations. Each row must be either Accepted or Rejected.";
export const REJECT_REASON_WARN_MSG="Please provide a reason for all rejected investigations.";
export const VALIDATION_SUCC_MSG="Investigations validated successfully!";


//SubchargeCode

export const MIS_MATCH_ERR_MSG="Unable to read server response. Please try again.";
export const FETCH_SUB_CHARGE_CODES_ERR_MSG="Failed to load sub-charge codes";
export const DUPLICATE_SUB_CHARGE_CODE_ERR_MSG="A sub charge code with this code already exists!";
export const UPDATE_SUB_CHARGE_CODE_SUCC_MSG="Sub charge code updated successfully!";
export const ADD_SUB_CHARGE_CODE_SUCC_MSG="New sub charge code added successfully!";


//UOMMaster

export const FETCH_UOM_ERR_MSG="Failed to load UOM data";
export const DUPLICATE_UOM_ERR_MSG="UOM with the same code already exists!";
export const UPDATE_UOM_SUCC_MSG="UOM updated successfully!";
export const ADD_UOM_SUCC_MSG="New UOM added successfully!";




//UpdateLabRegistration

export const INFO="Info !";
export const PATIENT_NOT_FOUND_WARN_MSG="No patients found matching your criteria";
export const DUPLICATE_FOUND="Duplicate Found!";
export const LAB_BOOKING_SUCC_MSG="Lab booking registered successfully! Redirecting to payment.";
export const LAB_REGISTER_SUCC_MSG="Lab booking registered successfully!";
export const LAB_REG_FAIL_MSG="Registration failed";
export const INVALID_PAGE="Invalid page !";


//UpdateResultValidation

export const FETCH_RESULT_UPDATE_DATA_ERR_MSG="Failed to load update results";
export const RESULT_UPDATE_SUCC_MSG="All results updated successfully!";
export const RESULT_UPDATE_ERR_MSG="Results failed to update";


//OPDBillingDetails

export const APPOINTMENT_NOT_FOUND_ERR_MSG= "No appointment data found";


//BedManagementMaster

export const FETCH_DROP_DOWN_ERR_MSG="Some options could not be loaded. Please try again later";
export const FETCH_BED_DATA_ERR_MSG="Failed to load bed data";
export const DUPLICATE_BED_DATA="Bed number already exists!";
export const UPDATE_BED_SUCC_MSG="Bed updated successfully!";
export const ADD_BED_SUCC_MSG="New bed added successfully!";


//BedStatusMaster

export const FETCH_BED_STATUS_ERR_MSG="Failed to load bed status data";
export const DUPLICATE_BED_STATUS="Bed Status with the same name already exists!";
export const UPDATE_BED_STATUS_SUCC_MSG="Bed status updated successfully!";
export const ADD_BED_STATUS_SUCC_MSG="New bed status added successfully!";


//BedTypeMaster

export const FETCH_BED_TYPE_ERR_MSG="Failed to load bed type data";
export const DUPLICATE_BED_TYPE="Bed type with the same name already exists!";
export const UPDATE_BED_TYPE_SUCC_MSG="Bed type updated successfully!";
export const ADD_BED_TYPE_SUCC_MSG="New bed type added successfully!";


//CareLevelMaster

export const FETCH_CARE_LEVEL_ERR_MSG="Failed to load care level data";
export const DUPLICATE_CARE_LEVEL="Care level with the same name already exists!";
export const UPDATE_CARE_LEVEL_SUCC_MSG="Care level updated successfully!";
export const ADD_CARE_LEVEL_SUCC_MSG="New Care level added successfully!";


//DepartmentMaster

export const FETCH_DEPARTMENT_ERR_MSG="Failed to load depatment data";
export const DUPLICATE_DEPARTMENT="Department with the same code, name, or number already exists!"
export const UPDATE_DEPARTMENT_SUCC_MSG="Department updated successfully!";
export const ADD_DEPARTMENT_SUCC_MSG="New department added successfully!";
export const FETCH_DEPARTMENT_TYPE_ERR_MSG="Failed to load department types";
export const FETCH_WARD_CATEGORY_ERR_MSG="Failed to load ward categories";


//DietPrefernceMaster

export const FETCH_DIET_PREFERNCE_ERR_MSG="Failed to load diet preferences";
export const DUPLICATE_DIET_PREFERENCE="Diet preference with same name already exists!"
export const UPDATE_DIET_PREFERENCE_SUCC_MSG="Diet preference updated successfully!";
export const ADD_DIET_PREFERENCE_SUCC_MSG="New diet preference added successfully!";


//DietScheduleMaster

export const FETCH_DIET_SCHEDULE_ERR_MSG="Failed to load diet schedules";
export const DUPLICATE_DIET_SCHEDULE="Diet schedule with same status name already exists!"
export const UPDATE_DIET_SCHEDULE_SUCC_MSG="Diet schedule updated successfully!";
export const ADD_DIET_SCHEDULE_SUCC_MSG="New diet schedule added successfully!";


//DietTypeMaster


export const FETCH_DIET_TYPE_ERR_MSG="Failed to load diet types";
export const DUPLICATE_DIET_TYPE="Diet type already exists!"
export const UPDATE_DIET_TYPE_SUCC_MSG="Diet type updated successfully!";
export const ADD_DIET_TYPE_SUCC_MSG="New diet type added successfully!";


//FamilyHistoryMaster


export const FETCH_FAMILY_HISTROY_ERR_MSG="Failed to load family history data";
export const DUPLICATE_FAMILY_HISTORY="Family history name already exists!";
export const UPDATE_FAMILY_HISTORY_SUCC_MSG="Family history updated successfully!";
export const ADD_FAMILY_HISTORY_SUCC_MSG="New family history added successfully!";


//IntakeItemMaster


export const FETCH_INTAKE_ITEM_ERR_MSG="Failed to load  intake items";
export const FETCH_INTAKE_TYPE_ERR_MSG="Failed to load  intake item types";
export const DUPLICATE_INTAKE_ITEM="Intake item name already exists!";
export const UPDATE_INTAKE_ITEM_SUCC_MSG="Intake item updated successfully!";
export const ADD_INTAKE_ITEM_SUCC_MSG="New intake item added successfully!";

//IntakeItemTypeMaster

export const DUPLICATE_INTAKE_TYPE="Intake item type already exists!";
export const UPDATE_INTAKE_TYPE_SUCC_MSG="Intake item type updated successfully!";
export const ADD_INTAKE_TYPE_SUCC_MSG="New intake item type added successfully!";


//InvestigationCategoryMaster

export const FETCH_INV_CATEGORY_ERR_MSG="Failed to load  investigation categories";
export const DUPLICATE_INV_CATEGORY="Investigation category with the same name already exists!";
export const UPDATE_INV_CATEGORY_SUCC_MSG="Investigation category updated successfully!";
export const ADD_INV_CATEGORY_SUCC_MSG="New investigation category added successfully!";

//InvestigationMethodologyMaster


export const FETCH_INV_METHODOLOGY_ERR_MSG="Failed to load  investigation methodologies";
export const DUPLICATE_INV_METHODOLOGY="Investigation methodology with the same name already exists!";
export const UPDATE_INV_METHODOLOGY_SUCC_MSG="Investigation methodology updated successfully!";
export const ADD_INV_METHODOLOGY_SUCC_MSG="New investigation methodology added successfully!";

//InvestigationMaster


export const UPDATE_INV_SUCC_MSG="Investigation updated successfully!";
export const ADD_INV_SUCC_MSG="Investigation created successfully!";
export const SELECT_INV_ERR_MSG="Please select an investigation first";


//InvestigationMasterResult

export const UPDATE_TWICE_SUB_INV_ERR_MSG= "You’ve already made this update. To make another change please start new session";
export const UPDATE_SUB_INV_ERR_MSG= "Failed to update sub-investigations";
export const UPDATE_SUB_INV_SUCC_MSG="Sub-investigations updated successfully!";



//MealTypeMaster

export const FETCH_MEAL_TYPE_ERR_MSG="Failed to load  meal types";
export const DUPLICATE_MEAL_TYPE="Meal type with the same name already exists!";
export const UPDATE_MEAL_TYPE_SUCC_MSG="Meal type updated successfully!";
export const ADD_MEAL_TYPE_SUCC_MSG="New meal type added successfully!";


//OutputTypeMaster


export const FETCH_OUTPUT_TYPE_ERR_MSG="Failed to load output types";
export const DUPLICATE_OUTPUT_TYPE="Output type with the same name already exists!";
export const UPDATE_OUTPUT_TYPE_SUCC_MSG="Output type updated successfully!";
export const ADD_OUTPUT_TYPE_SUCC_MSG="New output type added successfully!";


//PatientAcuityMaster


export const FETCH_PATIENT_ACUITY_ERR_MSG="Failed to load patient acuties";
export const DUPLICATE_PATIENT_ACUITY="Patient acuity with the same name already exists!";
export const UPDATE_PATIENT_ACUITY_SUCC_MSG="Patient acuity updated successfully!";
export const ADD_PATIENT_ACUITY_SUCC_MSG="New patient acuity added successfully!";


//ProcedureTypeMaster

export const FETCH_PROCEDURE_TYPE_ERR_MSG="Failed to load procedure types";
export const DUPLICATE_PROCEDURE_TYPE="Procedure type with the same name already exists!";
export const UPDATE_PROCEDURE_TYPE_SUCC_MSG="Procedure type updated successfully!";
export const ADD_PROCEDURE_TYPE_SUCC_MSG="New procedure type added successfully!";
export const ACTIVATE_PROCEDURE_TYPE_SUCC_MSG="Procedure type activated successfully!";
export const ACTIVATE_PROCEDURE_TYPE_ERR_MSG="Fail to activate procedure type";


//ProcedureMaster

export const FETCH_PROCEDURE_ERR_MSG="Failed to load procedures";
export const DUPLICATE_PROCEDURE="Procedure with the same name already exists!";
export const UPDATE_PROCEDURE_SUCC_MSG="Procedure updated successfully!";
export const ADD_PROCEDURE_SUCC_MSG="New procedure added successfully!";
export const ACTIVATE_PROCEDURE_SUCC_MSG="Procedure activated successfully!";
export const ACTIVATE_PROCEDURE_ERR_MSG="Fail to activate procedure";



//RoomCategoryMaster


export const FETCH_ROOM_CAT_ERR_MSG="Failed to load room categories";
export const DUPLICATE_ROOM_CAT="Room category with the same name already exists!";
export const UPDATE_ROOM_CAT_SUCC_MSG="Room category updated successfully!";
export const ADD_ROOM_CAT_SUCC_MSG="New room category added successfully!";

//RoomMasterScreen

export const FETCH_ROOM_ERR_MSG="Failed to load rooms";
export const DUPLICATE_ROOM="Room with the same name already exists!";
export const UPDATE_ROOM_SUCC_MSG="Room updated successfully!";
export const ADD_ROOM_SUCC_MSG="New room added successfully!";


//SampleMaster

export const FETCH_SAMPLE_ERR_MSG="Failed to load samples";
export const DUPLICATE_SAMPLE="Sample with same code or description already exists!";
export const UPDATE_SAMPLE_SUCC_MSG="Sample updated successfully!";
export const UPDATE_SAMPLE_ERR_MSG="Failed to update sample";
export const ADD_SAMPLE_SUCC_MSG="New sample added successfully!";
export const ADD_SAMPLE_ERR_MSG="Failed to add sample";

//TreatmentAdvice


export const FETCH_TREAT_ADV_ERR_MSG="Failed to load treatment advices";
export const DUPLICATE_TREAT_ADV="Treatment advice already exists for this department!";
export const UPDATE_TREAT_ADV_SUCC_MSG="Treatment advice updated successfully!";
export const ADD_TREAT_ADV_SUCC_MSG="New treatment advice added successfully!";


//wardCategoryMaster

export const DUPLICATE_WARD_CATEGORY="Ward Category with the same name already exists!";
export const UPDATE_WARD_CATEGORY_SUCC_MSG="Ward category updated successfully!";
export const ADD_WARD_CATEGORY_SUCC_MSG="New ward category added successfully!";


//AdmissionStatusMaster

export const FETCH_ADMISSION_STATUS_ERR_MSG = "Failed to load admission status data";
export const DUPLICATE_ADMISSION_STATUS = "Admission Status Code already exists";
export const ADD_ADMISSION_STATUS_SUCC_MSG = "Admission Status added successfully!";
export const UPDATE_ADMISSION_STATUS_SUCC_MSG = "Admission Status updated successfully!";

//SpecialityMaster

export const ADD_SPECIALTY_SUCC_MSG = "Specialty Center added successfully!";
export const UPDATE_SPECIALTY_SUCC_MSG = "Specialty Center updated successfully!";
export const DUPLICATE_SPECIALTY = "Specialty Center already exists!";
export const FETCH_SPECIALTY_ERR_MSG = "Failed to fetch specialty center data";

//BillingPolicyMaster


export const ADD_BILLING_POLICY_SUCC_MSG = "Billing Policy added successfully!";
export const UPDATE_BILLING_POLICY_SUCC_MSG = "Billing Policy updated successfully!";
export const DUPLICATE_BILLING_POLICY = "Billing Policy already exists!";
export const FETCH_BILLING_POLICY_ERR_MSG = "Failed to load billing policy data";




// IndentCreation Messages
export const SELECT_DRUG_ERROR = "Please select a drug from the dropdown";
export const DUPLICATE_DRUG_WARNING = "This drug is already added in another row. Please select a different drug.";
export const MINIMUM_ROWS_WARNING = "At least one row is required";
export const EMPTY_DRUG_NAME_WARNING = "Please fill drug name before adding new row";
export const INVALID_DEPARTMENT_ERROR = "Please select a department";
export const INVALID_DATE_ERROR = "Indent date is required";
export const INVALID_QUANTITY_ERROR = "Required quantity must be greater than 0";
export const EXCEED_STOCK_ERROR = "Required quantity cannot exceed available stock";
export const MANDATORY_FIELD_WARNING = "Please fill the Mandatory field before ";
export const DUPLICATE_DRUGS_WARNING = "Duplicate drugs found. Please remove duplicate entries before ";
export const NO_VALID_DRUGS_WARNING = "Please select valid drugs before ";
export const INDENT_SAVE_SUCCESS = "Indent saved successfully!";
export const INDENT_SUBMIT_SUCCESS = "Indent submitted successfully!";
export const INDENT_SAVE_ERROR = "Error saving indent";
export const INDENT_SUBMIT_ERROR = "Error submitting indent";
export const NO_ROL_ITEMS_WARNING = "Please select at least one item to import";
export const ROL_IMPORT_SUCCESS = "items imported successfully from ROL";
export const ROL_LOAD_ERROR = "Error fetching ROL items from server";
export const NO_ROL_DATA = "No items found below reorder level. All items have sufficient stock.";
export const IMPORT_FROM_PREVIOUS = "Import from Previous Indent feature coming soon";

//Blood GAROUP Master


export const FETCH_BLOOD_GROUP_ERR_MSG="Failed to load blood group data";
export const DUPLICATE_BLOOD_GROUP="Blood group with the same name already exists!";
export const UPDATE_BLOOD_GROUP_SUCC_MSG="Blood group updated successfully!";
export const ADD_BLOOD_GROUP_SUCC_MSG="New blood group added successfully!";





