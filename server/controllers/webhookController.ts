import { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";

// Set the SAME value as the "Authorization header value" in RevenueCat's
// dashboard (Project Settings > Integrations > Webhooks), and store it here as
// REVENUECAT_WEBHOOK_SECRET in your server environment. This is how we verify
// a request claiming to be RevenueCat actually is — never trust the payload alone.
const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

// Event types that should grant/renew Pro access.
const ENTITLEMENT_GRANTING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
]);

// Event types that should revoke Pro access.
const ENTITLEMENT_REVOKING_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
]);

// This is the ONLY place isPro should ever be written. It runs with the Firebase
// Admin SDK, which bypasses firestore.rules entirely — that's intentional and safe
// here because the request is authenticated via the shared secret above, not by a
// user's own ID token. Client code (see Paywall.tsx) can never set isPro directly;
// firestore.rules explicitly blocks that for non-admins.
export const revenueCatWebhookHandler = async (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET) {
    console.error("REVENUECAT_WEBHOOK_SECRET is not configured — refusing all webhook traffic.");
    return res.status(500).json({ error: "Webhook not configured." });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const event = req.body?.event;
    const eventType: string | undefined = event?.type;
    // RevenueCat's app_user_id equals the Firebase uid, because the client calls
    // Purchases.logIn({ appUserID: firebaseUid }) right after Firebase auth resolves
    // (see loginPurchasesUser in src/services/purchasesService.ts).
    const firebaseUid: string | undefined = event?.app_user_id;

    if (!eventType || !firebaseUid) {
      return res.status(400).json({ error: "Malformed webhook payload." });
    }

    if (ENTITLEMENT_GRANTING_EVENTS.has(eventType)) {
      await getFirestore().doc(`users/${firebaseUid}`).set({ isPro: true }, { merge: true });
    } else if (ENTITLEMENT_REVOKING_EVENTS.has(eventType)) {
      await getFirestore().doc(`users/${firebaseUid}`).set({ isPro: false }, { merge: true });
    }
    // Other event types (TRANSFER, TEST, SUBSCRIPTION_PAUSED, etc.) are accepted
    // but intentionally don't change entitlement here — extend as needed.

    res.status(200).json({ received: true });
  } catch (e: any) {
    console.error("RevenueCat webhook error:", e);
    // Return 500 so RevenueCat retries delivery instead of silently dropping the event.
    res.status(500).json({ error: "Webhook processing failed." });
  }
};
