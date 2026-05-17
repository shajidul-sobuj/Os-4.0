import { differenceInDays, isSameDay, startOfDay } from "date-fns";

export function calculateNewStreak(
  currentStreak: number,
  lastCompletedDate: string | null,
  now: Date = new Date()
): { newStreak: number; newLastCompleted: string; isUpdated: boolean } {
  const today = startOfDay(now);
  
  if (!lastCompletedDate) {
    return {
      newStreak: 1,
      newLastCompleted: today.toISOString(),
      isUpdated: true
    };
  }

  const lastDate = startOfDay(new Date(lastCompletedDate));
  
  if (isSameDay(lastDate, today)) {
    // Already updated today, no change
    return {
      newStreak: currentStreak,
      newLastCompleted: lastCompletedDate,
      isUpdated: false
    };
  }

  const diff = differenceInDays(today, lastDate);

  if (diff === 1) {
    // Streak continues
    return {
      newStreak: currentStreak + 1,
      newLastCompleted: today.toISOString(),
      isUpdated: true
    };
  }

  // Streak broken
  return {
    newStreak: 1,
    newLastCompleted: today.toISOString(),
    isUpdated: true
  };
}
