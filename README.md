# Private Two-Person Chat

A mobile-first private chat website for exactly **two users**. WhatsApp-inspired UI with real-time messaging, WebRTC voice/video calls, in-memory storage, and Telegram privacy notifications.

## Features

- Shared password authentication (no registration)
- Real-time messaging via Socket.io
- Typing indicators, online status, last seen, read receipts
- Reply, delete for everyone, copy text
- Emoji picker, images, videos, voice notes
- WebRTC voice and video calls
- Telegram notifications (random privacy messages — no message content)
- Browser notifications when tab is in background
- PWA installable on Android
- In-memory storage only (messages reset on server restart)
- Latest 1000 messages retained
- Media auto-expires after 24 hours
- Docker self-hosting

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, TailwindCSS, Socket.io Client |
| Backend | Node.js, Express, Socket.io |
| Calls | WebRTC |
| Notifications | Telegram Bot API, Web Notifications API |

## Project Structure

```
private-two-person-chat/
├── client/          # React frontend
├── server/          # Express + Socket.io backend
├── shared/          # Shared constants & notification messages
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `SITE_PASSWORD` | Yes | Shared password both users enter |
| `SESSION_SECRET` | Yes | Random string (32+ chars) for session cookies |
| `PORT` | No | Server port (default: `3001`) |
| `NODE_ENV` | No | `production` or `development` |
| `TELEGRAM_BOT_TOKEN_USER1` | No | Bot token for Person 1’s notifications |
| `TELEGRAM_CHAT_ID_USER1` | No | Person 1’s Telegram chat ID |
| `TELEGRAM_BOT_TOKEN_USER2` | No | Bot token for Person 2’s notifications |
| `TELEGRAM_CHAT_ID_USER2` | No | Person 2’s Telegram chat ID |
| `CLIENT_ORIGIN` | No | Frontend URL if different origin (CORS) |

## Running Locally

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd private-two-person-chat
cp .env.example .env
# Edit .env — set SITE_PASSWORD and SESSION_SECRET

npm run install:all
```

### Development (two terminals)

**Terminal 1 — API & WebSocket:**

```bash
npm run dev:server
```

**Terminal 2 — Frontend:**

```bash
npm run dev:client
```

Open **http://localhost:5173** on two phones/browsers. Enter the same password on each — you become User 1 and User 2.

### Production (single process)

```bash
npm run build
NODE_ENV=production npm start
```

Open **http://localhost:3001**

## Docker Deployment

```bash
cp .env.example .env
# Edit .env with your secrets

docker compose build
docker compose up -d
```

App runs at **http://localhost:3001**

## Production Deployment

1. Use HTTPS (required for WebRTC, notifications, secure cookies).
2. Set `NODE_ENV=production`.
3. Use a strong `SITE_PASSWORD` and `SESSION_SECRET`.
4. Put Nginx/Caddy in front with SSL termination.
5. Configure Telegram for offline notifications.

Example Nginx proxy:

```nginx
server {
    listen 443 ssl;
    server_name chat.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Telegram Setup (Two Bots — One Per Person)

Each person creates **their own bot**. When the other person messages while they are offline, **only they** get a Telegram alert on their phone.

| Person | Logs in as | Gets Telegram when… | `.env` variables |
|--------|------------|------------------------|------------------|
| Person 1 | `user1` (first login) | Person 2 messages & Person 1 is offline | `TELEGRAM_BOT_TOKEN_USER1`, `TELEGRAM_CHAT_ID_USER1` |
| Person 2 | `user2` (second login) | Person 1 messages & Person 2 is offline | `TELEGRAM_BOT_TOKEN_USER2`, `TELEGRAM_CHAT_ID_USER2` |

### Step 1 — Person 1 creates a bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot` → name it e.g. `My Private Chat Alerts`.
3. Copy the **token** (looks like `7123456789:AAH...`).
4. Tap **Start** on your new bot and send any message (e.g. `hi`).
5. Open in browser (replace `YOUR_TOKEN`):

   `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

6. Find `"chat":{"id":123456789}` — that number is the **chat ID**.

Add to `.env`:

```env
TELEGRAM_BOT_TOKEN_USER1=7123456789:AAHxxxxxxxx
TELEGRAM_CHAT_ID_USER1=123456789
```

### Step 2 — Person 2 creates a separate bot

Repeat the same steps on **Person 2’s Telegram account** with a **different** bot name.

Add to `.env`:

```env
TELEGRAM_BOT_TOKEN_USER2=7987654321:BBByyyyyyyyy
TELEGRAM_CHAT_ID_USER2=987654321
```

### Step 3 — Restart the server

```bash
# Ctrl+C then:
npm run dev:server
```

### Example `.env` (Telegram section)

```env
TELEGRAM_BOT_TOKEN_USER1=111:AAA-person1-bot-token
TELEGRAM_CHAT_ID_USER1=111111111

TELEGRAM_BOT_TOKEN_USER2=222:BBB-person2-bot-token
TELEGRAM_CHAT_ID_USER2=222222222
```

### How it works

- **No message text** is sent to Telegram — only a random privacy phrase (50+ templates).
- **Telegram** fires when the recipient is offline (app closed / no connection).
- **Browser notification** fires when the app is open but the tab is in the background.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| No Telegram alert | Recipient must be **offline** in chat. Test by closing the app on their phone. |
| `chat not found` | Person must press **Start** on their bot and send a message first. |
| Wrong person notified | First login = `user1`, second = `user2`. Swap `_USER1` / `_USER2` in `.env` if needed. |
| Still not working | Check server logs for `Telegram notification failed`. Token/chat ID must match the same bot. |

## Security

- Password compared with bcrypt
- HTTP-only secure session cookies
- Helmet security headers
- Rate limiting on login and API
- Input sanitization (XSS protection)
- File type and size validation

## Storage Notes

- All messages and media live in **server RAM only**
- Server restart clears everything
- Max **1000 messages** kept
- Media files expire after **24 hours**

## PWA Install (Android)

1. Open the site in Chrome.
2. Tap menu → **Add to Home screen** / **Install app**.
3. Launch from home screen like a native app.

## License

MIT
