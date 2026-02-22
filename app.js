import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------------------ CONFIG ------------------ */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ------------------ UI ELEMENTS ------------------ */

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanel = document.getElementById("adminPanel");
const createEventBtn = document.getElementById("createEventBtn");
const eventsContainer = document.getElementById("eventsContainer");

/* ------------------ AUTH ------------------ */

loginBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    await checkAdmin(user.uid);
    loadEvents();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    adminPanel.classList.add("hidden");
    eventsContainer.innerHTML = "";
  }
});

/* ------------------ ADMIN CHECK ------------------ */

async function checkAdmin(uid) {
  const adminDoc = await getDocs(collection(db, "admins"));
  let isAdmin = false;

  adminDoc.forEach(doc => {
    if (doc.id === uid) isAdmin = true;
  });

  if (isAdmin) {
    adminPanel.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
  }
}

/* ------------------ CREATE EVENT ------------------ */

createEventBtn.onclick = async () => {
  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;
  const categoriesInput = document.getElementById("eventCategories").value;

  if (!name || !date || !categoriesInput) {
    alert("Fill all fields");
    return;
  }

  const categories = categoriesInput
    .split(",")
    .map(c => c.trim())
    .filter(c => c.length > 0);

  await addDoc(collection(db, "events"), {
    name,
    date,
    categories,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser.uid
  });

  alert("Event created!");
  loadEvents();
};

/* ------------------ LOAD EVENTS ------------------ */

async function loadEvents() {
  eventsContainer.innerHTML = "";

  const snapshot = await getDocs(collection(db, "events"));

  snapshot.forEach(eventDoc => {
    const event = eventDoc.data();
    const eventId = eventDoc.id;

    const div = document.createElement("div");
    div.className = "event";

    const title = document.createElement("h3");
    title.textContent = `${event.name} (${event.date})`;
    div.appendChild(title);

    // Category buttons
    event.categories.forEach(category => {
      const btn = document.createElement("button");
      btn.textContent = `Register: ${category}`;
      btn.onclick = () => registerToEvent(eventId, category);
      div.appendChild(btn);
    });

    // Participants list
    const participantsDiv = document.createElement("div");
    participantsDiv.textContent = "Loading participants...";
    div.appendChild(participantsDiv);

    loadParticipants(eventId, participantsDiv);

    eventsContainer.appendChild(div);
  });
}

/* ------------------ REGISTER ------------------ */

async function registerToEvent(eventId, category) {
  const user = auth.currentUser;
  if (!user) {
    alert("Login first");
    return;
  }

  await setDoc(
    doc(db, "registrations", eventId, user.uid),
    {
      uid: user.uid,
      displayName: user.displayName || "Anonymous",
      category,
      registeredAt: serverTimestamp()
    }
  );

  alert("Registered!");
  loadEvents();
}

/* ------------------ LOAD PARTICIPANTS ------------------ */

async function loadParticipants(eventId, container) {
  container.innerHTML = "<strong>Participants:</strong><br>";

  const snapshot = await getDocs(collection(db, "registrations", eventId));

  if (snapshot.empty) {
    container.innerHTML += "No participants yet.";
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    container.innerHTML += `${data.displayName} (${data.category})<br>`;
  });
}