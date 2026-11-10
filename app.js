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
  deleteField,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { lang, isRtl, t, formatDate, formatNumber } from "./i18n.js";

/* ---------------- Firebase Config ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyA_GV9AePORn27qXFV38lHibNPGWklVlF0",
  authDomain: "rc-grid-faae7.firebaseapp.com",
  projectId: "rc-grid-faae7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Google's sign-in popup and the sign-in email follow the app's language
auth.languageCode = lang;
// iOS Safari often can't hold Firestore's streaming connection (Private Relay, content
// blockers, some networks); auto-detecting that took 10–30s per load, so always long-poll.
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

await setPersistence(auth, browserLocalPersistence);

/* ---------------- State ---------------- */

let currentUser = null;
let currentProfile = null;   // { firstName, lastName, nickname } from users/{uid}
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
  "auth/popup-blocked": "popupBlocked",
  "auth/account-exists-with-different-credential": "accountExists",
  "auth/network-request-failed": "networkError",
  "auth/unauthorized-domain": "unauthorizedDomain",
  "auth/operation-not-allowed": "googleNotEnabled"
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
      loginStatus.innerText = t(googleSignInErrors[err.code] ?? "googleFailed");
    }
  } finally {
    googleSignInBtn.disabled = false;
  }
};

const sendLinkErrors = {
  "auth/quota-exceeded": "quotaExceeded",
  "auth/invalid-email": "invalidEmail",
  "auth/missing-email": "enterEmail",
  "auth/network-request-failed": "networkError",
  "auth/too-many-requests": "tooManyRequests"
};

sendLinkBtn.onclick = async () => {
  const email = emailInput.value.trim();
  if (!email) { alert(t("enterEmail")); return; }

  sendLinkBtn.disabled = true;
  loginStatus.classList.remove("error");
  loginStatus.innerText = t("sending");
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  } catch (err) {
    console.error(err);
    loginStatus.classList.add("error");
    loginStatus.innerText = t(sendLinkErrors[err.code] ?? "sendFailed");
    return;
  } finally {
    sendLinkBtn.disabled = false;
  }

  localStorage.setItem("emailForSignIn", email);
  loginStatus.innerHTML = t("linkSent", esc(email), `noreply@${firebaseConfig.authDomain}`);
};

if (isSignInWithEmailLink(auth, window.location.href)) {
  // Skip if a saved session already exists (e.g. reloading a used link)
  await auth.authStateReady();
  if (!auth.currentUser) {
    const email = localStorage.getItem("emailForSignIn") || prompt(t("confirmEmail"));
    if (email) {
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        localStorage.removeItem("emailForSignIn");
      } catch (err) {
        console.error(err);
        loginStatus.innerText = t("linkInvalid");
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
    currentProfile = null;
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
  const data = userDoc.exists() ? userDoc.data() : {};
  currentProfile = profileFrom(data);
  currentUserTransponder = data.transponder ?? "";

  // New users, and profiles from before first/last names, fill in the name form first
  if (!data.firstName || !data.lastName) {
    nameSetupArea.classList.remove("hidden");
    // Suggest the old single name, or the Google account's name, split at the first space
    fillNameFields("setup", {
      ...splitName(data.name || user.displayName),
      nickname: data.nickname ?? ""
    });
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
  updateProfileButton();
  showView("races");
}

function showStartupError() {
  loadingArea.classList.remove("hidden");
  loadingArea.innerHTML = `
    <div class="empty-state">
      <p>${t("connectError")}</p>
      <button class="btn-primary btn-sm" onclick="location.reload()">${t("retry")}</button>
    </div>`;
}

logoutBtn.onclick = () => {
  closeProfileMenu();
  localStorage.removeItem("rcgrid_location");
  signOut(auth);
};

/* ---------------- Profile Menu ---------------- */

const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const profileModal = document.getElementById("profileModal");
const profileStatus = document.getElementById("profileStatus");

function updateProfileButton() {
  const shown = displayName(currentProfile);
  const name = shown || currentUser?.email || "";
  document.getElementById("profileInitial").innerText = name.trim().charAt(0).toUpperCase() || "?";
  document.getElementById("profileName").innerText = shown;
}

function closeProfileMenu() {
  profileDropdown.classList.add("hidden");
  profileBtn.setAttribute("aria-expanded", "false");
}

profileBtn.onclick = e => {
  e.stopPropagation();
  const open = profileDropdown.classList.toggle("hidden") === false;
  profileBtn.setAttribute("aria-expanded", String(open));
};

// Close the menu on any outside click or Escape
document.addEventListener("click", e => {
  if (!profileDropdown.contains(e.target)) closeProfileMenu();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  closeProfileMenu();
  profileModal.classList.add("hidden");
});

document.getElementById("openProfileBtn").onclick = () => {
  closeProfileMenu();
  fillNameFields("profile", currentProfile);
  document.getElementById("profileEmail").innerText = currentUser.email ?? "";
  profileStatus.classList.remove("error");
  profileStatus.innerText = "";
  profileModal.classList.remove("hidden");
  document.getElementById("profileFirstName").focus();
};

document.getElementById("cancelProfileBtn").onclick = () => profileModal.classList.add("hidden");
profileModal.onclick = e => {
  if (e.target === profileModal) profileModal.classList.add("hidden");
};

const saveProfile = async () => {
  if (await saveNameFields("profile", profileStatus, document.getElementById("saveProfileBtn"))) {
    updateProfileButton();
    profileModal.classList.add("hidden");
    // Show the new name in the driver lists
    if (!racesView.classList.contains("hidden")) loadRacesView();
  }
};
document.getElementById("saveProfileBtn").onclick = saveProfile;
profileModal.querySelectorAll("input").forEach(input => {
  input.onkeydown = e => { if (e.key === "Enter") saveProfile(); };
});

/* ---------------- Name Setup ---------------- */

const saveNameSetup = async () => {
  const status = document.getElementById("nameSetupStatus");
  if (await saveNameFields("setup", status, document.getElementById("saveNameBtn"))) enterApp();
};
document.getElementById("saveNameBtn").onclick = saveNameSetup;
nameSetupArea.querySelectorAll("input").forEach(input => {
  input.onkeydown = e => { if (e.key === "Enter") saveNameSetup(); };
});

/* ---------------- Driver Names ----------------
 * users/{uid} and registrations hold firstName, lastName and an optional nickname, plus
 * `name` (the full name) for older readers. Lists show the nickname when there is one.
 */

function splitName(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

// Older docs only have `name`: split it at the first space
function profileFrom(data) {
  if (!data) return { firstName: "", lastName: "", nickname: "" };
  const split = data.firstName ? { firstName: data.firstName, lastName: data.lastName ?? "" } : splitName(data.name);
  return { ...split, nickname: data.nickname ?? "" };
}

function fullName(data) {
  const p = profileFrom(data);
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}

function displayName(data) {
  return profileFrom(data).nickname || fullName(data);
}

// Name fields on the registration doc, copied from the current profile
function profileFields() {
  return {
    firstName: currentProfile.firstName,
    lastName: currentProfile.lastName,
    nickname: currentProfile.nickname || null,
    name: fullName(currentProfile)
  };
}

// The onboarding screen and Profile dialog share a field layout: <prefix>FirstName etc.
function fillNameFields(prefix, profile) {
  document.getElementById(`${prefix}FirstName`).value = profile?.firstName ?? "";
  document.getElementById(`${prefix}LastName`).value = profile?.lastName ?? "";
  document.getElementById(`${prefix}Nickname`).value = profile?.nickname ?? "";
}

// Validate and save to users/{uid}; returns true on success
async function saveNameFields(prefix, statusEl, saveBtn) {
  const profile = {
    firstName: document.getElementById(`${prefix}FirstName`).value.trim().replace(/\s+/g, " "),
    lastName: document.getElementById(`${prefix}LastName`).value.trim().replace(/\s+/g, " "),
    nickname: document.getElementById(`${prefix}Nickname`).value.trim().replace(/\s+/g, " ")
  };
  statusEl.classList.remove("error");
  statusEl.innerText = "";
  if (!profile.firstName || !profile.lastName) {
    statusEl.classList.add("error");
    statusEl.innerText = t("nameRequired");
    return false;
  }

  saveBtn.disabled = true;
  try {
    await setDoc(doc(db, "users", currentUser.uid), {
      firstName: profile.firstName,
      lastName: profile.lastName,
      nickname: profile.nickname || null,
      name: fullName(profile)
    }, { merge: true });
  } catch (err) {
    console.error(err);
    statusEl.classList.add("error");
    statusEl.innerText = t("saveFailed");
    return false;
  } finally {
    saveBtn.disabled = false;
  }
  currentProfile = profile;

  // The profile is saved either way; a failed sync just leaves the old name on some entries
  try {
    await syncMyRegistrations();
  } catch (err) {
    console.error(err);
  }
  return true;
}

// Registrations copy the driver's name, so carry a change over to upcoming races.
// Past races keep the name used at the time.
async function syncMyRegistrations() {
  const races = await getDocs(query(collection(db, "races"), where("date", ">=", localDateString())));
  const regs = await Promise.all(
    races.docs.map(r => getDoc(doc(db, "races", r.id, "registrations", currentUser.uid)))
  );
  const mine = regs.filter(r => r.exists());
  if (mine.length === 0) return;
  const batch = writeBatch(db);
  mine.forEach(r => batch.update(r.ref, profileFields()));
  await batch.commit();
}

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
  pendingBadge.title = t("pendingTitle", count);
  pendingBadge.classList.toggle("hidden", count === 0);
}

// Rough distance from the viewer, e.g. "12 km"; null if either location is unknown
function distanceLabel(track) {
  if (!tracksViewCoords || track.lat == null || track.lng == null) return null;
  const km = haversineDistance(tracksViewCoords.lat, tracksViewCoords.lng, track.lat, track.lng);
  return km < 1 ? t("underOneKm") : t("km", formatNumber(Math.round(km)));
}

function showLoading(container, text) {
  container.innerHTML = `<div class="loading-state">${text}</div>`;
}

function showLoadError(container, message, retry) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "empty-state";
  box.innerHTML = `<p>${message}</p>`;
  const retryBtn = document.createElement("button");
  retryBtn.className = "btn-primary btn-sm";
  retryBtn.innerText = t("retry");
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
  showLoading(tracksContainer, t("loadingTracks"));
  try {
    await renderTracks();
  } catch (err) {
    console.error(err);
    showLoadError(tracksContainer, t("loadTracksError"), loadTracksView);
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
    const track = d.data();
    return !term ||
      track.name.toLowerCase().includes(term) ||
      track.location.toLowerCase().includes(term) ||
      (track.description && track.description.toLowerCase().includes(term));
  });

  if (filtered.length === 0) {
    tracksContainer.innerHTML = `<div class="empty-state"><p>${t("noTracks")}</p></div>`;
    return;
  }

  // Your own tracks first; within each group nearest first (no location last), then by name
  const distance = track => tracksViewCoords && track.lat != null
    ? haversineDistance(tracksViewCoords.lat, tracksViewCoords.lng, track.lat, track.lng)
    : Infinity;
  filtered.sort((a, b) => {
    const ta = a.data(), tb = b.data();
    const ownA = ta.createdBy === currentUser.uid, ownB = tb.createdBy === currentUser.uid;
    if (ownA !== ownB) return ownA ? -1 : 1;
    const da = distance(ta), db_ = distance(tb);
    if (da !== db_) return da - db_;
    return ta.name.localeCompare(tb.name);
  });

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
  const track = trackDoc.data();
  const id = trackDoc.id;
  const isOwner = track.createdBy === currentUser.uid;
  const isFollowing = followedTrackIds.has(id);
  const href = safeHref(track.website);

  const div = document.createElement("div");
  div.className = isOwner ? "card owned" : "card";

  // Follow button: following a track shows its races in the Races view
  const followBtn = document.createElement("button");
  followBtn.className = "btn-sm follow-btn";
  const setFollowState = following => {
    followBtn.classList.toggle("following", following);
    followBtn.innerHTML = following
      ? `<span class="when-idle">${t("following")}</span><span class="when-hover">${t("unfollow")}</span>`
      : t("follow");
    followBtn.title = t(following ? "unfollowTitle" : "followTitle");
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
    <h3>${isOwner ? `<span class="owner-star" title="${t("yourTrack")}" aria-label="${t("yourTrack")}">★</span>` : ""}${esc(track.name)}</h3>
    <div class="meta">
      ${esc(track.location)}
      ${distanceLabel(track) ? ` · ${distanceLabel(track)}` : ""}
      ${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">${t("website")}</a>` : ""}
    </div>
    ${track.description ? `<p>${esc(track.description)}</p>` : ""}
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
    deleteBtn.innerText = t("deleteTrack");
    deleteBtn.onclick = async () => {
      deleteBtn.disabled = true;
      try {
        const raceSnap = await getDocs(query(collection(db, "races"), where("trackId", "==", id)));
        const raceDocs = raceSnap.docs;
        if (!confirm(t("deleteTrackConfirm", track.name, raceDocs.length))) {
          deleteBtn.disabled = false;
          return;
        }
        await deleteTrack(id, raceDocs);
      } catch (err) {
        console.error(err);
        alert(t("deleteTrackFailed"));
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
    addRaceBtn.innerText = t("addRace");

    const racePanel = document.createElement("div");
    racePanel.className = "race-panel hidden";

    addRaceBtn.onclick = async () => {
      if (racePanel.classList.contains("hidden")) {
        racePanel.classList.remove("hidden");
        await buildRacePanel(id, track.name, track.lat ?? null, track.lng ?? null, racePanel);
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
  const track = trackDoc.data();
  const id = trackDoc.id;

  const div = document.createElement("div");
  div.className = "card pending";
  div.innerHTML = `
    <b>${esc(track.name)}</b> · ${esc(track.location)}
    ${track.description ? `<br><small>${esc(track.description)}</small>` : ""}
  `;

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";

  const approveBtn = document.createElement("button");
  approveBtn.className = "btn-primary btn-sm";
  approveBtn.innerText = t("approve");
  approveBtn.onclick = async () => {
    await updateDoc(doc(db, "tracks", id), { status: "approved" });
    await loadTracksView();
  };

  const rejectBtn = document.createElement("button");
  rejectBtn.className = "btn-danger btn-sm";
  rejectBtn.innerText = t("reject");
  rejectBtn.onclick = async () => {
    if (!confirm(t("rejectConfirm", track.name))) return;
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

  if (!name || !location) { alert(t("nameLocationRequired")); return; }

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

  alert(t("trackSubmitted"));
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
  formTitle.innerText = t("createRace");
  container.appendChild(formTitle);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = t("raceName");
  container.appendChild(nameInput);
  container.appendChild(document.createElement("br"));

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  container.appendChild(dateInput);
  container.appendChild(document.createElement("br"));

  // Categories
  const catsLabel = document.createElement("p");
  catsLabel.innerText = t("categoriesLabel");
  container.appendChild(catsLabel);

  const catsDiv = document.createElement("div");
  container.appendChild(catsDiv);

  function addCategoryRow() {
    const row = document.createElement("div");
    row.className = "cat-row";

    const nameIn = document.createElement("input");
    nameIn.type = "text";
    nameIn.placeholder = t("categoryPlaceholder");

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
  addCatBtn.innerText = t("addCategory");
  addCatBtn.onclick = addCategoryRow;
  container.appendChild(addCatBtn);
  container.appendChild(document.createElement("br"));

  const createRaceBtn = document.createElement("button");
  createRaceBtn.className = "btn-primary btn-sm";
  createRaceBtn.innerText = t("createRace");
  createRaceBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const date = dateInput.value;

    if (!name || !date) { alert(t("nameDateRequired")); return; }

    const categories = [];
    catsDiv.querySelectorAll(".cat-row").forEach(row => {
      const catName = row.querySelector("input[type=text]").value.trim();
      if (catName) categories.push({ name: catName });
    });

    if (categories.length === 0) { alert(t("addOneCategory")); return; }

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
    listTitle.innerText = t("existingRaces");
    container.appendChild(listTitle);

    const races = [];
    snap.forEach(d => races.push({ id: d.id, ...d.data() }));
    races.sort((a, b) => a.date.localeCompare(b.date));

    races.forEach(r => {
      const item = document.createElement("div");
      item.innerHTML = `<b>${esc(r.name)}</b> — ${esc(formatDate(r.date))}
        <span class="meta"> · ${r.categories.map(c => esc(c.name)).join(", ")}</span>`;
      container.appendChild(item);
    });
  }
}

/* ---------------- Races View ---------------- */

async function loadRacesView() {
  showLoading(racesContainer, t("loadingRaces"));
  try {
    await renderRaces();
  } catch (err) {
    console.error(err);
    showLoadError(racesContainer, t("loadRacesError"), loadRacesView);
  }
}

async function renderRaces() {
  await startupDataReady();

  if (followedTrackIds.size === 0) {
    racesContainer.innerHTML = `<div class="empty-state"><p>${t("followToSee")}</p></div>`;
    return;
  }

  const trackIds = [...followedTrackIds];
  const snap = await getDocs(
    query(collection(db, "races"), where("trackId", "in", trackIds))
  );

  if (snap.empty) {
    racesContainer.innerHTML = `<div class="empty-state"><p>${t("noRacesYet")}</p></div>`;
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
    racesContainer.innerHTML = `<div class="empty-state"><p>${t("noUpcoming")}</p></div>`;
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
      pastToggle.innerText = `${open ? "▾" : isRtl ? "◂" : "▸"} ${t("pastRaces", past.length)}`;
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
    // email: registrations are readable by every signed-in user, so older docs drop it
    await updateDoc(ref, { entries, ...profileFields(), email: deleteField() });
  } else {
    await setDoc(ref, {
      uid: currentUser.uid,
      ...profileFields(),
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

// "dana  LEVI" -> "Dana Levi", "noa ben-david" -> "Noa Ben-David", so timing software
// doesn't treat differently-cased entries as different drivers
function normalizeName(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// LiveRC / LiveTime driver import: every column of LiveRC's registration export, in its
// order (the importer expects the full layout), one row per driver per class
const LIVERC_COLUMNS = [
  "FirstName", "LastName", "NickName", "PhoneticName", "Ability", "ClassName", "IsPaid",
  "PillNumber", "LocalRegisteredDateTime", "RegistrationNumber", "Region", "FrameNumber",
  "PermanentNumber", "PrimaryColor", "SecondaryColor", "Manufacturer", "ChassisManufacturer",
  "ModelName", "ModelYear", "TransponderNumber", "CarID", "GPSTransponderNumber", "SponsorName",
  "Email", "PhoneNumber", "Birthday", "Category", "Gender", "Address1", "Address2", "City",
  "State", "ZipCode", "Country", "Hometown", "BRCARank", "BRCAFormulaGrade", "BRCARegion",
  "EFRAAbility", "ClubName", "ClubRegion", "AmericanMotorcyclistAssociationNumber",
  "AmericanMotorcyclistAssociationExpirationDate", "AcademyOfModelAeronauticsNumber",
  "AcademyOfModelAeronauticsExpirationDate", "HAMCallSign", "FAANumber", "LocalMembershipType",
  "LocalMembershipCode", "LocalMembershipExpirationDate"
];

function driversCsv(byCategory) {
  const cell = v => {
    const str = String(v ?? "");
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const rows = [LIVERC_COLUMNS];
  byCategory.forEach((drivers, category) => {
    drivers.forEach(d => {
      const p = profileFrom(d.reg);
      const values = {
        FirstName: normalizeName(p.firstName),
        LastName: normalizeName(p.lastName),
        NickName: p.nickname,
        ClassName: category,
        IsPaid: "False",   // as in LiveRC's own export; payment is handled at the track
        TransponderNumber: d.transponder || ""
      };
      rows.push(LIVERC_COLUMNS.map(col => values[col] ?? ""));
    });
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

// Green "✓ Registered ▾" button; its menu holds Unregister
function buildRegisteredMenu(onUnregister) {
  const wrap = document.createElement("div");
  wrap.className = "reg-menu";

  const btn = document.createElement("button");
  btn.className = "btn-sm reg-btn";
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `${t("registered")}<span class="caret">▾</span>`;

  const menu = document.createElement("div");
  menu.className = "dropdown hidden";
  menu.setAttribute("role", "menu");

  const unregisterBtn = document.createElement("button");
  unregisterBtn.className = "danger";
  unregisterBtn.setAttribute("role", "menuitem");
  unregisterBtn.innerText = t("unregister");
  unregisterBtn.onclick = () => {
    closeRegMenus();
    onUnregister();
  };
  menu.appendChild(unregisterBtn);

  btn.onclick = e => {
    e.stopPropagation();
    const wasOpen = !menu.classList.contains("hidden");
    closeRegMenus();
    if (!wasOpen) {
      menu.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
    }
  };

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  return wrap;
}

function closeRegMenus() {
  document.querySelectorAll(".reg-menu .dropdown:not(.hidden)").forEach(menu => {
    menu.classList.add("hidden");
    menu.previousElementSibling.setAttribute("aria-expanded", "false");
  });
}
document.addEventListener("click", closeRegMenus);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeRegMenus(); });

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
    byCategory.get(e.category).push({ uid: r.uid, name: displayName(r), transponder: e.transponder, reg: r });
  }));

  div.innerHTML = `
    <h3>${esc(race.name)}</h3>
    <div class="meta">
      ${esc(race.trackName)} · ${esc(formatDate(race.date))} · ${t("registeredCount", regs.length)}
    </div>
  `;

  // Categories sit in their own inset pane, apart from the title and footer
  const catList = document.createElement("div");
  catList.className = "cat-list";
  div.appendChild(catList);

  race.categories.forEach(cat => {
    const myEntry = myEntries.find(e => e.category === cat.name);

    const row = document.createElement("div");
    row.className = "cat-line";

    const head = document.createElement("div");
    head.className = "btn-row cat-head";

    const catName = document.createElement("div");
    catName.className = "cat-name";
    catName.innerHTML = `${esc(cat.name)}<div class="cat-meta">${t("drivers", byCategory.get(cat.name).length)}</div>`;
    head.appendChild(catName);

    row.appendChild(head);

    // Registration is closed once the race date has passed: just show the status
    if (isPast) {
      if (myEntry) {
        const tag = document.createElement("span");
        tag.className = "reg-tag";
        tag.innerText = t("registered");
        head.appendChild(tag);
      }
      catList.appendChild(row);
      return;
    }

    if (myEntry) {
      head.appendChild(buildRegisteredMenu(async () => {
        await saveMyEntries(race, myReg, myEntries.filter(e => e.category !== cat.name));
        await loadRacesView();
      }));
    } else {
      const actionBtn = document.createElement("button");
      actionBtn.className = "btn-primary btn-sm";
      actionBtn.innerText = t("register");
      head.appendChild(actionBtn);

      // Inline form: ask for this category's transponder before registering
      const form = document.createElement("div");
      form.className = "reg-form hidden";

      const transponderInput = document.createElement("input");
      transponderInput.type = "text";
      transponderInput.inputMode = "numeric";
      transponderInput.placeholder = t("transponderPlaceholder");
      transponderInput.value = currentUserTransponder;

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "btn-primary btn-sm";
      confirmBtn.innerText = t("confirm");

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-secondary btn-sm";
      cancelBtn.innerText = t("cancel");

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

    catList.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "btn-row card-footer";
  let list = null;

  // Registered drivers list, collapsed by default
  if (regs.length > 0) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-ghost btn-sm";
    toggleBtn.innerText = t("showDrivers", regs.length);

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
          ${esc(d.name || t("unnamedDriver"))}${d.uid === currentUser.uid ? ` <span class="you-tag">${t("you")}</span>` : ""}
          ${d.transponder ? `<span class="transponder" dir="ltr">#${esc(d.transponder)}</span>` : ""}
        `;

        if (canManage) {
          const removeBtn = document.createElement("button");
          removeBtn.className = "remove-driver-btn";
          removeBtn.innerText = "×";
          removeBtn.title = t("removeFrom", name);
          removeBtn.onclick = async () => {
            if (!confirm(t("removeConfirm", d.name || t("thisDriver"), name))) return;
            removeBtn.disabled = true;
            try {
              await removeDriverEntry(race.id, d.reg, name);
            } catch (err) {
              console.error(err);
              alert(t("removeFailed"));
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
      toggleBtn.innerText = t(hidden ? "showDrivers" : "hideDrivers", regs.length);
    };

    footer.appendChild(toggleBtn);

    const listActions = document.createElement("div");
    listActions.className = "drivers-list-actions";
    listActions.innerHTML = `<span>${t("registeredDrivers")}</span>`;

    const csvBtn = document.createElement("button");
    csvBtn.className = "btn-ghost btn-sm";
    csvBtn.innerText = t("downloadCsv");
    csvBtn.title = t("csvTitle");
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
    deleteBtn.innerText = t("deleteRace");
    deleteBtn.onclick = async () => {
      if (!confirm(t("deleteRaceConfirm", race.name, regs.length))) return;
      deleteBtn.disabled = true;
      try {
        await deleteRace(race.id, regs);
      } catch (err) {
        console.error(err);
        alert(t("deleteRaceFailed"));
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
