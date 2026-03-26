# FinTrack Deployment Guide

This document provides step-by-step instructions for deploying the **FinTrack** application.

- **Backend**: Deployed to [Render](https://render.com) using Docker.
- **Frontend**: Deployed to [Vercel](https://vercel.com).
- **Database**: PostgreSQL (Render, Supabase, or ElephantSQL).

---

## 1. Prerequisites
1.  A [GitHub](https://github.com) account with your FinTrack project pushed to a repository.
2.  A [Render](https://render.com) account.
3.  A [Vercel](https://vercel.com) account.

---

## 2. Step-by-Step Backend Deployment (Render)

### Phase A: Database Setup
1.  On Render, click **New** -> **PostgreSQL**.
2.  Give it a name (e.g., `fintrack-db`).
3.  Once created, copy the **Internal Database URL** (for Render services) or **External Database URL**.

### Phase B: API Service Setup
1.  Click **New** -> **Web Service**.
2.  Connect your GitHub repository.
3.  Give it a name (e.g., `fintrack-api`).
4.  **Root Directory**: `apps/backend`
5.  **Runtime**: `Docker`
6.  Click **Advanced** to add **Environment Variables**:
    *   `DATABASE_URL`: Paste your PostgreSQL connection string.
    *   `PORT`: `8080` (This matches our Docker EXPOSE).
7.  Click **Create Web Service**.
8.  **Wait** for the build to finish. Once done, copy your service URL (e.g., `https://fintrack-api.onrender.com`).

---

## 3. Step-by-Step Frontend Deployment (Vercel)

### Phase A: Update Configuration
1.  Open `apps/frontend/vercel.json` in your editor.
2.  Update the `destination` field with your **actual** Render API URL:
    ```json
    {
      "source": "/api/(.*)",
      "destination": "https://fintrack-api.onrender.com/api/$1"
    }
    ```
3.  Commit and push this change to GitHub.

### Phase B: Deploy to Vercel
1.  On Vercel, click **Add New** -> **Project**.
2.  Import your GitHub repository.
3.  **Project Name**: `fintrack-ui`
4.  **Root Directory**: `apps/frontend`
5.  **Framework Preset**: `Vite`
6.  **Build and Output Settings**:
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
7.  **Environment Variables**:
    *   `VITE_API_BASE_URL`: (Optional) If you want to bypass the proxy, paste your Render URL. Otherwise, leave it blank to use the `vercel.json` rewrite.
8.  Click **Deploy**.

---

## 4. Verification
1.  Visit your Vercel URL.
2.  Open the Network tab in Chrome DevTools (F12).
3.  Try to add a category or fetch transactions.
4.  Ensure requests to `/api/...` are returning `200 OK` from your Render backend.

---

## 5. Maintenance
- **Backend Logs**: Check Render's "Logs" tab for Go panics or database connection errors.
- **Graceful Shutdown**: When you deploy a new version, the existing instance will wait up to 10 seconds for active transactions to finish before closing.
- **Database Migrations**: The Dockerfile automatically bundles migrations; they run every time a new instance starts.
