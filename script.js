(() => {
  "use strict";

  const SAVE_KEY = "theVoidSave_v093";
  const CAPTAINS_LOG_KEY = "theVoidCaptainsLog_v1";
  const TITLE_MUSIC_DEFAULT_VOLUME = 0.42;
  const CREDITS_MUSIC_DEFAULT_VOLUME = 0.72;
  const LEGACY_KEYS = ["theVoidSave_v082", "theVoidSave_v081", "theVoidSave_v080", "theVoidSave_v070", "theVoidSave_v060", "theVoidSave_v052", "theVoidSave_v051", "theVoidSave_v05", "theVoidSave_v041", "theVoidSave_v04", "theVoidSave_v03", "theVoidSave_v02"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const introScenes = [
    {
      image: "assets/IMG01.png",
      alt: "Elite Forces Agent Luna H. asleep inside a softly glowing cryosleep chamber.",
      imageCode: "CRYOSLEEP UNIT 03",
      missionTime: "T−72:00:00",
      counter: "01 / 02",
      logLabel: "MISSION LOG // LUNA H.",
      alarm: false,
      text:
        "Elite Forces Agent Luna H. is transporting a cache of irreplaceable resources from Alpha 9, a distant world beyond the mapped colonies.\n\n" +
        "It is her first solo mission through deep space.\n\n" +
        "With Earth still seventy-two hours away, Luna has crossed the last navigational threshold before home.\n\n" +
        "A silent, uncharted expanse known as The Void."
    },
    {
      image: "assets/IMG02.png",
      alt: "Luna wakes in shock inside the cryosleep chamber as red fire-alarm light floods the pod.",
      imageCode: "FIRE ALARM // LIFE SUPPORT",
      missionTime: "SHIP STATUS: CRITICAL",
      counter: "02 / 02",
      logLabel: "EMERGENCY WAKE PROCEDURE",
      alarm: true,
      text:
        "The fire alarm tears Luna out of cryosleep.\n\n" +
        "Emergency red floods the chamber. Somewhere beyond the sealed glass, a system is burning, though the ship reports no impact and no mechanical fault.\n\n" +
        "Still disoriented, Luna releases the pod seals and goes to investigate."
    }
  ];

  const originalRoutes = {
    crew: ["hallway"],
    hallway: ["crew", "control", "life"],
    control: ["hallway"],
    life: ["hallway", "south"],
    south: ["life", "lab", "store", "kitchen"],
    lab: ["south"],
    store: ["south", "engineering"],
    kitchen: ["south", "engineering"],
    engineering: ["kitchen", "store"]
  };

  const defaultState = {
    phase: "intro",
    introIndex: 0,
    currentRoom: "crew",
    mapMode: "original",
    fireExtinguished: false,
    logOpened: false,
    damageLogged: false,
    groundContacted: false,
    residueFound: false,
    sampleCollected: false,
    kitchenEntered: false,
    counterInspected: false,
    alienEncountered: false,
    equipmentTaken: false,
    plasmaGun: false,
    flashlight: false,
    engineeringKey: false,
    engineeringUnlocked: false,
    hideChoice: "",
    hidingInProgress: false,
    hidingCompleted: false,
    branch: "",
    engineRepaired: false,
    lightsOut: false,
    satNavFailed: false,
    satNavDiagnosed: false,
    satNavModule: false,
    satNavRepaired: false,
    finalReported: false,
    blackoutStarted: false,
    relayFound: false,
    bridgeFound: false,
    regulatorFound: false,
    blackoutThreatStep: 0,
    alienRepelled: false,
    lightsRestored: false,
    surveillanceOpened: false,
    shadowFootageViewed: false,
    mimicFootageViewed: false,
    falseGroundContacted: false,
    actTwoComplete: false,
    investigationUnlocked: false,
    organismAnalysed: false,
    lockdownActive: false,
    southHallUnlocked: false,
    securityOverrideComplete: false,
    cloneRevealed: false,
    atmosphereOverrideComplete: false,
    cloneIncapacitated: false,
    emergencyRebreather: false,
    rebreatherSeconds: 90,
    tacticalGearCollected: false,
    tacticalHelmet: false,
    oxygenTank: false,
    flamethrower: false,
    plasmaRefills: false,
    oxygenMinutesRemaining: 1440,
    earthMinutesRemaining: 2880,
    checkpoint: 0,
    stress: 8
  };

  let state = loadState();
  let introTextFading = false;
  let introFadeToken = 0;
  let introFullText = "";
  let introTransitionLocked = false;
  let roomFadeToken = 0;
  let mediaSwapToken = 0;
  let toastTimer = 0;
  let dragState = null;
  let roomNodes = [];
  let activeSequence = null;
  let sequenceIndex = 0;
  let sequenceRunId = 0;
  let sequenceAdvanceLocked = false;
  let backgroundWarmupStarted = false;
  let transitionRunId = 0;
  let mapRevealTimer = 0;
  let captainLogSaveTimer = 0;
  let titleMusicFadeFrame = 0;
  let creditsMusicFadeFrame = 0;
  let creditsSequenceOpen = false;
  let creditsRollAnimation = null;
  let creditsResumeMode = "resume-title-audio";
  let orbitalAnimationFrame = 0;
  let orbitalRuntime = null;
  let orbitalLastFrame = 0;
  let rebreatherInterval = 0;
  const imageCache = new Map();

  const titleMusic = document.getElementById("titleMusic");
  const creditsMusic = document.getElementById("creditsMusic");
  const titleScreen = document.getElementById("titleScreen");
  const titleArtwork = document.getElementById("titleArtwork");
  const titleMenu = document.getElementById("titleMenu");
  const playButton = document.getElementById("playButton");
  const continueGameButton = document.getElementById("continueGameButton");
  const continueGameMeta = document.getElementById("continueGameMeta");
  const creditsButton = document.getElementById("creditsButton");
  const titleEnterHint = document.getElementById("titleEnterHint");

  const cinematicShell = document.getElementById("cinematicShell");
  const cinematicFrame = document.getElementById("cinematicFrame");
  const imagePanel = document.getElementById("imagePanel");
  const sceneImage = document.getElementById("sceneImage");
  const imageCode = document.getElementById("imageCode");
  const missionTime = document.getElementById("missionTime");
  const sceneCounter = document.getElementById("sceneCounter");
  const logLabel = document.getElementById("logLabel");
  const narrative = document.getElementById("narrative");
  const typeCursor = document.getElementById("typeCursor");
  const keyboardHint = document.getElementById("keyboardHint");
  const continueButton = document.getElementById("continueButton");

  const gameScreen = document.getElementById("gameScreen");
  const objectiveText = document.getElementById("objectiveText");
  const oxygenLabel = document.getElementById("oxygenLabel");
  const oxygenReadout = document.getElementById("oxygenReadout");
  const powerLabel = document.getElementById("powerLabel");
  const powerReadout = document.getElementById("powerReadout");
  const stressReadout = document.getElementById("stressReadout");
  const threatReadout = document.getElementById("threatReadout");
  const restartButton = document.getElementById("restartButton");
  const inventoryItems = document.getElementById("inventoryItems");
  const shipMap = document.getElementById("shipMap");
  const mapTitle = document.getElementById("mapTitle");
  const mapInstruction = document.getElementById("mapInstruction");
  const lunaToken = document.getElementById("lunaToken");
  const locationReadout = document.getElementById("locationReadout");
  const routeReadout = document.getElementById("routeReadout");

  const roomCode = document.getElementById("roomCode");
  const roomTitle = document.getElementById("roomTitle");
  const roomStatus = document.getElementById("roomStatus");
  const roomMedia = document.getElementById("roomMedia");
  const roomImage = document.getElementById("roomImage");
  const mediaCaption = document.getElementById("mediaCaption");
  const roomNarrative = document.getElementById("roomNarrative");
  const roomCursor = document.getElementById("roomCursor");
  const roomActions = document.getElementById("roomActions");

  const cinematicTransition = document.getElementById("cinematicTransition");
  const transitionKicker = document.getElementById("transitionKicker");
  const transitionTitle = document.getElementById("transitionTitle");
  const transitionText = document.getElementById("transitionText");
  const transitionProgress = document.getElementById("transitionProgress");
  const loseScreen = document.getElementById("loseScreen");
  const returnCheckpointButton = document.getElementById("returnCheckpointButton");
  const restartMissionButton = document.getElementById("restartMissionButton");
  const quitTitleButton = document.getElementById("quitTitleButton");

  const screenFade = document.getElementById("screenFade");
  const toast = document.getElementById("toast");
  const pilotLogDialog = document.getElementById("pilotLogDialog");
  const logFooterStatus = document.getElementById("logFooterStatus");
  const personalLogNotes = document.getElementById("personalLogNotes");
  const logSaveStatus = document.getElementById("logSaveStatus");
  const addLogTimestampButton = document.getElementById("addLogTimestampButton");
  const clearLogButton = document.getElementById("clearLogButton");
  const organismAnalysisLogEntry = document.getElementById("organismAnalysisLogEntry");
  const groundControlDialog = document.getElementById("groundControlDialog");
  const acknowledgeGroundButton = document.getElementById("acknowledgeGroundButton");
  const sequenceDialog = document.getElementById("sequenceDialog");
  const sequenceMedia = document.getElementById("sequenceMedia");
  const sequenceCopy = sequenceDialog.querySelector(".sequence-copy");
  const sequenceImage = document.getElementById("sequenceImage");
  const sequenceCode = document.getElementById("sequenceCode");
  const sequenceCounter = document.getElementById("sequenceCounter");
  const sequenceTitle = document.getElementById("sequenceTitle");
  const sequenceText = document.getElementById("sequenceText");
  const sequenceButton = document.getElementById("sequenceButton");
  const chapterDialog = document.getElementById("chapterDialog");
  const closeChapterButton = document.getElementById("closeChapterButton");
  const branchDialog = document.getElementById("branchDialog");
  const signalChoiceButton = document.getElementById("signalChoiceButton");
  const aloneChoiceButton = document.getElementById("aloneChoiceButton");
  const finalGroundDialog = document.getElementById("finalGroundDialog");
  const finalLunaText = document.getElementById("finalLunaText");
  const finalGroundText = document.getElementById("finalGroundText");
  const acknowledgeFinalButton = document.getElementById("acknowledgeFinalButton");
  const orbitalDialog = document.getElementById("orbitalDialog");
  const orbitalConsole = orbitalDialog.querySelector(".orbital-console");
  const orbitalKicker = document.getElementById("orbitalKicker");
  const orbitalTitle = document.getElementById("orbitalTitle");
  const orbitalSubtitle = document.getElementById("orbitalSubtitle");
  const orbitalBudget = document.getElementById("orbitalBudget");
  const orbitalBriefing = document.getElementById("orbitalBriefing");
  const orbitalStage = document.getElementById("orbitalStage");
  const orbitalLinkLayer = document.getElementById("orbitalLinkLayer");
  const orbitalCoreLayer = document.getElementById("orbitalCoreLayer");
  const orbitalOrbLayer = document.getElementById("orbitalOrbLayer");
  const orbitalGateLayer = document.getElementById("orbitalGateLayer");
  const orbitalCoreControls = document.getElementById("orbitalCoreControls");
  const orbitalObjectiveList = document.getElementById("orbitalObjectiveList");
  const orbitalStatus = document.getElementById("orbitalStatus");
  const orbitalStability = document.getElementById("orbitalStability");
  const orbitalStatusPanel = orbitalStatus.closest(".orbital-status-panel");
  const orbitalResult = document.getElementById("orbitalResult");
  const orbitalResultKicker = document.getElementById("orbitalResultKicker");
  const orbitalResultTitle = document.getElementById("orbitalResultTitle");
  const orbitalResultText = document.getElementById("orbitalResultText");
  const orbitalSlowButton = document.getElementById("orbitalSlowButton");
  const orbitalResetButton = document.getElementById("orbitalResetButton");
  const orbitalAbortButton = document.getElementById("orbitalAbortButton");
  const orbitalCommitButton = document.getElementById("orbitalCommitButton");
  const creditsDialog = document.getElementById("creditsDialog");
  const creditsRoll = document.getElementById("creditsRoll");
  const creditsRollViewport = creditsDialog.querySelector(".credits-roll-viewport");
  const creditsStartSpacer = creditsDialog.querySelector(".credits-roll-spacer:not(.credits-roll-spacer-end)");
  const creditsEndSpacer = creditsDialog.querySelector(".credits-roll-spacer-end");
  const creditsStatus = document.getElementById("creditsStatus");
  const creditsMuteButton = document.getElementById("creditsMuteButton");
  const creditsCloseButton = document.getElementById("creditsCloseButton");
  const creditsDoneButton = document.getElementById("creditsDoneButton");

  function loadState() {
    try {
      const current = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (current) return normaliseState({ ...defaultState, ...current });

      for (const key of LEGACY_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key));
        if (legacy) {
          const migrated = normaliseState({ ...defaultState, ...legacy });
          localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {
      // Begin a fresh mission if storage is unavailable or corrupt.
    }
    return { ...defaultState };
  }

  function normaliseState(candidate) {
    candidate.introIndex = Math.max(0, Math.min(Number(candidate.introIndex) || 0, introScenes.length - 1));
    candidate.stress = Math.max(0, Math.min(Number(candidate.stress) || 8, 99));
    candidate.checkpoint = Math.max(0, Math.min(Number(candidate.checkpoint) || 0, 6));

    if (candidate.damageLogged) candidate.checkpoint = Math.max(candidate.checkpoint, 1);
    if (candidate.hidingCompleted) candidate.checkpoint = Math.max(candidate.checkpoint, 2);
    if (candidate.finalReported) candidate.checkpoint = Math.max(candidate.checkpoint, 3);
    if (candidate.actTwoComplete) candidate.checkpoint = Math.max(candidate.checkpoint, 4);
    if (candidate.lockdownActive || candidate.organismAnalysed) {
      candidate.organismAnalysed = true;
      candidate.lockdownActive = true;
      candidate.investigationUnlocked = true;
      candidate.checkpoint = Math.max(candidate.checkpoint, 5);
    }
    if (candidate.securityOverrideComplete) candidate.southHallUnlocked = true;
    if (candidate.cloneRevealed) candidate.securityOverrideComplete = true;
    if (candidate.atmosphereOverrideComplete || candidate.cloneIncapacitated) {
      candidate.southHallUnlocked = true;
      candidate.securityOverrideComplete = true;
      candidate.cloneRevealed = true;
      candidate.atmosphereOverrideComplete = true;
      candidate.cloneIncapacitated = true;
    }
    if (candidate.tacticalGearCollected) {
      candidate.southHallUnlocked = true;
      candidate.securityOverrideComplete = true;
      candidate.cloneRevealed = true;
      candidate.atmosphereOverrideComplete = true;
      candidate.cloneIncapacitated = true;
      candidate.emergencyRebreather = true;
      candidate.tacticalHelmet = true;
      candidate.oxygenTank = true;
      candidate.flamethrower = true;
      candidate.plasmaRefills = true;
      candidate.checkpoint = Math.max(candidate.checkpoint, 6);
    }
    candidate.oxygenMinutesRemaining = Math.max(0, Math.min(Number(candidate.oxygenMinutesRemaining) || 1440, 1440));
    candidate.earthMinutesRemaining = Math.max(0, Math.min(Number(candidate.earthMinutesRemaining) || 2880, 2880));
    candidate.rebreatherSeconds = Math.max(0, Math.min(Number(candidate.rebreatherSeconds) || 90, 90));

    // v0.5.2 removes the Auxiliary Power scavenger chain. Old saves are
    // folded into the single-relay Checkpoint 03 route.
    candidate.bridgeFound = false;
    candidate.regulatorFound = false;
    if (candidate.currentRoom === "auxpower") candidate.currentRoom = "darkcorridor";

    if (candidate.lockdownActive) candidate.mapMode = "lockdown";
    else if (candidate.investigationUnlocked) candidate.mapMode = "investigation";
    else if (candidate.blackoutStarted && !candidate.actTwoComplete) candidate.mapMode = "blackout";
    else if (candidate.actTwoComplete) candidate.mapMode = "act2_control";
    else if (candidate.finalReported) candidate.mapMode = "final_control";
    else if (candidate.branch === "signal" && candidate.engineRepaired) candidate.mapMode = "signal_return";
    else if (candidate.branch === "signal") candidate.mapMode = "signal_engine";
    else if (candidate.branch === "alone" && candidate.satNavRepaired) {
      candidate.mapMode = ["outside", "satnav"].includes(candidate.currentRoom)
        ? "satnav_exterior_return"
        : "satnav_interior_return";
    }
    else if (candidate.branch === "alone" && candidate.satNavFailed) {
      candidate.mapMode = ["outside", "satnav"].includes(candidate.currentRoom)
        ? "satnav_exterior"
        : "satnav_interior";
    }
    else if (candidate.branch === "alone") candidate.mapMode = "alone_engine";
    else candidate.mapMode = "original";

    return candidate;
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The game remains playable without persistent storage.
    }
    refreshTitleMenu();
  }

  function loadCaptainLogNotes() {
    try {
      return localStorage.getItem(CAPTAINS_LOG_KEY) || "";
    } catch {
      return "";
    }
  }

  function setLogSaveStatus(message) {
    if (!logSaveStatus) return;
    logSaveStatus.textContent = message;
  }

  function saveCaptainLogNotes({ immediateStatus = false } = {}) {
    if (!personalLogNotes) return;
    try {
      localStorage.setItem(CAPTAINS_LOG_KEY, personalLogNotes.value);
      setLogSaveStatus(immediateStatus ? "LOG SAVED" : "AUTO-SAVED");
    } catch {
      setLogSaveStatus("LOCAL SAVE UNAVAILABLE");
    }
  }

  function scheduleCaptainLogSave() {
    window.clearTimeout(captainLogSaveTimer);
    setLogSaveStatus("SAVING…");
    captainLogSaveTimer = window.setTimeout(() => saveCaptainLogNotes(), 260);
  }

  function addCaptainLogTimestamp() {
    if (!personalLogNotes) return;
    const stamp = `[MISSION TIME ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}]`;
    const before = personalLogNotes.value.trimEnd();
    personalLogNotes.value = `${before}${before ? "\n" : ""}${stamp} `;
    personalLogNotes.focus();
    personalLogNotes.setSelectionRange(personalLogNotes.value.length, personalLogNotes.value.length);
    saveCaptainLogNotes({ immediateStatus: true });
  }

  function clearCaptainLogNotes() {
    if (!personalLogNotes?.value) return;
    const confirmed = window.confirm("Clear all personal Captain's Log notes? This cannot be undone.");
    if (!confirmed) return;
    personalLogNotes.value = "";
    saveCaptainLogNotes({ immediateStatus: true });
    personalLogNotes.focus();
  }

  function syncCaptainLogUI() {
    if (personalLogNotes && personalLogNotes.value !== loadCaptainLogNotes()) {
      personalLogNotes.value = loadCaptainLogNotes();
    }
    if (organismAnalysisLogEntry) organismAnalysisLogEntry.hidden = !state.organismAnalysed;
  }

  async function playTitleMusic() {
    if (!titleMusic) return false;
    window.cancelAnimationFrame(titleMusicFadeFrame);
    titleMusic.volume = TITLE_MUSIC_DEFAULT_VOLUME;
    try {
      await titleMusic.play();
      titleMusic.dataset.autoplay = "playing";
      return true;
    } catch {
      // Browsers may block audible autoplay. The first pointer or keyboard
      // interaction on the title screen retries playback automatically.
      titleMusic.dataset.autoplay = "blocked";
      return false;
    }
  }

  function fadeTitleMusicOut(duration = 1000) {
    if (!titleMusic || titleMusic.paused) return Promise.resolve();
    window.cancelAnimationFrame(titleMusicFadeFrame);
    const startVolume = titleMusic.volume;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
        titleMusic.volume = Math.max(0, startVolume * (1 - progress));
        if (progress < 1) {
          titleMusicFadeFrame = window.requestAnimationFrame(tick);
          return;
        }
        titleMusic.pause();
        titleMusic.currentTime = 0;
        titleMusic.volume = TITLE_MUSIC_DEFAULT_VOLUME;
        resolve();
      };
      titleMusicFadeFrame = window.requestAnimationFrame(tick);
    });
  }

  function animateAudioVolume(audio, { from = 0, to = 1, duration = 1000, frameKey = "title" } = {}) {
    if (!audio) return Promise.resolve();
    let frame = frameKey === "credits" ? creditsMusicFadeFrame : titleMusicFadeFrame;
    window.cancelAnimationFrame(frame);
    audio.volume = from;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
        audio.volume = from + (to - from) * progress;
        if (progress < 1) {
          const raf = window.requestAnimationFrame(tick);
          if (frameKey === "credits") creditsMusicFadeFrame = raf;
          else titleMusicFadeFrame = raf;
          return;
        }
        resolve();
      };
      const raf = window.requestAnimationFrame(tick);
      if (frameKey === "credits") creditsMusicFadeFrame = raf;
      else titleMusicFadeFrame = raf;
    });
  }

  function beginCreditsAudioCrossfade() {
    if (!creditsMusic) return fadeTitleMusicOut(900);

    window.cancelAnimationFrame(creditsMusicFadeFrame);
    creditsMusic.pause();
    creditsMusic.currentTime = 0;
    creditsMusic.volume = 0;
    creditsMusic.muted = false;
    creditsMusic.dataset.autoplay = "starting";
    if (creditsMuteButton) creditsMuteButton.textContent = "MUTE";

    // play() is called immediately inside the original CREDITS click. Waiting
    // until after the title fade can make browsers reject the second track.
    let playback;
    try {
      playback = creditsMusic.play();
    } catch {
      playback = Promise.reject(new Error("Credits playback blocked"));
    }

    const titleFade = fadeTitleMusicOut(900);
    const creditsFade = Promise.resolve(playback)
      .then(() => {
        creditsMusic.dataset.autoplay = "playing";
        return animateAudioVolume(creditsMusic, {
          from: 0,
          to: CREDITS_MUSIC_DEFAULT_VOLUME,
          duration: 1300,
          frameKey: "credits"
        });
      })
      .catch(() => {
        creditsMusic.dataset.autoplay = "blocked";
        if (creditsStatus) creditsStatus.textContent = "SELECT THE CREDITS SCREEN TO START THE SONG";
        return false;
      });

    return Promise.allSettled([titleFade, creditsFade]);
  }

  async function playCreditsMusic() {
    if (!creditsMusic) return false;
    window.cancelAnimationFrame(creditsMusicFadeFrame);
    try {
      if (creditsMusic.ended) creditsMusic.currentTime = 0;
      await creditsMusic.play();
      creditsMusic.dataset.autoplay = "playing";
      if (creditsMusic.volume <= 0.01) {
        await animateAudioVolume(creditsMusic, {
          from: 0,
          to: CREDITS_MUSIC_DEFAULT_VOLUME,
          duration: 800,
          frameKey: "credits"
        });
      }
      if (creditsStatus) creditsStatus.textContent = "ROLLING CREDITS // SPECIAL SONG PLAYING";
      return true;
    } catch {
      creditsMusic.dataset.autoplay = "blocked";
      if (creditsStatus) creditsStatus.textContent = "CLICK ONCE TO START THE CREDITS SONG";
      return false;
    }
  }

  function fadeCreditsMusicOut(duration = 850) {
    if (!creditsMusic || creditsMusic.paused) return Promise.resolve();
    window.cancelAnimationFrame(creditsMusicFadeFrame);
    const startVolume = creditsMusic.volume;
    const startedAt = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
        creditsMusic.volume = Math.max(0, startVolume * (1 - progress));
        if (progress < 1) {
          creditsMusicFadeFrame = window.requestAnimationFrame(tick);
          return;
        }
        creditsMusic.pause();
        creditsMusic.currentTime = 0;
        creditsMusic.volume = CREDITS_MUSIC_DEFAULT_VOLUME;
        resolve();
      };
      creditsMusicFadeFrame = window.requestAnimationFrame(tick);
    });
  }

  function stopCreditsRoll() {
    if (creditsRollAnimation) {
      creditsRollAnimation.cancel();
      creditsRollAnimation = null;
    }
    if (creditsRoll) creditsRoll.style.transform = "translate3d(0, 0, 0)";
  }

  function restartCreditsRoll() {
    if (!creditsRoll || !creditsRollViewport) return;
    stopCreditsRoll();

    const viewportHeight = Math.max(320, creditsRollViewport.clientHeight);
    if (creditsStartSpacer) creditsStartSpacer.style.height = `${Math.round(viewportHeight * 0.12)}px`;
    if (creditsEndSpacer) creditsEndSpacer.style.height = `${Math.round(viewportHeight * 0.58)}px`;

    // Force measurement only after the modal has a real fixed viewport.
    void creditsRoll.offsetHeight;
    const travel = Math.max(0, creditsRoll.scrollHeight - viewportHeight);
    const duration = 168000; // 2:48, matching the credits song.

    if (typeof creditsRoll.animate !== "function" || travel <= 0) {
      creditsRoll.style.transform = `translate3d(0, -${travel}px, 0)`;
      return;
    }

    creditsRollAnimation = creditsRoll.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(0, -${travel}px, 0)` }
      ],
      {
        duration,
        easing: "linear",
        fill: "forwards"
      }
    );

    creditsRollAnimation.onfinish = () => {
      if (creditsStatus) creditsStatus.textContent = "CREDITS COMPLETE // RETURN WHEN READY";
    };
  }

  async function openCreditsSequence({ fromEnding = false } = {}) {
    if (creditsSequenceOpen) return;
    creditsSequenceOpen = true;
    creditsResumeMode = fromEnding ? "show-title" : (!titleScreen.hidden ? "resume-title-audio" : "show-title");
    if (creditsStatus) {
      creditsStatus.textContent = "ROLLING CREDITS // SPECIAL SONG PLAYING";
      creditsStatus.classList.remove("credits-status-muted");
    }

    closeAllDialogs();
    document.documentElement.classList.add("credits-open");
    document.body.classList.add("credits-open");
    openDialog(creditsDialog);

    // Start the new track while the CREDITS click still counts as a user
    // gesture, then crossfade both tracks concurrently.
    const audioTransition = beginCreditsAudioCrossfade();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restartCreditsRoll();
        if (creditsDoneButton) creditsDoneButton.focus({ preventScroll: true });
      });
    });

    await audioTransition;
  }

  async function closeCreditsSequence() {
    if (!creditsSequenceOpen && !creditsDialog.open) return;
    creditsSequenceOpen = false;
    stopCreditsRoll();
    await fadeCreditsMusicOut(780);
    closeDialog(creditsDialog);
    document.documentElement.classList.remove("credits-open");
    document.body.classList.remove("credits-open");

    if (creditsResumeMode === "show-title") {
      showTitleScreen();
      return;
    }
    if (!titleScreen.hidden) playTitleMusic();
  }

  function toggleCreditsMute() {
    if (!creditsMusic) return;
    creditsMusic.muted = !creditsMusic.muted;
    if (creditsMuteButton) creditsMuteButton.textContent = creditsMusic.muted ? "UNMUTE" : "MUTE";
    if (creditsStatus) {
      creditsStatus.textContent = creditsMusic.muted
        ? "ROLLING CREDITS // SONG MUTED"
        : "ROLLING CREDITS // SPECIAL SONG PLAYING";
      creditsStatus.classList.toggle("credits-status-muted", creditsMusic.muted);
    }
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function preloadImage(source) {
    if (!source) return Promise.resolve(false);
    if (imageCache.has(source)) return imageCache.get(source);

    const promise = new Promise((resolve) => {
      const image = new Image();
      let settled = false;

      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      image.onload = async () => {
        try {
          if (typeof image.decode === "function") await image.decode();
        } catch {
          // The image is still usable when decode() is unsupported or rejects.
        }
        finish(true);
      };
      image.onerror = () => finish(false);
      image.decoding = "async";
      image.src = source;

      if (image.complete) {
        if (image.naturalWidth > 0) image.onload();
        else finish(false);
      }
    });

    imageCache.set(source, promise);
    return promise;
  }

  async function preloadImages(sources, concurrency = 3) {
    const queue = [...new Set(sources.filter(Boolean))];
    const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
      while (queue.length) await preloadImage(queue.shift());
    });
    await Promise.all(workers);
  }

  function warmAdjacentRoomImages(room) {
    const routes = getActiveRoutes?.() || {};
    const nearby = [room, ...(routes[room] || [])];
    const sources = nearby.map((id) => getRoomDefinition(id)?.image).filter(Boolean);
    preloadImages(sources, 2);
  }

  function warmCurrentMapImages() {
    const config = getMapConfig();
    const sources = config.nodes
      .map((node) => getRoomDefinition(node.id)?.image)
      .filter(Boolean);
    preloadImages(sources, 3);
  }

  function startBackgroundImageWarmup() {
    if (backgroundWarmupStarted) return;
    backgroundWarmupStarted = true;

    // Cinematic-only artwork is warmed gently after the active map images, so
    // slow connections are not saturated by forty simultaneous PNG requests.
    const sources = [
      "assets/IMG11.png", "assets/IMG12.png", "assets/IMG16.png",
      "assets/IMG17.png", "assets/IMG18.png", "assets/IMG19.png",
      "assets/IMG20.png", "assets/IMG24.png", "assets/IMG28.png",
      "assets/IMG29.png", "assets/IMG31.png", "assets/IMG32.png",
      "assets/IMG33.png", "assets/IMG34.png", "assets/IMG35.png",
      "assets/IMG36.png", "assets/IMG37.png", "assets/IMG38.png",
      "assets/IMG39.png", "assets/IMG40.png",
      "assets/IMG41.png", "assets/IMG42.png", "assets/IMG43.png",
      "assets/IMG44.png", "assets/IMG45.png", "assets/IMG46.png",
      "assets/IMG47.png", "assets/IMG48.png", "assets/IMG49.png",
      "assets/IMG50.png", "assets/IMG51.png", "assets/IMG52.png",
      "assets/IMG53.png", "assets/IMG55.png", "assets/IMG56.png"
    ];
    const begin = () => preloadImages(sources, 1);

    if ("requestIdleCallback" in window) window.requestIdleCallback(begin, { timeout: 5000 });
    else window.setTimeout(begin, 3500);
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function closeAllDialogs() {
    document.querySelectorAll("dialog[open]").forEach(closeDialog);
  }

  function hasStoredMission() {
    try {
      return [SAVE_KEY, ...LEGACY_KEYS].some((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Boolean(parsed && typeof parsed === "object");
      });
    } catch {
      return false;
    }
  }

  function clearStoredMission() {
    try {
      localStorage.removeItem(SAVE_KEY);
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    } catch {
      // The in-memory reset still works when storage is unavailable.
    }
  }

  function getContinueMeta() {
    if (state.phase === "intro") return `PROLOGUE // SCENE ${String(state.introIndex + 1).padStart(2, "0")}`;
    if (state.checkpoint > 0) return `CHECKPOINT ${String(state.checkpoint).padStart(2, "0")} // ${getRoomName(state.currentRoom)}`;
    return `MISSION IN PROGRESS // ${getRoomName(state.currentRoom)}`;
  }

  function refreshTitleMenu() {
    if (!continueGameButton || !continueGameMeta) return;
    const hasSave = hasStoredMission();
    continueGameButton.hidden = !hasSave;
    continueGameMeta.textContent = hasSave ? getContinueMeta() : "NO MISSION SAVE";
    titleEnterHint.textContent = hasSave
      ? "PRESS ENTER TO PLAY // CONTINUE AVAILABLE"
      : "PRESS ENTER OR SELECT PLAY";
  }

  function hidePrimaryScreens() {
    titleScreen.classList.remove("is-visible");
    titleScreen.hidden = true;
    cinematicShell.hidden = true;
    gameScreen.classList.remove("is-visible");
    gameScreen.hidden = true;
    loseScreen.classList.remove("is-visible");
    loseScreen.hidden = true;
  }

  function armMapReveal() {
    shipMap.dataset.cinematicReveal = "pending";
  }

  async function runCinematicTransition({
    kicker = "MISSION SYSTEM",
    title = "RECONSTRUCTING SHIP SCHEMATIC",
    text = "Buffering mission state…",
    duration = 900,
    task = null,
    showInfo = false,
    fadeInDuration = 350,
    fadeOutDuration = 560
  } = {}) {
    const runId = ++transitionRunId;
    transitionKicker.textContent = kicker;
    transitionTitle.textContent = title;
    transitionText.textContent = text;
    transitionProgress.style.animationDuration = `${Math.max(700, duration)}ms`;
    cinematicTransition.style.setProperty("--transition-fade-in", `${Math.max(0, fadeInDuration)}ms`);
    cinematicTransition.style.setProperty("--transition-fade-out", `${Math.max(0, fadeOutDuration)}ms`);
    cinematicTransition.classList.toggle("has-info", showInfo);
    cinematicTransition.hidden = false;
    cinematicTransition.classList.remove("is-active", "is-leaving");
    await wait(reducedMotion ? 1 : 20);
    if (runId !== transitionRunId) return undefined;
    cinematicTransition.classList.add("is-active");
    await wait(reducedMotion ? 5 : fadeInDuration);

    let result;
    let thrown;
    const operation = (async () => {
      try {
        if (typeof task === "function") result = await task();
      } catch (error) {
        thrown = error;
      }
    })();

    await Promise.all([operation, wait(reducedMotion ? 20 : duration)]);
    if (runId !== transitionRunId) return result;
    cinematicTransition.classList.add("is-leaving");
    await wait(reducedMotion ? 5 : fadeOutDuration);
    if (runId === transitionRunId) {
      cinematicTransition.hidden = true;
      cinematicTransition.classList.remove("is-active", "is-leaving", "has-info");
      cinematicTransition.style.removeProperty("--transition-fade-in");
      cinematicTransition.style.removeProperty("--transition-fade-out");
    }
    if (thrown) throw thrown;
    return result;
  }

  function showTitleScreen() {
    if (creditsMusic && !creditsMusic.paused) {
      creditsMusic.pause();
      creditsMusic.currentTime = 0;
      creditsMusic.volume = CREDITS_MUSIC_DEFAULT_VOLUME;
    }
    closeOrbitalPuzzle();
    stopRebreatherCountdown({ preserve: true });
    cancelActiveSequence();
    closeAllDialogs();
    cinematicShell.hidden = true;
    gameScreen.classList.remove("is-visible");
    gameScreen.hidden = true;
    loseScreen.classList.remove("is-visible");
    loseScreen.hidden = true;
    titleScreen.hidden = false;
    refreshTitleMenu();
    preloadImage("assets/IMG00.png");
  preloadImage("assets/IMG56.png");
    preloadImage("assets/IMG56.png");
    requestAnimationFrame(() => {
      titleScreen.classList.add("is-visible");
      playButton.focus({ preventScroll: true });
      playTitleMusic();
    });
  }

  async function startNewMission({ force = false } = {}) {
    if (!force && hasStoredMission()) {
      const confirmed = window.confirm("Start a new mission? Existing checkpoint progress will be overwritten.");
      if (!confirmed) return;
    }

    cancelActiveSequence();
    closeAllDialogs();
    fadeTitleMusicOut(1050);
    clearStoredMission();
    state = { ...defaultState };
    saveState();
    backgroundWarmupStarted = false;

    await runCinematicTransition({
      kicker: "ELITE FORCES // MISSION ARCHIVE",
      title: "MISSION ARCHIVE INITIALISING",
      text: "Pilot: Luna H. // Destination: Earth // Deep-space route loading",
      duration: 3700,
      showInfo: true,
      fadeInDuration: 450,
      fadeOutDuration: 1100,
      task: async () => {
        hidePrimaryScreens();
        cinematicShell.hidden = false;
        await preloadImages(["assets/IMG01.png", "assets/IMG02.png"], 2);
        await showIntroScene(0, { initial: true });
      }
    });
  }

  async function continueMission() {
    fadeTitleMusicOut(850);
    if (!hasStoredMission()) {
      await startNewMission({ force: true });
      return;
    }

    state = loadState();
    const checkpointText = state.phase === "intro"
      ? "Restoring prologue transmission"
      : `Restoring Checkpoint ${String(state.checkpoint).padStart(2, "0")} at ${getRoomName(state.currentRoom)}`;

    await runCinematicTransition({
      kicker: "MISSION ARCHIVE // SAVE DETECTED",
      title: "MISSION STATE RECOVERED",
      text: checkpointText,
      duration: 950,
      task: async () => {
        hidePrimaryScreens();
        if (state.phase === "intro") {
          cinematicShell.hidden = false;
          await showIntroScene(state.introIndex, { initial: true });
          return;
        }

        gameScreen.hidden = false;
        ensureCurrentRoom();
        armMapReveal();
        updateInterface();
        await showRoom(state.currentRoom, { immediate: true });
        requestAnimationFrame(() => {
          positionToken();
          gameScreen.classList.add("is-visible");
        });
      }
    });
  }

  async function quitToTitle() {
    cancelActiveSequence();
    closeAllDialogs();
    saveState();
    await runCinematicTransition({
      kicker: "MISSION ARCHIVE",
      title: "RETURNING TO TITLE",
      text: "Preserving the latest mission state",
      duration: 700,
      task: showTitleScreen
    });
  }

  function resetBlackoutCheckpointState() {
    state = {
      ...state,
      phase: "game",
      blackoutStarted: true,
      lightsOut: true,
      currentRoom: "control",
      mapMode: "blackout",
      checkpoint: 3,
      relayFound: false,
      bridgeFound: false,
      regulatorFound: false,
      blackoutThreatStep: 0,
      alienRepelled: false,
      lightsRestored: false,
      surveillanceOpened: false,
      shadowFootageViewed: false,
      mimicFootageViewed: false,
      falseGroundContacted: false,
      actTwoComplete: false,
      investigationUnlocked: false,
      organismAnalysed: false,
      lockdownActive: false,
      southHallUnlocked: false,
      securityOverrideComplete: false,
      cloneRevealed: false,
      atmosphereOverrideComplete: false,
      cloneIncapacitated: false,
      emergencyRebreather: false,
      rebreatherSeconds: 90,
      tacticalGearCollected: false,
      tacticalHelmet: false,
      oxygenTank: false,
      flamethrower: false,
      plasmaRefills: false,
      oxygenMinutesRemaining: 1440,
      earthMinutesRemaining: 2880,
      stress: 94
    };
    saveState();
  }

  async function showLoseScreen() {
    cancelActiveSequence();
    await runCinematicTransition({
      kicker: "SUIT TELEMETRY // CONNECTION TERMINATED",
      title: "BIOLOGICAL SIGNAL LOST",
      text: "No further transmission received from Luna H.",
      duration: 900,
      task: () => {
        hidePrimaryScreens();
        loseScreen.hidden = false;
        requestAnimationFrame(() => {
          loseScreen.classList.add("is-visible");
          returnCheckpointButton.focus({ preventScroll: true });
        });
      }
    });
  }

  async function returnToCheckpointFromLoss() {
    loseScreen.classList.remove("is-visible");
    resetBlackoutCheckpointState();
    await restartBlackoutCheckpoint({ stateAlreadyReset: true });
  }

  async function restartFromLoss() {
    loseScreen.classList.remove("is-visible");
    await startNewMission({ force: true });
  }

  async function quitFromLossToTitle() {
    resetBlackoutCheckpointState();
    await quitToTitle();
  }

  const TEXT_FADE_DURATION = 460;

  function restartTextFade(element, text, immediate = false) {
    element.classList.remove("is-fading-in");
    element.textContent = text;

    if (immediate || reducedMotion) return;

    // Force the animation to restart when the same panel receives new text.
    void element.offsetWidth;
    element.classList.add("is-fading-in");
  }

  function setContinueReady(isReady) {
    continueButton.disabled = !isReady;
    continueButton.setAttribute("aria-disabled", String(!isReady));
    keyboardHint.classList.toggle("is-ready", isReady);
    keyboardHint.textContent = isReady ? "ENTER TO CONTINUE" : "ENTER TO COMPLETE TRANSMISSION";
  }

  function completeIntroFade() {
    if (!introTextFading) return;
    introFadeToken += 1;
    narrative.classList.remove("is-fading-in");
    narrative.textContent = introFullText;
    introTextFading = false;
    typeCursor.classList.add("is-hidden");
    setContinueReady(true);
  }

  async function fadeIntroText(text) {
    introFadeToken += 1;
    const token = introFadeToken;
    introFullText = text;
    introTextFading = true;
    typeCursor.classList.add("is-hidden");
    setContinueReady(false);
    restartTextFade(narrative, text);

    if (reducedMotion) {
      completeIntroFade();
      return;
    }

    await wait(TEXT_FADE_DURATION);
    if (token !== introFadeToken) return;

    introTextFading = false;
    narrative.classList.remove("is-fading-in");
    setContinueReady(true);
  }

  async function showIntroScene(index, { initial = false } = {}) {
    const scene = introScenes[index];
    await preloadImage(scene.image);

    if (!initial) {
      cinematicFrame.classList.add("is-transitioning");
      await wait(reducedMotion ? 10 : 480);
    }

    sceneImage.classList.remove("is-visible");
    sceneImage.src = scene.image;
    sceneImage.alt = scene.alt;
    imageCode.textContent = scene.imageCode;
    missionTime.textContent = scene.missionTime;
    sceneCounter.textContent = scene.counter;
    logLabel.textContent = scene.logLabel;
    imagePanel.classList.toggle("alarm", scene.alarm);
    narrative.classList.remove("is-fading-in");
    narrative.textContent = "";
    typeCursor.classList.add("is-hidden");
    setContinueReady(false);

    await wait(reducedMotion ? 10 : 90);
    cinematicFrame.classList.remove("is-transitioning");
    sceneImage.classList.add("is-visible");
    fadeIntroText(scene.text);
  }

  async function advanceIntro() {
    if (introTransitionLocked) return;
    if (introTextFading) {
      completeIntroFade();
      return;
    }

    introTransitionLocked = true;
    if (state.introIndex < introScenes.length - 1) {
      state.introIndex += 1;
      saveState();
      await showIntroScene(state.introIndex);
      introTransitionLocked = false;
      return;
    }

    await enterGame();
    introTransitionLocked = false;
  }

  async function enterGame() {
    state.phase = "game";
    saveState();

    await runCinematicTransition({
      kicker: "VESSEL SYSTEM // DECK 07",
      title: "SHIP SCHEMATIC ONLINE",
      text: "Locating Luna H. and reconstructing the accessible route",
      duration: 950,
      task: async () => {
        cinematicShell.hidden = true;
        gameScreen.hidden = false;
        ensureCurrentRoom();
        armMapReveal();
        updateInterface();
        await showRoom(state.currentRoom, { immediate: true });
        requestAnimationFrame(() => {
          positionToken();
          gameScreen.classList.add("is-visible");
        });
      }
    });

    showToast("SHIP MAP ONLINE // DRAG LUNA OR SELECT A CONNECTED ROOM");
  }

  function getRoomName(room) {
    const names = {
      crew: "CREW QUARTERS",
      hallway: "HALLWAY",
      control: "CONTROL ROOM",
      life: "LIFE SUPPORT",
      south: "SOUTH HALLWAY",
      lab: "LABORATORY",
      store: "STORE ROOM",
      kitchen: "KITCHEN / MESS",
      engineering: "ENGINEERING",
      tunnels: "MAINTENANCE TUNNELS",
      engine: "MAIN ENGINE ROOM",
      airlock: "AIRLOCK",
      outside: "OUTER HULL",
      satnav: "SAT-NAV ARRAY",
      power: "POWER JUNCTION",
      darkcorridor: "DARK CORRIDOR",
      auxpower: "AUXILIARY POWER",
      storage2: "BLACKOUT STORAGE",
      security: "SECURITY CONTROL",
      armoury: "SECURITY ARMOURY",
      tactical: "TACTICAL SUPPLY"
    };
    return names[room] || String(room).toUpperCase();
  }

  function originalMapConfig() {
    const expanded = state.damageLogged;
    const nodes = expanded
      ? [
          { id: "crew", code: "CQ-03", name: "CREW QUARTERS", status: "STARTING LOCATION", x: 15, y: 20 },
          { id: "hallway", code: "H-07", name: "HALLWAY", status: "MAIN ACCESS", x: 39, y: 20 },
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: state.groundContacted ? "CHANNEL OPEN" : "GROUND CONTROL", x: 39, y: 7 },
          { id: "life", code: "LS-07", name: "LIFE SUPPORT", status: state.fireExtinguished ? "FIRE CONTAINED" : "EMERGENCY", x: 66, y: 20, classes: state.fireExtinguished ? ["alert-room", "is-contained"] : ["alert-room"], alert: !state.fireExtinguished },
          { id: "south", code: "SH-07", name: "SOUTH HALLWAY", status: state.groundContacted ? "ACCESSIBLE" : "AWAIT GROUND", x: 66, y: 40 },
          { id: "lab", code: "LAB-07", name: "LABORATORY", status: state.sampleCollected ? "SAMPLE SECURED" : state.residueFound ? "CLUE FOUND" : state.groundContacted ? "UNSCANNED" : "SEALED", x: 87, y: 50 },
          { id: "store", code: "ST-07", name: "STORE ROOM", status: state.equipmentTaken ? "EQUIPPED" : state.alienEncountered ? "ACCESSIBLE" : "SAFETY LOCK", x: 43, y: 63 },
          { id: "kitchen", code: "K-07", name: "KITCHEN / MESS", status: state.alienEncountered ? "CONTACT" : state.sampleCollected ? "UNSCANNED" : "SEALED", x: 66, y: 67 },
          { id: "engineering", code: "EN-07", name: "ENGINEERING", status: state.hidingInProgress ? "HIDING" : state.engineeringUnlocked ? "UNLOCKED" : state.engineeringKey ? "KEY ACQUIRED" : "LOCKED", x: 66, y: 88 }
        ]
      : [
          { id: "crew", code: "CQ-03", name: "CREW QUARTERS", status: "STARTING LOCATION", x: 17, y: 59 },
          { id: "hallway", code: "H-07", name: "HALLWAY", status: "MAIN ACCESS", x: 45, y: 59 },
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: "PILOT SYSTEMS", x: 45, y: 24 },
          { id: "life", code: "LS-07", name: "LIFE SUPPORT", status: state.fireExtinguished ? "FIRE CONTAINED" : "EMERGENCY", x: 78, y: 59, classes: state.fireExtinguished ? ["alert-room", "is-contained"] : ["alert-room"], alert: !state.fireExtinguished }
        ];

    const edges = expanded
      ? [
          ["crew", "hallway"],
          ["hallway", "control"],
          ["hallway", "life"],
          ["life", "south"],
          ["south", "lab"],
          ["south", "store"],
          ["south", "kitchen"],
          ["store", "engineering"],
          ["kitchen", "engineering"]
        ]
      : [
          ["crew", "hallway"],
          ["hallway", "control"],
          ["hallway", "life"]
        ];

    return {
      title: expanded
        ? "DECK 07 // HABITATION, RESEARCH & ENGINEERING"
        : "DECK 07 // CRYOSLEEP & LIFE SUPPORT",
      instruction: expanded
        ? "NEW FACILITIES MAPPED // SELECT AN ADJACENT ROOM"
        : "LOCAL SCHEMATIC // DRAG LUNA OR SELECT AN ADJACENT ROOM",
      expanded,
      compact: !expanded,
      mission: false,
      nodes,
      edges,
      routes: originalRoutes
    };
  }

  function missionMapConfig() {
    if (state.mapMode === "investigation") {
      return {
        title: "DECK 07 // RETURN ROUTE TO LABORATORY",
        instruction: "TAKE THE RESIDUE SAMPLE TO LABORATORY 07",
        expanded: true,
        compact: false,
        mission: true,
        interior: true,
        nodes: [
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: "CHANNEL COMPROMISED", x: 16, y: 18 },
          { id: "hallway", code: "H-07", name: "HALLWAY", status: "ROUTE OPEN", x: 40, y: 18 },
          { id: "life", code: "LS-07", name: "LIFE SUPPORT", status: "SYSTEM STABLE", x: 64, y: 18 },
          { id: "south", code: "SH-07", name: "SOUTH HALLWAY", status: "BIOLOGICAL TRACE", x: 64, y: 50 },
          { id: "lab", code: "LAB-07", name: "LABORATORY", status: state.organismAnalysed ? "ANALYSIS COMPLETE" : "ANALYSIS REQUIRED", x: 84, y: 78, classes: ["is-objective"] }
        ],
        edges: [
          ["control", "hallway"],
          ["hallway", "life"],
          ["life", "south"],
          ["south", "lab"]
        ],
        routes: {
          control: ["hallway"],
          hallway: ["control", "life"],
          life: ["hallway", "south"],
          south: ["life", "lab"],
          lab: ["south"]
        }
      };
    }

    if (state.mapMode === "lockdown") {
      const tacticalStatus = state.tacticalGearCollected
        ? "LOADOUT SECURED"
        : state.cloneIncapacitated
          ? "ACCESS READY"
          : state.securityOverrideComplete
            ? "BIOLOGICAL OCCUPANT"
            : "LOCKDOWN SEALED";
      return {
        title: "DECK 07 // EMERGENCY LOCKDOWN",
        instruction: state.tacticalGearCollected
          ? "TACTICAL LOADOUT SECURED // SHIP OXYGEN REMAINS CRITICAL"
          : !state.southHallUnlocked
            ? "BREACH THE SOUTH HALL ORBITAL LOCK"
            : !state.securityOverrideComplete
              ? "REACH SECURITY CONTROL AND OVERRIDE THE LOCKDOWN"
              : !state.cloneIncapacitated
                ? "ROUTE THE ATMOSPHERE AND INCAPACITATE THE IMITATION"
                : "ENTER TACTICAL SUPPLY BEFORE THE REBREATHER EXPIRES",
        expanded: true,
        compact: false,
        mission: true,
        interior: true,
        lockdown: true,
        nodes: [
          { id: "lab", code: "LAB-07", name: "LABORATORY", status: "CHECKPOINT 05", x: 12, y: 50, classes: ["is-complete"] },
          { id: "south", code: "SH-07", name: "SOUTH HALL", status: state.southHallUnlocked ? "ACCESS OPEN" : "ORBITAL LOCK", x: 38, y: 50, classes: state.southHallUnlocked ? ["is-complete"] : ["is-objective", "is-hack-target"] },
          { id: "security", code: "SEC-02", name: "SECURITY CONTROL", status: state.securityOverrideComplete ? "OPERATIONS ONLINE" : state.southHallUnlocked ? "OVERRIDE REQUIRED" : "BEYOND SOUTH HALL", x: 63, y: 28, classes: state.securityOverrideComplete ? ["is-complete"] : state.southHallUnlocked ? ["is-objective", "is-hack-target"] : ["is-locked"] },
          { id: "tactical", code: "TS-01", name: "TACTICAL SUPPLY", status: state.cloneIncapacitated && !state.emergencyRebreather && !state.tacticalGearCollected ? "REBREATHER REQUIRED" : tacticalStatus, x: 86, y: 50, classes: state.tacticalGearCollected ? ["is-complete"] : state.cloneIncapacitated ? ["is-objective"] : state.securityOverrideComplete ? ["is-biohazard"] : ["is-locked"] }
        ],
        edges: [
          ["lab", "south", state.southHallUnlocked ? "" : "is-danger"],
          ["south", "security", state.southHallUnlocked ? "" : "is-danger"],
          ["security", "tactical", state.cloneIncapacitated ? "" : "is-danger"]
        ],
        routes: {
          lab: ["south"],
          south: ["lab", "security"],
          security: ["south", "tactical"],
          tactical: ["security"]
        }
      };
    }
    if (state.mapMode === "signal_engine" || state.mapMode === "signal_return") {
      return {
        title: state.lightsOut ? "ENGINE CRISIS // EMERGENCY BLACKOUT ROUTE" : "ENGINE CRISIS // RESTRICTED MAINTENANCE ROUTE",
        instruction: state.lightsOut ? "RETURN TO CONTROL WITH FLASHLIGHT" : "REACH ENGINE 02 AND REPAIR THE FAILURE",
        expanded: false,
        compact: false,
        mission: true,
        interior: true,
        nodes: [
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: state.engineRepaired ? "REPORT" : "CRISIS SIGNAL", x: 50, y: 14, classes: state.engineRepaired ? ["is-objective"] : [] },
          { id: "tunnels", code: "MT-07", name: "MAINTENANCE TUNNELS", status: state.lightsOut ? "LIGHTS OUT" : "ACCESS ROUTE", x: 50, y: 50 },
          { id: "engine", code: "ENG-02", name: "MAIN ENGINE ROOM", status: state.engineRepaired ? "REPAIRED" : "ENGINE FAILURE", x: 50, y: 86, classes: state.engineRepaired ? ["is-complete"] : ["is-objective"] }
        ],
        edges: [
          ["control", "tunnels", state.lightsOut ? "is-danger" : ""],
          ["tunnels", "engine", state.lightsOut ? "is-danger" : ""]
        ],
        routes: {
          control: ["tunnels"],
          tunnels: ["control", "engine"],
          engine: ["tunnels"]
        }
      };
    }

    if (state.mapMode === "alone_engine") {
      return {
        title: "ENGINEERING ACCESS // NO EXTERNAL CONTACT",
        instruction: "MOVE THROUGH THE MAINTENANCE TUNNELS",
        expanded: false,
        compact: true,
        mission: true,
        interior: true,
        nodes: [
          { id: "tunnels", code: "MT-07", name: "MAINTENANCE TUNNELS", status: "ACCESS ROUTE", x: 50, y: 27 },
          { id: "engine", code: "ENG-02", name: "MAIN ENGINE ROOM", status: "DIAGNOSTICS", x: 50, y: 73, classes: ["is-objective"] }
        ],
        edges: [["tunnels", "engine"]],
        routes: { tunnels: ["engine"], engine: ["tunnels"] }
      };
    }

    if (state.mapMode === "satnav_interior" || state.mapMode === "satnav_interior_return") {
      const returning = state.mapMode === "satnav_interior_return";
      return {
        title: returning ? "NAVIGATION RESTORED // INTERIOR RETURN ROUTE" : "NAVIGATION FAILURE // INTERIOR SHIP SCHEMATIC",
        instruction: returning
          ? "RETURN TO CONTROL AND REPORT"
          : state.satNavDiagnosed
            ? "AIRLOCK 02 UNLOCKED // PREPARE FOR EVA"
            : "MOVE VERTICALLY TO CONTROL FOR DIAGNOSTICS",
        expanded: false,
        compact: false,
        mission: true,
        interior: true,
        nodes: [
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: returning ? "REPORT" : state.satNavDiagnosed ? "EVA ROUTE LOADED" : "DIAGNOSE", x: 42, y: 17, classes: !state.satNavDiagnosed || returning ? ["is-objective"] : [] },
          { id: "airlock", code: "AL-02", name: "AIRLOCK", status: state.satNavDiagnosed ? state.satNavModule ? "EVA READY" : "MODULE LOCKER" : "LOCKED", x: 76, y: 17, classes: state.satNavDiagnosed && !returning ? ["is-objective"] : [] },
          { id: "tunnels", code: "MT-07", name: "MAINTENANCE TUNNELS", status: "RETURN ROUTE", x: 42, y: 50 },
          { id: "engine", code: "ENG-02", name: "MAIN ENGINE ROOM", status: "ENGINE STABLE", x: 42, y: 83, classes: ["is-complete"] }
        ],
        edges: [
          ["engine", "tunnels"],
          ["tunnels", "control"],
          ["control", "airlock", state.satNavDiagnosed ? "" : "is-locked-route"]
        ],
        routes: {
          engine: ["tunnels"],
          tunnels: ["engine", "control"],
          control: ["tunnels", "airlock"],
          airlock: ["control", "outside"]
        }
      };
    }

    if (state.mapMode === "satnav_exterior" || state.mapMode === "satnav_exterior_return") {
      const returning = state.mapMode === "satnav_exterior_return";
      return {
        title: returning ? "EXTERIOR EVA // RETURN TO AIRLOCK" : "EXTERIOR EVA // SAT-NAV REPAIR SCHEMATIC",
        instruction: returning ? "FOLLOW THE TETHER BACK INSIDE" : "CROSS THE OUTER HULL TO THE SAT-NAV ARRAY",
        expanded: false,
        compact: true,
        mission: true,
        exterior: true,
        nodes: [
          { id: "airlock", code: "AL-02", name: "AIRLOCK", status: returning ? "RETURN POINT" : "EVA ORIGIN", x: 15, y: 50, classes: returning ? ["is-objective"] : [] },
          { id: "outside", code: "EXT-02", name: "OUTER HULL", status: returning ? "TETHER ROUTE" : "VACUUM", x: 50, y: 50 },
          { id: "satnav", code: "NAV-02", name: "SAT-NAV ARRAY", status: state.satNavRepaired ? "REPAIRED" : "COMPONENT FAILURE", x: 85, y: 50, classes: state.satNavRepaired ? ["is-complete"] : ["is-objective"] }
        ],
        edges: [
          ["airlock", "outside", "is-exterior"],
          ["outside", "satnav", "is-exterior"]
        ],
        routes: {
          airlock: ["outside"],
          outside: ["airlock", "satnav"],
          satnav: ["outside"]
        }
      };
    }


    if (state.mapMode === "blackout") {
      const restored = state.lightsRestored;
      return {
        title: restored ? "DECK 01 // LIGHTING RESTORED" : "DECK 01 // BLACKOUT SEARCH GRID",
        instruction: restored
          ? "RETURN TO CONTROL // REVIEW SURVEILLANCE"
          : state.relayFound
            ? "BIOLOGICAL CONTACT // HIDE OR FACE IT"
            : "RECOVER THE POWER RELAY FROM STORAGE",
        expanded: true,
        compact: false,
        mission: true,
        interior: true,
        nodes: [
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: restored ? "SURVEILLANCE ONLINE" : "CHECKPOINT 03", x: 18, y: 20, classes: restored ? ["is-objective"] : [] },
          { id: "power", code: "PJ-07", name: "POWER JUNCTION", status: restored ? "POWER RESTORED" : state.relayFound ? "RELAY READY" : "RELAY MISSING", x: 50, y: 20, classes: restored ? ["is-complete"] : [] },
          { id: "darkcorridor", code: "B-12", name: "DARK CORRIDOR", status: state.relayFound ? "BIOLOGICAL CONTACT" : "NO LIGHTING", x: 50, y: 52, classes: state.relayFound && !restored ? ["is-danger"] : [] },
          { id: "storage2", code: "S-4", name: "STORAGE", status: state.relayFound ? "RELAY RECOVERED" : "UNSEARCHED", x: 50, y: 82, classes: !state.relayFound ? ["is-objective"] : ["is-complete"] }
        ],
        edges: [
          ["control", "power"],
          ["power", "darkcorridor", state.relayFound && !restored ? "is-danger" : ""],
          ["darkcorridor", "storage2", state.relayFound && !restored ? "is-danger" : ""]
        ],
        routes: {
          control: ["power"],
          power: ["control", "darkcorridor"],
          darkcorridor: ["power", "storage2"],
          storage2: ["darkcorridor"]
        }
      };
    }

    if (state.mapMode === "act2_control") {
      return {
        title: "CONTROL ROOM // COMMUNICATIONS COMPROMISED",
        instruction: "NO VERIFIED GROUND CONTROL CHANNEL",
        expanded: false,
        compact: true,
        mission: true,
        final: true,
        nodes: [{ id: "control", code: "CR-01", name: "CONTROL ROOM", status: "CHECKPOINT 04", x: 50, y: 50, classes: ["is-objective"] }],
        edges: [],
        routes: { control: [] }
      };
    }

    return {
      title: "CONTROL ROOM // ISOLATED COMMAND NODE",
      instruction: "NO OTHER FACILITIES AVAILABLE",
      expanded: false,
      compact: true,
      mission: true,
      final: true,
      nodes: [{ id: "control", code: "CR-01", name: "CONTROL ROOM", status: "GROUND CONTROL", x: 50, y: 50, classes: ["is-objective"] }],
      edges: [],
      routes: { control: [] }
    };
  }

  function getMapConfig() {
    return state.mapMode === "original" ? originalMapConfig() : missionMapConfig();
  }

  function ensureCurrentRoom() {
    const config = getMapConfig();
    const ids = new Set(config.nodes.map((node) => node.id));
    if (ids.has(state.currentRoom)) return;
    state.currentRoom = config.nodes[0]?.id || "control";
    saveState();
  }

  function getActiveRoutes() {
    return getMapConfig().routes;
  }

  function getAccessReason(room) {
    if (state.mapMode === "lockdown") {
      if (room === "south") return "";
      if (room === "security" && !state.southHallUnlocked) {
        return "SOUTH HALL SEALED // COMPLETE THE FIRST ORBITAL CIPHER";
      }
      if (room === "tactical" && !state.cloneIncapacitated) {
        return state.securityOverrideComplete
          ? "TACTICAL SUPPLY BIOHAZARD // ATMOSPHERIC CONTAINMENT REQUIRED"
          : "TACTICAL SUPPLY SEALED // SECURITY OPERATIONS OFFLINE";
      }
      if (room === "tactical" && state.cloneIncapacitated && !state.emergencyRebreather && !state.tacticalGearCollected) {
        return "EMERGENCY REBREATHER REQUIRED // TAKE IT FROM SECURITY CONTROL";
      }
      return "";
    }

    if (state.mapMode === "original") {
      const chapterTwoRooms = new Set(["south", "lab", "store", "kitchen", "engineering"]);
      if (chapterTwoRooms.has(room) && !state.damageLogged) return "SOUTHERN DECK UNAVAILABLE // COMPLETE THE LIFE SUPPORT CHECK";
      if (chapterTwoRooms.has(room) && !state.groundContacted) return "NEW DIRECTIVE REQUIRED // CONTACT GROUND CONTROL";
      if (room === "kitchen" && !state.sampleCollected && !state.alienEncountered) return "LABORATORY INSPECTION INCOMPLETE // SECURE THE RESIDUE SAMPLE";
      if (room === "store" && !state.alienEncountered) return "STORE ROOM SAFETY LOCK ACTIVE";
      if (room === "engineering" && !state.alienEncountered) return "ENGINEERING SECURITY LOCK ACTIVE";
      return "";
    }

    if (state.mapMode === "satnav_interior" || state.mapMode === "satnav_interior_return") {
      if (room === "airlock" && !state.satNavDiagnosed) {
        return "AIRLOCK ROUTE LOCKED // DIAGNOSE SAT-NAV FAILURE AT CONTROL";
      }
    }

    if (state.mapMode === "satnav_exterior" || state.mapMode === "satnav_exterior_return") {
      if (room === "outside" && !state.satNavModule && !state.satNavRepaired) {
        return "EVA EQUIPMENT INCOMPLETE // TAKE THE REPLACEMENT MODULE";
      }
      if (room === "satnav" && !state.satNavModule && !state.satNavRepaired) {
        return "REPLACEMENT COMPONENT REQUIRED";
      }
    }

    return "";
  }

  function createMapSvgElement(tag, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === null || value === "") continue;
      element.setAttribute(name, String(value));
    }
    return element;
  }

  function cutawayProfile(config) {
    if (state.mapMode === "original") return config.expanded ? "habitation-full" : "habitation-local";
    if (state.mapMode === "investigation") return "research-wing";
    if (state.mapMode === "lockdown") return "security-wing";
    if (state.mapMode === "signal_engine" || state.mapMode === "signal_return") return "engineering-spine";
    if (state.mapMode === "alone_engine") return "maintenance-spine";
    if (state.mapMode === "satnav_interior" || state.mapMode === "satnav_interior_return") return "command-airlock";
    if (state.mapMode === "satnav_exterior" || state.mapMode === "satnav_exterior_return") return "outer-hull";
    if (state.mapMode === "blackout") return "power-spine";
    return "command-pod";
  }

  function cutawayHullGeometry(profile) {
    const geometries = {
      "habitation-local": {
        outer: "M7 52 Q7 44 15 44 L83 44 Q91 44 95 50 Q96 52 96 56 Q96 60 94 62 Q90 68 82 68 L15 68 Q7 68 7 60 Z",
        accent: "M17 47 H80 M17 65 H80 M20 44 V68 M37 44 V68 M54 44 V68 M71 44 V68",
        glowX: 76,
        glowY: 23
      },
      "habitation-full": {
        outer: "M8 15 Q8 10 13 10 L70 10 Q76 10 80 15 Q82 17 82 21 Q82 24 81 26 L81 34 Q81 39 76 39 L72 39 L72 86 Q72 91 67 91 L59 91 Q54 91 54 86 L54 39 L13 39 Q8 39 8 34 Z",
        accent: "M13 14 H76 M13 35 H76 M20 10 V39 M37 10 V39 M54 10 V39 M71 10 V39 M58 43 H68 M58 57 H68 M58 71 H68 M58 85 H68",
        glowX: 80,
        glowY: 16
      },
      "research-wing": {
        outer: "M9 13 Q9 9 14 9 L69 9 Q75 9 79 14 Q81 16 81 20 Q81 23 80 25 L80 30 Q80 35 75 35 L70 35 L70 84 Q70 89 65 89 L57 89 Q52 89 52 84 L52 35 L14 35 Q9 35 9 30 Z",
        accent: "M14 13 H75 M14 31 H75 M21 9 V35 M38 9 V35 M55 9 V35 M72 9 V35 M56 40 H66 M56 56 H66 M56 72 H66 M56 88 H66",
        glowX: 82,
        glowY: 20
      },
      "security-wing": {
        outer: "M8 45 Q8 40 13 40 L86 40 Q91 40 94 45 Q96 48 96 52 Q96 56 94 59 Q90 64 85 64 L69 64 L69 38 Q69 33 64 33 L56 33 Q51 33 51 38 L51 64 L13 64 Q8 64 8 59 Z",
        accent: "M13 44 H90 M13 60 H90 M20 40 V64 M37 40 V64 M54 40 V64 M71 40 V64 M55 36 H65 M55 33 V64",
        glowX: 88,
        glowY: 23
      },
      "engineering-spine": {
        outer: "M43 7 Q43 4 46 4 L54 4 Q57 4 57 7 L57 93 Q57 96 54 96 L46 96 Q43 96 43 93 Z",
        accent: "M45 11 H55 M45 26 H55 M45 41 H55 M45 56 H55 M45 71 H55 M45 86 H55",
        glowX: 61,
        glowY: 15
      },
      "maintenance-spine": {
        outer: "M43 8 Q43 5 46 5 L54 5 Q57 5 57 8 L57 92 Q57 95 54 95 L46 95 Q43 95 43 92 Z",
        accent: "M45 14 H55 M45 32 H55 M45 50 H55 M45 68 H55 M45 86 H55",
        glowX: 63,
        glowY: 13
      },
      "command-airlock": {
        outer: "M35 9 Q35 6 38 6 L46 6 Q49 6 49 9 L49 28 L79 28 Q84 28 87 31 Q90 34 90 39 L90 47 Q90 52 86 55 Q84 57 79 57 L49 57 L49 91 Q49 94 46 94 L38 94 Q35 94 35 91 L35 9 Z",
        accent: "M37 12 H47 M37 28 H47 M37 44 H47 M37 60 H47 M37 76 H47 M37 92 H47 M52 31 H86 M52 54 H86",
        glowX: 83,
        glowY: 17
      },
      "outer-hull": {
        outer: "M11 45 Q11 40 16 40 L84 40 Q89 40 92 45 Q94 48 94 50 Q94 52 92 55 Q89 60 84 60 L16 60 Q11 60 11 55 Z",
        accent: "M16 44 H87 M16 56 H87 M23 40 V60 M40 40 V60 M57 40 V60 M74 40 V60",
        glowX: 79,
        glowY: 19
      },
      "power-spine": {
        outer: "M13 16 Q13 12 18 12 L54 12 Q59 12 62 17 Q64 20 64 24 Q64 27 63 28 L63 36 Q63 40 60 43 L57 46 L57 89 Q57 93 53 93 L45 93 Q41 93 41 89 L41 47 L38 44 Q35 41 35 36 L35 28 L18 28 Q13 28 13 23 Z",
        accent: "M18 16 H59 M18 24 H59 M25 12 V28 M42 12 V28 M59 12 V28 M43 47 H55 M43 63 H55 M43 79 H55 M43 93 H55",
        glowX: 77,
        glowY: 14
      },
      "command-pod": {
        outer: "M30 36 Q30 24 39 19 L61 19 Q70 24 70 36 L70 64 Q70 76 61 81 L39 81 Q30 76 30 64 Z",
        accent: "M37 24 H63 M37 76 H63 M33 36 H67 M33 64 H67",
        glowX: 67,
        glowY: 23
      }
    };
    return geometries[profile] || geometries["command-pod"];
  }

  function mapSeed(text) {
    let seed = 2166136261;
    for (const character of text) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    return seed >>> 0;
  }

  function mapRandom(seedState) {
    seedState.value = (Math.imul(seedState.value, 1664525) + 1013904223) >>> 0;
    return seedState.value / 4294967296;
  }

  function appendMapDefinitions(svg, uid, geometry) {
    const defs = createMapSvgElement("defs");

    const space = createMapSvgElement("linearGradient", { id: `${uid}-space`, x1: "0", y1: "0", x2: "1", y2: "1" });
    space.append(
      createMapSvgElement("stop", { offset: "0%", "stop-color": "#01040b" }),
      createMapSvgElement("stop", { offset: "52%", "stop-color": "#071426" }),
      createMapSvgElement("stop", { offset: "100%", "stop-color": "#02050a" })
    );

    const nebula = createMapSvgElement("radialGradient", { id: `${uid}-nebula`, cx: `${geometry.glowX}%`, cy: `${geometry.glowY}%`, r: "58%" });
    nebula.append(
      createMapSvgElement("stop", { offset: "0%", "stop-color": state.lockdownActive ? "#6b1020" : "#1e5275", "stop-opacity": state.lockdownActive ? ".34" : ".32" }),
      createMapSvgElement("stop", { offset: "45%", "stop-color": state.lockdownActive ? "#310712" : "#102a47", "stop-opacity": ".14" }),
      createMapSvgElement("stop", { offset: "100%", "stop-color": "#000000", "stop-opacity": "0" })
    );

    const hull = createMapSvgElement("linearGradient", { id: `${uid}-hull`, x1: "0", y1: "0", x2: "1", y2: "1" });
    hull.append(
      createMapSvgElement("stop", { offset: "0%", "stop-color": "#f8fbff", "stop-opacity": ".92" }),
      createMapSvgElement("stop", { offset: "28%", "stop-color": "#b6c6d3", "stop-opacity": ".7" }),
      createMapSvgElement("stop", { offset: "65%", "stop-color": "#506274", "stop-opacity": ".55" }),
      createMapSvgElement("stop", { offset: "100%", "stop-color": "#dceaf2", "stop-opacity": ".72" })
    );

    const deck = createMapSvgElement("radialGradient", { id: `${uid}-deck`, cx: "48%", cy: "40%", r: "70%" });
    deck.append(
      createMapSvgElement("stop", { offset: "0%", "stop-color": state.lockdownActive ? "#16070a" : "#0c1b26" }),
      createMapSvgElement("stop", { offset: "63%", "stop-color": "#060b11" }),
      createMapSvgElement("stop", { offset: "100%", "stop-color": "#020408" })
    );

    const compartment = createMapSvgElement("linearGradient", { id: `${uid}-compartment`, x1: "0", y1: "0", x2: "0", y2: "1" });
    compartment.append(
      createMapSvgElement("stop", { offset: "0%", "stop-color": "#163044", "stop-opacity": ".86" }),
      createMapSvgElement("stop", { offset: "100%", "stop-color": "#050b11", "stop-opacity": ".94" })
    );

    const glow = createMapSvgElement("filter", { id: `${uid}-glow`, x: "-60%", y: "-60%", width: "220%", height: "220%" });
    glow.append(createMapSvgElement("feGaussianBlur", { stdDeviation: "1.2", result: "blur" }));
    const merge = createMapSvgElement("feMerge");
    merge.append(createMapSvgElement("feMergeNode", { in: "blur" }), createMapSvgElement("feMergeNode", { in: "SourceGraphic" }));
    glow.append(merge);

    const shadow = createMapSvgElement("filter", { id: `${uid}-shadow`, x: "-30%", y: "-30%", width: "160%", height: "170%" });
    shadow.append(createMapSvgElement("feDropShadow", { dx: "0", dy: "2.2", stdDeviation: "2.5", "flood-color": "#000712", "flood-opacity": ".92" }));

    const grid = createMapSvgElement("pattern", { id: `${uid}-grid`, width: "3.2", height: "3.2", patternUnits: "userSpaceOnUse" });
    grid.append(createMapSvgElement("path", { d: "M 3.2 0 L 0 0 0 3.2", fill: "none", stroke: "#9ed8ff", "stroke-opacity": ".045", "stroke-width": ".12" }));

    const clip = createMapSvgElement("clipPath", { id: `${uid}-clip` });
    clip.append(createMapSvgElement("path", { d: geometry.outer, transform: "translate(50 50) scale(.925) translate(-50 -50)" }));

    defs.append(space, nebula, hull, deck, compartment, glow, shadow, grid, clip);
    svg.append(defs);
  }

  function appendStarfield(svg, uid, profile) {
    svg.append(createMapSvgElement("rect", { class: "cutaway-space", x: "0", y: "0", width: "100", height: "100", fill: `url(#${uid}-space)` }));
    svg.append(createMapSvgElement("rect", { class: "cutaway-nebula", x: "0", y: "0", width: "100", height: "100", fill: `url(#${uid}-nebula)` }));

    const seedState = { value: mapSeed(`${profile}-${state.checkpoint}`) };
    const starLayerA = createMapSvgElement("g", { class: "cutaway-stars cutaway-stars-a" });
    const starLayerB = createMapSvgElement("g", { class: "cutaway-stars cutaway-stars-b" });
    for (let index = 0; index < 110; index += 1) {
      const x = mapRandom(seedState) * 100;
      const y = mapRandom(seedState) * 100;
      const bright = mapRandom(seedState);
      const radius = bright > .94 ? .18 : bright > .74 ? .105 : .055;
      const star = createMapSvgElement("circle", {
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: radius,
        class: bright > .94 ? "cutaway-star is-bright" : "cutaway-star"
      });
      star.style.setProperty("--star-delay", `${(mapRandom(seedState) * 6).toFixed(2)}s`);
      (index % 2 === 0 ? starLayerA : starLayerB).append(star);
    }
    svg.append(starLayerA, starLayerB);
  }

  function nodeCompartmentSize(node, config) {
    const corridorRooms = new Set(["hallway", "south", "darkcorridor", "tunnels", "outside"]);
    const largeRooms = new Set(["control", "engineering", "engine", "security", "tactical", "lab", "life", "airlock", "satnav", "power"]);
    if (config.final) return { width: 24, height: 18 };
    if (corridorRooms.has(node.id)) return { width: config.compact ? 13.5 : 14.5, height: config.compact ? 13.5 : 14.5 };
    if (largeRooms.has(node.id)) return { width: config.compact ? 16.5 : 18.5, height: config.compact ? 16.5 : 17.5 };
    return { width: config.compact ? 15 : 16, height: config.compact ? 15 : 16 };
  }


  function buildAdjacency(config) {
    const adjacency = Object.fromEntries(config.nodes.map((node) => [node.id, new Set()]));
    for (const [fromId, toId] of config.edges) {
      if (adjacency[fromId]) adjacency[fromId].add(toId);
      if (adjacency[toId]) adjacency[toId].add(fromId);
    }
    return adjacency;
  }

  function buildNodeFrames(config) {
    const byId = Object.fromEntries(config.nodes.map((node) => [node.id, node]));
    const adjacency = buildAdjacency(config);
    const corridorRooms = new Set(["hallway", "south", "darkcorridor", "tunnels", "outside"]);
    const frames = {};

    for (const node of config.nodes) {
      let { width, height } = nodeCompartmentSize(node, config);
      const neighbors = [...(adjacency[node.id] || [])].map((id) => byId[id]).filter(Boolean);

      if (corridorRooms.has(node.id) && neighbors.length) {
        const dxSpread = Math.max(...neighbors.map((neighbor) => Math.abs(neighbor.x - node.x)));
        const dySpread = Math.max(...neighbors.map((neighbor) => Math.abs(neighbor.y - node.y)));
        if (dxSpread >= dySpread) {
          width = Math.max(width + 2, Math.min(28, dxSpread * 2 + 6));
          height = config.compact ? 8.5 : 9.8;
        } else {
          width = config.compact ? 8.5 : 9.8;
          height = Math.max(height + 2, Math.min(28, dySpread * 2 + 6));
        }
      }

      if (node.id === "control" && !config.final) width += 2;
      if (["lab", "security", "tactical", "engineering", "engine"].includes(node.id)) {
        width += 1.5;
        height += 1.5;
      }

      const x = Math.max(1.5, Math.min(98.5 - width, node.x - width / 2));
      const y = Math.max(1.5, Math.min(98.5 - height, node.y - height / 2));
      frames[node.id] = { ...node, x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
    }
    return frames;
  }

  function connectorPoint(frame, target, preferAxis = "auto") {
    const dx = target.x - frame.cx;
    const dy = target.y - frame.cy;
    const horizontal = preferAxis === "horizontal" || (preferAxis === "auto" && Math.abs(dx) >= Math.abs(dy));
    if (horizontal) {
      return {
        x: dx >= 0 ? frame.x + frame.width : frame.x,
        y: frame.cy
      };
    }
    return {
      x: frame.cx,
      y: dy >= 0 ? frame.y + frame.height : frame.y
    };
  }

  function mapCorridorPath(fromFrame, toFrame) {
    const dx = Math.abs(toFrame.cx - fromFrame.cx);
    const dy = Math.abs(toFrame.cy - fromFrame.cy);
    const horizontal = dx >= dy;
    const start = connectorPoint(fromFrame, { x: toFrame.cx, y: toFrame.cy }, horizontal ? "horizontal" : "vertical");
    const end = connectorPoint(toFrame, { x: fromFrame.cx, y: fromFrame.cy }, horizontal ? "horizontal" : "vertical");
    if (dx < 3 || dy < 3) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    if (horizontal) {
      const middleX = (start.x + end.x) / 2;
      return `M ${start.x} ${start.y} H ${middleX} V ${end.y} H ${end.x}`;
    }
    const middleY = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} V ${middleY} H ${end.x} V ${end.y}`;
  }


  function splitRoomName(name) {
    if (name.includes(" / ")) return name.split(" / ");
    const words = name.split(" ");
    if (words.length <= 2) return words;
    const midpoint = Math.ceil(words.length / 2);
    return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
  }

  function roomStatusType(node, accessReason) {
    if (node.alert || /FIRE|BIOHAZARD/i.test(node.status)) return "danger";
    if (accessReason || /LOCKED|SEALED|SAFETY LOCK/i.test(node.status)) return "locked";
    if (/UNSCANNED|UNKNOWN/i.test(node.status)) return "unknown";
    if (node.id === state.currentRoom) return "current";
    const adjacent = getActiveRoutes()[state.currentRoom]?.includes(node.id);
    if (adjacent) return "reachable";
    return "normal";
  }

  function appendRoomInteriorArt(group, frame, node, accessReason) {
    const { x, y, width, height, cx, cy } = frame;
    const insetX = x + 1.4;
    const insetY = y + 3.2;
    const innerW = Math.max(3, width - 2.8);
    const innerH = Math.max(3, height - 4.6);
    const art = createMapSvgElement("g", { class: `cutaway-room-art room-${node.id}` });

    const addRect = (rx, ry, rw, rh, cls = "cutaway-console") => art.append(createMapSvgElement("rect", { x: rx, y: ry, width: rw, height: rh, rx: ".5", class: cls }));
    const addCircle = (ccx, ccy, r, cls = "cutaway-console-ring") => art.append(createMapSvgElement("circle", { cx: ccx, cy: ccy, r, class: cls }));
    const addLine = (x1, y1, x2, y2, cls = "cutaway-room-line") => art.append(createMapSvgElement("path", { d: `M ${x1} ${y1} L ${x2} ${y2}`, class: cls }));

    if (["hallway", "south", "darkcorridor", "tunnels", "outside"].includes(node.id)) {
      for (let i = 1; i <= 4; i += 1) {
        const px = x + width * (i / 5);
        addLine(px, y + 1.9, px, y + height - 1.7, "cutaway-corridor-rib");
      }
      addLine(x + 2, cy, x + width - 2, cy, "cutaway-corridor-lane");
      for (let i = 0; i < 3; i += 1) {
        const ax = x + 3.2 + i * ((width - 6.4) / 3);
        const arrow = createMapSvgElement("path", { d: `M ${ax} ${cy - 1} L ${ax + 1.2} ${cy} L ${ax} ${cy + 1}` , class: "cutaway-arrow" });
        art.append(arrow);
      }
    } else if (node.id === "control") {
      addCircle(cx, cy + 1, Math.min(innerW, innerH) * .21, "cutaway-command-chair");
      addCircle(cx, cy + 1, Math.min(innerW, innerH) * .33, "cutaway-console-ring");
      addRect(insetX + 1.1, insetY + 1.1, innerW - 2.2, 1.5, "cutaway-monitor-bank");
      addRect(insetX + .8, insetY + innerH - 3.2, innerW - 1.6, 1.8, "cutaway-console");
      addRect(insetX + 1.5, insetY + innerH - 5.2, 2.4, 1.3, "cutaway-console");
      addRect(insetX + innerW - 3.9, insetY + innerH - 5.2, 2.4, 1.3, "cutaway-console");
    } else if (node.id === "crew") {
      addRect(insetX + 1, insetY + 1.3, innerW * .36, innerH * .28, "cutaway-bed");
      addRect(insetX + innerW * .58, insetY + 1.3, innerW * .28, innerH * .28, "cutaway-bed");
      addRect(insetX + 1, insetY + innerH * .55, innerW * .36, innerH * .22, "cutaway-bed");
      addRect(insetX + innerW * .58, insetY + innerH * .55, innerW * .28, innerH * .22, "cutaway-bed");
      addRect(cx - 1.2, cy - .8, 2.4, 1.6, "cutaway-table");
    } else if (node.id === "life") {
      addCircle(cx, cy + 1.1, Math.min(innerW, innerH) * .28, "cutaway-life-ring");
      addCircle(cx, cy + 1.1, Math.min(innerW, innerH) * .14, "cutaway-life-core");
      addRect(insetX + .8, insetY + innerH - 3.2, innerW * .28, 1.8, "cutaway-console");
      addRect(insetX + innerW - 4.1, insetY + innerH - 3.2, innerW * .28, 1.8, "cutaway-console");
    } else if (node.id === "lab") {
      addRect(insetX + .8, insetY + 1.2, innerW - 1.6, 1.5, "cutaway-bench");
      addRect(insetX + 1.3, insetY + innerH - 3.4, innerW - 2.6, 1.8, "cutaway-bench");
      addRect(cx - 2.4, cy - 1.8, 4.8, 3.6, "cutaway-specimen");
      const q = createMapSvgElement("text", { x: cx, y: cy + .9, class: "cutaway-room-glyph" });
      q.textContent = state.mapMode === "original" && !state.investigationUnlocked ? "?" : "";
      art.append(q);
    } else if (node.id === "store") {
      for (let r=0;r<2;r+=1) {
        for (let c=0;c<3;c+=1) {
          addRect(insetX + 1 + c * 2.3, insetY + 1.3 + r * 2.5, 1.6, 1.6, "cutaway-crate");
        }
      }
    } else if (node.id === "kitchen") {
      addRect(insetX + 1, insetY + 1.2, innerW - 2, 1.5, "cutaway-counter");
      addRect(cx - 1.6, cy - .6, 3.2, 2.1, "cutaway-table");
      addRect(insetX + 1.2, insetY + innerH - 3, 2.2, 1.4, "cutaway-console");
      addRect(insetX + innerW - 3.4, insetY + innerH - 3, 2.2, 1.4, "cutaway-console");
    } else if (["engineering", "engine", "power"].includes(node.id)) {
      addCircle(cx, cy + .7, Math.min(innerW, innerH) * .28, "cutaway-reactor-ring");
      addCircle(cx, cy + .7, Math.min(innerW, innerH) * .13, "cutaway-reactor-core");
      addRect(insetX + 1, insetY + 1.4, 2.2, 1.6, "cutaway-console");
      addRect(insetX + innerW - 3.2, insetY + 1.4, 2.2, 1.6, "cutaway-console");
    } else if (node.id === "security") {
      for (let i=0;i<3;i+=1) addRect(insetX + 1.1 + i*2.7, insetY + 1.4, 2.1, 1.4, "cutaway-monitor-bank");
      addRect(insetX + 1.2, insetY + innerH - 3, innerW - 2.4, 1.6, "cutaway-console");
    } else if (node.id === "tactical") {
      addRect(insetX + 1.1, insetY + 1.2, innerW - 2.2, 1.6, "cutaway-locker");
      addRect(insetX + 1.1, insetY + 4, innerW - 2.2, 1.6, "cutaway-locker");
      addRect(cx - 2.1, cy + 2.1, 4.2, 1.4, "cutaway-locker");
    } else if (["airlock", "satnav"].includes(node.id)) {
      addCircle(cx, cy, Math.min(innerW, innerH) * .24, "cutaway-airlock-ring");
      addLine(cx - 2, cy, cx + 2, cy, "cutaway-room-line");
      addLine(cx, cy - 2, cx, cy + 2, "cutaway-room-line");
    } else {
      addRect(insetX + 1.1, insetY + 1.1, innerW - 2.2, innerH - 2.2, "cutaway-console");
    }

    if (accessReason || /LOCKED|SEALED/i.test(node.status)) {
      const shield = createMapSvgElement("g", { class: "cutaway-room-lock" });
      shield.append(
        createMapSvgElement("rect", { x: cx - 1.6, y: cy + innerH * .18, width: 3.2, height: 2.2, rx: ".45", class: "cutaway-lock-body" }),
        createMapSvgElement("path", { d: `M ${cx - 1} ${cy + innerH * .18} V ${cy + innerH * .18 - 1} Q ${cx - 1} ${cy + innerH * .18 - 2.2} ${cx} ${cy + innerH * .18 - 2.2} Q ${cx + 1} ${cy + innerH * .18 - 2.2} ${cx + 1} ${cy + innerH * .18 - 1} V ${cy + innerH * .18}`, class: "cutaway-lock-shackle" })
      );
      art.append(shield);
    }
    group.append(art);
  }

  function appendRoomTextOverlay(group, frame, node, accessReason) {
    const titleLines = splitRoomName(node.name.toUpperCase());
    const statusType = roomStatusType(node, accessReason);
    const ui = createMapSvgElement("g", { class: `cutaway-room-ui is-${statusType}` });
    const tx = frame.x + 1.8;
    const ty = frame.y + 2.35;
    ui.append(createMapSvgElement("circle", { cx: tx, cy: ty - .25, r: ".48", class: "cutaway-room-dot" }));
    const code = createMapSvgElement("text", { x: tx + 1.15, y: ty, class: "cutaway-room-code" });
    code.textContent = node.code;
    ui.append(code);
    titleLines.slice(0,2).forEach((line, index) => {
      const t = createMapSvgElement("text", { x: tx, y: ty + 2.5 + index * 2.1, class: "cutaway-room-name" });
      t.textContent = line;
      ui.append(t);
    });
    const status = createMapSvgElement("text", { x: tx, y: frame.y + frame.height - 1.3, class: "cutaway-room-status" });
    status.textContent = (node.status || "").toUpperCase();
    ui.append(status);
    group.append(ui);
  }

  function appendHull(svg, uid, geometry, config) {
    const shadow = createMapSvgElement("path", {
      class: "cutaway-hull-shadow",
      d: geometry.outer,
      transform: "translate(0 2.4)",
      filter: `url(#${uid}-shadow)`
    });
    const outer = createMapSvgElement("path", {
      class: "cutaway-hull-shell",
      d: geometry.outer,
      fill: `url(#${uid}-hull)`
    });
    const deck = createMapSvgElement("path", {
      class: "cutaway-deck",
      d: geometry.outer,
      transform: "translate(50 50) scale(.94) translate(-50 -50)",
      fill: `url(#${uid}-deck)`
    });
    const grid = createMapSvgElement("path", {
      class: "cutaway-deck-grid",
      d: geometry.outer,
      transform: "translate(50 50) scale(.94) translate(-50 -50)",
      fill: `url(#${uid}-grid)`
    });
    const rim = createMapSvgElement("path", { class: "cutaway-hull-rim", d: geometry.outer });
    const accent = createMapSvgElement("path", { class: "cutaway-hull-panels", d: geometry.accent || "" });
    svg.append(shadow, outer, deck, grid, rim, accent);

    if (config.exterior) {
      const upperShell = createMapSvgElement("path", {
        class: "cutaway-exterior-shell",
        d: geometry.outer,
        transform: "translate(50 50) scale(.88) translate(-50 -50)"
      });
      svg.append(upperShell);
    }
  }

  function appendCorridors(svg, uid, config, frames) {
    const layer = createMapSvgElement("g", { class: "cutaway-corridors" });
    for (const [edgeIndex, edge] of config.edges.entries()) {
      const [fromId, toId, edgeClass = ""] = edge;
      const from = frames[fromId];
      const to = frames[toId];
      if (!from || !to) continue;
      const d = mapCorridorPath(from, to);
      const activeRoute = (fromId === state.currentRoom && !getAccessReason(toId)) || (toId === state.currentRoom && !getAccessReason(fromId));
      const classes = `${edgeClass} ${activeRoute ? "is-active-route" : ""}`.trim();
      const casing = createMapSvgElement("path", { d, class: `cutaway-corridor-casing ${classes}`.trim() });
      casing.style.setProperty("--reveal-index", String(edgeIndex));
      const shell = createMapSvgElement("path", { d, class: `cutaway-corridor-shell ${classes}`.trim() });
      shell.style.setProperty("--reveal-index", String(edgeIndex));
      const floor = createMapSvgElement("path", { d, class: `connection-line cutaway-corridor ${classes}`.trim() });
      floor.style.setProperty("--reveal-index", String(edgeIndex));
      const highlight = createMapSvgElement("path", { d, class: `cutaway-corridor-highlight ${classes}`.trim() });
      highlight.style.setProperty("--reveal-index", String(edgeIndex));
      layer.append(casing, shell, floor, highlight);
      if (activeRoute) {
        const pulse = createMapSvgElement("path", { d, class: "cutaway-corridor-pulse" });
        pulse.style.setProperty("--flow-delay", `${edgeIndex * .23}s`);
        layer.append(pulse);
      }
      layer.append(
        createMapSvgElement("circle", { cx: from.x, cy: from.y, r: ".75", class: "cutaway-bulkhead" }),
        createMapSvgElement("circle", { cx: to.x, cy: to.y, r: ".75", class: "cutaway-bulkhead" })
      );
    }
    svg.append(layer);
  }

  function appendCompartments(svg, uid, config, frames) {
    const layer = createMapSvgElement("g", { class: "cutaway-compartments" });
    for (const [nodeIndex, node] of config.nodes.entries()) {
      const frame = frames[node.id];
      const { x, y, width, height } = frame;
      const accessReason = getAccessReason(node.id);
      const adjacent = getActiveRoutes()[state.currentRoom]?.includes(node.id);
      const stateClasses = [
        ...(node.classes || []),
        node.id === state.currentRoom ? "current-room" : "",
        adjacent && !accessReason ? "reachable" : "",
        accessReason ? "is-locked" : "",
        /UNSCANNED|UNKNOWN/i.test(node.status) ? "is-unknown" : "",
        node.alert ? "alert-room" : ""
      ].filter(Boolean).join(" ");
      const group = createMapSvgElement("g", { class: `cutaway-compartment ${stateClasses}`.trim() });
      group.style.setProperty("--reveal-index", String(nodeIndex));
      const shadow = createMapSvgElement("rect", {
        x: x + .65,
        y: y + 1.05,
        width,
        height,
        rx: "2.1",
        class: "cutaway-compartment-shadow"
      });
      const hull = createMapSvgElement("rect", {
        x,
        y,
        width,
        height,
        rx: "2.3",
        class: "cutaway-compartment-hull"
      });
      const room = createMapSvgElement("rect", {
        x: x + .7,
        y: y + .7,
        width: Math.max(1, width - 1.4),
        height: Math.max(1, height - 1.4),
        rx: "1.8",
        class: "cutaway-compartment-room",
        fill: `url(#${uid}-compartment)`
      });
      const interior = createMapSvgElement("rect", {
        x: x + 1.5,
        y: y + 1.5,
        width: Math.max(1, width - 3),
        height: Math.max(1, height - 3),
        rx: "1.1",
        class: "cutaway-compartment-interior"
      });
      const rim = createMapSvgElement("rect", {
        x: x + .9,
        y: y + .9,
        width: Math.max(1, width - 1.8),
        height: Math.max(1, height - 1.8),
        rx: "1.4",
        class: "cutaway-compartment-rim"
      });
      const light = createMapSvgElement("path", {
        d: `M ${x + 2.2} ${y + 1.65} H ${x + width - 2.2}`,
        class: "cutaway-compartment-light"
      });
      group.append(shadow, hull, room, interior, rim, light);
      appendRoomInteriorArt(group, frame, node, accessReason);
      appendRoomTextOverlay(group, frame, node, accessReason);
      layer.append(group);
    }
    svg.append(layer);
  }

  function buildCutawaySvg(config, frames, profile) {
    const geometry = cutawayHullGeometry(profile);
    const uid = `cutaway-${profile}-${Date.now().toString(36)}`;
    const svg = createMapSvgElement("svg", {
      class: "map-connections ship-cutaway-svg",
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      "aria-hidden": "true"
    });
    appendMapDefinitions(svg, uid, geometry);
    appendStarfield(svg, uid, profile);
    appendHull(svg, uid, geometry, config);
    appendCorridors(svg, uid, config, frames);
    appendCompartments(svg, uid, config, frames);
    return svg;
  }

  function renderMap() {
    const config = getMapConfig();
    const revealMap = shipMap.dataset.cinematicReveal === "pending";
    delete shipMap.dataset.cinematicReveal;
    mapTitle.textContent = config.title;
    mapInstruction.textContent = config.instruction;
    shipMap.className = "ship-map cutaway-map";
    if (config.compact) shipMap.classList.add("map-compact");
    if (config.expanded) shipMap.classList.add("map-expanded");
    if (config.mission) shipMap.classList.add("mission-map");
    if (config.interior) shipMap.classList.add("interior-map");
    if (config.exterior) shipMap.classList.add("exterior-map");
    if (config.final) shipMap.classList.add("final-map");
    if (config.lockdown) shipMap.classList.add("lockdown-map");
    if (revealMap) shipMap.classList.add("is-cinematic-reveal");

    const profile = cutawayProfile(config);
    shipMap.dataset.cutawayProfile = profile;
    const frames = buildNodeFrames(config);
    const svg = buildCutawaySvg(config, frames, profile);

    const nodeElements = config.nodes.map((node, nodeIndex) => {
      const frame = frames[node.id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "room-node cutaway-room-hitbox";
      for (const className of node.classes || []) button.classList.add(className);
      button.dataset.room = node.id;
      button.style.setProperty("--x", `${frame.x}%`);
      button.style.setProperty("--y", `${frame.y}%`);
      button.style.setProperty("--w", `${frame.width}%`);
      button.style.setProperty("--h", `${frame.height}%`);
      button.style.setProperty("--reveal-index", String(nodeIndex));

      const accessReason = getAccessReason(node.id);
      const adjacent = getActiveRoutes()[state.currentRoom]?.includes(node.id);
      button.classList.toggle("current-room", node.id === state.currentRoom);
      button.classList.toggle("reachable", Boolean(adjacent && !accessReason));
      button.classList.toggle("is-locked", Boolean(accessReason));
      if (/UNSCANNED|UNKNOWN/i.test(node.status)) button.classList.add("is-unknown");
      if (node.alert) button.classList.add("alert-room");
      button.setAttribute("aria-disabled", String(Boolean(accessReason)));
      button.setAttribute("aria-label", `${node.name}. ${node.status}${accessReason ? `. Locked: ${accessReason}` : ""}`);
      button.addEventListener("click", () => moveToRoom(node.id));
      return button;
    });

    shipMap.replaceChildren(svg, ...nodeElements, lunaToken);
    roomNodes = nodeElements;

    locationReadout.textContent = `LOCATION: ${getRoomName(state.currentRoom)}`;
    const connected = (getActiveRoutes()[state.currentRoom] || [])
      .filter((room) => !getAccessReason(room))
      .map(getRoomName)
      .join(" / ");
    routeReadout.textContent = connected ? `ROUTE STATUS: ${connected}` : "ROUTE STATUS: NO CLEAR EXIT";
    requestAnimationFrame(positionToken);
    if (revealMap) {
      window.clearTimeout(mapRevealTimer);
      mapRevealTimer = window.setTimeout(() => shipMap.classList.remove("is-cinematic-reveal"), reducedMotion ? 20 : 1800);
    }
  }

  function positionToken() {
    if (gameScreen.hidden) return;
    const node = shipMap.querySelector(`[data-room="${state.currentRoom}"]`);
    if (!node) return;
    const mapRect = shipMap.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    lunaToken.style.left = `${nodeRect.left + nodeRect.width / 2 - mapRect.left}px`;
    lunaToken.style.top = `${nodeRect.top + nodeRect.height / 2 - mapRect.top}px`;
  }

  function deriveObjective() {
    if (state.lockdownActive) {
      if (!state.southHallUnlocked) return "Hack the South Hall blast door with the Orbital Cipher";
      if (!state.securityOverrideComplete) return "Reach Security Control and breach lockdown operations";
      if (!state.cloneIncapacitated) return "Purge Tactical Supply and incapacitate the human-form imitation";
      if (!state.tacticalGearCollected) return "Enter Tactical Supply and secure oxygen, helmet and weapons";
      return "Tactical loadout secured // prepare to hunt the organism";
    }
    if (state.investigationUnlocked && !state.organismAnalysed) {
      return state.currentRoom === "lab"
        ? "Load the residue sample into the molecular analysis chamber"
        : "Take the residue sample to Laboratory 07";
    }
    if (state.actTwoComplete) return "Take the residue sample to Laboratory 07 for analysis";
    if (state.blackoutStarted) {
      if (!state.relayFound) return "Search Storage for the missing power relay";
      if (!state.alienRepelled) return "Choose: hide from the organism or face it with the plasma gun";
      if (!state.lightsRestored) return "Install the recovered relay at the Power Junction";
      if (!state.surveillanceOpened) return "Access the restored surveillance archive in Control";
      if (!state.falseGroundContacted) return "Attempt contact with Ground Control";
      return "Trace the organism's access to the ship systems";
    }
    if (state.finalReported) return "Hold position in Control // do not enter Earth's landing corridor";

    if (state.branch === "signal") {
      if (!state.engineRepaired) return "Reach the Main Engine Room and repair Engine 02";
      return "Return to Control through the blackout and report to Ground Control";
    }

    if (state.branch === "alone") {
      if (!state.satNavFailed) return "Reach the Main Engine Room through the maintenance tunnels";
      if (!state.satNavDiagnosed) return "Return to Control and diagnose the sat-nav failure";
      if (state.satNavRepaired) return "Return to Control and report to Ground Control";
      if (!state.satNavModule) return "Take the replacement module from the Airlock service locker";
      return "Cross the outer hull and replace the sat-nav component";
    }

    if (!state.fireExtinguished) return state.currentRoom === "life" ? "Extinguish the fire in Life Support" : "Investigate the fire in Life Support";
    if (!state.damageLogged) return "Inspect and log the compromised oxygen control panel";
    if (!state.groundContacted) return "Report the sabotage to Ground Control";
    if (!state.residueFound) return "Inspect the ship's facilities for further compromise";
    if (!state.sampleCollected) return "Secure a sample of the black residue";
    if (!state.alienEncountered) return "Continue the inspection in the Kitchen / Mess Hall";
    if (!state.equipmentTaken) return "Find equipment and an Engineering access key";
    if (!state.engineeringUnlocked) return "Unlock the Engineering Room";
    if (!state.hideChoice) return "Hide before the organism reaches Engineering";
    if (!state.hidingCompleted) return "Remain silent and avoid detection";
    return "Choose whether to send a crisis signal or face Engineering alone";
  }

  function updateThreatReadout() {
    threatReadout.className = "danger-readout";
    const label = threatReadout.querySelector("span");
    const value = threatReadout.querySelector("strong");

    if (state.lockdownActive) {
      threatReadout.classList.add("is-alien");
      label.textContent = "ALERT";
      value.textContent = "LOCKDOWN";
      return;
    }
    if (state.investigationUnlocked && !state.organismAnalysed) {
      threatReadout.classList.add("is-warning");
      label.textContent = "TRACE";
      value.textContent = "MIMIC";
      return;
    }
    if (!state.fireExtinguished) {
      label.textContent = "ALERT";
      value.textContent = "FIRE";
      return;
    }
    if (state.lightsOut) {
      threatReadout.classList.add("is-alien");
      label.textContent = "POWER";
      value.textContent = "BLACKOUT";
      return;
    }
    if (state.finalReported) {
      threatReadout.classList.add("is-alien");
      label.textContent = "EARTH";
      value.textContent = "HOLD";
      return;
    }
    if (state.currentRoom === "outside" || state.currentRoom === "satnav") {
      threatReadout.classList.add("is-warning");
      label.textContent = "ENV";
      value.textContent = "VACUUM";
      return;
    }
    if (state.hidingCompleted || state.alienEncountered || state.residueFound) {
      threatReadout.classList.add("is-alien");
      label.textContent = state.hidingCompleted ? "CREW" : state.alienEncountered ? "THREAT" : "TRACE";
      value.textContent = state.hidingCompleted ? "02" : state.alienEncountered ? "HUNT" : "BIO";
      return;
    }
    if (state.damageLogged) {
      threatReadout.classList.add("is-warning");
      label.textContent = "STATUS";
      value.textContent = "UNKNOWN";
      return;
    }
    threatReadout.classList.add("is-safe");
    label.textContent = "STATUS";
    value.textContent = "CONTAINED";
  }

  function updateInventory() {
    const items = [];
    if (state.sampleCollected) items.push("SPECIMEN JAR");
    if (state.plasmaGun) items.push("PLASMA GUN");
    if (state.flashlight) items.push("FLASHLIGHT");
    if (state.engineeringKey) items.push("ENGINEERING KEY");
    if (state.satNavModule) items.push("SAT-NAV MODULE");
    if (state.relayFound && !state.lightsRestored) items.push("POWER RELAY");
    if (state.emergencyRebreather && !state.tacticalGearCollected) items.push("EMERGENCY REBREATHER");
    if (state.tacticalHelmet) items.push("TACTICAL HELMET");
    if (state.oxygenTank) items.push("OXYGEN TANK");
    if (state.flamethrower) items.push("FLAMETHROWER");
    if (state.plasmaRefills) items.push("PLASMA CELLS");

    inventoryItems.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("span");
      empty.className = "inventory-empty";
      empty.textContent = "NO FIELD ITEMS";
      inventoryItems.append(empty);
      return;
    }

    items.forEach((item, index) => {
      const chip = document.createElement("span");
      chip.className = "inventory-item";
      chip.style.animationDelay = `${index * 70}ms`;
      chip.textContent = item;
      inventoryItems.append(chip);
    });
  }

  function updateInterface() {
    ensureCurrentRoom();
    objectiveText.textContent = deriveObjective();
    gameScreen.classList.toggle("has-mission-clocks", state.lockdownActive);
    if (state.lockdownActive) {
      oxygenLabel.textContent = "O₂ LEFT";
      powerLabel.textContent = "EARTH ETA";
      oxygenReadout.textContent = formatMissionClock(state.oxygenMinutesRemaining);
      powerReadout.textContent = formatMissionClock(state.earthMinutesRemaining);
    } else {
      oxygenLabel.textContent = "O₂";
      powerLabel.textContent = "POWER";
      oxygenReadout.textContent = state.currentRoom === "outside" || state.currentRoom === "satnav" ? "88%" : state.lightsOut ? "91%" : state.fireExtinguished ? "94%" : "96%";
      powerReadout.textContent = state.lightsOut ? "43%" : state.satNavFailed ? "68%" : state.alienEncountered ? "76%" : state.damageLogged ? "79%" : "81%";
    }
    stressReadout.textContent = `${String(state.stress).padStart(2, "0")}%`;
    updateThreatReadout();
    updateInventory();
    renderMap();
    warmCurrentMapImages();
  }

  function getHideDescription() {
    const descriptions = {
      workbench: "Luna slides beneath the maintenance workbench and pulls the plasma gun tight against her chest. A wet shape crosses the threshold. Its weight bends the deck grating above her.",
      engine: "Luna folds herself behind the engine housing. Heat bites through her suit while something drags itself between the machinery, testing the air with slow, liquid clicks.",
      locker: "Luna seals herself inside the coolant locker. Darkness closes around her. Condensation taps the metal from inside as something stops directly outside."
    };
    return descriptions[state.hideChoice] || "Luna forces herself into cover as the organism enters Engineering.";
  }

  function getRoomDefinition(room) {
    if (state.mapMode === "investigation") {
      const investigationRooms = {
        control: {
          code: "CR-01",
          title: "CONTROL ROOM",
          status: "CHANNEL COMPROMISED",
          statusClass: "is-alien",
          image: "assets/IMG40.png",
          fallbackImage: "assets/IMG04.png",
          alt: "The Control Room after the organism has corrupted the Ground Control transmission.",
          caption: "COMMUNICATIONS SOURCE // INTERNAL NETWORK",
          mediaClass: "is-alien",
          text: "The false Ground Control signal has collapsed into static. Luna seals the relay and checks the specimen jar at her belt. The black residue inside is still moving.\n\nThe Laboratory may be able to tell her what entered the ship, how it travelled here and whether it can be killed."
        },
        hallway: {
          code: "H-07",
          title: "HALLWAY",
          status: "ROUTE OPEN",
          statusClass: "is-warning",
          image: "assets/IMG13.png",
          fallbackImage: "assets/IMG02.png",
          alt: "The dark central hallway leading toward the southern research deck.",
          caption: "DECK 07 // RETURN ROUTE TO LABORATORY",
          mediaClass: "is-alien",
          text: "Luna moves with the plasma gun raised and the residue sample secured against her suit. The ship is quiet again, but security indicators pulse under her own credentials."
        },
        life: {
          code: "LS-07",
          title: "LIFE SUPPORT",
          status: "SYSTEM STABLE",
          statusClass: "is-warning",
          image: "assets/IMG06.png",
          fallbackImage: "assets/IMG04.png",
          alt: "The repaired Life Support compartment and sabotaged oxygen controls.",
          caption: "LIFE SUPPORT // MANUAL BYPASS HOLDING",
          mediaClass: "",
          text: "The oxygen bypass is holding. Luna crosses the compartment without slowing. The organism once opened this panel using her copied authorisation. The sample may explain how."
        },
        south: {
          code: "SH-07",
          title: "SOUTH HALLWAY",
          status: "BIOLOGICAL TRACE",
          statusClass: "is-alien",
          image: "assets/IMG13.png",
          fallbackImage: "assets/IMG04.png",
          alt: "The southern hallway outside Laboratory 07.",
          caption: "SOUTHERN RESEARCH DECK // LABORATORY AHEAD",
          mediaClass: "is-alien",
          text: "Black smears remain along the ceiling seams, but the movement has stopped. Laboratory 07 waits at the end of the corridor under cold blue light."
        },
        lab: {
          code: "LAB-07",
          title: "LABORATORY",
          status: "ANALYSIS READY",
          statusClass: "is-warning",
          image: "assets/IMG41.png",
          fallbackImage: "assets/IMG09.png",
          alt: "Luna re-enters the cold Laboratory carrying the residue sample and plasma gun.",
          caption: "LABORATORY 07 // MOLECULAR ANALYSIS AVAILABLE",
          mediaClass: "",
          text: "The Laboratory is exactly as Luna left it: sterile, silent and powered by cold blue emergency strips. She locks the door behind her and places the specimen beside the molecular analysis chamber.\n\nInside the jar, the residue stretches toward the scanner light."
        }
      };
      if (investigationRooms[room]) return investigationRooms[room];
    }

    if (state.mapMode === "lockdown") {
      const clocks = `Earth intercept: ${formatMissionClock(state.earthMinutesRemaining)}. Breathable ship oxygen: ${formatMissionClock(state.oxygenMinutesRemaining)}.`;
      const lockdownRooms = {
        lab: {
          code: "LAB-07",
          title: "LABORATORY",
          status: "EMERGENCY LOCKDOWN",
          statusClass: "is-danger",
          image: "assets/IMG49.png",
          fallbackImage: "assets/IMG41.png",
          alt: "Luna stands armed inside the Laboratory as red lockdown lights seal the ship.",
          caption: "CHECKPOINT 05 // THE IMITATION",
          mediaClass: "is-alien",
          text: `Reinforced doors have sealed throughout the ship under Luna's copied biometric authority. ${clocks}

The ship cannot keep Luna alive until Earth arrival. She must breach the South Hall, seize Security Control and reach the tactical oxygen supply before the reserve fails.`
        },
        south: {
          code: "SH-07",
          title: "SOUTH HALL BLAST DOOR",
          status: state.southHallUnlocked ? "ACCESS OPEN" : "ORBITAL LOCK",
          statusClass: state.southHallUnlocked ? "is-success" : "is-warning",
          image: "assets/IMG50.png",
          fallbackImage: "assets/IMG49.png",
          alt: "Luna operates the emergency interface beside the sealed South Hall blast door.",
          caption: state.southHallUnlocked ? "SOUTH HALL // SECURITY ROUTE OPEN" : "ORBITAL CIPHER // LOCAL DOOR PROCESSOR",
          mediaClass: "",
          text: state.southHallUnlocked
            ? `The orbital key has stabilised and the blast door is open. Security Control lies beyond. ${clocks}`
            : `The South Hall door has rejected Luna's copied credentials. Its isolated maintenance processor will accept only a gravitational security key.

${clocks} Luna must reconstruct the orbital cipher and force the door before the oxygen deficit becomes irreversible.`
        },
        security: {
          code: "SEC-02",
          title: "SECURITY CONTROL",
          status: state.securityOverrideComplete ? state.cloneIncapacitated ? "CONTAINMENT COMPLETE" : "TACTICAL FEED LIVE" : "OPERATIONS LOCKED",
          statusClass: state.cloneIncapacitated ? "is-success" : state.securityOverrideComplete ? "is-alien" : "is-warning",
          image: "assets/IMG51.png",
          fallbackImage: "assets/IMG04.png",
          alt: "A compact security control room aboard Luna's small spacecraft.",
          caption: state.securityOverrideComplete ? "SECURITY OPERATIONS // TACTICAL SUPPLY MONITORED" : "SECURITY MAINFRAME // ORBITAL AUTHENTICATION REQUIRED",
          mediaClass: state.securityOverrideComplete && !state.cloneIncapacitated ? "is-alien" : "",
          text: !state.securityOverrideComplete
            ? `The compact security room is intact, but every lockdown control is sealed behind a second orbital lattice. Breaking it will release the weapons lockers and restore environmental command.

${clocks}`
            : !state.cloneIncapacitated
              ? `Security operations are online. The tactical camera identifies a human figure inside Supply as LUNA H. It is standing between Luna and the oxygen tank, helmet, flamethrower and plasma cells.

The imitation has completed a human form. It needs air.`
              : `Tactical Supply holds at 3.2% oxygen under stable pressure. The copied human body has collapsed. Security Control has released a ninety-second emergency rebreather for the retrieval.

Luna has one brief crossing to secure the real oxygen equipment.`
        },
        tactical: {
          code: "TS-01",
          title: "TACTICAL SUPPLY",
          status: state.tacticalGearCollected ? "LOADOUT SECURED" : "ATMOSPHERE PURGED",
          statusClass: state.tacticalGearCollected ? "is-success" : "is-danger",
          image: state.tacticalGearCollected ? "assets/IMG55.png" : "assets/IMG53.png",
          fallbackImage: state.tacticalGearCollected ? "assets/IMG49.png" : "assets/IMG52.png",
          alt: state.tacticalGearCollected ? "Luna wears a sealed helmet and oxygen tank with her weapons ready." : "Security footage shows the human-form imitation collapsed inside Tactical Supply.",
          caption: state.tacticalGearCollected ? "TACTICAL LOADOUT // OXYGEN ONLINE" : "TACTICAL SUPPLY // OXYGEN 3.2% // REBREATHER ACTIVE",
          mediaClass: state.tacticalGearCollected ? "" : "is-alien",
          text: state.tacticalGearCollected
            ? "The helmet seals and the oxygen line turns green. Luna seats fresh plasma cells, shoulders the flamethrower and checks the pressure gauge. She can breathe. The ship still cannot."
            : `The temporary hood fogs with every breath. The imitation lies motionless beside the tactical lockers, its copied lungs defeated by the purge.

REBREATHER: ${formatRebreatherTime(state.rebreatherSeconds)}. Luna must open the locker and connect the proper oxygen system now.`
        }
      };
      if (lockdownRooms[room]) return lockdownRooms[room];
    }
    if (state.blackoutStarted && (state.mapMode === "blackout" || state.mapMode === "act2_control")) {
      const definitions = {
        control: {
          code: "CR-01",
          title: "CONTROL ROOM",
          status: state.actTwoComplete ? "CHANNEL COMPROMISED" : state.lightsRestored ? "SURVEILLANCE ONLINE" : "SHIPWIDE BLACKOUT",
          statusClass: state.actTwoComplete ? "is-alien" : state.lightsRestored ? "is-success" : "is-danger",
          image: state.actTwoComplete ? "assets/IMG40.png" : state.lightsRestored ? "assets/IMG36.png" : "assets/IMG22.png",
          fallbackImage: state.lightsRestored || state.actTwoComplete ? "assets/IMG04.png" : "assets/IMG21.png",
          alt: "The ship control room during the blackout and subsequent surveillance investigation.",
          caption: state.actTwoComplete ? "COMMUNICATIONS CORRUPTED // SOURCE INTERNAL" : state.lightsRestored ? "SURVEILLANCE HUB // ARCHIVE ONLINE" : "CONTROL ROOM // EMERGENCY POWER ONLY",
          mediaClass: state.actTwoComplete ? "is-alien" : "",
          text: state.actTwoComplete
            ? "The terminal has gone silent. Ground Control is not on the channel. The organism has learned the ship's communications architecture and used it to imitate a rescue directive."
            : state.lightsRestored
              ? "The Control Room is bright again. Camera feeds populate the surveillance terminal, including archived recordings from the hours while Luna remained in cryosleep."
              : "Every primary light aboard the ship is dead. The Control Room survives on red indicators and Luna's flashlight. Diagnostics identify one missing power relay in the lighting grid."
        },
        power: {
          code: "PJ-07",
          title: "POWER JUNCTION",
          status: state.lightsRestored ? "POWER RESTORED" : state.relayFound ? "RELAY READY" : "RELAY MISSING",
          statusClass: state.lightsRestored ? "is-success" : "is-warning",
          image: state.lightsRestored ? "assets/IMG35.png" : state.relayFound ? "assets/IMG33.png" : "assets/IMG23.png",
          fallbackImage: "assets/IMG04.png",
          alt: "The compact Power Junction aboard Luna's ship.",
          caption: state.lightsRestored ? "LIGHTING GRID // ONLINE" : "POWER JUNCTION // MANUAL REPAIR REQUIRED",
          mediaClass: "",
          text: state.lightsRestored
            ? "White light rolls through the corridor one fixture at a time. The grid stabilises. Whatever Luna struck with the plasma gun has retreated into the walls."
            : state.relayFound
              ? "The recovered relay is ready for installation, but wet movement is closing through the corridor. Luna must deal with the organism first."
              : "The junction reports one absent module: the main power relay. It was not blown. It was physically removed and carried into Storage."
        },
        darkcorridor: {
          code: "B-12",
          title: "DARK CORRIDOR",
          status: state.relayFound ? "BIOLOGICAL CONTACT" : "NO LIGHTING",
          statusClass: "is-alien",
          image: state.relayFound ? "assets/IMG30.png" : "assets/IMG25.png",
          fallbackImage: "assets/IMG21.png",
          alt: "A narrow corridor in darkness where the alien is hunting Luna.",
          caption: "CORRIDOR B-12 // BIOLOGICAL SIGNAL UNRESOLVED",
          mediaClass: "is-alien",
          text: state.relayFound
            ? "The organism blocks the route back. It feels along the walls toward Luna, recoiling whenever the flashlight crosses its face. Hiding will give it time to find her. The plasma gun is already in her hand."
            : "Luna advances through the dark corridor. Black residue has spread along the wall seams, joining conduits as though it understands where the power runs."
        },
        storage2: {
          code: "S-4",
          title: "STORAGE",
          status: state.relayFound ? "SEARCH COMPLETE" : "UNSEARCHED",
          statusClass: state.relayFound ? "is-success" : "is-warning",
          image: state.relayFound ? "assets/IMG27.png" : "assets/IMG26.png",
          fallbackImage: "assets/IMG04.png",
          alt: "A dark storage room and the recovered power relay.",
          caption: state.relayFound ? "ITEM ACQUIRED // POWER RELAY" : "STORAGE S-4 // FLASHLIGHT SEARCH",
          mediaClass: "",
          text: state.relayFound
            ? "The power relay is intact. Something had placed it carefully beneath a sealed equipment crate rather than discarding it."
            : "Shelving divides the storage room into blind corners. Luna can search the tool cabinet, floor crates and the sealed maintenance locker."
        }
      };
      if (definitions[room]) return definitions[room];
    }

    if (room === "tunnels") {
      return {
        code: "MT-07",
        title: "MAINTENANCE TUNNELS",
        status: state.lightsOut ? "NO LIGHTING" : "RESTRICTED ACCESS",
        statusClass: state.lightsOut ? "is-alien" : "is-warning",
        image: state.lightsOut ? "assets/IMG21.png" : "assets/IMG15.png",
        alt: state.lightsOut ? "Luna searches a dark engineering passage using her flashlight." : "The unlocked engineering maintenance access aboard Luna's ship.",
        caption: state.lightsOut ? "FLASHLIGHT FEED // INTERNAL POWER OFFLINE" : "MAINTENANCE ACCESS // ENGINE DECK",
        mediaClass: state.lightsOut ? "is-alien" : "",
        text: state.lightsOut
          ? "The tunnel lighting is dead. Luna's flashlight cuts a narrow path across pipes, cable trunks and open grating. Something shifts beyond the beam, then keeps pace inside the wall beside her."
          : state.branch === "signal"
            ? "The crisis transmission ends behind Luna as she enters the maintenance route. Engine 02 is losing thrust. The only path to the Main Engine Room is a narrow service passage threaded through the ship's machinery."
            : state.satNavFailed
              ? "The maintenance route leads back toward Control. Navigation warnings pulse through Luna's suit as the ship drifts away from its Earth approach vector."
              : "Luna leaves the transmitter silent and moves into the maintenance access alone. The tunnels magnify every breath and every soft movement travelling through the hull."
      };
    }

    if (room === "engine") {
      if (state.branch === "signal" && state.engineRepaired) {
        return {
          code: "ENG-02",
          title: "MAIN ENGINE ROOM",
          status: "LIGHTING FAILURE",
          statusClass: "is-alien",
          image: "assets/IMG21.png",
          alt: "The small ship's engine room in total darkness, lit only by Luna's flashlight.",
          caption: "ENGINE 02 STABLE // SHIPWIDE LIGHTING OFFLINE",
          mediaClass: "is-alien",
          text: "Engine 02 catches and settles into a steady burn. One second later, every overhead light dies. Luna raises the flashlight. The engine room has become a cavern of black machinery and isolated red indicators."
        };
      }

      return {
        code: "ENG-02",
        title: "MAIN ENGINE ROOM",
        status: state.branch === "signal" ? "ENGINE FAILURE" : state.satNavFailed ? "NAVIGATION LOST" : "DIAGNOSTICS",
        statusClass: state.branch === "signal" ? "is-danger" : state.satNavFailed ? "is-warning" : "",
        image: "assets/IMG17.png",
        alt: "The compact main engine room of Luna's small deep-space vessel.",
        caption: "MAIN ENGINE ASSEMBLY // ENGINE 02",
        mediaClass: "",
        text: state.branch === "signal"
          ? "Engine 02 shudders inside its mounting frame. Coolant pressure is falling and the magnetic feed regulator has fused half-open. Luna can replace the damaged regulator manually, but the engine must remain live while she works."
          : state.satNavFailed
            ? "The engines remain stable, but the navigation alarm now dominates the room. The satellite array has stopped returning position data. The ship is flying blind."
            : "The engine assembly is intact. Luna reaches the diagnostic console and begins checking the systems before the organism can sabotage them. A warning blooms across the display: SATELLITE NAVIGATION SIGNAL LOST."
      };
    }

    if (room === "airlock") {
      return {
        code: "AL-02",
        title: "AIRLOCK",
        status: state.satNavModule ? "EVA READY" : "SERVICE LOCKER",
        statusClass: state.satNavModule ? "is-success" : "is-warning",
        image: "assets/IMG18.png",
        alt: "A compact industrial airlock with an EVA suit and exterior hatch.",
        caption: "AIRLOCK 02 // EXTERIOR MAINTENANCE",
        mediaClass: "",
        text: state.satNavModule
          ? "Luna's suit is sealed and the replacement navigation module is clipped to her harness. Beyond the outer hatch, the ship's hull falls away into the black of The Void."
          : "The airlock service locker contains one sealed sat-nav component and an EVA tether. Luna will have to carry both outside and cross the hull to the damaged array."
      };
    }

    if (room === "outside") {
      return {
        code: "EXT-02",
        title: "OUTER HULL",
        status: "VACUUM",
        statusClass: "is-warning",
        image: "assets/IMG19.png",
        alt: "The exterior hull and damaged satellite navigation array of Luna's ship in deep space.",
        caption: "EXTERIOR CAMERA // SAT-NAV ARRAY AHEAD",
        mediaClass: "",
        text: state.satNavRepaired
          ? "The array is transmitting again. Luna follows the tether back toward the airlock while Earth hangs far beyond the ship, small and impossibly vulnerable."
          : "Magnetic boots lock Luna to the hull. The satellite array rises ahead, damaged panels spread against the stars. Her radio fills with interference that almost resembles breathing."
      };
    }

    if (room === "satnav") {
      return {
        code: "NAV-02",
        title: "SAT-NAV ARRAY",
        status: state.satNavRepaired ? "NAVIGATION RESTORED" : "COMPONENT FAILURE",
        statusClass: state.satNavRepaired ? "is-success" : "is-danger",
        image: "assets/IMG20.png",
        alt: "From Luna's perspective, her gloved hand works on the satellite navigation components outside the ship.",
        caption: "SAT-NAV MODULE // MANUAL REPLACEMENT",
        mediaClass: "",
        text: state.satNavRepaired
          ? "The replacement locks into place. Position data floods back into the ship and the Earth-return vector stabilises. Luna is still outside, and something has disturbed the hull plating beside the array."
          : "Luna opens the navigation housing. Several contacts have been torn from their sockets rather than burned out. She braces one hand against the hull and aligns the replacement module with the exposed assembly."
      };
    }

    if (room === "crew") {
      return {
        code: "CQ-03",
        title: "CREW QUARTERS",
        status: "SAFE",
        statusClass: "",
        image: "assets/IMG02.png",
        alt: "Luna awake inside the cryosleep chamber under red emergency light.",
        caption: "CRYOSLEEP UNIT 03",
        mediaClass: "",
        text: "Luna stands beside the open cryosleep pod, fighting through the last fog of suspended sleep. The alarm repeats beyond the bulkhead. Every third pulse is followed by a faint vibration through the deck.\n\nThe ship map identifies an active fire in Life Support."
      };
    }

    if (room === "hallway") {
      return {
        code: "H-07",
        title: "HALLWAY",
        status: state.alienEncountered ? "MOVEMENT DETECTED" : "EMERGENCY LIGHTING",
        statusClass: state.alienEncountered ? "is-alien" : "",
        image: state.alienEncountered ? "assets/IMG13.png" : "assets/IMG02.png",
        alt: "A dim emergency corridor aboard the spacecraft.",
        caption: state.alienEncountered ? "DECK 07 // INTERNAL MOTION UNRESOLVED" : "HALLWAY H-07",
        mediaClass: state.alienEncountered ? "is-alien" : "",
        text: state.alienEncountered
          ? "The emergency lights no longer pulse in sequence. Somewhere inside the walls, a slick weight moves against the ship's direction of travel."
          : "The main hallway flashes between darkness and amber emergency light. Smoke has begun to drift from the Life Support access door.\n\nThe Control Room branches away to the north. Life Support lies at the far end of the corridor."
      };
    }

    if (room === "control") {
      if (state.finalReported) {
        return {
          code: "CR-01",
          title: "CONTROL ROOM",
          status: "EARTH APPROACH SUSPENDED",
          statusClass: "is-alien",
          image: "assets/IMG04.png",
          alt: "The ship's control room under warning lights.",
          caption: "LANDING CORRIDOR // ACCESS DENIED",
          mediaClass: "is-alien",
          text: "The rest of the ship has vanished from the schematic. Only Control remains. Ground Control has frozen Luna's Earth approach and marked the vessel as a biological containment risk.\n\nThe relay stays open, but nobody speaks."
        };
      }

      if (state.branch === "signal") {
        return {
          code: "CR-01",
          title: "CONTROL ROOM",
          status: state.engineRepaired ? "REPORT REQUIRED" : "CRISIS SIGNAL SENT",
          statusClass: state.engineRepaired ? "is-warning" : "is-danger",
          image: "assets/IMG04.png",
          alt: "The spacecraft control room lit by cold displays and emergency warnings.",
          caption: state.engineRepaired ? "DEEP SPACE RELAY // REPORT ENGINE STATUS" : "CRISIS TRANSMISSION // ENGINE 02 FAILURE",
          mediaClass: "",
          text: state.engineRepaired
            ? "Luna reaches Control in darkness. The crisis carrier is still open. Ground Control has received the engine telemetry and is waiting for her report."
            : "The crisis signal has left the ship. Before Ground Control can finish responding, Engine 02 falls out of synchronisation. The map has collapsed to one maintenance route leading to the Main Engine Room."
        };
      }

      if (state.branch === "alone") {
        return {
          code: "CR-01",
          title: "CONTROL ROOM",
          status: state.satNavRepaired ? "REPORT REQUIRED" : state.satNavDiagnosed ? "EVA ROUTE LOADED" : "NAVIGATION FAILURE",
          statusClass: state.satNavRepaired ? "is-warning" : "is-danger",
          image: "assets/IMG04.png",
          alt: "The spacecraft control room with satellite navigation alarms active.",
          caption: "PRIMARY FLIGHT CONTROL // SAT-NAV OFFLINE",
          mediaClass: "",
          text: state.satNavRepaired
            ? "The return vector is stable again. Ground Control has acquired the vessel's telemetry and is waiting on the relay."
            : state.satNavDiagnosed
              ? "The failed component is external. Control has loaded the repair route from the Airlock to the satellite array and released a replacement module from the EVA service locker."
              : "Navigation has stopped receiving position data. Luna must diagnose the external array before she can leave the ship."
        };
      }

      let text = "The Control Room is dim but operational. Navigation still holds the return course to Earth. Across the central console, a fire warning competes with a quieter notification: the Pilot Archive recorded an internal access event while Luna was asleep.";
      if (state.damageLogged && !state.groundContacted) text = "The sabotage report is waiting on the primary console. Ground Control's relay beacon has acquired the vessel, though the signal stutters each time it passes through the ship's internal network.\n\nLuna needs to report what happened in Life Support.";
      else if (state.groundContacted) text = "Ground Control remains on a narrow encrypted carrier. Their orders are unambiguous: inspect every facility, document anything compromised, and assume no system can be trusted.\n\nThe southern access route is now open on the ship map.";
      return {
        code: "CR-01",
        title: "CONTROL ROOM",
        status: state.groundContacted ? "CHANNEL OPEN" : "ONLINE",
        statusClass: state.damageLogged && !state.groundContacted ? "is-warning" : "",
        image: "assets/IMG04.png",
        alt: "The spacecraft control room lit by cold displays and warning lights.",
        caption: state.damageLogged ? "DEEP SPACE RELAY AVAILABLE" : "PRIMARY FLIGHT CONTROL // PILOT ARCHIVE AVAILABLE",
        mediaClass: "",
        text
      };
    }

    if (room === "life") {
      if (!state.fireExtinguished) {
        return {
          code: "LS-07",
          title: "LIFE SUPPORT",
          status: "FIRE ACTIVE",
          statusClass: "is-danger",
          image: "assets/IMG05.png",
          alt: "Luna faces a fierce fire consuming machinery inside Life Support.",
          caption: "OXYGEN SUPPLY CONTROL UNIT // SUPPRESSION OFFLINE",
          mediaClass: "",
          text: "Heat breaks across Luna's suit as the access door opens. Fire has taken hold around the oxygen supply assembly, feeding on scorched insulation and leaking coolant vapour.\n\nThe automatic suppression system is offline. Luna can trigger the portable suppressant from her suit, but she will have to remain close to the flames."
        };
      }
      let text = "The suppressant smothers the last flames. When the smoke thins, Luna sees the oxygen control housing hanging open. Its shield plate was removed before the fire began. Several cables have been pulled loose, stripped and reconnected by hand.\n\nThe heat did not cause this damage. Someone tampered with Life Support.";
      if (state.damageLogged) text += "\n\nThe ship has attached an authorised credential to the access event: LUNA H. Luna was in cryosleep when the panel was opened.";
      return {
        code: "LS-07",
        title: "LIFE SUPPORT",
        status: state.damageLogged ? "SABOTAGE LOGGED" : "FIRE CONTAINED",
        statusClass: state.damageLogged ? "is-warning" : "is-success",
        image: "assets/IMG06.png",
        alt: "A damaged oxygen supply control panel with its casing open and wires deliberately rerouted.",
        caption: "OXYGEN SUPPLY CONTROL PANEL // COMPROMISED",
        mediaClass: "",
        text
      };
    }

    if (room === "south") {
      return {
        code: "SH-07",
        title: "SOUTH HALLWAY",
        status: state.alienEncountered ? "MOVEMENT DETECTED" : "LOW POWER",
        statusClass: state.alienEncountered ? "is-alien" : "is-warning",
        image: "assets/IMG13.png",
        alt: "A dark southern hallway ending at the locked Engineering Room.",
        caption: "SOUTH HALLWAY // LAB, STORE, MESS & ENGINEERING",
        mediaClass: state.alienEncountered ? "is-alien" : "",
        text: state.alienEncountered
          ? "The corridor has gone unnaturally still. Black smears glisten along the ceiling seams, leading toward Engineering. Behind Luna, something clicks against the Kitchen door."
          : "The southern wing was kept offline during cryosleep. Its lights return reluctantly, one strip at a time. The Laboratory branches to the right. Farther down are the Store Room, Kitchen and the locked Engineering Room."
      };
    }

    if (room === "lab") {
      if (state.sampleCollected) {
        return {
          code: "LAB-07",
          title: "LABORATORY",
          status: "SPECIMEN SECURED",
          statusClass: "is-warning",
          image: "assets/IMG09.png",
          alt: "Luna holds a specimen jar containing black organic residue.",
          caption: "SPECIMEN JAR // UNKNOWN ORGANIC COMPOUND",
          mediaClass: "",
          text: "The sample clings to the inside of the jar instead of settling at the bottom. When Luna turns her wrist, the residue stretches toward the warmth of her hand.\n\nThe ship's laboratory cannot identify its composition."
        };
      }
      if (state.residueFound) {
        return {
          code: "LAB-07",
          title: "LABORATORY",
          status: "UNKNOWN RESIDUE",
          statusClass: "is-alien",
          image: "assets/IMG08.png",
          alt: "A sticky black organic residue spread across a laboratory workstation.",
          caption: "WORKSTATION 02 // COMPOSITION UNKNOWN",
          mediaClass: "is-alien",
          text: "A glossy black residue has spread across the workstation in branching, thread-like patterns. It is too thick to be coolant and too warm to be machine oil.\n\n\"What the fuck...?\" Luna whispers. The nearest strand contracts at the sound of her voice."
        };
      }
      return {
        code: "LAB-07",
        title: "LABORATORY",
        status: "UNSCANNED",
        statusClass: "",
        image: "assets/IMG07.png",
        alt: "A large, cold spacecraft laboratory filled with workstations and sample equipment.",
        caption: "LABORATORY 07 // RESEARCH FACILITY",
        mediaClass: "",
        text: "The Laboratory should have been sterile when Luna entered cryosleep. One workstation is powered, its task light shining across a surface that looks wet."
      };
    }

    if (room === "kitchen") {
      return {
        code: "K-07",
        title: "KITCHEN / MESS",
        status: state.alienEncountered ? "BIOLOGICAL CONTACT" : "DOOR SEALED",
        statusClass: state.alienEncountered ? "is-alien" : "is-warning",
        image: state.alienEncountered ? "assets/IMG12.png" : "assets/IMG10.png",
        alt: state.alienEncountered ? "A black alien organism hangs inside the spacecraft mess hall." : "Luna enters the dim ship's kitchen and mess hall.",
        caption: state.alienEncountered ? "MESS HALL // UNKNOWN LIFE FORM" : "MESS HALL 07 // AUDIO EVENT DETECTED",
        mediaClass: state.alienEncountered ? "is-alien" : "",
        text: state.alienEncountered
          ? "The thing has withdrawn from the ceiling, leaving black strings across the metal. The door to the corridor has released. Luna can hear it moving toward Engineering."
          : "The Kitchen is empty, but it does not feel abandoned. A cup sits in the centre of a table. One chair faces the wrong direction.\n\nThe door clicks shut behind Luna. On the counter, beneath a cold utility light, lies another trace of black residue."
      };
    }

    if (room === "store") {
      return {
        code: "ST-07",
        title: "STORE ROOM",
        status: state.equipmentTaken ? "EQUIPMENT REMOVED" : "FIELD EQUIPMENT",
        statusClass: state.equipmentTaken ? "is-success" : "is-warning",
        image: "assets/IMG14.png",
        alt: "A compact spacecraft store room containing a plasma gun, flashlight and access key.",
        caption: "STORE ROOM // EMERGENCY FIELD EQUIPMENT",
        mediaClass: "",
        text: state.equipmentTaken
          ? "The open cases are empty. Luna has the plasma gun, flashlight and Engineering key. The creature is somewhere beyond the wall."
          : "The emergency store contains exactly what Luna needs: a plasma gun in a sealed case, a heavy flashlight and the manual access key for Engineering. She takes all three."
      };
    }

    if (room === "engineering") {
      if (!state.engineeringUnlocked) {
        return {
          code: "EN-07",
          title: "ENGINEERING",
          status: "LOCKED",
          statusClass: "is-danger",
          image: "assets/IMG13.png",
          alt: "The Engineering Room door locked under red access warnings.",
          caption: "ENGINEERING ACCESS // CLEARANCE DENIED",
          mediaClass: "",
          text: "The Engineering door refuses Luna's biometric clearance. A physical key is required. Behind the metal, something strikes a pipe and then becomes still."
        };
      }
      let text = "The Engineering door unlocks. Inside, machinery divides the room into pockets of deep shadow. Luna hears the creature entering the corridor behind her. She has seconds to choose a hiding place.";
      if (state.hidingInProgress) text = `${getHideDescription()}\n\nA voice speaks from the doorway in Luna's exact tone: \"Luna... Ground Control requires confirmation.\"`;
      if (state.hidingCompleted) text = "The creature has moved deeper into the ship. A diagnostic screen beside Luna has awakened by itself.\n\nCREW DETECTED: 02.\n\nLuna must decide whether to return to Control and send a crisis signal, or move into the engineering systems alone.";
      return {
        code: "EN-07",
        title: "ENGINEERING",
        status: state.hidingCompleted ? "TWO LIFE SIGNS" : state.hidingInProgress ? "HIDING" : "UNLOCKED",
        statusClass: "is-alien",
        image: "assets/IMG15.png",
        alt: "The compact Engineering Room unlocked and filled with machinery and places to hide.",
        caption: state.hidingCompleted ? "CREW DETECTED // 02" : "ENGINEERING ROOM // MOVEMENT APPROACHING",
        mediaClass: "is-alien",
        text
      };
    }

    return {
      code: "SYS-00",
      title: "UNKNOWN LOCATION",
      status: "NO DATA",
      statusClass: "is-warning",
      image: "assets/IMG04.png",
      alt: "A dark spacecraft interior.",
      caption: "SHIP SYSTEM // NO DATA",
      mediaClass: "",
      text: "The ship cannot resolve this location."
    };
  }

  function fadeRoomText(text, immediate = false) {
    roomFadeToken += 1;
    roomCursor.classList.add("is-hidden");
    restartTextFade(roomNarrative, text, immediate);
  }

  async function swapRoomMedia(definition, immediate = false) {
    mediaSwapToken += 1;
    const token = mediaSwapToken;
    const requestedSource = definition.image;
    let source = requestedSource;
    let loaded = await preloadImage(source);

    if (!loaded && definition.fallbackImage) {
      source = definition.fallbackImage;
      loaded = await preloadImage(source);
    }
    if (token !== mediaSwapToken) return;

    roomImage.alt = definition.alt;
    mediaCaption.textContent = definition.caption;
    roomMedia.className = `room-media ${definition.mediaClass || ""}`.trim();

    // Never replace a working tile with a broken URL. The old image remains
    // visible until the new asset is downloaded and decoded.
    if (!loaded) return;
    if (roomImage.getAttribute("src") !== source) roomImage.src = source;
  }

  function createAction(action, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    if (action.danger) button.classList.add("is-danger");
    if (action.special) button.classList.add("is-special");
    if (action.disabled) {
      button.disabled = true;
      button.classList.add("is-disabled");
    }

    const label = document.createElement("span");
    label.className = "action-label";
    label.textContent = action.label;
    const meta = document.createElement("span");
    meta.className = "action-meta";
    meta.textContent = action.meta || String(index + 1).padStart(2, "0");
    button.append(label, meta);

    if (!action.disabled) {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        button.disabled = true;
        window.setTimeout(action.onClick, reducedMotion ? 0 : 70);
      });
    }
    return button;
  }

  function getRoomActions(room) {
    if (state.mapMode !== "original") return getMissionActions(room);

    if (room === "crew") return [{ label: "ENTER HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }];

    if (room === "hallway") {
      return [
        { label: "ENTER CONTROL ROOM", meta: state.damageLogged && !state.groundContacted ? "REQUIRED" : "OPTIONAL", special: state.damageLogged && !state.groundContacted, onClick: () => moveToRoom("control") },
        { label: "PROCEED TO LIFE SUPPORT", meta: state.fireExtinguished ? "CLEAR" : "FIRE", danger: !state.fireExtinguished, onClick: () => moveToRoom("life") },
        { label: "RETURN TO CREW QUARTERS", meta: "MOVE", onClick: () => moveToRoom("crew") }
      ];
    }

    if (room === "control") {
      const actions = [];
      if (state.damageLogged && !state.groundContacted) actions.push({ label: "CONTACT GROUND CONTROL", meta: "REQUIRED", special: true, onClick: () => openDialog(groundControlDialog) });
      actions.push({ label: "OPEN CAPTAIN'S LOG", meta: state.logOpened ? "READ" : "NEW", onClick: openPilotLog });
      actions.push({ label: "RETURN TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") });
      return actions;
    }

    if (room === "life" && !state.fireExtinguished) {
      return [
        { label: "EXTINGUISH FIRE", meta: "ACTIVATE SUPPRESSANT", danger: true, onClick: extinguishFire },
        { label: "RETREAT TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }
      ];
    }

    if (room === "life") {
      const actions = [];
      if (!state.damageLogged) actions.push({ label: "LOG THE SABOTAGE", meta: "CHECKPOINT", special: true, onClick: logDamage });
      if (state.damageLogged && !state.groundContacted) actions.push({ label: "REPORT TO CONTROL ROOM", meta: "REQUIRED", special: true, onClick: () => moveToRoom("hallway") });
      if (state.groundContacted) actions.push({ label: "ENTER SOUTH HALLWAY", meta: "NEW AREA", special: true, onClick: () => moveToRoom("south") });
      actions.push({ label: "RETURN TO MAIN HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") });
      return actions;
    }

    if (room === "south") {
      const actions = [{ label: "ENTER LABORATORY", meta: state.sampleCollected ? "CLEARED" : "INSPECT", special: !state.sampleCollected, onClick: () => moveToRoom("lab") }];
      if (state.sampleCollected) actions.push({ label: "ENTER KITCHEN / MESS", meta: state.alienEncountered ? "CONTACT" : "INSPECT", danger: state.alienEncountered, onClick: () => moveToRoom("kitchen") });
      if (state.alienEncountered) actions.push({ label: "ENTER STORE ROOM", meta: state.equipmentTaken ? "CLEARED" : "EQUIPMENT", special: !state.equipmentTaken, onClick: () => moveToRoom("store") });
      actions.push({ label: "RETURN TO LIFE SUPPORT", meta: "MOVE", onClick: () => moveToRoom("life") });
      return actions;
    }

    if (room === "lab") {
      const actions = [];
      if (!state.residueFound) actions.push({ label: "INSPECT THE WORKSTATION", meta: "CLUE", special: true, onClick: inspectResidue });
      else if (!state.sampleCollected) actions.push({ label: "COLLECT A SPECIMEN", meta: "ITEM", special: true, onClick: collectSample });
      else actions.push({ label: "PROCEED TO KITCHEN / MESS", meta: "INSPECT", special: true, onClick: () => moveToRoom("south") });
      actions.push({ label: "RETURN TO SOUTH HALLWAY", meta: "MOVE", onClick: () => moveToRoom("south") });
      return actions;
    }

    if (room === "kitchen") {
      if (!state.alienEncountered) {
        return [
          { label: "INSPECT THE KITCHEN COUNTER", meta: "CLUE", special: true, onClick: inspectKitchenCounter },
          { label: "TRY THE SEALED DOOR", meta: "LOCKED", onClick: () => showToast("MESS HALL DOOR // LOCAL LOCKOUT ACTIVE") }
        ];
      }
      return [
        { label: "RUN TO ENGINEERING", meta: "ESCAPE", danger: true, onClick: () => moveToRoom("engineering") },
        { label: "RETURN TO SOUTH HALLWAY", meta: "MOVE", onClick: () => moveToRoom("south") }
      ];
    }

    if (room === "store") {
      const actions = [];
      if (!state.equipmentTaken) actions.push({ label: "TAKE ALL FIELD EQUIPMENT", meta: "3 ITEMS", special: true, onClick: takeEquipment });
      if (state.equipmentTaken) actions.push({ label: "GO TO ENGINEERING", meta: "KEY READY", special: true, onClick: () => moveToRoom("engineering") });
      actions.push({ label: "RETURN TO SOUTH HALLWAY", meta: "MOVE", onClick: () => moveToRoom("south") });
      return actions;
    }

    if (room === "engineering") {
      if (!state.engineeringUnlocked) {
        return state.engineeringKey
          ? [
              { label: "UNLOCK ENGINEERING", meta: "USE KEY", special: true, onClick: unlockEngineering },
              { label: "RETURN TO STORE ROOM", meta: "MOVE", onClick: () => moveToRoom("store") }
            ]
          : [
              { label: "SEARCH THE STORE ROOM", meta: "FIND KEY", special: true, onClick: () => moveToRoom("store") },
              { label: "RETREAT TO KITCHEN", meta: "MOVE", onClick: () => moveToRoom("kitchen") }
            ];
      }

      if (state.hidingCompleted) {
        return [
          { label: "CHOOSE LUNA'S NEXT MOVE", meta: "MAJOR DECISION", special: true, onClick: () => openDialog(branchDialog) },
          { label: "REVIEW CHECKPOINT 02", meta: "STATUS", onClick: () => openDialog(chapterDialog) }
        ];
      }

      if (state.hidingInProgress) return [{ label: "REMAIN SILENT", meta: "DO NOT RESPOND", danger: true, onClick: completeHiding }];

      return [
        { label: "HIDE UNDER THE WORKBENCH", meta: "LOW COVER", onClick: () => chooseHide("workbench") },
        { label: "HIDE BEHIND ENGINE HOUSING", meta: "HEAT RISK", onClick: () => chooseHide("engine") },
        { label: "HIDE INSIDE COOLANT LOCKER", meta: "LOW O₂", onClick: () => chooseHide("locker") }
      ];
    }

    return [];
  }

  function getMissionActions(room) {
    if (state.lockdownActive) {
      if (room === "lab") {
        return [
          { label: "APPROACH SOUTH HALL", meta: "ORBITAL LOCK", special: true, onClick: () => moveToRoom("south") },
          { label: "OPEN CAPTAIN'S LOG", meta: "ORGANISM ANALYSIS", onClick: openPilotLog }
        ];
      }
      if (room === "south") {
        if (!state.southHallUnlocked) {
          return [
            { label: "INITIATE ORBITAL CIPHER", meta: "HACK 01 // ACCESS", special: true, onClick: () => startOrbitalPuzzle("south") },
            { label: "RETURN TO LABORATORY", meta: "MOVE", onClick: () => moveToRoom("lab") }
          ];
        }
        return [
          { label: "ENTER SECURITY CONTROL", meta: state.securityOverrideComplete ? "ONLINE" : "HACK REQUIRED", special: true, onClick: () => moveToRoom("security") },
          { label: "RETURN TO LABORATORY", meta: "MOVE", onClick: () => moveToRoom("lab") }
        ];
      }
      if (room === "security") {
        const actions = [];
        if (!state.securityOverrideComplete) {
          actions.push({ label: "BREACH SECURITY OPERATIONS", meta: "HACK 02 // LOCKDOWN", special: true, onClick: () => startOrbitalPuzzle("security") });
        } else if (!state.cloneIncapacitated) {
          actions.push({ label: "ROUTE OXYGEN & INERT GAS", meta: "HACK 03 // ATMOSPHERE", danger: true, onClick: () => startOrbitalPuzzle("atmosphere") });
          actions.push({ label: "REVIEW TACTICAL CAMERA", meta: "FALSE LUNA", onClick: showCloneSurveillance });
        } else if (!state.emergencyRebreather) {
          actions.push({ label: "TAKE EMERGENCY REBREATHER", meta: "90 SEC", special: true, onClick: prepareTacticalRetrieval });
        } else {
          actions.push({ label: "ENTER TACTICAL SUPPLY", meta: "LOW OXYGEN", danger: true, onClick: () => moveToRoom("tactical") });
        }
        actions.push({ label: "RETURN TO SOUTH HALL", meta: "MOVE", onClick: () => moveToRoom("south") });
        return actions;
      }
      if (room === "tactical") {
        if (!state.tacticalGearCollected) {
          return [
            { label: "OPEN TACTICAL LOCKER", meta: "OXYGEN + WEAPONS", special: true, onClick: collectTacticalLoadout },
            { label: "RETREAT TO SECURITY CONTROL", meta: "REBREATHER", danger: true, onClick: () => moveToRoom("security") }
          ];
        }
        return [
          { label: "CHECK TACTICAL LOADOUT", meta: "CHECKPOINT 06", special: true, onClick: showTacticalLoadout },
          { label: "RETURN TO SECURITY CONTROL", meta: "MOVE", onClick: () => moveToRoom("security") },
          { label: "OPEN CAPTAIN'S LOG", meta: "PERSONAL NOTES", onClick: openPilotLog }
        ];
      }
      return [];
    }

    if (state.investigationUnlocked) {
      if (room === "control") {
        return [
          { label: "ENTER HALLWAY", meta: "LABORATORY ROUTE", special: true, onClick: () => moveToRoom("hallway") },
          { label: "OPEN CAPTAIN'S LOG", meta: "PERSONAL NOTES", onClick: openPilotLog }
        ];
      }
      if (room === "hallway") return [
        { label: "PROCEED THROUGH LIFE SUPPORT", meta: "LAB ROUTE", special: true, onClick: () => moveToRoom("life") },
        { label: "RETURN TO CONTROL", meta: "MOVE", onClick: () => moveToRoom("control") }
      ];
      if (room === "life") return [
        { label: "ENTER SOUTH HALLWAY", meta: "LABORATORY", special: true, onClick: () => moveToRoom("south") },
        { label: "RETURN TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }
      ];
      if (room === "south") return [
        { label: "ENTER LABORATORY", meta: "ANALYSE SAMPLE", special: true, onClick: () => moveToRoom("lab") },
        { label: "RETURN THROUGH LIFE SUPPORT", meta: "MOVE", onClick: () => moveToRoom("life") }
      ];
      if (room === "lab") return [
        { label: "LOAD RESIDUE SAMPLE", meta: "MOLECULAR ANALYSIS", special: true, onClick: runLaboratoryMontage },
        { label: "OPEN CAPTAIN'S LOG", meta: "PERSONAL NOTES", onClick: openPilotLog },
        { label: "RETURN TO SOUTH HALLWAY", meta: "MOVE", onClick: () => moveToRoom("south") }
      ];
      return [];
    }

    if (state.actTwoComplete) {
      return room === "control"
        ? [
            { label: "TAKE RESIDUE SAMPLE TO LABORATORY", meta: "NEW OBJECTIVE", special: true, onClick: beginInvestigationRoute },
            { label: "REVIEW CORRUPTED TRANSMISSION", meta: "CHECKPOINT 04", onClick: () => runFalseGroundSequence() },
            { label: "OPEN CAPTAIN'S LOG", meta: "PERSONAL NOTES", onClick: openPilotLog }
          ]
        : [];
    }

    if (state.blackoutStarted) {
      if (room === "control") {
        if (!state.lightsRestored) {
          return [{ label: "ENTER POWER JUNCTION", meta: "BLACKOUT MISSION", special: true, onClick: () => moveToRoom("power") }];
        }
        if (!state.surveillanceOpened) {
          return [{ label: "REVIEW SURVEILLANCE ARCHIVE", meta: "RECOVERED FOOTAGE", special: true, onClick: openSurveillance }];
        }
        if (!state.falseGroundContacted) {
          return [{ label: "CONTACT GROUND CONTROL", meta: "VERIFY CHANNEL", special: true, onClick: runFalseGroundSequence }];
        }
        return [{ label: "REVIEW CORRUPTED TRANSMISSION", meta: "CHECKPOINT 04", onClick: runFalseGroundSequence }];
      }

      if (room === "power") {
        if (!state.relayFound) {
          return [
            { label: "ENTER DARK CORRIDOR", meta: "SEARCH STORAGE", danger: true, onClick: () => moveToRoom("darkcorridor") },
            { label: "RETURN TO CONTROL", meta: "MOVE", onClick: () => moveToRoom("control") }
          ];
        }
        if (!state.alienRepelled) {
          return [{ label: "RETURN TO DARK CORRIDOR", meta: "BIOLOGICAL CONTACT", danger: true, onClick: () => moveToRoom("darkcorridor") }];
        }
        return [{ label: "RETURN TO CONTROL", meta: "COMMUNICATIONS", special: true, onClick: () => moveToRoom("control") }];
      }

      if (room === "darkcorridor") {
        if (!state.relayFound) {
          return [
            { label: "SEARCH STORAGE", meta: "POWER RELAY", special: true, onClick: () => moveToRoom("storage2") },
            { label: "RETURN TO POWER JUNCTION", meta: "MOVE", onClick: () => moveToRoom("power") }
          ];
        }
        if (!state.alienRepelled) {
          return [
            { label: "HIDE", meta: "FAILURE", danger: true, onClick: hideAndFailBlackout },
            { label: "FACE IT", meta: "PLASMA GUN", special: true, onClick: faceAlienBlackout }
          ];
        }
        return [{ label: "RETURN TO CONTROL", meta: "COMMUNICATIONS", special: true, onClick: () => moveToRoom("control") }];
      }

      if (room === "storage2") {
        if (!state.relayFound) {
          return [{ label: "SEARCH EQUIPMENT CRATES", meta: "POWER RELAY", special: true, onClick: findRelay }];
        }
        return [{ label: "RETURN TO DARK CORRIDOR", meta: "BIOLOGICAL SIGNAL", danger: true, onClick: () => moveToRoom("darkcorridor") }];
      }
      return [];
    }

    if (state.finalReported) {
      return room === "control"
        ? [
            { label: "REOPEN GROUND CONTROL REPORT", meta: "CHECKPOINT 03", onClick: () => openFinalGroundDialog() },
            { label: "HOLD EARTH APPROACH", meta: "WAIT", onClick: () => showToast("LANDING CORRIDOR REMAINS LOCKED // AWAITING CONTAINMENT DIRECTIVE") }
          ]
        : [];
    }

    if (state.branch === "signal") {
      if (room === "control") {
        if (state.engineRepaired) return [{ label: "REPORT TO GROUND CONTROL", meta: "FINAL REPORT", special: true, onClick: finaliseBranch }];
        return [
          { label: "ENTER MAINTENANCE TUNNELS", meta: "ENGINE 02", danger: true, onClick: () => moveToRoom("tunnels") },
          { label: "OPEN CAPTAIN'S LOG", meta: "ARCHIVE", onClick: openPilotLog }
        ];
      }
      if (room === "tunnels") {
        return state.engineRepaired
          ? [
              { label: "RETURN TO CONTROL", meta: "FLASHLIGHT", special: true, onClick: () => moveToRoom("control") },
              { label: "RETURN TO ENGINE ROOM", meta: "MOVE", onClick: () => moveToRoom("engine") }
            ]
          : [
              { label: "PROCEED TO MAIN ENGINE ROOM", meta: "CRITICAL", danger: true, onClick: () => moveToRoom("engine") },
              { label: "RETURN TO CONTROL", meta: "MOVE", onClick: () => moveToRoom("control") }
            ];
      }
      if (room === "engine") {
        return state.engineRepaired
          ? [{ label: "RETURN THROUGH THE TUNNELS", meta: "BLACKOUT", danger: true, onClick: () => moveToRoom("tunnels") }]
          : [{ label: "REPLACE ENGINE REGULATOR", meta: "MANUAL REPAIR", danger: true, onClick: repairEngine }];
      }
    }

    if (state.branch === "alone") {
      if (room === "tunnels") {
        return state.satNavFailed
          ? [
              { label: "RETURN TO CONTROL", meta: "DIAGNOSE", special: !state.satNavDiagnosed, onClick: () => moveToRoom("control") },
              { label: "RETURN TO ENGINE ROOM", meta: "MOVE", onClick: () => moveToRoom("engine") }
            ]
          : [{ label: "ENTER MAIN ENGINE ROOM", meta: "INVESTIGATE", special: true, onClick: () => moveToRoom("engine") }];
      }
      if (room === "engine") {
        if (!state.satNavFailed) return [{ label: "CHECK ENGINE DIAGNOSTICS", meta: "SYSTEM CHECK", special: true, onClick: triggerSatNavFailure }];
        return [{ label: "RETURN THROUGH MAINTENANCE TUNNELS", meta: "NAVIGATION LOST", danger: true, onClick: () => moveToRoom("tunnels") }];
      }
      if (room === "control") {
        if (state.satNavRepaired) return [{ label: "REPORT TO GROUND CONTROL", meta: "FINAL REPORT", special: true, onClick: finaliseBranch }];
        if (!state.satNavDiagnosed) return [{ label: "DIAGNOSE SAT-NAV FAILURE", meta: "REQUIRED", special: true, onClick: diagnoseSatNav }];
        return [
          { label: "PROCEED TO AIRLOCK", meta: "EVA ROUTE", special: true, onClick: () => moveToRoom("airlock") },
          { label: "RETURN TO MAINTENANCE TUNNELS", meta: "MOVE", onClick: () => moveToRoom("tunnels") }
        ];
      }
      if (room === "airlock") {
        if (!state.satNavModule) {
          return [
            { label: "SUIT UP & TAKE SAT-NAV MODULE", meta: "EVA EQUIPMENT", special: true, onClick: prepareEVA },
            { label: "RETURN TO CONTROL", meta: "MOVE", onClick: () => moveToRoom("control") }
          ];
        }
        return [
          { label: "CYCLE OUTER HATCH", meta: "VACUUM", danger: true, onClick: () => moveToRoom("outside") },
          { label: "RETURN TO CONTROL", meta: "MOVE", onClick: () => moveToRoom("control") }
        ];
      }
      if (room === "outside") {
        return state.satNavRepaired
          ? [
              { label: "RETURN TO AIRLOCK", meta: "TETHER", special: true, onClick: () => moveToRoom("airlock") },
              { label: "RECHECK SAT-NAV ARRAY", meta: "MOVE", onClick: () => moveToRoom("satnav") }
            ]
          : [
              { label: "CROSS TO SAT-NAV ARRAY", meta: "MAGNETIC BOOTS", danger: true, onClick: () => moveToRoom("satnav") },
              { label: "RETURN TO AIRLOCK", meta: "MOVE", onClick: () => moveToRoom("airlock") }
            ];
      }
      if (room === "satnav") {
        return state.satNavRepaired
          ? [{ label: "RETURN ACROSS THE HULL", meta: "NAV RESTORED", special: true, onClick: () => moveToRoom("outside") }]
          : [{ label: "REPLACE SAT-NAV COMPONENT", meta: "EXTERNAL REPAIR", danger: true, onClick: repairSatNav }];
      }
    }

    return [];
  }

  function renderRoomActions(room) {
    roomActions.replaceChildren();
    getRoomActions(room).forEach((action, index) => roomActions.append(createAction(action, index)));
  }

  async function showRoom(room, { immediate = false } = {}) {
    if (room === "tactical" && state.cloneIncapacitated && !state.tacticalGearCollected) startRebreatherCountdown();
    else stopRebreatherCountdown({ preserve: true });
    const definition = getRoomDefinition(room);
    roomCode.textContent = definition.code;
    roomTitle.textContent = definition.title;
    roomStatus.textContent = definition.status;
    roomStatus.className = `room-status ${definition.statusClass || ""}`.trim();
    renderRoomActions(room);
    swapRoomMedia(definition, immediate);
    fadeRoomText(definition.text, immediate);
    warmAdjacentRoomImages(room);
    startBackgroundImageWarmup();
  }

  async function moveToRoom(targetRoom, { force = false } = {}) {
    if (targetRoom === state.currentRoom) {
      positionToken();
      showRoom(targetRoom);
      return true;
    }

    const accessReason = getAccessReason(targetRoom);
    if (accessReason && !force) {
      rejectRoomTarget(targetRoom, accessReason);
      return false;
    }

    const routes = getActiveRoutes();
    if (!force && !routes[state.currentRoom]?.includes(targetRoom)) {
      rejectRoomTarget(targetRoom, "ROUTE UNAVAILABLE // MOVE THROUGH AN ADJACENT ROOM");
      return false;
    }

    const previousRoom = state.currentRoom;
    const previousMapMode = state.mapMode;
    state.currentRoom = targetRoom;

    if (state.branch === "alone" && previousRoom === "airlock" && targetRoom === "outside") {
      state.mapMode = state.satNavRepaired ? "satnav_exterior_return" : "satnav_exterior";
    }
    if (state.branch === "alone" && previousRoom === "outside" && targetRoom === "airlock") {
      state.mapMode = state.satNavRepaired ? "satnav_interior_return" : "satnav_interior";
    }

    if (targetRoom === "kitchen" && !state.kitchenEntered) {
      state.kitchenEntered = true;
      state.stress = Math.max(state.stress, 18);
    }
    if (targetRoom === "outside") state.stress = Math.max(state.stress, 81);
    saveState();

    const mapChanged = previousMapMode !== state.mapMode;
    if (mapChanged) {
      await runCinematicTransition({
        kicker: "SHIP INTERFACE // ROUTE CHANGE",
        title: state.currentRoom === "outside" || state.currentRoom === "satnav"
          ? "EXTERIOR SCHEMATIC LOADING"
          : "INTERIOR SCHEMATIC RESTORING",
        text: "Reconstructing Luna's accessible route",
        duration: 720,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom(targetRoom, { immediate: true });
        }
      });
    } else {
      updateInterface();
      await showRoom(targetRoom);
    }

    if (targetRoom === "life" && !state.fireExtinguished) showToast("WARNING // FIRE SUPPRESSION OFFLINE");
    if (targetRoom === "kitchen" && !state.alienEncountered) window.setTimeout(() => showToast("AUDIO EVENT // DOOR LOCK ENGAGED"), 650);
    if (targetRoom === "engineering" && !state.engineeringUnlocked) showToast("ACCESS DENIED // MANUAL ENGINEERING KEY REQUIRED");
    if ((state.mapMode === "signal_return" || state.mapMode === "satnav_interior_return") && targetRoom === "control" && !state.finalReported) {
      window.setTimeout(finaliseBranch, reducedMotion ? 20 : 700);
    }
    return true;
  }

  function rejectRoomTarget(room, reason) {
    const node = shipMap.querySelector(`[data-room="${room}"]`);
    node?.classList.add("invalid-target");
    window.setTimeout(() => node?.classList.remove("invalid-target"), 420);
    showToast(reason);
    positionToken();
  }

  function openPilotLog() {
    state.logOpened = true;
    saveState();
    renderRoomActions(state.currentRoom);
    syncCaptainLogUI();
    logFooterStatus.textContent = state.organismAnalysed
      ? "ARCHIVE READ // ORGANISM ANALYSIS RECORDED // PERSONAL LOG AUTO-SAVED"
      : state.damageLogged
        ? "ARCHIVE READ // ACCESS EVENT MATCHES SABOTAGE WINDOW // PERSONAL LOG READY"
        : "ARCHIVE READ // ACCESS EVENT FLAGGED // PERSONAL LOG READY";
    setLogSaveStatus("AUTO-SAVE READY");
    openDialog(pilotLogDialog);
  }

  async function acknowledgeGroundControl() {
    state.groundContacted = true;
    state.stress = Math.max(state.stress, 14);
    saveState();
    closeDialog(groundControlDialog);
    await runCinematicTransition({
      kicker: "MISSION DIRECTIVE // GROUND CONTROL",
      title: "SOUTHERN DECK UNLOCKED",
      text: "Expanding the ship schematic to Laboratory, Stores, Mess and Engineering",
      duration: 850,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("control", { immediate: true });
      }
    });
    showToast("NEW AREA UNLOCKED // SOUTHERN FACILITIES AVAILABLE");
  }

  async function extinguishFire() {
    state.fireExtinguished = true;
    state.stress = Math.max(state.stress, 12);
    saveState();
    updateInterface();
    showToast("FIRE CONTAINED // OXYGEN CONTROL PANEL EXPOSED");
    await showRoom("life");
  }

  async function logDamage() {
    state.damageLogged = true;
    state.checkpoint = Math.max(state.checkpoint, 1);
    saveState();
    await runCinematicTransition({
      kicker: "MISSION CHECKPOINT // DECK 07",
      title: "CHECKPOINT 01",
      text: "Sabotage confirmed // Mission state preserved",
      duration: 900,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("life", { immediate: true });
      }
    });
    showToast("CHECKPOINT 01 SAVED // SOUTHERN DECK MAPPED // REPORT TO CONTROL");
  }

  async function inspectResidue() {
    state.residueFound = true;
    state.stress = Math.max(state.stress, 22);
    saveState();
    updateInterface();
    await showRoom("lab");
    showToast("UNKNOWN ORGANIC MATERIAL DETECTED");
  }

  async function collectSample() {
    state.sampleCollected = true;
    state.stress = Math.max(state.stress, 26);
    saveState();
    updateInterface();
    await showRoom("lab");
    showToast("ITEM ACQUIRED // SEALED SPECIMEN JAR");
  }

  async function inspectKitchenCounter() {
    if (state.counterInspected || state.alienEncountered) return;
    state.counterInspected = true;
    state.stress = Math.max(state.stress, 32);
    saveState();
    updateInterface();

    runSequence(
      [
        {
          image: "assets/IMG11.png",
          alt: "A clean spacecraft kitchen counter marked by a fresh splash of black residue.",
          code: "MESS HALL // WORKTOP 02",
          title: "THE COUNTER",
          text: "The worktop is almost spotless. In the centre lies another splash of black residue, still wet, its edges slowly drawing themselves into thin branching lines.\n\nBehind Luna, the room's ventilation system stops.",
          button: "CONTINUE"
        },
        {
          image: "assets/IMG12.png",
          alt: "A black alien organism hangs from the ceiling of the ship's mess hall.",
          code: "BIOLOGICAL SIGNATURE // UNKNOWN",
          title: "IT IS ABOVE HER",
          text: "A drop lands beside Luna's hand.\n\nShe looks up.\n\nA vast black shape has unfolded from the ceiling, suspended on strands of its own body. Its mouth opens without breathing. For one impossible second, it studies her face.",
          button: "RUN",
          blackoutBefore: true
        }
      ],
      async () => {
        state.alienEncountered = true;
        state.stress = Math.max(state.stress, 48);
        state.currentRoom = "engineering";
        saveState();
        updateInterface();
        await showRoom("engineering");
        showToast("UNKNOWN LIFE FORM DETECTED // ENGINEERING ACCESS DENIED");
      }
    );
  }

  async function takeEquipment() {
    state.equipmentTaken = true;
    state.plasmaGun = true;
    state.flashlight = true;
    state.engineeringKey = true;
    state.stress = Math.max(state.stress, 51);
    saveState();
    updateInterface();
    await showRoom("store");
    showToast("3 ITEMS ACQUIRED // PLASMA GUN // FLASHLIGHT // ENGINEERING KEY");
  }

  async function unlockEngineering() {
    state.engineeringUnlocked = true;
    state.stress = Math.max(state.stress, 56);
    saveState();
    updateInterface();
    await showRoom("engineering");
    showToast("ENGINEERING UNLOCKED // MOVEMENT APPROACHING");
  }

  async function chooseHide(choice) {
    state.hideChoice = choice;
    state.hidingInProgress = true;
    state.stress = Math.max(state.stress, choice === "engine" ? 67 : choice === "workbench" ? 63 : 61);
    saveState();
    updateInterface();
    await showRoom("engineering");
    showToast("DO NOT MOVE // DO NOT ANSWER THE VOICE");
  }

  async function completeHiding() {
    state.hidingInProgress = false;
    state.hidingCompleted = true;
    state.checkpoint = 2;
    state.stress = Math.max(state.stress, 69);
    saveState();
    updateInterface();
    await showRoom("engineering");

    runSequence(
      [
        {
          image: "assets/IMG15.png",
          alt: "The unlocked Engineering Room after the alien organism withdraws.",
          code: "ENGINEERING // INTERNAL AUDIO",
          title: "THE VOICE WITHDRAWS",
          text: "Luna remains silent.\n\nThe copied voice asks once more, softer this time. Then the organism drags itself away through the machinery. The ship hum gradually returns.\n\nA diagnostic display wakes beside her: CREW DETECTED — 02.",
          button: "SAVE CHECKPOINT"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "MISSION CHECKPOINT // ENGINEERING",
          title: "CHECKPOINT 02",
          text: "Two biological signatures detected // Mission state preserved",
          duration: 950,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("engineering", { immediate: true });
          }
        });
        showToast("CHECKPOINT 02 SAVED // TWO BIOLOGICAL SIGNATURES DETECTED");
        openDialog(chapterDialog);
      }
    );
  }

  function startSignalBranch() {
    closeDialog(branchDialog);
    closeDialog(chapterDialog);
    state.branch = "signal";
    state.mapMode = "signal_engine";
    state.currentRoom = "control";
    state.stress = Math.max(state.stress, 73);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG04.png",
          alt: "Luna sends an emergency crisis signal from the Control Room.",
          code: "DEEP SPACE RELAY // PRIORITY CRISIS",
          title: "THE SIGNAL LEAVES THE SHIP",
          text: "Luna returns to Control and opens the priority relay. She reports the sabotage, the residue and the organism wearing her voice.\n\nGround Control receives the signal. Then every engine warning on the console turns red.",
          button: "CONTINUE"
        },
        {
          image: "assets/IMG17.png",
          alt: "The compact engine room of Luna's ship as Engine 02 begins to fail.",
          code: "ENGINE 02 // THRUST COLLAPSE",
          title: "A SECOND CRISIS",
          text: "Engine 02 falls out of synchronisation. Ground Control tells Luna the regulator must be replaced manually. The ship schematic contracts to a single route: Control, Maintenance Tunnels, Main Engine Room.",
          button: "OPEN MISSION MAP"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "MISSION ROUTE // CRITICAL FAILURE",
          title: "ENGINE 02 ROUTE ISOLATED",
          text: "Contracting the schematic to Control, Maintenance Tunnels and Main Engine Room",
          duration: 900,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("control", { immediate: true });
          }
        });
        showToast("MISSION ROUTE UPDATED // ENGINE 02 FAILURE");
      }
    );
  }

  function startAloneBranch() {
    closeDialog(branchDialog);
    closeDialog(chapterDialog);
    state.branch = "alone";
    state.mapMode = "alone_engine";
    state.currentRoom = "tunnels";
    state.stress = Math.max(state.stress, 75);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG15.png",
          alt: "Luna moves alone into the engineering maintenance route.",
          code: "ENGINEERING ACCESS // TRANSMITTER SILENT",
          title: "NO SIGNAL",
          text: "Luna leaves the crisis transmitter untouched. If the organism is moving through the ship, she cannot afford to announce where she is.\n\nShe opens the maintenance access and enters the tunnels alone.",
          button: "ENTER MAINTENANCE ROUTE"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "MISSION ROUTE // TRANSMITTER SILENT",
          title: "MAINTENANCE ROUTE ISOLATED",
          text: "Reconstructing the immediate route through Engineering",
          duration: 850,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("tunnels", { immediate: true });
          }
        });
        showToast("MISSION ROUTE UPDATED // ENGINEERING ACCESS ONLY");
      }
    );
  }

  async function repairEngine() {
    state.engineRepaired = true;
    state.lightsOut = true;
    state.mapMode = "signal_return";
    state.stress = Math.max(state.stress, 82);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG17.png",
          alt: "The repaired compact engine assembly begins operating again.",
          code: "ENGINE 02 // MANUAL REGULATOR REPLACEMENT",
          title: "THRUST RESTORED",
          text: "The new regulator seats. Engine 02 catches with a violent metallic shudder, then steadies. Thrust returns across the vessel.",
          button: "CONTINUE"
        },
        {
          image: "assets/IMG21.png",
          alt: "The engine room goes completely dark as Luna raises her flashlight.",
          code: "SHIPWIDE SYSTEM // LIGHTING FAILURE",
          title: "THE LIGHTS GO OUT",
          text: "Every overhead light extinguishes at once. Luna's flashlight snaps on, carving a thin white tunnel through the dark.\n\nSomething moves outside the Engine Room.",
          button: "RETURN TO CONTROL",
          blackoutBefore: true
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "SHIPWIDE SYSTEM // LIGHTING FAILURE",
          title: "RETURN ROUTE RECALCULATED",
          text: "Emergency navigation active // Flashlight required",
          duration: 800,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("engine", { immediate: true });
          }
        });
        showToast("SHIPWIDE BLACKOUT // FLASHLIGHT ACTIVE");
      }
    );
  }

  async function triggerSatNavFailure() {
    state.satNavFailed = true;
    state.mapMode = "satnav_interior";
    state.stress = Math.max(state.stress, 80);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG17.png",
          alt: "The compact engine room as a navigation failure appears on the diagnostics.",
          code: "ENGINE DIAGNOSTICS // PRIMARY THRUST STABLE",
          title: "THE ENGINES ARE NOT THE PROBLEM",
          text: "The engines are stable. Before Luna can leave the console, the ship loses its position fix. Satellite navigation has failed and the Earth-return vector begins to drift.",
          button: "CONTINUE"
        },
        {
          image: "assets/IMG04.png",
          alt: "The Control Room map warns that satellite navigation is offline.",
          code: "NAVIGATION SYSTEM // POSITION DATA LOST",
          title: "THE SHIP IS FLYING BLIND",
          text: "The schematic expands into a dangerous repair route: Engine Room, Maintenance Tunnels, Control, Airlock, Outer Hull, Satellite Array.\n\nLuna must return to Control before attempting the spacewalk.",
          button: "OPEN MISSION MAP"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "NAVIGATION SYSTEM // POSITION DATA LOST",
          title: "EVA ROUTE CONSTRUCTED",
          text: "Mapping Control, Airlock, Outer Hull and Satellite Navigation Array",
          duration: 900,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("engine", { immediate: true });
          }
        });
        showToast("SATELLITE NAVIGATION OFFLINE // RETURN TO CONTROL");
      }
    );
  }

  async function diagnoseSatNav() {
    state.satNavDiagnosed = true;
    state.stress = Math.max(state.stress, 83);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG04.png",
          alt: "The Control Room displays the exterior satellite navigation repair route.",
          code: "SAT-NAV DIAGNOSTICS // EXTERNAL MODULE FAILURE",
          title: "THE REPAIR IS OUTSIDE",
          text: "Control isolates the fault to an external navigation module. A replacement is stored inside Airlock 02.\n\nLuna will have to suit up, cross the outer hull and install it by hand.",
          button: "LOAD EVA ROUTE"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "SAT-NAV DIAGNOSTICS // EXTERNAL FAILURE",
          title: "AIRLOCK 02 UNLOCKED",
          text: "Preparing the exterior repair schematic",
          duration: 700,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("control", { immediate: true });
          }
        });
        showToast("EVA ROUTE UNLOCKED // AIRLOCK 02");
      }
    );
  }

  async function prepareEVA() {
    state.satNavModule = true;
    state.stress = Math.max(state.stress, 86);
    saveState();
    updateInterface();
    await showRoom("airlock");
    showToast("ITEM ACQUIRED // SAT-NAV MODULE // EVA SUIT SEALED");
  }

  async function repairSatNav() {
    state.satNavRepaired = true;
    state.satNavModule = false;
    state.mapMode = "satnav_exterior_return";
    state.stress = Math.max(state.stress, 91);
    saveState();

    runSequence(
      [
        {
          image: "assets/IMG20.png",
          alt: "Luna's gloved hand replaces the satellite navigation component from her perspective.",
          code: "SAT-NAV ARRAY // MANUAL COMPONENT REPLACEMENT",
          title: "POSITION FIX RESTORED",
          text: "Luna drives the replacement module into the exposed assembly and locks it in place. The array wakes beneath her hand. Earth-return coordinates stream back into the ship.\n\nThe navigation failure is resolved. Now she has to get back inside.",
          button: "RETURN TO AIRLOCK"
        }
      ],
      async () => {
        await runCinematicTransition({
          kicker: "NAVIGATION SYSTEM // POSITION FIX RESTORED",
          title: "RETURN ROUTE LOADING",
          text: "Reconstructing the path to Airlock 02 and Control",
          duration: 760,
          task: async () => {
            armMapReveal();
            updateInterface();
            await showRoom("satnav", { immediate: true });
          }
        });
        showToast("SAT-NAV RESTORED // RETURN TO CONTROL");
      }
    );
  }


  async function beginBlackoutAct() {
    closeDialog(finalGroundDialog);
    cancelActiveSequence();
    state.blackoutStarted = true;
    state.lightsOut = true;
    state.mapMode = "blackout";
    state.currentRoom = "control";
    state.checkpoint = 3;
    state.stress = Math.max(state.stress, 94);
    saveState();

    await runCinematicTransition({
      kicker: "MISSION CHECKPOINT // CONTROL ROOM",
      title: "CHECKPOINT 03",
      text: "Shipwide lighting failure // Reconstructing emergency search grid",
      duration: 1150,
      task: async () => {
        const controlImageReady = await preloadImage("assets/IMG22.png");
        if (!controlImageReady) await preloadImage("assets/IMG21.png");
        preloadImages([
          "assets/IMG21.png",
          "assets/IMG23.png",
          "assets/IMG25.png",
          "assets/IMG26.png",
          "assets/IMG27.png",
          "assets/IMG30.png",
          "assets/IMG31.png",
          "assets/IMG32.png",
          "assets/IMG34.png",
          "assets/IMG35.png",
          "assets/IMG36.png"
        ], 2);
        armMapReveal();
        updateInterface();
        await showRoom("control", { immediate: true });
      }
    });
    showToast("CHECKPOINT 03 SAVED // SHIPWIDE LIGHTING FAILURE");
  }

  async function triggerBlackoutThreat() {
    state.blackoutThreatStep = Math.min(3, state.blackoutThreatStep + 1);
    state.alienRepelled = false;
    state.stress = Math.min(99, state.stress + 2);
    saveState();
    updateInterface();
  }

  async function findRelay() {
    state.relayFound = true;
    state.blackoutThreatStep = 1;
    state.alienRepelled = false;
    state.stress = Math.min(99, state.stress + 3);
    saveState();

    runSequence([{
      image: "assets/IMG27.png",
      fallbackImage: "assets/IMG26.png",
      alt: "A recovered power relay component.",
      code: "ITEM ACQUIRED // PWR-REL-01",
      title: "POWER RELAY RECOVERED",
      text: "Luna finds the relay secured beneath a storage crate. It has not failed. Someone removed it from the lighting grid and hid it here.\n\nA heavy impact sounds once in the corridor outside.",
      button: "RETURN TO CORRIDOR",
      presentation: "item"
    }], async () => {
      state.currentRoom = "darkcorridor";
      saveState();
      updateInterface();
      await showRoom("darkcorridor");
      showToast("POWER RELAY RECOVERED // BIOLOGICAL SIGNAL CLOSE");
    });
  }

  function hideAndFailBlackout() {
    runSequence([
      {
        image: "assets/IMG31.png",
        fallbackImage: "assets/IMG30.png",
        alt: "Luna hides in darkness while the alien searches the maintenance recess.",
        code: "BIOLOGICAL SIGNAL // ZERO METRES",
        title: "IT HEARD HER",
        text: "Luna kills the flashlight and folds into the maintenance recess. The corridor becomes completely black.\n\nThe organism stops outside. A hand, almost shaped like hers, closes around the edge of the hiding place.",
        button: "DO NOT BREATHE",
        presentation: "failure"
      },
      {
        image: "assets/IMG32.png",
        fallbackImage: "assets/IMG31.png",
        alt: "The alien overwhelms Luna at point-blank range.",
        code: "BIOLOGICAL STATUS // SIGNAL LOST",
        title: "TOTAL FAILURE",
        text: "It finds her.\n\nThe last image recorded by Luna's suit is a black face opening directly in front of her.",
        button: "CONTINUE",
        presentation: "failure"
      }
    ], showLoseScreen);
  }

  function faceAlienBlackout() {
    runSequence([
      {
        image: "assets/IMG34.png",
        fallbackImage: "assets/IMG30.png",
        alt: "Luna fires the plasma gun and drives the alien back.",
        code: "BIOLOGICAL CONTACT // PLASMA DISCHARGE",
        title: "FACE IT",
        text: "Luna plants her boots, raises the plasma gun and fires. The blast tears through the organism's outer shape and throws it backward into the conduits. Its scream travels through every speaker on the deck.",
        button: "REACH THE POWER JUNCTION",
        presentation: "combat"
      },
      {
        image: "assets/IMG33.png",
        fallbackImage: "assets/IMG23.png",
        alt: "Luna installs the recovered relay at the Power Junction.",
        code: "POWER JUNCTION // RELAY INSTALLATION",
        title: "RESTORE THE GRID",
        text: "With the corridor clear, Luna locks the recovered relay into the empty housing and routes power through the emergency bus.",
        button: "RESTART LIGHTING GRID",
        presentation: "repair"
      },
      {
        image: "assets/IMG35.png",
        fallbackImage: "assets/IMG21.png",
        alt: "The corridor lighting returns beside the restored Power Junction.",
        code: "LIGHTING GRID // ONLINE",
        title: "THE LIGHTS RETURN",
        text: "Fixtures ignite in sequence across the ship. White light floods the corridor. The damaged organism retreats deeper into the walls.\n\nLuna returns to the communications station in Control.",
        button: "RETURN TO COMMUNICATIONS",
        presentation: "restored"
      }
    ], async () => {
      state.alienRepelled = true;
      state.lightsRestored = true;
      state.lightsOut = false;
      state.currentRoom = "control";
      state.stress = Math.min(99, state.stress + 4);
      saveState();
      await runCinematicTransition({
        kicker: "LIGHTING GRID // ONLINE",
        title: "CONTROL ROOM RESTORED",
        text: "Returning Luna to the communications station",
        duration: 720,
        task: async () => {
          updateInterface();
          await showRoom("control", { immediate: true });
        }
      });
      showToast("LIGHTING RESTORED // COMMUNICATIONS ONLINE");
    });
  }

  async function restartBlackoutCheckpoint({ stateAlreadyReset = false } = {}) {
    cancelActiveSequence();
    if (!stateAlreadyReset) resetBlackoutCheckpointState();
    await runCinematicTransition({
      kicker: "MISSION CHECKPOINT // RESTORE",
      title: "CHECKPOINT 03",
      text: "Restoring the lighting-failure mission state",
      duration: 1050,
      task: async () => {
        hidePrimaryScreens();
        gameScreen.hidden = false;
        armMapReveal();
        updateInterface();
        await showRoom("control", { immediate: true });
        requestAnimationFrame(() => {
          positionToken();
          gameScreen.classList.add("is-visible");
        });
      }
    });
    showToast("CHECKPOINT 03 RESTORED // LIGHTS OUT");
  }

  function failBlackout() {
    hideAndFailBlackout();
  }

  // Kept as a compatibility hook for any old saved action callback. The active
  // Checkpoint 03 route now restores the grid inside FACE IT.
  function restoreLights() {
    faceAlienBlackout();
  }

  async function openSurveillance() {
    runSequence([
      {
        image: "assets/IMG36.png",
        alt: "The active Control Room surveillance terminal.",
        code: "SURVEILLANCE ARCHIVE // INDEX RECOVERED",
        title: "TWENTY-FOUR CAMERAS ONLINE",
        text: "The restored terminal rebuilds the missing archive. Several recordings were classified as ordinary crew movement, even though Luna is the only registered crew member aboard.",
        button: "REVIEW FLAGGED FOOTAGE",
        presentation: "surveillance"
      },
      {
        image: "assets/IMG37.png",
        alt: "Security footage shows a partly human, partly black figure moving through a corridor.",
        code: "CAMERA B-12 // 01:42:17",
        title: "UNREGISTERED MOVEMENT",
        text: "A dark figure crosses Corridor B-12. One side carries Luna's posture and gait. The other drags behind it as liquid shadow.",
        button: "VIEW EARLIER RECORDING",
        presentation: "surveillance"
      },
      {
        image: "assets/IMG38.png",
        alt: "Surveillance footage shows a copy of Luna walking while the real Luna slept.",
        code: "CAMERA 07A // CRYOSLEEP PERIOD",
        title: "CREW IDENTITIES DETECTED: 2",
        text: "The earlier recording is unmistakable. A figure wearing Luna's body walks through Engineering while her cryosleep biometrics remain active in the same timestamp.\n\nThe organism is passing the ship's identity checks.",
        button: "RETURN TO COMMUNICATIONS",
        presentation: "surveillance"
      }
    ], async () => {
      state.surveillanceOpened = true;
      state.shadowFootageViewed = true;
      state.mimicFootageViewed = true;
      saveState();
      updateInterface();
      await showRoom("control");
      showToast("SURVEILLANCE REVIEW COMPLETE // SECOND IDENTITY CONFIRMED");
    });
  }

  async function viewShadowFootage() {
    openSurveillance();
  }

  async function viewMimicFootage() {
    openSurveillance();
  }

  function runFalseGroundSequence() {
    runSequence([
      {
        image: "assets/IMG39.png",
        alt: "The communications terminal receives a transmission bearing the Elite Forces Ground Control emblem.",
        code: "INCOMING TRANSMISSION // AUTHENTICATION PENDING",
        title: "GROUND CONTROL?",
        text: "The channel opens without the expected transmission delay.\n\n'Agent Luna H. Resume Earth approach immediately. Do not alter the landing corridor. Bring the vessel home.'",
        button: "CHALLENGE AUTHENTICATION",
        presentation: "communication"
      },
      {
        image: "assets/IMG40.png",
        alt: "The Ground Control transmission corrupts into alien signal noise.",
        code: "SIGNAL SOURCE // INTERNAL NETWORK",
        title: "WELCOME HOME, LUNA",
        text: "The voice repeats fragments of old messages, then fractures into wet groans, clicks and impossible harmonics.\n\n'THE SHIP MUST ARRIVE. WE MUST ARRIVE. BRING THE SHIP TO EARTH.'\n\nGround Control is gone. The organism is speaking through the ship.",
        button: "END TRANSMISSION",
        presentation: "corruption"
      }
    ], async () => {
      state.falseGroundContacted = true;
      state.actTwoComplete = true;
      state.checkpoint = 4;
      state.mapMode = "act2_control";
      state.currentRoom = "control";
      state.stress = 99;
      saveState();
      await runCinematicTransition({
        kicker: "MISSION CHECKPOINT // SIGNAL CORRUPTION",
        title: "CHECKPOINT 04",
        text: "Internal communications compromised // Mission state preserved",
        duration: 1050,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom("control", { immediate: true });
        }
      });
      showToast("CHECKPOINT 04 SAVED // COMMUNICATIONS COMPROMISED");
    });
  }

  function formatMissionClock(totalMinutes) {
    const safe = Math.max(0, Math.floor(Number(totalMinutes) || 0));
    const hours = Math.floor(safe / 60);
    const minutes = safe % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function formatRebreatherTime(totalSeconds) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function advanceMissionTime(minutes) {
    const elapsed = Math.max(0, Number(minutes) || 0);
    state.oxygenMinutesRemaining = Math.max(0, state.oxygenMinutesRemaining - elapsed);
    state.earthMinutesRemaining = Math.max(0, state.earthMinutesRemaining - elapsed);
  }

  function stopRebreatherCountdown({ preserve = false } = {}) {
    window.clearInterval(rebreatherInterval);
    rebreatherInterval = 0;
    if (!preserve && !state.tacticalGearCollected) state.rebreatherSeconds = 90;
  }

  function updateRebreatherReadout() {
    if (state.currentRoom !== "tactical" || state.tacticalGearCollected) return;
    const label = threatReadout.querySelector("span");
    const value = threatReadout.querySelector("strong");
    threatReadout.className = "danger-readout is-warning";
    label.textContent = "AIR";
    value.textContent = formatRebreatherTime(state.rebreatherSeconds);
    roomNarrative.textContent = getRoomDefinition("tactical").text;
  }

  function startRebreatherCountdown() {
    if (state.tacticalGearCollected || rebreatherInterval) return;
    if (!state.emergencyRebreather) state.emergencyRebreather = true;
    if (!state.rebreatherSeconds) state.rebreatherSeconds = 90;
    updateRebreatherReadout();
    rebreatherInterval = window.setInterval(async () => {
      if (state.currentRoom !== "tactical" || state.tacticalGearCollected) {
        stopRebreatherCountdown({ preserve: true });
        return;
      }
      state.rebreatherSeconds = Math.max(0, state.rebreatherSeconds - 1);
      updateRebreatherReadout();
      if (state.rebreatherSeconds > 0) return;
      stopRebreatherCountdown();
      state.currentRoom = "security";
      state.stress = 99;
      saveState();
      await runCinematicTransition({
        duration: 1050,
        fadeInDuration: 480,
        fadeOutDuration: 720,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom("security", { immediate: true });
        }
      });
      showToast("REBREATHER EMPTY // LUNA RETREATED TO SECURITY CONTROL");
    }, 1000);
  }

  const orbitalPuzzleConfigs = {
    south: {
      kicker: "SOUTH HALL // LOCAL DOOR PROCESSOR",
      title: "ORBITAL CIPHER 01",
      subtitle: "Construct a stable access key and release the South Hall blast door.",
      briefing: "Set the destination mass above the source. Wait for the data-orb to align with a gate, then trigger the illuminated transfer.",
      budget: 8,
      stability: 4,
      successTitle: "SOUTH HALL ACCESS RESTORED",
      successText: "The gravitational key is stable. The blast door and Security Control approach have opened.",
      cores: [
        { id: "A", label: "ENTRY CORE", x: 180, y: 325, mass: 2 },
        { id: "B", label: "RELAY CORE", x: 500, y: 185, mass: 1 },
        { id: "C", label: "SOUTH LOCK", x: 820, y: 325, mass: 2 }
      ],
      links: [["A", "B"], ["B", "C"]],
      orbs: [{ id: "KEY", label: "ACCESS", color: "#91dcff", core: "A", target: "C", angle: .65, direction: 1 }]
    },
    security: {
      kicker: "SECURITY CONTROL // LOCKDOWN AUTHORITY",
      title: "ORBITAL CIPHER 02",
      subtitle: "Rebuild the command lattice and release tactical operations.",
      briefing: "Two keys share the relay core. Route the cyan key first, then clear the relay for the amber authority key. Occupied gravity fields reject transfers.",
      budget: 12,
      stability: 4,
      successTitle: "SECURITY OPERATIONS ONLINE",
      successText: "Lockdown authority has been reclaimed. Tactical lockers and environmental systems are now available.",
      cores: [
        { id: "A", label: "AUTH ROOT", x: 180, y: 185, mass: 2 },
        { id: "B", label: "RELAY CORE", x: 500, y: 305, mass: 1 },
        { id: "C", label: "LOCKDOWN", x: 180, y: 455, mass: 2 },
        { id: "D", label: "TACTICAL", x: 820, y: 305, mass: 2 }
      ],
      links: [["A", "B"], ["C", "B"], ["B", "D"]],
      orbs: [
        { id: "OPS", label: "OPS", color: "#91dcff", core: "A", target: "D", angle: .2, direction: 1 },
        { id: "AUTH", label: "AUTH", color: "#ffbf69", core: "C", target: "A", angle: 2.6, direction: -1 }
      ]
    },
    atmosphere: {
      kicker: "ENVIRONMENTAL CONTROL // TACTICAL SUPPLY",
      title: "ORBITAL CIPHER 03",
      subtitle: "Purge oxygen, inject inert gas and preserve compartment pressure.",
      briefing: "The manifold accepts only one resource at a time. Route O₂ to bypass, inert gas to the tactical inlet, then lock pressure into the regulator.",
      budget: 16,
      stability: 3,
      successTitle: "ATMOSPHERIC CONTAINMENT COMPLETE",
      successText: "Tactical Supply is holding at 3.2% oxygen under stable pressure. The biological signature is failing.",
      cores: [
        { id: "A", label: "TACTICAL INLET", x: 170, y: 175, mass: 2 },
        { id: "B", label: "INERT RESERVE", x: 170, y: 465, mass: 2 },
        { id: "C", label: "PRESSURE LOOP", x: 500, y: 520, mass: 3 },
        { id: "D", label: "MANIFOLD", x: 505, y: 275, mass: 1 },
        { id: "E", label: "O₂ BYPASS", x: 830, y: 275, mass: 2 }
      ],
      links: [["A", "D"], ["B", "D"], ["C", "D"], ["D", "E"]],
      orbs: [
        { id: "O2", label: "O₂", color: "#91dcff", core: "A", target: "E", angle: .45, direction: 1 },
        { id: "N2", label: "N₂", color: "#d69cff", core: "B", target: "A", angle: 2.1, direction: -1 },
        { id: "P", label: "PRESS", color: "#86efac", core: "C", target: "D", angle: 4.2, direction: 1 }
      ]
    }
  };

  function cloneOrbitalConfig(config) {
    return {
      ...config,
      cores: config.cores.map((core) => ({ ...core })),
      links: config.links.map((link) => [...link]),
      orbs: config.orbs.map((orb) => ({ ...orb })),
      budgetRemaining: config.budget,
      stabilityRemaining: config.stability,
      slow: false,
      solved: false,
      activeCandidates: new Map(),
      onSuccess: null
    };
  }

  function orbitalCoreById(id) {
    return orbitalRuntime?.cores.find((core) => core.id === id);
  }

  function orbitalOrbAtCore(coreId) {
    return orbitalRuntime?.orbs.find((orb) => orb.core === coreId);
  }

  function normaliseAngle(angle) {
    const tau = Math.PI * 2;
    return ((angle % tau) + tau) % tau;
  }

  function angularDistance(a, b) {
    const tau = Math.PI * 2;
    const diff = Math.abs(normaliseAngle(a) - normaliseAngle(b));
    return Math.min(diff, tau - diff);
  }

  function setOrbitalStatus(message, mode = "") {
    orbitalStatus.textContent = message;
    orbitalStatusPanel.classList.remove("is-error", "is-ready", "is-success");
    if (mode) orbitalStatusPanel.classList.add(`is-${mode}`);
  }

  function renderOrbitalObjectives() {
    orbitalObjectiveList.replaceChildren();
    if (!orbitalRuntime) return;
    for (const orb of orbitalRuntime.orbs) {
      const chip = document.createElement("span");
      chip.className = "orbital-objective-chip";
      if (orb.core === orb.target) chip.classList.add("is-complete");
      chip.style.setProperty("--orb-color", orb.color);
      const dot = document.createElement("i");
      const target = orbitalCoreById(orb.target);
      chip.append(dot, document.createTextNode(`${orb.label} → ${target?.label || orb.target}`));
      orbitalObjectiveList.append(chip);
    }
  }

  function createSvgElement(name, attributes = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
    return el;
  }

  function renderOrbitalPuzzle() {
    if (!orbitalRuntime) return;
    orbitalLinkLayer.replaceChildren();
    orbitalCoreLayer.replaceChildren();
    orbitalOrbLayer.replaceChildren();
    orbitalGateLayer.replaceChildren();
    orbitalCoreControls.replaceChildren();

    for (const [index, [fromId, toId]] of orbitalRuntime.links.entries()) {
      const from = orbitalCoreById(fromId);
      const to = orbitalCoreById(toId);
      const line = createSvgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "orbital-link" });
      line.dataset.link = `${fromId}-${toId}`;
      orbitalLinkLayer.append(line);

      const gate = document.createElement("button");
      gate.type = "button";
      gate.className = "orbital-gate-button";
      gate.style.left = `${((from.x + to.x) / 2) / 10}%`;
      gate.style.top = `${((from.y + to.y) / 2) / 6.2}%`;
      gate.textContent = "SYNC";
      gate.dataset.link = `${fromId}-${toId}`;
      gate.setAttribute("aria-label", `Transfer gate between ${from.label} and ${to.label}`);
      gate.addEventListener("click", () => triggerOrbitalGate(index));
      orbitalGateLayer.append(gate);
    }

    for (const core of orbitalRuntime.cores) {
      const group = createSvgElement("g", { class: "orbital-core-group" });
      group.dataset.core = core.id;
      group.append(
        createSvgElement("circle", { cx: core.x, cy: core.y, r: 78, class: "orbital-core-halo" }),
        createSvgElement("circle", { cx: core.x, cy: core.y, r: 62, class: "orbital-core-orbit" }),
        createSvgElement("circle", { cx: core.x, cy: core.y, r: 45, class: "orbital-core-orbit secondary" }),
        createSvgElement("circle", { cx: core.x, cy: core.y, r: 30, class: "orbital-core-pulse" }),
        createSvgElement("circle", { cx: core.x, cy: core.y, r: 18, class: "orbital-core-sphere" })
      );
      const label = createSvgElement("text", { x: core.x, y: core.y + 103, class: "orbital-core-label" });
      label.textContent = core.label;
      const mass = createSvgElement("text", { x: core.x, y: core.y + 119, class: "orbital-core-mass" });
      mass.textContent = `MASS ${core.mass}`;
      mass.dataset.massFor = core.id;
      group.append(label, mass);
      orbitalCoreLayer.append(group);

      const control = document.createElement("button");
      control.type = "button";
      control.className = "orbital-core-button";
      if (orbitalRuntime.orbs.some((orb) => orb.target === core.id)) control.classList.add("is-target");
      if (orbitalOrbAtCore(core.id)) control.classList.add("is-occupied");
      control.style.left = `${core.x / 10}%`;
      control.style.top = `${Math.max(6, (core.y - 100) / 6.2)}%`;
      control.dataset.core = core.id;
      control.innerHTML = `<span>${core.label}</span><strong>MASS ${core.mass} // CYCLE</strong>`;
      control.addEventListener("click", () => cycleOrbitalMass(core.id));
      orbitalCoreControls.append(control);
    }

    for (const orb of orbitalRuntime.orbs) {
      const trail = createSvgElement("path", { class: "orbital-orb-trail", stroke: orb.color });
      trail.dataset.trailFor = orb.id;
      const circle = createSvgElement("circle", { r: 9, class: "orbital-orb", fill: orb.color });
      circle.dataset.orb = orb.id;
      const label = createSvgElement("text", { class: "orbital-orb-label", fill: orb.color });
      label.dataset.orbLabel = orb.id;
      label.textContent = orb.label;
      orbitalOrbLayer.append(trail, circle, label);
    }

    orbitalBudget.textContent = String(orbitalRuntime.budgetRemaining).padStart(2, "0");
    orbitalStability.textContent = `STABILITY ${Math.round((orbitalRuntime.stabilityRemaining / orbitalRuntime.stability) * 100)}%`;
    orbitalResult.hidden = true;
    orbitalCommitButton.hidden = true;
    orbitalSlowButton.setAttribute("aria-pressed", "false");
    renderOrbitalObjectives();
    setOrbitalStatus("AWAITING GRAVITY INPUT");
    updateOrbitalFrame(performance.now(), true);
  }

  function cycleOrbitalMass(coreId) {
    if (!orbitalRuntime || orbitalRuntime.solved) return;
    if (orbitalRuntime.stabilityRemaining <= 0) {
      setOrbitalStatus("MODEL DESTABILISED // RESET REQUIRED", "error");
      return;
    }
    if (orbitalRuntime.budgetRemaining <= 0) {
      destabiliseOrbitalModel("GRAVITY BUDGET EXHAUSTED");
      return;
    }
    const core = orbitalCoreById(coreId);
    core.mass = core.mass >= 3 ? 1 : core.mass + 1;
    orbitalRuntime.budgetRemaining -= 1;
    orbitalBudget.textContent = String(orbitalRuntime.budgetRemaining).padStart(2, "0");
    const massLabel = orbitalCoreLayer.querySelector(`[data-mass-for="${coreId}"]`);
    if (massLabel) massLabel.textContent = `MASS ${core.mass}`;
    const button = orbitalCoreControls.querySelector(`[data-core="${coreId}"] strong`);
    if (button) button.textContent = `MASS ${core.mass} // CYCLE`;
    setOrbitalStatus(`${core.label} SET TO MASS ${core.mass}`, "ready");
  }

  function getOrbitalTransferCandidate(from, to) {
    const orb = orbitalOrbAtCore(from.id);
    if (!orb || orb.core === orb.target || orbitalOrbAtCore(to.id)) return null;
    if (to.mass <= from.mass) return null;
    const linkAngle = Math.atan2(to.y - from.y, to.x - from.x);
    const threshold = orbitalRuntime.slow ? .55 : .4;
    if (angularDistance(orb.angle, linkAngle) > threshold) return null;
    return { orb, from, to };
  }

  function updateOrbitalGates() {
    if (!orbitalRuntime) return;
    orbitalRuntime.activeCandidates.clear();
    orbitalRuntime.links.forEach(([fromId, toId], index) => {
      const from = orbitalCoreById(fromId);
      const to = orbitalCoreById(toId);
      const candidate = getOrbitalTransferCandidate(from, to) || getOrbitalTransferCandidate(to, from);
      const key = `${fromId}-${toId}`;
      const gate = orbitalGateLayer.querySelector(`[data-link="${key}"]`);
      const line = orbitalLinkLayer.querySelector(`[data-link="${key}"]`);
      gate?.classList.toggle("is-ready", Boolean(candidate));
      line?.classList.toggle("is-ready", Boolean(candidate));
      if (candidate) {
        orbitalRuntime.activeCandidates.set(index, candidate);
        gate.textContent = `${candidate.from.id}→${candidate.to.id}`;
      } else if (gate) gate.textContent = "SYNC";
    });
  }

  function triggerOrbitalGate(index) {
    if (!orbitalRuntime || orbitalRuntime.solved) return;
    if (orbitalRuntime.stabilityRemaining <= 0) {
      setOrbitalStatus("MODEL DESTABILISED // RESET REQUIRED", "error");
      return;
    }
    const candidate = orbitalRuntime.activeCandidates.get(index);
    if (!candidate) {
      destabiliseOrbitalModel("TRANSFER MISALIGNED");
      return;
    }
    const destinationAngle = Math.atan2(candidate.from.y - candidate.to.y, candidate.from.x - candidate.to.x);
    candidate.orb.core = candidate.to.id;
    candidate.orb.angle = destinationAngle;
    candidate.orb.direction *= -1;
    const sourceButton = orbitalCoreControls.querySelector(`[data-core="${candidate.from.id}"]`);
    const targetButton = orbitalCoreControls.querySelector(`[data-core="${candidate.to.id}"]`);
    sourceButton?.classList.remove("is-occupied");
    targetButton?.classList.add("is-occupied");
    setOrbitalStatus(`${candidate.orb.label} CAPTURED BY ${candidate.to.label}`, "ready");
    renderOrbitalObjectives();
    checkOrbitalSolution();
  }

  function destabiliseOrbitalModel(message) {
    if (!orbitalRuntime || orbitalRuntime.solved) return;
    orbitalRuntime.stabilityRemaining = Math.max(0, orbitalRuntime.stabilityRemaining - 1);
    orbitalStability.textContent = `STABILITY ${Math.round((orbitalRuntime.stabilityRemaining / orbitalRuntime.stability) * 100)}%`;
    setOrbitalStatus(message, "error");
    orbitalConsole.classList.remove("is-shaking");
    void orbitalConsole.offsetWidth;
    orbitalConsole.classList.add("is-shaking");
    if (orbitalRuntime.stabilityRemaining <= 0) {
      setOrbitalStatus("MODEL DESTABILISED // RESET REQUIRED", "error");
    }
  }

  function checkOrbitalSolution() {
    if (!orbitalRuntime || orbitalRuntime.solved) return;
    if (!orbitalRuntime.orbs.every((orb) => orb.core === orb.target)) return;
    orbitalRuntime.solved = true;
    orbitalResultKicker.textContent = "GRAVITATIONAL CIPHER STABLE";
    orbitalResultTitle.textContent = orbitalRuntime.successTitle;
    orbitalResultText.textContent = orbitalRuntime.successText;
    orbitalResult.hidden = false;
    orbitalCommitButton.hidden = false;
    orbitalAbortButton.hidden = true;
    orbitalResetButton.disabled = true;
    orbitalSlowButton.disabled = true;
    setOrbitalStatus("OVERRIDE ACCEPTED", "success");
    orbitalRuntime.links.forEach(([from, to]) => {
      orbitalLinkLayer.querySelector(`[data-link="${from}-${to}"]`)?.classList.add("is-complete");
    });
  }

  function updateOrbitalFrame(now, force = false) {
    if (!orbitalRuntime || !orbitalDialog.open) return;
    const delta = force ? 0 : Math.min(.05, Math.max(0, (now - orbitalLastFrame) / 1000));
    orbitalLastFrame = now;
    if (!orbitalRuntime.solved) {
      const timeScale = orbitalRuntime.slow ? .34 : 1;
      for (const orb of orbitalRuntime.orbs) {
        const core = orbitalCoreById(orb.core);
        const speed = (.66 + core.mass * .2) * orb.direction * timeScale;
        orb.angle = normaliseAngle(orb.angle + speed * delta);
        const radius = 74 - core.mass * 8;
        const x = core.x + Math.cos(orb.angle) * radius;
        const y = core.y + Math.sin(orb.angle) * radius;
        const circle = orbitalOrbLayer.querySelector(`[data-orb="${orb.id}"]`);
        const label = orbitalOrbLayer.querySelector(`[data-orb-label="${orb.id}"]`);
        const trail = orbitalOrbLayer.querySelector(`[data-trail-for="${orb.id}"]`);
        if (circle) { circle.setAttribute("cx", x); circle.setAttribute("cy", y); }
        if (label) { label.setAttribute("x", x); label.setAttribute("y", y - 15); }
        if (trail) {
          const tailAngle = orb.angle - orb.direction * .45;
          const tx = core.x + Math.cos(tailAngle) * radius;
          const ty = core.y + Math.sin(tailAngle) * radius;
          trail.setAttribute("d", `M ${tx} ${ty} Q ${core.x} ${core.y} ${x} ${y}`);
        }
      }
      updateOrbitalGates();
    }
    orbitalAnimationFrame = window.requestAnimationFrame(updateOrbitalFrame);
  }

  function resetOrbitalPuzzle() {
    if (!orbitalRuntime) return;
    const id = orbitalRuntime.id;
    const onSuccess = orbitalRuntime.onSuccess;
    orbitalRuntime = cloneOrbitalConfig(orbitalPuzzleConfigs[id]);
    orbitalRuntime.id = id;
    orbitalRuntime.onSuccess = onSuccess;
    orbitalAbortButton.hidden = false;
    orbitalResetButton.disabled = false;
    orbitalSlowButton.disabled = false;
    renderOrbitalPuzzle();
  }

  function closeOrbitalPuzzle() {
    window.cancelAnimationFrame(orbitalAnimationFrame);
    orbitalAnimationFrame = 0;
    orbitalRuntime = null;
    closeDialog(orbitalDialog);
    if (state.phase === "game" && !gameScreen.hidden) renderRoomActions(state.currentRoom);
  }

  function startOrbitalPuzzle(id) {
    const config = orbitalPuzzleConfigs[id];
    if (!config) return;
    stopRebreatherCountdown({ preserve: true });
    orbitalRuntime = cloneOrbitalConfig(config);
    orbitalRuntime.id = id;
    orbitalRuntime.onSuccess = id === "south"
      ? completeSouthHallHack
      : id === "security"
        ? completeSecurityOverride
        : completeAtmosphericOverride;
    orbitalKicker.textContent = config.kicker;
    orbitalTitle.textContent = config.title;
    orbitalSubtitle.textContent = config.subtitle;
    orbitalBriefing.textContent = config.briefing;
    orbitalAbortButton.hidden = false;
    orbitalCommitButton.hidden = true;
    openDialog(orbitalDialog);
    renderOrbitalPuzzle();
    orbitalLastFrame = performance.now();
    window.cancelAnimationFrame(orbitalAnimationFrame);
    orbitalAnimationFrame = window.requestAnimationFrame(updateOrbitalFrame);
  }

  async function commitOrbitalOverride() {
    if (!orbitalRuntime?.solved) return;
    const callback = orbitalRuntime.onSuccess;
    closeOrbitalPuzzle();
    if (typeof callback === "function") await callback();
  }

  async function completeSouthHallHack() {
    state.southHallUnlocked = true;
    state.stress = 99;
    advanceMissionTime(12);
    saveState();
    await runCinematicTransition({
      duration: 1150,
      fadeInDuration: 500,
      fadeOutDuration: 760,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("south", { immediate: true });
      }
    });
    showToast("SOUTH HALL OPEN // SECURITY CONTROL ACCESSIBLE");
  }

  async function completeSecurityOverride() {
    state.securityOverrideComplete = true;
    state.cloneRevealed = true;
    state.stress = 99;
    advanceMissionTime(25);
    saveState();
    runSequence([
      {
        image: "assets/IMG52.png",
        fallbackImage: "assets/IMG51.png",
        alt: "A security camera shows a motionless figure resembling Luna inside Tactical Supply.",
        code: "CAM 07 // TACTICAL SUPPLY // BIOMETRIC MATCH LUNA H.",
        title: "SOMEONE IS ALREADY INSIDE",
        text: "The tactical locks release, but the camera feed stops Luna cold. A woman stands inside Supply wearing her proportions, her posture and her face. The system identifies both figures as Luna H.\n\nThe imitation is blocking the oxygen equipment and weapons. Its completed human body is breathing ship air.",
        button: "OPEN ENVIRONMENTAL CONTROL",
        presentation: "surveillance"
      }
    ], async () => {
      await runCinematicTransition({
        duration: 1050,
        fadeInDuration: 470,
        fadeOutDuration: 720,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom("security", { immediate: true });
        }
      });
      showToast("TACTICAL SUPPLY FEED LIVE // HUMAN-FORM ORGANISM CONFIRMED");
    });
  }

  function showCloneSurveillance() {
    runSequence([
      {
        image: "assets/IMG52.png",
        fallbackImage: "assets/IMG51.png",
        alt: "The false Luna stands inside Tactical Supply under surveillance.",
        code: "CAM 07 // TACTICAL SUPPLY",
        title: "BIOMETRIC DUPLICATE",
        text: "The figure remains almost perfectly still. The chest rises and falls. The completed human form requires oxygen, exactly as the Laboratory predicted.",
        button: "RETURN TO SECURITY",
        presentation: "surveillance"
      }
    ], () => showRoom("security"));
  }

  async function completeAtmosphericOverride() {
    state.atmosphereOverrideComplete = true;
    state.cloneIncapacitated = true;
    state.emergencyRebreather = false;
    state.rebreatherSeconds = 90;
    state.stress = 99;
    advanceMissionTime(30);
    saveState();
    runSequence([
      {
        image: "assets/IMG53.png",
        fallbackImage: "assets/IMG52.png",
        alt: "The human-form imitation lies collapsed inside Tactical Supply after the oxygen purge.",
        code: "TACTICAL SUPPLY // O₂ 3.2% // PRESSURE STABLE",
        title: "THE HUMAN FORM COLLAPSES",
        text: "Oxygen drains from the compartment while inert gas holds the pressure. The copied body staggers, reaches for the locked tactical case and falls. Its lungs have failed.\n\nSecurity releases one emergency rebreather: ninety seconds of air for Luna to cross the purged room and reach the proper helmet and tank.",
        button: "PREPARE THE RETRIEVAL",
        presentation: "combat"
      }
    ], async () => {
      await runCinematicTransition({
        duration: 1150,
        fadeInDuration: 500,
        fadeOutDuration: 760,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom("security", { immediate: true });
        }
      });
      showToast("ATMOSPHERIC CONTAINMENT COMPLETE // REBREATHER READY");
    });
  }

  function prepareTacticalRetrieval() {
    state.emergencyRebreather = true;
    state.rebreatherSeconds = 90;
    saveState();
    updateInterface();
    showRoom("security");
    showToast("EMERGENCY REBREATHER SECURED // 90 SECONDS OF AIR");
  }

  async function collectTacticalLoadout() {
    stopRebreatherCountdown({ preserve: true });
    state.tacticalGearCollected = true;
    state.tacticalHelmet = true;
    state.oxygenTank = true;
    state.flamethrower = true;
    state.plasmaRefills = true;
    state.emergencyRebreather = false;
    state.rebreatherSeconds = 0;
    state.checkpoint = 6;
    state.stress = 92;
    advanceMissionTime(8);
    saveState();
    runSequence([
      {
        image: "assets/IMG55.png",
        fallbackImage: "assets/IMG49.png",
        alt: "Luna wears a full sealed helmet and oxygen tank with tactical weapons ready.",
        code: "TACTICAL LOADOUT // OXYGEN LINE ONLINE",
        title: "LUNA CAN BREATHE",
        text: "The helmet locks against Luna's suit and the tank valve opens. Clean oxygen floods the mask. She loads fresh plasma cells and takes the flamethrower from its rack.\n\nThe ship has less than twenty-three hours of breathable reserve left, but Luna is no longer helpless inside it.",
        button: "SECURE CHECKPOINT 06",
        presentation: "restored"
      }
    ], async () => {
      await runCinematicTransition({
        duration: 1250,
        fadeInDuration: 520,
        fadeOutDuration: 820,
        task: async () => {
          armMapReveal();
          updateInterface();
          await showRoom("tactical", { immediate: true });
        }
      });
      showToast("CHECKPOINT 06 SAVED // TACTICAL LOADOUT SECURED");
    });
  }

  function showTacticalLoadout() {
    runSequence([
      {
        image: "assets/IMG55.png",
        fallbackImage: "assets/IMG49.png",
        alt: "Luna stands equipped with a sealed helmet, oxygen tank and weapons.",
        code: "CHECKPOINT 06 // TACTICAL ADVANTAGE",
        title: "LOADOUT SECURED",
        text: "Tactical helmet sealed. Oxygen tank online. Flamethrower acquired. Plasma ammunition replenished. Luna is ready to take the hunt back into the ship.",
        button: "RETURN TO MAP",
        presentation: "restored"
      }
    ], () => showRoom("tactical"));
  }

  async function beginInvestigationRoute() {
    state.investigationUnlocked = true;
    state.mapMode = "investigation";
    state.currentRoom = "control";
    state.stress = Math.max(state.stress, 96);
    saveState();

    await preloadImages(["assets/IMG41.png", "assets/IMG42.png", "assets/IMG43.png"], 2);
    await runCinematicTransition({
      duration: 1100,
      fadeInDuration: 520,
      fadeOutDuration: 760,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("control", { immediate: true });
      }
    });
    showToast("NEW OBJECTIVE // ANALYSE THE RESIDUE SAMPLE IN LABORATORY 07");
  }

  async function runLaboratoryMontage() {
    await preloadImage("assets/IMG41.png");
    preloadImages([
      "assets/IMG41.png", "assets/IMG42.png", "assets/IMG43.png",
      "assets/IMG44.png", "assets/IMG45.png", "assets/IMG46.png",
      "assets/IMG47.png", "assets/IMG48.png", "assets/IMG49.png"
    ], 3);

    runSequence([
      {
        image: "assets/IMG41.png",
        fallbackImage: "assets/IMG09.png",
        alt: "Luna returns to Laboratory 07 carrying the residue sample and plasma gun.",
        code: "LABORATORY 07 // CONTAINMENT AVAILABLE",
        title: "RETURN TO THE LABORATORY",
        text: "Luna locks the Laboratory door behind her and sets the sealed specimen beside the molecular chamber. The residue moves beneath the glass, recoiling from the light and then reaching toward it again.",
        button: "LOAD THE SAMPLE",
        presentation: "montage",
        slide: "left"
      },
      {
        image: "assets/IMG42.png",
        fallbackImage: "assets/IMG09.png",
        alt: "Luna inserts the residue specimen into the molecular analysis chamber.",
        code: "SPECIMEN CHAMBER // SEALED",
        title: "LOAD RESIDUE SAMPLE",
        text: "The chamber locks around the tube. Black material spreads over the inner glass and presses toward Luna's gloved hand. She withdraws it and initiates the scan.",
        button: "BEGIN MOLECULAR ANALYSIS",
        presentation: "montage",
        slide: "right"
      },
      {
        image: "assets/IMG43.png",
        fallbackImage: "assets/IMG08.png",
        alt: "Black alien residue branches and reconstructs itself inside the illuminated analysis chamber.",
        code: "MOLECULAR ANALYSIS // STRUCTURE UNSTABLE",
        title: "UNKNOWN BIOLOGICAL MATERIAL",
        text: "The sample contains no stable cellular structure. Its molecules dismantle and rebuild themselves in response to the scanner. It is not merely alive. It is searching for a biological pattern.\n\nLuna: ‘You're trying to become something.’",
        button: "RUN GENETIC ANALYSIS",
        presentation: "montage",
        slide: "up"
      },
      {
        image: "assets/IMG44.png",
        fallbackImage: "assets/IMG43.png",
        alt: "A holographic display shows alien filaments weaving around a human DNA helix.",
        code: "GENETIC MODEL // REPLICATION ACCURACY 99.8%",
        title: "ADAPTIVE DNA MIMICRY",
        text: "The organism has no fixed genome. It absorbs biological information and reconstructs itself from acquired DNA. The simulated strands begin aligning with a human sequence.\n\nLuna: ‘It can copy living things.’",
        button: "IDENTIFY THE TEMPLATE",
        presentation: "montage",
        slide: "left"
      },
      {
        image: "assets/IMG45.png",
        fallbackImage: "assets/IMG44.png",
        alt: "Luna sees her own face reflected beside a genetic match identifying Luna H.",
        code: "MATCH FOUND // LUNA H. // 99.8%",
        title: "IT STUDIED HER",
        text: "The residue has incorporated fragments of Luna's DNA. It has not merely touched her. It has studied her. The ship marks the potential completed template as HUMAN.\n\nLuna: ‘Even people.’",
        button: "CROSS-REFERENCE SHIP RECORDS",
        presentation: "montage",
        slide: "right"
      },
      {
        image: "assets/IMG46.png",
        fallbackImage: "assets/IMG07.png",
        alt: "A laboratory reconstruction reveals black biological threads concealed inside an Alpha 9 mineral core.",
        code: "ARCHIVE MATCH // ALPHA 9 EXTRACTION",
        title: "HOW IT CAME ABOARD",
        text: "Trace minerals in the organism match the Alpha 9 extraction site. Dormant biological matter was concealed inside the recovered cores. It escaped during cryosleep, copied Luna's genetic signature and used her credentials to enter restricted systems.\n\nLuna: ‘That wasn't my access record. It was pretending to be me.’",
        button: "SIMULATE COMPLETE TRANSFORMATION",
        presentation: "montage",
        slide: "down"
      },
      {
        image: "assets/IMG47.png",
        fallbackImage: "assets/IMG44.png",
        alt: "A molecular simulation shows a fluid alien mass collapsing into a stable human body.",
        code: "TRANSFORMATION MODEL // TEMPLATE INTEGRATION COMPLETE",
        title: "THE FORM BECOMES PERMANENT",
        text: "As the simulation completes, the organism's adaptive activity stops. Its cells lock into the copied biology. It cannot return to its fluid state. It does not wear the body. It becomes the body.\n\nTransformation is irreversible.",
        button: "TEST HUMAN VULNERABILITIES",
        presentation: "montage",
        slide: "left"
      },
      {
        image: "assets/IMG48.png",
        fallbackImage: "assets/IMG47.png",
        alt: "Luna studies a human biological model highlighting oxygen, circulation and vulnerable tissue.",
        code: "HUMAN TEMPLATE // BIOLOGICAL LIMITS CONFIRMED",
        title: "IT CAN DIE",
        text: "A completed human form requires oxygen. It develops circulation, permanent tissue and a finite tolerance for trauma. It can suffocate. It can bleed. It can die.\n\nLuna: ‘Once it becomes human, it becomes mortal.’",
        button: "RECORD THE FINDING",
        presentation: "montage",
        slide: "right"
      },
      {
        image: "assets/IMG49.png",
        fallbackImage: "assets/IMG41.png",
        alt: "Red emergency lights flood Laboratory 07 as Luna raises her plasma gun during shipwide lockdown.",
        code: "SHIPWIDE SECURITY // AUTHORISATION LUNA H.",
        title: "EMERGENCY LOCKDOWN",
        text: "The scanner freezes. Every Laboratory light dies, then returns in red. Reinforced doors seal throughout the ship. The Security Armoury, tactical equipment bay and emergency weapons lockers disappear behind biometric lockdowns authorised under Luna's identity.\n\nThe organism knows she has discovered its weakness.",
        button: "VIEW LOCKDOWN SCHEMATIC",
        presentation: "montage",
        slide: "up"
      }
    ], completeLaboratoryAnalysis, { mode: "montage" });
  }

  async function completeLaboratoryAnalysis() {
    state.organismAnalysed = true;
    state.lockdownActive = true;
    state.investigationUnlocked = true;
    state.checkpoint = 5;
    state.mapMode = "lockdown";
    state.currentRoom = "lab";
    state.oxygenMinutesRemaining = 1440;
    state.earthMinutesRemaining = 2880;
    state.rebreatherSeconds = 90;
    state.stress = 99;
    saveState();
    syncCaptainLogUI();

    await runCinematicTransition({
      duration: 1250,
      fadeInDuration: 560,
      fadeOutDuration: 820,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("lab", { immediate: true });
      }
    });
    showToast("CHECKPOINT 05 SAVED // THE IMITATION // EMERGENCY LOCKDOWN ACTIVE");
  }

  async function finaliseBranch() {
    if (state.finalReported) {
      openFinalGroundDialog();
      return;
    }

    state.finalReported = true;
    state.checkpoint = 3;
    state.mapMode = "final_control";
    state.currentRoom = "control";
    state.stress = Math.max(state.stress, 93);
    saveState();
    await runCinematicTransition({
      kicker: "CONTROL ROOM // FINAL REPORT",
      title: "COMMAND NODE ISOLATED",
      text: "Closing secondary routes and acquiring the Earth relay",
      duration: 800,
      task: async () => {
        armMapReveal();
        updateInterface();
        await showRoom("control", { immediate: true });
      }
    });
    openFinalGroundDialog();
  }

  function openFinalGroundDialog() {
    finalLunaText.textContent = state.branch === "signal"
      ? "Engine 02 is repaired. The ship has thrust, but the lighting network is down. The organism is still aboard and the vessel continues to report two biological signatures."
      : "Satellite navigation is repaired and the Earth-return vector is stable. The organism is still aboard. I have confirmed biological material in the Lab, Mess and Engineering systems.";

    finalGroundText.textContent = "We have your telemetry. Luna... there is no vessel close enough to intercept you before Earth approach. Do not enter the landing corridor. Keep the ship away from Earth while we review containment options. We are sorry. Stay on this channel as long as you can.";
    openDialog(finalGroundDialog);
  }

  function clearMontageClasses() {
    sequenceMedia.classList.remove("montage-slide-left", "montage-slide-right", "montage-slide-up", "montage-slide-down");
    sequenceCopy.classList.remove("montage-copy-left", "montage-copy-right", "montage-copy-up", "montage-copy-down");
    delete sequenceDialog.dataset.slideDirection;
  }

  function cancelActiveSequence({ close = true } = {}) {
    sequenceRunId += 1;
    activeSequence = null;
    sequenceIndex = 0;
    sequenceAdvanceLocked = false;
    sequenceButton.disabled = false;
    sequenceMedia.classList.remove("is-blackout", "is-swapping");
    clearMontageClasses();
    sequenceDialog.classList.remove("is-montage-sequence");
    if (close) closeDialog(sequenceDialog);
  }

  function runSequence(steps, onComplete, options = {}) {
    cancelActiveSequence();
    const runId = ++sequenceRunId;
    activeSequence = { steps, onComplete, runId, mode: options.mode || "standard" };
    sequenceIndex = 0;
    openDialog(sequenceDialog);
    showSequenceStep(runId);
  }

  async function showSequenceStep(runId = activeSequence?.runId) {
    if (!activeSequence || activeSequence.runId !== runId) return;
    const step = activeSequence.steps[sequenceIndex];
    sequenceButton.disabled = true;

    sequenceDialog.classList.remove(
      "is-item-sequence",
      "is-surveillance-sequence",
      "is-threat-sequence",
      "is-failure-sequence",
      "is-repair-sequence",
      "is-combat-sequence",
      "is-communication-sequence",
      "is-corruption-sequence",
      "is-restored-sequence",
      "is-montage-sequence"
    );
    if (step.presentation) sequenceDialog.classList.add(`is-${step.presentation}-sequence`);
    if (activeSequence.mode === "montage") sequenceDialog.classList.add("is-montage-sequence");

    if (step.blackoutBefore && !reducedMotion) {
      sequenceMedia.classList.add("is-blackout");
      await wait(850);
      if (!activeSequence || activeSequence.runId !== runId) return;
    }

    let source = step.image;
    let loaded = await preloadImage(source);
    if (!loaded && step.fallbackImage) {
      source = step.fallbackImage;
      loaded = await preloadImage(source);
    }
    if (!activeSequence || activeSequence.runId !== runId) return;

    sequenceMedia.classList.add("is-swapping");
    await wait(reducedMotion ? 10 : 120);
    if (!activeSequence || activeSequence.runId !== runId) return;

    if (loaded) sequenceImage.src = source;
    sequenceImage.alt = step.alt;
    sequenceCode.textContent = step.code;
    sequenceCounter.textContent = `${String(sequenceIndex + 1).padStart(2, "0")} / ${String(activeSequence.steps.length).padStart(2, "0")}`;
    sequenceTitle.textContent = step.title;
    sequenceText.textContent = step.text;
    sequenceButton.textContent = step.button || "CONTINUE";
    sequenceMedia.classList.remove("is-blackout", "is-swapping");

    if (activeSequence.mode === "montage" && !reducedMotion) {
      clearMontageClasses();
      const direction = step.slide || (["left", "right", "up", "down"][sequenceIndex % 4]);
      const opposite = direction === "left" ? "right" : direction === "right" ? "left" : direction === "up" ? "down" : "up";
      sequenceDialog.dataset.slideDirection = direction;
      void sequenceMedia.offsetWidth;
      sequenceMedia.classList.add(`montage-slide-${direction}`);
      sequenceCopy.classList.add(`montage-copy-${opposite}`);
    }

    sequenceButton.disabled = false;
  }

  async function advanceSequence() {
    if (!activeSequence || sequenceButton.disabled || sequenceAdvanceLocked) return;
    sequenceAdvanceLocked = true;
    const runId = activeSequence.runId;
    sequenceButton.disabled = true;

    try {
      if (sequenceIndex < activeSequence.steps.length - 1) {
        sequenceIndex += 1;
        await showSequenceStep(runId);
        return;
      }

      const onComplete = activeSequence.onComplete;
      activeSequence = null;
      closeDialog(sequenceDialog);
      await wait(reducedMotion ? 10 : 120);
      if (runId !== sequenceRunId) return;
      if (typeof onComplete === "function") await onComplete();
    } finally {
      if (runId === sequenceRunId) sequenceAdvanceLocked = false;
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3400);
  }

  function nearestRoomToPointer(clientX, clientY) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const node of roomNodes) {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - x, clientY - y);
      if (distance < nearestDistance) {
        nearest = node;
        nearestDistance = distance;
      }
    }
    return nearestDistance < 135 ? nearest : null;
  }

  function beginTokenDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const rect = shipMap.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, rect };
    lunaToken.classList.add("is-dragging");
    lunaToken.setPointerCapture?.(event.pointerId);
  }

  function moveTokenDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const x = Math.max(0, Math.min(event.clientX - dragState.rect.left, dragState.rect.width));
    const y = Math.max(0, Math.min(event.clientY - dragState.rect.top, dragState.rect.height));
    lunaToken.style.left = `${x}px`;
    lunaToken.style.top = `${y}px`;
  }

  async function endTokenDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    lunaToken.classList.remove("is-dragging");
    const target = nearestRoomToPointer(event.clientX, event.clientY);
    dragState = null;
    if (!target) {
      positionToken();
      return;
    }
    await moveToRoom(target.dataset.room);
  }

  async function restartGame() {
    closeOrbitalPuzzle();
    stopRebreatherCountdown();
    cancelActiveSequence();
    mediaSwapToken += 1;
    roomFadeToken += 1;
    const confirmed = window.confirm("Restart The Void from the opening cinematic? All checkpoints will be erased.");
    if (!confirmed) return;
    await startNewMission({ force: true });
  }

  playButton.addEventListener("click", () => startNewMission());
  continueGameButton.addEventListener("click", continueMission);
  creditsButton.addEventListener("click", () => openCreditsSequence());
  creditsMuteButton?.addEventListener("click", toggleCreditsMute);
  creditsCloseButton?.addEventListener("click", closeCreditsSequence);
  creditsDoneButton?.addEventListener("click", closeCreditsSequence);
  creditsDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCreditsSequence();
  });
  creditsDialog.addEventListener("close", () => {
    stopCreditsRoll();
    document.documentElement.classList.remove("credits-open");
    document.body.classList.remove("credits-open");
    if (creditsMusic && !creditsMusic.paused) {
      creditsMusic.pause();
      creditsMusic.currentTime = 0;
      creditsMusic.volume = CREDITS_MUSIC_DEFAULT_VOLUME;
    }
    creditsSequenceOpen = false;
  });
  returnCheckpointButton.addEventListener("click", returnToCheckpointFromLoss);
  restartMissionButton.addEventListener("click", restartFromLoss);
  quitTitleButton.addEventListener("click", quitFromLossToTitle);
  orbitalSlowButton.addEventListener("click", () => {
    if (!orbitalRuntime || orbitalRuntime.solved) return;
    orbitalRuntime.slow = !orbitalRuntime.slow;
    orbitalSlowButton.setAttribute("aria-pressed", String(orbitalRuntime.slow));
    setOrbitalStatus(orbitalRuntime.slow ? "TIME DILATION ACTIVE" : "REAL-TIME ORBITS RESTORED", "ready");
  });
  orbitalResetButton.addEventListener("click", resetOrbitalPuzzle);
  orbitalAbortButton.addEventListener("click", closeOrbitalPuzzle);
  orbitalCommitButton.addEventListener("click", commitOrbitalOverride);
  orbitalDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeOrbitalPuzzle();
  });

  continueButton.addEventListener("click", advanceIntro);
  acknowledgeGroundButton.addEventListener("click", acknowledgeGroundControl);
  sequenceButton.addEventListener("click", advanceSequence);
  closeChapterButton.addEventListener("click", () => {
    closeDialog(chapterDialog);
    openDialog(branchDialog);
  });
  signalChoiceButton.addEventListener("click", startSignalBranch);
  aloneChoiceButton.addEventListener("click", startAloneBranch);
  acknowledgeFinalButton.addEventListener("click", beginBlackoutAct);
  restartButton.addEventListener("click", restartGame);
  personalLogNotes.addEventListener("input", scheduleCaptainLogSave);
  addLogTimestampButton.addEventListener("click", addCaptainLogTimestamp);
  clearLogButton.addEventListener("click", clearCaptainLogNotes);

  lunaToken.addEventListener("pointerdown", beginTokenDrag);
  lunaToken.addEventListener("pointermove", moveTokenDrag);
  lunaToken.addEventListener("pointerup", endTokenDrag);
  lunaToken.addEventListener("pointercancel", () => {
    dragState = null;
    lunaToken.classList.remove("is-dragging");
    positionToken();
  });

  titleArtwork.addEventListener("error", () => {
    titleArtwork.hidden = true;
  });

  creditsMusic?.addEventListener("error", () => {
    if (creditsStatus) creditsStatus.textContent = "CREDITS SONG COULD NOT LOAD // CHECK CLOUDFLARE URL";
  });

  document.addEventListener("pointerdown", () => {
    if (creditsDialog.open && creditsMusic?.dataset.autoplay === "blocked") playCreditsMusic();
    else if (!titleScreen.hidden && titleMusic?.dataset.autoplay === "blocked") playTitleMusic();
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (creditsDialog.open && creditsMusic?.dataset.autoplay === "blocked") playCreditsMusic();
    else if (!titleScreen.hidden && titleMusic?.dataset.autoplay === "blocked") playTitleMusic();
    if (event.key === "Escape" && creditsDialog.open) {
      event.preventDefault();
      closeCreditsSequence();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    if (creditsDialog.open || !cinematicTransition.hidden) return;

    if (!titleScreen.hidden && titleScreen.classList.contains("is-visible")) {
      event.preventDefault();
      startNewMission();
      return;
    }

    if (state.phase === "intro" && !cinematicShell.hidden) {
      event.preventDefault();
      advanceIntro();
    }
  });

  window.addEventListener("resize", () => {
    positionToken();
    if (creditsDialog.open) restartCreditsRoll();
  });

  cinematicShell.hidden = true;
  gameScreen.hidden = true;
  loseScreen.hidden = true;
  refreshTitleMenu();
  syncCaptainLogUI();
  preloadImage("assets/IMG00.png");
  preloadImage("assets/IMG56.png");
  window.theVoidCredits = {
    open: () => openCreditsSequence(),
    playEndingCredits: () => openCreditsSequence({ fromEnding: true })
  };

  requestAnimationFrame(() => {
    titleScreen.hidden = false;
    titleScreen.classList.add("is-visible");
    playButton.focus({ preventScroll: true });
    playTitleMusic();
  });
})();
