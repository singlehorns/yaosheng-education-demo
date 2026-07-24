# 耀升招生與教務管理平台 Demo

公開展示網址：
https://singlehorns.github.io/yaosheng-education-demo/

本專案為 V1 求職展示版，用來呈現招生、學生、老師、
課程、班級與角色權限之間的作業流程。

目前資料使用 localStorage 與 sessionStorage，
不可儲存真實學生個資、正式帳號或密碼。

# 珠心學苑＋招生與教務管理平台 Demo

這是一個自助式求職 Demo，用來展示補習班從公開招生表單、招生名單追蹤、正式學生管理，到老師、課程、班級、學生分班與角色權限入口的完整流程。

公開入口為 `index.html`。面試官打開後可以一鍵建立範例資料，直接選擇不同角色進入對應頁面操作。

## Demo 資料

首頁提供「一鍵建立完整 Demo 資料」與「重置 Demo 資料」。

資料只會存在目前瀏覽器的 `localStorage` / `sessionStorage`，不會送到正式資料庫，也不會跨裝置同步。不同瀏覽器、裝置或無痕視窗會有各自獨立的 Demo 資料。

重置時只清除本專案使用的 `yaosheng_demo_*` key，不會使用 `localStorage.clear()`。

## 預設角色帳號

| 角色 | Email | Demo PIN | 入口 |
| --- | --- | --- | --- |
| 管理員 | `admin@demo.local` | `1111` | `dashboard.html` |
| 招生人員 | `admissions@demo.local` | `2222` | `dashboard.html` |
| 老師 | `teacher@demo.local` | `3333` | `teacher-portal.html` |
| 學生 | `student@demo.local` | `4444` | `student-portal.html` |

首頁角色卡會自動使用上述 Demo 帳號快速登入。`login.html` 也保留手動輸入 Email 與 PIN 的流程。

## 預設範例資料

- 招生名單：林家長，新名單，需求為計算速度與專注力。
- 招生名單：王家長，已報名，已轉成正式學生。
- 正式學生：小娟，國小五年級，在學。
- 老師：陳老師，專長為珠算基礎與心算訓練。
- 課程：珠心算初階班，狀態為招生中。
- 班級：初階班－週六上午 A 班，星期六 09:00 到 10:30，上課中。
- 分班：小娟 active 加入初階班－週六上午 A 班。

固定 Demo ID 使用：

- `DEMO-LEAD-001`
- `DEMO-LEAD-002`
- `DEMO-STU-001`
- `DEMO-TCH-001`
- `DEMO-CRS-001`
- `DEMO-CLS-001`
- `DEMO-ENR-001`

## 各角色可操作內容

家長／學生：

- 填寫課程需求。
- 建立招生名單。

招生人員：

- 查看新名單。
- 指派負責人。
- 更新聯絡狀態。
- 設定追蹤時間。
- 將已報名名單轉成正式學生。

系統管理員：

- 管理學生、老師與課程。
- 開設班級。
- 指派老師。
- 安排學生進入班級。
- 管理 Demo 帳號。

老師：

- 查看自己的班級。
- 查看自己班級的學生。
- 不可查看其他老師班級。

學生：

- 查看自己的班級。
- 查看授課老師。
- 查看上課時間。
- 不可查看其他學生資料。

## 建議測試流程

1. 開啟 `index.html`。
2. 點擊「一鍵建立完整 Demo 資料」。
3. 以家長／學生身分進入 `ailead-demo.html` 新增一筆諮詢。
4. 回到 `index.html`，以招生人員身分進入儀表板與 `leads.html` 查看新名單。
5. 回到 `index.html`，以管理員身分查看學生、老師、課程與班級。
6. 回到 `index.html`，以老師身分查看自己的班級學生。
7. 回到 `index.html`，以學生身分查看自己的上課資訊。
8. 點擊「重置 Demo 資料」恢復預設展示狀態。

## GitHub Pages 部署

本專案是靜態 HTML / CSS / JavaScript，可直接部署到 GitHub Pages。

建議做法：

1. 將整個專案推到 GitHub repository。
2. 在 GitHub repository 的 Pages 設定中選擇要發布的 branch。
3. 發布後從 Pages 網址開啟 `index.html`。

所有頁面都使用實際 `.html` 檔案與相對路徑連結，不依賴伺服器 rewrite 規則。

## Demo 限制

這是前端求職 Demo，不是正式安全系統。

- Demo 登入與角色權限只存在瀏覽器端。
- Demo PIN 不是正式密碼。
- localStorage 不適合存放真實個資或正式帳號資料。
- 正式上線仍需 Supabase Auth、PostgreSQL、Row Level Security、後端驗證、稽核紀錄與個資保護流程。

請勿在此 Demo 輸入真實帳號、密碼或學生個資。
