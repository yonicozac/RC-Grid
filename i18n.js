/* ---------------- Localization ----------------
 * English, Hebrew and French. Hebrew is the default for devices set to Hebrew or to Israel's
 * time zone; everyone else gets English. French is never picked automatically.
 * The choice is stored on the device only (localStorage), not on the user's record.
 * Loaded as its own <script> before app.js so the page is translated while Firebase loads.
 */

const LANGS = {
  en: { label: "English", code: "EN", dir: "ltr", locale: "en-GB" },
  he: { label: "עברית", code: "HE", dir: "rtl", locale: "he-IL" },
  fr: { label: "Français", code: "FR", dir: "ltr", locale: "fr-FR" }
};

const STORAGE_KEY = "rcgrid_lang";

const strings = {
  en: {
    loading: "Loading…",
    signIn: "Sign in",
    signInIntro: "Use your Google account, or get a sign-in link by email.",
    continueGoogle: "Continue with Google",
    or: "or",
    sendLink: "Send Login Link",
    welcome: "Welcome!",
    whatName: "What's your name?",
    firstName: "First name",
    lastName: "Last name",
    nicknameOptional: "Nickname (optional)",
    nicknameHint: "Shown in driver lists instead of your name.",
    nameRequired: "First and last name are required.",
    continue: "Continue",
    races: "Races",
    tracks: "Tracks",
    account: "Account",
    profile: "Profile",
    logout: "Log out",
    language: "Language",
    pendingApprovals: "Pending Track Approvals",
    newTrack: "+ New Track",
    submitNewTrack: "Submit New Track",
    trackName: "Track name",
    location: "Location",
    websiteOptional: "Website (optional)",
    descriptionOptional: "Description (optional)",
    submitForApproval: "Submit for Approval",
    cancel: "Cancel",
    searchTracks: "Search tracks by name, location…",
    upcomingRaces: "Upcoming Races",
    footerQuestions: "Questions or feedback?",
    contactSupport: "Contact support",
    email: "Email",
    save: "Save",

    popupBlocked: "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
    accountExists: "This email already signs in with an email link. Use the email option below.",
    networkError: "Couldn't reach the server. Check your connection and try again.",
    unauthorizedDomain: "Google sign-in isn't enabled for this address yet.",
    googleNotEnabled: "Google sign-in isn't enabled yet.",
    googleFailed: "Google sign-in didn't work here. If you opened this page from an email or chat app, open it in Safari or Chrome instead.",
    quotaExceeded: "Too many sign-in emails were sent today. Please try again tomorrow.",
    invalidEmail: "That email address doesn't look right. Please check it and try again.",
    enterEmail: "Enter your email",
    tooManyRequests: "Too many attempts. Please wait a few minutes and try again.",
    sendFailed: "Couldn't send the login link. Please try again later.",
    sending: "Sending…",
    linkSent: (email, sender) => `Login link sent to <b><bdi>${email}</bdi></b>.<br>
      Can't find it? Check your spam folder. It comes from
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "Confirm your email",
    linkInvalid: "This login link is invalid or has expired. Please request a new one.",
    connectError: "Couldn't connect. Check your connection and try again.",
    retry: "Retry",
    saveFailed: "Couldn't save. Please try again.",
    pendingTitle: n => `${n} track${n === 1 ? "" : "s"} awaiting approval`,
    km: n => `${n} km`,
    underOneKm: "< 1 km",
    loadingTracks: "Loading tracks…",
    loadingRaces: "Loading races…",
    loadTracksError: "Couldn't load tracks. Check your connection and try again.",
    loadRacesError: "Couldn't load races. Check your connection and try again.",
    noTracks: "No tracks found.",
    follow: "Follow",
    following: "✓ Following",
    unfollow: "Unfollow",
    followTitle: "See this track's races in Races",
    unfollowTitle: "Stop seeing this track's races",
    website: "Website",
    yourTrack: "Your track",
    deleteTrack: "Delete track",
    deleteTrackConfirm: (name, raceCount) => `Delete track "${name}"?` + (raceCount > 0
      ? `\n\nThis also deletes its ${raceCount} race${raceCount === 1 ? "" : "s"} and all their registrations.`
      : ""),
    deleteTrackFailed: "Couldn't delete this track. Please try again.",
    addRace: "Add Race",
    approve: "Approve",
    reject: "Reject",
    rejectConfirm: name => `Reject and delete track "${name}"?`,
    nameLocationRequired: "Name and location are required",
    trackSubmitted: "Track submitted for approval!",
    createRace: "Create Race",
    raceName: "Race name",
    categoriesLabel: "Categories:",
    categoryPlaceholder: "Category name (e.g. 2WD Buggy)",
    addCategory: "+ Add Category",
    nameDateRequired: "Name and date are required",
    addOneCategory: "Add at least one category",
    existingRaces: "Existing Races",
    followToSee: "Follow some tracks to see their races here.",
    noRacesYet: "No races scheduled for your followed tracks yet.",
    noUpcoming: "No upcoming races for your followed tracks.",
    pastRaces: n => `Past races (${n})`,
    drivers: n => `${n} driver${n === 1 ? "" : "s"}`,
    registeredCount: n => `${n} driver${n === 1 ? "" : "s"} registered`,
    registered: "✓ Registered",
    register: "Register",
    unregister: "Unregister",
    unregisterConfirm: category => `Unregister from ${category}?`,
    transponderPlaceholder: "Transponder # (optional)",
    confirm: "Confirm",
    showDrivers: n => `Show drivers (${n})`,
    hideDrivers: n => `Hide drivers (${n})`,
    unnamedDriver: "Unnamed driver",
    you: "you",
    removeFrom: category => `Remove from ${category}`,
    removeConfirm: (name, category) => `Remove ${name} from ${category}?`,
    thisDriver: "this driver",
    removeFailed: "Couldn't remove this driver. Please try again.",
    registeredDrivers: "Registered drivers",
    downloadCsv: "Download CSV",
    csvTitle: "Driver list (Name, Class, Transponder) for import into timing software",
    deleteRace: "Delete race",
    deleteRaceConfirm: (name, regCount) => `Delete "${name}"?` + (regCount > 0
      ? `\n\n${regCount} driver${regCount === 1 ? "" : "s"} registered will be removed.`
      : ""),
    deleteRaceFailed: "Couldn't delete this race. Please try again."
  },

  he: {
    loading: "טוען…",
    signIn: "התחברות",
    signInIntro: "התחברו עם חשבון Google, או קבלו קישור התחברות במייל.",
    continueGoogle: "המשך עם Google",
    or: "או",
    sendLink: "שליחת קישור התחברות",
    welcome: "ברוכים הבאים!",
    whatName: "מה השם שלך?",
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    nicknameOptional: "כינוי (לא חובה)",
    nicknameHint: "יוצג ברשימות הנהגים במקום השם שלך.",
    nameRequired: "שם פרטי ושם משפחה הם שדות חובה.",
    continue: "המשך",
    races: "תחרויות",
    tracks: "מסלולים",
    account: "חשבון",
    profile: "פרופיל",
    logout: "התנתקות",
    language: "שפה",
    pendingApprovals: "מסלולים שממתינים לאישור",
    newTrack: "+ מסלול חדש",
    submitNewTrack: "הוספת מסלול חדש",
    trackName: "שם המסלול",
    location: "מיקום",
    websiteOptional: "אתר (לא חובה)",
    descriptionOptional: "תיאור (לא חובה)",
    submitForApproval: "שליחה לאישור",
    cancel: "ביטול",
    searchTracks: "חיפוש מסלולים לפי שם או מיקום…",
    upcomingRaces: "תחרויות קרובות",
    footerQuestions: "שאלות או משוב?",
    contactSupport: "צרו קשר",
    email: "אימייל",
    save: "שמירה",

    popupBlocked: "הדפדפן חסם את חלון ההתחברות של Google. אפשרו חלונות קופצים באתר הזה ונסו שוב.",
    accountExists: "כתובת המייל הזו כבר מתחברת באמצעות קישור במייל. השתמשו באפשרות המייל למטה.",
    networkError: "אין חיבור לשרת. בדקו את החיבור ונסו שוב.",
    unauthorizedDomain: "ההתחברות עם Google עדיין לא מופעלת בכתובת הזו.",
    googleNotEnabled: "ההתחברות עם Google עדיין לא מופעלת.",
    googleFailed: "ההתחברות עם Google לא עבדה כאן. אם פתחתם את הדף מתוך אפליקציית מייל או צ׳אט, פתחו אותו ב-Safari או ב-Chrome.",
    quotaExceeded: "נשלחו היום יותר מדי מיילים להתחברות. נסו שוב מחר.",
    invalidEmail: "כתובת המייל לא נראית תקינה. בדקו אותה ונסו שוב.",
    enterEmail: "הזינו כתובת מייל",
    tooManyRequests: "יותר מדי ניסיונות. המתינו כמה דקות ונסו שוב.",
    sendFailed: "לא הצלחנו לשלוח את קישור ההתחברות. נסו שוב מאוחר יותר.",
    sending: "שולח…",
    linkSent: (email, sender) => `קישור התחברות נשלח אל <b><bdi>${email}</bdi></b>.<br>
      לא מוצאים אותו? בדקו בתיקיית הספאם. הוא נשלח מהכתובת
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "אשרו את כתובת המייל שלכם",
    linkInvalid: "קישור ההתחברות לא תקף או שפג תוקפו. בקשו קישור חדש.",
    connectError: "אין חיבור. בדקו את החיבור ונסו שוב.",
    retry: "נסו שוב",
    saveFailed: "השמירה לא הצליחה. נסו שוב.",
    pendingTitle: n => n === 1 ? "מסלול אחד ממתין לאישור" : `${n} מסלולים ממתינים לאישור`,
    km: n => `${n} ק״מ`,
    underOneKm: "פחות מק״מ",
    loadingTracks: "טוען מסלולים…",
    loadingRaces: "טוען תחרויות…",
    loadTracksError: "לא הצלחנו לטעון את המסלולים. בדקו את החיבור ונסו שוב.",
    loadRacesError: "לא הצלחנו לטעון את התחרויות. בדקו את החיבור ונסו שוב.",
    noTracks: "לא נמצאו מסלולים.",
    follow: "מעקב",
    following: "✓ במעקב",
    unfollow: "הפסקת מעקב",
    followTitle: "הצגת התחרויות של המסלול בעמוד התחרויות",
    unfollowTitle: "הפסקת הצגת התחרויות של המסלול",
    website: "אתר",
    yourTrack: "המסלול שלך",
    deleteTrack: "מחיקת מסלול",
    deleteTrackConfirm: (name, raceCount) => `למחוק את המסלול "${name}"?` + (raceCount > 0
      ? `\n\nפעולה זו תמחק גם ${raceCount === 1 ? "את התחרות שלו" : `את ${raceCount} התחרויות שלו`} ואת כל ההרשמות.`
      : ""),
    deleteTrackFailed: "לא הצלחנו למחוק את המסלול. נסו שוב.",
    addRace: "הוספת תחרות",
    approve: "אישור",
    reject: "דחייה",
    rejectConfirm: name => `לדחות ולמחוק את המסלול "${name}"?`,
    nameLocationRequired: "שם ומיקום הם שדות חובה",
    trackSubmitted: "המסלול נשלח לאישור!",
    createRace: "יצירת תחרות",
    raceName: "שם התחרות",
    categoriesLabel: "קטגוריות:",
    categoryPlaceholder: "שם הקטגוריה (למשל 2WD Buggy)",
    addCategory: "+ הוספת קטגוריה",
    nameDateRequired: "שם ותאריך הם שדות חובה",
    addOneCategory: "הוסיפו לפחות קטגוריה אחת",
    existingRaces: "תחרויות קיימות",
    followToSee: "עקבו אחרי מסלולים כדי לראות כאן את התחרויות שלהם.",
    noRacesYet: "עדיין אין תחרויות במסלולים שאתם עוקבים אחריהם.",
    noUpcoming: "אין תחרויות קרובות במסלולים שאתם עוקבים אחריהם.",
    pastRaces: n => `תחרויות קודמות (${n})`,
    drivers: n => n === 1 ? "נהג אחד" : `${n} נהגים`,
    registeredCount: n => n === 1 ? "נהג אחד רשום" : `${n} נהגים רשומים`,
    registered: "✓ רשום",
    register: "הרשמה",
    unregister: "ביטול הרשמה",
    unregisterConfirm: category => `לבטל את ההרשמה ל-${category}?`,
    transponderPlaceholder: "מספר טרנספונדר (לא חובה)",
    confirm: "אישור",
    showDrivers: n => `הצגת נהגים (${n})`,
    hideDrivers: n => `הסתרת נהגים (${n})`,
    unnamedDriver: "נהג ללא שם",
    you: "את/ה",
    removeFrom: category => `הסרה מ-${category}`,
    removeConfirm: (name, category) => `להסיר את ${name} מ-${category}?`,
    thisDriver: "הנהג הזה",
    removeFailed: "לא הצלחנו להסיר את הנהג. נסו שוב.",
    registeredDrivers: "נהגים רשומים",
    downloadCsv: "הורדת CSV",
    csvTitle: "רשימת נהגים (שם, קטגוריה, טרנספונדר) לייבוא לתוכנת מדידת זמנים",
    deleteRace: "מחיקת תחרות",
    deleteRaceConfirm: (name, regCount) => `למחוק את "${name}"?` + (regCount > 0
      ? `\n\n${regCount === 1 ? "ההרשמה של נהג אחד תימחק." : `ההרשמות של ${regCount} נהגים יימחקו.`}`
      : ""),
    deleteRaceFailed: "לא הצלחנו למחוק את התחרות. נסו שוב."
  },

  fr: {
    loading: "Chargement…",
    signIn: "Connexion",
    signInIntro: "Utilisez votre compte Google, ou recevez un lien de connexion par e-mail.",
    continueGoogle: "Continuer avec Google",
    or: "ou",
    sendLink: "Envoyer le lien de connexion",
    welcome: "Bienvenue !",
    whatName: "Quel est votre nom ?",
    firstName: "Prénom",
    lastName: "Nom",
    nicknameOptional: "Surnom (facultatif)",
    nicknameHint: "Affiché dans les listes de pilotes à la place de votre nom.",
    nameRequired: "Le prénom et le nom sont obligatoires.",
    continue: "Continuer",
    races: "Courses",
    tracks: "Pistes",
    account: "Compte",
    profile: "Profil",
    logout: "Se déconnecter",
    language: "Langue",
    pendingApprovals: "Pistes en attente de validation",
    newTrack: "+ Nouvelle piste",
    submitNewTrack: "Proposer une nouvelle piste",
    trackName: "Nom de la piste",
    location: "Lieu",
    websiteOptional: "Site web (facultatif)",
    descriptionOptional: "Description (facultatif)",
    submitForApproval: "Envoyer pour validation",
    cancel: "Annuler",
    searchTracks: "Rechercher une piste par nom, lieu…",
    upcomingRaces: "Courses à venir",
    footerQuestions: "Des questions ou des remarques ?",
    contactSupport: "Contacter le support",
    email: "E-mail",
    save: "Enregistrer",

    popupBlocked: "Votre navigateur a bloqué la fenêtre de connexion Google. Autorisez les pop-ups pour ce site et réessayez.",
    accountExists: "Cette adresse se connecte déjà par lien e-mail. Utilisez l'option e-mail ci-dessous.",
    networkError: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    unauthorizedDomain: "La connexion Google n'est pas encore activée pour cette adresse.",
    googleNotEnabled: "La connexion Google n'est pas encore activée.",
    googleFailed: "La connexion Google n'a pas fonctionné ici. Si vous avez ouvert cette page depuis une application de messagerie, ouvrez-la plutôt dans Safari ou Chrome.",
    quotaExceeded: "Trop d'e-mails de connexion ont été envoyés aujourd'hui. Réessayez demain.",
    invalidEmail: "Cette adresse e-mail ne semble pas valide. Vérifiez-la et réessayez.",
    enterEmail: "Saisissez votre e-mail",
    tooManyRequests: "Trop de tentatives. Patientez quelques minutes et réessayez.",
    sendFailed: "Impossible d'envoyer le lien de connexion. Réessayez plus tard.",
    sending: "Envoi…",
    linkSent: (email, sender) => `Lien de connexion envoyé à <b><bdi>${email}</bdi></b>.<br>
      Vous ne le trouvez pas ? Vérifiez vos spams. Il provient de
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "Confirmez votre e-mail",
    linkInvalid: "Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau.",
    connectError: "Connexion impossible. Vérifiez votre connexion et réessayez.",
    retry: "Réessayer",
    saveFailed: "Échec de l'enregistrement. Réessayez.",
    pendingTitle: n => `${n} piste${n > 1 ? "s" : ""} en attente de validation`,
    km: n => `${n} km`,
    underOneKm: "< 1 km",
    loadingTracks: "Chargement des pistes…",
    loadingRaces: "Chargement des courses…",
    loadTracksError: "Impossible de charger les pistes. Vérifiez votre connexion et réessayez.",
    loadRacesError: "Impossible de charger les courses. Vérifiez votre connexion et réessayez.",
    noTracks: "Aucune piste trouvée.",
    follow: "Suivre",
    following: "✓ Suivie",
    unfollow: "Ne plus suivre",
    followTitle: "Voir les courses de cette piste dans Courses",
    unfollowTitle: "Ne plus voir les courses de cette piste",
    website: "Site web",
    yourTrack: "Votre piste",
    deleteTrack: "Supprimer la piste",
    deleteTrackConfirm: (name, raceCount) => `Supprimer la piste « ${name} » ?` + (raceCount > 0
      ? `\n\nCela supprime aussi ${raceCount === 1 ? "sa course" : `ses ${raceCount} courses`} et toutes leurs inscriptions.`
      : ""),
    deleteTrackFailed: "Impossible de supprimer cette piste. Réessayez.",
    addRace: "Ajouter une course",
    approve: "Valider",
    reject: "Refuser",
    rejectConfirm: name => `Refuser et supprimer la piste « ${name} » ?`,
    nameLocationRequired: "Le nom et le lieu sont obligatoires",
    trackSubmitted: "Piste envoyée pour validation !",
    createRace: "Créer une course",
    raceName: "Nom de la course",
    categoriesLabel: "Catégories :",
    categoryPlaceholder: "Nom de la catégorie (ex. 2WD Buggy)",
    addCategory: "+ Ajouter une catégorie",
    nameDateRequired: "Le nom et la date sont obligatoires",
    addOneCategory: "Ajoutez au moins une catégorie",
    existingRaces: "Courses existantes",
    followToSee: "Suivez des pistes pour voir leurs courses ici.",
    noRacesYet: "Aucune course prévue pour l'instant sur les pistes que vous suivez.",
    noUpcoming: "Aucune course à venir sur les pistes que vous suivez.",
    pastRaces: n => `Courses passées (${n})`,
    drivers: n => `${n} pilote${n > 1 ? "s" : ""}`,
    registeredCount: n => `${n} pilote${n > 1 ? "s" : ""} inscrit${n > 1 ? "s" : ""}`,
    registered: "✓ Inscrit",
    register: "S'inscrire",
    unregister: "Se désinscrire",
    unregisterConfirm: category => `Se désinscrire de ${category} ?`,
    transponderPlaceholder: "N° de transpondeur (facultatif)",
    confirm: "Confirmer",
    showDrivers: n => `Afficher les pilotes (${n})`,
    hideDrivers: n => `Masquer les pilotes (${n})`,
    unnamedDriver: "Pilote sans nom",
    you: "vous",
    removeFrom: category => `Retirer de ${category}`,
    removeConfirm: (name, category) => `Retirer ${name} de ${category} ?`,
    thisDriver: "ce pilote",
    removeFailed: "Impossible de retirer ce pilote. Réessayez.",
    registeredDrivers: "Pilotes inscrits",
    downloadCsv: "Télécharger le CSV",
    csvTitle: "Liste des pilotes (nom, catégorie, transpondeur) à importer dans le logiciel de chronométrage",
    deleteRace: "Supprimer la course",
    deleteRaceConfirm: (name, regCount) => `Supprimer « ${name} » ?` + (regCount > 0
      ? `\n\n${regCount === 1 ? "L'inscription d'1 pilote sera supprimée." : `Les inscriptions de ${regCount} pilotes seront supprimées.`}`
      : ""),
    deleteRaceFailed: "Impossible de supprimer cette course. Réessayez."
  }
};

function storedLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return LANGS[v] ? v : null;
  } catch {
    return null;
  }
}

// Hebrew if the device language is Hebrew ("iw" is the old code) or the clock is set to Israel
function detectLang() {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language ?? ""];
  if (langs.some(l => /^(he|iw)\b/i.test(l))) return "he";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz === "Asia/Jerusalem" || tz === "Asia/Tel_Aviv") return "he";
  return "en";
}

export const lang = storedLang() ?? detectLang();
export const isRtl = LANGS[lang].dir === "rtl";

// t("key") or t("key", ...args) for entries that are functions (plurals, names)
export function t(key, ...args) {
  const entry = strings[lang][key] ?? strings.en[key];
  if (entry === undefined) {
    console.warn(`Missing string: ${key}`);
    return key;
  }
  return typeof entry === "function" ? entry(...args) : entry;
}

export function formatNumber(n) {
  return n.toLocaleString(LANGS[lang].locale);
}

// "2026-11-08" -> "Sun 8 Nov 2026" / "יום א׳, 8 בנוב׳ 2026" / "dim. 8 nov. 2026"
export function formatDate(yyyyMmDd) {
  const [y, m, d] = String(yyyyMmDd).split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  return new Date(y, m - 1, d).toLocaleDateString(LANGS[lang].locale, {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

// Static markup: data-i18n (text), data-i18n-placeholder, data-i18n-title
function translatePage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGS[lang].dir;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
}

const GLOBE_SVG = `
  <svg class="globe" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="14.5" />
    <ellipse class="globe-line" cx="16" cy="16" rx="6.5" ry="14.5" />
    <path class="globe-line" d="M3 10.5h26M3 21.5h26" />
  </svg>`;

// Globe button showing the current language code; the menu lists the languages by their own names
function buildLanguagePicker() {
  const wrap = document.createElement("div");
  wrap.className = "lang-picker";

  const btn = document.createElement("button");
  btn.className = "lang-btn";
  btn.title = t("language");
  btn.setAttribute("aria-label", `${t("language")}: ${LANGS[lang].label}`);
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `${GLOBE_SVG}<span class="lang-code">${LANGS[lang].code}</span>`;

  const menu = document.createElement("div");
  menu.className = "dropdown lang-menu hidden";
  menu.setAttribute("role", "menu");
  Object.entries(LANGS).forEach(([key, info]) => {
    const item = document.createElement("button");
    item.setAttribute("role", "menuitemradio");
    item.setAttribute("aria-checked", String(key === lang));
    item.lang = key;
    item.innerHTML = `<span>${info.label}</span><span class="lang-item-code">${info.code}</span>`;
    item.onclick = () => {
      if (key === lang) { close(); return; }
      try { localStorage.setItem(STORAGE_KEY, key); } catch { return; }
      // A reload re-renders everything (and flips direction) in the new language
      location.reload();
    };
    menu.appendChild(item);
  });

  const close = () => {
    menu.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
  };
  btn.onclick = e => {
    e.stopPropagation();
    const open = menu.classList.toggle("hidden") === false;
    btn.setAttribute("aria-expanded", String(open));
  };
  document.addEventListener("click", e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  return wrap;
}

translatePage();
document.querySelectorAll(".lang-slot").forEach(slot => slot.appendChild(buildLanguagePicker()));
