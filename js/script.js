
const nav=document.getElementById("nav");
function toggleMenu(){nav?.classList.toggle("open")}
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
function closeAnnouncement(){document.getElementById("announcement")?.remove()}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("lustre-theme",theme);const b=document.getElementById("themeToggle");if(b)b.textContent=theme==="dark"?"☀":"☾"}
function toggleTheme(){setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")}
setTheme(localStorage.getItem("lustre-theme")||"light");

const dateInput=document.getElementById("dateInput");
if(dateInput){const d=new Date(),today=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().split("T")[0];dateInput.min=today;dateInput.value=today}
document.querySelectorAll(".option").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".option").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
document.querySelectorAll("[data-service]").forEach(a=>a.addEventListener("click",()=>document.querySelectorAll(".option").forEach(o=>o.classList.toggle("active",o.dataset.value===a.dataset.service))));

function submitBooking(){
 const name=document.getElementById("nameInput")?.value.trim(),date=document.getElementById("dateInput")?.value,time=document.getElementById("timeInput")?.value,service=document.querySelector(".option.active")?.dataset.value;
 if(!name||!date||!time){alert("Please select a date, time, and enter your name.");return}
 const readable=new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
 const text=document.getElementById("confirmationText");if(text)text.textContent=`Hi ${name}! Your ${service} request for ${readable} at ${time} is ready. The backend and payment system will be connected next.`;
 document.getElementById("confirmationModal")?.classList.add("show");
}
function closeModal(){document.getElementById("confirmationModal")?.classList.remove("show")}
