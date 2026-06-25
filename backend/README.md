# Dating App Backend (India-focused)

A Node.js + Express + PostgreSQL (Prisma) backend built to pair with the
existing React/Vite frontend in the `frontend/` (or root) folder of this project.

## Covers

| # | Feature | How |
|---|---|---|
| 1 | Backend API | Express, REST under `/api/*` |
| 2 | Database | PostgreSQL via Prisma ORM |
| 3 | Authentication | JWT + Phone/OTP, optional email/password |
| 4 | Real-time chat | Socket.io (`src/sockets/chatSocket.js`) |
| 5 | Payments (Premium) | Razorpay, INR plans |
| 6 | Image/video storage | Cloudinary |
| 7 | Matching algorithm | `src/utils/matching.js` — interests + distance + age + trust score |
| 8 | Push notifications | Firebase Cloud Messaging |
| 9 | Phone + OTP login | Twilio Verify (falls back to console OTP in dev) |
| 10 | Verification badges | Selfie upload + review endpoint |
| 11 | Interest-based matching | Music/movies/religion/education tags, weighted scoring |
| 12 | Safety (block/report) | `src/controllers/reportController.js` |
| 13 | Regional language | `src/utils/i18n.js`, `en`/`hi` JSON files, easy to extend |
| 14 | INR subscriptions | ₹99 / ₹249 / ₹499 plans via Razorpay |

## 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally or hosted (e.g. Supabase, Railway, Neon)
- Free accounts for: Twilio (OTP), Razorpay (payments), Cloudinary (media), Firebase (push) —
  **the app runs without these in dev mode** (it logs OTPs/pushes to the console
  instead of sending real SMS/push), but you'll need them for production.

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: at minimum set DATABASE_URL and JWT_SECRET

npx prisma migrate dev --name init
node prisma/seed.js          # seeds interest tags (Bollywood, Cricket, etc.)
npm run dev                  # starts on http://localhost:5000
```

## 3. Connecting the frontend

In your React app, set the API base URL (e.g. in a `.env` as `VITE_API_URL=http://localhost:5000/api`)
and call endpoints like:

```js
// Request OTP
await fetch(`${API_URL}/auth/request-otp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "9876543210" }),
});

// Verify OTP -> get JWT
const res = await fetch(`${API_URL}/auth/verify-otp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "9876543210", code: "123456" }),
});
const { token } = await res.json();
// Store token, then send `Authorization: Bearer <token>` on every request after.
```

For chat, connect Socket.io with the same JWT:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", { auth: { token } });
socket.emit("join_match", matchId);
socket.emit("send_message", { matchId, content: "Hey!" });
socket.on("new_message", (msg) => console.log(msg));
```

## 4. Key API routes

- `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`
- `GET/PUT /api/profile/me`, `PUT /api/profile/interests`
- `POST /api/profile/photos`, `POST /api/profile/verify-selfie`
- `GET /api/match/discover`, `POST /api/match/like`, `GET /api/match/matches`
- `GET /api/chat/:matchId/messages` (history; live messages via sockets)
- `GET /api/payment/plans`, `POST /api/payment/create-order`, `POST /api/payment/verify`
- `POST /api/safety/block`, `POST /api/safety/report`

## 5. What you still need to do before launch

- Add an **admin role** and protect the verification/report-review endpoints
  (currently marked `// TODO` — anyone with a valid JWT can hit them right now).
- Add real face-match verification (AWS Rekognition / Azure Face) if you want
  automated selfie verification instead of manual review.
- Add DPDP Act (India's data protection law) compliant consent flows for
  location, photos, and religion/interest data — these are sensitive fields.
- Load-test the matching query (`getDiscoverFeed`) — it currently pulls 200
  candidates per request; add geo-indexing (PostGIS) once you have real users.
- Set up HTTPS, proper CORS origins, and environment secrets in production
  (don't reuse `.env` values from development).
