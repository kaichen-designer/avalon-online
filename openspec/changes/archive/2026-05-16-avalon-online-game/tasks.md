## 1. 專案初始化

- [x] 1.1 建立 package.json，加入 `ws` 套件依賴（`npm init -y && npm install ws`）（設計決策：使用 ws 套件而非 Socket.IO，詳見 design.md）
- [x] 1.2 建立專案目錄結構：`server/`、`client/css/`、`client/js/`

## 2. 角色定義（server/roles.js）

- [x] 2.1 定義所有角色常數：merlin、assassin、percival、morgana、oberon、mordred、loyal-servant、minion
- [x] 2.2 實作 `getVisibleInfo(role, allPlayers)` 函式，依角色可見性規則回傳 knownEvil 或 suspects 陣列（涵蓋 Role visibility rules：梅林看壞人除莫德雷德、派西維爾看梅林+莫甘娜、奧伯倫隔離）
- [x] 2.3 定義 `EVIL_ROLES` 集合與 `EVIL_COUNT_BY_PLAYERS` 對應表（5人→2邪，6人→2邪，7-9人→3邪，10人→4邪），用於 Role list validation

## 3. 房間管理（server/gameManager.js）

- [x] 3.1 實作 `createRoom(ws, playerName)` → 產生唯一 4 字元大寫房間碼，建立房間物件，回傳 ROOM_JOINED（涵蓋 Create room）
- [x] 3.2 實作 `joinRoom(ws, roomCode, playerName)` → 驗證房間存在、未開始、人數未滿，回傳 ROOM_JOINED 並廣播更新（涵蓋 Join room：Room not found、Game already started、Room full）
- [x] 3.3 實作 `getRoomByPlayerId(playerId)` 輔助函式，供訊息路由使用
- [x] 3.4 實作玩家斷線處理：LOBBY 階段移除玩家並廣播；遊戲中標記 disconnected 並啟動 30 秒計時（涵蓋 Player disconnect handling；設計決策：斷線處理策略）

## 4. 遊戲引擎（server/gameEngine.js）

- [x] 4.1 定義 `MISSION_REQUIREMENTS` 任務人數表（5-10人 × 5回合），標記 R4 雙失敗規則（7人以上），並在 `gameEngine.js` 中維護 `round` 計數器（涵蓋 Required team sizes、Round tracking；設計決策：遊戲狀態機集中於 gameEngine.js）
- [x] 4.2 實作 `assignRoles(room)` → 驗證角色清單（Role list validation：需含梅林、刺客，邪惡人數需符合），隨機分配角色，呼叫 `getVisibleInfo` 並個別推送 ROLE_INFO（涵蓋 Secret role assignment）
- [x] 4.3 實作 `proposeTeam(room, leaderId, team)` → 驗證隊長身份（Not leader）與隊員人數（Invalid team size），轉換到 VOTE 階段並廣播（涵蓋 Leader nominates team）
- [x] 4.4 實作 `submitVote(room, playerId, vote)` → 收集投票，防重複投票（Already voted），人數齊後計算結果（涵蓋 All players vote on proposed team、Vote approval threshold）
- [x] 4.5 實作投票結果處理：通過→MISSION；拒絕→voteTrack+1，leader 輪轉，→TEAM_PROPOSAL；連續 5 次→GAME_OVER（涵蓋 Five consecutive rejections、Leader rotation）
- [x] 4.6 實作 `submitMissionCard(room, playerId, card)` → 驗證隊員身份（Not on team）、好人不能出失敗牌（Cannot fail mission），收集所有牌後呼叫 calcMissionResult（涵蓋 Only team members submit mission cards、Only evil-aligned roles may submit fail cards）
- [x] 4.7 實作 `calcMissionResult(room)` → 計算失敗牌數，套用 R4 雙失敗規則，廣播 MISSION_RESULT（涵蓋 Mission result calculation、Round 4 special rule requires two fails）
- [x] 4.8 實作 `checkWinCondition(room)` → 好人3勝→ASSASSINATION；壞人3勝→GAME_OVER；否則 round+1、leader 輪轉、→TEAM_PROPOSAL（涵蓋 Win condition after mission result、Win condition summary、Game phases）
- [x] 4.9 實作 `assassinate(room, assassinId, targetId)` → 驗證刺客身份（Not assassin），判斷是否猜中梅林，廣播含 `merlinWas` 的 GAME_OVER（涵蓋 Assassin guesses Merlin、Merlin identity revealed at game end）

## 5. WebSocket 訊息路由（server/index.js）

- [x] 5.1 建立 HTTP server，以 `fs` 提供 `client/` 目錄下靜態檔案（MIME type 需涵蓋 html/css/js）
- [x] 5.2 建立 WebSocket server，於連線建立時產生 UUID playerId 並記錄 ws→playerId 映射
- [x] 5.3 路由 `CREATE_ROOM` → `gameManager.createRoom()`（涵蓋 Create room）
- [x] 5.4 路由 `JOIN_ROOM` → `gameManager.joinRoom()`，廣播 LOBBY_STATE（涵蓋 Join room）
- [x] 5.5 路由 `START_GAME` → 驗證 host 身份（Not host）與人數（Insufficient players），呼叫 `gameEngine.assignRoles()`，廣播初始 GAME_STATE（涵蓋 Host starts game、GAME_STATE broadcast on every phase transition；設計決策：廣播 GAME_STATE 而非差異更新）
- [x] 5.6 路由 `PROPOSE_TEAM` → `gameEngine.proposeTeam()`（涵蓋 Leader nominates team）
- [x] 5.7 路由 `VOTE` → `gameEngine.submitVote()`（涵蓋 All players vote on proposed team）
- [x] 5.8 路由 `MISSION_CARD` → `gameEngine.submitMissionCard()`（涵蓋 Only team members submit mission cards）
- [x] 5.9 路由 `ASSASSINATE` → `gameEngine.assassinate()`（涵蓋 Assassination phase triggered after good team wins three missions）
- [x] 5.10 實作 WebSocket `close` 事件處理 → 呼叫 `gameManager` 斷線邏輯（涵蓋 Player disconnect handling）

## 6. 前端介面

- [x] 6.1 建立 `client/index.html`：含輸入玩家名稱欄位、「建立房間」按鈕、「加入房間」欄位與按鈕（設計決策：前端無框架，純 HTML/CSS/JS）
- [x] 6.2 建立 `client/game.html`：含玩家列表區、遊戲狀態區、角色資訊區、操作按鈕區、訊息通知區
- [x] 6.3 建立 `client/css/style.css`：基礎排版、好人藍色系/壞人紅色系色彩、手機友好的響應式設計
- [x] 6.4 建立 `client/js/client.js`：WebSocket 連線管理，訊息收發，以 `sessionStorage` 保存 playerId 與 roomCode，處理頁面跳轉（index→game）
- [x] 6.5 實作 `client/js/ui.js` `renderLobby(state)`：顯示玩家列表、房間碼、host 可見的角色設定與開始按鈕
- [x] 6.6 實作 `ui.js` `renderRoleReveal(roleInfo, players)`：顯示玩家自己的角色、可見資訊（knownEvil / suspects），含確認按鈕
- [x] 6.7 實作 `ui.js` `renderTeamProposal(state, myId)`：隊長看到可點選的玩家列表與提交按鈕；非隊長看到等待提示
- [x] 6.8 實作 `ui.js` `renderVote(state, myId)`：顯示提名隊伍，所有人看到同意/拒絕按鈕（涵蓋 All players vote on proposed team）
- [x] 6.9 實作 `ui.js` `renderVoteResult(result)`：顯示所有玩家的投票（同意/拒絕）與最終結果
- [x] 6.10 實作 `ui.js` `renderMission(state, myId)`：隊員看到成功牌（所有人）+ 失敗牌（僅壞人），非隊員看到等待提示（涵蓋 Only evil-aligned roles may submit fail cards）
- [x] 6.11 實作 `ui.js` `renderAssassination(state, myId)`：刺客看到所有好人玩家供選擇；其他人看到等待提示（涵蓋 Assassination phase triggered after good team wins three missions）
- [x] 6.12 實作 `ui.js` `renderGameOver(result)`：顯示勝負、梅林身份揭露（merlinWas）（涵蓋 Merlin identity revealed at game end）
- [x] 6.13 實作前端訊息分派：`client.js` 根據伺服器推送的 `type` 呼叫對應的 `ui.js` render 函式（涵蓋 GAME_STATE broadcast on every phase transition）
