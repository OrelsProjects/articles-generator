/**
 * Converts a Date to an AWS EventBridge Scheduler one-time cron expression in UTC.
 *
 * @param date The date/time at which you want the schedule to trigger (one-time).
 * @returns A cron expression like: cron(Minute Hour Day-of-month Month ? Year)
 */
export function getCronExpressionFromDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JS months are zero-based, cron wants 1-based
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

  return `cron(${minute} ${hour} ${day} ${month} ? ${year})`;
}
