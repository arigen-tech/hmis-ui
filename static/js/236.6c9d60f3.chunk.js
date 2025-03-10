"use strict";(self.webpackChunkhmis=self.webpackChunkhmis||[]).push([[236],{236:(e,a,s)=>{s.r(a),s.d(a,{default:()=>o});var l=s(43),r=s(472),t=s(253),n=s(533),c=s(579);const o=()=>{(0,l.useEffect)((()=>{!async function(){a(!0);try{const e=await(0,t.iq)(`${n.ue}`);200===e.status&&Array.isArray(e.response)?o(e.response):(console.error("Unexpected API response format:",e),o([]))}catch(e){console.error("Error fetching Department data:",e)}finally{a(!1)}}(),async function(){a(!0);try{const e=await(0,t.iq)(`${n.lg}`);200===e.status&&Array.isArray(e.response)?d(e.response):(console.error("Unexpected API response format:",e),d([]))}catch(e){console.error("Error fetching Department data:",e)}finally{a(!1)}}(),async function(){a(!0);try{const e=await(0,t.iq)(`${n.nd}`);200===e.status&&Array.isArray(e.response)?A(e.response):(console.error("Unexpected API response format:",e),A([]))}catch(e){console.error("Error fetching Department data:",e)}finally{a(!1)}}(),async function(){try{const e=await(0,t.iq)(`${n.Xy}`);if(200===e.status&&Array.isArray(e.response)){const a=e.response.filter((e=>"OPD"===e.departmentCode));y(a)}else console.error("Unexpected API response format:",e),y([])}catch(e){console.error("Error fetching Department data:",e)}finally{a(!1)}}()}),[]);const[e,a]=(0,l.useState)(!1),[s,o]=(0,l.useState)([]),[i,d]=(0,l.useState)([]),[m,A]=(0,l.useState)([]),[h,x]=(0,l.useState)([]),[N,p]=(0,l.useState)([]),[j,u]=(0,l.useState)([]),[b,g]=(0,l.useState)([]),[v,y]=(0,l.useState)([]),[f,C]=(0,l.useState)([]),[k,w]=(0,l.useState)({firstName:"",middleName:"",lastName:"",mobileNo:"",gender:"",relation:"",dob:"",age:"",email:"",address1:"",address2:"",country:"",state:"",district:"",city:"",pinCode:"",nokFirstName:"",nokMiddleName:"",nokLastName:"",nokEmail:"",nokMobile:"",nokAddress1:"",nokAddress2:"",nokCountry:"",nokState:"",nokDistrict:"",nokCity:"",nokPinCode:"",emergencyFirstName:"",emergencyLastName:"",emergencyMobile:"",height:"",weight:"",temperature:"",systolicBP:"",diastolicBP:"",pulse:"",bmi:"",rr:"",spo2:"",speciality:"",doctor:"",session:"",appointmentDate:""}),[E,S]=(0,l.useState)(r),[D,P]=(0,l.useState)(!1),B=(0,l.useRef)(null),U=(0,l.useRef)(null);let F=null;const K=()=>{B.current&&B.current.srcObject&&(B.current.srcObject.getTracks().forEach((e=>e.stop())),P(!1))},O=e=>{w({...k,[e.target.name]:e.target.value})},M=e=>{const{name:a,value:s}=e.target;w((e=>({...e,[a]:s})))};return(0,c.jsx)("div",{className:"body d-flex py-3",children:(0,c.jsxs)("div",{className:"container-xxl",children:[(0,c.jsx)("div",{className:"row align-items-center",children:(0,c.jsx)("div",{className:"border-0 mb-4",children:(0,c.jsx)("div",{className:"card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap",children:(0,c.jsx)("h3",{className:"fw-bold mb-0",children:"Registration of Other Patient"})})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Personal Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsx)("div",{className:"col-md-9",children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"First Name *"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"firstName",value:k.firstName,onChange:O,placeholder:"Enter First Name",required:!0})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Middle Name"}),(0,c.jsx)("input",{type:"text",value:k.middleName,name:"middleName",onChange:O,className:"form-control",placeholder:"Enter Middle Name"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Last Name"}),(0,c.jsx)("input",{type:"text",value:k.lastName,name:"lastName",onChange:O,className:"form-control",placeholder:"Enter Last Name"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"mobileNo",value:k.mobileNo,onChange:O,placeholder:"Enter Mobile Number"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Gender *"}),(0,c.jsxs)("select",{className:"form-select",name:"gender",value:k.gender,onChange:O,required:!0,children:[(0,c.jsx)("option",{value:"",children:"Select"}),s.map((e=>(0,c.jsx)("option",{value:e.id,children:e.genderName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Relation *"}),(0,c.jsxs)("select",{className:"form-select",name:"relation",value:k.relation,onChange:O,required:!0,children:[(0,c.jsx)("option",{value:"",children:"Select"}),i.map((e=>(0,c.jsx)("option",{value:e.id,children:e.relationName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"DOB *"}),(0,c.jsx)("input",{type:"date",name:"dob",className:"form-control",value:k.dob,max:(new Date).toISOString().split("T")[0],onChange:O,placeholder:"Select Date of Birth",required:!0})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Age"}),(0,c.jsx)("input",{type:"number",name:"age",className:"form-control",value:k.age,onChange:e=>{const a=e.target.value;(""===a||Number(a)>=0&&Number(a)<=130)&&w({...k,age:a})},max:"130",placeholder:"Enter Age"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Email *"}),(0,c.jsx)("input",{type:"email",name:"email",className:"form-control",value:k.email,onChange:O,placeholder:"Enter Email Address",required:!0})]})]})}),(0,c.jsx)("div",{className:"col-md-3",children:(0,c.jsx)("div",{className:"text-center",children:(0,c.jsxs)("div",{className:"card p-3 shadow",children:[D?(0,c.jsx)("video",{ref:B,autoPlay:!0,className:"d-block mx-auto",style:{width:"100%",height:"150px"}}):(0,c.jsx)("img",{src:E,alt:"Profile",className:"img-fluid border",style:{width:"100%",height:"150px"}}),(0,c.jsx)("canvas",{ref:U,style:{display:"none"}}),(0,c.jsxs)("div",{className:"mt-2",children:[(0,c.jsx)("button",{type:"button",className:"btn btn-primary me-2 mb-2",onClick:async()=>{try{P(!0),setTimeout((async()=>{F=await navigator.mediaDevices.getUserMedia({video:!0}),B.current&&(B.current.srcObject=F)}),100)}catch(e){console.error("Error accessing camera:",e)}},disabled:D,children:"Start Camera"}),D&&(0,c.jsx)("button",{type:"button",className:"btn btn-success me-2 mb-2",onClick:()=>{if(B.current&&U.current){const e=B.current,a=U.current;a.width=e.videoWidth,a.height=e.videoHeight;a.getContext("2d").drawImage(e,0,0,a.width,a.height),S(a.toDataURL("image/png")),K()}},children:"Take Photo"}),(0,c.jsx)("button",{type:"button",className:"btn btn-danger mb-2",onClick:()=>{S(r)},children:"Clear Photo"})]})]})})})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Patient Address"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 1"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"address1",value:k.address1,onChange:O,placeholder:"Enter Address 1"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 2"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"address2",value:k.address2,onChange:O,placeholder:"Enter Address 2"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Country"}),(0,c.jsxs)("select",{className:"form-select",name:"country",value:k.country,onChange:e=>{M(e),async function(e){try{const a=await(0,t.iq)(`${n.b0}${e}`);200===a.status&&Array.isArray(a.response)?x(a.response):(console.error("Unexpected API response format:",a),x([]))}catch(s){console.error("Error fetching Department data:",s)}finally{a(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Country"}),m.map((e=>(0,c.jsx)("option",{value:e.id,children:e.countryName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"State"}),(0,c.jsxs)("select",{className:"form-select",name:"state",value:k.state,onChange:e=>{M(e),async function(e){try{const a=await(0,t.iq)(`${n.Pm}${e}`);200===a.status&&Array.isArray(a.response)?u(a.response):(console.error("Unexpected API response format:",a),u([]))}catch(s){console.error("Error fetching Department data:",s)}finally{a(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select State"}),h.map((e=>(0,c.jsx)("option",{value:e.id,children:e.stateName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"District"}),(0,c.jsxs)("select",{className:"form-select",name:"district",value:k.district,onChange:e=>{M(e)},children:[(0,c.jsx)("option",{value:"",children:"Select District"}),j.map((e=>(0,c.jsx)("option",{value:e.id,children:e.districtName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"City"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"city",value:k.city,onChange:O,placeholder:"Enter City"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Pin Code"}),(0,c.jsx)("input",{type:"text",className:"form-control",name:"pinCode",value:k.pinCode,onChange:O,placeholder:"Enter Pin Code"})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"NOK Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"First Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter First Name",name:"nokFirstName",value:k.nokFirstName,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Middle Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Middle Name",name:"nokMiddleName",value:k.nokMiddleName,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Last Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Last Name",name:"nokLastName",value:k.nokLastName,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Email"}),(0,c.jsx)("input",{type:"email",className:"form-control",placeholder:"Enter Email",name:"nokEmail",value:k.nokEmail,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Mobile Number",name:"nokMobile",value:k.nokMobile,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 1"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Address 1",name:"nokAddress1",value:k.nokAddress1,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Address 2"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Address 2",name:"nokAddress2",value:k.nokAddress2,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Country"}),(0,c.jsxs)("select",{className:"form-select",name:"nokCountry",value:k.nokCountry,onChange:e=>{M(e),async function(e){try{const a=await(0,t.iq)(`${n.b0}${e}`);200===a.status&&Array.isArray(a.response)?p(a.response):(console.error("Unexpected API response format:",a),p([]))}catch(s){console.error("Error fetching Department data:",s)}finally{a(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Country"}),m.map((e=>(0,c.jsx)("option",{value:e.id,children:e.countryName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"State"}),(0,c.jsxs)("select",{className:"form-select",name:"nokState",value:k.nokState,onChange:e=>{M(e),async function(e){try{const a=await(0,t.iq)(`${n.Pm}${e}`);200===a.status&&Array.isArray(a.response)?g(a.response):(console.error("Unexpected API response format:",a),g([]))}catch(s){console.error("Error fetching Department data:",s)}finally{a(!1)}}(e.target.value)},children:[">",(0,c.jsx)("option",{value:"",children:"Select State"}),N.map((e=>(0,c.jsx)("option",{value:e.id,children:e.stateName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"District"}),(0,c.jsxs)("select",{className:"form-select",name:"nokDistrict",value:k.nokDistrict,onChange:e=>{M(e)},children:[(0,c.jsx)("option",{value:"",children:"Select District"}),b.map((e=>(0,c.jsx)("option",{value:e.id,children:e.districtName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"City"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter City",name:"nokCity",value:k.nokCity,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Pin Code"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Pin Code",name:"nokPinCode",value:k.nokPinCode,onChange:O})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Emergency Contact Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"First Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter First Name",name:"emergencyFirstName",value:k.emergencyFirstName,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Last Name"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Last Name",name:"emergencyLastName",value:k.emergencyLastName,onChange:O})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Mobile No."}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Enter Mobile Number",name:"emergencyMobile",value:k.emergencyMobile,onChange:O})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Vital Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{className:"vital",children:(0,c.jsxs)("div",{className:"row g-3 align-items-center",children:[(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Patient Height",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"number",className:"form-control",placeholder:"Height",name:"height",value:k.height,onChange:O}),(0,c.jsx)("span",{className:"input-group-text",children:"cm"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Weight",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Weight",name:"weight",value:k.weight,onChange:O}),(0,c.jsx)("span",{className:"input-group-text",children:"kg"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Temperature",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Temperature",name:"temperature",value:k.temperature,onChange:O}),(0,c.jsx)("span",{className:"input-group-text",children:"\xb0F"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["BP",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Systolic",name:"systolicBP",value:k.systolicBP,onChange:O}),(0,c.jsx)("span",{className:"input-group-text",children:"/"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Diastolic",name:"diastolicBP",value:k.diastolicBP,onChange:O}),(0,c.jsx)("span",{className:"input-group-text",children:"mmHg"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsxs)("label",{className:"form-label me-2",children:["Pulse",(0,c.jsx)("span",{className:"text-danger",children:"*"})]}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"Pulse",name:"pulse",value:k.pulse,onChange:O}),"/>",(0,c.jsx)("span",{className:"input-group-text",children:"/min"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"BMI"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"BMI",name:"bmi",value:k.bmi,onChange:O})," disabled />",(0,c.jsx)("span",{className:"input-group-text",children:"kg/m\xb2"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"RR"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"RR",name:"rr",value:k.rr,onChange:O}),"/>",(0,c.jsx)("span",{className:"input-group-text",children:"/min"})]}),(0,c.jsxs)("div",{className:"col-md-4 d-flex",children:[(0,c.jsx)("label",{className:"form-label me-2",children:"SpO2"}),(0,c.jsx)("input",{type:"text",className:"form-control",placeholder:"SpO2",name:"spo2",value:k.spo2,onChange:O}),"/>",(0,c.jsx)("span",{className:"input-group-text",children:"%"})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsxs)("div",{className:"card shadow mb-3",children:[(0,c.jsx)("div",{className:"card-header py-3 bg-light border-bottom-1",children:(0,c.jsx)("h6",{className:"mb-0 fw-bold",children:"Appointment Details"})}),(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("form",{children:(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Speciality"}),(0,c.jsxs)("select",{className:"form-select",name:"speciality",value:k.speciality,onChange:e=>{M(e),async function(e){try{const a=await(0,t.iq)(`${n.k8}${e}`);200===a.status&&Array.isArray(a.response)?C(a.response):(console.error("Unexpected API response format:",a),C([]))}catch(s){console.error("Error fetching Department data:",s)}finally{a(!1)}}(e.target.value)},children:[(0,c.jsx)("option",{value:"",children:"Select Speciality"}),v.map((e=>(0,c.jsx)("option",{value:e.id,children:e.departmentName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Doctor Name"}),(0,c.jsxs)("select",{className:"form-select",children:[(0,c.jsx)("option",{value:"",children:"Select Doctor"}),f.map((e=>(0,c.jsx)("option",{value:e.id,children:`${e.firstName} ${e.middleName?e.middleName:""} ${e.lastName?e.lastName:""}`},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Date *"}),(0,c.jsx)("input",{type:"date",name:"appointmentDate",className:"form-control",name:"appointmentDate",value:k.appointmentDate,onChange:O,min:(new Date).toISOString().split("T")[0],placeholder:"Select Date of Appointment"})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Session"}),(0,c.jsx)("select",{className:"form-select",children:(0,c.jsx)("option",{value:"",children:"Select Session"})})]})]})})})]})})}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsx)("div",{className:"card shadow mb-3",children:(0,c.jsx)("div",{className:"card-body",children:(0,c.jsx)("div",{className:"row g-3",children:(0,c.jsxs)("div",{className:"mt-4",children:[(0,c.jsx)("button",{type:"submit",className:"btn btn-primary me-2",onClick:void console.log(k),children:"Registration"}),(0,c.jsx)("button",{type:"reset",className:"btn btn-secondary",children:"Reset"})]})})})})})})]})})}},253:(e,a,s)=>{s.d(a,{MB:()=>t,iq:()=>r});const l=s(533).QU,r=async function(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};try{let s;s=localStorage.token?{Authorization:`Bearer ${localStorage.getItem("token")}`}:{Authorization:`Bearer ${sessionStorage.getItem("token")}`};const r=await fetch(`${l}${e}`,{method:"GET",headers:{"Content-Type":"application/json",...s,...a}});if(!r.ok)throw new Error(`GET request failed: ${r.status}`);return await r.json()}catch(s){throw console.error("GET Error:",s),s}},t=async function(e,a){let s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};try{let r;r=localStorage.token?{Authorization:`Bearer ${localStorage.getItem("token")}`}:{Authorization:`Bearer ${sessionStorage.getItem("token")}`};const t=await fetch(`${l}${e}`,{method:"POST",headers:{"Content-Type":"application/json",...r,...s},body:JSON.stringify(a)});if(!t.ok)throw new Error(`POST request failed: ${t.status}`);return await t.json()}catch(r){throw console.error("POST Error:",r),r}}},472:e=>{e.exports="data:image/jpeg;base64,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"}}]);
//# sourceMappingURL=236.6c9d60f3.chunk.js.map