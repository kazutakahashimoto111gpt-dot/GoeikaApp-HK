const image =
  document.getElementById(
    "noteImage"
  );


const flashMarker =
  document.getElementById(
    "flashMarker"
  );


const keyPressMarker =
  document.getElementById(
    "keyPressMarker"
  );


const keyDown =
  document.getElementById(
    "keyDown"
  );


const keyUp =
  document.getElementById(
    "keyUp"
  );


const keyDisplay =
  document.getElementById(
    "keyDisplay"
  );



// iPhone Safariの実表示高をレイアウトへ反映する。

function updateAppHeight() {

  const viewport =
    window.visualViewport;


  // ピンチ操作中は固定し、回転やSafariの表示領域変化だけを反映する。
  if (
    viewport &&
    viewport.scale !== 1
  ) {

    return;

  }


  const height =
    viewport
      ? viewport.height
      : window.innerHeight;


  document.documentElement.style.setProperty(
    "--app-height",
    `${Math.round(height)}px`
  );

}



function updateAppHeightAfterRotation() {

  updateAppHeight();


  // iPhoneは回転直後にも高さが変わるため、次の描画後に再計測する。
  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        updateAppHeight
      );

    }
  );

}



updateAppHeightAfterRotation();



window.addEventListener(
  "resize",
  updateAppHeightAfterRotation
);



window.addEventListener(
  "orientationchange",
  updateAppHeightAfterRotation
);



if (
  window.visualViewport
) {

  window.visualViewport.addEventListener(
    "resize",
    updateAppHeightAfterRotation
  );

}

// iOS PWAの横画面で負のスクロール位置が残る場合だけ上端へ戻す。
let negativeScrollResetAttempts = 0;
let negativeScrollCheckTimer = null;

function resetNegativePageScroll() {
  if (
    !window.matchMedia("(display-mode: standalone)").matches ||
    window.innerWidth <= window.innerHeight ||
    (window.visualViewport && window.visualViewport.scale !== 1)
  ) {
    return;
  }

  if (window.scrollY >= 0) {
    negativeScrollResetAttempts = 0;
    return;
  }

  if (negativeScrollResetAttempts >= 3) return;

  negativeScrollResetAttempts++;
  window.scrollTo(0, 0);
}

function checkNegativePageScrollAfterDisplayChange() {
  negativeScrollResetAttempts = 0;
  requestAnimationFrame(resetNegativePageScroll);
  window.setTimeout(resetNegativePageScroll, 200);
  window.setTimeout(resetNegativePageScroll, 700);
}

function checkNegativePageScrollAfterScroll() {
  if (negativeScrollCheckTimer !== null) {
    window.clearTimeout(negativeScrollCheckTimer);
  }

  negativeScrollCheckTimer = window.setTimeout(() => {
    negativeScrollCheckTimer = null;
    resetNegativePageScroll();
  }, 80);
}

checkNegativePageScrollAfterDisplayChange();
window.addEventListener("pageshow", checkNegativePageScrollAfterDisplayChange);
window.addEventListener("resize", checkNegativePageScrollAfterDisplayChange);
window.addEventListener("orientationchange", checkNegativePageScrollAfterDisplayChange);
window.addEventListener("scroll", checkNegativePageScrollAfterScroll, { passive: true });
window.visualViewport?.addEventListener(
  "scroll",
  checkNegativePageScrollAfterScroll,
  { passive: true }
);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkNegativePageScrollAfterDisplayChange();
});



// キー設定

const KEY_SHIFT_STORAGE_KEY =
  "goeikaapp-hk:keyShift";

function loadKeyShift() {

  try {

    let storedValue =
      localStorage.getItem(
        KEY_SHIFT_STORAGE_KEY
      );

    if (storedValue === null) {
      storedValue = localStorage.getItem(
        "kongoKeyShift"
      );

      if (storedValue !== null) {
        try {
          localStorage.setItem(
            KEY_SHIFT_STORAGE_KEY,
            storedValue
          );
        }
        catch (error) {
          console.warn(
            "キー設定を移行できませんでした。",
            error
          );
        }
      }
    }


    if (
      storedValue === null
    ) {

      return 0;

    }


    const parsedValue =
      Number(storedValue);


    return Number.isInteger(parsedValue)
      ? parsedValue
      : 0;

  }

  catch (error) {

    console.warn(
      "キー設定を読み込めませんでした。",
      error
    );


    return 0;

  }

}


let keyShift =
  loadKeyShift();



keyShift =
  Math.max(
    -12,
    Math.min(
      12,
      keyShift
    )
  );



let keyMultiplier =
  Math.pow(
    2,
    keyShift / 12
  );



function updateKeyMultiplier() {

  keyMultiplier =
    Math.pow(
      2,
      keyShift / 12
    );

}



function updateKeyDisplay() {

  if (
    keyShift > 0
  ) {

    keyDisplay.textContent =
      "+" + keyShift;

  }

  else if (
    keyShift < 0
  ) {

    keyDisplay.textContent =
      keyShift;

  }

  else {

    keyDisplay.textContent =
      "±0";

  }

}



function saveKeyShift() {

  try {

    localStorage.setItem(
      KEY_SHIFT_STORAGE_KEY,
      keyShift
    );

  }

  catch (error) {

    console.warn(
      "キー設定を保存できませんでした。",
      error
    );

  }

}



keyDown.addEventListener(
  "click",

  function(event) {

    event.stopPropagation();


    if (
      keyShift <= -12
    ) {

      return;

    }


    keyShift--;


    updateKeyMultiplier();


    updateKeyDisplay();

    saveKeyShift();

  }
);



keyUp.addEventListener(
  "click",

  function(event) {

    event.stopPropagation();


    if (
      keyShift >= 12
    ) {

      return;

    }


    keyShift++;

    updateKeyMultiplier();


    updateKeyDisplay();

    saveKeyShift();

  }
);



keyDisplay.addEventListener(
  "click",

  function(event) {

    event.stopPropagation();


    keyShift = 0;

    updateKeyMultiplier();


    updateKeyDisplay();

    saveKeyShift();

  }
);



updateKeyDisplay();



// 対応環境ではiPhoneのマナーモード中も再生用音声として扱う。
if (
  "audioSession" in navigator
) {

  navigator.audioSession.type =
    "playback";

}



// Safariの旧実装にも対応する。
const AudioContextClass =

  window.AudioContext ||
  window.webkitAudioContext;

// iOSでの開始失敗を避けるため、最初のユーザー操作まで生成しない。
let audioContext =
  null;


async function ensureAudioContext() {
  if (
    !audioContext
  ) {

    audioContext =
      new AudioContextClass();

  }

  if (
    audioContext.state ===
      "closed"
  ) {

    // close済みのAudioContextは再開できないため作り直す。
    audioContext =
      new AudioContextClass();

  }

  if (
    audioContext.state ===
      "suspended" ||
    audioContext.state ===
      "interrupted"
  ) {

    await audioContext.resume();

  }

  // resume成功後もrunningでない環境があるため、発音前に状態を検証する。
  if (
    audioContext.state !==
      "running"
  ) {

    throw new Error(
      "AudioContextがrunningになっていません。state=" +
      audioContext.state
    );

  }
}



// 音声開始用オーバーレイ

const audioStartOverlay =
  document.getElementById(
    "audioStartOverlay"
  );


const audioStartMessage =
  document.getElementById(
    "audioStartMessage"
  );



audioStartOverlay.addEventListener(
  "pointerdown",

  function(event) {

    event.preventDefault();
    event.stopPropagation();

    if (
      audioContext &&
      audioContext.state ===
        "running"
    ) {

      audioStartOverlay.style.display =
        "none";


      return;

    }

    audioStartMessage.textContent =
      "起動中...";

    ensureAudioContext()

      .then(
        function() {

          if (
            audioContext.state ===
              "running"
          ) {


            audioStartOverlay.style.display =
              "none";

          }

        }
      )


      .catch(
        function(error) {


          console.warn(
            "AudioContextを開始できませんでした。",
            error
          );

        }
      );

    // iOSで開始が遅延・拒否された場合は再操作を案内する。
    setTimeout(
      function() {

        if (
          !audioContext ||
          audioContext.state !==
            "running"
        ) {

          audioStartMessage.textContent =
            "もう一度タップしてください";

        }

      },

      500
    );

  }
);

document.addEventListener(
  "visibilitychange",

  function() {

    if (
      document.visibilityState ===
        "hidden"
    ) {
      // バックグラウンド移行時に音と操作状態を残さない。
      stopSound();


      hideKeyPress();
      const oldAudioContext =
        audioContext;

      // 非同期のclose完了前に古いコンテキストを再利用しないよう切り離す。
      audioContext =
        null;

      if (
        oldAudioContext &&
        oldAudioContext.state !==
          "closed"
      ) {

        oldAudioContext.close()
          .catch(
            function(error) {

              console.warn(
                "AudioContextを終了できませんでした。",
                error
              );

            }
          );

      }

      isPointerPlaying =
        false;


      activePointerId =
        null;


      lastPlayedNote =
        null;

    }



  }
);



// 琴風サウンド

let activeSound =
  null;



function stopSound() {


  if (
    !activeSound
  ) {

    return;

  }


  const soundToStop =
    activeSound;


  activeSound =
    null;


  soundToStop.stop();

}



function playSound(
  frequency
) {


  stopSound();


  const now =
    audioContext.currentTime;

  const masterGain =
    audioContext.createGain();


  masterGain.connect(
    audioContext.destination
  );


  masterGain.gain.setValueAtTime(
    0.0001,
    now
  );


  // 20msかけて立ち上げ、持続音の耳障りなアタックを抑える。
  masterGain.gain
    .exponentialRampToValueAtTime(
      0.38,
      now + 0.02
    );
  const osc1 =
    audioContext.createOscillator();


  const gain1 =
    audioContext.createGain();


  osc1.type =
    "sine";


  osc1.frequency.value =
    frequency;


  gain1.gain.value =
    1.0;


  osc1.connect(
    gain1
  );


  gain1.connect(
    masterGain
  );

  const osc2 =
    audioContext.createOscillator();


  const gain2 =
    audioContext.createGain();


  osc2.type =
    "sine";


  osc2.frequency.value =
    frequency * 2;


  gain2.gain.value =
    0.35;


  osc2.connect(
    gain2
  );


  gain2.connect(
    masterGain
  );

  const osc3 =
    audioContext.createOscillator();


  const gain3 =
    audioContext.createGain();


  osc3.type =
    "sine";


  osc3.frequency.value =
    frequency * 3;


  gain3.gain.value =
    0.15;


  osc3.connect(
    gain3
  );


  gain3.connect(
    masterGain
  );

  const clickOsc =
    audioContext.createOscillator();


  const clickGain =
    audioContext.createGain();


  clickOsc.type =
    "triangle";


  // 4倍音の短い成分で弦を弾いたアタックを作る。
  clickOsc.frequency.value =
    frequency * 4;


  clickGain.gain.setValueAtTime(
    0.18,
    now
  );


  clickGain.gain
    .exponentialRampToValueAtTime(
      0.0001,
      now + 0.08
    );


  clickOsc.connect(
    clickGain
  );


  clickGain.connect(
    masterGain
  );

  osc1.start(
    now
  );


  osc2.start(
    now
  );


  osc3.start(
    now
  );


  clickOsc.start(
    now
  );

  let hasStopped =
    false;


  activeSound = {

    stop() {


      if (
        hasStopped
      ) {

        return;

      }


      hasStopped =
        true;


      const releaseTime =
        audioContext.currentTime;


      // 約60msで減衰させ、クリックノイズを防ぎつつ余韻を残す。
      masterGain.gain.cancelScheduledValues(
        releaseTime
      );


      masterGain.gain.setTargetAtTime(
        0.0001,
        releaseTime,
        0.02
      );


      osc1.stop(
        releaseTime + 0.12
      );


      osc2.stop(
        releaseTime + 0.12
      );


      osc3.stop(
        releaseTime + 0.12
      );

    }

  };


  // アタック成分だけを短く止め、基音と倍音は押下中に持続させる。
  clickOsc.stop(
    now + 0.1
  );

}



function flash(
  x,
  y
) {

  flashMarker.style.left =
    x + "px";


  flashMarker.style.top =
    y + "px";

  const animations =
    flashMarker.getAnimations();


  for (
    const animation
    of animations
  ) {

    animation.cancel();

  }

  flashMarker.animate(

    [
      {

        opacity: 1,

        transform:
          "translate(-50%, -50%) scale(0.35)"

      },
      {

        opacity: 0.9,

        transform:
          "translate(-50%, -50%) scale(1)",

        offset: 0.4

      },
      {

        opacity: 0,

        transform:
          "translate(-50%, -50%) scale(1.5)"

      }

    ],


    {

      duration: 350,
      easing:
        "ease-out"

    }

  );

}



// スライド演奏の状態
let isPointerPlaying =
  false;


// マルチタッチ時も最初のpointerだけを演奏用として追跡する。
let activePointerId =
  null;


// pointermoveで同じ音を連打しないため直前の音符を保持する。
let lastPlayedNote =
  null;


// 画面サイズ変更時に押下表示を再計算できるよう保持する。
let pressedNote =
  null;

const {
  blackKeyAreas,
  nonPlayableBlackKeyAreas,
  whiteKeyAreas,
  blackKeyBottomRatio,
  keyboardTopRatio,
  keyboardBottomRatio
} = keyboardLayout;


const pressMaskBlackKeyAreas = [
  ...blackKeyAreas,
  ...nonPlayableBlackKeyAreas
];


function validateKeyboardImageDimensions() {

  if (
    image.naturalWidth !== keyboardLayout.imageWidth ||
    image.naturalHeight !== keyboardLayout.imageHeight
  ) {

    console.error(
      "鍵盤画像の寸法が鍵判定データと一致しません。",
      {
        expected: `${keyboardLayout.imageWidth}x${keyboardLayout.imageHeight}`,
        actual: `${image.naturalWidth}x${image.naturalHeight}`
      }
    );

  }

}


if (
  image.complete
) {

  validateKeyboardImageDimensions();

}

else {

  image.addEventListener(
    "load",
    validateKeyboardImageDimensions,
    { once: true }
  );

}


function findNoteAtKey(
  pointerX,
  pointerY
) {

  // 重なっている黒鍵を白鍵より先に判定する。
  if (
    pointerY >= keyboardTopRatio &&
    pointerY <= blackKeyBottomRatio
  ) {

    for (
      const note
      of notes
    ) {

      if (
        note.keyType !== "black"
      ) {

        continue;

      }


      const area =
        blackKeyAreas[
          note.keyIndex
        ];


      if (
        pointerX >= area.left &&
        pointerX <= area.right
      ) {

        return note;

      }

    }

  }

  if (
    pointerY < keyboardTopRatio ||
    pointerY > keyboardBottomRatio
  ) {

    return null;

  }


  for (
    const note
    of notes
  ) {

    if (
      note.keyType !== "white"
    ) {

      continue;

    }


    const area =
      whiteKeyAreas[
        note.keyIndex
      ];


    if (
      pointerX >= area.left &&
      pointerX <= area.right
    ) {

      return note;

    }

  }


  return null;

}


function showKeyPress(
  note
) {


  const keyArea =
    note.keyType === "black"
      ? blackKeyAreas[note.keyIndex]
      : whiteKeyAreas[note.keyIndex];


  if (
    !keyArea ||
    !image.clientWidth ||
    !image.clientHeight
  ) {

    return;

  }


  const topRatio =
    keyboardTopRatio;


  const bottomRatio =
    note.keyType === "black"
      ? blackKeyBottomRatio
      : keyboardBottomRatio;


  keyPressMarker.style.left =
    `${keyArea.left * image.clientWidth}px`;


  keyPressMarker.style.top =
    `${topRatio * image.clientHeight}px`;


  keyPressMarker.style.width =
    `${(keyArea.right - keyArea.left) * image.clientWidth}px`;


  keyPressMarker.style.height =
    `${(bottomRatio - topRatio) * image.clientHeight}px`;



  if (
    note.keyType === "white"
  ) {

    // 黒鍵との重なりを切り欠き、白鍵だけを強調する。
    let leftCut =
      0;


    let rightCut =
      100;


    const keyWidth =
      keyArea.right -
      keyArea.left;


    for (
      const blackKeyArea
      of pressMaskBlackKeyAreas
    ) {

      const overlapLeft =
        Math.max(
          keyArea.left,
          blackKeyArea.left
        );


      const overlapRight =
        Math.min(
          keyArea.right,
          blackKeyArea.right
        );


      if (
        overlapLeft >=
        overlapRight
      ) {

        continue;

      }


      const localLeft =
        (overlapLeft - keyArea.left) /
        keyWidth * 100;


      const localRight =
        (overlapRight - keyArea.left) /
        keyWidth * 100;


      if (
        localLeft <= 0.01
      ) {

        leftCut =
          Math.max(
            leftCut,
            localRight
          );

      }


      if (
        localRight >= 99.99
      ) {

        rightCut =
          Math.min(
            rightCut,
            localLeft
          );

      }

    }


    const blackKeyBottom =
      (blackKeyBottomRatio - topRatio) /
      (bottomRatio - topRatio) * 100;


    const clipPath =
      `polygon(${leftCut}% 0%, ${rightCut}% 0%, ` +
      `${rightCut}% ${blackKeyBottom}%, 100% ${blackKeyBottom}%, ` +
      `100% 100%, 0% 100%, 0% ${blackKeyBottom}%, ` +
      `${leftCut}% ${blackKeyBottom}%)`;


    keyPressMarker.style.clipPath =
      clipPath;


    keyPressMarker.style.webkitClipPath =
      clipPath;

  }

  else {

    keyPressMarker.style.clipPath =
      "none";


    keyPressMarker.style.webkitClipPath =
      "none";

  }


  keyPressMarker.className =
    note.keyType === "black"
      ? "is-visible is-black"
      : "is-visible is-white";


  pressedNote =
    note;

}



function hideKeyPress() {


  keyPressMarker.className =
    "";


  pressedNote =
    null;

}



function refreshKeyPress() {


  if (
    pressedNote
  ) {

    showKeyPress(
      pressedNote
    );

  }

}



window.addEventListener(
  "resize",

  function() {

    requestAnimationFrame(
      refreshKeyPress
    );

  }
);



function playNoteAtPointer(
  event
) {


  // CSS回転の影響を避けるため、画面座標ではなく画像内座標を使う。
  const displayX =
    event.offsetX;


  const displayY =
    event.offsetY;



  const pointerX =
    displayX /
    image.clientWidth;


  const pointerY =
    displayY /
    image.clientHeight;



  const selectedNote =
    findNoteAtKey(
      pointerX,
      pointerY
    );


  if (
    !selectedNote
  ) {

    stopSound();

    hideKeyPress();

    lastPlayedNote =
      null;


    return;

  }



  if (
    selectedNote ===
    lastPlayedNote
  ) {


    return;

  }



  lastPlayedNote =
    selectedNote;



  const shiftedFrequency =

    selectedNote.frequency *
    keyMultiplier;



  playSound(
    shiftedFrequency
  );


  showKeyPress(
    selectedNote
  );



  flash(
    displayX,
    displayY
  );

}



image.addEventListener(
  "pointerdown",

  async function(event) {


    // iOS Safariの長押しメニューを止め、演奏操作として扱う。
    event.preventDefault();


    if (
      activePointerId !== null &&
      event.pointerId !== activePointerId
    ) {

      return;

    }


    activePointerId =
      event.pointerId;


    lastPlayedNote =
      null;


    try {

      await ensureAudioContext();

    }

    catch (error) {

      if (
        event.pointerId === activePointerId
      ) {

        isPointerPlaying =
          false;


        activePointerId =
          null;

      }

      console.warn(
        "AudioContextの準備に失敗しました。",
        error
      );


      audioStartMessage.textContent =
        "もう一度タップしてください";


      audioStartOverlay.style.display =
        "flex";


      return;

    }


    // 音声準備中に離されたpointerでは演奏を開始しない。
    if (
      event.pointerId !== activePointerId
    ) {

      return;

    }


    isPointerPlaying =
      true;



    // 画像外へ滑らせても終了イベントを受け取れるようCaptureする。
    try {

      image.setPointerCapture(
        event.pointerId
      );

    }

    catch (error) {


      // 非対応環境でも通常のタップ演奏は継続する。
      console.warn(
        "Pointer Captureを開始できませんでした。",
        error
      );

    }



    playNoteAtPointer(
      event
    );

  }

);



// 長押し・右クリックの画像メニューを鍵盤上では表示しない。
image.addEventListener(
  "contextmenu",

  function(event) {

    event.preventDefault();

  }
);



// iOSの長押しルーペはTouch Eventから起動するため、非パッシブで抑止する。
image.addEventListener(
  "touchstart",

  function(event) {

    event.preventDefault();

  },

  {
    passive: false
  }
);



// Safariが次の長押しをダブルタップと誤認しないようtouchendも抑止する。
image.addEventListener(
  "touchend",

  function(event) {

    event.preventDefault();

  },

  {
    passive: false
  }
);



// Safari固有の拡大ジェスチャーを鍵盤上では抑止する。
for (
  const eventName
  of [
    "gesturestart",
    "gesturechange",
    "gestureend",
    "dblclick"
  ]
) {

  image.addEventListener(
    eventName,

    function(event) {

      event.preventDefault();

    }
  );

}



image.addEventListener(
  "selectstart",

  function(event) {

    event.preventDefault();

  }
);



image.addEventListener(
  "pointermove",

  function(event) {


    if (
      !isPointerPlaying
    ) {

      return;

    }



    if (
      event.pointerId !==
      activePointerId
    ) {

      return;

    }



    playNoteAtPointer(
      event
    );

  }

);



function resetPointerPlaying() {
  stopSound();


  hideKeyPress();


  isPointerPlaying =
    false;


  activePointerId =
    null;


  lastPlayedNote =
    null;

}


function finishPointerPlaying(
  event
) {


  if (
    event.pointerId !==
    activePointerId
  ) {

    return;

  }



  resetPointerPlaying();

}



image.addEventListener(
  "pointerup",

  finishPointerPlaying
);



image.addEventListener(
  "pointercancel",

  finishPointerPlaying
);


// Capture非対応時も画像外でのpointer終了を検出し、持続音を残さない。
window.addEventListener(
  "pointerup",
  finishPointerPlaying
);


window.addEventListener(
  "pointercancel",
  finishPointerPlaying
);


// ブラウザ外で離された場合に備え、失焦時も演奏状態を解除する。
window.addEventListener(
  "blur",
  resetPointerPlaying
);



image.addEventListener(
  "lostpointercapture",

  function(event) {


    if (
      event.pointerId ===
      activePointerId
    ) {

      resetPointerPlaying();

    }

  }

);

// アプリ情報ダイアログ
const infoButton =
  document.getElementById(
    "infoButton"
  );


const infoOverlay =
  document.getElementById(
    "infoOverlay"
  );


const infoDialog =
  document.getElementById(
    "infoDialog"
  );


const infoCloseButton =
  document.getElementById(
    "infoCloseButton"
  );

const cacheNameValue =
  document.getElementById(
    "cacheNameValue"
  );

const viewportDebugValues =
  document.getElementById(
    "viewportDebugValues"
  );

// Safariのviewport差異を確認するため、各CSS単位の実寸を個別に測る。
const viewportUnitProbes = {};
for (const unit of ["vh", "dvh", "svh", "lvh"]) {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = `position:fixed;left:-10000px;top:0;width:1px;height:100${unit};visibility:hidden;pointer-events:none;contain:strict;`;
  document.body.appendChild(probe);
  viewportUnitProbes[unit] = probe;
}

function updateViewportDebug() {
  if (!isInfoDialogOpen()) return;

  const vv = window.visualViewport;
  const css = getComputedStyle(document.documentElement);
  const number = value => value == null ? "—" : String(value);
  const lines = [
    "Viewport Debug",
    "----------------",
    `window.innerWidth: ${window.innerWidth}`,
    `window.innerHeight: ${window.innerHeight}`,
    `window.outerWidth: ${window.outerWidth}`,
    `window.outerHeight: ${window.outerHeight}`,
    `window.scrollY: ${window.scrollY}`,
    `documentElement.clientWidth: ${document.documentElement.clientWidth}`,
    `documentElement.clientHeight: ${document.documentElement.clientHeight}`,
    `documentElement.scrollTop: ${document.documentElement.scrollTop}`,
    `documentElement.rect.top: ${document.documentElement.getBoundingClientRect().top}`,
    `body.rect.top: ${document.body.getBoundingClientRect().top}`,
    `visualViewport.width: ${number(vv?.width)}`,
    `visualViewport.height: ${number(vv?.height)}`,
    `visualViewport.offsetTop: ${number(vv?.offsetTop)}`,
    `visualViewport.pageTop: ${number(vv?.pageTop)}`,
    `visualViewport.offsetLeft: ${number(vv?.offsetLeft)}`,
    `visualViewport.scale: ${number(vv?.scale)}`,
    ...["vh", "dvh", "svh", "lvh"].map(unit =>
      `100${unit}: ${getComputedStyle(viewportUnitProbes[unit]).height}`
    ),
    `--app-height: ${css.getPropertyValue("--app-height").trim() || "(未設定)"}`,
    `display-mode standalone: ${window.matchMedia("(display-mode: standalone)").matches}`,
    `navigator.standalone: ${number(navigator.standalone)}`,
    `orientation: ${number(screen.orientation?.type)}`,
    `screen: ${screen.width} x ${screen.height}`,
    `devicePixelRatio: ${window.devicePixelRatio}`
  ];
  viewportDebugValues.textContent = lines.join("\n");
}

window.addEventListener("resize", updateViewportDebug);
window.addEventListener("orientationchange", updateViewportDebug);
window.addEventListener("scroll", updateViewportDebug);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateViewportDebug);
  window.visualViewport.addEventListener("scroll", updateViewportDebug);
}


let infoPreviouslyFocusedElement =
  null;


function isInfoDialogOpen() {

  return infoOverlay.getAttribute(
    "aria-hidden"
  ) === "false";

}

let cacheNameRequestId = 0;

function updateCacheName() {
  const requestId = ++cacheNameRequestId;
  cacheNameValue.textContent = "確認中...";

  if (!("serviceWorker" in navigator)) {
    cacheNameValue.textContent = "利用できません";
    return;
  }

  let channel = null;
  let finished = false;
  const timeoutId = window.setTimeout(
    () => finish("取得できません"),
    10000
  );

  function finish(value) {
    if (finished) return;
    finished = true;
    window.clearTimeout(timeoutId);
    channel?.port1.close();
    if (requestId === cacheNameRequestId) {
      cacheNameValue.textContent = value;
    }
  }

  navigator.serviceWorker.ready
    .then(registration => {
      if (finished) return;

      const worker =
        navigator.serviceWorker.controller ||
        registration.active;

      if (!worker) {
        finish("取得できません");
        return;
      }

      channel = new MessageChannel();
      channel.port1.onmessage = event => {
        finish(
          typeof event.data?.cacheName === "string"
            ? event.data.cacheName
            : "取得できません"
        );
      };

      worker.postMessage(
        { type: "GET_CACHE_NAME" },
        [channel.port2]
      );
    })
    .catch(() => {
      finish("取得できません");
    });
}



function openInfoDialog() {

  infoPreviouslyFocusedElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;


  document.body.classList.add(
    "is-info-open"
  );


  infoOverlay.style.display =
    "flex";


  infoOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  updateViewportDebug();
  updateCacheName();


  // キーボード操作をダイアログ内から開始させる。
  infoCloseButton.focus();

}



function closeInfoDialog() {

  if (
    !isInfoDialogOpen()
  ) {

    return;

  }


  infoOverlay.style.display =
    "none";


  infoOverlay.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "is-info-open"
  );


  const focusTarget =
    infoPreviouslyFocusedElement &&
    infoPreviouslyFocusedElement.isConnected
      ? infoPreviouslyFocusedElement
      : infoButton;


  infoPreviouslyFocusedElement =
    null;


  focusTarget.focus();

}



infoButton.addEventListener(
  "click",

  function(event) {

    event.stopPropagation();


    openInfoDialog();

  }
);



infoCloseButton.addEventListener(
  "click",

  function(event) {

    event.stopPropagation();


    closeInfoDialog();

  }
);



infoOverlay.addEventListener(
  "pointerdown",

  function(event) {

    if (
      event.target ===
      infoOverlay
    ) {

      closeInfoDialog();

    }

  }
);



infoDialog.addEventListener(
  "pointerdown",

  function(event) {

    event.stopPropagation();

  }
);



// Escapeで閉じ、Tabフォーカスをモーダル内に限定する。
document.addEventListener(
  "keydown",

  function(event) {

    if (
      !isInfoDialogOpen()
    ) {

      return;

    }


    if (
      event.key ===
        "Escape"
    ) {

      event.preventDefault();


      closeInfoDialog();


      return;

    }


    if (
      event.key ===
        "Tab"
    ) {

      const focusableElements =
        infoDialog.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );


      if (
        focusableElements.length === 0
      ) {

        event.preventDefault();


        return;

      }


      const firstElement =
        focusableElements[0];


      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ];


      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {

        event.preventDefault();
        lastElement.focus();

      }

      else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {

        event.preventDefault();
        firstElement.focus();

      }

    }

  }
);
