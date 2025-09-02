// -------------------- Firebase Config --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBx4Ow5IJmub9HLVsasCq779OLnaABNSio",
  authDomain: "rct-pos.firebaseapp.com",
  projectId: "rct-pos",
  storageBucket: "rct-pos.firebasestorage.app",
  messagingSenderId: "131756629106",
  appId: "1:131756629106:web:8cd9d2158a083881f436eb",
  measurementId: "G-4CXCN8LEX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// -------------------- Roles --------------------
const roles = {
  admin: ["dashboard","cashier","products","analytics","customers","reports","pending"],
  cashier: ["cashier","products","pending"],
  manager: ["dashboard","analytics","customers","reports"]
};

let currentUser = null;
let currentRole = "cashier"; // default
let products=[], sales=[], pendingSales=[], customers=[];

// -------------------- Google Login --------------------
document.getElementById("google-login").addEventListener("click", async ()=>{
  try{
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    document.getElementById("login-modal").classList.add("hidden");
    document.getElementById("sidebar").classList.remove("hidden");
    document.getElementById("top-header").classList.remove("hidden");
    document.getElementById("user-name").textContent = currentUser.displayName;

    // Assign role by email (example)
    if(currentUser.email==="admin@example.com") currentRole="admin";
    else if(currentUser.email.endsWith("@manager.com")) currentRole="manager";
    else currentRole="cashier";

    renderSidebar();
    await fetchFirestoreData();
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
  container.innerHTML=`<h2 class="text-2xl font-bold mb-4">${section.charAt(0).toUpperCase()+section.slice(1)}</h2>`;
  
  if(section==="cashier") loadCashierSection(container);
  else if(section==="products") loadProductsSection(container);
  else if(section==="pending") loadPendingSection(container);
  else container.innerHTML+=`<p>Content for ${section} goes here.</p>`;
}

// -------------------- Firestore Fetch --------------------
async function fetchFirestoreData(){
  // Products
  const prodSnap = await getDocs(collection(db,"products"));
  products = prodSnap.docs.map(d=>({id: d.id, ...d.data()}));

  // Sales
  const salesSnap = await getDocs(collection(db,"sales"));
  sales = salesSnap.docs.map(d=>({id: d.id, ...d.data()}));

  // Pending
  const pendingSnap = await getDocs(collection(db,"pending"));
  pendingSales = pendingSnap.docs.map(d=>({id: d.id, ...d.data()}));

  // Customers
  const custSnap = await getDocs(collection(db,"customers"));
  customers = custSnap.docs.map(d=>({id: d.id, ...d.data()}));
}

// -------------------- Cashier Section --------------------
function loadCashierSection(container){
  container.innerHTML+=`
    <form id="sale-form" class="space-y-4 bg-white p-4 rounded shadow">
      <div>
        <label>Product</label>
        <select id="sale-product" class="w-full border p-2 rounded">
          ${products.map(p=>`<option value="${p.id}">${p.name} - $${p.price}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Quantity</label>
        <input type="number" id="sale-qty" value="1" min="1" class="w-full border p-2 rounded">
      </div>
      <div>
        <label>Payment Type</label>
        <select id="sale-payment" class="w-full border p-2 rounded">
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Add Sale</button>
    </form>
  `;

  document.getElementById("sale-form").addEventListener("submit", async e=>{
    e.preventDefault();
    let pid = document.getElementById("sale-product").value;
    let qty = parseInt(document.getElementById("sale-qty").value);
    let payment = document.getElementById("sale-payment").value;
    let product = products.find(p=>p.id===pid);
    let total = product.price*qty;

    let saleObj = {
      product: product.name,
      qty,
      total,
      payment,
      status: payment==="Pending"?"Pending":"Completed",
      cashier: currentUser.displayName,
      timestamp: new Date()
    };

    try{
      if(payment==="Pending"){
        await addDoc(collection(db,"pending"), saleObj);
        pendingSales.push(saleObj);
      } else {
        await addDoc(collection(db,"sales"), saleObj);
        sales.push(saleObj);
      }
      alert("Sale recorded!");
      loadSection("cashier");
    }catch(err){alert("Error: "+err.message);}
  });
}

// -------------------- Pending Section --------------------
function loadPendingSection(container){
  if(pendingSales.length===0){ container.innerHTML+="<p>No pending sales.</p>"; return;}
  container.innerHTML+=`<table class="w-full text-left border"><tr><th>Product</th><th>Qty</th><th>Total</th><th>Cashier</th><th>Action</th></tr>
  ${pendingSales.map((s,i)=>`<tr>
    <td>${s.product}</td>
    <td>${s.qty}</td>
    <td>$${s.total}</td>
    <td>${s.cashier}</td>
    <td><button data-index="${i}" class="complete-btn bg-green-600 text-white px-2 py-1 rounded">Complete</button></td>
  </tr>`).join('')}</table>`;

  document.querySelectorAll(".complete-btn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      let index = btn.dataset.index;
      let sale = pendingSales[index];
      const docRef = doc(db,"pending", sale.id);
      await updateDoc(docRef,{status:"Completed"});
      await addDoc(collection(db,"sales"), {...sale, status:"Completed"});
      pendingSales.splice(index,1);
      loadSection("pending");
    });
  });
}

// -------------------- Calculator --------------------
const calc = document.getElementById("calculator");
const display = document.getElementById("calc-display");
document.getElementById("open-calc").addEventListener("click",()=>calc.classList.toggle("hidden"));
document.addEventListener("keydown",e=>{if(e.ctrlKey && e.key==='m'){calc.classList.toggle("hidden");}});
document.querySelectorAll(".calc-btn").forEach(b=>b.addEventListener("click",()=>display.value+=b.textContent));
document.getElementById("calc-clear").addEventListener("click",()=>display.value="");
document.getElementById("calc-equals").addEventListener("click",()=>{try{display.value=eval(display.value)}catch{alert('Invalid')}});

