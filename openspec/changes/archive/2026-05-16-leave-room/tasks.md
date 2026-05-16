## 1. 伺服器：leaveRoom 函式設計與路由 — Player can voluntarily leave the lobby

- [x] [P] 1.1 實作「leaveRoom 函式設計」與「LEAVE_ROOM 行為」核心邏輯：在 `server/gameManager.js` 新增 `leaveRoom(room, playerId)` 函式，清除玩家的 `disconnectTimer`（若有）、向該玩家 ws 發送 `{ type: 'LEFT' }`、從 `room.players` 移除玩家、若房間為空則 `rooms.delete(room.code)`、否則若離開者為房主則將 `room.hostId` 設為 `room.players[0].id`、廣播新的 `LOBBY_STATE` 給剩餘玩家，並將 `leaveRoom` 加入 `module.exports`。驗證：呼叫後 room.players 不含該玩家、剩餘玩家收到 LOBBY_STATE、若原房主離開則 room.hostId 更新為新玩家。

- [x] [P] 1.2 實作「LEAVE_ROOM 訊息協議」路由：在 `server/index.js` 引入 `leaveRoom` 並新增 `LEAVE_ROOM` case，驗證 `room.phase === 'LOBBY'`（否則回傳 `ERROR { code: 'NOT_IN_LOBBY' }`），再呼叫 `leaveRoom(room, playerId)`。驗證：遊戲進行中送 LEAVE_ROOM 收到 NOT_IN_LOBBY 錯誤；LOBBY 中送 LEAVE_ROOM 玩家被移除。

## 2. 客戶端：LEFT 訊息處理（客戶端 left 處理）— Client clears state after leaving

- [x] [P] 2.1 實作「客戶端 left 處理」：在 `client/js/client.js` 的 `dispatch` 函式中新增 `case 'LEFT'`，清除 `sessionStorage`（playerId、roomCode、isHost），執行 `window.location.href = 'index.html'`（不顯示 alert，主動離開不需警示）。驗證：收到 LEFT 後 sessionStorage 為空且頁面跳回首頁。

## 3. 客戶端：退出房間按鈕 UI — Player can voluntarily leave the lobby

- [x] 3.1 實作「Player can voluntarily leave the lobby」UI：在 `client/js/ui.js` 的 `renderLobby` 函式中，為所有玩家（房主與非房主）渲染「退出房間」按鈕，點擊後呼叫 `window.sendMsg({ type: 'LEAVE_ROOM' })`。驗證：房主與非房主在大廳都能看到「退出房間」按鈕，點擊後觸發 LEAVE_ROOM 訊息送出。
