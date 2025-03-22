"use strict";(self.webpackChunkhmis=self.webpackChunkhmis||[]).push([[322],{322:(e,a,t)=>{t.r(a),t.d(a,{default:()=>d});var s=t(43),n=t(533),l=t(253),r=t(128),o=t(351),i=t(579);const d=()=>{const[e,a]=(0,s.useState)(""),[t,d]=(0,s.useState)(""),[c,m]=(0,s.useState)(""),[u,p]=(0,s.useState)(""),[h,y]=(0,s.useState)(""),[x,f]=(0,s.useState)(""),[v,N]=(0,s.useState)(""),[j,g]=(0,s.useState)(""),[b,k]=(0,s.useState)([]),[T,I]=(0,s.useState)([]),[O,S]=(0,s.useState)([]),[D,C]=(0,s.useState)([]),[A,$]=(0,s.useState)(!1),[w,q]=(0,s.useState)(null),[E,P]=(0,s.useState)({}),U=function(e){d({message:e,type:arguments.length>1&&void 0!==arguments[1]?arguments[1]:"info",onClose:()=>{d(null)}})},J=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],M=J.reduce(((e,a)=>(e[a]={startToken:"",totalInterval:"",totalToken:"",totalOnlineToken:"",maxNoOfDays:"",minNoOfDays:""},e)),{}),[F,W]=(0,s.useState)(M),[B,X]=(0,s.useState)(M);(0,s.useEffect)((()=>{Y(),R()}),[]),(0,s.useEffect)((()=>{c&&L()}),[c]);const Y=async()=>{$(!0);try{const e=await(0,l.iq)(`${n.Xw}/getAllDepartments/1`);if(200===e.status&&Array.isArray(e.response)){const a=e.response.filter((e=>"OPD"===e.departmentTypeName));k(e.response),I(a)}else console.error("Unexpected API response format:",e),k([]),I([])}catch(e){console.error("Error fetching Department data:",e)}finally{$(!1)}},L=async()=>{$(!0);try{const e=await(0,l.iq)(`${n.WX}/doctorBySpeciality/${c}`);200===e.status&&Array.isArray(e.response)?S(e.response):(console.error("Unexpected API response format:",e),S([]))}catch(e){console.error("Error fetching Doctor data:",e)}finally{$(!1)}},R=async()=>{$(!0);try{const e=await(0,l.iq)(`${n.fW}/getAllOpdSessions/1`);200===e.status&&Array.isArray(e.response)?C(e.response):(console.error("Unexpected API response format:",e),C([]))}catch(e){console.error("Error fetching Session data:",e)}finally{$(!1)}};(0,s.useEffect)((()=>{c&&u&&h&&z()}),[c,u,h]);const z=async()=>{try{$(!0),P({});const e=`${n.Yc}/find?deptId=${c}&doctorId=${u}&sessionId=${h}`,a=await(0,l.iq)(e);if(200===(null===a||void 0===a?void 0:a.status)&&null!==a&&void 0!==a&&a.response){const{startTime:e,endTime:t,timeTaken:s,days:n}=a.response;if(q(a.response),f(e),N(t),g(s),Array.isArray(n)){const e={...M};n.forEach((a=>{const t=a.days||a.day;t&&e[t]&&(e[t]={startToken:null!==a.startToken?a.startToken:"",totalInterval:null!==a.totalInterval?a.totalInterval:"",totalToken:null!==a.totalToken?a.totalToken:"",totalOnlineToken:null!==a.totalOnlineToken?a.totalOnlineToken:"",maxNoOfDays:null!==a.maxNoOfDays?a.maxNoOfDays:"",minNoOfDays:null!==a.minNoOfDays?a.minNoOfDays:""})})),W(e),X(JSON.parse(JSON.stringify(e)))}}else q(null),W(M),f(""),N(""),g(""),X(M)}catch(e){console.error("Error fetching appointment data:",e)}finally{$(!1)}},G=(e,a,t)=>{W({...F,[e]:{...F[e],[a]:t}});if(t!==B[e][a])P({...E,[`${e}-${a}`]:!0});else{const t={...E};delete t[`${e}-${a}`],P(t)}},H=(e,a)=>!0===E[`${e}-${a}`],K=()=>{m(""),p(""),y(""),f(""),N(""),g(""),W(M),q(null),P({}),X(M)};return(0,i.jsx)(i.Fragment,{children:(0,i.jsx)("div",{className:"body d-flex py-3",children:(0,i.jsxs)("div",{className:"container-xxl",children:[t&&(0,i.jsx)(r.A,{message:t.message,type:t.type,onClose:t.onClose}),A&&(0,i.jsx)(o.A,{}),(0,i.jsx)("div",{className:"row align-items-center",children:(0,i.jsx)("div",{className:"border-0 mb-4",children:(0,i.jsx)("div",{className:"card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap",children:(0,i.jsx)("h3",{className:"fw-bold mb-0",children:"Appointment Setup"})})})}),(0,i.jsx)("div",{className:"row mb-3",children:(0,i.jsx)("div",{className:"col-sm-12",children:(0,i.jsx)("div",{className:"card shadow mb-3",children:(0,i.jsx)("div",{className:"card-body",children:(0,i.jsxs)("form",{onSubmit:async e=>{e.preventDefault();const a={departmentId:c,doctorId:u,sessionId:h,startTime:x,endTime:v,timeTaken:j,days:J.map((e=>{var a;const t=null===w||void 0===w||null===(a=w.days)||void 0===a?void 0:a.find((a=>(a.days||a.day)===e));return{id:w&&(null===t||void 0===t?void 0:t.id)||null,day:e,tokenStartNo:""!==F[e].startToken?parseInt(F[e].startToken):null,tokenInterval:""!==F[e].totalInterval?parseInt(F[e].totalInterval):null,totalToken:""!==F[e].totalToken?parseInt(F[e].totalToken):null,totalOnlineToken:""!==F[e].totalOnlineToken?parseInt(F[e].totalOnlineToken):null,maxNoOfDay:""!==F[e].maxNoOfDays?parseInt(F[e].maxNoOfDays):null,minNoOfday:""!==F[e].minNoOfDays?parseInt(F[e].minNoOfDays):null}}))};try{$(!0);const e=await(0,l.MB)(`${n.Yc}/setup`,a);200===e.status?(U(e.message||`Appointment ${w?"updated":"created"} successfully!`,"success"),X(JSON.parse(JSON.stringify(F))),P({}),K()):U(`Failed to ${w?"update":"create"} Appointment. Please try again.`,"error")}catch(t){U("An error occurred: "+(t.message||"Unknown error"),"error")}finally{$(!1)}},children:[(0,i.jsxs)("div",{className:"row g-3",children:[(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Department *"}),(0,i.jsxs)("select",{className:"form-select",value:c,onChange:e=>m(parseInt(e.target.value)),required:!0,children:[(0,i.jsx)("option",{value:"",disabled:!0,children:"Select"}),T.map((e=>(0,i.jsx)("option",{value:e.id,children:e.departmentName},e.id)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Doctor List *"}),(0,i.jsxs)("select",{className:"form-select",value:u,onChange:e=>p(parseInt(e.target.value)),required:!0,disabled:!c,children:[(0,i.jsx)("option",{value:"",children:"Select Doctor"}),O.map((e=>(0,i.jsxs)("option",{value:e.userId,children:[e.firstName," ",e.lastName]},e.userId)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Session *"}),(0,i.jsxs)("select",{className:"form-select",value:h,onChange:e=>y(parseInt(e.target.value)),required:!0,children:[(0,i.jsx)("option",{value:"",disabled:!0,children:"Select"}),D.map((e=>(0,i.jsx)("option",{value:e.id,children:e.sessionName},e.id)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Start Time *"}),(0,i.jsx)("input",{type:"time",className:"form-control",value:x,onChange:e=>f(e.target.value),required:!0})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"End Time *"}),(0,i.jsx)("input",{type:"time",className:"form-control",value:v,onChange:e=>N(e.target.value),required:!0})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Time Taken (minutes) *"}),(0,i.jsx)("input",{type:"number",className:"form-control",value:j,onChange:e=>g(parseInt(e.target.value)),required:!0})]}),(0,i.jsx)("div",{className:"col-md-12",children:(0,i.jsxs)("table",{className:"table table-bordered",children:[(0,i.jsx)("thead",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{children:"Days"}),(0,i.jsx)("th",{children:"Token Start No."}),(0,i.jsx)("th",{children:"Token Interval"}),(0,i.jsx)("th",{children:"Total Token"}),(0,i.jsx)("th",{children:"Total Online Token"}),(0,i.jsx)("th",{children:"Max No. of Days"}),(0,i.jsx)("th",{children:"Min No. of Days"})]})}),(0,i.jsx)("tbody",{children:J.map((e=>(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:e}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"startToken")?"#d4edda":""},value:F[e].startToken,onChange:a=>G(e,"startToken",""===a.target.value?"":parseInt(a.target.value))})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"totalInterval")?"#d4edda":""},value:F[e].totalInterval,onChange:a=>G(e,"totalInterval",""===a.target.value?"":parseInt(a.target.value))})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"totalToken")?"#d4edda":""},value:F[e].totalToken,onChange:a=>G(e,"totalToken",""===a.target.value?"":parseInt(a.target.value)||0)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"totalOnlineToken")?"#d4edda":""},value:F[e].totalOnlineToken,onChange:a=>G(e,"totalOnlineToken",""===a.target.value?"":parseInt(a.target.value)||0)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"maxNoOfDays")?"#d4edda":""},value:F[e].maxNoOfDays,onChange:a=>G(e,"maxNoOfDays",""===a.target.value?"":parseInt(a.target.value)||0)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"text",className:"form-control",style:{backgroundColor:H(e,"minNoOfDays")?"#d4edda":""},value:F[e].minNoOfDays,onChange:a=>G(e,"minNoOfDays",""===a.target.value?"":parseInt(a.target.value)||0)})})]},e)))})]})})]}),(0,i.jsxs)("div",{className:"mt-4",children:[(0,i.jsx)("button",{type:"submit",className:"btn btn-primary me-2",disabled:A,children:A?"Processing...":w?"Update Appointment":"Create Appointment"}),(0,i.jsx)("button",{type:"button",className:"btn btn-secondary",onClick:K,children:"Reset"})]})]})})})})})]})})})}}}]);
//# sourceMappingURL=322.4da0f4e3.chunk.js.map