## Why

阿瓦隆是一款需要推理與隱藏身份的多人桌遊，目前只能實體遊玩。線上版讓遠端玩家能即時遊玩，並由伺服器負責角色秘密分配，確保資訊隔離（防止前端作弊）。

## What Changes

從零建立一個多人線上阿瓦隆遊戲，包含：
- Node.js + WebSocket 後端（管理遊戲狀態、驗證所有玩家動作）
- 純 HTML/CSS/JS 前端（房間大廳、遊戲介面、投票與任務 UI）
- 完整角色系統，含特殊可見性規則（梅林、刺客、派西維爾、莫甘娜、奧伯倫、莫德雷德、忠臣、爪牙）
- 完整遊戲流程：提名隊員 → 全體投票 → 任務執行 → 刺殺梅林

## Non-Goals

- 不含女士湖（Lady of the Lake）機制
- 不含帳號系統或持久化資料庫（in-memory 狀態）
- 不含觀戰模式
- 不含 AI 玩家

## Capabilities

### New Capabilities

- `room-management`：建立／加入房間（隨機 4 字元房間碼）、大廳等待、房主開始遊戲
- `role-assignment`：伺服器秘密分配角色，依可見性規則個別推送資訊給各玩家
- `team-proposal`：當前隊長提名任務隊員，系統驗證隊長身份與人數
- `voting`：全體投票同意／拒絕提名隊伍，連續 5 次拒絕壞人獲勝
- `mission-execution`：任務隊員提交成功／失敗卡，計算任務結果（R4 需兩張失敗牌）
- `assassination`：好人贏得 3 任務後，刺客猜測梅林身份以決定最終勝負
- `game-state-machine`：整體遊戲流程狀態機與勝負判定

### Modified Capabilities

(none)

## Impact

- Affected specs: room-management, role-assignment, team-proposal, voting, mission-execution, assassination, game-state-machine
- Affected code:
  - New: package.json
  - New: server/index.js
  - New: server/gameManager.js
  - New: server/gameEngine.js
  - New: server/roles.js
  - New: client/index.html
  - New: client/game.html
  - New: client/css/style.css
  - New: client/js/client.js
  - New: client/js/ui.js
