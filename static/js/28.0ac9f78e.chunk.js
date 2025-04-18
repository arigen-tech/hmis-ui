"use strict";(self.webpackChunkhmis=self.webpackChunkhmis||[]).push([[28],{28:(e,a,s)=>{s.r(a),s.d(a,{default:()=>d});var l=s(43),i=s(472),t=s(253),r=s(64),n=s.n(r),o=s(533);var c=s(579);const d=()=>{(0,l.useEffect)((()=>{!async function(){r(!0);try{const e=await(0,t.iq)(`${o.ue}/1`);200===e.status&&Array.isArray(e.response)?m(e.response):(console.error("Unexpected API response format:",e),m([]))}catch(e){console.error("Error fetching Department data:",e)}finally{r(!1)}}(),async function(){r(!0);try{const e=await(0,t.iq)(`${o.lg}/1`);200===e.status&&Array.isArray(e.response)?x(e.response):(console.error("Unexpected API response format:",e),x([]))}catch(e){console.error("Error fetching Department data:",e)}finally{r(!1)}}(),async function(){r(!0);try{const e=await(0,t.iq)(`${o.nd}/1`);200===e.status&&Array.isArray(e.response)?v(e.response):(console.error("Unexpected API response format:",e),v([]))}catch(e){console.error("Error fetching Department data:",e)}finally{r(!1)}}(),async function(){try{const e=await(0,t.iq)(`${o.Xy}/1`);if(200===e.status&&Array.isArray(e.response)){const a=e.response.filter((e=>1===e.departmentTypeId));A(a)}else console.error("Unexpected API response format:",e),A([])}catch(e){console.error("Error fetching Department data:",e)}finally{r(!1)}}(),async function(){try{const e=await(0,t.iq)(`${o.Ql}1`);200===e.status&&Array.isArray(e.response)?E(e.response):(console.error("Unexpected API response format:",e),E([]))}catch(e){console.error("Error fetching Department data:",e)}finally{r(!1)}}()}),[]);const[e,a]=(0,l.useState)({}),[s,r]=(0,l.useState)(!1),[d,m]=(0,l.useState)([]),[h,p]=(0,l.useState)(""),[N,x]=(0,l.useState)([]),[u,v]=(0,l.useState)([]),[b,g]=(0,l.useState)([]),[j,f]=(0,l.useState)([]),[y,k]=(0,l.useState)([]),[C,w]=(0,l.useState)([]),[S,A]=(0,l.useState)([]),[D,P]=(0,l.useState)([]),[I,E]=(0,l.useState)([]),[F,M]=(0,l.useState)({imageurl:void 0,firstName:void 0,middleName:void 0,lastName:void 0,mobileNo:void 0,gender:void 0,relation:void 0,dob:void 0,age:void 0,email:void 0,address1:void 0,address2:void 0,country:void 0,state:void 0,district:void 0,city:void 0,pinCode:void 0,nokFirstName:void 0,nokMiddleName:void 0,nokLastName:void 0,nokEmail:void 0,nokMobile:void 0,nokAddress1:void 0,nokAddress2:void 0,nokCountry:void 0,nokState:void 0,nokDistrict:void 0,nokCity:void 0,nokPinCode:void 0,emergencyFirstName:void 0,emergencyLastName:void 0,emergencyMobile:void 0,height:void 0,weight:void 0,temperature:void 0,systolicBP:void 0,diastolicBP:void 0,pulse:void 0,bmi:void 0,rr:void 0,spo2:void 0,speciality:void 0,doctor:void 0,session:void 0,appointmentDate:void 0,maritalStatus:void 0,religion:void 0,emergencyRelationId:void 0,nokRelation:void 0,idealWeight:void 0,varation:void 0,department:void 0,selDoctorId:void 0,selSession:void 0}),[$,B]=(0,l.useState)(i),[U,R]=(0,l.useState)(!1),q=(0,l.useRef)(null),L=(0,l.useRef)(null);let O=null;const T=()=>{q.current&&q.current.srcObject&&(q.current.srcObject.getTracks().forEach((e=>e.stop())),R(!1))},H=e=>{n().fire({title:"Confirm Upload",text:"Do you want to upload this photo?",imageUrl:e,imageWidth:200,imageHeight:150,showCancelButton:!0,confirmButtonText:"Yes, Upload",cancelButtonText:"Cancel"}).then((a=>{a.isConfirmed&&W(e)}))},W=async e=>{try{const a=await fetch(e).then((e=>e.blob())),s=new FormData;s.append("file",a,"photo.png");const l=await fetch(`${o.QU}${o.OI}`,{method:"POST",body:s}),i=await l.json();if(200===l.status&&i.response){const e=i.response;p(e),console.log("Uploaded Image URL:",e),n().fire("Success!","Image uploaded successfully!","success")}else n().fire("Error!","Failed to upload image!","error")}catch(a){console.error("Upload error:",a),n().fire("Error!","Something went wrong!","error")}},V=e=>{const{name:s,value:l}=e.target,i={...F,[s]:l};M(i);let t="";"firstName"!==s||l.trim()||(t="First Name is required."),"gender"!==s||l||(t="Gender is required."),"relation"!==s||l||(t="Relation is required."),"dob"!==s||l||(t="Date of Birth is required."),"email"===s&&(l.trim()?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l)||(t="Invalid email format."):t="Email is required."),"mobileNo"===s&&(l.trim()?/^\d{10}$/.test(l)||(t="Mobile number must be exactly 10 digits."):t="Mobile number is required."),"pinCode"===s&&(/^\d{6}$/.test(l)||(t="Pin Code must be exactly 6 digits.")),"age"===s&&""!==l&&(isNaN(l)||Number(l)<0)&&(t="Age can not be negative.");["height","weight","temperature","systolicBP","diastolicBP","pulse","bmi","rr","spo2"].includes(s)&&""!==l&&(isNaN(l)||Number(l)<0)&&(t=`${s.charAt(0).toUpperCase()+s.slice(1)} must be a non-negative number.`),a((e=>{const a={...e};return t?a[s]=t:delete a[s],a}))},Y=e=>{const{name:a,value:s}=e.target;M((e=>({...e,[a]:s})))};const J=async()=>{if((()=>{const e=["firstName","gender","relation","dob","email","mobileNo"];let s=!0;const l={};return e.forEach((e=>{F[e]&&""!==F[e].toString().trim()||(l[e]=`${e.charAt(0).toUpperCase()+e.slice(1)} is required.`,s=!1)})),F.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(F.email)&&(l.email="Invalid email format.",s=!1),F.mobileNo&&!/^\d{10}$/.test(F.mobileNo)&&(l.mobileNo="Mobile number must be exactly 10 digits.",s=!1),F.pinCode&&!/^\d{6}$/.test(F.pinCode)&&(l.pinCode="Pin Code must be exactly 6 digits.",s=!1),["height","weight","temperature","systolicBP","diastolicBP","pulse","bmi","rr","spo2","age"].forEach((a=>{const i=F[a];""!==i&&(isNaN(i)||Number(i)<0)&&(l[a]=`${a.charAt(0).toUpperCase()+a.slice(1)} must be a non-negative number.`,s=!1),("age"===a||e.includes(a))&&Number(i)<=0&&(l[a]=`${a.charAt(0).toUpperCase()+a.slice(1)} must be greater than 0.`,s=!1)})),a(l),s})()){const a={patient:{id:0,uhidNo:"",patientStatus:"",regDate:new Date(Date.now()).toJSON().split(".")[0].split("T")[0],lastChgBy:"",patientHospitalId:0,patientFn:F.firstName,patientMn:F.middleName,patientLn:F.lastName,patientDob:F.dob,patientAge:F.age,patientGenderId:F.gender,patientEmailId:F.email,patientMobileNumber:F.mobileNo,patientImage:h,fileName:"string",patientRelationId:F.relation,patientMaritalStatusId:F.maritalStatus,patientReligionId:F.religion,patientAddress1:F.address1,patientAddress2:F.address2,patientCity:F.city,patientPincode:F.pinCode,patientDistrictId:F.district,patientStateId:F.district,patientCountryId:F.country,pincode:"string",emerFn:F.emergencyFirstName,emerLn:F.emergencyLastName,emerRelationId:F.emergencyRelationId,emerMobile:F.emergencyMobile,nokFn:F.nokFirstName,nokLn:F.nokLastName,nokEmail:F.nokEmail,nokMobileNumber:F.nokMobile,nokAddress1:F.nokAddress1,nokAddress2:F.nokAddress2,nokCity:F.nokCity,nokDistrictId:F.nokDistrict,nokStateId:F.nokState,nokCountryId:F.nokCountry,nokPincode:F.nokPinCode,nokRelationId:F.nokRelation},opdPatientDetail:{height:F.height,idealWeight:F.idealWeight,weight:F.weight,pulse:F.pulse,temperature:F.temperature,opdDate:F.appointmentDate,rr:F.rr,bmi:F.bmi,spo2:F.spo2,varation:F.varation,bpSystolic:F.systolicBP,bpDiastolic:F.diastolicBP,icdDiag:"string",workingDiag:"string",followUpFlag:"string",followUpDays:0,pastMedicalHistory:"string",presentComplaints:"string",familyHistory:"string",treatmentAdvice:"string",sosFlag:"string",recmmdMedAdvice:"string",medicineFlag:"s",labFlag:"s",radioFlag:"s",referralFlag:"s",mlcFlag:"s",policeStation:"string",policeName:"string",patientId:0,visitId:0,departmentId:0,hospitalId:0,doctorId:0,lastChgBy:"string"},visit:{id:0,tokenNo:0,visitStatus:"string",visitDate:new Date(Date.now()).toJSON(),departmentId:Number(F.speciality),doctorId:Number(F.selDoctorId),doctorName:"",hospitalId:1,sessionId:Number(F.selSession),billingStatus:"string",priority:0,patientId:0,iniDoctorId:0}};console.log(new Date(Date.now()).toJSON());try{const e=await(0,t.MB)(`${o.Aq}`,a);200===e.status&&Array.isArray(e.response)?n().fire("Patient Registration Successful"):(console.error("Unexpected API response format:",e),P([]))}catch(e){console.error("Error:",e)}}};return(0,c.jsx)("div",{className:"body d-flex py-3",children:(0,c.jsxs)("div",{className:"container-xxl",children:[(0,c.jsx)("div",{className:"row align-items-center",children:(0,c.jsx)("div",{className:"border-0 mb-4",children:(0,c.jsx)("div",{className:"card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap",children:(0,c.jsx)("h3",{className:"fw-bold mb-0",children:"Registration of Other Patient"})})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Personal Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsx)("div",{className:"col-md-9",children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"firstName",children:"First Name *"}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.firstName?"is-invalid":""),id:"firstName",name:"firstName",value:F.firstName,onChange:V,placeholder:"Enter First Name"}),e.firstName&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.firstName})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"middleName",children:"Middle Name"}),(0,c.jsx)("input",{type:"text",id:"middleName",value:F.middleName,name:"middleName",onChange:V,className:"form-control",placeholder:"Enter Middle Name"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"lastName",children:"Last Name"}),(0,c.jsx)("input",{type:"text",id:"lastName",value:F.lastName,name:"lastName",onChange:V,className:"form-control",placeholder:"Enter Last Name"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"mobileNo",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",id:"mobileNo",className:"form-control "+(e.mobileNo?"is-invalid":""),name:"mobileNo",value:F.mobileNo,onChange:V,placeholder:"Enter Mobile Number"}),e.mobileNo&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.mobileNo})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"gender",children:"Gender *"}),(0,c.jsxs)("select",{className:"form-select "+(e.gender?"is-invalid":""),id:"gender",name:"gender",value:F.gender,onChange:V,children:[(0,c.jsx)("option",{value:"",children:"Select"}),d.map((e=>(0,c.jsx)("option",{value:e.id,children:e.genderName},e.id)))]}),e.gender&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.gender})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"relation",children:"Relation *"}),(0,c.jsxs)("select",{className:"form-select "+(e.relation?"is-invalid":""),id:"relation",name:"relation",value:F.relation,onChange:V,children:[(0,c.jsx)("option",{value:"",children:"Select"}),N.map((e=>(0,c.jsx)("option",{value:e.id,children:e.relationName},e.id)))]}),e.relation&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.relation})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"dob",children:"DOB *"}),(0,c.jsx)("input",{type:"date",id:"dob",name:"dob",className:"form-control "+(e.dob?"is-invalid":""),value:F.dob,max:(new Date).toISOString().split("T")[0],onChange:V,placeholder:"Select Date of Birth"}),e.dob&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.dob})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"age",children:"Age"}),(0,c.jsx)("input",{type:"number",id:"age",name:"age",className:"form-control "+(e.age?"is-invalid":""),value:F.age,onChange:V,placeholder:"Enter Age"}),e.age&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.age})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",htmlFor:"email",children:"Email *"}),(0,c.jsx)("input",{type:"email",id:"email",name:"email",className:"form-control "+(e.email?"is-invalid":""),value:F.email,onChange:V,placeholder:"Enter Email Address"}),e.email&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.email})]})]})}),(0,c.jsx)("div",{className:"col-md-3",children:(0,c.jsx)("div",{className:"text-center",children:(0,c.jsxs)("div",{className:"card p-3 shadow",children:[U?(0,c.jsx)("video",{ref:q,autoPlay:!0,className:"d-block mx-auto",style:{width:"100%",height:"150px"}}):(0,c.jsx)("img",{src:$||"/default-profile.png",alt:"Profile",className:"img-fluid border",style:{width:"100%",height:"150px"}}),(0,c.jsx)("canvas",{ref:L,width:"300",height:"150",style:{display:"none"}}),(0,c.jsxs)("div",{className:"mt-2",children:[(0,c.jsx)("button",{type:"button",className:"btn btn-primary me-2 mb-2",onClick:async()=>{try{R(!0),setTimeout((async()=>{O=await navigator.mediaDevices.getUserMedia({video:!0}),q.current&&(q.current.srcObject=O)}),100)}catch(e){console.error("Error accessing camera:",e)}},disabled:U,children:"Start Camera"}),U&&(0,c.jsx)("button",{type:"button",className:"btn btn-success me-2 mb-2",onClick:()=>{if(q.current&&L.current){const e=q.current,a=L.current;a.width=e.videoWidth,a.height=e.videoHeight;a.getContext("2d").drawImage(e,0,0,a.width,a.height);const s=a.toDataURL("image/png");B(s),T(),H(s)}},children:"Take Photo"}),(0,c.jsx)("button",{type:"button",className:"btn btn-danger mb-2",onClick:()=>{B(i)},children:"Clear Photo"})]})]})})})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Patient Address"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 1"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"address1",value:F.address1,onChange:V,placeholder:"Enter Address 1"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 2"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"address2",value:F.address2,onChange:V,placeholder:"Enter Address 2"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Country"}),(0,c.jsxs)("select",{className:"form-select",name:"country",value:F.country,onChange:e=>{Y(e),async function(e){try{const a=await(0,t.iq)(`${o.b0}${e}`);200===a.status&&Array.isArray(a.response)?g(a.response):(console.error("Unexpected API response format:",a),g([]))}catch(a){console.error("Error fetching Department data:",a)}finally{r(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Country"}),u.map((e=>(0,c.jsx)("option",{value:e.id,children:e.countryName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"State"}),(0,c.jsxs)("select",{className:"form-select",name:"state",value:F.state,onChange:e=>{Y(e),async function(e){try{const a=await(0,t.iq)(`${o.Pm}${e}`);200===a.status&&Array.isArray(a.response)?k(a.response):(console.error("Unexpected API response format:",a),k([]))}catch(a){console.error("Error fetching Department data:",a)}finally{r(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select State"}),b.map((e=>(0,c.jsx)("option",{value:e.id,children:e.stateName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"District"}),(0,c.jsxs)("select",{className:"form-select",name:"district",value:F.district,onChange:e=>{Y(e)},children:[(0,c.jsx)("option",{value:"",children:"Select District"}),y.map((e=>(0,c.jsx)("option",{value:e.id,children:e.districtName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"City"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"city",value:F.city,onChange:V,placeholder:"Enter City"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Pin Code"}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.pinCode?"is-invalid":""),name:"pinCode",value:F.pinCode,onChange:V,placeholder:"Enter Pin Code"}),e.pinCode&&(0,c.jsx)("div",{className:"invalid-feedback",children:e.pinCode})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"NOK Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"First Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter First Name",name:"nokFirstName",value:F.nokFirstName,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Middle Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Middle Name",name:"nokMiddleName",value:F.nokMiddleName,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Last Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Last Name",name:"nokLastName",value:F.nokLastName,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Email"}),(0,c.jsx)("input",{type:"email",className:"form-control",placeholder:"Enter Email",name:"nokEmail",value:F.nokEmail,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Mobile Number",name:"nokMobile",value:F.nokMobile,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 1"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Address 1",name:"nokAddress1",value:F.nokAddress1,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 2"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Address 2",name:"nokAddress2",value:F.nokAddress2,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Country"}),(0,c.jsxs)("select",{className:"form-select",name:"nokCountry",value:F.nokCountry,onChange:e=>{Y(e),async function(e){try{const a=await(0,t.iq)(`${o.b0}${e}`);200===a.status&&Array.isArray(a.response)?f(a.response):(console.error("Unexpected API response format:",a),f([]))}catch(a){console.error("Error fetching Department data:",a)}finally{r(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Country"}),u.map((e=>(0,c.jsx)("option",{value:e.id,children:e.countryName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"State"}),(0,c.jsxs)("select",{className:"form-select",name:"nokState",value:F.nokState,onChange:e=>{Y(e),async function(e){try{const a=await(0,t.iq)(`${o.Pm}${e}`);200===a.status&&Array.isArray(a.response)?w(a.response):(console.error("Unexpected API response format:",a),w([]))}catch(a){console.error("Error fetching Department data:",a)}finally{r(!1)}}(e.target.value)},children:[">",(0,c.jsx)("option",{value:"",children:"Select State"}),j.map((e=>(0,c.jsx)("option",{value:e.id,children:e.stateName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"District"}),(0,c.jsxs)("select",{className:"form-select",name:"nokDistrict",value:F.nokDistrict,onChange:e=>{Y(e)},children:[(0,c.jsx)("option",{value:"",children:"Select District"}),C.map((e=>(0,c.jsx)("option",{value:e.id,children:e.districtName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"City"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter City",name:"nokCity",value:F.nokCity,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Pin Code"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Pin Code",name:"nokPinCode",value:F.nokPinCode,onChange:V})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Emergency Contact Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"First Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter First Name",name:"emergencyFirstName",value:F.emergencyFirstName,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Last Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Last Name",name:"emergencyLastName",value:F.emergencyLastName,onChange:V})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Mobile Number",name:"emergencyMobile",value:F.emergencyMobile,onChange:V})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Vital Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{className:"vital",children:(0,c.jsxs)("div",{className:"row g-3 align-items-center",children:[(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Patient Height",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"number",className:"form-control "+(e.height?"is-invalid":""),placeholder:"Height",name:"height",value:F.height,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"cm"}),e.height&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.height})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Weight",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.weight?"is-invalid":""),placeholder:"Weight",name:"weight",value:F.weight,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"kg"}),e.weight&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.weight})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Temperature",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.temperature?"is-invalid":""),placeholder:"Temperature",name:"temperature",value:F.temperature,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"\xb0F"}),e.temperature&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.temperature})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["BP",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.systolicBP?"is-invalid":""),placeholder:"Systolic",name:"systolicBP",value:F.systolicBP,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"/"}),e.systolicBP&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.systolicBP}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.diastolicBP?"is-invalid":""),placeholder:"Diastolic",name:"diastolicBP",value:F.diastolicBP,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"mmHg"}),e.diastolicBP&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.diastolicBP})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Pulse",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.pulse?"is-invalid":""),placeholder:"Pulse",name:"pulse",value:F.pulse,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"/min"}),e.pulse&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.pulse})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"BMI"}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.bmi?"is-invalid":""),placeholder:"BMI",name:"bmi",value:F.bmi,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"kg/m\xb2"}),e.bmi&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.bmi})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"RR"}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.rr?"is-invalid":""),placeholder:"RR",name:"rr",value:F.rr,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"/min"}),e.rr&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.rr})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"SpO2"}),(0,c.jsx)("input",{type:"text",className:"form-control "+(e.spo2?"is-invalid":""),placeholder:"SpO2",name:"spo2",value:F.spo2,onChange:V}),(0,c.jsx)("span",{className:"input-group-text",children:"%"}),e.height&&(0,c.jsx)("div",{className:"invalid-feedback d-block",children:e.spo2})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Appointment Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Speciality"}),(0,c.jsxs)("select",{className:"form-select",name:"speciality",value:F.speciality,onChange:e=>{Y(e),async function(e){try{const a=await(0,t.iq)(`${o.k8}${e}`);200===a.status&&Array.isArray(a.response)?P(a.response):(console.error("Unexpected API response format:",a),P([]))}catch(a){console.error("Error fetching Department data:",a)}finally{r(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Speciality"}),S.map((e=>(0,c.jsx)("option",{value:e.id,children:e.departmentName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Doctor Name"}),(0,c.jsxs)("select",{className:"form-select",name:"selDoctorId",value:F.selDoctorId,onChange:e=>{Y(e),async function(e){if(console.log(e.target.value),""!=F.speciality&&e){console.log(e);let a=Date.now(),s=new Date(a).toJSON().split(".")[0].split("T")[0];console.log(s);const l=await(0,t.iq)(`${o.iy}deptId=${F.speciality}&doctorId=${e.target.value}&rosterDate=${s}`);if(200==l.status){console.log(l.response[0].rosterVal);let e=[{key:0,value:""},{key:1,value:""}];"YY"==l.response[0].rosterVal?e=[{key:0,value:"Morning"},{key:1,value:"Evening"}]:"NY"==l.response[0].rosterVal?e=[{key:0,value:"Evening"}]:"YN"==l.response[0].rosterVal&&(e=[{key:0,value:"Morning"}])}else n().fire(l.message)}}(e)},children:[(0,c.jsx)("option",{value:"",children:"Select Doctor"}),D.map((e=>(0,c.jsx)("option",{value:e.userId,children:`${e.firstName} ${e.middleName?e.middleName:""} ${e.lastName?e.lastName:""}`},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Session"}),(0,c.jsxs)("select",{className:"form-select",name:"selSession",value:F.selSession,onChange:e=>{Y(e)},children:[(0,c.jsx)("option",{value:"",children:"Select Session"}),I.map((e=>(0,c.jsx)("option",{value:e.id,children:e.sessionName},e.id)))]})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsx)("div",{className:"card shadow mb-3",children:(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("div",{className:"row g-3",children:(0,c.jsxs)("div",{className:"mt-4",children:[(0,c.jsx)("button",{type:"submit",className:"btn btn-primary me-2",onClick:function(){console.log(F),J()},children:"Registration"}),(0,c.jsx)("button",{type:"reset",className:"btn btn-secondary",children:"Reset"})]})})})})})})]})})}}}]);
//# sourceMappingURL=28.0ac9f78e.chunk.js.map