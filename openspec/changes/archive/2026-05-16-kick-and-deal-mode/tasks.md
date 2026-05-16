## 1. 伺服器：踢人訊息協議（kick-player）— Host can kick players from lobby

- [x] 1.1 實作「Host can kick players from lobby」核心邏輯：在 `server/gameManager.js` 新增 `kickPlayer(room, targetId)` 函式，從 `room.players` 移除目標玩家、向目標玩家的 ws 發送 `{ type: 'KICKED' }`、廣播新的 `LOBBY_STATE` 給剩餘玩家。驗證：呼叫 kickPlayer 後，room.players 不含 targetId，且 targetId 的 ws 收到 KICKED 訊息。

- [x] 1.2 實作「踢人（kick_player）」訊息路由：在 `server/index.js` 新增 `KICK_PLAYER` case，驗證發送者為 `room.hostId`（否則回傳 `ERROR NOT_HOST`），驗證 `room.phase === 'LOBBY'`（否則回傳 `ERROR NOT_IN_LOBBY`），再呼叫 `kickPlayer`。驗證：非房主送 KICK_PLAYER 收到 NOT_HOST 錯誤；遊戲進行中送 KICK_PLAYER 收到 NOT_IN_LOBBY 錯誤。

## 2. 客戶端：踢人 UI（kick-player）— Host can kick players from lobby

- [x] 2.1 在 `client/js/ui.js` 的 `renderLobby` 函式中，當 `isHost` 為 true 時，為每位非自己的玩家渲染「踢出」按鈕（`data-id` 屬性存放 targetId），點擊後送出 `{ type: 'KICK_PLAYER', targetId }`。驗證：房主大廳頁面可見踢出按鈕，且自己旁邊無按鈕；非房主看不到按鈕。

- [x] 2.2 在 `client/js/client.js` 的 WebSocket `onmessage` 中處理 `KICKED` 訊息：清除 `sessionStorage`（playerId、roomCode、isHost），以 `alert` 顯示「你已被房主踢出」，再 `window.location.href = 'index.html'`。驗證：被踢玩家收到 KICKED 後 sessionStorage 為空且跳回首頁。

## 3. 伺服器：發牌模式開關位置（deal-mode）— Host can enable dealing mode before starting the game

- [x] 3.1 實作「Host can enable dealing mode before starting the game」開關：在 `server/gameManager.js` 的 `createRoom` 中為 room 物件新增 `dealingMode: false` 欄位；在 `server/index.js` 的 `START_GAME` 路由中讀取 `msg.dealingMode`，賦值 `room.dealingMode = !!msg.dealingMode`。驗證：啟動遊戲時 room.dealingMode 反映訊息中的布林值。

- [x] 3.2 在 `server/gameEngine.js` 角色分配完成後，若 `room.dealingMode === true`，則 phase 停留在 `ROLE_REVEAL`，不推進到 `TEAM_PROPOSAL`（插入 `if (room.dealingMode) { broadcastGameState(room); return; }` 於 phase 推進前）。此為「發牌模式（dealingMode）」核心：game does not advance past role reveal in dealing mode。驗證：勾選發牌模式開始遊戲後，所有玩家 GAME_STATE.phase = ROLE_REVEAL 且後續無 TEAM_PROPOSAL。

- [x] 3.3 在 `server/gameEngine.js` 的 `broadcastGameState` 函式中，將 `dealingMode: room.dealingMode` 加入廣播的 GAME_STATE 物件。驗證：客戶端收到的 GAME_STATE 中含有 dealingMode 布林欄位。

## 4. 客戶端：翻牌 UX（純前端狀態）— Players see a flippable card in dealing mode

- [x] 4.1 在 `client/js/ui.js` 的 `renderLobby` 中，當 `isHost` 為 true 時顯示「發牌模式」checkbox（id: `deal-mode-toggle`，預設未勾選）。在發送 `START_GAME` 訊息時帶入 `dealingMode: document.getElementById('deal-mode-toggle').checked`。驗證：房主可見 checkbox；非房主不顯示；START_GAME 訊息含 dealingMode 欄位。

- [x] 4.2 實作「Players see a flippable card in dealing mode」UX：在 `client/js/ui.js` 中新增 `renderCardFlip(myRoleInfo, players)` 函式，預設顯示牌背（大型 CSS 卡片），點擊後翻面顯示角色名稱與陣營資訊（knownEvil/suspects，與現有 renderRoleReveal 一致），再點擊蓋回；不顯示「確認角色」按鈕。驗證：翻牌可正確切換兩種狀態；角色資訊與 renderRoleReveal 內容一致；無 acknowledge 按鈕。

- [x] 4.3 在 `client/js/ui.js` 的 `renderByPhase` 中，當 `state.phase === 'ROLE_REVEAL'` 且 `state.dealingMode === true` 時呼叫 `renderCardFlip`，否則呼叫原有的 `renderRoleReveal`。驗證：啟用發牌模式顯示翻牌介面；未啟用顯示原有確認角色介面，兩者互不干擾。
