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
let currentUserTransponder = "";
let isAdmin = false;
let followedTrackIds = new Set();
let cachedTrackDocs = [];
let tracksViewCoords = null;

/* ---------------- UI Refs ---------------- */

const loadingArea = document.getElementById("loadingArea");
const authArea = document.getElementById("authArea");
const nameSetupArea = document.getElementById("nameSetupArea");
const appArea = document.getElementById("appArea");
const emailInput = document.getElementById("emailInput");
const sendLinkBtn = document.getElementById("sendLinkBtn");
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

sendLinkBtn.onclick = async () => {
  const email = emailInput.value.trim();
  if (!email) { alert("Enter your email"); return; }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  localStorage.setItem("emailForSignIn", email);
  loginStatus.innerText = "Login link sent. Check your email.";
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

  const userDoc = await getDoc(doc(db, "users", user.uid));
  currentUserName = userDoc.exists() ? userDoc.data().name : null;
  currentUserTransponder = userDoc.exists() ? userDoc.data().transponder ?? "" : "";

  if (!currentUserName) {
    nameSetupArea.classList.remove("hidden");
    appArea.classList.add("hidden");
    return;
  }

  nameSetupArea.classList.add("hidden");
  appArea.classList.remove("hidden");

  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  isAdmin = adminDoc.exists();
  if (isAdmin) await refreshPendingBadge();

  await loadFollowedTracks();
  showView("races");
});

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

  nameSetupArea.classList.add("hidden");
  appArea.classList.remove("hidden");

  const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
  isAdmin = adminDoc.exists();
  if (isAdmin) await refreshPendingBadge();

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

function setPendingBadge(count) {
  pendingBadge.innerText = count;
  pendingBadge.title = `${count} track${count === 1 ? "" : "s"} awaiting approval`;
  pendingBadge.classList.toggle("hidden", count === 0);
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

  // Heart button
  const heartBtn = document.createElement("button");
  heartBtn.className = "heart-btn" + (isFollowing ? " active" : "");
  heartBtn.innerHTML = "&#9829;";
  heartBtn.title = isFollowing ? "Unfollow" : "Follow";
  heartBtn.onclick = async () => {
    if (followedTrackIds.has(id)) {
      await deleteDoc(doc(db, "users", currentUser.uid, "following", id));
      followedTrackIds.delete(id);
      heartBtn.classList.remove("active");
      heartBtn.title = "Follow";
    } else {
      await setDoc(doc(db, "users", currentUser.uid, "following", id), {
        followedAt: serverTimestamp()
      });
      followedTrackIds.add(id);
      heartBtn.classList.add("active");
      heartBtn.title = "Unfollow";
    }
  };

  const headerText = document.createElement("div");
  headerText.className = "card-header-text";
  headerText.innerHTML = `
    <h3>${esc(t.name)}</h3>
    <div class="meta">
      ${esc(t.location)}
      ${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">Website</a>` : ""}
    </div>
    ${t.description ? `<p>${esc(t.description)}</p>` : ""}
  `;

  const cardHeader = document.createElement("div");
  cardHeader.className = "card-header";
  cardHeader.appendChild(headerText);
  cardHeader.appendChild(heartBtn);
  div.appendChild(cardHeader);

  // Owner: add race toggle
  if (isOwner) {
    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";

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

    btnRow.appendChild(addRaceBtn);
    div.appendChild(btnRow);
    div.appendChild(racePanel);
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
  racesContainer.innerHTML = "";

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

  races.sort((a, b) => a.date.localeCompare(b.date));

  const regSnaps = await Promise.all(
    races.map(race => getDocs(collection(db, "races", race.id, "registrations")))
  );

  races.forEach((race, i) => {
    const regs = [];
    regSnaps[i].forEach(d => regs.push({ ...d.data(), uid: d.id }));
    regs.sort((a, b) => (a.registeredAt?.toMillis() ?? 0) - (b.registeredAt?.toMillis() ?? 0));
    const myReg = regs.find(r => r.uid === currentUser.uid) ?? null;
    racesContainer.appendChild(buildRaceCard(race, regs, myReg));
  });
}

function driverCount(n) {
  return `${n} driver${n === 1 ? "" : "s"}`;
}

function buildRaceCard(race, regs, myReg) {
  const div = document.createElement("div");
  div.className = "card";

  // Group registrations by category, keeping the race's category order
  const byCategory = new Map(race.categories.map(c => [c.name, []]));
  regs.forEach(r => (r.categories ?? []).forEach(name => {
    if (!byCategory.has(name)) byCategory.set(name, []);
    byCategory.get(name).push(r);
  }));

  div.innerHTML = `
    <h3>${esc(race.name)}</h3>
    <div class="meta">
      ${esc(race.trackName)} · ${esc(race.date)} · ${driverCount(regs.length)} registered
    </div>
  `;

  let transponderInput = null;

  if (myReg) {
    const regInfo = document.createElement("div");
    regInfo.className = "reg-badge";
    regInfo.innerHTML = `✓ Registered: ${myReg.categories.map(esc).join(", ")}` +
      (myReg.transponder ? ` · Transponder ${esc(myReg.transponder)}` : "");
    div.appendChild(regInfo);

    const unregBtn = document.createElement("button");
    unregBtn.className = "btn-ghost btn-sm";
    unregBtn.innerText = "Unregister";
    unregBtn.onclick = async () => {
      if (!confirm("Unregister from this race?")) return;
      await deleteDoc(doc(db, "races", race.id, "registrations", currentUser.uid));
      await loadRacesView();
    };
    div.appendChild(unregBtn);

  } else {
    const transponderLabel = document.createElement("label");
    transponderLabel.className = "field-label";
    transponderLabel.innerText = "Transponder";
    div.appendChild(transponderLabel);

    transponderInput = document.createElement("input");
    transponderInput.type = "text";
    transponderInput.inputMode = "numeric";
    transponderInput.className = "transponder-input";
    transponderInput.placeholder = "Optional, e.g. 4821337";
    transponderInput.value = currentUserTransponder;
    div.appendChild(transponderInput);
  }

  // Category rows: name, driver count, and Register when not yet registered
  race.categories.forEach(cat => {
    const row = document.createElement("div");
    row.className = "btn-row cat-line";

    const catName = document.createElement("span");
    catName.className = "cat-name";
    catName.innerText = cat.name;

    const count = document.createElement("span");
    count.className = "count-pill";
    count.innerText = driverCount(byCategory.get(cat.name).length);

    row.appendChild(catName);
    row.appendChild(count);

    if (!myReg) {
      const regBtn = document.createElement("button");
      regBtn.className = "btn-primary btn-sm";
      regBtn.innerText = "Register";
      regBtn.onclick = async () => {
        const transponder = transponderInput.value.trim();
        await setDoc(doc(db, "races", race.id, "registrations", currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUserName,
          categories: [cat.name],
          transponder: transponder || null,
          registeredAt: serverTimestamp()
        });
        // Remember it to prefill the next registration
        if (transponder && transponder !== currentUserTransponder) {
          await setDoc(doc(db, "users", currentUser.uid), { transponder }, { merge: true });
          currentUserTransponder = transponder;
        }
        await loadRacesView();
      };
      row.appendChild(regBtn);
    }

    div.appendChild(row);
  });

  // Registered drivers list, collapsed by default
  if (regs.length > 0) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-ghost btn-sm drivers-toggle";
    toggleBtn.innerText = `Show drivers (${regs.length})`;

    const list = document.createElement("div");
    list.className = "drivers-list hidden";

    byCategory.forEach((drivers, name) => {
      if (drivers.length === 0) return;
      const group = document.createElement("div");
      group.className = "drivers-group";
      group.innerHTML = `
        <h4>${esc(name)} · ${drivers.length}</h4>
        <ol>
          ${drivers.map(r => `
            <li>
              ${esc(r.name || "Unnamed driver")}${r.uid === currentUser.uid ? ' <span class="you-tag">you</span>' : ""}
              ${r.transponder ? `<span class="transponder">#${esc(r.transponder)}</span>` : ""}
            </li>`).join("")}
        </ol>
      `;
      list.appendChild(group);
    });

    toggleBtn.onclick = () => {
      const hidden = list.classList.toggle("hidden");
      toggleBtn.innerText = `${hidden ? "Show" : "Hide"} drivers (${regs.length})`;
    };

    div.appendChild(toggleBtn);
    div.appendChild(list);
  }

  return div;
}
