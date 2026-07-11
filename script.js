(() => {
  "use strict";

  const scenes = [
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
      imageCode: "FIRE ALARM // ENGINEERING",
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

  const sceneImage = document.getElementById("sceneImage");
  const imagePanel = document.getElementById("imagePanel");
  const imageCode = document.getElementById("imageCode");
  const missionTime = document.getElementById("missionTime");
  const sceneCounter = document.getElementById("sceneCounter");
  const logLabel = document.getElementById("logLabel");
  const narrative = document.getElementById("narrative");
  const cursor = document.getElementById("typeCursor");
  const continueButton = document.getElementById("continueButton");
  const keyboardHint = document.getElementById("keyboardHint");
  const cinematicFrame = document.getElementById("cinematicFrame");
  const finalBlackout = document.getElementById("finalBlackout");

  let sceneIndex = 0;
  let typing = false;
  let typingToken = 0;
  let fullText = "";
  let transitionLocked = false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function pauseForCharacter(character) {
    if (reducedMotion) return 0;

    if (character === ".") return 310;
    if (character === ",") return 115;
    if (character === ":") return 150;
    if (character === "\n") return 220;
    return 24 + Math.random() * 18;
  }

  function setContinueReady(isReady) {
    continueButton.disabled = !isReady;
    continueButton.setAttribute("aria-disabled", String(!isReady));
    keyboardHint.classList.toggle("is-ready", isReady);
    keyboardHint.textContent = isReady
      ? "ENTER TO CONTINUE"
      : "ENTER TO COMPLETE TRANSMISSION";
  }

  function completeTyping() {
    if (!typing) return;

    typingToken += 1;
    narrative.textContent = fullText;
    typing = false;
    cursor.classList.add("is-hidden");
    setContinueReady(true);
  }

  async function typeNarrative(text) {
    typingToken += 1;
    const token = typingToken;

    fullText = text;
    narrative.textContent = "";
    typing = true;
    cursor.classList.remove("is-hidden");
    setContinueReady(false);

    if (reducedMotion) {
      completeTyping();
      return;
    }

    for (const character of text) {
      if (token !== typingToken) return;

      narrative.textContent += character;
      await wait(pauseForCharacter(character));
    }

    if (token !== typingToken) return;

    typing = false;
    cursor.classList.add("is-hidden");
    setContinueReady(true);
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

  async function showScene(index, { initial = false } = {}) {
    const scene = scenes[index];

    await preloadImage(scene.image);

    if (!initial) {
      cinematicFrame.classList.add("is-transitioning");
      await wait(reducedMotion ? 10 : 500);
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
    cursor.classList.remove("is-hidden");
    setContinueReady(false);

    await wait(reducedMotion ? 10 : 90);

    cinematicFrame.classList.remove("is-transitioning");
    sceneImage.classList.add("is-visible");

    typeNarrative(scene.text);
  }

  async function advanceScene() {
    if (transitionLocked) return;

    if (typing) {
      completeTyping();
      return;
    }

    transitionLocked = true;

    if (sceneIndex < scenes.length - 1) {
      sceneIndex += 1;
      await showScene(sceneIndex);
      transitionLocked = false;
      return;
    }

    continueButton.disabled = true;
    finalBlackout.classList.add("is-active");
    document.body.setAttribute("data-scene-complete", "true");

    await wait(reducedMotion ? 20 : 1250);

    // Integration hook for the next chapter of the game.
    // Future game code can listen for this event:
    // window.addEventListener("voidSceneComplete", () => { ... });
    window.dispatchEvent(
      new CustomEvent("voidSceneComplete", {
        detail: { scene: "prologue" }
      })
    );
  }

  continueButton.addEventListener("click", advanceScene);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    advanceScene();
  });

  sceneImage.addEventListener("load", () => {
    requestAnimationFrame(() => sceneImage.classList.add("is-visible"));
  });

  showScene(0, { initial: true });
})();
