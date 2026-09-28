# GoeikaApp iPhone viewport 実測データ

Codex に共有するための実測値まとめです。

## 前提

- アプリ: GoeikaApp
- 実行形態: iPhone のホーム画面から起動した PWA
- `display-mode: standalone`: `true`
- `navigator.standalone`: `true`
- `visualViewport.scale`: すべて `1`
- `100vh / 100dvh / 100svh / 100lvh` は、デバッグ測定コード修正後の値
  - `getBoundingClientRect().height` ではなく `getComputedStyle(probe).height` で取得
- SE2 は縦持ち・横持ちとも表示正常
- 問題機は縦持ちは正常、横持ちで表示崩れ
  - 横持ちでは鍵盤画像が縮小される
  - キーコントローラーが画面外へはみ出す

---

## 1. iPhone SE2 — 縦持ち（正常）

| プロパティ | 実測値 |
|---|---:|
| `window.innerWidth` | 375 |
| `window.innerHeight` | 647 |
| `window.outerWidth` | 375 |
| `window.outerHeight` | 667 |
| `documentElement.clientWidth` | 375 |
| `documentElement.clientHeight` | 647 |
| `visualViewport.width` | 375 |
| `visualViewport.height` | 647 |
| `visualViewport.offsetTop` | 0 |
| `visualViewport.offsetLeft` | 0 |
| `visualViewport.scale` | 1 |
| `100vh` | 647px |
| `100dvh` | 647px |
| `100svh` | 647px |
| `100lvh` | 647px |
| `--app-height` | 647px |
| `display-mode standalone` | true |
| `navigator.standalone` | true |
| `orientation` | portrait-primary |
| `screen` | 375 x 667 |
| `devicePixelRatio` | 2 |

### 補足

- `outerHeight - innerHeight = 667 - 647 = 20px`
- 高さ系の値はすべて `647px` で一致

---

## 2. iPhone SE2 — 横持ち（正常）

### 白い上部領域が表示されている状態

| プロパティ | 実測値 |
|---|---:|
| `window.innerWidth` | 667 |
| `window.innerHeight` | 375 |
| `window.outerWidth` | 667 |
| `window.outerHeight` | 375 |
| `documentElement.clientWidth` | 667 |
| `documentElement.clientHeight` | 375 |
| `visualViewport.width` | 667 |
| `visualViewport.height` | 375 |
| `visualViewport.offsetTop` | -20 |
| `visualViewport.offsetLeft` | 0 |
| `visualViewport.scale` | 1 |
| `100vh` | 375px |
| `100dvh` | 375px |
| `100svh` | 375px |
| `100lvh` | 375px |
| `--app-height` | 375px |
| `display-mode standalone` | true |
| `navigator.standalone` | true |
| `orientation` | landscape-primary |
| `screen` | 375 x 667 |
| `devicePixelRatio` | 2 |

### 白い上部領域をタップして画面外へ追い出した後

確認できた変化:

```text
visualViewport.offsetTop: -20 → 0
```

それ以外の主要値は変化なし:

```text
window.innerWidth: 667
window.innerHeight: 375
visualViewport.width: 667
visualViewport.height: 375
100vh: 375px
100dvh: 375px
100svh: 375px
100lvh: 375px
--app-height: 375px
```

### 補足

- 高さ系の値はすべて `375px` で一致
- SE2 横持ちでは `outerWidth == innerWidth == 667`

---

## 3. 問題機 — 縦持ち（正常）

| プロパティ | 実測値 |
|---|---:|
| `window.innerWidth` | 390 |
| `window.innerHeight` | 797 |
| `window.outerWidth` | 390 |
| `window.outerHeight` | 844 |
| `documentElement.clientWidth` | 390 |
| `documentElement.clientHeight` | 797 |
| `visualViewport.width` | 390 |
| `visualViewport.height` | 797 |
| `visualViewport.offsetTop` | 0 |
| `visualViewport.offsetLeft` | 0 |
| `visualViewport.scale` | 1 |
| `100vh` | 797px |
| `100dvh` | 797px |
| `100svh` | 797px |
| `100lvh` | 797px |
| `--app-height` | 797px |
| `display-mode standalone` | true |
| `navigator.standalone` | true |
| `orientation` | portrait-primary |
| `screen` | 390 x 844 |
| `devicePixelRatio` | 3 |

### 補足

- `outerHeight - innerHeight = 844 - 797 = 47px`
- 高さ系の値はすべて `797px` で一致
- 縦持ち表示は正常

---

## 4. 問題機 — 横持ち（異常）

| プロパティ | 実測値 |
|---|---:|
| `window.innerWidth` | 750 |
| `window.innerHeight` | 390 |
| `window.outerWidth` | 844 |
| `window.outerHeight` | 390 |
| `documentElement.clientWidth` | 750 |
| `documentElement.clientHeight` | 390 |
| `visualViewport.width` | 750 |
| `visualViewport.height` | 390 |
| `visualViewport.offsetTop` | 0 |
| `visualViewport.offsetLeft` | 0 |
| `visualViewport.scale` | 1 |
| `100vh` | 390px |
| `100dvh` | 390px |
| `100svh` | 390px |
| `100lvh` | 390px |
| `--app-height` | 390px |
| `display-mode standalone` | true |
| `navigator.standalone` | true |
| `orientation` | landscape-primary |
| `screen` | 390 x 844 |
| `devicePixelRatio` | 3 |

### 補足

- `outerWidth - innerWidth = 844 - 750 = 94px`
- `94px = 47px x 2`
- 高さ系の値はすべて `390px` で一致
- `innerWidth == clientWidth == visualViewport.width == 750`
- 横持ち表示のみ異常
  - 鍵盤画像が縮小
  - キーコントローラーが画面外へはみ出す

---

## 5. 比較表

| 項目 | SE2 縦 正常 | SE2 横 正常 | 問題機 縦 正常 | 問題機 横 異常 |
|---|---:|---:|---:|---:|
| `innerWidth` | 375 | 667 | 390 | 750 |
| `innerHeight` | 647 | 375 | 797 | 390 |
| `outerWidth` | 375 | 667 | 390 | 844 |
| `outerHeight` | 667 | 375 | 844 | 390 |
| `clientWidth` | 375 | 667 | 390 | 750 |
| `clientHeight` | 647 | 375 | 797 | 390 |
| `visualViewport.width` | 375 | 667 | 390 | 750 |
| `visualViewport.height` | 647 | 375 | 797 | 390 |
| `visualViewport.offsetTop` | 0 | -20 ※ | 0 | 0 |
| `visualViewport.offsetLeft` | 0 | 0 | 0 | 0 |
| `visualViewport.scale` | 1 | 1 | 1 | 1 |
| `100vh` | 647px | 375px | 797px | 390px |
| `100dvh` | 647px | 375px | 797px | 390px |
| `100svh` | 647px | 375px | 797px | 390px |
| `100lvh` | 647px | 375px | 797px | 390px |
| `--app-height` | 647px | 375px | 797px | 390px |
| `screen` | 375 x 667 | 375 x 667 | 390 x 844 | 390 x 844 |
| `devicePixelRatio` | 2 | 2 | 3 | 3 |

※ SE2横持ちの `offsetTop = -20` は、上部の白い領域をタップして追い出すと `0` になる。

---

## 6. 現時点で確認できている特徴

### 高さ系

SE2・問題機とも、縦横それぞれで以下は一致している。

```text
window.innerHeight
documentElement.clientHeight
visualViewport.height
100vh
100dvh
100svh
100lvh
--app-height
```

したがって、問題機横持ちの表示崩れについて、
少なくとも実測上は `visualViewport.height` や `--app-height` の異常値は確認されていない。

### 横幅系

SE2横持ち:

```text
outerWidth: 667
innerWidth: 667
差: 0px
```

問題機横持ち:

```text
outerWidth: 844
innerWidth: 750
差: 94px
```

問題機縦持ちでは:

```text
outerHeight: 844
innerHeight: 797
差: 47px
```

したがって問題機では、

```text
縦: 844 - 797 = 47px
横: 844 - 750 = 94px = 47px x 2
```

という特徴が確認されている。

---

## 7. 次に追加予定の計測

`env(safe-area-inset-*)` の実測値を Viewport Debug に追加予定。

```text
safe-area-inset-top
safe-area-inset-right
safe-area-inset-bottom
safe-area-inset-left
```

目的は、問題機横持ち時の `outerWidth 844` と `innerWidth 750` の差 `94px` が、
セーフエリアと対応しているか確認すること。

現時点ではまだ `safe-area-inset-*` の実測値は取得していないため、
このファイルには推測値を記載していない。
