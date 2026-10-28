export const CATEGORIES=[
 {value:'inbox',label:'Inbox & email',agent:'house_manager'},
 {value:'calendar',label:'Calendar & scheduling',agent:'house_manager'},
 {value:'meetings',label:'Meetings',agent:'house_manager'},
 {value:'family',label:'Kids & family',agent:'house_manager'},
 {value:'health',label:'Health',agent:'house_manager'},
 {value:'shopping',label:'Shopping & errands',agent:'house_manager'},
 {value:'chores',label:'Chores & home',agent:'house_manager'},
 {value:'admin',label:'Admin & paperwork',agent:'house_manager'},
 {value:'content',label:'Content & social',agent:'content_engine'},
 {value:'sales',label:'Sales & outreach',agent:'revenue_agent'},
 {value:'money',label:'Money, invoices & billing',agent:'revenue_agent'},
 {value:'client_work',label:'Client / paid work',agent:''},
 {value:'deep_work',label:'Deep work',agent:''},
 {value:'learning',label:'Learning',agent:''},
 {value:'rest',label:'Rest & sleep',agent:''},
 {value:'other',label:'Other',agent:''},
];
export const CATEGORY=Object.fromEntries(CATEGORIES.map(c=>[c.value,c]));
export const AGENT_NAMES={house_manager:'House Manager',content_engine:'Content Engine',revenue_agent:'Revenue Agent'};
export const SLOTS=Array.from({length:36},(_,i)=>{const m=360+i*30;return `${String(Math.floor(m/60)).padStart(2,'0')}:${m%60?'30':'00'}`;});
export const today=()=>new Date().toLocaleDateString('en-CA');
export const currentSlot=()=>{const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${d.getMinutes()<30?'00':'30'}`;};
export const fmtSlot=t=>{const [h,m]=t.split(':').map(Number);return `${((h+11)%12)+1}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'}`;};
const KEY='time-audit-settings';
export const loadAuditSettings=()=>{try{return {hourly:50,week:5,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return {hourly:50,week:5};}};
export const saveAuditSettings=v=>localStorage.setItem(KEY,JSON.stringify(v));