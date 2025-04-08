"use strict";(self.webpackChunkhmis=self.webpackChunkhmis||[]).push([[709],{709:(e,s,t)=>{t.r(s),t.d(s,{default:()=>d});var a=t(43),r=t(533),n=t(253),o=t(351),l=t(128),c=t(579);const d=()=>{const[e,s]=(0,a.useState)(""),[t,d]=(0,a.useState)(""),[i,m]=(0,a.useState)(""),[h,u]=(0,a.useState)([]),[p,x]=(0,a.useState)([]),[f,b]=(0,a.useState)(!1),[N,g]=(0,a.useState)(null),[j,y]=(0,a.useState)(""),[v,w]=(0,a.useState)(""),[D,Y]=(0,a.useState)(new Date),[I,S]=(0,a.useState)(null);localStorage.setItem("token","eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhYmNAZ21haWwuY29tIiwiaG9zcGl0YWxJZCI6MSwiZW1wbG95ZWVJZCI6MSwiZXhwIjoxNzQ0Mjc5MDc0LCJ1c2VySWQiOjQsImlhdCI6MTc0MzY3NDI3NH0._lLEDlJG85GljjCscLe7l7YHyNAFg0h25JSseZvfvTMA1-7BDwGX7vPRzemg-yHyYm8jAUHREJ_leEst1x20lA");const k=function(e){w({message:e,type:arguments.length>1&&void 0!==arguments[1]?arguments[1]:"info",onClose:()=>{w(null)}})};(0,a.useEffect)((()=>{$()}),[]),(0,a.useEffect)((()=>{e&&C()}),[e]),(0,a.useEffect)((()=>{e&&i&&A()}),[e,t,i,p]);const $=async()=>{b(!0);try{const e=await(0,n.iq)(`${r.Xw}/getAllDepartments/1`);200===e.status&&Array.isArray(e.response)?u(e.response):(console.error("Unexpected API response format:",e),u([]))}catch(e){console.error("Error fetching Department data:",e)}finally{b(!1)}},C=async()=>{b(!0);try{const s=await(0,n.iq)(`${r.WX}/doctorBySpeciality/${e}`);200===s.status&&Array.isArray(s.response)?x(s.response):(console.error("Unexpected API response format:",s),x([]))}catch(s){console.error("Error fetching Doctor data:",s)}finally{b(!1)}},A=async()=>{if(e&&i)try{b(!0);const s=new URLSearchParams({deptId:e,rosterDate:i});t&&s.append("doctorId",t);const a=`${r._}/rosterfindWithDays?${s.toString()}`,o=await(0,n.iq)(a),l=(()=>{if(!i)return[];const e=new Date(i),s=new Date;s.setHours(0,0,0,0);const a=[];for(let t=0;t<7;t++){const r=new Date(e);if(r.setDate(e.getDate()+t),r.setHours(0,0,0,0),r>s){const e=`${r.getDate().toString().padStart(2,"0")}/${(r.getMonth()+1).toString().padStart(2,"0")}/${r.getFullYear()}`;a.push(e)}}let r=[];if(t){const e=p.find((e=>e.userId===parseInt(t)));e&&(r=[{name:`${e.firstName} ${e.lastName}`,id:e.userId}])}else r=p.map((e=>({name:`${e.firstName} ${e.lastName}`,id:e.userId})));return r.flatMap((e=>a.map((s=>({dates:s,rosterVale:"YY",doctorId:e.id,id:null,fromDatabase:!1})))))})();let c=[];if(o.response&&o.response.dates){const e=o.response.dates.map((e=>({...e,fromDatabase:!0,modified:!1}))),s=new Map;e.forEach((e=>{const t=`${e.doctorId}-${e.dates}`;s.set(t,e)})),c=l.map((e=>{const t=`${e.doctorId}-${e.dates}`;return s.get(t)||e})),e.forEach((e=>{const s=`${e.doctorId}-${e.dates}`;c.some((e=>`${e.doctorId}-${e.dates}`===s))||c.push(e)}))}else c=l;const d={departmentId:parseInt(e),fromDate:i,dates:c},m=JSON.parse(JSON.stringify(d));S(m),g(d)}catch(s){console.error("Error preparing roster data:",s),k("Error preparing roster data","error")}finally{b(!1)}},E=(e,s,t)=>{if(M(s)<D)return;const a=N.dates.map((a=>{if(a.doctorId===e&&a.dates===s){let r;switch(a.rosterVale){case"YY":r="morning"===t?"NY":"YN";break;case"YN":r="morning"===t?"NN":"YY";break;case"NY":r="morning"===t?"YY":"NN";break;case"NN":r="morning"===t?"YN":"NY";break;default:r="YY"}const n=null===I||void 0===I?void 0:I.dates.find((t=>t.doctorId===e&&t.dates===s)),o=!!n&&n.rosterVale!==r;return{...a,rosterVale:r,modified:a.fromDatabase&&o}}return a}));g((e=>({...e,dates:a})))},M=e=>{const[s,t,a]=e.split("/");return new Date(`${a}-${t}-${s}`)},J=e=>{if(!e)return"";const[s,t,a]=e.split("/");return new Date(`${a}-${t}-${s}`).toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"})},R=()=>{s(""),d(""),m(""),g(null),S(null)},U=e=>e.fromDatabase&&e.modified?{backgroundColor:"#55bf70",borderColor:"#55bf70"}:e.fromDatabase?{backgroundColor:"#e35d6a",borderColor:"#e35d6a"}:{};return(0,c.jsx)("div",{className:"body d-flex py-3",children:(0,c.jsxs)("div",{className:"container-xxl",children:[(0,c.jsx)("div",{className:"row align-items-center",children:(0,c.jsx)("div",{className:"border-0 mb-4",children:(0,c.jsx)("div",{className:"card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap",children:(0,c.jsx)("h3",{className:"fw-bold mb-0",children:"Doctor Roster"})})})}),v&&(0,c.jsx)(l.A,{message:v.message,type:v.type,onClose:v.onClose}),f&&(0,c.jsx)(o.A,{}),(0,c.jsx)("div",{className:"row mb-3",children:(0,c.jsx)("div",{className:"col-sm-12",children:(0,c.jsx)("div",{className:"card shadow mb-3",children:(0,c.jsx)("div",{className:"card-body",children:(0,c.jsxs)("form",{onSubmit:async s=>{if(s.preventDefault(),e&&i){b(!0);try{const e=`${r._}/roster`,s={...N,dates:N.dates.map((e=>{let{fromDatabase:s,modified:t,...a}=e;return a}))},t=await(0,n.MB)(e,s);200===t.status?(k("Roster saved successfully!","success"),R(),A()):k(`Error saving roster: ${t.message||"Unknown error"}`,"error")}catch(t){console.error("Error saving roster:",t),k("An error occurred while saving the roster","error")}finally{b(!1)}}else k("Please select Department and From Date","error")},children:[(0,c.jsxs)("div",{className:"row g-3",children:[(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Department *"}),(0,c.jsxs)("select",{className:"form-select",value:e,onChange:e=>s(parseInt(e.target.value)),required:!0,children:[(0,c.jsx)("option",{value:"",disabled:!0,children:"Select"}),h.map((e=>(0,c.jsx)("option",{value:e.id,children:e.departmentName},e.id)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"Doctor (Optional)"}),(0,c.jsxs)("select",{className:"form-select",value:t,onChange:e=>d(e.target.value),disabled:!e,children:[(0,c.jsx)("option",{value:"",children:"All Doctors"}),p.map((e=>(0,c.jsxs)("option",{value:e.userId,children:[e.firstName," ",e.lastName]},e.userId)))]})]}),(0,c.jsxs)("div",{className:"col-md-4",children:[(0,c.jsx)("label",{className:"form-label",children:"From Date *"}),(0,c.jsx)("input",{type:"date",className:"form-control",value:i,onChange:e=>m(e.target.value),required:!0})]}),N&&(()=>{if(!N||!N.dates||0===N.dates.length)return null;const e=new Map;N.dates.forEach((s=>{e.has(s.doctorId)||e.set(s.doctorId,[]),e.get(s.doctorId).push(s)}));const s=[...new Set(N.dates.map((e=>e.dates)))].sort(((e,s)=>M(e)-M(s)));return(0,c.jsxs)("div",{className:"table-responsive",children:[(0,c.jsxs)("table",{className:"table table-bordered",children:[(0,c.jsx)("thead",{children:(0,c.jsxs)("tr",{children:[(0,c.jsx)("th",{children:"Doctor"}),s.map((e=>(0,c.jsxs)("th",{className:"text-center",children:[J(e),(0,c.jsx)("div",{className:"small text-muted",children:M(e).toLocaleDateString("en-US",{weekday:"short"})})]},e)))]})}),(0,c.jsx)("tbody",{children:[...e.entries()].map((e=>{let[t,a]=e;const r=p.find((e=>e.userId===t)),n=r?`${r.firstName} ${r.lastName}`:"Unknown Doctor";return(0,c.jsxs)("tr",{children:[(0,c.jsx)("td",{children:n}),s.map((e=>{const s=a.find((s=>s.dates===e));if(!s)return(0,c.jsx)("td",{className:"text-center text-muted",children:"N/A"},e);const r=M(e)<D;const n=s.rosterVale,o="YY"===n||"YN"===n?U(s):{},l="YY"===n||"NY"===n?U(s):{};return(0,c.jsxs)("td",{className:"text-center",children:[(0,c.jsxs)("div",{className:"form-check form-check-inline",children:[(0,c.jsx)("input",{type:"checkbox",className:"form-check-input",checked:"YY"===n||"YN"===n,onChange:()=>E(t,e,"morning"),disabled:r,style:o}),(0,c.jsx)("label",{className:"form-check-label "+(r?"text-muted":""),children:"M"})]}),(0,c.jsxs)("div",{className:"form-check form-check-inline",children:[(0,c.jsx)("input",{type:"checkbox",className:"form-check-input",checked:"YY"===n||"NY"===n,onChange:()=>E(t,e,"evening"),disabled:r,style:l}),(0,c.jsx)("label",{className:"form-check-label "+(r?"text-muted":""),children:"E"})]})]},e)}))]},t)}))})]}),(0,c.jsxs)("div",{className:"mt-2",children:[(0,c.jsxs)("div",{className:"d-flex align-items-center mb-2",children:[(0,c.jsx)("div",{style:{width:"20px",height:"20px",backgroundColor:"#e35d6a",marginRight:"10px"}}),(0,c.jsx)("span",{children:"Data from database"})]}),(0,c.jsxs)("div",{className:"d-flex align-items-center mb-2",children:[(0,c.jsx)("div",{style:{width:"20px",height:"20px",backgroundColor:"#55bf70",marginRight:"10px"}}),(0,c.jsx)("span",{children:"Modified database data"})]}),(0,c.jsxs)("div",{className:"d-flex align-items-center",children:[(0,c.jsx)("div",{style:{width:"20px",height:"20px",backgroundColor:"#0d6efd",marginRight:"10px"}}),(0,c.jsx)("span",{children:"New data"})]})]})]})})()]}),(0,c.jsxs)("div",{className:"mt-4",children:[(0,c.jsx)("button",{type:"submit",className:"btn btn-primary me-2",disabled:f||!N,children:f?"Processing...":"Save Roster"}),(0,c.jsx)("button",{type:"button",className:"btn btn-secondary",onClick:R,disabled:f,children:"Reset"})]})]})})})})})]})})}}}]);
//# sourceMappingURL=709.a778f7f9.chunk.js.map