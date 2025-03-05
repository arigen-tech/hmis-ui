import React, { Suspense, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import { MenuProvider } from './context/MenuContext';
import Gendermaster from './Views/Masters/Gendermaster';
import Relationmaster from './Views/Masters/Relationmaster';
import Bloodmaster from './Views/Masters/BloodMaster';
import Manageuserapplication from './Views/Usermanagement/Manageuserapplicaton';
import Addformreports from './Views/Usermanagement/AddFormReports';
import Templatemaster from './Views/Usermanagement/TemplateMaster';
import Assignapplicaton from './Views/Usermanagement/AssignApplicationToTemplate';
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
// import Drugmaster from './Views/Stores/DrugMaster';


const Layout =  React.lazy(() => import('./Views/layout/index'));
const Dashboard = React.lazy(() => import('./Views/Dashboard/index'));
const Login = React.lazy(() => import('./Views/Login/index'));
const AddDoctor = React.lazy(() => import('./Views/Doctors/AddDoctor/index'));
const ApointmentSetup = React.lazy(() => import('./Views/Admin/Apointment/ApointmentSetup'));
const DoctorRoaster = React.lazy(() => import('./Views/Admin/Apointment/DoctorRoaster'));
const PatientRegistration = React.lazy(() => import('./Views/Reception/PatientRegistration'));
const RegisterEmployee = React.lazy(() => import('./Views/Admin/Employee/EmployeeRegistrartion'));
const ViewSearchEmployee = React.lazy(() => import('./Views/Admin/Employee/ViewSearchEmployee'));



const isAuthenticated = () => {
  // Replace this with real authentication check logic
 // return Cookies.get('isAuthenticated') === "true";
 return true;
};
const PrivateRoute = ({ element, path }) => {
  return isAuthenticated() ? element : <Navigate to="/" />;
};
function App() {
  return (
    <MenuProvider>
    <Router>
      <Suspense>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/" element={<PrivateRoute element={<Layout />} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/AddDoctor" element={<AddDoctor />} />
              <Route path="/Gendermaster" element={<Gendermaster/>}/>
              <Route path="/Relationmaster" element={<Relationmaster/>} />
              <Route path="/Bloodmaster" element={<Bloodmaster/>} />
              <Route path="/maritalstatusmaster" element={<Maritalstatus/>} />
              <Route path="/manageuserapplication" element={<Manageuserapplication/>} />
              <Route path="/addformreports" element={<Addformreports/>} />
              <Route path="/templatemaster" element={<Templatemaster/>} />
              <Route path="/assignapplication" element={<Assignapplicaton/>} />
              <Route path="/rolesrights" element={<Rolesrights/>} />
              <Route path="/itemclass" element={<Itemclass/>} />
              <Route path="/itemcategory" element={<Itemcategory/>} />
              <Route path="/itemtype" element={<Itemtype/>} />
              <Route path="/Itemunit" element={<Itemunit/>} />
              {/* <Route path="/Drugmaster" element={<Drugmaster/>} /> */}
              <Route path="/ApointmentSetup" element={<ApointmentSetup />} />
              <Route path="/DoctorRoaster" element={<DoctorRoaster />} />
              <Route path="/PatientRegistration" element={<PatientRegistration />} />
              <Route path="/rolemaster" element={<Rolemaster/>} />
              <Route path="/departmenttype" element={<Departmenttype/>} />
              <Route path="/departmentmaster" element={<Departmentmaster/>} />
              <Route path="/countrymaster" element={<Countrymaster/>} />
              <Route path="/statemaster" element={<Statemaster/>} />
              <Route path="/districtmaster" element={<Districtmaster/>} />
              <Route path="/RegisterEmployee" element={<RegisterEmployee />} />
              <Route path="/ViewSearchEmployee" element={<ViewSearchEmployee />} />
 


            </Route>
        </Routes>
      </Suspense>
    </Router>
    </MenuProvider>
  );
}

export default App;
