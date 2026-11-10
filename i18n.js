/* ---------------- Localization ----------------
 * English, French, German (Swiss spelling), Italian, Spanish and Hebrew. Hebrew is the default
 * for devices set to Hebrew or to Israel's time zone; everyone else gets English. The other
 * languages are never picked automatically.
 * The choice is stored on the device only (localStorage), not on the user's record.
 * Loaded as its own <script> before app.js so the page is translated while Firebase loads.
 */

const LANGS = {
  // Menu order: Hebrew last
  en: { label: "English", code: "EN", dir: "ltr", locale: "en-GB" },
  fr: { label: "Français", code: "FR", dir: "ltr", locale: "fr-FR" },
  // Swiss Standard German: "ss" instead of "ß", «» quotes, de-CH dates
  de: { label: "Deutsch", code: "DE", dir: "ltr", locale: "de-CH" },
  it: { label: "Italiano", code: "IT", dir: "ltr", locale: "it-IT" },
  es: { label: "Español", code: "ES", dir: "ltr", locale: "es-ES" },
  he: { label: "עברית", code: "HE", dir: "rtl", locale: "he-IL" }
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
    openSource: "Open source",
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
    raceCreated: "✓ Race created",
    createRaceFailed: "Couldn't create the race. Please try again.",
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
    transponderPlaceholder: "MyLaps transponder #",
    timingLabel: "Timing:",
    timingMylaps: "MyLaps (transponder required)",
    timingNone: "No transponder",
    transponderRequired: "Enter your transponder number",
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
    openSource: "קוד פתוח",
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
    raceCreated: "✓ התחרות נוצרה",
    createRaceFailed: "לא הצלחנו ליצור את התחרות. נסו שוב.",
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
    transponderPlaceholder: "מספר טרנספונדר MyLaps",
    timingLabel: "תזמון:",
    timingMylaps: "MyLaps (חובה להזין טרנספונדר)",
    timingNone: "ללא טרנספונדר",
    transponderRequired: "יש להזין מספר טרנספונדר",
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
    openSource: "Open source",
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
    raceCreated: "✓ Course créée",
    createRaceFailed: "Impossible de créer la course. Réessayez.",
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
    transponderPlaceholder: "N° de transpondeur MyLaps",
    timingLabel: "Chronométrage :",
    timingMylaps: "MyLaps (transpondeur obligatoire)",
    timingNone: "Sans transpondeur",
    transponderRequired: "Saisissez votre numéro de transpondeur",
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
  },
  de: {
    loading: "Wird geladen…",
    signIn: "Anmelden",
    signInIntro: "Melde dich mit deinem Google-Konto an oder erhalte einen Anmeldelink per E-Mail.",
    continueGoogle: "Weiter mit Google",
    or: "oder",
    sendLink: "Anmeldelink senden",
    welcome: "Willkommen!",
    whatName: "Wie heisst du?",
    firstName: "Vorname",
    lastName: "Nachname",
    nicknameOptional: "Spitzname (optional)",
    nicknameHint: "Wird in den Fahrerlisten anstelle deines Namens angezeigt.",
    nameRequired: "Vor- und Nachname sind erforderlich.",
    continue: "Weiter",
    races: "Rennen",
    tracks: "Strecken",
    account: "Konto",
    profile: "Profil",
    logout: "Abmelden",
    language: "Sprache",
    pendingApprovals: "Strecken zur Freigabe",
    newTrack: "+ Neue Strecke",
    submitNewTrack: "Neue Strecke vorschlagen",
    trackName: "Name der Strecke",
    location: "Ort",
    websiteOptional: "Website (optional)",
    descriptionOptional: "Beschreibung (optional)",
    submitForApproval: "Zur Freigabe senden",
    cancel: "Abbrechen",
    searchTracks: "Strecken nach Name, Ort … suchen",
    upcomingRaces: "Kommende Rennen",
    footerQuestions: "Fragen oder Feedback?",
    contactSupport: "Support kontaktieren",
    openSource: "Open Source",
    email: "E-Mail",
    save: "Speichern",

    popupBlocked: "Dein Browser hat das Google-Anmeldefenster blockiert. Erlaube Pop-ups für diese Seite und versuche es erneut.",
    accountExists: "Diese E-Mail-Adresse meldet sich bereits per E-Mail-Link an. Nutze unten die E-Mail-Option.",
    networkError: "Der Server ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.",
    unauthorizedDomain: "Die Google-Anmeldung ist für diese Adresse noch nicht freigeschaltet.",
    googleNotEnabled: "Die Google-Anmeldung ist noch nicht aktiviert.",
    googleFailed: "Die Google-Anmeldung hat hier nicht funktioniert. Wenn du diese Seite aus einer E-Mail- oder Chat-App geöffnet hast, öffne sie stattdessen in Safari oder Chrome.",
    quotaExceeded: "Heute wurden zu viele Anmelde-E-Mails verschickt. Bitte versuche es morgen erneut.",
    invalidEmail: "Diese E-Mail-Adresse scheint ungültig zu sein. Prüfe sie und versuche es erneut.",
    enterEmail: "Gib deine E-Mail-Adresse ein",
    tooManyRequests: "Zu viele Versuche. Warte ein paar Minuten und versuche es erneut.",
    sendFailed: "Der Anmeldelink konnte nicht gesendet werden. Bitte versuche es später erneut.",
    sending: "Wird gesendet…",
    linkSent: (email, sender) => `Anmeldelink an <b><bdi>${email}</bdi></b> gesendet.<br>
      Nicht gefunden? Schau im Spam-Ordner nach. Er kommt von
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "Bestätige deine E-Mail-Adresse",
    linkInvalid: "Dieser Anmeldelink ist ungültig oder abgelaufen. Fordere einen neuen an.",
    connectError: "Verbindung fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
    retry: "Erneut versuchen",
    saveFailed: "Speichern fehlgeschlagen. Bitte versuche es erneut.",
    pendingTitle: n => `${n} ${n === 1 ? "Strecke wartet" : "Strecken warten"} auf Freigabe`,
    km: n => `${n} km`,
    underOneKm: "< 1 km",
    loadingTracks: "Strecken werden geladen…",
    loadingRaces: "Rennen werden geladen…",
    loadTracksError: "Strecken konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
    loadRacesError: "Rennen konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.",
    noTracks: "Keine Strecken gefunden.",
    follow: "Folgen",
    following: "✓ Folge ich",
    unfollow: "Nicht mehr folgen",
    followTitle: "Rennen dieser Strecke unter Rennen anzeigen",
    unfollowTitle: "Rennen dieser Strecke nicht mehr anzeigen",
    website: "Website",
    yourTrack: "Deine Strecke",
    deleteTrack: "Strecke löschen",
    deleteTrackConfirm: (name, raceCount) => `Strecke «${name}» löschen?` + (raceCount > 0
      ? `\n\nDamit ${raceCount === 1 ? "wird auch ihr Rennen" : `werden auch ihre ${raceCount} Rennen`} samt allen Anmeldungen gelöscht.`
      : ""),
    deleteTrackFailed: "Die Strecke konnte nicht gelöscht werden. Bitte versuche es erneut.",
    addRace: "Rennen hinzufügen",
    approve: "Freigeben",
    reject: "Ablehnen",
    rejectConfirm: name => `Strecke «${name}» ablehnen und löschen?`,
    nameLocationRequired: "Name und Ort sind erforderlich",
    trackSubmitted: "Strecke zur Freigabe gesendet!",
    createRace: "Rennen erstellen",
    raceCreated: "✓ Rennen erstellt",
    createRaceFailed: "Das Rennen konnte nicht erstellt werden. Bitte versuche es erneut.",
    raceName: "Name des Rennens",
    categoriesLabel: "Kategorien:",
    categoryPlaceholder: "Name der Kategorie (z. B. 2WD Buggy)",
    addCategory: "+ Kategorie hinzufügen",
    nameDateRequired: "Name und Datum sind erforderlich",
    addOneCategory: "Füge mindestens eine Kategorie hinzu",
    existingRaces: "Bestehende Rennen",
    followToSee: "Folge Strecken, um ihre Rennen hier zu sehen.",
    noRacesYet: "Auf den Strecken, denen du folgst, sind noch keine Rennen geplant.",
    noUpcoming: "Keine kommenden Rennen auf den Strecken, denen du folgst.",
    pastRaces: n => `Vergangene Rennen (${n})`,
    drivers: n => `${n} Fahrer`,
    registeredCount: n => `${n} Fahrer angemeldet`,
    registered: "✓ Angemeldet",
    register: "Anmelden",
    unregister: "Abmelden",
    transponderPlaceholder: "MyLaps-Transpondernummer",
    timingLabel: "Zeitmessung:",
    timingMylaps: "MyLaps (Transponder erforderlich)",
    timingNone: "Ohne Transponder",
    transponderRequired: "Gib deine Transpondernummer ein",
    confirm: "Bestätigen",
    showDrivers: n => `Fahrer anzeigen (${n})`,
    hideDrivers: n => `Fahrer ausblenden (${n})`,
    unnamedDriver: "Fahrer ohne Namen",
    you: "du",
    removeFrom: category => `Aus ${category} entfernen`,
    removeConfirm: (name, category) => `${name} aus ${category} entfernen?`,
    thisDriver: "diesen Fahrer",
    removeFailed: "Der Fahrer konnte nicht entfernt werden. Bitte versuche es erneut.",
    registeredDrivers: "Angemeldete Fahrer",
    downloadCsv: "CSV herunterladen",
    csvTitle: "Fahrerliste (Name, Klasse, Transponder) für den Import in die Zeitmessung",
    deleteRace: "Rennen löschen",
    deleteRaceConfirm: (name, regCount) => `«${name}» löschen?` + (regCount > 0
      ? `\n\n${regCount === 1 ? "Die Anmeldung von 1 Fahrer wird gelöscht." : `Die Anmeldungen von ${regCount} Fahrern werden gelöscht.`}`
      : ""),
    deleteRaceFailed: "Das Rennen konnte nicht gelöscht werden. Bitte versuche es erneut."
  },

  it: {
    loading: "Caricamento…",
    signIn: "Accedi",
    signInIntro: "Usa il tuo account Google oppure ricevi un link di accesso via e-mail.",
    continueGoogle: "Continua con Google",
    or: "oppure",
    sendLink: "Invia link di accesso",
    welcome: "Benvenuto!",
    whatName: "Come ti chiami?",
    firstName: "Nome",
    lastName: "Cognome",
    nicknameOptional: "Soprannome (facoltativo)",
    nicknameHint: "Mostrato negli elenchi piloti al posto del tuo nome.",
    nameRequired: "Nome e cognome sono obbligatori.",
    continue: "Continua",
    races: "Gare",
    tracks: "Piste",
    account: "Account",
    profile: "Profilo",
    logout: "Esci",
    language: "Lingua",
    pendingApprovals: "Piste in attesa di approvazione",
    newTrack: "+ Nuova pista",
    submitNewTrack: "Proponi una nuova pista",
    trackName: "Nome della pista",
    location: "Località",
    websiteOptional: "Sito web (facoltativo)",
    descriptionOptional: "Descrizione (facoltativa)",
    submitForApproval: "Invia per approvazione",
    cancel: "Annulla",
    searchTracks: "Cerca piste per nome, località…",
    upcomingRaces: "Prossime gare",
    footerQuestions: "Domande o suggerimenti?",
    contactSupport: "Contatta l'assistenza",
    openSource: "Open source",
    email: "E-mail",
    save: "Salva",

    popupBlocked: "Il browser ha bloccato la finestra di accesso Google. Consenti i pop-up per questo sito e riprova.",
    accountExists: "Questo indirizzo accede già tramite link e-mail. Usa l'opzione e-mail qui sotto.",
    networkError: "Impossibile raggiungere il server. Controlla la connessione e riprova.",
    unauthorizedDomain: "L'accesso con Google non è ancora attivo per questo indirizzo.",
    googleNotEnabled: "L'accesso con Google non è ancora attivo.",
    googleFailed: "L'accesso con Google non ha funzionato qui. Se hai aperto questa pagina da un'app di posta o di chat, aprila invece in Safari o Chrome.",
    quotaExceeded: "Oggi sono state inviate troppe e-mail di accesso. Riprova domani.",
    invalidEmail: "Questo indirizzo e-mail non sembra valido. Controllalo e riprova.",
    enterEmail: "Inserisci la tua e-mail",
    tooManyRequests: "Troppi tentativi. Attendi qualche minuto e riprova.",
    sendFailed: "Impossibile inviare il link di accesso. Riprova più tardi.",
    sending: "Invio…",
    linkSent: (email, sender) => `Link di accesso inviato a <b><bdi>${email}</bdi></b>.<br>
      Non lo trovi? Controlla lo spam. Arriva da
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "Conferma la tua e-mail",
    linkInvalid: "Questo link di accesso non è valido o è scaduto. Richiedine uno nuovo.",
    connectError: "Connessione non riuscita. Controlla la connessione e riprova.",
    retry: "Riprova",
    saveFailed: "Salvataggio non riuscito. Riprova.",
    pendingTitle: n => `${n} ${n === 1 ? "pista in attesa" : "piste in attesa"} di approvazione`,
    km: n => `${n} km`,
    underOneKm: "< 1 km",
    loadingTracks: "Caricamento piste…",
    loadingRaces: "Caricamento gare…",
    loadTracksError: "Impossibile caricare le piste. Controlla la connessione e riprova.",
    loadRacesError: "Impossibile caricare le gare. Controlla la connessione e riprova.",
    noTracks: "Nessuna pista trovata.",
    follow: "Segui",
    following: "✓ Segui già",
    unfollow: "Non seguire più",
    followTitle: "Mostra le gare di questa pista in Gare",
    unfollowTitle: "Non mostrare più le gare di questa pista",
    website: "Sito web",
    yourTrack: "La tua pista",
    deleteTrack: "Elimina pista",
    deleteTrackConfirm: (name, raceCount) => `Eliminare la pista «${name}»?` + (raceCount > 0
      ? `\n\nVerranno eliminate anche ${raceCount === 1 ? "la sua gara" : `le sue ${raceCount} gare`} e tutte le iscrizioni.`
      : ""),
    deleteTrackFailed: "Impossibile eliminare la pista. Riprova.",
    addRace: "Aggiungi gara",
    approve: "Approva",
    reject: "Rifiuta",
    rejectConfirm: name => `Rifiutare ed eliminare la pista «${name}»?`,
    nameLocationRequired: "Nome e località sono obbligatori",
    trackSubmitted: "Pista inviata per approvazione!",
    createRace: "Crea gara",
    raceCreated: "✓ Gara creata",
    createRaceFailed: "Impossibile creare la gara. Riprova.",
    raceName: "Nome della gara",
    categoriesLabel: "Categorie:",
    categoryPlaceholder: "Nome della categoria (es. 2WD Buggy)",
    addCategory: "+ Aggiungi categoria",
    nameDateRequired: "Nome e data sono obbligatori",
    addOneCategory: "Aggiungi almeno una categoria",
    existingRaces: "Gare esistenti",
    followToSee: "Segui delle piste per vedere qui le loro gare.",
    noRacesYet: "Nessuna gara ancora in programma sulle piste che segui.",
    noUpcoming: "Nessuna gara in arrivo sulle piste che segui.",
    pastRaces: n => `Gare passate (${n})`,
    drivers: n => `${n} ${n === 1 ? "pilota" : "piloti"}`,
    registeredCount: n => `${n} ${n === 1 ? "pilota iscritto" : "piloti iscritti"}`,
    registered: "✓ Iscritto",
    register: "Iscriviti",
    unregister: "Annulla iscrizione",
    transponderPlaceholder: "N. transponder MyLaps",
    timingLabel: "Cronometraggio:",
    timingMylaps: "MyLaps (transponder obbligatorio)",
    timingNone: "Senza transponder",
    transponderRequired: "Inserisci il numero del tuo transponder",
    confirm: "Conferma",
    showDrivers: n => `Mostra piloti (${n})`,
    hideDrivers: n => `Nascondi piloti (${n})`,
    unnamedDriver: "Pilota senza nome",
    you: "tu",
    removeFrom: category => `Rimuovi da ${category}`,
    removeConfirm: (name, category) => `Rimuovere ${name} da ${category}?`,
    thisDriver: "questo pilota",
    removeFailed: "Impossibile rimuovere il pilota. Riprova.",
    registeredDrivers: "Piloti iscritti",
    downloadCsv: "Scarica CSV",
    csvTitle: "Elenco piloti (nome, classe, transponder) da importare nel software di cronometraggio",
    deleteRace: "Elimina gara",
    deleteRaceConfirm: (name, regCount) => `Eliminare «${name}»?` + (regCount > 0
      ? `\n\n${regCount === 1 ? "Verrà eliminata l'iscrizione di 1 pilota." : `Verranno eliminate le iscrizioni di ${regCount} piloti.`}`
      : ""),
    deleteRaceFailed: "Impossibile eliminare la gara. Riprova."
  },

  es: {
    loading: "Cargando…",
    signIn: "Iniciar sesión",
    signInIntro: "Usa tu cuenta de Google o recibe un enlace de acceso por correo.",
    continueGoogle: "Continuar con Google",
    or: "o",
    sendLink: "Enviar enlace de acceso",
    welcome: "¡Bienvenido!",
    whatName: "¿Cómo te llamas?",
    firstName: "Nombre",
    lastName: "Apellido",
    nicknameOptional: "Apodo (opcional)",
    nicknameHint: "Se muestra en las listas de pilotos en lugar de tu nombre.",
    nameRequired: "El nombre y el apellido son obligatorios.",
    continue: "Continuar",
    races: "Carreras",
    tracks: "Pistas",
    account: "Cuenta",
    profile: "Perfil",
    logout: "Cerrar sesión",
    language: "Idioma",
    pendingApprovals: "Pistas pendientes de aprobación",
    newTrack: "+ Nueva pista",
    submitNewTrack: "Proponer una nueva pista",
    trackName: "Nombre de la pista",
    location: "Ubicación",
    websiteOptional: "Sitio web (opcional)",
    descriptionOptional: "Descripción (opcional)",
    submitForApproval: "Enviar para aprobación",
    cancel: "Cancelar",
    searchTracks: "Buscar pistas por nombre, ubicación…",
    upcomingRaces: "Próximas carreras",
    footerQuestions: "¿Preguntas o comentarios?",
    contactSupport: "Contactar con soporte",
    openSource: "Código abierto",
    email: "Correo electrónico",
    save: "Guardar",

    popupBlocked: "Tu navegador bloqueó la ventana de inicio de sesión de Google. Permite las ventanas emergentes para este sitio y vuelve a intentarlo.",
    accountExists: "Esta dirección ya inicia sesión con un enlace por correo. Usa la opción de correo de abajo.",
    networkError: "No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.",
    unauthorizedDomain: "El inicio de sesión con Google aún no está habilitado para esta dirección.",
    googleNotEnabled: "El inicio de sesión con Google aún no está habilitado.",
    googleFailed: "El inicio de sesión con Google no funcionó aquí. Si abriste esta página desde una app de correo o de chat, ábrela en Safari o Chrome.",
    quotaExceeded: "Hoy se enviaron demasiados correos de acceso. Vuelve a intentarlo mañana.",
    invalidEmail: "Esta dirección de correo no parece válida. Revísala y vuelve a intentarlo.",
    enterEmail: "Introduce tu correo",
    tooManyRequests: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
    sendFailed: "No se pudo enviar el enlace de acceso. Vuelve a intentarlo más tarde.",
    sending: "Enviando…",
    linkSent: (email, sender) => `Enlace de acceso enviado a <b><bdi>${email}</bdi></b>.<br>
      ¿No lo encuentras? Revisa la carpeta de spam. Llega desde
      <span class="sender" dir="ltr">${sender}</span>`,
    confirmEmail: "Confirma tu correo",
    linkInvalid: "Este enlace de acceso no es válido o ha caducado. Solicita uno nuevo.",
    connectError: "No se pudo conectar. Revisa tu conexión y vuelve a intentarlo.",
    retry: "Reintentar",
    saveFailed: "No se pudo guardar. Vuelve a intentarlo.",
    pendingTitle: n => `${n} ${n === 1 ? "pista pendiente" : "pistas pendientes"} de aprobación`,
    km: n => `${n} km`,
    underOneKm: "< 1 km",
    loadingTracks: "Cargando pistas…",
    loadingRaces: "Cargando carreras…",
    loadTracksError: "No se pudieron cargar las pistas. Revisa tu conexión y vuelve a intentarlo.",
    loadRacesError: "No se pudieron cargar las carreras. Revisa tu conexión y vuelve a intentarlo.",
    noTracks: "No se encontraron pistas.",
    follow: "Seguir",
    following: "✓ Siguiendo",
    unfollow: "Dejar de seguir",
    followTitle: "Ver las carreras de esta pista en Carreras",
    unfollowTitle: "Dejar de ver las carreras de esta pista",
    website: "Sitio web",
    yourTrack: "Tu pista",
    deleteTrack: "Eliminar pista",
    deleteTrackConfirm: (name, raceCount) => `¿Eliminar la pista «${name}»?` + (raceCount > 0
      ? `\n\nTambién se eliminarán ${raceCount === 1 ? "su carrera" : `sus ${raceCount} carreras`} y todas las inscripciones.`
      : ""),
    deleteTrackFailed: "No se pudo eliminar la pista. Vuelve a intentarlo.",
    addRace: "Añadir carrera",
    approve: "Aprobar",
    reject: "Rechazar",
    rejectConfirm: name => `¿Rechazar y eliminar la pista «${name}»?`,
    nameLocationRequired: "El nombre y la ubicación son obligatorios",
    trackSubmitted: "¡Pista enviada para aprobación!",
    createRace: "Crear carrera",
    raceCreated: "✓ Carrera creada",
    createRaceFailed: "No se pudo crear la carrera. Vuelve a intentarlo.",
    raceName: "Nombre de la carrera",
    categoriesLabel: "Categorías:",
    categoryPlaceholder: "Nombre de la categoría (p. ej. 2WD Buggy)",
    addCategory: "+ Añadir categoría",
    nameDateRequired: "El nombre y la fecha son obligatorios",
    addOneCategory: "Añade al menos una categoría",
    existingRaces: "Carreras existentes",
    followToSee: "Sigue pistas para ver aquí sus carreras.",
    noRacesYet: "Todavía no hay carreras programadas en las pistas que sigues.",
    noUpcoming: "No hay próximas carreras en las pistas que sigues.",
    pastRaces: n => `Carreras pasadas (${n})`,
    drivers: n => `${n} ${n === 1 ? "piloto" : "pilotos"}`,
    registeredCount: n => `${n} ${n === 1 ? "piloto inscrito" : "pilotos inscritos"}`,
    registered: "✓ Inscrito",
    register: "Inscribirse",
    unregister: "Cancelar inscripción",
    transponderPlaceholder: "N.º de transponder MyLaps",
    timingLabel: "Cronometraje:",
    timingMylaps: "MyLaps (transponder obligatorio)",
    timingNone: "Sin transponder",
    transponderRequired: "Introduce el número de tu transponder",
    confirm: "Confirmar",
    showDrivers: n => `Mostrar pilotos (${n})`,
    hideDrivers: n => `Ocultar pilotos (${n})`,
    unnamedDriver: "Piloto sin nombre",
    you: "tú",
    removeFrom: category => `Quitar de ${category}`,
    removeConfirm: (name, category) => `¿Quitar a ${name} de ${category}?`,
    thisDriver: "este piloto",
    removeFailed: "No se pudo quitar al piloto. Vuelve a intentarlo.",
    registeredDrivers: "Pilotos inscritos",
    downloadCsv: "Descargar CSV",
    csvTitle: "Lista de pilotos (nombre, clase, transponder) para importar en el software de cronometraje",
    deleteRace: "Eliminar carrera",
    deleteRaceConfirm: (name, regCount) => `¿Eliminar «${name}»?` + (regCount > 0
      ? `\n\n${regCount === 1 ? "Se eliminará la inscripción de 1 piloto." : `Se eliminarán las inscripciones de ${regCount} pilotos.`}`
      : ""),
    deleteRaceFailed: "No se pudo eliminar la carrera. Vuelve a intentarlo."
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
