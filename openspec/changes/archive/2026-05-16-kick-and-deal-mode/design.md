## Context

阿瓦隆線上版以 Node.js + WebSocket 實作，伺服器維護 in-memory room 狀態，前端為純 HTML/CSS/JS。目前大廳缺乏玩家管理機制，且沒有純發牌的使用模式。新功能需在不破壞現有遊戲流程的前提下插入大廳與角色分配階段。

## Goals / Non-Goals

**Goals:**
- 房主在 LOBBY 階段可踢除任意其他玩家，被踢者即時收到通知並跳回首頁
- 在大廳新增「發牌模式」開關（房主專屬），開啟後開始遊戲僅分配角色，呈現可翻轉牌面，不進入任何遊戲流程
- 發牌模式下，梅林/壞人的陣營可見資訊仍正確傳送給相關角色

**Non-Goals:**
- 遊戲進行中的踢人（僅限 LOBBY）
- 發牌模式的計時、強制蓋牌等進階功能
- 記錄或傳送「誰翻牌了」的狀態到伺服器

## Decisions

### 踢人訊息協議

客戶端發送 `{ type: 'KICK_PLAYER', targetId }` → 伺服器驗證發送者為房主且房間在 LOBBY 階段 → 直接移除目標玩家 → 發送 `{ type: 'KICKED' }` 給被踢玩家 → 廣播新的 LOBBY_STATE 給剩餘玩家。

選擇直接移除（不走 30 秒 timer）：被踢是主動行為，不需斷線保護視窗。

### 發牌模式開關位置

`room.dealingMode` 布林欄位，預設 `false`。房主在大廳勾選 checkbox，`START_GAME` 訊息帶入 `dealingMode: true/false`，伺服器在 `assignRoles` 完成後判斷：若 `dealingMode`，phase 停留在 `ROLE_REVEAL`，不推進到 `TEAM_PROPOSAL`。

選擇複用現有 ROLE_REVEAL phase 而非新增 phase：前端已有 ROLE_REVEAL 渲染路徑，只需在該 phase 下依 `dealingMode` 顯示不同 UI。

### 翻牌 UX（純前端狀態）

牌背/牌面切換為純前端 CSS toggle，不需傳送給伺服器。預設顯示牌背，點擊後翻面顯示角色卡（含陣營可見資訊），再點擊蓋回。角色資訊已在 ROLE_INFO 訊息中儲存於 `window.myRoleInfo`，直接使用。

## Implementation Contract

### 踢人（KICK_PLAYER）

**行為：**
- 房主在大廳點擊踢出按鈕 → 伺服器移除玩家、傳送 `KICKED` 給被踢者、廣播 `LOBBY_STATE`
- 被踢玩家前端：清除 `sessionStorage`（playerId、roomCode、isHost），顯示提示「你已被房主踢出」，跳回 `index.html`
- 非房主或遊戲已開始時發送 KICK_PLAYER → 伺服器回傳 `ERROR`（NOT_HOST 或 NOT_IN_LOBBY）

**訊息形狀：**
- 請求：`{ type: 'KICK_PLAYER', targetId: string }`
- 被踢通知：`{ type: 'KICKED' }`
- 大廳更新：`{ type: 'LOBBY_STATE', ... }`（同現有格式）

**接受條件：**
1. 房主點踢出 → 被踢玩家在 2 秒內收到 KICKED 並跳回首頁
2. 其他玩家看到大廳人數減少（不含被踢玩家）
3. 非房主送 KICK_PLAYER → 收到 ERROR NOT_HOST

### 發牌模式（dealingMode）

**行為：**
- 大廳顯示「發牌模式」checkbox（僅房主可見）
- `START_GAME` 附帶 `dealingMode: true` → 伺服器分配角色後 phase = `ROLE_REVEAL`，不推進
- 前端 ROLE_REVEAL + dealingMode 旗標 → 顯示翻牌介面（牌背預設），無「確認角色」按鈕
- 點擊牌背 → 翻開顯示角色名稱、陣營資訊；再點擊 → 蓋回
- 遊戲狀態 `GAME_STATE` 廣播需包含 `dealingMode` 欄位供前端判斷

**訊息形狀：**
- `START_GAME`：`{ type: 'START_GAME', roleList: string[], ladyEnabled: bool, dealingMode: bool }`
- `GAME_STATE`：新增 `dealingMode: boolean` 欄位

**接受條件：**
1. 勾選發牌模式開始遊戲 → 所有人進入 ROLE_REVEAL，不出現任務提名 UI
2. 點擊牌背 → 顯示角色資訊；再點 → 蓋回
3. 梅林能看到壞人列表（依現有 ROLE_INFO 邏輯）
4. 不勾選發牌模式 → 行為與現有流程完全相同

## Risks / Trade-offs

- **伺服器重啟導致 dealingMode 遺失**：in-memory 設計本已接受此限制，發牌模式本身無需持久化，玩家刷新後會跳回首頁，影響可接受。
- **多個房主同時踢人（競態）**：每個房間只有一位房主，無競態風險。
