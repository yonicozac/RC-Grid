import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  getDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ---------------- Firebase Config ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyA_GV9AePORn27qXFV38lHibNPGWklVlF0",
  authDomain: "rc-grid-faae7.firebaseapp.com",
  projectId: "rc-grid-faae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);

/* ---------------- UI ---------------- */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const sendLinkBtn = document.getElementById("sendLinkBtn");
const loginStatus = document.getElementById("loginStatus");

const authArea = document.getElementById("authArea");
const appArea = document.getElementById("appArea");

const logoutBtn = document.getElementById("logoutBtn");
const adminPanel = document.getElementById("adminPanel");

const eventsContainer = document.getElementById("eventsContainer");
const createEventBtn = document.getElementById("createEventBtn");

/* ---------------- Email Link Config ---------------- */

const actionCodeSettings = {
  url: "https://yonicozac.github.io/RC-Grid/",
  handleCodeInApp: true
};

/* ---------------- Send Login Link ---------------- */

sendLinkBtn.onclick = async () => {

  const email = emailInput.value;

  if (!email) {
    alert("Enter email");
    return;
  }

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  localStorage.setItem("emailForSignIn", email);

  loginStatus.innerText =
    "Login link sent. Check your email.";
};

/* ---------------- Complete Login ---------------- */

if (isSignInWithEmailLink(auth, window.location.href)) {

  let email = localStorage.getItem("emailForSignIn");

  if (!email) {
    email = prompt("Confirm your email");
  }

  await signInWithEmailLink(auth, email, window.location.href);

  localStorage.removeItem("emailForSignIn");
}

/* ---------------- Auth State ---------------- */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    authArea.classList.remove("hidden");
    appArea.classList.add("hidden");

    return;
  }

  authArea.classList.add("hidden");
  appArea.classList.remove("hidden");

  await checkAdmin(user.uid);
  loadEvents();
});

/* ---------------- Logout ---------------- */

logoutBtn.onclick = async () => {
  await signOut(auth);
};

/* ---------------- Admin Check ---------------- */

async function checkAdmin(uid) {

  const adminDoc = await getDoc(doc(db,"admins",uid));

  if(adminDoc.exists()){
    adminPanel.classList.remove("hidden");
  }
}

/* ---------------- Create Event ---------------- */

createEventBtn.onclick = async () => {

  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;

  const cats = document
    .getElementById("eventCategories")
    .value
    .split(",")
    .map(c=>c.trim())
    .filter(c=>c.length>0);

  await addDoc(collection(db,"events"),{

    name,
    date,
    categories:cats,
    createdAt:serverTimestamp(),
    createdBy:auth.currentUser.uid

  });

  loadEvents();
};

/* ---------------- Load Events ---------------- */

async function loadEvents(){

  eventsContainer.innerHTML = "";

  const snapshot = await getDocs(collection(db,"events"));

  snapshot.forEach(async eventDoc=>{

    const e = eventDoc.data();
    const eventId = eventDoc.id;

    const div = document.createElement("div");
    div.className="event";

    const title = document.createElement("h3");
    title.innerText = `${e.name} (${e.date})`;

    div.appendChild(title);

    const userReg = await getDoc(
      doc(db,"registrations",eventId,auth.currentUser.uid)
    );

    let myCategory = null;

    if(userReg.exists()){
      myCategory = userReg.data().category;

      const myReg = document.createElement("div");
      myReg.innerHTML = `<b>Your registration:</b> ${myCategory}`;
      div.appendChild(myReg);
    }

    /* ---------- Category Buttons ---------- */

    const btnContainer = document.createElement("div");

    e.categories.forEach(cat=>{

      const btn = document.createElement("button");

      btn.innerText = `Register: ${cat}`;

      if(myCategory){
        btn.disabled = true;
      }

      btn.onclick = ()=>register(eventId,cat);

      btnContainer.appendChild(btn);
    });

    div.appendChild(btnContainer);

    /* ---------- Participants ---------- */

    const participants = document.createElement("div");
    participants.innerHTML = "<b>Participants</b><br>";

    div.appendChild(participants);

    await loadParticipants(eventId,participants,e.categories);

    eventsContainer.appendChild(div);
  });
}

/* ---------------- Register ---------------- */

async function register(eventId,category){

  const user = auth.currentUser;

  await setDoc(
    doc(db,"registrations",eventId,user.uid),
    {
      uid:user.uid,
      email:user.email,
      category,
      registeredAt:serverTimestamp()
    }
  );

  loadEvents();
}

/* ---------------- Participants ---------------- */

async function loadParticipants(eventId,container,categories){

  const snap = await getDocs(collection(db,"registrations",eventId));

  if(snap.empty){
    container.innerHTML += "No participants yet";
    return;
  }

  const grouped = {};

  categories.forEach(c=>{
    grouped[c] = [];
  });

  snap.forEach(doc=>{

    const d = doc.data();

    if(!grouped[d.category]){
      grouped[d.category] = [];
    }

    grouped[d.category].push(d.email);
  });

  for(const cat of categories){

    const list = grouped[cat];

    const section = document.createElement("div");

    section.innerHTML = `<br><b>${cat}</b><br>`;

    if(!list || list.length === 0){
      section.innerHTML += "No participants<br>";
    } else {

      list.forEach(email=>{
        section.innerHTML += `${email}<br>`;
      });
    }

    container.appendChild(section);
  }
}