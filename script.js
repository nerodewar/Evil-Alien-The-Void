(() => {
  "use strict";

  const SAVE_KEY = "theVoidSave_v03";
  const LEGACY_SAVE_KEY = "theVoidSave_v02";
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

  const routes = {
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

  const chapterTwoRooms = new Set(["south", "lab", "store", "kitchen", "engineering"]);

  const defaultState = {
    phase: "intro",
    introIndex: 0,
    currentRoom: "crew",
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
  const lunaToken = document.getElementById("lunaToken");
  const roomNodes = [...document.querySelectorAll(".room-node")];
  const lifeNode = document.querySelector('[data-room="life"]');
  const lifeSupportNodeStatus = document.getElementById("lifeSupportNodeStatus");
  const controlNodeStatus = document.getElementById("controlNodeStatus");
  const southNodeStatus = document.getElementById("southNodeStatus");
  const labNodeStatus = document.getElementById("labNodeStatus");
  const storeNodeStatus = document.getElementById("storeNodeStatus");
  const kitchenNodeStatus = document.getElementById("kitchenNodeStatus");
  const engineeringNodeStatus = document.getElementById("engineeringNodeStatus");
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

  function loadState() {
    try {
      const current = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (current) return normaliseState({ ...defaultState, ...current });

      const legacy = JSON.parse(localStorage.getItem(LEGACY_SAVE_KEY));
      if (legacy) {
        const migrated = normaliseState({ ...defaultState, ...legacy });
        localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      // Fall through to a fresh game.
    }

    return { ...defaultState };
  }

  function normaliseState(candidate) {
    const validRooms = new Set(Object.keys(routes));
    if (!validRooms.has(candidate.currentRoom)) candidate.currentRoom = "crew";
    candidate.introIndex = Math.max(0, Math.min(Number(candidate.introIndex) || 0, introScenes.length - 1));
    candidate.stress = Math.max(0, Math.min(Number(candidate.stress) || 8, 99));
    if (candidate.damageLogged) candidate.checkpoint = Math.max(candidate.checkpoint || 0, 1);
    if (candidate.hidingCompleted) candidate.checkpoint = 2;
    return candidate;
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

  function openDialog(dialog) {
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog.open) return;
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
    await wait(reducedMotion ? 20 : 900);

    state.phase = "game";
    state.currentRoom = state.currentRoom || "crew";
    saveState();

    cinematicShell.hidden = true;
    gameScreen.hidden = false;
    updateInterface();
    await showRoom(state.currentRoom, { immediate: true });

    requestAnimationFrame(() => {
      positionToken();
      gameScreen.classList.add("is-visible");
    });

    await wait(reducedMotion ? 20 : 160);
    screenFade.classList.remove("is-active");
    showToast("SHIP MAP ONLINE // DRAG LUNA OR SELECT A CONNECTED ROOM");
  }

  function deriveObjective() {
    if (!state.fireExtinguished) {
      return state.currentRoom === "life" ? "Extinguish the fire in Life Support" : "Investigate the fire in Life Support";
    }
    if (!state.damageLogged) return "Inspect and log the compromised oxygen control panel";
    if (!state.groundContacted) return "Report the sabotage to Ground Control";
    if (!state.residueFound) return "Inspect the ship's facilities for further compromise";
    if (!state.sampleCollected) return "Secure a sample of the black residue";
    if (!state.alienEncountered) return "Continue the inspection in the Kitchen / Mess Hall";
    if (!state.equipmentTaken) return "Find equipment and an Engineering access key";
    if (!state.engineeringUnlocked) return "Unlock the Engineering Room";
    if (!state.hideChoice) return "Hide before the organism reaches Engineering";
    if (!state.hidingCompleted) return "Remain silent and avoid detection";
    return "Checkpoint 02 saved // assess the organism from hiding";
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

    if (state.hidingCompleted) {
      threatReadout.classList.add("is-alien");
      label.textContent = "CREW";
      value.textContent = "02";
      return;
    }

    if (state.alienEncountered || state.residueFound) {
      threatReadout.classList.add("is-alien");
      label.textContent = state.alienEncountered ? "THREAT" : "TRACE";
      value.textContent = state.alienEncountered ? "HUNT" : "BIO";
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

  function getAccessReason(room) {
    if (chapterTwoRooms.has(room) && !state.damageLogged) {
      return "SOUTHERN DECK UNAVAILABLE // COMPLETE THE LIFE SUPPORT CHECK";
    }

    if (chapterTwoRooms.has(room) && !state.groundContacted) {
      return "NEW DIRECTIVE REQUIRED // CONTACT GROUND CONTROL";
    }

    if (room === "kitchen" && !state.sampleCollected && !state.alienEncountered) {
      return "LABORATORY INSPECTION INCOMPLETE // SECURE THE RESIDUE SAMPLE";
    }

    if (room === "store" && !state.alienEncountered) {
      return "STORE ROOM SAFETY LOCK ACTIVE";
    }

    if (room === "engineering" && !state.alienEncountered) {
      return "ENGINEERING SECURITY LOCK ACTIVE";
    }

    return "";
  }

  function updateMapState() {
    const mapExpanded = state.damageLogged;
    shipMap.classList.toggle("map-expanded", mapExpanded);

    lifeNode.classList.toggle("is-contained", state.fireExtinguished);
    lifeSupportNodeStatus.textContent = state.fireExtinguished ? "FIRE CONTAINED" : "EMERGENCY";
    controlNodeStatus.textContent = state.damageLogged && !state.groundContacted ? "GROUND CONTROL" : state.groundContacted ? "CHANNEL OPEN" : "PILOT SYSTEMS";
    southNodeStatus.textContent = !state.groundContacted ? "AWAIT GROUND" : "ACCESSIBLE";
    labNodeStatus.textContent = state.sampleCollected ? "SAMPLE SECURED" : state.residueFound ? "CLUE FOUND" : state.groundContacted ? "UNSCANNED" : "SEALED";
    storeNodeStatus.textContent = state.equipmentTaken ? "EQUIPPED" : state.alienEncountered ? "ACCESSIBLE" : "SAFETY LOCK";
    kitchenNodeStatus.textContent = state.alienEncountered ? "CONTACT" : state.sampleCollected ? "UNSCANNED" : "SEALED";
    engineeringNodeStatus.textContent = state.hidingInProgress ? "HIDING" : state.engineeringUnlocked ? "UNLOCKED" : state.engineeringKey ? "KEY ACQUIRED" : "LOCKED";

    roomNodes.forEach((node) => {
      const room = node.dataset.room;
      const isCurrent = room === state.currentRoom;
      const adjacent = routes[state.currentRoom]?.includes(room);
      const accessReason = getAccessReason(room);
      node.classList.toggle("current-room", isCurrent);
      node.classList.toggle("reachable", Boolean(adjacent && !accessReason));
      node.classList.toggle("is-locked", Boolean(accessReason));
      node.setAttribute("aria-disabled", String(Boolean(accessReason)));
    });

    locationReadout.textContent = `LOCATION: ${getRoomName(state.currentRoom)}`;
    const connected = routes[state.currentRoom]
      .filter((room) => !getAccessReason(room))
      .map(getRoomName)
      .join(" / ");
    routeReadout.textContent = connected ? `ROUTE STATUS: ${connected}` : "ROUTE STATUS: NO CLEAR EXIT";
  }

  function updateInterface() {
    objectiveText.textContent = deriveObjective();
    oxygenReadout.textContent = state.fireExtinguished ? (state.hidingInProgress ? "91%" : "94%") : "96%";
    powerReadout.textContent = state.alienEncountered ? "76%" : state.damageLogged ? "79%" : "81%";
    stressReadout.textContent = `${String(state.stress).padStart(2, "0")}%`;
    updateThreatReadout();
    updateInventory();
    updateMapState();
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
      engineering: "ENGINEERING"
    };
    return names[room] || room.toUpperCase();
  }

  function positionToken() {
    if (gameScreen.hidden) return;
    const node = document.querySelector(`[data-room="${state.currentRoom}"]`);
    if (!node) return;

    const mapRect = shipMap.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const x = nodeRect.left + nodeRect.width / 2 - mapRect.left;
    const y = nodeRect.top + nodeRect.height / 2 - mapRect.top;
    lunaToken.style.left = `${x}px`;
    lunaToken.style.top = `${y}px`;
  }

  function getHideDescription() {
    const descriptions = {
      workbench:
        "Luna slides beneath the maintenance workbench and pulls the plasma gun tight against her chest. A wet shape crosses the threshold. Its weight bends the deck grating above her.",
      engine:
        "Luna folds herself behind the engine housing. Heat bites through her suit while something drags itself between the machinery, testing the air with slow, liquid clicks.",
      locker:
        "Luna seals herself inside the coolant locker. Darkness closes around her. Condensation taps the metal from inside as something stops directly outside."
    };
    return descriptions[state.hideChoice] || "Luna forces herself into cover as the organism enters Engineering.";
  }

  function getRoomDefinition(room) {
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
        text:
          "Luna stands beside the open cryosleep pod, fighting through the last fog of suspended sleep. The alarm repeats beyond the bulkhead. Every third pulse is followed by a faint vibration through the deck.\n\nThe ship map identifies an active fire in Life Support."
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
      let text =
        "The Control Room is dim but operational. Navigation still holds the return course to Earth. Across the central console, a fire warning competes with a quieter notification: the Pilot Archive recorded an internal access event while Luna was asleep.";

      if (state.damageLogged && !state.groundContacted) {
        text =
          "The sabotage report is waiting on the primary console. Ground Control's relay beacon has acquired the vessel, though the signal stutters each time it passes through the ship's internal network.\n\nLuna needs to report what happened in Life Support.";
      } else if (state.groundContacted) {
        text =
          "Ground Control remains on a narrow encrypted carrier. Their orders are unambiguous: inspect every facility, document anything compromised, and assume no system can be trusted.\n\nThe southern access route is now open on the ship map.";
      }

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
          text:
            "Heat breaks across Luna's suit as the access door opens. Fire has taken hold around the oxygen supply assembly, feeding on scorched insulation and leaking coolant vapour.\n\nThe automatic suppression system is offline. Luna can trigger the portable suppressant from her suit, but she will have to remain close to the flames."
        };
      }

      let text =
        "The suppressant smothers the last flames. When the smoke thins, Luna sees the oxygen control housing hanging open. Its shield plate was removed before the fire began. Several cables have been pulled loose, stripped and reconnected by hand.\n\nThe heat did not cause this damage. Someone tampered with Life Support.";

      if (state.damageLogged) {
        text +=
          "\n\nThe ship has attached an authorised credential to the access event: LUNA H. Luna was in cryosleep when the panel was opened.";
      }

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
          text:
            "The sample clings to the inside of the jar instead of settling at the bottom. When Luna turns her wrist, the residue stretches toward the warmth of her hand.\n\nThe ship's laboratory cannot identify its composition."
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
          text:
            "A glossy black residue has spread across the workstation in branching, thread-like patterns. It is too thick to be coolant and too warm to be machine oil.\n\n\"What the fuck...?\" Luna whispers. The nearest strand contracts at the sound of her voice."
        };
      }

      return {
        code: "LAB-07",
        title: "LABORATORY",
        status: "UNSCANNED",
        statusClass: "",
        image: "assets/IMG07.png",
        alt: "A large cold-white laboratory aboard the spaceship.",
        caption: "RESEARCH LABORATORY // FACILITY CHECK REQUIRED",
        mediaClass: "",
        text:
          "The Laboratory is lit and apparently undamaged. Robotic arms rest above the central workstation. Every specimen cabinet is sealed, but one work surface carries a dark reflection that does not belong there."
      };
    }

    if (room === "kitchen") {
      if (state.alienEncountered) {
        return {
          code: "K-07",
          title: "KITCHEN / MESS",
          status: "BIOLOGICAL CONTACT",
          statusClass: "is-alien",
          image: "assets/IMG12.png",
          alt: "A black alien organism hangs from the ceiling of the ship's mess hall.",
          caption: "BIOLOGICAL SIGNATURE // UNKNOWN",
          mediaClass: "is-alien",
          text:
            "The Kitchen is empty again. Only the black residue remains, stringing from the ceiling in long wet threads. The organism has moved deeper into the ship."
        };
      }

      return {
        code: "K-07",
        title: "KITCHEN / MESS",
        status: state.kitchenEntered ? "DOOR SEALED" : "UNSCANNED",
        statusClass: state.kitchenEntered ? "is-warning" : "",
        image: "assets/IMG10.png",
        alt: "Luna enters the dark kitchen and mess hall aboard the spacecraft.",
        caption: "MESS HALL // INTERNAL AUDIO ANOMALY",
        mediaClass: "",
        text: state.kitchenEntered
          ? "The room appears empty, but the silence feels engineered. Behind Luna, the access door closes with a soft mechanical click. Its status light turns red.\n\nAcross the room, something black shines on the otherwise clean kitchen counter."
          : "The Kitchen and Mess Hall sit in near darkness. A few appliances remain powered, their indicator lights reflected across the steel worktops. Something in the room is drawing power without identifying itself."
      };
    }

    if (room === "store") {
      return {
        code: "ST-07",
        title: "STORE ROOM",
        status: state.equipmentTaken ? "EQUIPMENT TAKEN" : "ACCESSIBLE",
        statusClass: state.equipmentTaken ? "is-success" : "is-warning",
        image: "assets/IMG14.png",
        alt: "A compact spacecraft store room containing a plasma gun, flashlight and access key.",
        caption: "EMERGENCY STORE // AUTHORISED FIELD EQUIPMENT",
        mediaClass: "",
        text: state.equipmentTaken
          ? "The emergency case is empty. Luna now carries the plasma gun, flashlight and Engineering access key. The creature is still moving somewhere nearby."
          : "The Store Room unlocks under emergency threat protocol. Inside an open field case lies a compact plasma gun. A flashlight rests on the worktable, and the Engineering access key glows beside it.\n\nLuna takes inventory while something scratches slowly along the outer wall."
      };
    }

    if (room === "engineering") {
      if (!state.engineeringUnlocked) {
        return {
          code: "EN-07",
          title: "ENGINEERING ROOM",
          status: "LOCKED",
          statusClass: "is-danger",
          image: "assets/IMG13.png",
          alt: "The heavy Engineering Room door displaying an access denied warning.",
          caption: "ENGINEERING ACCESS // CLEARANCE DENIED",
          mediaClass: "",
          text: state.engineeringKey
            ? "The Engineering Room remains sealed, but the access key from the Store Room matches its security module. Behind Luna, a liquid impact lands somewhere in the corridor."
            : "The Engineering door refuses Luna's pilot clearance. Its local security module has been physically isolated from the ship network.\n\nWhatever is hunting her is getting closer. She needs the manual access key from the Store Room."
        };
      }

      if (state.hidingCompleted) {
        return {
          code: "EN-07",
          title: "ENGINEERING ROOM",
          status: "HIDDEN",
          statusClass: "is-success",
          image: "assets/IMG15.png",
          alt: "The unlocked Engineering Room filled with machinery, workbenches and deep shadows.",
          caption: "ENGINEERING // CHECKPOINT 02",
          mediaClass: "",
          text:
            "The organism has withdrawn, but it has not left Engineering. Luna remains concealed among the machinery, plasma gun ready, listening to the ship count two biological signatures where there should be one."
        };
      }

      if (state.hidingInProgress) {
        return {
          code: "EN-07",
          title: "ENGINEERING ROOM",
          status: "HIDING",
          statusClass: "is-alien",
          image: "assets/IMG15.png",
          alt: "The unlocked Engineering Room filled with dark machinery and possible hiding places.",
          caption: "MOTION DETECTED // REMAIN SILENT",
          mediaClass: "is-alien",
          text:
            `${getHideDescription()}\n\nA voice speaks from the other side of the machinery in Luna's exact cadence:\n\n\"Luna... Ground Control requires confirmation.\"\n\nShe must not answer.`
        };
      }

      return {
        code: "EN-07",
        title: "ENGINEERING ROOM",
        status: "UNLOCKED",
        statusClass: "is-warning",
        image: "assets/IMG15.png",
        alt: "The unlocked Engineering Room filled with machinery, workbenches and deep shadows.",
        caption: "ENGINEERING // MULTIPLE CONCEALMENT POINTS",
        mediaClass: "",
        text:
          "The access key releases the heavy door. Engineering opens into a maze of machinery, pipes, workbenches and shadowed maintenance recesses.\n\nA wet impact lands in the corridor behind Luna. She has seconds to hide."
      };
    }

    return getRoomDefinition("crew");
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
    await preloadImage(definition.image);
    if (token !== mediaSwapToken) return;

    if (!immediate && !reducedMotion) {
      roomMedia.classList.add("is-swapping");
      await wait(330);
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
    button.addEventListener("lostpointercapture", () => {
      if (active) reset();
    });
    button.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !active) begin(event);
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.key === " ") reset();
    });
  }

  function getRoomActions(room) {
    if (room === "crew") {
      return [{ label: "ENTER HALLWAY", meta: "MOVE", onClick: () => moveToRoom("hallway") }];
    }

    if (room === "hallway") {
      return [
        { label: "ENTER CONTROL ROOM", meta: state.damageLogged && !state.groundContacted ? "REQUIRED" : "OPTIONAL", special: state.damageLogged && !state.groundContacted, onClick: () => moveToRoom("control") },
        { label: "PROCEED TO LIFE SUPPORT", meta: state.fireExtinguished ? "CLEAR" : "FIRE", danger: !state.fireExtinguished, onClick: () => moveToRoom("life") },
        { label: "RETURN TO CREW QUARTERS", meta: "MOVE", onClick: () => moveToRoom("crew") }
      ];
    }

    if (room === "control") {
      const actions = [];
      if (state.damageLogged && !state.groundContacted) {
        actions.push({ label: "CONTACT GROUND CONTROL", meta: "REQUIRED", special: true, onClick: contactGroundControl });
      }
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
      const actions = [
        { label: "ENTER LABORATORY", meta: state.sampleCollected ? "CLEARED" : "INSPECT", special: !state.sampleCollected, onClick: () => moveToRoom("lab") }
      ];
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
          { label: "REVIEW CHECKPOINT STATUS", meta: "CHECKPOINT 02", onClick: () => openDialog(chapterDialog) },
          { label: "STAY HIDDEN", meta: "WAIT", onClick: () => showToast("LUNA REMAINS CONCEALED // TWO LIFE SIGNS DETECTED") }
        ];
      }

      if (state.hidingInProgress) {
        return [
          { label: "HOLD TO REMAIN SILENT", meta: "HOLD 3 SEC", danger: true, hold: true, duration: 3000, onClick: completeHiding }
        ];
      }

      return [
        { label: "HIDE UNDER THE WORKBENCH", meta: "LOW COVER", onClick: () => chooseHide("workbench") },
        { label: "HIDE BEHIND ENGINE HOUSING", meta: "HEAT RISK", onClick: () => chooseHide("engine") },
        { label: "HIDE INSIDE COOLANT LOCKER", meta: "LOW O₂", onClick: () => chooseHide("locker") }
      ];
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

    if (!force && !routes[state.currentRoom]?.includes(targetRoom)) {
      rejectRoomTarget(targetRoom, "ROUTE UNAVAILABLE // MOVE THROUGH AN ADJACENT ROOM");
      return false;
    }

    state.currentRoom = targetRoom;
    if (targetRoom === "kitchen" && !state.kitchenEntered) {
      state.kitchenEntered = true;
      state.stress = Math.max(state.stress, 18);
    }
    saveState();
    updateInterface();
    positionToken();
    await showRoom(targetRoom);

    if (targetRoom === "life" && !state.fireExtinguished) showToast("WARNING // FIRE SUPPRESSION OFFLINE");
    if (targetRoom === "kitchen" && !state.alienEncountered) {
      window.setTimeout(() => showToast("AUDIO EVENT // DOOR LOCK ENGAGED"), 650);
    }
    if (targetRoom === "engineering" && !state.engineeringUnlocked) {
      showToast("ACCESS DENIED // MANUAL ENGINEERING KEY REQUIRED");
    }

    return true;
  }

  function rejectRoomTarget(room, reason) {
    const node = document.querySelector(`[data-room="${room}"]`);
    node?.classList.add("invalid-target");
    window.setTimeout(() => node?.classList.remove("invalid-target"), 420);
    showToast(reason);
    positionToken();
  }

  function openPilotLog() {
    state.logOpened = true;
    saveState();
    renderRoomActions("control");
    logFooterStatus.textContent = state.damageLogged ? "ARCHIVE READ // ACCESS EVENT MATCHES SABOTAGE WINDOW" : "ARCHIVE READ // ACCESS EVENT FLAGGED";
    openDialog(pilotLogDialog);
  }

  function contactGroundControl() {
    openDialog(groundControlDialog);
  }

  async function acknowledgeGroundControl() {
    state.groundContacted = true;
    state.stress = Math.max(state.stress, 14);
    saveState();
    closeDialog(groundControlDialog);
    updateInterface();
    await showRoom("control");
    window.setTimeout(positionToken, 600);
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
    window.setTimeout(positionToken, 900);
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
          text:
            "The worktop is almost spotless. In the centre lies another splash of black residue, still wet, its edges slowly drawing themselves into thin branching lines.\n\nBehind Luna, the room's ventilation system stops.",
          button: "CONTINUE"
        },
        {
          image: "assets/IMG12.png",
          alt: "A black alien organism hangs from the ceiling of the ship's mess hall.",
          code: "BIOLOGICAL SIGNATURE // UNKNOWN",
          title: "IT IS ABOVE HER",
          text:
            "A drop lands beside Luna's hand.\n\nShe looks up.\n\nA vast black shape has unfolded from the ceiling, suspended on strands of its own body. Its mouth opens without breathing. For one impossible second, it studies her face.",
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
        positionToken();
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
    if (choice === "workbench") state.stress = Math.max(state.stress, 63);
    if (choice === "engine") state.stress = Math.max(state.stress, 67);
    if (choice === "locker") state.stress = Math.max(state.stress, 61);
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
          alt: "The dark Engineering Room after the alien organism withdraws.",
          code: "ENGINEERING // INTERNAL AUDIO",
          title: "THE VOICE WITHDRAWS",
          text:
            "Luna remains silent.\n\nThe copied voice asks once more, softer this time. Then the organism drags itself away through the machinery. The ship hum gradually returns.\n\nA diagnostic display wakes beside her: CREW DETECTED — 02.",
          button: "SAVE CHECKPOINT"
        }
      ],
      () => {
        showToast("CHECKPOINT 02 SAVED // TWO BIOLOGICAL SIGNATURES DETECTED");
        openDialog(chapterDialog);
      }
    );
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

    sequenceMedia.classList.remove("is-blackout");
    sequenceMedia.classList.remove("is-swapping");
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
      if (node.offsetParent === null) continue;
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centerX, clientY - centerY);
      if (distance < nearestDistance) {
        nearest = node.dataset.room;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= 155 ? nearest : null;
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
    const x = Math.max(34, Math.min(event.clientX - rect.left, rect.width - 34));
    const y = Math.max(34, Math.min(event.clientY - rect.top, rect.height - 34));
    lunaToken.style.left = `${x}px`;
    lunaToken.style.top = `${y}px`;
  }

  async function endTokenDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const target = nearestRoomToPointer(event.clientX, event.clientY);
    lunaToken.classList.remove("is-dragging");
    dragState = null;
    if (target) await moveToRoom(target);
    else positionToken();
  }

  function restartGame() {
    const confirmed = window.confirm("Restart The Void from the opening cinematic? Both saved checkpoints will be cleared.");
    if (!confirmed) return;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    window.location.reload();
  }

  continueButton.addEventListener("click", advanceIntro);
  acknowledgeGroundButton.addEventListener("click", acknowledgeGroundControl);
  sequenceButton.addEventListener("click", advanceSequence);
  closeChapterButton.addEventListener("click", () => closeDialog(chapterDialog));
  restartButton.addEventListener("click", restartGame);

  document.addEventListener("keydown", (event) => {
    if (state.phase !== "intro" || cinematicShell.hidden) return;
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

  window.addEventListener("resize", positionToken);
  shipMap.addEventListener("transitionend", positionToken);

  async function initialise() {
    for (let index = 3; index <= 15; index += 1) {
      preloadImage(`assets/IMG${String(index).padStart(2, "0")}.png`);
    }

    if (state.phase === "game") {
      cinematicShell.hidden = true;
      gameScreen.hidden = false;
      updateInterface();
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
