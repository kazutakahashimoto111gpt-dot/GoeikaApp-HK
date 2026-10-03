// アプリ更新時は、静的ファイルを確実に更新するためキャッシュ名も変更する。

const CACHE_PREFIX =
  "goeikaapp-hk-";

const CACHE_NAME =
  `${CACHE_PREFIX}v4.0.11`;



// オフライン動作に必要な静的ファイルのみ事前キャッシュする。

const FILES_TO_CACHE = [

  "./",

  "./style.css",

  "./script.js",

  "./manifest.json",

  "./notes.js",

  "./keyboard-chart.png",

  "./icons/favicon-48.png",

  "./icons/icon-192.png",

  "./icons/icon-512.png",

  "./icons/apple-touch-icon.png"

];

const CACHEABLE_URLS = new Set(
  FILES_TO_CACHE.map(file =>
    new URL(file, self.location.href).href
  )
);

const APP_URL = new URL("./", self.location.href).href;
const INDEX_URL = new URL("./index.html", self.location.href).href;



// Service Workerのインストール

self.addEventListener(
  "install",

  event => {

    event.waitUntil(


      caches.open(
        CACHE_NAME
      )


        .then(cache => {
          return cache.addAll(
            FILES_TO_CACHE
          );


        })


    );


  }
);



// 更新通知からの即時有効化

self.addEventListener(
  "message",

  event => {

    if (
      event.data &&
      event.data.type ===
        "SKIP_WAITING"
    ) {

      // 事前キャッシュ済みのwaiting workerのみ即時有効化する。
      self.skipWaiting();

    }

    if (
      event.data &&
      event.data.type === "GET_CACHE_NAME" &&
      event.ports[0]
    ) {
      event.ports[0].postMessage({
        cacheName: CACHE_NAME
      });
    }

  }
);



// 新しいService Workerの有効化

self.addEventListener(
  "activate",

  event => {

    // 他アプリへ影響させないよう、このアプリの旧キャッシュだけを削除する。
    event.waitUntil(


      caches.keys()


        .then(cacheNames => {
          return Promise.all(


            cacheNames.map(
              cacheName => {
                if (
                  cacheName.startsWith(CACHE_PREFIX) &&
                  cacheName !==
                  CACHE_NAME
                ) {
                  return caches.delete(
                    cacheName
                  );


                }


              }
            )


          );


        })


        .then(() =>
          clients.claim()
        )


    );

  }
);



// アプリ用静的ファイルはキャッシュ優先で取得する。

self.addEventListener(
  "fetch",

  event => {

    if (
      event.request.method !==
      "GET"
    ) {

      return;

    }

    // 旧インストールの開始URLがindex.htmlでも、ルートHTMLへ統一する。
    const requestUrl = event.request.url;
    const isAppNavigation =
      event.request.mode === "navigate" &&
      (requestUrl === APP_URL || requestUrl === INDEX_URL);

    if (
      !isAppNavigation &&
      !CACHEABLE_URLS.has(requestUrl)
    ) {
      return;
    }

    const cacheRequest =
      isAppNavigation
        ? APP_URL
        : event.request;

    event.respondWith(
      caches.open(CACHE_NAME)

        .then(cache =>
          cache.match(cacheRequest)
        )


        .then(cachedResponse => {
          if (
            cachedResponse
          ) {
            return cachedResponse;


          }

          return fetch(
            event.request
          )


            .then(networkResponse => {
              if (
                networkResponse &&
                networkResponse.status === 200
              ) {
                const responseClone =
                  networkResponse.clone();

                return caches.open(
                  CACHE_NAME
                )


                  .then(cache => {
                    return cache.put(
                      event.request,
                      responseClone
                    );


                  })


                  .catch(error => {

                    console.warn(
                      "取得したファイルをキャッシュへ保存できませんでした。",
                      error
                    );

                  })


                  .then(() =>
                    networkResponse
                  );


              }

              return networkResponse;


            });


        })


    );


  }
);
