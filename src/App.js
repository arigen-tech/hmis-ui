import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import React, { Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import ProtectedRoute from './service/ProtectedRoute';
import Approveemployee from './Views/Admin/ApproveEmployee';
import OpeningBalanceApprovalList from './Views/Dispensary/OpeningBalanceApproval';
import OpeningBalanceEntry from './Views/Dispensary/OpeningBalanceEntry';
import OpeningBalanceRegister from './Views/Dispensary/OpeningBalanceRegister';
import PhysicalStockAdjustment from './Views/Dispensary/PhysicalStockAdjustment';
import PhysicalStockAdjustmentApproval from './Views/Dispensary/PhysicalStockApproval';
import PhysicalStockTakingRegister from './Views/Dispensary/PhysicalStockRegister';
import PhysicalStockAdjustmentViewUpdate from './Views/Dispensary/PhysicalStockViewAndUpdate';
import StockStatusReport from './Views/Dispensary/StockStatusReport';
import UpdateUnitRate from './Views/Dispensary/UpdateUnitRate';
import ViewAndUpdate from './Views/Dispensary/ViewAndUpdate';
import LabBillingDetails from './Views/Laboratory/LabBillingDetails';
import Labregistration from './Views/Laboratory/LabRegistration';
import Mainchargecode from './Views/Laboratory/Mainchargecode';
import OPDBillingDetails from './Views/Laboratory/OPDBillingDetails';
import PendingForBilling from './Views/Laboratory/PendingForBilling';
import PendingForResultEntry from './Views/Laboratory/PendingForResultEntry';
import PendingForSampleCollection from './Views/Laboratory/PendingForSampleCollect';
import PendingSampleCollection from './Views/Laboratory/PendingForSampleCollection';
import ResultValidation from './Views/Laboratory/ResultValidation';
import SampleCollectionMaster from './Views/Laboratory/SampleCollectionMaster';
import SampleValidation from './Views/Laboratory/SampleValidation';
import Subchargecode from './Views/Laboratory/Subchargecode';
import UOMMaster from './Views/Laboratory/UOMMaster';
import UpdateLabRegistration from './Views/Laboratory/UpdateLabRegistration';
import UpdateResultValidation from './Views/Laboratory/UpdateResultValidation';
import BedManagement from './Views/Masters/BedManagementMaster';
import BedStatusMaster from './Views/Masters/BedStatusMaster';
import BedTypeMaster from './Views/Masters/BedTypeMaster';
import Bloodmaster from './Views/Masters/BloodMaster';
import CareLevelMaster from './Views/Masters/CareLevelMaster';
import Countrymaster from './Views/Masters/CountryMaster';
import Createusermaster from './Views/Masters/CreateUserMaster';
import Departmentmaster from './Views/Masters/DepartmentMaster';
import Departmenttype from './Views/Masters/DepartmentType';
import Districtmaster from './Views/Masters/DistrictMaster';
import Frequencymaster from './Views/Masters/Frequencymaster';
import Gendermaster from './Views/Masters/Gendermaster';
import Hospitalmaster from './Views/Masters/HospitalMaster';
import HSNMaster from './Views/Masters/HSNMaster';
import Identificationmaster from './Views/Masters/identificationMaster';
import InvestigationCategoryMaster from './Views/Masters/InvestigationCategoryMaster';
import InvestigationMaster from './Views/Masters/InvestigationMaster';
import InvestigationMasterResult from './Views/Masters/InvestigationMaster/investigationMasterResult';
import InvestigationMethodology from './Views/Masters/InvestigationMethodologyMaster';
import InvestigationPricingMaster from './Views/Masters/InvestigationPricing';
import Maritalstatus from './Views/Masters/MaritalStatusMaster';
import OpdMaster from './Views/Masters/OpdMaster';
import OPDServiceMaster from './Views/Masters/OpdService';
import PackageInvestigationMaster from './Views/Masters/PackageInvestigationMaster';
import PackageMaster from './Views/Masters/PackageMaster';
import PatientwiseBilldatails from './Views/Masters/PatientwiseBilldatails';
import RCMC from './Views/Masters/RCMC';
import Relationmaster from './Views/Masters/Relationmaster';
import Religionmaster from './Views/Masters/ReligionMaster';
import RoomCategoryMaster from './Views/Masters/RoomCategoryMaster';
import RoomMasterScreen from './Views/Masters/RoomMasterScreen';
import SampleMaster from './Views/Masters/SampleMaster';
import ServiceCategoryMaster from './Views/Masters/ServiceCategory';
import Statemaster from './Views/Masters/StateMaster';
import Treatmentadvicemaster from './Views/Masters/TreatmentAdviceMaster';
import Userdepartment from './Views/Masters/UserDepartment';
import WardCategoryMaster from './Views/Masters/WardCategoryMaster';
import WardManagementMaster from './Views/Masters/WardManagementMaster';
import GeneralMedicineWaitingList from './Views/OPD/GeneralMedicineWaitingList';
import PatientWaitingList from './Views/OPD/GeneralMedicineWaitingList/DisplayTokenPatient';
import OpdPreconsultation from './Views/OPD/OpdPreconsultation';
import OpdRRecallPatient from './Views/OPD/OpdRecallPatient';
// import OpdWaitingList from './Views/OPD/OpdWaitingList';
import LabPaymentSuccess from './Views/Payment/LabPaymentSuccess';
import OpdPaymentSuccess from './Views/Payment/OpdPaymentSuccess';
import PaymentPage from './Views/Payment/payment';
import UpdatePatientRegistration from './Views/Reception/updatePatientRegistration';
import DrugExpiry from './Views/Stores/DrugExpiryReport';
import Drugmaster from './Views/Stores/DrugMaster';
import Itemcategory from './Views/Stores/ItemCategory';
import Itemclass from './Views/Stores/ItemClass';
import ItemSection from './Views/Stores/ItemSection';
import Itemtype from './Views/Stores/ItemType';
import Itemunit from './Views/Stores/ItemUnit';
import Addformreports from './Views/Usermanagement/AddFormReports';
import Assignapplication from './Views/Usermanagement/AssignApplicationToTemplate';
import Manageuserapplication from './Views/Usermanagement/Manageuserapplicaton';
import Rolemaster from './Views/Usermanagement/RoleMaster';
import Rolesrights from './Views/Usermanagement/RolesRights';
import Templatemaster from './Views/Usermanagement/TemplateMaster';
import IndentCreation from './Views/WardPharmacy/CreateIndent';
import IndentApproval from './Views/WardPharmacy/IndentApproval';
import IndentIssue from './Views/WardPharmacy/IndentIssue';
import MedicineIssueRegister from './Views/WardPharmacy/IndentIssueReport';
import IssueReferenceReport from './Views/WardPharmacy/IssueRefReport';
import PendingIndent from './Views/WardPharmacy/PendingIndent';
import TrackIndent from './Views/WardPharmacy/TrackIndent';
import ViewUpdateIndent from './Views/WardPharmacy/View Update Indent';

import FamilyHistoryMaster from './Views/Masters/FamilyHistoryMaster';
import PatientAdmission from './Views/Masters/PatientAdmission';
import ProcedureMaster from './Views/Masters/ProcedureMaster';
import ProcedureTypeMaster from './Views/Masters/ProcedureTypeMaster';
import MealTypeMaster from './Views/Masters/MealTypeMaster';
import DietTypeMaster from './Views/Masters/DietTypeMaster';
import DietPreferenceMaster from './Views/Masters/DietPreferenceMaster';
import DietScheduleMaster from './Views/Masters/DietScheduleMaster'; 
import ItemReceivingMainScreen from './Views/WardPharmacy/ItemReceivingMainScreen';
import AdmissionStatusMaster from './Views/Masters/AdmissionStatusMaster'; 
import IntakeItemMaster from './Views/Masters/IntakeItemMaster';
import PatientacuityMaster from './Views/Masters/PatientacuityMaster';
import OutputTypeMaster from './Views/Masters/OutputTypeMaster';
import IntakeTypeMaster from './Views/Masters/IntakeTypeMaster';
import InpatientMaster from  './Views/Masters/InpatientMaster';
import SpecialityMaster from './Views/Masters/SpecialityMaster';
import ViewDownwload from './Views/Laboratory/ViewDownload';
import ItemIssueRegister from './Views/WardPharmacy/IndentIssueReport';
import BillingPolicyMaster from './Views/Masters/BillingPolicyMaster';
import DesignationMaster from './Views/Masters/DesignationMaster';
import OPDQuestionnaireMaster from './Views/Masters/OPDQuestionnaireMaster';
import OptionValueMaster from './Views/Masters/OptionValueMaster';
import QuestionHeadingMaster from './Views/Masters/QuestionHeadingMaster';
import ToothConditionMaster from './Views/Masters/ToothConditionMaster';
import SpectacleUseMaster from './Views/Masters/SpectacleUseMaster';
import EyeWearUseMaster from './Views/Masters/EyeWearUseMaster';
import BookedStatusMaster from './Views/Masters/BookedStatusMaster';
import OpthColorVisionMaster from './Views/Masters/OpthColorVisionMaster'; 
import OpthDistanceVisionMaster from './Views/Masters/OpthDistanceVisionMaster';
import OpthNearVisionMaster from './Views/Masters/OpthNearVisionMaster'; 
import PatientPreparationMaster from './Views/Masters/PatientPreparationMaster';
import LabResultAmendment from './Views/Masters/LabResultAmendment';
import ObConceptionMaster from './Views/Masters/ObConceptionMaster';
import ObConsanguinityMaster from './Views/Masters/ObConsanguinityMaster';
import PresentationMaster from './Views/Masters/PresentationMaster';
import TrimesterMaster from './Views/Masters/TrimesterMaster';
import CervixPosition from './Views/Masters/CervixPosition';
import PelvisType from './Views/Masters/PelvisType';
import StationPresentingMaster from './Views/Masters/StationPresentingMaster';
import SterilisationMaster from './Views/Masters/SterilisationMaster';
import SmearResultMaster from './Views/Masters/SmearResultMaster';
import MenstrualFlowMaster from './Views/Masters/MenstrualFlowMaster';
import MenstrualPatternMaster from './Views/Masters/MenstrualPatternMaster';
import MenarcheMaster from './Views/Masters/MenarcheMaster';
import ItemFacility from './Views/Masters/ItemFacility';
import LabReports from './Views/Laboratory/LabReports/LabReportMain';
import InvestigationRegister from './Views/Laboratory/LabReports/InvestigationRegister';
import TATReport from './Views/Laboratory/LabReports/TatReport';
import ResultAmendmentReport from './Views/Laboratory/LabReports/ResultAmendmentReport';
import EntMasTonsilGradeMaster from './Views/Masters/EntMasTonsilGrade';
import ReceivingReport from './Views/WardPharmacy/IndentReports/ReceivingReport';
import ReturnRegister from './Views/WardPharmacy/IndentReports/ReturnReport';


const PageNotFound = React.lazy(() => import('./Components/PageNotFound/PageNotFound'));




const Layout =  React.lazy(() => import('./Views/layout/index'));
const Dashboard = React.lazy(() => import('./Views/Dashboard/index'));
const Login = React.lazy(() => import('./Views/Login/index'));
const AddDoctor = React.lazy(() => import('./Views/Doctors/AddDoctor/index'));
const ApointmentSetup = React.lazy(() => import('./Views/Admin/Apointment/ApointmentSetup'));
const DoctorRoaster = React.lazy(() => import('./Views/Admin/Apointment/DoctorRoaster'));
const PatientRegistration = React.lazy(() => import('./Views/Reception/PatientRegistration'));
const RegisterEmployee = React.lazy(() => import('./Views/Admin/Employee/EmployeeRegistrartion'));
const ViewSearchEmployee = React.lazy(() => import('./Views/Admin/Employee/ViewSearchEmployee'));




function App() {
  return (
    <MenuProvider>
      <Router>
        <Suspense>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Login />} />
                <Route path="investigation-multiple-results" element={<InvestigationMasterResult/>} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="lab-payment-success" element={<LabPaymentSuccess/>} />
                <Route path="opd-payment-success" element={<OpdPaymentSuccess/>} />
                <Route path="ViewDownwload" element={<ViewDownwload/>} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="AddDoctor" element={<AddDoctor />} />
                <Route path="Gendermaster" element={<Gendermaster />} />
                <Route path="Relationmaster" element={<Relationmaster />} />
                <Route path="Bloodmaster" element={<Bloodmaster />} />
                <Route path="maritalstatusmaster" element={<Maritalstatus />} />
                <Route path="manageuserapplication" element={<Manageuserapplication />} />
                <Route path="addformreports" element={<Addformreports />} />
                <Route path="templatemaster" element={<Templatemaster />} />
                <Route path="assignapplication" element={<Assignapplication />} />
                <Route path="rolesrights" element={<Rolesrights />} />
                <Route path="itemclass" element={<Itemclass />} />
                <Route path="itemcategory" element={<Itemcategory />} />
                <Route path="itemtype" element={<Itemtype />} />
                <Route path="Itemunit" element={<Itemunit />} />
                <Route path="ApointmentSetup" element={<ApointmentSetup />} />
                <Route path="DoctorRoaster" element={<DoctorRoaster />} />
                <Route path="NewPatientAppointment" element={<PatientRegistration />} />
                <Route path="rolemaster" element={<Rolemaster />} />
                <Route path="departmenttype" element={<Departmenttype />} />
                <Route path="departmentmaster" element={<Departmentmaster />} />
                <Route path="countrymaster" element={<Countrymaster />} />
                <Route path="statemaster" element={<Statemaster />} />
                <Route path="districtmaster" element={<Districtmaster />} />
                <Route path="RegisterEmployee" element={<RegisterEmployee />} />
                <Route path="ViewSearchEmployee" element={<ViewSearchEmployee />} />
                <Route path="religionmaster" element={<Religionmaster />} />
                <Route path="hospitalmaster" element={<Hospitalmaster />} />
                <Route path="createusermaster" element={<Createusermaster />} />
                <Route path="userdepartment" element={<Userdepartment />} />
                <Route path="Identificationmaster" element={<Identificationmaster />} />
                <Route path="rcmc" element={<RCMC />} />
                <Route path="treatmentadvicemaster" element={<Treatmentadvicemaster />} />
                <Route path="approveemployee" element={<Approveemployee />} />
                <Route path="frequencymaster" element={<Frequencymaster />} />
                <Route path="opdmaster" element={<OpdMaster />} />
                <Route path="AppointmentForFollowUpPatient" element={<UpdatePatientRegistration />} />
                <Route path="mainchargecode" element={<Mainchargecode />} />
                <Route path="subchargecode" element={<Subchargecode />} />
                <Route path="labregistration" element={<Labregistration />} />
                <Route path="uommaster" element={<UOMMaster/>} />
                <Route path='samplecollectionmaster' element={<SampleCollectionMaster/>} />
                <Route path="investigationpricing" element={<InvestigationPricingMaster/>} />
                <Route path="opdpreconsultation" element={<OpdPreconsultation/>} />
                <Route path="investigationmaster" element={<InvestigationMaster/>} />
                <Route path="Drugmaster" element={<Drugmaster/>} />
                <Route path="OpeningBalanceEntry" element={<OpeningBalanceEntry/>} />
                <Route path="OpeningBalanceApprovalList" element={<OpeningBalanceApprovalList/>} />
                <Route path="OPDServiceMaster" element={<OPDServiceMaster/>} />
                <Route path="ServiceCategory" element={<ServiceCategoryMaster/>} />
                <Route path="ItemSection" element={<ItemSection/>} />
                <Route path="HSNMaster" element={<HSNMaster/>} />
                <Route path="view-and-update" element={<ViewAndUpdate/>}/>
                <Route path="PackageMaster" element={<PackageMaster/>} />
                <Route path="PackageInvestigationMaster" element={<PackageInvestigationMaster/>} />
                <Route path="PendingForBilling" element={<PendingForBilling />} />
                <Route path="OPDBillingDetails" element={<OPDBillingDetails />} />
                <Route path="LabBillingDetails" element={<LabBillingDetails/>} />
                <Route path="StockStatusReport" element={<StockStatusReport/>} />
                {/* <Route path="OPDWaitingList" element={<OpdWaitingList />} /> */}
                <Route path="UpdateLabRegistration" element={<UpdateLabRegistration/>} />
                <Route path="UpdateUnitRate" element={<UpdateUnitRate/>} />
                <Route path="DrugExpiry" element={<DrugExpiry />} />
                <Route path="PendingSampleCollection" element={<PendingSampleCollection/>} />
                <Route path="PhysicalStockAdjustment" element={<PhysicalStockAdjustment/>} />
                <Route path="PhysicalStockAdjustmentViewUpdate" element={<PhysicalStockAdjustmentViewUpdate/>}/>
                <Route path="PhysicalStockAdjustmentApproval" element={<PhysicalStockAdjustmentApproval/>} />
                <Route path="SampleValidation" element={<SampleValidation/>} />
                <Route path="PendingForSampleCollection" element={<PendingForSampleCollection/>} />
                <Route path="PendingForResultEntry" element={<PendingForResultEntry/>} />
                <Route path="PhysicalStockTakingRegister" element={<PhysicalStockTakingRegister/>} />
                <Route path="OpeningBalanceRegister" element={<OpeningBalanceRegister/>} />
                <Route path="OpdWaitingList" element={<GeneralMedicineWaitingList/>} />
                <Route path="SampleMaster" element={<SampleMaster/>} />
                <Route path="PatientwiseBilldatails" element={<PatientwiseBilldatails/>} />
                <Route path="ResultValidation" element={<ResultValidation/>} />
                <Route path="UpdateResultValidation" element={<UpdateResultValidation/>} />
                <Route path="OpdRecallPatient" element={<OpdRRecallPatient />} />
                <Route path="CreateIndent" element={<IndentCreation/>} />
                <Route path="ViewUpdateIndent" element={<ViewUpdateIndent/>} />
                <Route path="PendingIndentApproval" element={<PendingIndent/>} />
                <Route path="InvestigationMethodologyMaster" element={<InvestigationMethodology/>} />
                <Route path="TrackIndent" element={<TrackIndent/>} />
                <Route path="InvestigationCategoryMaster" element={<InvestigationCategoryMaster/>} />
                <Route path="IndentIssue" element={<IndentIssue/>} />
                <Route path="IndentApproval" element={<IndentApproval/>} />
                <Route path="TokenDisplay" element={<PatientWaitingList/>} />
                <Route path="MedicineIssueRegister" element={<ItemIssueRegister/>} />
                <Route path="IssueReferenceReport" element={<IssueReferenceReport/>} />
                <Route path="CareLevelMaster" element={<CareLevelMaster/>} />
                <Route path="WardCategoryMaster" element={<WardCategoryMaster/>} />
                <Route path="WardManagementMaster" element={<WardManagementMaster/>} />
                <Route path="RoomCategoryMaster"element={<RoomCategoryMaster/>}/>
                <Route path="RoomMasterScreen"element={<RoomMasterScreen/>}/>
                <Route path="BedManagement"element={<BedManagement/>}/>
                <Route path="BedStatusMaster"element={<BedStatusMaster/>}/>
                <Route path="FamilyHistoryMaster" element={<FamilyHistoryMaster/>} />
                <Route path="/ProcedureMaster" element={<ProcedureMaster/>} />
                <Route path="/ProcedureTypeMaster" element={<ProcedureTypeMaster/>} />
                <Route path="/BedTypeMaster" element={<BedTypeMaster/>} />
                <Route path="/PatientAdmission" element={<PatientAdmission/>} />
                <Route path="/MealTypeMaster" element={<MealTypeMaster/>} />
                <Route path="/DietTypeMaster" element={<DietTypeMaster/>} />
                <Route path="/DietPreferenceMaster" element={<DietPreferenceMaster/>} />
                <Route path="/DietScheduleMaster" element={<DietScheduleMaster/>} />
                <Route path="ItemReceivingMainScreen" element={<ItemReceivingMainScreen/>} />
                <Route path="/AdmissionStatusMaster" element={<AdmissionStatusMaster/>} />
                <Route path ="/IntakeItemMaster" element={<IntakeItemMaster/>} />
                <Route path="/PatientacuityMaster" element={<PatientacuityMaster/>} />
                <Route path="/OutputTypeMaster" element={<OutputTypeMaster/>} />
                <Route path="/IntakeTypeMaster" element={<IntakeTypeMaster/>} />
                <Route path="/InpatientMaster" element={<InpatientMaster/>} />
                <Route path="/SpecialityMaster" element={<SpecialityMaster/>} />
                <Route path="/BillingPolicyMaster" element={<BillingPolicyMaster/>} />
                <Route path="/DesignationMaster" element={<DesignationMaster/>} />
                <Route path="/OPDQuestionnaireMaster" element={<OPDQuestionnaireMaster/>} />
                <Route path="/OptionValueMaster" element={<OptionValueMaster/>} />
                <Route path="/QuestionHeadingMaster" element={<QuestionHeadingMaster/>} />
                <Route path="/ToothConditionMaster" element={<ToothConditionMaster/>} />
                <Route path="/SpectacleUseMaster" element={<SpectacleUseMaster/>} />
                <Route path="/EyeWearUseMaster" element={<EyeWearUseMaster/>} />
                <Route path="/BookedStatusMaster" element={<BookedStatusMaster/>} />
                <Route path="/OpthColorVisionMaster" element={<OpthColorVisionMaster/>} />
                <Route path="/OpthDistanceVisionMaster" element={<OpthDistanceVisionMaster/>} />
                <Route path="/OpthNearVisionMaster" element={<OpthNearVisionMaster/>} />
                <Route path="/PatientPreparationMaster" element={<PatientPreparationMaster/>} />
                <Route path="/ObConceptionMaster" element={<ObConceptionMaster/>} />
                <Route path="/ObConsanguinityMaster" element={<ObConsanguinityMaster/>} />
                <Route path="/PresentationMaster" element={<PresentationMaster/>} />
                <Route path="/TrimesterMaster" element={<TrimesterMaster/>} />
                <Route path="/CervixPosition" element={<CervixPosition/>} />
                <Route path="/PelvisType" element={<PelvisType/>} />
                <Route path="/StationPresentingMaster" element={<StationPresentingMaster/>} />
                <Route path="/SterilisationMaster" element={<SterilisationMaster/>} />
                <Route path="/SmearResultMaster" element={<SmearResultMaster/>} />
                <Route path="/MenstrualFlowMaster" element={<MenstrualFlowMaster/>} />
                <Route path="/MenstrualPatternMaster" element={<MenstrualPatternMaster/>} />
                <Route path="/MenarcheMaster" element={<MenarcheMaster/>} />
                <Route path="/LabResultAmendment" element={<LabResultAmendment/>} />
                <Route path="/ItemFacility" element={<ItemFacility/>} />
                <Route path="/LabReports" element={<LabReports/>} />
                <Route path="/InvestigationRegister" element={<InvestigationRegister/>} />
                <Route path="/TATReport" element={<TATReport/>} />
                <Route path="/ResultAmendmentReport" element={<ResultAmendmentReport/>} />
                <Route path="EntMasTonsilGrade" element={<EntMasTonsilGradeMaster />} />
                <Route path="/ReceivingReport" element={<ReceivingReport/>} />
                <Route path="/ReturnRegister" element={<ReturnRegister/>} />
                <Route path="*" element={<PageNotFound />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </MenuProvider>
  );
}


export default App;