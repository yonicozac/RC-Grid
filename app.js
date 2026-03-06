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
  deleteDoc,
  updateDoc,
  query,
  where,
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

/* ---------------- State ---------------- */

let currentUser = null;
let currentUserName = null;
let isAdmin = false;
let followedTrackIds = new Set();
let cachedTrackDocs = [];

/* ---------------- UI Refs ---------------- */

const authArea = document.getElementById("authArea");
const nameSetupArea = document.getElementById("nameSetupArea");
const appArea = document.getElementById("appArea");
const emailInput = document.getElementById("emailInput");
const sendLinkBtn = document.getElementById("sendLinkBtn");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");
const navTracks = document.getElementById("navTracks");
const navRaces = document.getElementById("navRaces");
const tracksView = document.getElementById("tracksView");
const racesView = document.getElementById("racesView");
const tracksContainer = document.getElementById("tracksContainer");
const racesContainer = document.getElementById("racesContainer");
const adminPendingPanel = document.getElementById("adminPendingPanel");
const pendingContainer = document.getElementById("pendingContainer");
const createTrackForm = document.getElementById("createTrackForm");

/* ---------------- Auth ---------------- */

const actionCodeSettings = {
  url: "https://yonicozac.github.io/RC-Grid/",
  handleCodeInApp: true
};

sendLinkBtn.onclick = async () => {
  const email = emailInput.value.trim();
  if (!email) { alert("Enter your email"); return; }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem("emailForSignIn", email);
  loginStatus.innerText = "Login link sent. Check your email.";
};

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = localStorage.getItem("emailForSignIn");
  if (!email) email = prompt("Confirm your email");
  await signInWithEmailLink(auth, email, window.location.href);
  localStorage.removeItem("emailForSignIn");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authArea.classList.remove("hidden");
    nameSetupArea.classList.add("hidden");
    appArea.classList.add("hidden");
    currentUser = null;
    currentUserName = null;
    return;
  }

  currentUser = user;
  authArea.classList.add("hidden");

  const userDoc = await getDoc(doc(db, "users", user.uid));
  currentUserName = userDoc.exists() ? userDoc.data().name : null;

  if (!currentUserName) {
    nameSetupArea.classList.remove("hidden");
    appArea.classList.add("hidden");
    return;
  }

  nameSetupArea.classList.add("hidden");
  appArea.classList.remove("hidden");

  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  isAdmin = adminDoc.exists();

  await loadFollowedTracks();
  showView("races");
});

logoutBtn.onclick = () => signOut(auth);

/* ---------------- Name Setup ---------------- */

document.getElementById("saveNameBtn").onclick = async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) { alert("Please enter your name"); return; }

  await setDoc(doc(db, "users", currentUser.uid), { name }, { merge: true });
  currentUserName = name;

  nameSetupArea.classList.add("hidden");
  appArea.classList.remove("hidden");

  const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
  isAdmin = adminDoc.exists();

  await loadFollowedTracks();
  showView("races");
};

/* ---------------- Navigation ---------------- */

navTracks.onclick = () => showView("tracks");
navRaces.onclick = () => showView("races");

function showView(view) {
  if (view === "tracks") {
    tracksView.classList.remove("hidden");
    racesView.classList.add("hidden");
    navTracks.classList.add("active");
    navRaces.classList.remove("active");
    loadTracksView();
  } else {
    racesView.classList.remove("hidden");
    tracksView.classList.add("hidden");
    navRaces.classList.add("active");
    navTracks.classList.remove("active");
    loadRacesView();
  }
}

/* ---------------- Helpers ---------------- */

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function safeHref(url) {
  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
}

function getUserLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------- Follow State ---------------- */

async function loadFollowedTracks() {
  followedTrackIds.clear();
  const snap = await getDocs(collection(db, "users", currentUser.uid, "following"));
  snap.forEach(d => followedTrackIds.add(d.id));
}

/* ---------------- Tracks View ---------------- */

async function loadTracksView() {
  tracksContainer.innerHTML = "";

  if (isAdmin) {
    adminPendingPanel.classList.remove("hidden");
    await loadPendingTracks();
  }

  const snap = await getDocs(query(collection(db, "tracks"), where("status", "==", "approved")));
  cachedTrackDocs = [];
  snap.forEach(d => cachedTrackDocs.push(d));
  renderTrackList(document.getElementById("trackSearch").value);
}

function renderTrackList(searchTerm = "") {
  tracksContainer.innerHTML = "";
  const term = searchTerm.toLowerCase().trim();
  const filtered = cachedTrackDocs.filter(d => {
    const t = d.data();
    return !term ||
      t.name.toLowerCase().includes(term) ||
      t.location.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term));
  });

  if (filtered.length === 0) {
    tracksContainer.innerHTML = "<p>No tracks found.</p>";
    return;
  }
  filtered.forEach(d => tracksContainer.appendChild(buildTrackCard(d)));
}

document.getElementById("trackSearch").oninput = e => renderTrackList(e.target.value);

async function loadPendingTracks() {
  pendingContainer.innerHTML = "";
  const snap = await getDocs(query(collection(db, "tracks"), where("status", "==", "pending")));

  if (snap.empty) {
    pendingContainer.innerHTML = "<p>No pending tracks.</p>";
    return;
  }

  snap.forEach(d => pendingContainer.appendChild(buildPendingCard(d)));
}

function buildTrackCard(trackDoc) {
  const t = trackDoc.data();
  const id = trackDoc.id;
  const isOwner = t.createdBy === currentUser.uid;
  const isFollowing = followedTrackIds.has(id);
  const href = safeHref(t.website);

  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <h3>${esc(t.name)}</h3>
    <div class="meta">
      ${esc(t.location)}
      ${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">Website</a>` : ""}
    </div>
    ${t.description ? `<p>${esc(t.description)}</p>` : ""}
  `;

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";

  // Follow / Unfollow
  const followBtn = document.createElement("button");
  followBtn.innerText = isFollowing ? "Unfollow" : "Follow";
  followBtn.onclick = async () => {
    if (followedTrackIds.has(id)) {
      await deleteDoc(doc(db, "users", currentUser.uid, "following", id));
      followedTrackIds.delete(id);
    } else {
      await setDoc(doc(db, "users", currentUser.uid, "following", id), {
        followedAt: serverTimestamp()
      });
      followedTrackIds.add(id);
    }
    followBtn.innerText = followedTrackIds.has(id) ? "Unfollow" : "Follow";
  };
  btnRow.appendChild(followBtn);

  // Owner: manage races toggle
  if (isOwner) {
    const manageBtn = document.createElement("button");
    manageBtn.innerText = "Manage Races";

    const racePanel = document.createElement("div");
    racePanel.className = "race-panel hidden";

    manageBtn.onclick = async () => {
      if (racePanel.classList.contains("hidden")) {
        racePanel.classList.remove("hidden");
        await buildRacePanel(id, t.name, t.lat ?? null, t.lng ?? null, racePanel);
      } else {
        racePanel.classList.add("hidden");
      }
    };

    btnRow.appendChild(manageBtn);
    div.appendChild(btnRow);
    div.appendChild(racePanel);
  } else {
    div.appendChild(btnRow);
  }

  return div;
}

function buildPendingCard(trackDoc) {
  const t = trackDoc.data();
  const id = trackDoc.id;

  const div = document.createElement("div");
  div.className = "card pending";
  div.innerHTML = `
    <b>${esc(t.name)}</b> · ${esc(t.location)}
    ${t.description ? `<br><small>${esc(t.description)}</small>` : ""}
  `;

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";

  const approveBtn = document.createElement("button");
  approveBtn.innerText = "Approve";
  approveBtn.onclick = async () => {
    await updateDoc(doc(db, "tracks", id), { status: "approved" });
    await loadTracksView();
  };

  const rejectBtn = document.createElement("button");
  rejectBtn.innerText = "Reject";
  rejectBtn.onclick = async () => {
    if (!confirm(`Reject and delete track "${t.name}"?`)) return;
    await deleteDoc(doc(db, "tracks", id));
    await loadPendingTracks();
  };

  btnRow.appendChild(approveBtn);
  btnRow.appendChild(rejectBtn);
  div.appendChild(btnRow);
  return div;
}

/* ---------------- Create Track ---------------- */

document.getElementById("showCreateTrackBtn").onclick = () => {
  createTrackForm.classList.toggle("hidden");
};

document.getElementById("cancelCreateTrackBtn").onclick = () => {
  createTrackForm.classList.add("hidden");
};

document.getElementById("submitCreateTrackBtn").onclick = async () => {
  const name = document.getElementById("newTrackName").value.trim();
  const location = document.getElementById("newTrackLocation").value.trim();
  const website = document.getElementById("newTrackWebsite").value.trim();
  const description = document.getElementById("newTrackDescription").value.trim();

  if (!name || !location) { alert("Name and location are required"); return; }

  const coords = await getUserLocation();

  const trackData = {
    name,
    location,
    website: website || null,
    description: description || null,
    status: "pending",
    createdBy: currentUser.uid,
    createdAt: serverTimestamp()
  };
  if (coords) { trackData.lat = coords.lat; trackData.lng = coords.lng; }

  await addDoc(collection(db, "tracks"), trackData);

  alert("Track submitted for approval!");
  createTrackForm.classList.add("hidden");
  document.getElementById("newTrackName").value = "";
  document.getElementById("newTrackLocation").value = "";
  document.getElementById("newTrackWebsite").value = "";
  document.getElementById("newTrackDescription").value = "";
};

/* ---------------- Race Panel (owner) ---------------- */

async function buildRacePanel(trackId, trackName, trackLat, trackLng, container) {
  container.innerHTML = "";

  // --- Create Race Form ---
  const formTitle = document.createElement("h4");
  formTitle.innerText = "Create Race";
  container.appendChild(formTitle);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Race name";
  container.appendChild(nameInput);
  container.appendChild(document.createElement("br"));

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  container.appendChild(dateInput);
  container.appendChild(document.createElement("br"));

  const totalCapInput = document.createElement("input");
  totalCapInput.type = "number";
  totalCapInput.placeholder = "Total capacity (optional)";
  totalCapInput.min = "1";
  container.appendChild(totalCapInput);
  container.appendChild(document.createElement("br"));

  // Categories
  const catsLabel = document.createElement("p");
  catsLabel.innerText = "Categories:";
  container.appendChild(catsLabel);

  const catsDiv = document.createElement("div");
  container.appendChild(catsDiv);

  function addCategoryRow() {
    const row = document.createElement("div");
    row.className = "cat-row";

    const nameIn = document.createElement("input");
    nameIn.type = "text";
    nameIn.placeholder = "Category name (e.g. 2WD Buggy)";

    const capIn = document.createElement("input");
    capIn.type = "number";
    capIn.placeholder = "Capacity (optional)";
    capIn.min = "1";

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "×";
    removeBtn.onclick = () => row.remove();

    row.appendChild(nameIn);
    row.appendChild(capIn);
    row.appendChild(removeBtn);
    catsDiv.appendChild(row);
  }

  addCategoryRow(); // start with one

  const addCatBtn = document.createElement("button");
  addCatBtn.innerText = "+ Add Category";
  addCatBtn.onclick = addCategoryRow;
  container.appendChild(addCatBtn);
  container.appendChild(document.createElement("br"));

  const createRaceBtn = document.createElement("button");
  createRaceBtn.innerText = "Create Race";
  createRaceBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const date = dateInput.value;
    const totalCap = totalCapInput.value;

    if (!name || !date) { alert("Name and date are required"); return; }

    const categories = [];
    catsDiv.querySelectorAll(".cat-row").forEach(row => {
      const catName = row.querySelector("input[type=text]").value.trim();
      const cap = row.querySelector("input[type=number]").value;
      if (catName) {
        const cat = { name: catName };
        if (cap) cat.capacity = parseInt(cap);
        categories.push(cat);
      }
    });

    if (categories.length === 0) { alert("Add at least one category"); return; }

    const raceData = {
      name,
      date,
      trackId,
      trackName,
      categories,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    };
    if (totalCap) raceData.totalCapacity = parseInt(totalCap);
    if (trackLat != null) { raceData.trackLat = trackLat; raceData.trackLng = trackLng; }

    await addDoc(collection(db, "races"), raceData);
    await buildRacePanel(trackId, trackName, trackLat, trackLng, container);
  };
  container.appendChild(createRaceBtn);

  // --- Existing Races ---
  const snap = await getDocs(query(collection(db, "races"), where("trackId", "==", trackId)));
  if (!snap.empty) {
    const listTitle = document.createElement("h4");
    listTitle.innerText = "Existing Races";
    container.appendChild(listTitle);

    const races = [];
    snap.forEach(d => races.push({ id: d.id, ...d.data() }));
    races.sort((a, b) => a.date.localeCompare(b.date));

    races.forEach(r => {
      const item = document.createElement("div");
      item.innerHTML = `<b>${esc(r.name)}</b> — ${esc(r.date)}
        <span class="meta"> · ${r.categories.map(c => esc(c.name)).join(", ")}</span>`;
      container.appendChild(item);
    });
  }
}

/* ---------------- Races View ---------------- */

async function loadRacesView() {
  racesContainer.innerHTML = "";

  if (followedTrackIds.size === 0) {
    racesContainer.innerHTML = "<p>Follow some tracks to see their races here.</p>";
    return;
  }

  const trackIds = [...followedTrackIds];
  const snap = await getDocs(
    query(collection(db, "races"), where("trackId", "in", trackIds))
  );

  if (snap.empty) {
    racesContainer.innerHTML = "<p>No races scheduled for your followed tracks.</p>";
    return;
  }

  const races = [];
  snap.forEach(d => races.push({ id: d.id, ...d.data() }));

  const userCoords = await getUserLocation();
  if (userCoords) {
    races.forEach(r => {
      r._distance = (r.trackLat != null)
        ? haversineDistance(userCoords.lat, userCoords.lng, r.trackLat, r.trackLng)
        : Infinity;
    });
    races.sort((a, b) => a._distance - b._distance || a.date.localeCompare(b.date));
  } else {
    races.sort((a, b) => a.date.localeCompare(b.date));
  }

  for (const race of races) {
    const regDoc = await getDoc(
      doc(db, "races", race.id, "registrations", currentUser.uid)
    );
    const myReg = regDoc.exists() ? regDoc.data() : null;
    racesContainer.appendChild(buildRaceCard(race, myReg));
  }
}

function buildRaceCard(race, myReg) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <h3>${esc(race.name)}</h3>
    <div class="meta">
      ${esc(race.trackName)} · ${esc(race.date)}
      ${race.totalCapacity ? ` · Max ${race.totalCapacity} racers` : ""}
    </div>
  `;

  if (myReg) {
    const regInfo = document.createElement("p");
    regInfo.innerHTML = `<b>Registered:</b> ${myReg.categories.map(esc).join(", ")}`;
    div.appendChild(regInfo);

    const unregBtn = document.createElement("button");
    unregBtn.innerText = "Unregister";
    unregBtn.onclick = async () => {
      if (!confirm("Unregister from this race?")) return;
      await deleteDoc(doc(db, "races", race.id, "registrations", currentUser.uid));
      await loadRacesView();
    };
    div.appendChild(unregBtn);

  } else {
    const formDiv = document.createElement("div");

    const label = document.createElement("p");
    label.innerHTML = "<b>Select categories to register:</b>";
    formDiv.appendChild(label);

    race.categories.forEach(cat => {
      const lbl = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = cat.name;
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(
        ` ${cat.name}${cat.capacity ? ` (max ${cat.capacity})` : ""}`
      ));
      formDiv.appendChild(lbl);
    });

    const regBtn = document.createElement("button");
    regBtn.innerText = "Register";
    regBtn.onclick = async () => {
      const selected = [...formDiv.querySelectorAll("input[type=checkbox]:checked")]
        .map(cb => cb.value);
      if (selected.length === 0) { alert("Select at least one category"); return; }

      await setDoc(doc(db, "races", race.id, "registrations", currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUserName,
        categories: selected,
        registeredAt: serverTimestamp()
      });

      await loadRacesView();
    };

    formDiv.appendChild(regBtn);
    div.appendChild(formDiv);
  }

  return div;
}
