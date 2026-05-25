# ⚡ TaskFlow — Simple Task Manager

A lightweight task manager built with **Node.js + Express**, zero database — all tasks stored in a `Map` in memory.  
Deploy-ready for **Render** (free tier) with a full **GitHub Actions CI/CD pipeline**.

---

## Features

- ✅ Create, Read, Update, Delete tasks
- 🎯 Priority levels: High / Medium / Low
- 📊 Status columns: To Do / In Progress / Done
- 🏷️ Tags support
- 📅 Due dates with overdue highlighting
- 🔍 Search + filter by status & priority
- ⊞ Board view + ☰ List view
- 📈 Live stats dashboard
- 🔔 Toast notifications
- 📋 Task detail side panel

---

## Run Locally

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager

# 2. Install
npm install

# 3. Start
npm run dev       # development (nodemon)
npm start         # production
```

Open → http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks?status=todo&priority=high&search=api` | Filter tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/stats` | Get task counts |
| GET | `/health` | Health check |

### Create Task — Request Body
```json
{
  "title": "Build the UI",
  "description": "Create a beautiful interface",
  "status": "todo",
  "priority": "high",
  "dueDate": "2025-12-31",
  "tags": ["frontend", "ui"]
}
```

---

## Deploy to Render (Free)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial task manager"
git remote add origin https://github.com/YOUR_USERNAME/task-manager.git
git push -u origin main
```

### 2. Create Render Web Service
1. Go to → https://render.com and sign up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in:
   | Field | Value |
   |-------|-------|
   | **Name** | task-manager |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |
5. Click **Create Web Service**
6. Render gives you a URL like `https://task-manager-xxxx.onrender.com`

### 3. Get Render API credentials
1. Go to **Account Settings → API Keys** → create a key → copy it
2. On your service page, copy the **Service ID** from the URL:  
   `https://dashboard.render.com/web/srv-XXXXXXXXXX` ← that part

### 4. Add GitHub Secrets
Go to your repo → **Settings → Secrets → Actions → New repository secret**:

| Secret Name | Value |
|-------------|-------|
| `RENDER_API_KEY` | Your Render API key |
| `RENDER_SERVICE_ID` | `srv-XXXXXXXXXX` |
| `RENDER_APP_URL` | `https://task-manager-xxxx.onrender.com` |

### 5. Push and watch it deploy!
```bash
git push origin main
# → GitHub Actions runs: Test → Deploy → Health Check ✅
```

---

## CI/CD Pipeline

```
Push to main
     │
     ▼
┌─────────────┐
│  🧪 Test     │  Install deps + npm test + health check /health
└──────┬──────┘
       │ passes
       ▼
┌─────────────┐
│ 🚀 Deploy   │  POST to Render API → triggers new deploy
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ✅ Verify   │  Wait 60s → curl /health → confirm 200 OK
└─────────────┘
```

PRs to main → run tests only, no deploy.

---

## Project Structure

```
task-manager/
├── src/
│   └── server.js          ← Express app + all routes
├── public/
│   └── index.html         ← Full frontend (HTML/CSS/JS)
├── .github/
│   └── workflows/
│       └── ci-cd.yml      ← GitHub Actions pipeline
├── package.json
└── .gitignore
```

---

## Notes

> ⚠️ **In-memory storage**: all tasks reset when the server restarts.  
> This is intentional for simplicity. To persist data, swap the `Map` for a JSON file or MongoDB.

> 💤 **Render free tier** spins down after 15 min of inactivity. First request after sleep takes ~30s.
