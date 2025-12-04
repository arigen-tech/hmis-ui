import React, { Suspense, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import { MenuProvider } from './context/MenuContext';
import Gendermaster from './Views/Masters/Gendermaster';
import Relationmaster from './Views/Masters/Relationmaster';
import Bloodmaster from './Views/Masters/BloodMaster';
import Manageuserapplication from './Views/Usermanagement/Manageuserapplicaton';
import Addformreports from './Views/Usermanagement/AddFormReports';
import Templatemaster from './Views/Usermanagement/TemplateMaster';
import Assignapplication from './Views/Usermanagement/AssignApplicationToTemplate';
import Rolesrights from './Views/Usermanagement/RolesRights';
import Itemclass from './Views/Stores/ItemClass';
import Itemcategory from './Views/Stores/ItemCategory';
import Itemtype from './Views/Stores/ItemType';
import Itemunit from './Views/Stores/ItemUnit';
import Rolemaster from './Views/Usermanagement/RoleMaster';
import Departmenttype from './Views/Masters/DepartmentType';
import Departmentmaster from './Views/Masters/DepartmentMaster';
import Maritalstatus from './Views/Masters/MaritalStatusMaster';
import Countrymaster from './Views/Masters/CountryMaster';
import Statemaster from './Views/Masters/StateMaster';
import Districtmaster from './Views/Masters/DistrictMaster';
import Religionmaster from './Views/Masters/ReligionMaster';
import Hospitalmaster from './Views/Masters/HospitalMaster';
import Createusermaster from './Views/Masters/CreateUserMaster';
import Userdepartment from './Views/Masters/UserDepartment';
import Identificationmaster from './Views/Masters/identificationMaster';
import RCMC from './Views/Masters/RCMC';
import Treatmentadvicemaster from './Views/Masters/TreatmentAdviceMaster';
import Approveemployee from './Views/Admin/ApproveEmployee';
import Frequencymaster from './Views/Masters/Frequencymaster';
import OpdMaster from './Views/Masters/OpdMaster';
import UpdatePatientRegistration from './Views/Reception/updatePatientRegistration';
import Mainchargecode from './Views/Laboratory/Mainchargecode';
import Subchargecode from './Views/Laboratory/Subchargecode';
import Labregistration from './Views/Laboratory/LabRegistration';
import ProtectedRoute from './service/ProtectedRoute';
import SampleCollectionMaster from './Views/Laboratory/SampleCollectionMaster';
import UOMMaster from './Views/Laboratory/UOMMaster';
import InvestigationPricingMaster from './Views/Masters/InvestigationPricing';
import OpdPreconsultation from './Views/OPD/OpdPreconsultation';
import InvestigationMaster from './Views/Masters/InvestigationMaster';
import InvestigationMasterResult from './Views/Masters/InvestigationMaster/investigationMasterResult';
import Drugmaster from './Views/Stores/DrugMaster';
import OpeningBalanceEntry from './Views/Dispensary/OpeningBalanceEntry';
import OpeningBalanceApprovalList from './Views/Dispensary/OpeningBalanceApproval';
import OPDServiceMaster from './Views/Masters/OpdService';
import ServiceCategoryMaster from './Views/Masters/ServiceCategory';
import ItemSection from './Views/Stores/ItemSection';
import HSNMaster from './Views/Masters/HSNMaster';
import ViewAndUpdate from './Views/Dispensary/ViewAndUpdate';
import PaymentPage from './Views/Payment/payment';
import LabPaymentSuccess from './Views/Payment/LabPaymentSuccess';
import PackageMaster from './Views/Masters/PackageMaster';
import PackageInvestigationMaster from './Views/Masters/PackageInvestigationMaster';
import PendingForBilling from './Views/Laboratory/PendingForBilling';
import OPDBillingDetails from './Views/Laboratory/OPDBillingDetails';
import LabBillingDetails from './Views/Laboratory/LabBillingDetails';
import StockStatusReport from './Views/Dispensary/StockStatusReport';
import OpdWaitingList from './Views/OPD/OpdWaitingList';
import UpdateLabRegistration from './Views/Laboratory/UpdateLabRegistration';
import UpdateUnitRate from './Views/Dispensary/UpdateUnitRate';
import DrugExpiry from './Views/Stores/DrugExpiryReport';
import PendingSampleCollection from './Views/Laboratory/PendingForSampleCollection';
import PhysicalStockAdjustment from './Views/Dispensary/PhysicalStockAdjustment';
import PhysicalStockAdjustmentViewUpdate from './Views/Dispensary/PhysicalStockViewAndUpdate';
import PhysicalStockAdjustmentApproval from './Views/Dispensary/PhysicalStockApproval';
import SampleValidation from './Views/Laboratory/SampleValidation';
import PendingForSampleCollection from './Views/Laboratory/PendingForSampleCollect';
import PendingForResultEntry from './Views/Laboratory/PendingForResultEntry';
import PhysicalStockTakingRegister from './Views/Dispensary/PhysicalStockRegister';
import OpeningBalanceRegister from './Views/Dispensary/OpeningBalanceRegister';
import GeneralMedicineWaitingList from './Views/OPD/GeneralMedicineWaitingList';
import SampleMaster from './Views/Masters/SampleMaster';
import PatientwiseBilldatails from './Views/Masters/PatientwiseBilldatails';
import ResultValidation from './Views/Laboratory/ResultValidation';
import UpdateResultValidation from './Views/Laboratory/UpdateResultValidation';
import OpdRRecallPatient from './Views/OPD/OpdRecallPatient';
import OpdPaymentSuccess from './Views/Payment/OpdPaymentSuccess';
import IndentCreation from './Views/WardPharmacy/CreateIndent';
import ViewUpdateIndent from './Views/WardPharmacy/View Update Indent';
import PendingIndent from './Views/WardPharmacy/PendingIndent';
import InvestigationMethodology from './Views/Masters/InvestigationMethodologyMaster';
import TrackIndent from './Views/WardPharmacy/TrackIndent';
import InvestigationCategoryMaster from './Views/Masters/InvestigationCategoryMaster';
import IndentIssue from './Views/WardPharmacy/IndentIssue';
import IndentApproval from './Views/WardPharmacy/IndentApproval';
import MedicineIssueRegister from './Views/WardPharmacy/IndentIssueReport';
import IssueReferenceReport from './Views/WardPharmacy/IssueRefReport';
import PatientWaitingList from './Views/OPD/GeneralMedicineWaitingList/DisplayTokenPatient';
import CareLevelMaster from './Views/Masters/CareLevelMaster';
import WardCategoryMaster from './Views/Masters/WardCategoryMaster';
import WardManagementMaster from './Views/Masters/WardManagementMaster';
import RoomCategoryMaster from'./Views/Masters/RoomCategoryMaster'; 
import RoomMasterScreen from'./Views/Masters/RoomMasterScreen';
import BedManagement from'./Views/Masters/BedManagementMaster';
import BedStatusMaster from'./Views/Masters/BedStatusMaster';

import FamilyHistoryMaster from './Views/Masters/FamilyHistoryMaster';
import ProcedureMaster from './Views/Masters/ProcedureMaster';
import ProcedureTypeMaster from './Views/Masters/ProcedureTypeMaster';


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
                <Route path="PatientRegistration" element={<PatientRegistration />} />
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
                <Route path="updatepatientregistration" element={<UpdatePatientRegistration />} />
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
                <Route path="OPDWaitingList" element={<OpdWaitingList />} />
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
                <Route path="GeneralMedicineWaitingList" element={<GeneralMedicineWaitingList/>} />
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
                                <Route path="PatientWaitingList" element={<PatientWaitingList/>} />
                <Route path="MedicineIssueRegister" element={<MedicineIssueRegister/>} />
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