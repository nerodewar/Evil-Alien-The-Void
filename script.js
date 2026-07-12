(() => {
  "use strict";

  const SAVE_KEY = "theVoidSave_v041";
  const LEGACY_KEYS = ["theVoidSave_v04", "theVoidSave_v03", "theVoidSave_v02"];
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
    checkpoint: 0,
    stress: 8
  };

  let state = loadState();
  let introTyping = false;
  let introTypingToken = 0;
  let introFullText = "";
  let introTransitionLocked = false;
  let roomTypingToken = 0;
  let mediaSwapToken = 0;
  let toastTimer = 0;
  let dragState = null;
  let roomNodes = [];
  let activeSequence = null;
  let sequenceIndex = 0;

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
  const oxygenReadout = document.getElementById("oxygenReadout");
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

  const screenFade = document.getElementById("screenFade");
  const toast = document.getElementById("toast");
  const pilotLogDialog = document.getElementById("pilotLogDialog");
  const logFooterStatus = document.getElementById("logFooterStatus");
  const groundControlDialog = document.getElementById("groundControlDialog");
  const acknowledgeGroundButton = document.getElementById("acknowledgeGroundButton");
  const sequenceDialog = document.getElementById("sequenceDialog");
  const sequenceMedia = document.getElementById("sequenceMedia");
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
    candidate.checkpoint = Math.max(0, Math.min(Number(candidate.checkpoint) || 0, 3));

    if (candidate.damageLogged) candidate.checkpoint = Math.max(candidate.checkpoint, 1);
    if (candidate.hidingCompleted) candidate.checkpoint = Math.max(candidate.checkpoint, 2);
    if (candidate.finalReported) candidate.checkpoint = 3;

    if (candidate.finalReported) candidate.mapMode = "final_control";
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
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function preloadImage(source) {
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      await new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }
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

  function introPause(character) {
    if (reducedMotion) return 0;
    if (character === ".") return 300;
    if (character === ",") return 105;
    if (character === ":") return 145;
    if (character === "\n") return 210;
    return 23 + Math.random() * 17;
  }

  function roomPause(character) {
    if (reducedMotion) return 0;
    if (character === ".") return 145;
    if (character === ",") return 62;
    if (character === "\n") return 100;
    return 11 + Math.random() * 9;
  }

  function setContinueReady(isReady) {
    continueButton.disabled = !isReady;
    continueButton.setAttribute("aria-disabled", String(!isReady));
    keyboardHint.classList.toggle("is-ready", isReady);
    keyboardHint.textContent = isReady ? "ENTER TO CONTINUE" : "ENTER TO COMPLETE TRANSMISSION";
  }

  function completeIntroTyping() {
    if (!introTyping) return;
    introTypingToken += 1;
    narrative.textContent = introFullText;
    introTyping = false;
    typeCursor.classList.add("is-hidden");
    setContinueReady(true);
  }

  async function typeIntroText(text) {
    introTypingToken += 1;
    const token = introTypingToken;
    introFullText = text;
    narrative.textContent = "";
    introTyping = true;
    typeCursor.classList.remove("is-hidden");
    setContinueReady(false);

    if (reducedMotion) {
      completeIntroTyping();
      return;
    }

    for (const character of text) {
      if (token !== introTypingToken) return;
      narrative.textContent += character;
      await wait(introPause(character));
    }

    if (token !== introTypingToken) return;
    introTyping = false;
    typeCursor.classList.add("is-hidden");
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
    narrative.textContent = "";
    typeCursor.classList.remove("is-hidden");
    setContinueReady(false);

    await wait(reducedMotion ? 10 : 90);
    cinematicFrame.classList.remove("is-transitioning");
    sceneImage.classList.add("is-visible");
    typeIntroText(scene.text);
  }

  async function advanceIntro() {
    if (introTransitionLocked) return;
    if (introTyping) {
      completeIntroTyping();
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
    screenFade.classList.add("is-active");
    await wait(reducedMotion ? 20 : 850);

    state.phase = "game";
    saveState();
    cinematicShell.hidden = true;
    gameScreen.hidden = false;
    ensureCurrentRoom();
    updateInterface();
    await showRoom(state.currentRoom, { immediate: true });

    requestAnimationFrame(() => {
      positionToken();
      gameScreen.classList.add("is-visible");
    });

    await wait(reducedMotion ? 20 : 150);
    screenFade.classList.remove("is-active");
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
      satnav: "SAT-NAV ARRAY"
    };
    return names[room] || String(room).toUpperCase();
  }

  function originalMapConfig() {
    const expanded = state.damageLogged;
    const nodes = expanded
      ? [
          { id: "crew", code: "CQ-03", name: "CREW QUARTERS", status: "STARTING LOCATION", x: 15, y: 16 },
          { id: "hallway", code: "H-07", name: "HALLWAY", status: "MAIN ACCESS", x: 39, y: 16 },
          { id: "control", code: "CR-01", name: "CONTROL ROOM", status: state.groundContacted ? "CHANNEL OPEN" : "GROUND CONTROL", x: 39, y: 5.5 },
          { id: "life", code: "LS-07", name: "LIFE SUPPORT", status: state.fireExtinguished ? "FIRE CONTAINED" : "EMERGENCY", x: 66, y: 16, classes: state.fireExtinguished ? ["alert-room", "is-contained"] : ["alert-room"], alert: !state.fireExtinguished },
          { id: "south", code: "SH-07", name: "SOUTH HALLWAY", status: state.groundContacted ? "ACCESSIBLE" : "AWAIT GROUND", x: 66, y: 38 },
          { id: "lab", code: "LAB-07", name: "LABORATORY", status: state.sampleCollected ? "SAMPLE SECURED" : state.residueFound ? "CLUE FOUND" : state.groundContacted ? "UNSCANNED" : "SEALED", x: 87, y: 47 },
          { id: "store", code: "ST-07", name: "STORE ROOM", status: state.equipmentTaken ? "EQUIPPED" : state.alienEncountered ? "ACCESSIBLE" : "SAFETY LOCK", x: 43, y: 61 },
          { id: "kitchen", code: "K-07", name: "KITCHEN / MESS", status: state.alienEncountered ? "CONTACT" : state.sampleCollected ? "UNSCANNED" : "SEALED", x: 66, y: 65 },
          { id: "engineering", code: "EN-07", name: "ENGINEERING", status: state.hidingInProgress ? "HIDING" : state.engineeringUnlocked ? "UNLOCKED" : state.engineeringKey ? "KEY ACQUIRED" : "LOCKED", x: 66, y: 87 }
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

  function renderMap() {
    const config = getMapConfig();
    mapTitle.textContent = config.title;
    mapInstruction.textContent = config.instruction;
    shipMap.className = "ship-map";
    if (config.compact) shipMap.classList.add("map-compact");
    if (config.expanded) shipMap.classList.add("map-expanded");
    if (config.mission) shipMap.classList.add("mission-map");
    if (config.interior) shipMap.classList.add("interior-map");
    if (config.exterior) shipMap.classList.add("exterior-map");
    if (config.final) shipMap.classList.add("final-map");

    const byId = Object.fromEntries(config.nodes.map((node) => [node.id, node]));
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "map-connections");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    for (const edge of config.edges) {
      const [fromId, toId, edgeClass = ""] = edge;
      const from = byId[fromId];
      const to = byId[toId];
      if (!from || !to) continue;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("class", `connection-line ${edgeClass}`.trim());
      svg.append(line);
    }

    const nodeElements = config.nodes.map((node) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "room-node";
      for (const className of node.classes || []) button.classList.add(className);
      button.dataset.room = node.id;
      button.style.setProperty("--x", `${node.x}%`);
      button.style.setProperty("--y", `${node.y}%`);

      if (node.alert) {
        const ring = document.createElement("span");
        ring.className = "alert-ring";
        ring.setAttribute("aria-hidden", "true");
        const badge = document.createElement("span");
        badge.className = "alert-badge";
        badge.textContent = "FIRE";
        button.append(ring, badge);
      }

      const code = document.createElement("span");
      code.className = "node-code";
      code.textContent = node.code;
      const strong = document.createElement("strong");
      strong.textContent = node.name;
      const small = document.createElement("small");
      small.textContent = node.status;
      button.append(code, strong, small);

      const accessReason = getAccessReason(node.id);
      const adjacent = getActiveRoutes()[state.currentRoom]?.includes(node.id);
      button.classList.toggle("current-room", node.id === state.currentRoom);
      button.classList.toggle("reachable", Boolean(adjacent && !accessReason));
      button.classList.toggle("is-locked", Boolean(accessReason));
      button.setAttribute("aria-disabled", String(Boolean(accessReason)));
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

    if (!state.fireExtinguished) {
      label.textContent = "ALERT";
      value.textContent = "FIRE";
      return;
    }
    if (state.finalReported) {
      threatReadout.classList.add("is-alien");
      label.textContent = "EARTH";
      value.textContent = "HOLD";
      return;
    }
    if (state.lightsOut) {
      threatReadout.classList.add("is-alien");
      label.textContent = "POWER";
      value.textContent = "BLACKOUT";
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
    oxygenReadout.textContent = state.currentRoom === "outside" || state.currentRoom === "satnav" ? "88%" : state.lightsOut ? "91%" : state.fireExtinguished ? "94%" : "96%";
    powerReadout.textContent = state.lightsOut ? "43%" : state.satNavFailed ? "68%" : state.alienEncountered ? "76%" : state.damageLogged ? "79%" : "81%";
    stressReadout.textContent = `${String(state.stress).padStart(2, "0")}%`;
    updateThreatReadout();
    updateInventory();
    renderMap();
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

  async function typeRoomText(text, immediate = false) {
    roomTypingToken += 1;
    const token = roomTypingToken;
    roomNarrative.textContent = "";
    roomCursor.classList.remove("is-hidden");

    if (immediate || reducedMotion) {
      roomNarrative.textContent = text;
      roomCursor.classList.add("is-hidden");
      return;
    }

    for (const character of text) {
      if (token !== roomTypingToken) return;
      roomNarrative.textContent += character;
      await wait(roomPause(character));
    }
    if (token === roomTypingToken) roomCursor.classList.add("is-hidden");
  }

  async function swapRoomMedia(definition, immediate = false) {
    mediaSwapToken += 1;
    const token = mediaSwapToken;
    await preloadImage(definition.image);
    if (token !== mediaSwapToken) return;

    if (!immediate && !reducedMotion) {
      roomMedia.classList.add("is-swapping");
      await wait(220);
    }
    if (token !== mediaSwapToken) return;
    roomImage.src = definition.image;
    roomImage.alt = definition.alt;
    mediaCaption.textContent = definition.caption;
    roomMedia.className = `room-media ${definition.mediaClass || ""}`.trim();
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
      if (action.hold) attachHoldAction(button, action.duration || 2000, action.onClick);
      else button.addEventListener("click", action.onClick);
    }
    return button;
  }

  function attachHoldAction(button, duration, callback) {
    let active = false;
    let startTime = 0;
    let frame = 0;

    function reset() {
      active = false;
      cancelAnimationFrame(frame);
      button.style.setProperty("--hold-progress", "0%");
    }

    function finish() {
      active = false;
      cancelAnimationFrame(frame);
      button.style.setProperty("--hold-progress", "100%");
      button.disabled = true;
      window.setTimeout(callback, reducedMotion ? 10 : 160);
    }

    function tick(now) {
      if (!active) return;
      const progress = Math.min((now - startTime) / duration, 1);
      button.style.setProperty("--hold-progress", `${progress * 100}%`);
      if (progress >= 1) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    function begin(event) {
      if (button.disabled || active) return;
      event.preventDefault();
      active = true;
      startTime = performance.now();
      if (event.pointerId !== undefined) button.setPointerCapture?.(event.pointerId);
      frame = requestAnimationFrame(tick);
    }

    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", reset);
    button.addEventListener("pointercancel", reset);
    button.addEventListener("lostpointercapture", () => active && reset());
    button.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !active) begin(event);
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.key === " ") reset();
    });
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
      actions.push({ label: "OPEN PILOT'S LOG", meta: state.logOpened ? "READ" : "NEW", onClick: openPilotLog });
      actions.push({ label: "RETURN TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") });
      return actions;
    }

    if (room === "life" && !state.fireExtinguished) {
      return [
        { label: "HOLD TO EXTINGUISH FIRE", meta: "HOLD 2 SEC", danger: true, hold: true, duration: 2000, onClick: extinguishFire },
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

      if (state.hidingInProgress) return [{ label: "HOLD TO REMAIN SILENT", meta: "HOLD 3 SEC", danger: true, hold: true, duration: 3000, onClick: completeHiding }];

      return [
        { label: "HIDE UNDER THE WORKBENCH", meta: "LOW COVER", onClick: () => chooseHide("workbench") },
        { label: "HIDE BEHIND ENGINE HOUSING", meta: "HEAT RISK", onClick: () => chooseHide("engine") },
        { label: "HIDE INSIDE COOLANT LOCKER", meta: "LOW O₂", onClick: () => chooseHide("locker") }
      ];
    }

    return [];
  }

  function getMissionActions(room) {
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
          { label: "OPEN PILOT'S LOG", meta: "ARCHIVE", onClick: openPilotLog }
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
          : [{ label: "HOLD TO REPLACE ENGINE REGULATOR", meta: "HOLD 3 SEC", danger: true, hold: true, duration: 3000, onClick: repairEngine }];
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
          : [{ label: "HOLD TO REPLACE SAT-NAV COMPONENT", meta: "HOLD 3 SEC", danger: true, hold: true, duration: 3000, onClick: repairSatNav }];
      }
    }

    return [];
  }

  function renderRoomActions(room) {
    roomActions.replaceChildren();
    getRoomActions(room).forEach((action, index) => roomActions.append(createAction(action, index)));
  }

  async function showRoom(room, { immediate = false } = {}) {
    const definition = getRoomDefinition(room);
    roomCode.textContent = definition.code;
    roomTitle.textContent = definition.title;
    roomStatus.textContent = definition.status;
    roomStatus.className = `room-status ${definition.statusClass || ""}`.trim();
    renderRoomActions(room);
    swapRoomMedia(definition, immediate);
    typeRoomText(definition.text, immediate);
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
    updateInterface();
    await showRoom(targetRoom);

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
    logFooterStatus.textContent = state.damageLogged ? "ARCHIVE READ // ACCESS EVENT MATCHES SABOTAGE WINDOW" : "ARCHIVE READ // ACCESS EVENT FLAGGED";
    openDialog(pilotLogDialog);
  }

  async function acknowledgeGroundControl() {
    state.groundContacted = true;
    state.stress = Math.max(state.stress, 14);
    saveState();
    closeDialog(groundControlDialog);
    updateInterface();
    await showRoom("control");
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
    updateInterface();
    await showRoom("life");
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
      () => {
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
        updateInterface();
        await showRoom("control");
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
        updateInterface();
        await showRoom("tunnels");
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
        updateInterface();
        await showRoom("engine");
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
        updateInterface();
        await showRoom("engine");
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
        updateInterface();
        await showRoom("control");
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
        updateInterface();
        await showRoom("satnav");
        showToast("SAT-NAV RESTORED // RETURN TO CONTROL");
      }
    );
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
    updateInterface();
    await showRoom("control");
    openFinalGroundDialog();
  }

  function openFinalGroundDialog() {
    finalLunaText.textContent = state.branch === "signal"
      ? "Engine 02 is repaired. The ship has thrust, but the lighting network is down. The organism is still aboard and the vessel continues to report two biological signatures."
      : "Satellite navigation is repaired and the Earth-return vector is stable. The organism is still aboard. I have confirmed biological material in the Lab, Mess and Engineering systems.";

    finalGroundText.textContent = "We have your telemetry. Luna... there is no vessel close enough to intercept you before Earth approach. Do not enter the landing corridor. Keep the ship away from Earth while we review containment options. We are sorry. Stay on this channel as long as you can.";
    openDialog(finalGroundDialog);
  }

  function runSequence(steps, onComplete) {
    activeSequence = { steps, onComplete };
    sequenceIndex = 0;
    openDialog(sequenceDialog);
    showSequenceStep();
  }

  async function showSequenceStep() {
    if (!activeSequence) return;
    const step = activeSequence.steps[sequenceIndex];
    sequenceButton.disabled = true;

    if (step.blackoutBefore && !reducedMotion) {
      sequenceMedia.classList.add("is-blackout");
      await wait(850);
    }

    await preloadImage(step.image);
    sequenceMedia.classList.add("is-swapping");
    await wait(reducedMotion ? 10 : 250);
    sequenceImage.src = step.image;
    sequenceImage.alt = step.alt;
    sequenceCode.textContent = step.code;
    sequenceCounter.textContent = `${String(sequenceIndex + 1).padStart(2, "0")} / ${String(activeSequence.steps.length).padStart(2, "0")}`;
    sequenceTitle.textContent = step.title;
    sequenceText.textContent = step.text;
    sequenceButton.textContent = step.button || "CONTINUE";
    sequenceMedia.classList.remove("is-blackout", "is-swapping");
    sequenceButton.disabled = false;
  }

  async function advanceSequence() {
    if (!activeSequence || sequenceButton.disabled) return;
    sequenceButton.disabled = true;
    if (sequenceIndex < activeSequence.steps.length - 1) {
      sequenceIndex += 1;
      await showSequenceStep();
      return;
    }
    const onComplete = activeSequence.onComplete;
    activeSequence = null;
    closeDialog(sequenceDialog);
    await wait(reducedMotion ? 10 : 120);
    if (typeof onComplete === "function") await onComplete();
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

  function restartGame() {
    const confirmed = window.confirm("Restart The Void from the opening cinematic? All checkpoints will be erased.");
    if (!confirmed) return;
    try {
      localStorage.removeItem(SAVE_KEY);
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    } catch {
      // Reload still resets the in-memory game.
    }
    window.location.reload();
  }

  continueButton.addEventListener("click", advanceIntro);
  acknowledgeGroundButton.addEventListener("click", acknowledgeGroundControl);
  sequenceButton.addEventListener("click", advanceSequence);
  closeChapterButton.addEventListener("click", () => {
    closeDialog(chapterDialog);
    openDialog(branchDialog);
  });
  signalChoiceButton.addEventListener("click", startSignalBranch);
  aloneChoiceButton.addEventListener("click", startAloneBranch);
  acknowledgeFinalButton.addEventListener("click", () => {
    closeDialog(finalGroundDialog);
    showToast("CHECKPOINT 03 SAVED // EARTH APPROACH SUSPENDED");
  });
  restartButton.addEventListener("click", restartGame);

  lunaToken.addEventListener("pointerdown", beginTokenDrag);
  lunaToken.addEventListener("pointermove", moveTokenDrag);
  lunaToken.addEventListener("pointerup", endTokenDrag);
  lunaToken.addEventListener("pointercancel", () => {
    dragState = null;
    lunaToken.classList.remove("is-dragging");
    positionToken();
  });

  document.addEventListener("keydown", (event) => {
    if (state.phase !== "intro") return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advanceIntro();
  });

  window.addEventListener("resize", positionToken);

  if (state.phase === "intro") {
    gameScreen.hidden = true;
    cinematicShell.hidden = false;
    showIntroScene(state.introIndex, { initial: true });
  } else {
    cinematicShell.hidden = true;
    gameScreen.hidden = false;
    ensureCurrentRoom();
    updateInterface();
    showRoom(state.currentRoom, { immediate: true });
    requestAnimationFrame(() => {
      positionToken();
      gameScreen.classList.add("is-visible");
    });
  }
})();
