# Dating App — Full Project (India)

```
project/
├── frontend/   <- React/Vite UI, now wired to the real backend
└── backend/    <- Node.js/Express + PostgreSQL backend
```

The frontend and backend are now connected. Login, the swipe deck, matches,
and chat all talk to the real API instead of using mock data. Premium
payments, photo verification, and the settings screens are still mock —
see "What's still mock" below.

## 1. One-time setup

### a) Get a free PostgreSQL database
The easiest option for beginners is a free hosted database — no local
install needed:
1. Go to https://neon.tech (or https://supabase.com / https://railway.app),
   sign up free, create a project.
2. Copy the connection string it gives you (looks like
   `postgresql://user:pass@host/dbname?sslmode=require`).

### b) Get a free Cloudinary account (for profile photos)
Photos won't upload without this. It's free and takes ~2 minutes:
1. Go to https://cloudinary.com/users/register/free
2. After signing up, copy your **Cloud name**, **API Key**, and **API Secret**
   from the dashboard.

### c) Configure the backend
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and fill in:
- `DATABASE_URL` — your Neon/Supabase connection string from step (a)
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from step (b)

Leave `TWILIO_*` blank — in dev mode, OTP codes are printed to your backend
terminal instead of sent by SMS, so you don't need a Twilio account to test.

```bash
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev             # http://localhost:5000
```

### d) Configure the frontend
```bash
cd frontend
npm install
cp .env.example .env    # defaults already point at localhost:5000, no edits needed
npm run dev              # http://localhost:5173
```

## 2. Try it out

1. Open `http://localhost:5173` in your browser.
2. Enter a phone number (any 10 digits, e.g. `9876543210`) and tap **Send code**.
3. Check the **backend terminal** — it prints `[DEV OTP] Phone: ... -> Code: 123456`.
4. Enter that code to log in. New numbers get walked through profile setup.
5. To see a real match + real-time chat, repeat steps 2–4 in an **incognito
   window** with a different phone number, then like each other's profile
   from the Discover tab.

## 3. What's still mock (not wired to the backend yet)

- Premium/Razorpay payments (`PremiumModal`) — upgrading just flips a local flag
- Photo upload UI (`PhotoVideoUpload`, `EditProfileModal`) — backend endpoint exists
  (`POST /api/profile/photos`) but isn't called from the UI yet
- Settings screens (change password/email/phone, terms) — local only
- Report/block — UI exists, not calling `/api/safety/*` yet
- `SignupPage.tsx` is no longer used — phone+OTP login auto-creates new accounts

## 4. Known security gap (backend README also flags this)

The verification-review and similar admin endpoints have no admin-role
check yet — any logged-in user's token can currently call them. Fix this
before letting real users sign up.

See **`backend/README.md`** for the full API reference and feature list.
