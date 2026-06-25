# Luvly Production Launch Checklist

Use this file as the plain-English launch path for Play Store and App Store.

## Accounts you must create

- Google Play Console developer account.
- Apple Developer Program account.
- RevenueCat account for mobile subscriptions.
- Hosted PostgreSQL database account, such as Neon or Supabase.
- Backend hosting account, such as Render, Railway, AWS, or DigitalOcean.
- Cloudinary account for profile photos.
- Twilio, MSG91, or Firebase Auth account for real phone OTP.
- Resend account plus verified domain for real email OTP.

## Mobile subscription setup

1. In Google Play Console, create monthly and yearly subscription products.
2. In App Store Connect, create matching monthly and yearly subscription products.
3. In RevenueCat, connect both Android and iOS apps.
4. In RevenueCat, create an entitlement named `premium`.
5. In RevenueCat, create an offering that contains monthly and yearly packages.
6. Put RevenueCat public SDK keys into `frontend/.env`.
7. Put RevenueCat secret API key into `backend/.env`.

## Environment variables

Frontend:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_REVENUECAT_ANDROID_API_KEY=your_android_public_key
VITE_REVENUECAT_IOS_API_KEY=your_ios_public_key
VITE_REVENUECAT_ENTITLEMENT_ID=premium
```

Backend:

```env
DATABASE_URL=your_hosted_postgres_url
JWT_SECRET=your_long_random_secret
CLIENT_URL=https://your-frontend-domain.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
RESEND_API_KEY=...
OTP_FROM_EMAIL=Luvly <otp@yourdomain.com>
REVENUECAT_SECRET_API_KEY=...
REVENUECAT_ENTITLEMENT_ID=premium
```

## Build commands

Backend database:

```powershell
cd C:\Dating_app\backend
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Android:

```powershell
cd C:\Dating_app\frontend
npm.cmd run build
npx.cmd cap sync android
npx.cmd cap open android
```

iOS, on a Mac:

```bash
cd frontend
npm run build
npx cap sync ios
npx cap open ios
```

## Store review requirements

- Privacy Policy URL.
- Terms and Conditions URL.
- Delete account feature.
- Report and block users.
- Moderation process for dating/safety reports.
- Accurate subscription pricing and trial disclosure.
- Screenshots for each device size.
- App icon and splash screen.

## Current code status

- RevenueCat SDK is installed and connected in the app.
- Mobile store purchase path is wired for native Android/iOS builds.
- Browser development still uses the local trial fallback.
- Email OTP can use Resend when configured.
- Phone OTP can use Twilio when configured.
