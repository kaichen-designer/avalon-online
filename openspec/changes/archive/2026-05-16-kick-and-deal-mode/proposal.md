## Why

目前遊戲大廳缺乏房主管理玩家的能力，且線上版本無法取代實體阿瓦隆的發牌需求——玩家可能在面對面場合仍需實體牌，原因是擔心抽實體牌時其他人記牌。這兩個功能可提升大廳控制彈性，並讓線上版本完全取代實體牌組。

## What Changes

- 新增「踢出玩家」功能：房主在大廳階段可將任意玩家移除，被踢者收到通知並跳回首頁
- 新增「發牌模式」選項：房主在大廳勾選後，開始遊戲只進行角色分配，每位玩家在手機上看到牌背，點擊翻開查看自己角色，再點擊蓋回；不進入任務投票等遊戲流程

## Capabilities

### New Capabilities

- `kick-player`: 房主在大廳踢出指定玩家，即時更新大廳狀態
- `deal-mode`: 純發牌模式，角色分配後顯示可翻轉牌面介面，不進入遊戲流程

### Modified Capabilities

（無）

## Impact

- Affected code:
  - Modified: server/index.js
  - Modified: server/gameManager.js
  - Modified: server/gameEngine.js
  - Modified: client/js/client.js
  - Modified: client/js/ui.js
