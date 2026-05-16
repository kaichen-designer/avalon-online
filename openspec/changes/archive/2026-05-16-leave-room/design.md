## Context

阿瓦隆線上版目前大廳缺少主動離開的入口：玩家只能等房主踢出或直接關閉瀏覽器。關閉瀏覽器會觸發 WebSocket close 事件，`handleDisconnect` 在 LOBBY 階段以 30 秒計時器延遲移除，這段時間大廳其他人會看到「離線」玩家，體驗差。主動退出應即時移除，不走延遲計時器。

## Goals / Non-Goals

**Goals:**
- 大廳玩家可主動點擊「退出房間」即時離開
- 離開者的 ws 及 sessionStorage 被清除，回到首頁
- 若離開者是房主，房主立即轉移給下一位玩家
- 剩餘玩家即時收到更新後的 LOBBY_STATE

**Non-Goals:**
- 遊戲進行中（非 LOBBY）的退出（不實作，以免破壞遊戲平衡）
- 退出前的確認對話框（直接送出，符合踢人的同等操作模式）
- 房間為空時的持久化（現有行為：空房間直接刪除，保持不變）

## Decisions

### LEAVE_ROOM 訊息協議

客戶端送 `{ type: 'LEAVE_ROOM' }` → 伺服器在 `server/index.js` 路由：驗證 `room.phase === 'LOBBY'`（否則 ERROR NOT_IN_LOBBY），呼叫 `leaveRoom(room, playerId)`。

選擇新訊息類型而非複用 WebSocket close 事件：close 事件有 30 秒延遲，且使用者無法區分「主動離開」與「網路斷線」；明確訊息讓伺服器立即行動。

### leaveRoom 函式設計

在 `server/gameManager.js` 新增 `leaveRoom(room, playerId)` 函式：
1. 找到玩家，清除其 `disconnectTimer`（若有）
2. 發送 `{ type: 'LEFT' }` 給離開者的 ws
3. 從 `room.players` 移除該玩家
4. 若移除後房間為空 → 刪除房間（`rooms.delete(room.code)`）
5. 若移除後房間不為空 且 離開者是房主 → 房主轉移給 `room.players[0].id`
6. 廣播新的 `LOBBY_STATE` 給剩餘玩家

選擇獨立函式而非複用 `kickPlayer`：`kickPlayer` 送 `KICKED`，語意不同；`leaveRoom` 送 `LEFT`，讓客戶端可以區分「被踢」與「主動離開」。

### 客戶端 LEFT 處理

收到 `LEFT` → 清除 sessionStorage（playerId、roomCode、isHost）→ `window.location.href = 'index.html'`。不顯示 alert（主動行為不需警示）。

## Implementation Contract

### LEAVE_ROOM 行為

**訊息形狀：**
- 請求：`{ type: 'LEAVE_ROOM' }`
- 確認：`{ type: 'LEFT' }`（僅發給離開者）
- 剩餘玩家收到：`{ type: 'LOBBY_STATE', ... }`（同現有格式）

**行為：**
- 一般玩家離開 → 從 players 移除，房主不變，廣播 LOBBY_STATE
- 房主離開（房間仍有其他人）→ 從 players 移除，`room.hostId` = `room.players[0].id`，廣播 LOBBY_STATE
- 最後一位玩家離開 → 房間刪除，不廣播
- 遊戲進行中（phase ≠ LOBBY）送 LEAVE_ROOM → 回傳 ERROR NOT_IN_LOBBY

**接受條件：**
1. 非房主玩家點退出 → 自己跳回首頁，其他玩家在大廳看到人數減少
2. 房主點退出 → 自己跳回首頁，其他玩家看到新房主（大廳顯示新的 hostId）
3. 唯一玩家退出 → 房間消失（無法再用同一房間碼加入）
4. 遊戲進行中送 LEAVE_ROOM → 收到 ERROR NOT_IN_LOBBY，不跳頁

**UI 接受條件：**
- 所有玩家（含房主）在大廳都看到「退出房間」按鈕
- 按鈕點擊後立即跳回首頁（不等伺服器確認再跳，但 LEFT 也可做為確認）

## Risks / Trade-offs

- **競態：房主剛退出，同時其他人也退出**：Node.js 單執行緒，訊息按序處理，無競態風險。
- **退出後立刻重新整理**：sessionStorage 已清除，重整時 `window.myId` 為 null，client.js 會導回 index.html，行為正確。
