import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getAuth,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  initializeFirestore,
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
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ---------------- Firebase Config ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyA_GV9AePORn27qXFV38lHibNPGWklVlF0",
  authDomain: "rc-grid-faae7.firebaseapp.com",
  projectId: "rc-grid-faae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// iOS Safari often can't hold Firestore's streaming connection (Private Relay, content
// blockers, some networks); auto-detecting that took 10–30s per load, so always long-poll.
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

await setPersistence(auth, browserLocalPersistence);

/* ---------------- State ---------------- */

let currentUser = null;
let currentUserName = null;
let currentUserTransponder = "";
let isAdmin = false;
let followedTrackIds = new Set();
let followsReady = null;   // promise for loadFollowedTracks(), started at sign-in
let adminReady = null;     // promise for the admin check (never rejects)
let cachedTrackDocs = [];
let tracksViewCoords = null;

/* ---------------- UI Refs ---------------- */

const loadingArea = document.getElementById("loadingArea");
const authArea = document.getElementById("authArea");
const nameSetupArea = document.getElementById("nameSetupArea");
const appArea = document.getElementById("appArea");
const emailInput = document.getElementById("emailInput");
const sendLinkBtn = document.getElementById("sendLinkBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");
const navTracks = document.getElementById("navTracks");
const navRaces = document.getElementById("navRaces");
const pendingBadge = document.getElementById("pendingBadge");
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

// Google sign-in: happens in a popup in the same tab, so no email and no cross-browser hop
const googleSignInErrors = {
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
  "auth/account-exists-with-different-credential": "This email already signs in with an email link. Use the email option below.",
  "auth/network-request-failed": "Couldn't reach the server. Check your connection and try again.",
  "auth/unauthorized-domain": "Google sign-in isn't enabled for this address yet.",
  "auth/operation-not-allowed": "Google sign-in isn't enabled yet."
};

googleSignInBtn.onclick = async () => {
  googleSignInBtn.disabled = true;
  loginStatus.classList.remove("error");
  loginStatus.innerText = "";
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    // onAuthStateChanged takes it from here
  } catch (err) {
    // Closing the popup isn't an error worth showing
    if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
      console.error(err);
      loginStatus.classList.add("error");
      loginStatus.innerText = googleSignInErrors[err.code] ??
        "Google sign-in didn't work here. If you opened this page from an email or chat app, open it in Safari or Chrome instead.";
    }
  } finally {
    googleSignInBtn.disabled = false;
  }
};

const sendLinkErrors = {
  "auth/quota-exceeded": "Too many sign-in emails were sent today. Please try again tomorrow.",
  "auth/invalid-email": "That email address doesn't look right. Please check it and try again.",
  "auth/missing-email": "Enter your email",
  "auth/network-request-failed": "Couldn't reach the server. Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again."
};

sendLinkBtn.onclick = async () => {
  const email = emailInput.value.trim();
  if (!email) { alert("Enter your email"); return; }

  sendLinkBtn.disabled = true;
  loginStatus.classList.remove("error");
  loginStatus.innerText = "Sending…";
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  } catch (err) {
    console.error(err);
    loginStatus.classList.add("error");
    loginStatus.innerText = sendLinkErrors[err.code] ?? "Couldn't send the login link. Please try again later.";
    return;
  } finally {
    sendLinkBtn.disabled = false;
  }

  localStorage.setItem("emailForSignIn", email);
  loginStatus.innerHTML = `Login link sent to <b>${esc(email)}</b>.<br>
    Can't find it? Check your spam folder. It comes from
    <span class="sender">noreply@${firebaseConfig.authDomain}</span>`;
};

if (isSignInWithEmailLink(auth, window.location.href)) {
  // Skip if a saved session already exists (e.g. reloading a used link)
  await auth.authStateReady();
  if (!auth.currentUser) {
    const email = localStorage.getItem("emailForSignIn") || prompt("Confirm your email");
    if (email) {
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        localStorage.removeItem("emailForSignIn");
      } catch (err) {
        console.error(err);
        loginStatus.innerText = "This login link is invalid or has expired. Please request a new one.";
      }
    }
  }
  // Strip the one-time link params so a reload doesn't re-run sign-in
  history.replaceState(null, "", window.location.pathname);
}

onAuthStateChanged(auth, async (user) => {
  loadingArea.classList.add("hidden");

  if (!user) {
    authArea.classList.remove("hidden");
    nameSetupArea.classList.add("hidden");
    appArea.classList.add("hidden");
    currentUser = null;
    currentUserName = null;
    currentUserTransponder = "";
    setPendingBadge(0);
    return;
  }

  currentUser = user;
  authArea.classList.add("hidden");

  // Profile, admin check and follows don't depend on each other: start them together
  startBackgroundLoads();

  let userDoc;
  try {
    userDoc = await getDoc(doc(db, "users", user.uid));
  } catch (err) {
    console.error(err);
    showStartupError();
    return;
  }
  currentUserName = userDoc.exists() ? userDoc.data().name : null;
  currentUserTransponder = userDoc.exists() ? userDoc.data().transponder ?? "" : "";

  if (!currentUserName) {
    nameSetupArea.classList.remove("hidden");
    // Google accounts come with a name; suggest it
    document.getElementById("nameInput").value = user.displayName ?? "";
    appArea.classList.add("hidden");
    return;
  }

  enterApp();
});

function startBackgroundLoads() {
  followsReady = loadFollowedTracks();
  followsReady.catch(() => {});   // awaited (and reported) by the views
  // Non-admins aren't allowed to read admins/, so a failed read just means "not admin"
  adminReady = getDoc(doc(db, "admins", currentUser.uid))
    .then(d => d.exists(), () => false)
    .then(admin => {
      isAdmin = admin;
      if (admin) refreshPendingBadge().catch(console.error);
    });
}

// Show the app shell right away; each view waits for what it needs and shows "Loading…"
function enterApp() {
  nameSetupArea.classList.add("hidden");
  appArea.classList.remove("hidden");
  showView("races");
}

function showStartupError() {
  loadingArea.classList.remove("hidden");
  loadingArea.innerHTML = `
    <div class="empty-state">
      <p>Couldn't connect. Check your connection and try again.</p>
      <button class="btn-primary btn-sm" onclick="location.reload()">Retry</button>
    </div>`;
}

logoutBtn.onclick = () => {
  localStorage.removeItem("rcgrid_location");
  signOut(auth);
};

/* ---------------- Name Setup ---------------- */

document.getElementById("saveNameBtn").onclick = async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) { alert("Please enter your name"); return; }

  await setDoc(doc(db, "users", currentUser.uid), { name }, { merge: true });
  currentUserName = name;

  enterApp();
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

function setPendingBadge(count) {
  pendingBadge.innerText = count;
  pendingBadge.title = `${count} track${count === 1 ? "" : "s"} awaiting approval`;
  pendingBadge.classList.toggle("hidden", count === 0);
}

// Rough distance from the viewer, e.g. "12 km"; null if either location is unknown
function distanceLabel(track) {
  if (!tracksViewCoords || track.lat == null || track.lng == null) return null;
  const km = haversineDistance(tracksViewCoords.lat, tracksViewCoords.lng, track.lat, track.lng);
  return km < 1 ? "< 1 km" : `${Math.round(km).toLocaleString("en-US")} km`;
}

function showLoading(container, text) {
  container.innerHTML = `<div class="loading-state">${text}</div>`;
}

function showLoadError(container, what, retry) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "empty-state";
  box.innerHTML = `<p>Couldn't load ${what}. Check your connection and try again.</p>`;
  const retryBtn = document.createElement("button");
  retryBtn.className = "btn-primary btn-sm";
  retryBtn.innerText = "Retry";
  retryBtn.onclick = retry;
  box.appendChild(retryBtn);
  container.appendChild(box);
}

// Wait for the sign-in loads; if follows failed earlier, fetch them again
async function startupDataReady() {
  try {
    await followsReady;
  } catch {
    followsReady = loadFollowedTracks();
    await followsReady;
  }
  await adminReady;
}

/* ---------------- Follow State ---------------- */

async function loadFollowedTracks() {
  followedTrackIds.clear();
  const snap = await getDocs(collection(db, "users", currentUser.uid, "following"));
  snap.forEach(d => followedTrackIds.add(d.id));
}

/* ---------------- Tracks View ---------------- */

async function loadTracksView() {
  showLoading(tracksContainer, "Loading tracks…");
  try {
    await renderTracks();
  } catch (err) {
    console.error(err);
    showLoadError(tracksContainer, "tracks", loadTracksView);
  }
}

async function renderTracks() {
  await startupDataReady();

  if (isAdmin) {
    await loadPendingTracks();
  }

  const snap = await getDocs(query(collection(db, "tracks"), where("status", "==", "approved")));
  cachedTrackDocs = [];
  snap.forEach(d => cachedTrackDocs.push(d));
  const cached = localStorage.getItem("rcgrid_location");
  if (cached) {
    tracksViewCoords = JSON.parse(cached);
  } else {
    tracksViewCoords = await getUserLocation();
    if (tracksViewCoords) localStorage.setItem("rcgrid_location", JSON.stringify(tracksViewCoords));
  }
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
    tracksContainer.innerHTML = '<div class="empty-state"><p>No tracks found.</p></div>';
    return;
  }

  if (tracksViewCoords) {
    filtered.sort((a, b) => {
      const ta = a.data(), tb = b.data();
      const da = ta.lat != null ? haversineDistance(tracksViewCoords.lat, tracksViewCoords.lng, ta.lat, ta.lng) : Infinity;
      const db_ = tb.lat != null ? haversineDistance(tracksViewCoords.lat, tracksViewCoords.lng, tb.lat, tb.lng) : Infinity;
      return da - db_;
    });
  }

  filtered.forEach(d => tracksContainer.appendChild(buildTrackCard(d)));
}

document.getElementById("trackSearch").oninput = e => renderTrackList(e.target.value);

async function loadPendingTracks() {
  pendingContainer.innerHTML = "";
  const snap = await getDocs(query(collection(db, "tracks"), where("status", "==", "pending")));
  setPendingBadge(snap.size);

  if (snap.empty) {
    adminPendingPanel.classList.add("hidden");
    return;
  }

  adminPendingPanel.classList.remove("hidden");
  snap.forEach(d => pendingContainer.appendChild(buildPendingCard(d)));
}

async function refreshPendingBadge() {
  const snap = await getDocs(query(collection(db, "tracks"), where("status", "==", "pending")));
  setPendingBadge(snap.size);
}

function buildTrackCard(trackDoc) {
  const t = trackDoc.data();
  const id = trackDoc.id;
  const isOwner = t.createdBy === currentUser.uid;
  const isFollowing = followedTrackIds.has(id);
  const href = safeHref(t.website);

  const div = document.createElement("div");
  div.className = "card";

  // Follow button: following a track shows its races in the Races view
  const followBtn = document.createElement("button");
  followBtn.className = "btn-sm follow-btn";
  const setFollowState = following => {
    followBtn.classList.toggle("following", following);
    followBtn.innerHTML = following
      ? '<span class="when-idle">✓ Following</span><span class="when-hover">Unfollow</span>'
      : "Follow";
    followBtn.title = following ? "Stop seeing this track's races" : "See this track's races in Races";
  };
  setFollowState(isFollowing);
  followBtn.onclick = async () => {
    followBtn.disabled = true;
    if (followedTrackIds.has(id)) {
      await deleteDoc(doc(db, "users", currentUser.uid, "following", id));
      followedTrackIds.delete(id);
    } else {
      await setDoc(doc(db, "users", currentUser.uid, "following", id), {
        followedAt: serverTimestamp()
      });
      followedTrackIds.add(id);
    }
    setFollowState(followedTrackIds.has(id));
    followBtn.disabled = false;
  };

  const headerText = document.createElement("div");
  headerText.className = "card-header-text";
  headerText.innerHTML = `
    <h3>${esc(t.name)}</h3>
    <div class="meta">
      ${esc(t.location)}
      ${distanceLabel(t) ? ` · ${distanceLabel(t)}` : ""}
      ${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">Website</a>` : ""}
    </div>
    ${t.description ? `<p>${esc(t.description)}</p>` : ""}
  `;

  const cardHeader = document.createElement("div");
  cardHeader.className = "card-header";
  cardHeader.appendChild(headerText);
  cardHeader.appendChild(followBtn);
  div.appendChild(cardHeader);

  if (isOwner || isAdmin) {
    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    div.appendChild(btnRow);

    // Owner or admin: delete track (and its races)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger btn-sm delete-track-btn";
    deleteBtn.innerText = "Delete track";
    deleteBtn.onclick = async () => {
      deleteBtn.disabled = true;
      try {
        const raceSnap = await getDocs(query(collection(db, "races"), where("trackId", "==", id)));
        const raceDocs = raceSnap.docs;
        const warning = raceDocs.length > 0
          ? `\n\nThis also deletes its ${raceDocs.length} race${raceDocs.length === 1 ? "" : "s"} and all their registrations.`
          : "";
        if (!confirm(`Delete track "${t.name}"?${warning}`)) {
          deleteBtn.disabled = false;
          return;
        }
        await deleteTrack(id, raceDocs);
      } catch (err) {
        console.error(err);
        alert("Couldn't delete this track. Please try again.");
        deleteBtn.disabled = false;
        return;
      }
      if (followedTrackIds.has(id)) {
        await deleteDoc(doc(db, "users", currentUser.uid, "following", id));
        followedTrackIds.delete(id);
      }
      await loadTracksView();
    };
    btnRow.appendChild(deleteBtn);

    if (!isOwner) return div;

    // Owner: add race toggle
    const addRaceBtn = document.createElement("button");
    addRaceBtn.className = "btn-ghost btn-sm";
    addRaceBtn.innerText = "Add Race";

    const racePanel = document.createElement("div");
    racePanel.className = "race-panel hidden";

    addRaceBtn.onclick = async () => {
      if (racePanel.classList.contains("hidden")) {
        racePanel.classList.remove("hidden");
        await buildRacePanel(id, t.name, t.lat ?? null, t.lng ?? null, racePanel);
      } else {
        racePanel.classList.add("hidden");
      }
    };

    btnRow.prepend(addRaceBtn);
    div.appendChild(racePanel);
  }

  return div;
}

// Delete a track with all its races and their registrations.
// Batches cap at 500 writes, so commit in chunks: registrations first, then races, then the track.
async function deleteTrack(trackId, raceDocs) {
  const refs = [];
  for (const raceDoc of raceDocs) {
    const regSnap = await getDocs(collection(db, "races", raceDoc.id, "registrations"));
    regSnap.forEach(r => refs.push(r.ref));
  }
  raceDocs.forEach(r => refs.push(r.ref));
  refs.push(doc(db, "tracks", trackId));

  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
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
  approveBtn.className = "btn-primary btn-sm";
  approveBtn.innerText = "Approve";
  approveBtn.onclick = async () => {
    await updateDoc(doc(db, "tracks", id), { status: "approved" });
    await loadTracksView();
  };

  const rejectBtn = document.createElement("button");
  rejectBtn.className = "btn-danger btn-sm";
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

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "×";
    removeBtn.onclick = () => row.remove();

    row.appendChild(nameIn);
    row.appendChild(removeBtn);
    catsDiv.appendChild(row);
  }

  addCategoryRow(); // start with one

  const addCatBtn = document.createElement("button");
  addCatBtn.className = "btn-ghost btn-sm";
  addCatBtn.innerText = "+ Add Category";
  addCatBtn.onclick = addCategoryRow;
  container.appendChild(addCatBtn);
  container.appendChild(document.createElement("br"));

  const createRaceBtn = document.createElement("button");
  createRaceBtn.className = "btn-primary btn-sm";
  createRaceBtn.innerText = "Create Race";
  createRaceBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const date = dateInput.value;

    if (!name || !date) { alert("Name and date are required"); return; }

    const categories = [];
    catsDiv.querySelectorAll(".cat-row").forEach(row => {
      const catName = row.querySelector("input[type=text]").value.trim();
      if (catName) categories.push({ name: catName });
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
  showLoading(racesContainer, "Loading races…");
  try {
    await renderRaces();
  } catch (err) {
    console.error(err);
    showLoadError(racesContainer, "races", loadRacesView);
  }
}

async function renderRaces() {
  await startupDataReady();

  if (followedTrackIds.size === 0) {
    racesContainer.innerHTML = '<div class="empty-state"><p>Follow some tracks to see their races here.</p></div>';
    return;
  }

  const trackIds = [...followedTrackIds];
  const snap = await getDocs(
    query(collection(db, "races"), where("trackId", "in", trackIds))
  );

  if (snap.empty) {
    racesContainer.innerHTML = '<div class="empty-state"><p>No races scheduled for your followed tracks yet.</p></div>';
    return;
  }

  const races = [];
  snap.forEach(d => races.push({ id: d.id, ...d.data() }));

  const regSnaps = await Promise.all(
    races.map(race => getDocs(collection(db, "races", race.id, "registrations")))
  );

  const regsByRace = new Map();
  races.forEach((race, i) => {
    const regs = [];
    regSnaps[i].forEach(d => regs.push({ ...d.data(), uid: d.id }));
    regs.sort((a, b) => (a.registeredAt?.toMillis() ?? 0) - (b.registeredAt?.toMillis() ?? 0));
    regsByRace.set(race.id, regs);
  });

  const cardFor = (race, isPast) => {
    const regs = regsByRace.get(race.id);
    const myReg = regs.find(r => r.uid === currentUser.uid) ?? null;
    return buildRaceCard(race, regs, myReg, isPast);
  };

  // Upcoming (today or later) soonest first; past races most recent first, collapsed
  const today = localDateString();
  const upcoming = races.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = races.filter(r => r.date < today).sort((a, b) => b.date.localeCompare(a.date));

  racesContainer.innerHTML = "";
  if (upcoming.length === 0) {
    racesContainer.innerHTML = '<div class="empty-state"><p>No upcoming races for your followed tracks.</p></div>';
  }
  upcoming.forEach(race => racesContainer.appendChild(cardFor(race, false)));

  if (past.length > 0) {
    const pastToggle = document.createElement("button");
    pastToggle.className = "past-toggle";

    const pastList = document.createElement("div");
    pastList.className = "past-races hidden";
    past.forEach(race => pastList.appendChild(cardFor(race, true)));

    const setLabel = () => {
      const open = !pastList.classList.contains("hidden");
      pastToggle.innerText = `${open ? "▾" : "▸"} Past races (${past.length})`;
    };
    pastToggle.onclick = () => {
      pastList.classList.toggle("hidden");
      setLabel();
    };
    setLabel();

    racesContainer.appendChild(pastToggle);
    racesContainer.appendChild(pastList);
  }
}

function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function driverCount(n) {
  return `${n} driver${n === 1 ? "" : "s"}`;
}

// Per-category entries; older registrations stored categories[] + one transponder
function regEntries(reg) {
  if (!reg) return [];
  return reg.entries ?? (reg.categories ?? []).map(category => ({ category, transponder: reg.transponder ?? null }));
}

async function saveMyEntries(race, myReg, entries) {
  const ref = doc(db, "races", race.id, "registrations", currentUser.uid);
  if (entries.length === 0) {
    await deleteDoc(ref);
  } else if (myReg) {
    await updateDoc(ref, { entries, name: currentUserName });
  } else {
    await setDoc(ref, {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentUserName,
      entries,
      registeredAt: serverTimestamp()
    });
  }
}

// Delete the race and its registrations together
async function deleteRace(raceId, regs) {
  const batch = writeBatch(db);
  regs.forEach(r => batch.delete(doc(db, "races", raceId, "registrations", r.uid)));
  batch.delete(doc(db, "races", raceId));
  await batch.commit();
}

// RaceLyx-compatible driver import: one row per driver per class
// (https://racelyx.com/learn/director-import-drivers-csv/)
function driversCsv(byCategory) {
  const cell = v => {
    const str = String(v ?? "");
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const rows = [["Name", "Class", "Transponder"]];
  byCategory.forEach((drivers, category) => {
    drivers.forEach(d => rows.push([d.name || "", category, d.transponder || ""]));
  });
  return rows.map(r => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

function downloadCsv(filename, text) {
  // BOM so Excel opens non-ASCII names (e.g. Hebrew) as UTF-8
  const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Race manager action: drop one category entry, or the whole registration if it was the last
async function removeDriverEntry(raceId, reg, category) {
  const ref = doc(db, "races", raceId, "registrations", reg.uid);
  const entries = regEntries(reg).filter(e => e.category !== category);
  if (entries.length === 0) await deleteDoc(ref);
  else await updateDoc(ref, { entries });
}

function buildRaceCard(race, regs, myReg, isPast = false) {
  const div = document.createElement("div");
  div.className = isPast ? "card past" : "card";
  const canManage = race.createdBy === currentUser.uid || isAdmin;

  const myEntries = regEntries(myReg);

  // Group entries by category, keeping the race's category order
  const byCategory = new Map(race.categories.map(c => [c.name, []]));
  regs.forEach(r => regEntries(r).forEach(e => {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category).push({ uid: r.uid, name: r.name, transponder: e.transponder, reg: r });
  }));

  div.innerHTML = `
    <h3>${esc(race.name)}</h3>
    <div class="meta">
      ${esc(race.trackName)} · ${esc(race.date)} · ${driverCount(regs.length)} registered
    </div>
  `;

  race.categories.forEach(cat => {
    const myEntry = myEntries.find(e => e.category === cat.name);

    const row = document.createElement("div");
    row.className = "cat-line";

    const head = document.createElement("div");
    head.className = "btn-row cat-head";

    const catName = document.createElement("div");
    catName.className = "cat-name";
    catName.innerHTML = `${esc(cat.name)}<div class="cat-meta">${driverCount(byCategory.get(cat.name).length)}</div>`;
    head.appendChild(catName);

    if (myEntry) {
      const tag = document.createElement("span");
      tag.className = "reg-tag";
      tag.innerText = "✓ Registered";
      head.appendChild(tag);
    }

    row.appendChild(head);

    // Registration is closed once the race date has passed
    if (isPast) {
      div.appendChild(row);
      return;
    }

    const actionBtn = document.createElement("button");
    actionBtn.className = myEntry ? "btn-ghost btn-sm" : "btn-primary btn-sm";
    actionBtn.innerText = myEntry ? "Unregister" : "Register";
    head.appendChild(actionBtn);

    if (myEntry) {
      actionBtn.onclick = async () => {
        if (!confirm(`Unregister from ${cat.name}?`)) return;
        await saveMyEntries(race, myReg, myEntries.filter(e => e.category !== cat.name));
        await loadRacesView();
      };
    } else {
      // Inline form: ask for this category's transponder before registering
      const form = document.createElement("div");
      form.className = "reg-form hidden";

      const transponderInput = document.createElement("input");
      transponderInput.type = "text";
      transponderInput.inputMode = "numeric";
      transponderInput.placeholder = "Transponder # (optional)";
      transponderInput.value = currentUserTransponder;

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "btn-primary btn-sm";
      confirmBtn.innerText = "Confirm";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-secondary btn-sm";
      cancelBtn.innerText = "Cancel";

      form.appendChild(transponderInput);
      form.appendChild(confirmBtn);
      form.appendChild(cancelBtn);
      row.appendChild(form);

      actionBtn.onclick = () => {
        form.classList.remove("hidden");
        actionBtn.classList.add("hidden");
        transponderInput.focus();
        transponderInput.select();
      };
      cancelBtn.onclick = () => {
        form.classList.add("hidden");
        actionBtn.classList.remove("hidden");
      };

      const submit = async () => {
        const transponder = transponderInput.value.trim();
        confirmBtn.disabled = true;
        await saveMyEntries(race, myReg, [...myEntries, { category: cat.name, transponder: transponder || null }]);
        // Remember it to prefill the next registration
        if (transponder && transponder !== currentUserTransponder) {
          await setDoc(doc(db, "users", currentUser.uid), { transponder }, { merge: true });
          currentUserTransponder = transponder;
        }
        await loadRacesView();
      };
      confirmBtn.onclick = submit;
      transponderInput.onkeydown = e => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") cancelBtn.onclick();
      };
    }

    div.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "btn-row card-footer";
  let list = null;

  // Registered drivers list, collapsed by default
  if (regs.length > 0) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-ghost btn-sm";
    toggleBtn.innerText = `Show drivers (${regs.length})`;

    list = document.createElement("div");
    list.className = "drivers-list hidden";

    byCategory.forEach((drivers, name) => {
      if (drivers.length === 0) return;
      const group = document.createElement("div");
      group.className = "drivers-group";
      group.innerHTML = `<h4>${esc(name)} · ${drivers.length}</h4>`;
      const ol = document.createElement("ol");

      drivers.forEach(d => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${esc(d.name || "Unnamed driver")}${d.uid === currentUser.uid ? ' <span class="you-tag">you</span>' : ""}
          ${d.transponder ? `<span class="transponder">#${esc(d.transponder)}</span>` : ""}
        `;

        if (canManage) {
          const removeBtn = document.createElement("button");
          removeBtn.className = "remove-driver-btn";
          removeBtn.innerText = "×";
          removeBtn.title = `Remove from ${name}`;
          removeBtn.onclick = async () => {
            if (!confirm(`Remove ${d.name || "this driver"} from ${name}?`)) return;
            removeBtn.disabled = true;
            try {
              await removeDriverEntry(race.id, d.reg, name);
            } catch (err) {
              console.error(err);
              alert("Couldn't remove this driver. Please try again.");
              removeBtn.disabled = false;
              return;
            }
            await loadRacesView();
          };
          li.appendChild(removeBtn);
        }

        ol.appendChild(li);
      });

      group.appendChild(ol);
      list.appendChild(group);
    });

    toggleBtn.onclick = () => {
      const hidden = list.classList.toggle("hidden");
      toggleBtn.innerText = `${hidden ? "Show" : "Hide"} drivers (${regs.length})`;
    };

    footer.appendChild(toggleBtn);

    const listActions = document.createElement("div");
    listActions.className = "drivers-list-actions";
    listActions.innerHTML = `<span>Registered drivers</span>`;

    const csvBtn = document.createElement("button");
    csvBtn.className = "btn-ghost btn-sm";
    csvBtn.innerText = "Download CSV";
    csvBtn.title = "Driver list (Name, Class, Transponder) for import into timing software";
    csvBtn.onclick = () => {
      const safeName = `${race.date} ${race.name}`.replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "-");
      downloadCsv(`${safeName}-drivers.csv`, driversCsv(byCategory));
    };
    listActions.appendChild(csvBtn);
    list.prepend(listActions);
  }

  // Track owner (race creator) or admin can delete the race
  if (canManage) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger btn-sm delete-race-btn";
    deleteBtn.innerText = "Delete race";
    deleteBtn.onclick = async () => {
      const warning = regs.length > 0 ? `\n\n${driverCount(regs.length)} registered will be removed.` : "";
      if (!confirm(`Delete "${race.name}"?${warning}`)) return;
      deleteBtn.disabled = true;
      try {
        await deleteRace(race.id, regs);
      } catch (err) {
        console.error(err);
        alert("Couldn't delete this race. Please try again.");
        deleteBtn.disabled = false;
        return;
      }
      await loadRacesView();
    };
    footer.appendChild(deleteBtn);
  }

  if (footer.children.length > 0) div.appendChild(footer);
  if (list) div.appendChild(list);

  return div;
}
