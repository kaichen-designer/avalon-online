## 1. 程式碼修改

- [x] 1.1 [P] 修改 `client/js/client.js` 第 6 行的 WebSocket URL，套用「WebSocket 協定自動偵測」決策：將 `ws://${location.host}` 改為 `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`，實作「WebSocket connection uses protocol matching the page origin」規格
- [x] 1.2 [P] 在專案根目錄建立 `railway.json`，套用「部署設定檔格式」決策（NIXPACKS builder，`node server/index.js` 啟動指令，ON_FAILURE 重啟策略），實作「Server declares deployment configuration for Railway」規格
- [x] 1.3 [P] 在專案根目錄建立 `.gitignore`，加入 `node_modules/`、`.DS_Store`、`Thumbs.db`，實作「Repository excludes build artifacts from version control」規格

## 2. 部署步驟驗證

- [x] 2.1 在本機啟動 `node server/index.js`，以 `http://localhost:3000` 開啟遊戲，確認 WebSocket 仍正常連線（ws:// 路徑未受影響）
- [x] 2.2 確認 `.gitignore` 在 `git status` 中正確排除 `node_modules/`
