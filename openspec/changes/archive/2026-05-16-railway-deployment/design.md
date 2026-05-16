## Context

阿瓦隆線上遊戲使用純 Node.js + WebSocket 架構，伺服器同時提供靜態檔案（HTTP）與遊戲通訊（WebSocket）。目前 `server.listen(process.env.PORT || 3000)` 已支援環境變數注入 port，`package.json` 也已有 `"start": "node server/index.js"`，Railway 可直接使用。

唯一阻礙公開部署的問題：client 端的 WebSocket URL 硬編碼為 `ws://`，在 HTTPS 環境下會因 mixed content 被瀏覽器拒絕。

## Goals / Non-Goals

**Goals:**

- 修正 WebSocket URL 自動偵測協定（ws/wss）
- 新增 Railway 部署設定，讓 `railway up` 可直接部署
- 新增 `.gitignore` 排除 node_modules（GitHub 推送必要）

**Non-Goals:**

- 不加資料庫：in-memory 狀態足夠，Railway 重啟會清空房間符合預期
- 不設定自訂網域
- 不設定 HTTPS 重導向（Railway 預設已強制 HTTPS）

## Decisions

### WebSocket 協定自動偵測

**決定**：用 `location.protocol` 判斷，在 `client/js/client.js` 第 6 行改為：
```
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
```

**為何不用環境變數**：這個值在 runtime 才知道（取決於瀏覽器連線方式），不適合在 build time 注入。用 `location.protocol` 是標準做法，同時相容 localhost（ws://）和雲端（wss://）。

### 部署設定檔格式

**決定**：使用 `railway.json`（JSON 格式）而非 `Procfile`，因為 Railway 文件建議 `railway.json` 優先，可指定 Node 版本。

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "node server/index.js", "restartPolicyType": "ON_FAILURE" }
}
```

**為何不依賴 package.json start script**：`railway.json` 明確宣告啟動指令，避免未來修改 `start` script 時意外影響部署行為。

## Risks / Trade-offs

- **In-memory 狀態**：Railway 重新部署或 crash 重啟後，所有進行中房間消失。這是已知 trade-off，符合本遊戲設計（遊戲中不斷線即可）。
- **免費方案限制**：Railway 免費 $5 credit/月，流量低的遊戲應足夠，但非正式 SLA。
- **單一 instance**：WebSocket 狀態在記憶體中，不可水平擴展。Railway 部署固定為 1 replica，不影響功能。
