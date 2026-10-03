"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(
    path.join(projectRoot, relativePath),
    "utf8"
  );
}

function checkJavaScriptSyntax(relativePath) {
  assert.doesNotThrow(
    () => new vm.Script(
      readProjectFile(relativePath),
      { filename: relativePath }
    ),
    `${relativePath} に構文エラーがあります`
  );
}

for (const relativePath of [
  "notes.js",
  "script.js",
  "sw.js"
]) {
  checkJavaScriptSyntax(relativePath);
}

const notesContext = {};
vm.createContext(notesContext);
new vm.Script(
  `${readProjectFile("notes.js")}\n` +
  "this.testNotes = notes; " +
  "this.testKeyboardLayout = keyboardLayout;",
  { filename: "notes.js" }
).runInContext(notesContext);

const notes = Array.from(notesContext.testNotes);
const keyboardLayout = notesContext.testKeyboardLayout;

assert.equal(notes.length, 25, "音符は25鍵分必要です");

notes.forEach((note, index) => {
  const expectedFrequency = 220 * Math.pow(2, index / 12);

  assert.ok(
    Math.abs(note.frequency - expectedFrequency) < 0.001,
    `${index + 1}番目の周波数が半音階と一致しません`
  );
});

for (const [keyType, expectedCount] of [
  ["white", 15],
  ["black", 10]
]) {
  const keyIndexes = notes
    .filter(note => note.keyType === keyType)
    .map(note => note.keyIndex);

  assert.equal(
    keyIndexes.length,
    expectedCount,
    `${keyType}鍵の数が正しくありません`
  );

  assert.deepEqual(
    keyIndexes,
    Array.from({ length: expectedCount }, (_, index) => index),
    `${keyType}鍵のkeyIndexが連番ではありません`
  );
}

for (const [areaName, expectedCount] of [
  ["whiteKeyAreas", 15],
  ["blackKeyAreas", 10],
  ["nonPlayableBlackKeyAreas", 2]
]) {
  const areas = Array.from(keyboardLayout[areaName]);

  assert.equal(
    areas.length,
    expectedCount,
    `${areaName}の領域数が正しくありません`
  );

  areas.forEach((area, index) => {
    assert.ok(
      area.left >= 0 &&
      area.right <= 1 &&
      area.left < area.right,
      `${areaName}[${index}]の範囲が正しくありません`
    );
  });
}

const pngBuffer = fs.readFileSync(
  path.join(projectRoot, "assets/keyboard-chart.png")
);
const pngWidth = pngBuffer.readUInt32BE(16);
const pngHeight = pngBuffer.readUInt32BE(20);

assert.equal(
  pngWidth,
  keyboardLayout.imageWidth,
  "鍵盤画像の幅と鍵判定データが一致しません"
);
assert.equal(
  pngHeight,
  keyboardLayout.imageHeight,
  "鍵盤画像の高さと鍵判定データが一致しません"
);

const indexHtml = readProjectFile("index.html");
const localAssetPaths = Array.from(
  indexHtml.matchAll(/(?:src|href)="([^"#]+)"/g),
  match => match[1]
).filter(assetPath => !/^[a-z]+:/i.test(assetPath));

localAssetPaths.forEach(assetPath => {
  const normalizedPath = assetPath.replace(/^\.\//, "");

  assert.ok(
    fs.existsSync(path.join(projectRoot, normalizedPath)),
    `HTMLから参照している${assetPath}が存在しません`
  );
});

const manifest = JSON.parse(readProjectFile("manifest.json"));
const themeColorMatch = indexHtml.match(
  /name="theme-color"[\s\S]*?content="([^"]+)"/
);

assert.ok(themeColorMatch, "HTMLにtheme-colorがありません");
assert.equal(
  themeColorMatch[1],
  manifest.theme_color,
  "HTMLとmanifest.jsonのテーマ色が一致しません"
);
assert.equal(
  manifest.background_color,
  manifest.theme_color,
  "PWAの背景色とテーマ色が一致しません"
);

const serviceWorker = readProjectFile("sw.js");
const precacheBlockMatch = serviceWorker.match(
  /const FILES_TO_CACHE = \[([\s\S]*?)\];/
);

assert.ok(precacheBlockMatch, "FILES_TO_CACHEが見つかりません");

const precachePaths = Array.from(
  precacheBlockMatch[1].matchAll(/"([^"]+)"/g),
  match => match[1]
);

assert.equal(
  new Set(precachePaths).size,
  precachePaths.length,
  "FILES_TO_CACHEに重複があります"
);
assert.ok(
  precachePaths.includes("./assets/icons/favicon-48.png"),
  "faviconが事前キャッシュに含まれていません"
);
assert.ok(
  !precachePaths.includes("./index.html"),
  "ルートHTMLを二重に事前キャッシュしています"
);

precachePaths
  .filter(assetPath => assetPath !== "./")
  .forEach(assetPath => {
    const normalizedPath = assetPath.replace(/^\.\//, "");

    assert.ok(
      fs.existsSync(path.join(projectRoot, normalizedPath)),
      `事前キャッシュ対象の${assetPath}が存在しません`
    );
  });

assert.equal(
  manifest.start_url,
  "./",
  "PWAの開始URLと事前キャッシュするルートURLが一致しません"
);

async function checkStorageIsolation() {
  const appUrl = "https://example.com/GoeikaApp-HK/";
  let cacheName;
  let networkFetches = 0;
  let skipWaitingCalls = 0;
  const handlers = {};
  const entries = new Map();
  const deletedCaches = [];
  const cache = {
    addAll(paths) {
      paths.forEach(assetPath => {
        entries.set(new URL(assetPath, appUrl).href, "precache");
      });
      return Promise.resolve();
    },
    match(request) {
      return Promise.resolve(entries.get(request.url || request));
    },
    put(request, response) {
      entries.set(request.url, response);
      return Promise.resolve();
    }
  };
  const workerContext = {
    URL,
    console,
    self: {
      location: { href: `${appUrl}sw.js` },
      skipWaiting() { skipWaitingCalls++; },
      addEventListener(type, handler) {
        handlers[type] = handler;
      }
    },
    caches: {
      open(name) {
        assert.equal(name, cacheName);
        return Promise.resolve(cache);
      },
      keys() {
        return Promise.resolve([
          cacheName,
          "goeikaapp-hk-v4.0.3",
          "v4.0.4",
          "other-pwa-v1"
        ]);
      },
      delete(name) {
        deletedCaches.push(name);
        return Promise.resolve(true);
      }
    },
    clients: { claim: () => Promise.resolve() },
    fetch(request) {
      networkFetches++;
      return Promise.resolve({
        status: 200,
        url: request.url,
        clone() { return this; }
      });
    }
  };
  vm.createContext(workerContext);
  new vm.Script(serviceWorker, { filename: "sw.js" })
    .runInContext(workerContext);
  cacheName = vm.runInContext("CACHE_NAME", workerContext);
  assert.match(cacheName, /^goeikaapp-hk-v\d+(?:\.\d+)+$/);

  let installPromise;
  handlers.install({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;
  assert.equal(entries.size, precachePaths.length);
  assert.ok(entries.has(appUrl));

  let reportedCacheName;
  handlers.message({
    data: { type: "GET_CACHE_NAME" },
    ports: [{ postMessage(message) {
      reportedCacheName = message.cacheName;
    } }]
  });
  assert.equal(reportedCacheName, cacheName);
  handlers.message({ data: { type: "SKIP_WAITING" }, ports: [] });
  assert.equal(skipWaitingCalls, 1);

  let activatePromise;
  handlers.activate({ waitUntil(promise) { activatePromise = promise; } });
  await activatePromise;
  assert.deepEqual(deletedCaches, ["goeikaapp-hk-v4.0.3"]);

  async function request(url, mode = "same-origin") {
    let responsePromise;
    handlers.fetch({
      request: { url, method: "GET", mode },
      respondWith(promise) { responsePromise = promise; }
    });
    return responsePromise && await responsePromise;
  }

  const otherAppUrl = "https://example.com/other-pwa/";
  assert.equal(await request(otherAppUrl, "navigate"), undefined);
  assert.equal(await request(`${otherAppUrl}script.js`), undefined);
  assert.equal(await request(`${appUrl}unlisted.json`), undefined);
  assert.equal(entries.has(otherAppUrl), false);
  assert.equal(await request(appUrl, "navigate"), "precache");
  assert.equal(await request(`${appUrl}index.html`, "navigate"), "precache");
  assert.equal(networkFetches, 0);

  const scriptUrl = `${appUrl}script.js`;
  entries.delete(scriptUrl);
  const runtimeResponse = await request(scriptUrl);
  assert.equal(runtimeResponse.status, 200);
  assert.equal(entries.get(scriptUrl), runtimeResponse);
  assert.equal(networkFetches, 1);

  const keyShiftBlock = readProjectFile("script.js").match(
    /const KEY_SHIFT_STORAGE_KEY =[\s\S]*?(?=let keyShift =)/
  );
  assert.ok(keyShiftBlock, "キー設定の移行処理が見つかりません");

  function loadSetting(initialValues) {
    const values = new Map(initialValues);
    const context = {
      console,
      localStorage: {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); }
      }
    };
    vm.runInNewContext(
      `${keyShiftBlock[0]}\nthis.loaded = loadKeyShift();`,
      context
    );
    return { loaded: context.loaded, values };
  }

  const migrated = loadSetting([["kongoKeyShift", "5"]]);
  assert.equal(migrated.loaded, 5);
  assert.equal(migrated.values.get("goeikaapp-hk:keyShift"), "5");
  assert.equal(migrated.values.get("kongoKeyShift"), "5");

  const existing = loadSetting([
    ["goeikaapp-hk:keyShift", "-2"],
    ["kongoKeyShift", "5"]
  ]);
  assert.equal(existing.loaded, -2);
  assert.equal(existing.values.get("kongoKeyShift"), "5");
}

checkStorageIsolation()
  .then(() => console.log("Project checks passed."))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
