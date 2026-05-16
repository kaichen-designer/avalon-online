## Why

玩家進入大廳後目前沒有辦法主動離開房間，只能關閉瀏覽器或等候房主踢出，體驗不佳。新增「退出房間」按鈕讓每位玩家都能自願離開。

## What Changes

- 大廳新增「退出房間」按鈕（所有玩家皆可見，不限房主）
- 玩家點擊後送出 `LEAVE_ROOM` 訊息 → 伺服器立即移除玩家 → 廣播更新後的 `LOBBY_STATE`
- 若離開者為房主，房主自動轉移給下一位玩家
- 離開者前端清除 `sessionStorage` 並跳回 `index.html`
- 僅限 LOBBY 階段；遊戲進行中不可退出

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `room-management`: 新增「玩家可主動離開大廳」的行為要求

## Impact

- Affected code:
  - Modified: server/gameManager.js
  - Modified: server/index.js
  - Modified: client/js/client.js
  - Modified: client/js/ui.js
