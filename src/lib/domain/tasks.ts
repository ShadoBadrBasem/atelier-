export type Recurrence = "daily" | "weekly" | "monthly";

/** Next due date for a recurring task, always strictly after `from` (catches up missed periods). */
export function nextDue(due: Date, recurrence: Recurrence, from: Date = due): Date {
  const next = new Date(due);
  const step = () => {
    if (recurrence === "daily") next.setUTCDate(next.getUTCDate() + 1);
    else if (recurrence === "weekly") next.setUTCDate(next.getUTCDate() + 7);
    else {
      const day = due.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + 1);
      const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(day, last));
    }
  };
  do step(); while (next <= from);
  return next;
}
