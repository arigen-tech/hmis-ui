

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
export const DUPLICATE_PACKAGE_WARN_MSG= "This package is already added for this date.";
export const DUPLICATE_INV_INCLUDE_PACKAGE="This investigation is already added or included in a package for this date."
export const DUPLICATE_INV_PACKAGE_WARN_MSG="Duplicate found! Please remove the duplicate before proceeding.";
export const COMMON_INV_IN_PACKAGES= "Cannot add package because it contains investigations that are already included in other selected packages.";
export const DUPLICATE_PACKAGE_WRT_INV= "Cannot add package because it contains investigations that are already selected individually";


//UpdateResultValidation

export const FETCH_RESULT_UPDATE_DATA_ERR_MSG="Failed to load update results";
export const RESULT_UPDATE_SUCC_MSG="All results updated successfully!";
export const RESULT_UPDATE_ERR_MSG="Results failed to update";
export const SELECT_ROW_TO_EDIT_WARN_MSG= "Please select at least one row to edit before updating.";


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

//SpectacleUseMaster


export const ADD_SPECTACLE_USE_SUCC_MSG = "Spectacle Use added successfully!";
export const UPDATE_SPECTACLE_USE_SUCC_MSG = "Spectacle Use updated successfully!";
export const FETCH_SPECTACLE_USE_ERR_MSG = "Failed to load spectacle use data!";
export const DUPLICATE_SPECTACLE_USE = "Spectacle Use already exists!";

//BookedStatusMaster


export const ADD_BOOKED_STATUS_SUCC_MSG = "Booked Status added successfully!";
export const UPDATE_BOOKED_STATUS_SUCC_MSG = "Booked Status updated successfully!";
export const FETCH_BOOKED_STATUS_ERR_MSG = "Failed to fetch booked status data!";
export const DUPLICATE_BOOKED_STATUS = "Booked Status already exists!";

//ToothConditionMaster


export const ADD_TOOTH_CONDITION_SUCC_MSG = "Tooth Condition added successfully!";
export const UPDATE_TOOTH_CONDITION_SUCC_MSG = "Tooth Condition updated successfully!";
export const FETCH_TOOTH_CONDITION_ERR_MSG = "Failed to fetch tooth condition data!";
export const DUPLICATE_TOOTH_CONDITION = "Tooth Condition already exists!";




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
export const INDENT_SAVE_SUCCESS = "Indent saved successfully! Do you want to print report ?";
export const INDENT_SUBMIT_SUCCESS = "Indent submitted successfully ! , Do You want to print report ?";
export const INDENT_SAVE_ERROR = "Error saving indent";
export const INDENT_SUBMIT_ERROR = "Error submitting indent";
export const NO_ROL_ITEMS_WARNING = "Please select at least one item to import";
export const ROL_IMPORT_SUCCESS = "items imported successfully from ROL";
export const ROL_LOAD_ERROR = "Error fetching ROL items from server";
export const NO_ROL_DATA = "No items found below reorder level. All items have sufficient stock.";
export const IMPORT_FROM_PREVIOUS = "Import from Previous Indent feature coming soon";
export const FETCH_ITEM_ERR_MSG = "Error fetching drugs";


//Blood GAROUP Master


export const FETCH_BLOOD_GROUP_ERR_MSG="Failed to load blood group data";
export const DUPLICATE_BLOOD_GROUP="Blood group with the same name already exists!";
export const UPDATE_BLOOD_GROUP_SUCC_MSG="Blood group updated successfully!";
export const ADD_BLOOD_GROUP_SUCC_MSG="New blood group added successfully!";
export const INVALID_BLOOD_GROUP_ID="Error: Invalid blood group ID";


//Country Master
export const FETCH_COUNTRY_ERR_MSG="Failed to load country data";
export const DUPLICATE_COUNTRY="Country with the same name already exists!";
export const UPDATE_COUNTRY_SUCC_MSG="Country updated successfully!";
export const ADD_COUNTRY_SUCC_MSG="New country added successfully!";


//Department Type Master
export const DUPLICATE_DEPARTMENT_TYPE="Department type with the same name already exists!";
export const UPDATE_DEPARTMENT_TYPE_SUCC_MSG="Department type updated successfully!";
export const ADD_DEPARTMENT_TYPE_SUCC_MSG="New department type added successfully!";

//District Master
export const FETCH_DISTRICT_ERR_MSG="Failed to load district data";
export const DUPLICATE_DISTRICT="District with the same name already exists!";
export const UPDATE_DISTRICT_SUCC_MSG="District updated successfully!";
export const ADD_DISTRICT_SUCC_MSG="New district added successfully!";


//Frequency Master
export const FETCH_FREQUENCY_ERR_MSG="Failed to load frequency data";
export const DUPLICATE_FREQUENCY="Frequency with the same name already exists!";
export const UPDATE_FREQUENCY_SUCC_MSG="Frequency updated successfully!";
export const ADD_FREQUENCY_SUCC_MSG="New frequency added successfully!";


//Gender Master
export const FETCH_GENDER_ERR_MSG="Failed to load gender data";
export const DUPLICATE_GENDER="Gender with the same name already exists!";
export const UPDATE_GENDER_SUCC_MSG="Gender updated successfully!";
export const ADD_GENDER_SUCC_MSG="New gender added successfully!";

//Hospital Master
export const FETCH_HOSPITAL_ERR_MSG="Failed to load hospital data";
export const DUPLICATE_HOSPITAL="Hospital with the same name already exists!";
export const UPDATE_HOSPITAL_SUCC_MSG="Hospital updated successfully!";
export const ADD_HOSPITAL_SUCC_MSG="New hospital added successfully!";
export const FAILED_TO_LOAD_SELECTED_COUNTRY="Failed to load states for selected country";


//HSN Master
export const FETCH_HSN_ERR_MSG="Failed to load HSN data";
export const DUPLICATE_HSN="HSN with the same code already exists!";
export const UPDATE_HSN_SUCC_MSG="HSN updated successfully!";
export const ADD_HSN_SUCC_MSG="New HSN added successfully!";
export const VALID_GST_RATE="Please enter a valid GST Rate between 0 and 100.";


//Identification Master
export const FETCH_IDENTIFICATION_ERR_MSG="Failed to load identification data";
export const DUPLICATE_IDENTIFICATION="Identification with the same name already exists!";
export const UPDATE_IDENTIFICATION_SUCC_MSG="Identification updated successfully!";
export const ADD_IDENTIFICATION_SUCC_MSG="New identification added successfully!";


//Investigation Pricing Master
export const FETCH_INV_PRICING_ERR_MSG="Failed to load investigation pricing data";
export const UPDATE_INV_PRICING_SUCC_MSG="Investigation pricing updated successfully!";
export const ADD_INV_PRICING_SUCC_MSG="New investigation pricing added successfully!";
export const FAIL_TO_LOAD_INV_OPTION="Failed to load investigation options";
export const FILL_ALL_REQUIRED_FIELDS="Please fill in all required fields";
export const TO_DATE_AFTER_FROM_DATE="To Date must be after From Date";


//Marital Status Master
export const FETCH_MARITAL_STATUS_ERR_MSG="Failed to load marital status data";
export const DUPLICATE_MARITAL_STATUS="Marital status with the same name already exists!";
export const UPDATE_MARITAL_STATUS_SUCC_MSG="Marital status updated successfully!";
export const ADD_MARITAL_STATUS_SUCC_MSG="New marital status added successfully!";


//OPD Master
export const FETCH_OPD_ERR_MSG="Failed to load OPD data";
export const DUPLICATE_OPD="OPD with the same name already exists!";
export const UPDATE_OPD_SUCC_MSG="OPD updated successfully!";
export const ADD_OPD_SUCC_MSG="New OPD added successfully!";
export const END_TIME_AFTER_START_TIME="End Time must be after Start Time";


//OPD service master
export const UPDATE_OPD_SERVICE_SUCC_MSG="OPD service updated successfully!";
export const ADD_OPD_SERVICE_SUCC_MSG="New OPD service added successfully!";


//Package Investigation Master
export const FETCH_PACKAGE_INV_ERR_MSG="Failed to load package investigation data";
export const UPDATE_PACKAGE_INV_SUCC_MSG="Package investigation updated successfully!";
export const ADD_PACKAGE_INV_SUCC_MSG="New package investigation added successfully!";
export const SOME_INVESTIGATIONS_INVALID="Some investigation IDs were invalid";
export const SELECT_A_PACKAGE_AT_LEAST_ONE_INVESTIGATION="Please select a package and at least one investigation";
export const DUPLICATE_INV="Duplicate investigation ! Investigation already exists in that package";


//Package Master
export const FETCH_PACKAGE_ERR_MSG="Failed to load package data";
export const UPDATE_PACKAGE_SUCC_MSG="Package updated successfully!";
export const ADD_PACKAGE_SUCC_MSG="New package added successfully!";
export const VALID_BASE_COST="Please enter a valid Base Cost.";
export const DISCOUNT_CANOT_NAGATIVE="Flat discount cannot be negative.";
export const DISCOUNT_PERCENTAGE="Discount percentage must be between 0 and 100.";


//Relationship Master
export const FETCH_RELATIONSHIP_ERR_MSG="Failed to load relationship data";
export const DUPLICATE_RELATIONSHIP="Relationship with the same name already exists!";
export const UPDATE_RELATIONSHIP_SUCC_MSG="Relationship updated successfully!";
export const ADD_RELATIONSHIP_SUCC_MSG="New relationship added successfully!";


//Religion Master
export const FETCH_RELIGION_ERR_MSG="Failed to load religion data";
export const DUPLICATE_RELIGION="Religion with the same name already exists!";
export const UPDATE_RELIGION_SUCC_MSG="Religion updated successfully!";
export const ADD_RELIGION_SUCC_MSG="New religion added successfully!";


//Service Category
export const UPDATE_SERVICE_CATEGORY_SUCC_MSG="Service category updated successfully!";
export const ADD_SERVICE_CATEGORY_SUCC_MSG="New service category added successfully!";


//state master
export const FETCH_STATE_ERR_MSG="Failed to load state data";
export const DUPLICATE_STATE="State with the same name already exists!";
export const UPDATE_STATE_SUCC_MSG="State updated successfully!";
export const ADD_STATE_SUCC_MSG="New state added successfully!";


//user department master
export const FETCH_USER_DEPARTMENT_ERR_MSG="Failed to load user department data";
export const DUPLICATE_USER_DEPARTMENT="User department with the same name already exists!";
export const UPDATE_USER_DEPARTMENT_SUCC_MSG="User department updated successfully!";
export const ADD_USER_DEPARTMENT_SUCC_MSG="New user department added successfully!";
export const FAIL_TO_LOAD_USERS="Failed to load users";
export const FAIL_TO_LOAD_DEPARTMENTS="Failed to load departments";


//Lab Amendment Type Master 

export const ADD_LAB_AMENDMENT_TYPE_SUCC_MSG = "Amendment type added successfully!";
export const UPDATE_LAB_AMENDMENT_TYPE_SUCC_MSG = "Amendment type updated successfully!";
export const DUPLICATE_LAB_AMENDMENT_TYPE = "Amendment type code is already exists!";
export const FETCH_LAB_AMENDMENT_TYPE_ERR_MSG = "Failed to fetch amendment types";

//Patient Preparation Master

export const ADD_PREPARATION_SUCC_MSG = "Patient preparation added successfully!";
export const UPDATE_PREPARATION_SUCC_MSG = "Patient preparation updated successfully!";
export const DUPLICATE_PREPARATION_CODE = "Preparation code already exists!";
export const FETCH_PREPARATION_ERR_MSG = "Failed to fetch patient preparations.";


//Lab Report
export const SELECT_DATE_WARN_MSG = "Please select both From Date and To Date";
export const FETCH_LAB_HISTORY_REPORT_ERR_MSG = "Error fetching lab reports. Please try again.";
export const INVALID_DATE_PICK_WARN_MSG = "From Date cannot be after To Date";

//Lab TAT Report

export const FETCH_LAB_TAT_SUMMARY_REPORT_ERR_MSG = "Error fetching summary report. Please try again.";
export const FETCH_LAB_TAT_DETAILED_REPORT_ERR_MSG = "Error fetching detail report. Please try again.";

//Result Amendment Report

export const FETCH_AMEND_REPORT_ERR_MSG = "Error fetching result amendment report. Please try again.";

//Lab Order Tracking Report

export const FUTURE_DATE_PICK_WARN_MSG = "Date cannot be in the future";
export const PAST_DATE_PICK_WARN_MSG ="To date cannot be earlier than From date";
export const SELECT_FROM_DATE_FIRST_WARN_MSG ="Please select From Date first";
export const FETCH_ORDER_TRACKING_ERR_MSG ="Failed to fetch order tracking report. Please try again.";
export const SELECT_FIELD_WARN_MSG ="Please enter either Patient Name or Mobile Number"

//PendingInvestigationReport

export const FETCH_PENDING_INVESTIGATIONS_ERR_MSG ="Failed to fetch incomplete investigations report. Please try again."


//SampleRejectionReport

export const FETCH_SAMPLE_REJECT_ERR_MSG ="Failed to fetch sample rejection report. Please try again."


//OPD Patient Appointment


//reschedule and cancel appointment
export const INVALID_MOBILE_NUMBER = "Please enter a valid 10-digit mobile number";
export const FETCH_APPOINTMENT_ERROR = "Error fetching data. Please try again.";
export const NO_APPOINTMENTS_FOUND = "No appointments found for this mobile number";
export const SESSION_NOT_AVAILABLE = "Session Not Available";
export const SESSION_NOT_AVAILABLE_TEXT = "This session is not available.";
export const PAST_DATE_WARNING = "You cannot select a past date";
export const NO_TOKENS_AVAILABLE = "No Tokens Available";
export const NO_TOKENS_AVAILABLE_TEXT = "No tokens available for the selected criteria.";
export const FETCH_TOKENS_ERROR = "Failed to fetch token availability. Please try again.";
export const NO_TIME_SLOT_SELECTED = "No Time Slot Selected";
export const SELECT_TIME_SLOT_FIRST = "Please select a time slot first.";
export const CONFIRM_RESCHEDULE_TITLE = "Confirm Reschedule";
export const RESCHEDULE_SUCCESS = "Appointment rescheduled successfully.";
export const RESCHEDULE_ERROR = "Reschedule failed.";
export const REASON_REQUIRED_TITLE = "Reason Required";
export const SELECT_CANCELLATION_REASON = "Please select a cancellation reason.";
export const CONFIRM_CANCELLATION_TITLE = "Confirm Cancellation";
export const CANCELLATION_SUCCESS = "Appointment cancelled successfully";
export const CANCELLATION_ERROR = "Cancellation failed";
export const NO_CANCELLATION_REASONS = "No cancellation reasons available. Please contact administrator.";
export const NO_VALID_TIME_SLOTS = "No time slots available for this session and date.";
export const TOKEN_FETCH_FAILED= "Failed to fetch token availability. Please try again."
// Common validation messages
export const REQUIRED_FIELD = "Please fill in all required fields";
export const INVALID_INPUT = "Please enter valid information";
export const FETCH_DATA_ERROR = "Failed to load data";

// Already exists in your file but should be in same section:
export const MISSING_MOBILE_NUMBER = "Please enter Mobile Number";
export const NO_DATA_FOUND = "No data found";
export const NO_TIME_SLOTS = "No time slots available for this session and date.";

//appointment Setup 
export const APPOINTMENT_REQUIRED_FIELDS="Please fill all required fields properly for selected time slots.";




// EntMasSeptum Master
export const FETCH_ENT_MAS_SEPTUM = "Failed to fetch records";
export const DUPLICATE_ENT_MAS_SEPTUM = "Septum Status already exists";
export const UPDATE_ENT_MAS_SEPTUM = "Record updated successfully";
export const ADD_ENT_MAS_SEPTUM = "Record added successfully";
export const FAIL_ENT_MAS_SEPTUM = "Save failed";
export const STATUS_FAIL_UPDATED ="Status update failed";


//TrimesterMaster
export const FETCH_TRIME_STER = "Failed to fetch records";
export const DUPLICATE_TRIME_STER ="trimesterValue Type already exists";
export const UPDATE_TRIME_STER = "Record updated successfully";
export const ADD_TRIME_STER = "Record added successfully";
export const FAIL_TRIME_STER = "Save failed";
export const FAIL_UPDATE_TRIME_STER ="Status update failed";


//SterilisationMaster;
export const FETCH_STERILI_SATION = "Failed to fetch records";
export const DUPLICATE_STERILI_SATION = "Sterilisation Type already exists";
export const UPDATE_STERILI_SATION = "Record updated successfully";
export const ADD_STERILI_SATION = "Record added successfully";
export const FAIL_STERILI_SATION = "Save failed";
export const FAIL_UPDATE_STERILI_SATION = "Status update failed";


//StationPresentingMaster;
export const FETCH_STATION_PRESENTING = "Failed to fetch records";
export const DUPLICATE_STATION_PRESENTING = "Station Value already exists";
export const UPDATE_STATION_PRESENTING = "Record updated successfully";
export const ADD_STATION_PRESENTING = "Record added successfully";
export const FAIL_STATION_PRESENTING = "Save failed";
export const FAIL_UPDATE_STATION_PRESENTING = "Status update failed";


//QuestionHeadingMaster

export const FETCH_QUESTION_HEADING = "Failed to fetch records";
export const DUPLICATE_QUESTION_HEADING = "Question Heading Code already exists";
export const  INVALID_QUESTION_HEADING   = "Invalid record ID";
export const UPDATE_QUESTION_HEADING = "Record updated successfully";
export const ADD_QUESTION_HEADING  = "Record added successfully";
export const  FAIL_QUESTION_HEADING = "Save failed. Please try again";


//PresentationMaster
export const FETCH_PRESENTATION = "Failed to fetch records";
export const DUPLICATE_PRESENTATION = "Presentation Value already exists";
export const UPDATE_PRESENTATION = "Record updated successfully";
export const Fail_PRESENTATION = "Save failed";
export const UPDATE_FAIL_PRESENTATION = "Status update failed";


//PelvisType;
export const FETCH_PELVISTYPE = "Failed to fetch records";
export const DUPLICATE_PELVISTYPE = "Pelvis Type already exists";
export const UPDATE_PELVISTYPE = "Record updated successfully";
export const FAIL_PELVISTYPE = "Save failed";
export const UPDATE_FAIL_PRLVISTYPE = "Status update failed";


//OpthNearVisionMaster
export const FETCH_OPTHNEAR = "Failed to fetch records";
export const DUPLICATE_OPTHNEAR = "Value already exists";
export const UPDATE_OPTHNEAR = "Record updated successfully";
export const ADD_OPTHNEAR = "Record added successfully";
export const FAIL_OPTHNEAR = "Save failed";
export const UPDATE_FAIL_OPTHNEAR = "Status update failed";

//OpthColorVisionMaster;
export const FETCH_OPTH_COLOR = "Failed to fetch records";
export const DUPLICATE_OPTH_COLOR = "Color value already exists";
export const UPDATE_OPTH_COLOR = "Record updated successfully";
export const  FAIL_OPTH_COLOR = "Save failed";
export const UPDATE_STATUS_OPTH_COLOR = "Status update failed"


//ObConsanguinityMaster
export const FETCH_OB_CONSAN = "Failed to fetch records";
export const DUPLICATE_OB_CONSAN ="ObConsanguinity already exists";
export const UPDATE_OB_CONSAN = "Status updated successfully";
export const ADD_OB_CONSAN = "Record added successfully";
export const FAIL_OB_CONSAN = "Save failed";
export const UPDATE_FAIL = "Status update failed";


//ObConceptionMaster
export const FETCH_OB_CONCEPTION = "Failed to fetch records";
export const DUPLICATE_OB_CONCEPTION = "Conception with the same code or name  already exists";
export const UPDATE_OB_CONCEPTION = "Record updated successfully";
export const ADD_OB_CONCEPTION = "Record added successfully";
export const FAIL_UPDATE_OB_CONCEPTION = "Failed to update status";
export const FAIL_SOMTHING_OB_CONCEPTION = "Something went wrong while saving the record";


//MenstrualFlowMaster;
export const FETCH_MENSTRUAL ="Failed to fetch records";
export const DUPLICATE_MENSTRUAL = "Flow Value already exists";
export const UPDATE_MENSTRUAL ="Record updated successfully";
export const ADD_MENSTRUAL = "Record added successfully";
export const FAIL_MENSTRUAL = "Save failed";
export const UPDATE_FAIL_MENSTRUAL = "Status update failed";

//MembraneStatusMaster
export const FETCH_MEMBRANE = "Failed to fetch records";
export const DUPLICATE_MEMBRANE = "Septum Status already exists";
export const UPDATE_MEMBRANE = "Record updated successfully";
export const ADD_MEMBRANE = "Record added successfully";
export const FAIL_MEMBRANE = "Save failed";
export const UPDATE_FAIL_MEMBRANE = "Status update failed";


//LiquorMaster;
export const FETCH_LIQUOR = "Failed to fetch records";
export const DUPLICATE_LIQUOR = "Liquor Value already exists";
export const UPDATE_LIQUOR = "Record updated successfully";
export const ADD_LIQUOR = "Record added successfully";
export const  FAIL_LIQUOR  = "Save failed";
export const UPDATE_FAIL_LIQUOR = "Status update failed";


//lensTypeMaster
export const FETCH_LENSTYPE = "Failed to fetch records";
export const DUPLICATE_LENSTYPE = "lestType Value already exists";
export const UPDATE_LENSTYPE = "Record updated successfully";
export const ADD_LENSTYPE = "Record added successfully";
export const FAIL_LENSTYPE = "Save failed";
export const UPDATE_FAIL_LENSTYPE = "Status update failed";

//EntMasTonsilGradeMaster;
export const FETCH_ENTMAS = "Failed to fetch records";
export const DUPLICATE_ENTMAS = "Tonsil Grade   with the same code or name already exists";
export const UPDATE_ENTMAS = "Record updated successfully";
export const ADD_ENTMAS = "New record added successfully";
export const  FAIL_ENTMAS = "Failed to save record";
export const UPDATE_FAIL_ENTMAS = "Failed to update status";



//EntMasMucosaMaster;
export const FETCH_ENTMASMUCOSA = "Failed to fetch records";
export const DUPLICATE_ENTMASMUCOSA = "Mucosa Status already exists";
export const UPDATE_ENTMASMUCOSA = "Record updated successfully";
export const ADD_ENTMASMUCOSA = "Record added successfully";
export const FAIL_ENTMASMUCOSA = "Save failed";
export const UPDATE_FAIL_ENTMASMUCOSA = "Status update failed";


//EarRinneMaster;
export const FETCH_EAR  = "Failed to fetch records";
export const DUPLICATE_EAR = "Rinne Result already exists";
export const UPDATE_EAR = "Record updated successfully";
export const ADD_EAR = "Record added successfully";
export const  FAIL_EAR = "Save failed";
export const  UPDATE_FAIL_EAR = "Status update failed";

//EarCanalMaster;
export const FETCH_EARCANAL = "Failed to fetch records";
export const DUPLICATE_EARCANAL = "Ear Canal condition already exists";
export const UPDATE_EARCANAL = "Record updated successfully";
export const ADD_EARCANAL = "Record added successfully";
export const FAIL_EARCANAL = "Save failed";
export const UPDATE_FAIL_EARCANAL = "Status update failed";

//EarTmStatusMaster;
export const FETCH_DATA_ERR_MSG = "Failed to fetch records";
export const DUPLICATE_TM_STATUS = "TM Status already exists";
export const UPDATE_TM_STATUS_SUCC_MSG = "Record updated successfully";
export const ADD_TM_STATUS_SUCC_MSG = "Record added successfully";


//CervixPosition
export const FETCH_CERVIX = "Failed to fetch records";
export const DUPLICATE_CERVIX = "cervix Position with the same code or name  already exists";
export const UPDATE_CERVIX = "Record updated successfully";
export const ADD_CERVIX = "Record added successfully";


//immunisedStatusMaster
export const DUPLICATE_IMMUNISATION = "Immunisation value already exists!";
export const UPDATE_IMMUNISATION_SUCC_MSG = "Immunisation status updated successfully!";
export const ADD_IMMUNISATION_SUCC_MSG = "Immunisation status added successfully!";

//SmearResultMaster
export const FETCH_SMEARRESULT ="Fail to fetch records";
export const DUPLICATE_SMEARRESULT = "sumerresult with the same code or name  already exists";
export const UPDATE_SMEARRESULT = "Record updated successfully";
export const ADD_SMEARRESULT = "Record added successfully";
export const FAIL_SMEARRESULT = "Save failed";
export const UPDATE_FAIL_SMEARRESULT = "Status update failed";



// //EarWeberMaster
export const FETCH_EARWEB = "Fail to fetch records";
export const DUPLICATE_EARWEB = "EarWeberMaster with the same code or name  already exists";
export const UPDATE_EARWEB = "Record updated successfully";
export const ADD_EARWEB = "Record added successfully";
export const FAIL_EARWEB = "Save failed";
export const UPDATE_FAIL_EARWEB = "Status update failed";



//BloodDonationType
export const   FETCH_BLOOD_DONATION =  "Fail to fetch records";
export const DUPLICATE_BLOOD_DONATION = "BloodDonation Value already exists";
export const UPDATE_BLOOD_DONATION =  "Record updated successfully";
export const ADD_BLOOD_DONATION = "Record added successfully";;
export const FAIL_BLOOD_DONATION = "Save failed";
export const UPDATE_FAIL_BLOOD_DONATION = "Status update failed";









//updatepatientragistration
export const UNEXPECTED_API_RESPONSE_ERR ="Unexpected API response format:";
export const FETCH_DEPARTMENT_ERROR = "Error fetching Department data:";
export const AT_LEAST_ONE_APPOINTMENT_REQUIRED = "At least one appointment row is required";
export const INVALID_MOBILE_NUMBER_MSG ="Mobile number must be exactly 10 digits.";
export const NO_PATIENTS_FOUND_MSG ="No patients found matching your criteria";
export const SEARCH_PATIENTS_ERROR_LOG = "Error searching patients:";
export const SEARCH_PATIENTS_FAILED_MSG = "Failed to search patients";
export const CAMERA_ACCESS_ERROR_LOG = "Error accessing camera:";
export const FILE_UPLOAD_ERROR_LOG ="Upload error:";
export const SOMETHING_WENT_WRONG_MSG ="Something went wrong!";
export const UPLOADED_IMAGE_URL_LOG = "Uploaded Image URL:";
export const UNABLE_TO_LOAD_PATIENT_DETAILS ="Unable to load patient details";
export const SELECT_PATIENT_TO_UPDATE_ERROR ="Please select a patient to update";
export const ADD_AT_LEAST_ONE_APPOINTMENT_ERROR = "Please add at least one valid appointment";
export const CHECK_REQUIRED_FIELDS_ERROR = "Please check all required fields";
export const FINAL_REQUEST_READY_LOG = "Final request ready for sending:";
export const PATIENT_UPDATE_WITH_APPOINTMENT_SUCCESS ="Patient updated and appointments scheduled successfully!";
export const PATIENT_UPDATE_SUCCESS ="Patient information updated successfully!";
export const PATIENT_UPDATED_SUCCESS_TITLE ="Patient Updated Successfully!";
export const BACKEND_ERROR_RESPONSE_LOG = "Backend error response:";
export const MAX_LENGTH_EXCEEDED_ERROR_TEXT = "Some data exceeds the maximum allowed length. Please check particularly long text fields.";
export const FAILED_TO_UPDATE_PATIENT_ERROR ="Failed to update patient. Please try again.";
export const NO_TOKENS_AVAILABLE_INFO ="No tokens are available for the selected session.";
export const FETCH_TOKEN_AVAILABILITY_ERROR = "Failed to fetch token availability. Please try again.";
export const SELECT_TOKEN_ERROR_LOG = "Error selecting token:";
export const SELECT_TOKEN_ERROR_TEXT = "Failed to select token. Please try again.";
export const SELECT_SPECIALITY_DOCTOR_SESSION_MSG = "Please select Speciality, Doctor, and Session first.";
export const FETCH_TOKEN_AVAILABILITY_ERROR_LOG = "Error fetching token availability.";
export const INVALID_EMAIL_FORMAT_MSG ="Invalid email format.";
export const INVALID_RESPONSE_FORMAT_LOG = "Invalid response format:";
export const FETCH_SESSIONS_ERROR_LOG = "Error fetching sessions:";
export const FETCH_CANCELLATION_REASONS_ERROR_LOG = "Error fetching cancellation reasons:";
export const NO_TOKENS_AVAILABLE_CRITERIA_MSG = "No tokens available for the selected criteria.";
export const NO_TIME_SLOTS_AVAILABLE_MSG =  "No available time slots for the selected criteria. Please try another date or session.";
export const DUPLICATE_CHECK_FAILED_LOG = "Duplicate check failed:";
export const SELECT_TIME_SLOTS_BEFORE_REGISTRATION_MSG = "Please select time slots for all appointments before registration.";
export const INCOMPLETE_FORM_TITLE = "Incomplete Form";
export const INCOMPLETE_FORM_MSG = "Please fill all required fields.";
export const PATIENT_REGISTERED_SUCCESS_TITLE ="Patient Registered Successfully!";
export const UNEXPECTED_RESPONSE_MSG = "Unexpected response received. Please try again.";
export const PATIENT_REGISTRATION_FAILED_MSG = "Something went wrong while registering the patient. Please try again.";
export const NO_TOKENS_SELECTED_SESSION_MSG = "No tokens are available for the selected session.";
export const PIN_CODE_INVALID_MSG = "Pin Code must be exactly 6 digits.";
export const MOBILE_NUMBER_INVALID_MSG ="Mobile number must be exactly 10 digits.";
export const DOB_REQUIRED_ERROR = "Date of Birth is required.";
export const AGE_FORMAT_ERROR = "Age must be in format '25Y 10M 2D'.";
export const FIRST_NAME_REQUIRED_ERROR = "First Name is required.";
export const GENDER_REQUIRED_ERROR = "Gender is required.";
export const RELATION_REQUIRED_ERROR = "Relation is required.";
export const MOBILE_REQUIRED_ERROR = "Mobile number is required.";
export const AGE_NEGATIVE_ERROR = "Age can not be negative.";
export const MISSING_TIME_SLOTS_TITLE = "Missing Time Slots.";
export const NOT_AVAILABLE_TITLE = "Not Available.";


//View DownLoad Report

export const INDENT_SAVE_TITLE = "Indent saved successfully";
export const INDENT_SAVE_FILE_NAME = "Indent Save Report";
export const INDENT_SUBMIT_TITLE = "Indent submitted successfully";
export const INDENT_SUBMIT_FILE_NAME = "Indent submit Report";



//blood bank
export const REGISTERED_DONOR="Donor registered successfully!";
export const DEFERAL_REQUIRED_MSG = "Deferral Reason is required when screen fails";
export const DEFERAL_TYPE_REQUIRED_MSG = "Deferral Type is required when screen fails";


//indentissue
export const ERROR_MESSAGES = {
  DEPARTMENT_NOT_FOUND: "Department not found. Please login again.",
};
export const ERROR_FETCHING_INDENTS = "Error fetching indents. Please try again.";
export const CONFIRM_ISSUE_INDENT = "Are you sure you want to issue this indent? This will issue the full approved quantity for all selected items.";
export const CONFIRM_INDENT_ISSUED_PRINT = "Indent issued successfully! Do you want to print report ?";
export const ERROR_ISSUING_INDENT = "Error issuing indent. Please try again.";
export const ERROR_ITEM_ID_MISSING = "Item ID is missing. Cannot fetch previous issues.";

//openingbalance
export const WARNING_SELECT_ACTION = "Please select an action (Approve or Reject)";
export const WARNING_REMARKS_MANDATORY = "Remarks are mandatory";
export const CONFIRM_OPENING_BALANCE_ACTION = (actionText) => `Are you sure you want to ${actionText} this opening balance?`;
export const CONFIRM_OPENING_BALANCE_RESULT = (action) =>
  action === "a"
    ? "Opening Balance approved successfully! Do you want to print report ?"
    : "Opening Balance rejected successfully! Do you want to print report ?";
export const ERROR_PROCESS_REQUEST_FAILED = "Failed to process the request. Please try again.";
export const CONFIRM_OPENING_BALANCE_SUBMIT_UPDATE_PRINT = (status) =>
  status === "p"
    ? "Opening Balance submitted successfully! Do you want to print report ?"
    : "Opening Balance updated successfully! Do you want to print report ?";
export const ERROR_UPDATE_ENTRIES_FAILED ="Failed to update entries!";

//openingbalanceentry
export const WARNING_DUPLICATE_BATCH_ENTRY = "Duplicate entry found for Batch No/Serial No, DOM, and DOE.";
export const WARNING_CORRECT_ERRORS ="Please correct the errors and try again.";
export const CONFIRM_SAVE_OPENING_BALANCE = "Are you sure you want to save the opening balance?";
export const SUCCESS_OPENING_BALANCE_SAVED_PRINT ="Opening Balance saved successfully! Do you want to print report ?";
export const ERROR_SAVE_DATA_FAILED = "Failed to save data. Please try again.";
export const CONFIRM_SUBMIT_OPENING_BALANCE = "Are you sure you want to submit the opening balance?";
export const SUCCESS_OPENING_BALANCE_SUBMITTED_PRINT = "Opening Balance submitted successfully! Do you want to print report ?";
export const ERROR_SUBMIT_DATA_FAILED = "Failed to submit data. Please try again.";

//pendingindent
export const ERROR_FETCH_PENDING_INDENTS = "Error fetching pending indents. Please try again.";
export const SUCCESS_INDENT_REJECTED_PRINT = "Indent rejected successfully! Do you want to print report ?";
export const SUCCESS_INDENT_APPROVED_PRINT ="Indent approved successfully! Do you want to print report ?";
export const ERROR_PROCESS_INDENT = "Error processing indent. Please try again.";

//itemrecieving
export const ERROR_DEPARTMENT_ID_NOT_FOUND = "Department ID not found. Please login again.";
export const ERROR_FETCH_INDENTS = "Error fetching indents. Please try again.";
export const CONFIRM_SAVE_INDENT_RECEIVING ="Are you sure you want to save the receiving for this indent?";
export const SUCCESS_RECEIVING_SAVED_PRINT = "Receiving saved successfully! Do you want to print report ?";
export const ERROR_SAVE_RECEIVING_FAILED = "Failed to save receiving";
export const ERROR_SAVING_RECEIVING = "Error saving receiving. Please try again.";

//viewupdate
export const WARNING_DRUG_ALREADY_ADDED = "This drug is already added in another row. Please select a different drug.";
export const ERROR_AT_LEAST_ONE_ITEM_REQUIRED = "Please add at least one item with requested quantity";
export const SUCCESS_INDENT_SAVED_PRINT ="Indent saved successfully! Do you want to print report ?";
export const SUCCESS_INDENT_SUBMITTED_PRINT = "Indent submitted successfully! Do you want to print report ?";
export const ERROR_SAVE_SUBMIT_INDENT = (backendStatus) =>
  `Error ${backendStatus === "S" ? "saving" : "submitting"} indent. Please try again.`;
        