# Task Management Web App UI

UI bundle based on [Task Management Web App UI (Figma)](https://www.figma.com/design/RiuKBAoqfLcLohrc9DghGe/Task-Management-Web-App-UI).

## Prerequisites

- **Node.js** (for frontend + API)
- **MongoDB** reachable from your machine:
  - **Local:** install MongoDB Community or run it in Docker; default URI is `mongodb://127.0.0.1:27017/taskflow`.
  - **Atlas:** create a cluster, user, and network access (allow your IP or `0.0.0.0/0` for testing). Put the connection string in `backend/.env` as `MONGODB_URI` (see `backend/.env.example`).

The API **exits on startup** if it cannot connect to MongoDB.

### `backend/.env`

Create `backend/.env` from `backend/.env.example`. The server loads this file from the **backend** folder even if you start Node from another directory.

### Frontend API URL (optional)

With **`npm run dev`**, `/api` is proxied to `http://localhost:4000`.

If you open a **production build** or run Vite without the proxy, set in the project root:

```bash
# .env.local (Vite)
VITE_API_BASE_URL=http://localhost:4000
```

## Run locally (two terminals)

1. **Backend** (from repo root):

   ```bash
   cd backend
   npm install
   npm start
   ```

   Optional: copy `backend/.env.example` to `backend/.env` and edit `MONGODB_URI`, `JWT_SECRET`.

   Or from repo root: `npm run dev:backend`

2. **Frontend** (repo root):

   ```bash
   npm install
   npm run dev
   ```

   Open the URL Vite prints (e.g. `http://localhost:5173`). The dev server proxies `/api` to `http://localhost:4000`.

## First-time setup

1. On the login screen, use **First time? Create the manager account** (or go to `/setup`).
2. Sign in as **Manager** with that email and password.
3. Go to **Employees → Add employee** so people can sign in as **Employee**.

All tasks, leave requests, and profiles are stored in MongoDB.

## Build frontend only

```bash
npm run build
```
