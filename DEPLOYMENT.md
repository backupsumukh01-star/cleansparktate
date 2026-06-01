# Deploy Private Two-Person Chat

## Important: Vercel limitation

This app uses **Socket.io (WebSockets)**, **WebRTC calls**, and **in-memory storage**.  
**Vercel alone cannot run the full app** — it only hosts static frontends.

| Platform | What it runs | Chat works? |
|----------|--------------|-------------|
| **Vercel** | Frontend only | ❌ Needs separate backend |
| **Render / Railway / Docker VPS** | Full app (recommended) | ✅ |

---

## Option A — Full app on Render (recommended, free tier)

1. Push this repo to GitHub (done below).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect repo `backupsumukh01-star/cleansparktate`.
4. Settings:
   - **Runtime:** Docker
   - **Dockerfile path:** `./Dockerfile`
   - **Port:** `3001`
5. Add environment variables (same as `.env.example`):
   - `SITE_PASSWORD`
   - `SESSION_SECRET`
   - `COOKIE_SECURE=true`
   - `TELEGRAM_BOT_TOKEN_USER1`, `TELEGRAM_CHAT_ID_USER1`
   - `TELEGRAM_BOT_TOKEN_USER2`, `TELEGRAM_CHAT_ID_USER2`
6. Deploy → open your Render URL on two phones.

---

## Option B — Vercel (frontend) + Render (backend)

### Step 1 — Deploy backend on Render

Follow Option A. Note your backend URL, e.g.  
`https://cleansparktate.onrender.com`

On Render, set:

```env
CLIENT_ORIGIN=https://your-app.vercel.app
COOKIE_SECURE=true
NODE_ENV=production
```

### Step 2 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import `backupsumukh01-star/cleansparktate`.
3. Framework: **Other** (uses `vercel.json`).
4. Add **Environment Variables** (Production):

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://cleansparktate.onrender.com` |
| `VITE_SOCKET_URL` | `https://cleansparktate.onrender.com` |

5. Deploy.

### Step 3 — Update Render `CLIENT_ORIGIN`

After Vercel gives you a URL (e.g. `https://cleansparktate.vercel.app`), set on Render:

```env
CLIENT_ORIGIN=https://cleansparktate.vercel.app
```

Redeploy Render.

---

## Option C — Docker on any VPS

```bash
git clone https://github.com/backupsumukh01-star/cleansparktate.git
cd cleansparktate
cp .env.example .env
# edit .env
docker compose up -d
```

---

## Environment variables checklist

```env
SITE_PASSWORD=your-strong-password
SESSION_SECRET=random-32-char-string
NODE_ENV=production
PORT=3001
COOKIE_SECURE=true

TELEGRAM_BOT_TOKEN_USER1=
TELEGRAM_CHAT_ID_USER1=
TELEGRAM_BOT_TOKEN_USER2=
TELEGRAM_CHAT_ID_USER2=

# Only for split Vercel + backend deploy:
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

**Never commit `.env` to GitHub.**
