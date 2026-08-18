import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
  type CustomerInfo,
} from '@revenuecat/purchases-capacitor';

// RevenueCat "public" API keys are safe to ship in client code — they can only
// start a purchase flow, never grant entitlements directly. Grab these from
// RevenueCat > Project settings > API keys (one per store app). The dashboard's
// "test_..." key works for sandbox testing; swap in the live keys before you
// submit to the App Store / Play Store.
const REVENUECAT_API_KEYS = {
  ios: 'test_qWHDFyGtfLCJWXHPfYdiZqvXCzv', // TODO: replace with your live App Store public key
  android: 'test_qWHDFyGtfLCJWXHPfYdiZqvXCzv', // TODO: replace with your live Play Store public key
};

// Must match the Entitlement identifier you create in the RevenueCat dashboard.
const PRO_ENTITLEMENT_ID = 'pro';

let configured = false;

/** Call once, as early as possible (before or independent of Firebase auth resolving). */
export async function initializePurchases(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // RevenueCat's native SDK only runs on iOS/Android. On web, "Pro" status is
    // read from the `isPro` flag in Firestore, which our webhook keeps in sync
    // after a purchase happens on a native device.
    return;
  }
  if (configured) return;

  const platform = Capacitor.getPlatform();
  const apiKey = platform === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey });
  configured = true;
}

/** Call once the Firebase user is known, so RevenueCat and Firestore agree on identity. */
export async function loginPurchasesUser(firebaseUid: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initializePurchases();
  await Purchases.logIn({ appUserID: firebaseUid });
}

/** Call on sign-out so the next login on this device doesn't inherit the previous user's entitlements. */
export async function logoutPurchasesUser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Purchases.logOut();
  } catch {
    // Throws if there's no logged-in RevenueCat user yet — safe to ignore.
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return isProEntitled(customerInfo);
}

export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { customerInfo } = await Purchases.restorePurchases();
  return isProEntitled(customerInfo);
}

export async function refreshEntitlement(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return isProEntitled(customerInfo);
}

function isProEntitled(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo?.entitlements?.active?.[PRO_ENTITLEMENT_ID]);
}
