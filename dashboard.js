import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBx4Ow5IJmub9HLVsasCq779OLnaABNSio",
  authDomain: "rct-pos.firebaseapp.com",
  projectId: "rct-pos",
  storageBucket: "rct-pos.firebasestorage.app",
  messagingSenderId: "131756629106",
  appId: "1:131756629106:web:8cd9d2158a083881f436eb",
  measurementId: "G-4CXCN8LEX9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// -------------------- Roles & Permissions --------------------
const roles = {
  "admin": ["dashboard","cashier","products","analytics","customers","reports","pending"],
  "cashier": ["cashier","products","pending"],
  "manager": ["dashboard","analytics","customers","reports"]
};

let currentUser = null;
let currentRole = "cashier"; // default, will update after login

// -------------------- Google Login --------------------
document.getElementById("google-login").addEventListener("click", async ()=>{
  try{
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    currentUser = user;
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("sidebar").classList.remove("hidden");
    document.getElementById("top-header").classList.remove("hidden");
    document.getElementById("user-name").textContent = user.displayName;

    // Assign role based on email (example)
    if(user.email==="admin@example.com") currentRole="admin";
    else if(user.email.endsWith("@manager.com")) currentRole="manager";
    else currentRole="cashier";

    renderSidebar();
    loadSection(roles[currentRole][0]);
  }catch(err){
    alert("Login failed: "+err.message);
  }
});

// -------------------- Sidebar --------------------
function renderSidebar(){
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML="";
  roles[currentRole].forEach(sec=>{
    const btn = document.createElement("button");
    btn.textContent = sec.charAt(0).toUpperCase()+sec.slice(1);
    btn.className="w-full text-left px-4 py-2 hover:bg-blue-100 rounded";
    btn.dataset.section=sec;
    btn.addEventListener("click",()=>loadSection(sec));
    nav.appendChild(btn);
  });
}

// -------------------- Sections --------------------
function loadSection(section){
  const container = document.getElementById("section-content");
  container.innerHTML=`<h2 class="text-2xl font-bold mb-4">${section.charAt(0).toUpperCase()+section.slice(1)}</h2><p>Content for ${section} goes here.</p>`;
}

// -------------------- Calculator --------------------
const calc = document.getElementById("calculator");
const display = document.getElementById("calc-display");
document.getElementById("open-calc").addEventListener("click",()=>calc.classList.toggle("hidden"));
document.addEventListener("keydown",e=>{if(e.ctrlKey && e.key==='m'){calc.classList.toggle("hidden");}});
document.querySelectorAll(".calc-btn").forEach(b=>b.addEventListener("click",()=>display.value+=b.textContent));
document.getElementById("calc-clear").addEventListener("click",()=>display.value="");
document.getElementById("calc-equals").addEventListener("click",()=>{try{display.value=eval(display.value)}catch{alert('Invalid')}});

