import { COUNTRYAPI } from "./apiConfig";

export const DEPARTMENT_CODE_OPD=5;







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
export const ADD_MAIN_CHARGE_CODE_ERR_MSG="Failed to save changes: ";
export const UPDATE_MAIN_CHARGE_CODE_ERR_MSG="Failed to update status: ";


//PendingForResultEntry

export const FETCH_RESULT_VALIDATE_ERR_MSG="Failed to load pending result entries";
export const RESULT_ENTRY_WARN_MSG="Please enter at least one result before submitting";
export const FETCH_AUTO_FILL_ERR_MSG="Missing required data. Please contact administrator.";
export const RESULT_SUBMIT_SUCC_MSG="Results submitted successfully!";
export const RESULT_SUBMIT_ERR_MSG="Error submitting results";
export const INVALID_PAGE_NO_WARN_MSG="Please enter a valid page number.";


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
export const UPDATE_SAMPLE_COLLECTION_ERR_MSG="Failed to save changes:";
export const UPDATE_STATUS_SAMPLE_COLLECTION_ERR_MSG="Failed to update status:";
export const UPDATE_SAMPLE_COLLECTION_SUCC_MSG="Sample collection updated successfully!";
export const ADD_SAMPLE_COLLECTION_SUCC_MSG="New sample collection added successfully!";


//SasmpleValidation


export const FETCH_SAMPLE_VALIDATIONS_ERR_MSG="Failed to load pending validation samples";
export const VALIDATION_WARN_MSG="Please make a decision for ALL investigations. Each row must be either Accepted or Rejected.";
export const REJECT_REASON_WARN_MSG="Please provide a reason for all rejected investigations.";
export const VALIDATION_SUCC_MSG="Investigations validated successfully!";


//SubchargeCode

export const MIS_MATCH_ERR_MSG="Failed to parse response data";
export const FETCH_SUB_CHARGE_CODES_ERR_MSG="Failed to load sub-charge codes";
export const DUPLICATE_SUB_CHARGE_CODE_ERR_MSG="A sub charge code with this code already exists!";
export const UPDATE_SUB_CHARGE_CODE_SUCC_MSG="Sub charge code updated successfully!";
export const ADD_SUB_CHARGE_CODE_SUCC_MSG="New sub charge code added successfully!";
export const FAIL_TO_SAVE_CHANGES="Fail to save changes:";
export const UPDATE_STATUS_MAIN_CHARGE_CODE_ERR_MSG="Failed to update status";

//UOMMaster

export const FETCH_UOM_ERR_MSG="Failed to load UOM data";
export const DUPLICATE_UOM_ERR_MSG="UOM with the same code already exists!";
export const UPDATE_UOM_SUCC_MSG="UOM updated successfully!";
export const ADD_UOM_SUCC_MSG="New UOM added successfully!";
export const FAIL_TO_UPDATE_STS="Failed to update status"



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


