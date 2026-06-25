const fs = require("fs");
const path = require("path");

let admin = null;
let initialized = false;

function initFirebase() {
  if (initialized) return;
  const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!svcPath || !fs.existsSync(path.resolve(svcPath))) {
    // eslint-disable-next-line no-console
    console.warn(
      "[push] No Firebase service account found — push notifications will be logged to console instead of actually sent. " +
        "Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to enable real push."
    );
    initialized = true;
    return;
  }
  admin = require("firebase-admin");
  const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(svcPath), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
}

/**
 * Sends a push notification to a user's device via FCM token.
 * Falls back to console logging if Firebase isn't configured (dev mode).
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  initFirebase();

  if (!fcmToken) return;

  if (!admin) {
    // eslint-disable-next-line no-console
    console.log(`[DEV PUSH] -> ${fcmToken}: ${title} - ${body}`);
    return;
  }

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[push] Failed to send notification:", err.message);
  }
}

module.exports = { sendPushNotification };
