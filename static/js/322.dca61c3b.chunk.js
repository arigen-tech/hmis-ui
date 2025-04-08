"use strict";(self.webpackChunkhmis=self.webpackChunkhmis||[]).push([[322],{322:(e,t,a)=>{a.r(t),a.d(t,{default:()=>c});var s=a(43),n=a(533),l=a(253),r=a(128),o=a(351),i=a(579);const c=()=>{const[e,t]=(0,s.useState)(""),[a,c]=(0,s.useState)(""),[d,m]=(0,s.useState)(""),[u,p]=(0,s.useState)(""),[y,h]=(0,s.useState)(""),[f,x]=(0,s.useState)(""),[N,v]=(0,s.useState)(""),[j,b]=(0,s.useState)(""),[g,k]=(0,s.useState)([]),[T,O]=(0,s.useState)([]),[S,I]=(0,s.useState)([]),[D,C]=(0,s.useState)([]),[A,w]=(0,s.useState)(!1),[$,q]=(0,s.useState)(null),[E,M]=(0,s.useState)({}),[P,U]=(0,s.useState)(!1),J=function(e){c({message:e,type:arguments.length>1&&void 0!==arguments[1]?arguments[1]:"info",onClose:()=>{c(null)}})},F=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],W=F.reduce(((e,t)=>{const a="Sunday"===t||"Saturday"===t;return e[t]={startToken:a?"0":"",totalInterval:a?"0":"",totalToken:a?"0":"",totalOnlineToken:a?"0":"",maxNoOfDays:a?"0":"30",minNoOfDays:a?"0":"1"},e}),{}),[B,R]=(0,s.useState)(W),[X,Y]=(0,s.useState)(W);(0,s.useEffect)((()=>{L(),G()}),[]),(0,s.useEffect)((()=>{d&&z()}),[d]);const L=async()=>{w(!0);try{const e=await(0,l.iq)(`${n.Xw}/getAllDepartments/1`);if(200===e.status&&Array.isArray(e.response)){const t=e.response.filter((e=>"OPD"===e.departmentTypeName));k(e.response),O(t)}else console.error("Unexpected API response format:",e),k([]),O([])}catch(e){console.error("Error fetching Department data:",e)}finally{w(!1)}},z=async()=>{w(!0);try{const e=await(0,l.iq)(`${n.WX}/doctorBySpeciality/${d}`);200===e.status&&Array.isArray(e.response)?I(e.response):(console.error("Unexpected API response format:",e),I([]))}catch(e){console.error("Error fetching Doctor data:",e)}finally{w(!1)}},G=async()=>{w(!0);try{const e=await(0,l.iq)(`${n.fW}/getAllOpdSessions/1`);200===e.status&&Array.isArray(e.response)?C(e.response):(console.error("Unexpected API response format:",e),C([]))}catch(e){console.error("Error fetching Session data:",e)}finally{w(!1)}};(0,s.useEffect)((()=>{d&&u&&y&&H()}),[d,u,y]);const H=async()=>{try{w(!0),M({});const e=`${n.Yc}/find?deptId=${d}&doctorId=${u}&sessionId=${y}`,t=await(0,l.iq)(e);if(200===(null===t||void 0===t?void 0:t.status)&&null!==t&&void 0!==t&&t.response){const{startTime:e,endTime:a,timeTaken:s,days:n}=t.response;if(q(t.response),x(e),v(a),b(s),U(!0),Array.isArray(n)){const e={...W};n.forEach((t=>{const a=t.days||t.day;a&&e[a]&&(e[a]={startToken:null!==t.startToken?String(t.startToken):"",totalInterval:null!==t.totalInterval?String(t.totalInterval):"",totalToken:null!==t.totalToken?String(t.totalToken):"",totalOnlineToken:null!==t.totalOnlineToken?String(t.totalOnlineToken):"",maxNoOfDays:null!==t.maxNoOfDays?String(t.maxNoOfDays):"30",minNoOfDays:null!==t.minNoOfDays?String(t.minNoOfDays):"1"})})),R(e),Y(JSON.parse(JSON.stringify(e)))}}else q(null),R(W),x(""),v(""),b(""),Y(W),U(!1)}catch(e){console.error("Error fetching appointment data:",e),U(!1)}finally{w(!1)}},K=(e,t,a)=>{const s=0===a||a?String(a):"",n={...B[e]};if(n[t]=s,"totalToken"!==t||"0"!==s&&""!==s||(n.startToken="0",n.totalInterval="0",n.totalOnlineToken="0"),"totalInterval"===t&&("0"===s||""===s)||"totalToken"===t&&("0"===n.totalToken||""===n.totalToken)?n.totalOnlineToken="0":"totalInterval"!==t&&"totalToken"!==t||(n.totalOnlineToken=((e,t)=>{if(!e||!t||0===parseInt(t))return"0";const a=parseInt(e)/parseInt(t);return String(Math.ceil(a))})(n.totalToken,n.totalInterval)),"minNoOfDays"===t){(parseInt(s)||0)>(parseInt(n.maxNoOfDays)||30)&&(n.minNoOfDays=n.maxNoOfDays)}if("maxNoOfDays"===t){const e=parseInt(s)||30;e<(parseInt(n.minNoOfDays)||1)&&(n.minNoOfDays=String(e))}if(R({...B,[e]:n}),P){if(s!==X[e][t])M({...E,[`${e}-${t}`]:!0});else{const a={...E};delete a[`${e}-${t}`],M(a)}}},Q=(e,t)=>P&&!0===E[`${e}-${t}`],V=()=>{m(""),p(""),h(""),x(""),v(""),b(""),R(W),q(null),M({}),Y(W),U(!1)};return(0,i.jsx)(i.Fragment,{children:(0,i.jsx)("div",{className:"body d-flex py-3",children:(0,i.jsxs)("div",{className:"container-xxl",children:[a&&(0,i.jsx)(r.A,{message:a.message,type:a.type,onClose:a.onClose}),A&&(0,i.jsx)(o.A,{}),(0,i.jsx)("div",{className:"row align-items-center",children:(0,i.jsx)("div",{className:"border-0 mb-4",children:(0,i.jsx)("div",{className:"card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap",children:(0,i.jsx)("h3",{className:"fw-bold mb-0",children:"Appointment Setup"})})})}),(0,i.jsx)("div",{className:"row mb-3",children:(0,i.jsx)("div",{className:"col-sm-12",children:(0,i.jsx)("div",{className:"card shadow mb-3",children:(0,i.jsx)("div",{className:"card-body",children:(0,i.jsxs)("form",{onSubmit:async e=>{e.preventDefault();const t={departmentId:d,doctorId:u,sessionId:y,startTime:f,endTime:N,timeTaken:j,days:F.map((e=>{var t;const a=null===$||void 0===$||null===(t=$.days)||void 0===t?void 0:t.find((t=>(t.days||t.day)===e));return{id:$&&(null===a||void 0===a?void 0:a.id)||null,day:e,tokenStartNo:""!==B[e].startToken?parseInt(B[e].startToken):null,tokenInterval:""!==B[e].totalInterval?parseInt(B[e].totalInterval):null,totalToken:""!==B[e].totalToken?parseInt(B[e].totalToken):null,totalOnlineToken:""!==B[e].totalOnlineToken?parseInt(B[e].totalOnlineToken):null,maxNoOfDay:""!==B[e].maxNoOfDays?parseInt(B[e].maxNoOfDays):null,minNoOfday:""!==B[e].minNoOfDays?parseInt(B[e].minNoOfDays):null}}))};try{w(!0);const e=await(0,l.MB)(`${n.Yc}/setup`,t);200===e.status?(J(e.message||`Appointment ${$?"updated":"created"} successfully!`,"success"),Y(JSON.parse(JSON.stringify(B))),M({}),V()):J(`Failed to ${$?"update":"create"} Appointment. Please try again.`,"error")}catch(a){J("An error occurred: "+(a.message||"Unknown error"),"error")}finally{w(!1)}},children:[(0,i.jsxs)("div",{className:"row g-3",children:[(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Department *"}),(0,i.jsxs)("select",{className:"form-select",value:d,onChange:e=>m(parseInt(e.target.value)),required:!0,children:[(0,i.jsx)("option",{value:"",disabled:!0,children:"Select"}),T.map((e=>(0,i.jsx)("option",{value:e.id,children:e.departmentName},e.id)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Doctor List *"}),(0,i.jsxs)("select",{className:"form-select",value:u,onChange:e=>p(parseInt(e.target.value)),required:!0,disabled:!d,children:[(0,i.jsx)("option",{value:"",children:"Select Doctor"}),S.map((e=>(0,i.jsxs)("option",{value:e.userId,children:[e.firstName," ",e.lastName]},e.userId)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Session *"}),(0,i.jsxs)("select",{className:"form-select",value:y,onChange:e=>h(parseInt(e.target.value)),required:!0,children:[(0,i.jsx)("option",{value:"",disabled:!0,children:"Select"}),D.map((e=>(0,i.jsx)("option",{value:e.id,children:e.sessionName},e.id)))]})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Start Time *"}),(0,i.jsx)("input",{type:"time",className:"form-control",value:f,onChange:e=>x(e.target.value),required:!0})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"End Time *"}),(0,i.jsx)("input",{type:"time",className:"form-control",value:N,onChange:e=>v(e.target.value),required:!0})]}),(0,i.jsxs)("div",{className:"col-md-4",children:[(0,i.jsx)("label",{className:"form-label",children:"Time Taken (minutes) *"}),(0,i.jsx)("input",{type:"number",className:"form-control",value:j,onChange:e=>b(e.target.value?parseInt(e.target.value):""),required:!0})]}),(0,i.jsx)("div",{className:"col-md-12",children:(0,i.jsxs)("table",{className:"table table-bordered",children:[(0,i.jsx)("thead",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{children:"Days"}),(0,i.jsx)("th",{children:"Token Start No."}),(0,i.jsx)("th",{children:"Token Interval"}),(0,i.jsx)("th",{children:"Total Token"}),(0,i.jsx)("th",{children:"Total Online Token"}),(0,i.jsx)("th",{children:"Max No. of Days"}),(0,i.jsx)("th",{children:"Min No. of Days"})]})}),(0,i.jsx)("tbody",{children:F.map((e=>(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:e}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"startToken")?"#55bf70":""},value:B[e].startToken,onChange:t=>K(e,"startToken",t.target.value)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"totalInterval")?"#55bf70":""},value:B[e].totalInterval,onChange:t=>K(e,"totalInterval",t.target.value)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"totalToken")?"#55bf70":""},value:B[e].totalToken,onChange:t=>K(e,"totalToken",t.target.value)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"totalOnlineToken")?"#55bf70":""},value:B[e].totalOnlineToken,onChange:t=>K(e,"totalOnlineToken",t.target.value)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"maxNoOfDays")?"#55bf70":""},value:B[e].maxNoOfDays,onChange:t=>K(e,"maxNoOfDays",t.target.value)})}),(0,i.jsx)("td",{children:(0,i.jsx)("input",{type:"number",className:"form-control",style:{backgroundColor:Q(e,"minNoOfDays")?"#55bf70":""},value:B[e].minNoOfDays,onChange:t=>K(e,"minNoOfDays",t.target.value)})})]},e)))})]})})]}),(0,i.jsx)("div",{className:"mt-2",children:(0,i.jsxs)("div",{className:"d-flex align-items-center mb-2",children:[(0,i.jsx)("div",{style:{width:"20px",height:"20px",backgroundColor:"#55bf70",marginRight:"10px"}}),(0,i.jsx)("span",{children:"Modified database data"})]})}),(0,i.jsxs)("div",{className:"mt-4",children:[(0,i.jsx)("button",{type:"submit",className:"btn btn-primary me-2",disabled:A,children:A?"Processing...":$?"Update Appointment":"Create Appointment"}),(0,i.jsx)("button",{type:"button",className:"btn btn-secondary",onClick:V,children:"Reset"})]})]})})})})})]})})})}}}]);
//# sourceMappingURL=322.dca61c3b.chunk.js.map