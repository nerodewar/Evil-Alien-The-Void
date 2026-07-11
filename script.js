(() => {
  "use strict";

  const SAVE_KEY = "theVoidSave_v02";
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

  const roomData = {
    crew: {
      code: "CQ-03",
      title: "CREW QUARTERS",
      status: "SAFE",
      statusClass: "",
      image: "assets/IMG02.png",
      alt: "Luna awake inside the cryosleep chamber under red emergency light.",
      caption: "CRYOSLEEP UNIT 03",
      mediaClass: "",
      text:
        "Luna stands beside the open cryosleep pod, fighting through the last fog of suspended sleep. The alarm repeats beyond the bulkhead. Every third pulse is followed by a faint vibration through the deck.\n\nThe ship map identifies an active fire in Life Support."
    },
    hallway: {
      code: "H-07",
      title: "HALLWAY",
      status: "EMERGENCY LIGHTING",
      statusClass: "",
      image: "assets/IMG02.png",
      alt: "A dim emergency corridor aboard the spacecraft.",
      caption: "HALLWAY H-07",
      mediaClass: "room-hallway",
      text:
        "The main hallway flashes between darkness and amber emergency light. Smoke has begun to drift from the Life Support access door.\n\nThe Control Room branches away to the north. Life Support lies at the far end of the corridor."
    },
    control: {
      code: "CR-01",
      title: "CONTROL ROOM",
      status: "ONLINE",
      statusClass: "",
      image: "assets/IMG04.png",
      alt: "The spacecraft control room lit by cold displays and fire warnings.",
      caption: "PRIMARY FLIGHT CONTROL // PILOT ARCHIVE AVAILABLE",
      mediaClass: "",
      text:
        "The Control Room is dim but operational. Navigation still holds the return course to Earth. Across the central console, a fire warning competes with a quieter notification: the Pilot Archive recorded an internal access event while Luna was asleep."
    },
    lifeFire: {
      code: "LS-07",
      title: "LIFE SUPPORT",
      status: "FIRE ACTIVE",
      statusClass: "is-danger",
      image: "assets/IMG05.png",
      alt: "Luna faces a fierce fire consuming machinery inside Life Support.",
      caption: "OXYGEN SUPPLY CONTROL UNIT // SUPPRESSION OFFLINE",
      mediaClass: "",
      text:
        "Heat breaks across Luna's suit as the access door opens. Fire has taken hold around the oxygen supply assembly, feeding on scorched insulation and leaking coolant vapour.\n\nThe automatic suppression system is offline. Luna can trigger the portable suppressant from her suit, but she will have to remain close to the flames."
    },
    lifeSafe: {
      code: "LS-07",
      title: "LIFE SUPPORT",
      status: "FIRE CONTAINED",
      statusClass: "is-success",
      image: "assets/IMG06.png",
      alt: "A damaged oxygen supply control panel with its casing open and wires deliberately rerouted.",
      caption: "OXYGEN SUPPLY CONTROL PANEL // COMPROMISED",
      mediaClass: "",
      text:
        "The suppressant smothers the last flames. When the smoke thins, Luna sees the oxygen control housing hanging open. Its shield plate was removed before the fire began. Several cables have been pulled loose, stripped and reconnected by hand.\n\nThe heat did not cause this damage. Someone tampered with Life Support."
    }
  };

  const routes = {
    crew: ["hallway"],
    hallway: ["crew", "control", "life"],
    control: ["hallway"],
    life: ["hallway"]
  };

  const defaultState = {
    phase: "intro",
    introIndex: 0,
    currentRoom: "crew",
    fireExtinguished: false,
    logOpened: false,
    damageLogged: false
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
  const fireReadout = document.getElementById("fireReadout");
  const restartButton = document.getElementById("restartButton");
  const shipMap = document.getElementById("shipMap");
  const lunaToken = document.getElementById("lunaToken");
  const roomNodes = [...document.querySelectorAll(".room-node")];
  const lifeNode = document.querySelector('[data-room="life"]');
  const lifeSupportNodeStatus = document.getElementById("lifeSupportNodeStatus");
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

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      return saved ? { ...defaultState, ...saved } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The game remains playable if browser storage is unavailable.
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
    if (character === ".") return 155;
    if (character === ",") return 65;
    if (character === "\n") return 110;
    return 12 + Math.random() * 10;
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
    await wait(reducedMotion ? 20 : 950);

    state.phase = "game";
    state.currentRoom = state.currentRoom || "crew";
    saveState();

    cinematicShell.hidden = true;
    gameScreen.hidden = false;
    updateEmergencyUI();
    updateMapState();
    showRoom(state.currentRoom, { immediate: true });

    requestAnimationFrame(() => {
      positionToken();
      gameScreen.classList.add("is-visible");
    });

    await wait(reducedMotion ? 20 : 170);
    screenFade.classList.remove("is-active");
    showToast("SHIP MAP ONLINE // DRAG LUNA OR SELECT A CONNECTED ROOM");
  }

  function setObjective(text) {
    objectiveText.textContent = text;
  }

  function deriveObjective() {
    if (state.damageLogged) return "Find the source of the Life Support sabotage";
    if (state.fireExtinguished) return "Inspect the oxygen supply control panel";
    if (state.currentRoom === "life") return "Extinguish the fire in Life Support";
    return "Investigate the fire in Life Support";
  }

  function updateEmergencyUI() {
    const contained = state.fireExtinguished;

    lifeNode.classList.toggle("is-contained", contained);
    shipMap.classList.toggle("fire-contained", contained);
    lifeSupportNodeStatus.textContent = contained ? "FIRE CONTAINED" : "EMERGENCY";

    fireReadout.classList.toggle("is-safe", contained);
    fireReadout.querySelector("span").textContent = contained ? "STATUS" : "ALERT";
    fireReadout.querySelector("strong").textContent = contained ? "CONTAINED" : "FIRE";
    oxygenReadout.textContent = contained ? "94%" : "96%";

    setObjective(deriveObjective());
  }

  function getRoomDefinition(room) {
    if (room === "life") {
      return state.fireExtinguished ? roomData.lifeSafe : roomData.lifeFire;
    }
    return roomData[room];
  }

  function getRoomLabel(room) {
    return getRoomDefinition(room).title;
  }

  function updateMapState() {
    roomNodes.forEach((node) => {
      node.classList.toggle("current-room", node.dataset.room === state.currentRoom);
    });

    locationReadout.textContent = `LOCATION: ${getRoomLabel(state.currentRoom)}`;
    const destinations = routes[state.currentRoom].map(getRoomLabel).join(" / ");
    routeReadout.textContent = `ROUTE STATUS: ${destinations} ACCESSIBLE`;
    positionToken();
  }

  function positionToken() {
    if (dragState || gameScreen.hidden) return;

    const node = document.querySelector(`[data-room="${state.currentRoom}"]`);
    if (!node) return;

    const mapRect = shipMap.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const x = nodeRect.left - mapRect.left + nodeRect.width / 2;
    const y = nodeRect.top - mapRect.top + nodeRect.height / 2;

    lunaToken.style.left = `${x}px`;
    lunaToken.style.top = `${y}px`;
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

    if (token !== roomTypingToken) return;
    roomCursor.classList.add("is-hidden");
  }

  async function swapRoomMedia(definition, immediate = false) {
    mediaSwapToken += 1;
    const token = mediaSwapToken;
    roomMedia.classList.toggle("room-hallway", definition.mediaClass === "room-hallway");

    if (!immediate) {
      roomMedia.classList.add("is-swapping");
      await wait(reducedMotion ? 10 : 260);
    }

    if (token !== mediaSwapToken) return;

    roomImage.src = definition.image;
    roomImage.alt = definition.alt;
    mediaCaption.textContent = definition.caption;

    if (roomImage.decode) {
      try {
        await roomImage.decode();
      } catch {
        // The browser can still display the image even if decode() rejects.
      }
    }

    if (token !== mediaSwapToken) return;
    roomMedia.classList.remove("is-swapping");
  }

  function createAction({ label, meta = "", onClick, danger = false, hold = false }, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-button";
    if (danger) button.classList.add("danger-action");
    if (hold) button.classList.add("hold-action");

    button.innerHTML = `
      <span class="action-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="action-label">${label}</span>
      <span class="action-meta">${meta}</span>
    `;

    if (hold) {
      attachHoldAction(button, onClick);
    } else {
      button.addEventListener("click", onClick);
    }

    return button;
  }

  function attachHoldAction(button, callback) {
    const duration = 1900;
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
      button.classList.add("is-complete");
      button.disabled = true;
      window.setTimeout(callback, reducedMotion ? 10 : 180);
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
      button.setPointerCapture?.(event.pointerId);
      frame = requestAnimationFrame(tick);
    }

    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", reset);
    button.addEventListener("pointercancel", reset);
    button.addEventListener("lostpointercapture", () => {
      if (active) reset();
    });

    button.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !active) {
        event.preventDefault();
        active = true;
        startTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });

    button.addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.key === " ") reset();
    });
  }

  function getRoomActions(room) {
    if (room === "crew") {
      return [
        { label: "ENTER HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }
      ];
    }

    if (room === "hallway") {
      return [
        { label: "ENTER CONTROL ROOM", meta: "OPTIONAL", onClick: () => moveToRoom("control") },
        { label: "PROCEED TO LIFE SUPPORT", meta: state.fireExtinguished ? "CLEAR" : "FIRE", danger: !state.fireExtinguished, onClick: () => moveToRoom("life") },
        { label: "RETURN TO CREW QUARTERS", meta: "MOVE", onClick: () => moveToRoom("crew") }
      ];
    }

    if (room === "control") {
      return [
        { label: "OPEN PILOT'S LOG", meta: state.logOpened ? "READ" : "NEW", onClick: openPilotLog },
        { label: "RETURN TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }
      ];
    }

    if (room === "life" && !state.fireExtinguished) {
      return [
        { label: "HOLD TO EXTINGUISH FIRE", meta: "HOLD 2 SEC", danger: true, hold: true, onClick: extinguishFire },
        { label: "RETREAT TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }
      ];
    }

    if (room === "life" && state.fireExtinguished) {
      const actions = [];
      if (!state.damageLogged) {
        actions.push({ label: "LOG THE DAMAGE", meta: "CHECKPOINT", onClick: logDamage });
      }
      actions.push({ label: "RETURN TO HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") });
      return actions;
    }

    return [];
  }

  function renderRoomActions(room) {
    roomActions.replaceChildren();
    const actions = getRoomActions(room);
    actions.forEach((action, index) => roomActions.append(createAction(action, index)));
  }

  async function showRoom(room, { immediate = false } = {}) {
    const baseDefinition = getRoomDefinition(room);
    const definition = { ...baseDefinition };

    if (room === "life" && state.damageLogged) {
      definition.text +=
        "\n\nThe ship has attached an authorised credential to the access event: LUNA H. Luna was in cryosleep when the panel was opened.";
    }

    roomCode.textContent = definition.code;
    roomTitle.textContent = definition.title;
    roomStatus.textContent = definition.status;
    roomStatus.className = `room-status ${definition.statusClass}`.trim();

    renderRoomActions(room);
    swapRoomMedia(definition, immediate);
    typeRoomText(definition.text, immediate);
  }

  async function moveToRoom(targetRoom) {
    if (targetRoom === state.currentRoom) {
      positionToken();
      showRoom(targetRoom);
      return true;
    }

    if (!routes[state.currentRoom].includes(targetRoom)) {
      const node = document.querySelector(`[data-room="${targetRoom}"]`);
      node?.classList.add("invalid-target");
      window.setTimeout(() => node?.classList.remove("invalid-target"), 420);
      showToast("ROUTE UNAVAILABLE // MOVE THROUGH AN ADJACENT ROOM");
      positionToken();
      return false;
    }

    state.currentRoom = targetRoom;
    saveState();
    updateEmergencyUI();
    updateMapState();
    await showRoom(targetRoom);

    if (targetRoom === "life" && !state.fireExtinguished) {
      showToast("WARNING // FIRE SUPPRESSION OFFLINE");
    }

    return true;
  }

  function openPilotLog() {
    state.logOpened = true;
    saveState();
    renderRoomActions("control");
    logFooterStatus.textContent = "ARCHIVE READ // ACCESS EVENT FLAGGED";

    if (typeof pilotLogDialog.showModal === "function") {
      pilotLogDialog.showModal();
    } else {
      pilotLogDialog.setAttribute("open", "");
    }
  }

  async function extinguishFire() {
    state.fireExtinguished = true;
    saveState();
    updateEmergencyUI();
    updateMapState();
    showToast("FIRE CONTAINED // OXYGEN CONTROL PANEL EXPOSED");

    await showRoom("life");
  }

  function logDamage() {
    state.damageLogged = true;
    saveState();
    updateEmergencyUI();
    renderRoomActions("life");

    roomNarrative.textContent +=
      "\n\nLuna records the damage and seals the panel from further access. The ship accepts the report, then identifies the authorised user responsible for opening the housing: LUNA H. She was in cryosleep when it happened.";

    showToast("CHECKPOINT 01 SAVED // SABOTAGE CONFIRMED");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function nearestRoomToPointer(clientX, clientY) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const node of roomNodes) {
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centerX, clientY - centerY);
      if (distance < nearestDistance) {
        nearest = node.dataset.room;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= 145 ? nearest : null;
  }

  function beginTokenDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    const mapRect = shipMap.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, mapRect };
    lunaToken.classList.add("is-dragging");
    lunaToken.setPointerCapture?.(event.pointerId);
  }

  function moveTokenDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const rect = dragState.mapRect;
    const x = Math.max(36, Math.min(event.clientX - rect.left, rect.width - 36));
    const y = Math.max(36, Math.min(event.clientY - rect.top, rect.height - 36));
    lunaToken.style.left = `${x}px`;
    lunaToken.style.top = `${y}px`;
  }

  async function endTokenDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const target = nearestRoomToPointer(event.clientX, event.clientY);
    lunaToken.classList.remove("is-dragging");
    dragState = null;

    if (target) {
      await moveToRoom(target);
    } else {
      positionToken();
    }
  }

  function restartGame() {
    const confirmed = window.confirm("Restart The Void from the opening cinematic? Your current checkpoint will be cleared.");
    if (!confirmed) return;

    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }

  continueButton.addEventListener("click", advanceIntro);

  document.addEventListener("keydown", (event) => {
    if (state.phase !== "intro" || cinematicShell.hidden || pilotLogDialog.open) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advanceIntro();
  });

  roomNodes.forEach((node) => {
    node.addEventListener("click", () => moveToRoom(node.dataset.room));
  });

  lunaToken.addEventListener("pointerdown", beginTokenDrag);
  lunaToken.addEventListener("pointermove", moveTokenDrag);
  lunaToken.addEventListener("pointerup", endTokenDrag);
  lunaToken.addEventListener("pointercancel", () => {
    lunaToken.classList.remove("is-dragging");
    dragState = null;
    positionToken();
  });

  lunaToken.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showRoom(state.currentRoom);
    }
  });

  pilotLogDialog.addEventListener("close", () => {
    showToast("PILOT ARCHIVE CLOSED // INTERNAL ACCESS EVENT RETAINED");
  });

  restartButton.addEventListener("click", restartGame);
  window.addEventListener("resize", positionToken);

  async function initialise() {
    // Preload all current chapter art without blocking first paint.
    ["assets/IMG03.png", "assets/IMG04.png", "assets/IMG05.png", "assets/IMG06.png"].forEach(preloadImage);

    if (state.phase === "game") {
      cinematicShell.hidden = true;
      gameScreen.hidden = false;
      updateEmergencyUI();
      updateMapState();
      await showRoom(state.currentRoom, { immediate: true });
      requestAnimationFrame(() => {
        positionToken();
        gameScreen.classList.add("is-visible");
      });
      return;
    }

    state.introIndex = Math.max(0, Math.min(state.introIndex, introScenes.length - 1));
    showIntroScene(state.introIndex, { initial: true });
  }

  initialise();
})();
