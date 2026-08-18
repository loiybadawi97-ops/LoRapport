import { getFirestore, DocumentData } from "firebase-admin/firestore";

export type DailyField = "dailyChats" | "dailyExercises" | "dailyChallenges";

// Free-tier daily allowances. Keep these in sync with the copy in
// src/components/Dashboard.tsx's "Daily Limits" card.
const FREE_LIMITS: Record<DailyField, number> = {
  dailyChats: 3,
  dailyExercises: 1,
  dailyChallenges: 3,
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

interface UsageSnapshot {
  isPro: boolean;
  counters: Record<DailyField, number>;
  isNewDay: boolean;
}

function readUsage(data: DocumentData | undefined): UsageSnapshot {
  const d = data || {};
  const isNewDay = d.lastUsageResetDate !== todayStr();
  const counters: Record<DailyField, number> = isNewDay
    ? { dailyChats: 0, dailyExercises: 0, dailyChallenges: 0 }
    : {
        dailyChats: d.dailyChats || 0,
        dailyExercises: d.dailyExercises || 0,
        dailyChallenges: d.dailyChallenges || 0,
      };
  return { isPro: Boolean(d.isPro), counters, isNewDay };
}

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

/**
 * The single gate every metered AI endpoint calls before doing paid work.
 *
 * Why this exists: the client previously tracked dailyChats/dailyExercises/
 * dailyChallenges itself and only checked them before *starting* an action —
 * nothing ever reset them (so free users hit a permanent wall after their
 * first day), and nothing stopped a user from calling the API directly and
 * skipping the client-side check entirely. This function is the only place
 * usage is now authoritative: it reads Firestore via the Admin SDK (which
 * bypasses firestore.rules — that's fine, this runs after verifyToken has
 * already authenticated the caller), resets all three counters exactly once
 * per UTC calendar day, and atomically checks-and-increments inside a
 * transaction so concurrent requests can't race past the limit.
 *
 * Returns the server-verified isPro flag — callers should use THIS, not
 * req.body.isPro, when deciding which model tier to call.
 */
export async function enforceUsage(uid: string, field: DailyField): Promise<{ isPro: boolean }> {
  const userRef = getFirestore().doc(`users/${uid}`);
  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const { isPro, counters } = readUsage(snap.exists ? snap.data() : undefined);

    if (!isPro && counters[field] >= FREE_LIMITS[field]) {
      // Persist the reset even on rejection, so the client's next read shows
      // today's fresh count instead of a stale one from a previous day.
      tx.set(userRef, { lastUsageResetDate: todayStr(), ...counters }, { merge: true });
      throw new UsageLimitError(
        `Daily limit reached (${FREE_LIMITS[field]}/day on the free plan). Upgrade to Pro for unlimited access.`
      );
    }

    tx.set(
      userRef,
      { lastUsageResetDate: todayStr(), ...counters, [field]: counters[field] + 1 },
      { merge: true }
    );
    return { isPro };
  });
}

/** Read-only, server-verified isPro for AI endpoints that aren't daily-capped. */
export async function getVerifiedIsPro(uid: string): Promise<boolean> {
  const snap = await getFirestore().doc(`users/${uid}`).get();
  return Boolean(snap.exists && snap.data()?.isPro);
}

/**
 * Non-consuming version of the same reset. The client calls this once when
 * the app loads (see POST /api/usage/sync) so the Dashboard's "Daily Limits"
 * card shows fresh 0-based counts immediately on a new day, instead of
 * waiting for the user's first AI call to trigger the reset.
 */
export async function syncDailyUsage(uid: string): Promise<void> {
  const userRef = getFirestore().doc(`users/${uid}`);
  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const { counters, isNewDay } = readUsage(snap.data());
    if (isNewDay) {
      tx.set(userRef, { lastUsageResetDate: todayStr(), ...counters }, { merge: true });
    }
  });
}
