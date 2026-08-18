import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ActivityAwardResult {
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
  streakExtended: boolean;
}

/**
 * The single place that awards XP for a completed activity — a finished chat
 * session, a voice recording analyzed, a speaking challenge, a library
 * challenge. Before this existed, four different components each hand-rolled
 * their own "xp + level" math (one of them — Library — forgot to recompute
 * `level` at all, so a level-up earned purely from Library challenges never
 * showed up), and only Voice Exercises updated the daily streak. That meant
 * chatting or doing challenges every day still let your streak lapse, which
 * undercuts the whole point of a streak. Every activity now goes through
 * here, so XP, level, and streak stay consistent everywhere.
 */
export async function awardActivityXp(
  uid: string,
  xpAmount: number,
  opts: { countsForStreak?: boolean } = {}
): Promise<ActivityAwardResult | null> {
  const { countsForStreak = true } = opts;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  const currentXp = data.xp || 0;
  const newXp = currentXp + xpAmount;
  const currentLevel = data.level || 1;
  const newLevel = Math.floor(newXp / 1000) + 1;

  const update: Record<string, any> = { xp: newXp, level: newLevel };

  let newStreak = data.streak || 0;
  let streakExtended = false;

  if (countsForStreak) {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = data.lastStreakDate;
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      newStreak = lastDate === yesterdayStr ? newStreak + 1 : 1;
      streakExtended = true;
      update.streak = newStreak;
      update.lastStreakDate = today;
    }
  }

  await updateDoc(userRef, update);

  return {
    newXp,
    newLevel,
    leveledUp: newLevel > currentLevel,
    newStreak,
    streakExtended,
  };
}
