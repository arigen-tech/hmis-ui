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
import Bloodmaster from './Views/Masters/BloodMaster';
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
import InvestigationMaster from './Views/Masters/InvestigationMaster';
import InvestigationMasterResult from './Views/Masters/InvestigationMaster/investigationMasterResult';
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
import SampleMaster from './Views/Masters/SampleMaster';
import ServiceCategoryMaster from './Views/Masters/ServiceCategory';
import Statemaster from './Views/Masters/StateMaster';
import Treatmentadvicemaster from './Views/Masters/TreatmentAdviceMaster';
import Userdepartment from './Views/Masters/UserDepartment';
import GeneralMedicineWaitingList from './Views/OPD/GeneralMedicineWaitingList';
import OpdPreconsultation from './Views/OPD/OpdPreconsultation';
import OpdWaitingList from './Views/OPD/OpdWaitingList';
import LabPaymentSuccess from './Views/Payment/LabPaymentSuccess';
import OpdPaymentSuccess from './Views/Payment/OpdPaymentSuccess';
import PaymentPage from './Views/Payment/payment';
import UpdatePatientRegistration from './Views/Reception/updatePatientRegistration';
import DrugExpiry from './Views/Stores/DrugExpiryReport';

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
