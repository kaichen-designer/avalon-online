## Why

遊戲目前只能在 `localhost:3000` 執行，無法讓不同網路的玩家連線。需要部署到公開雲端，讓任何人都能用手機開啟網址遊玩。

## What Changes

- `client/js/client.js` 的 WebSocket URL 改為自動偵測 `ws://` 或 `wss://`，以支援 HTTPS 部署
- 新增 `railway.json` 部署設定檔，指定 Node.js 版本與啟動指令
- 新增 `.gitignore` 排除 `node_modules`

## Non-Goals

- 不加資料庫或持久化（保持 in-memory 狀態）
- 不設定自訂網域（使用 Railway 預設 subdomain）
- 不設定 CI/CD pipeline（手動 deploy 即可）

## Capabilities

### New Capabilities

- `cloud-deployment`: 伺服器可部署至 Railway 雲端，透過公開 HTTPS/WSS URL 供任何網路的玩家存取

### Modified Capabilities

(none)

## Impact

- Affected specs: cloud-deployment（新增）
- Affected code:
  - Modified: client/js/client.js
  - New: railway.json, .gitignore
