const UNITS_EN: [number, string, string][] = [
  [60, 'second', 'seconds'],
  [60, 'minute', 'minutes'],
  [24, 'hour', 'hours'],
  [7, 'day', 'days'],
  [4.345, 'week', 'weeks'],
  [12, 'month', 'months'],
  [Infinity, 'year', 'years'],
];

const UNITS_HE: Record<string, [string, string, string]> = {
  second: ['לפני שנייה', 'לפני שנייתיים', 'לפני %d שניות'],
  minute: ['לפני דקה', 'לפני שתי דקות', 'לפני %d דקות'],
  hour: ['לפני שעה', 'לפני שעתיים', 'לפני %d שעות'],
  day: ['לפני יום', 'לפני יומיים', 'לפני %d ימים'],
  week: ['לפני שבוע', 'לפני שבועיים', 'לפני %d שבועות'],
  month: ['לפני חודש', 'לפני חודשיים', 'לפני %d חודשים'],
  year: ['לפני שנה', 'לפני שנתיים', 'לפני %d שנים'],
};

/**
 * Returns a human-readable relative-time string from an ISO date.
 * Falls back to the static `date` field when `isoDate` is missing/invalid.
 */
export function relativeDate(
  isoDate: string | undefined,
  fallback: string,
  isPrimary: boolean,
): string {
  if (!isoDate) return fallback;

  const diff = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(diff) || diff < 0) return fallback;

  let secs = Math.floor(diff / 1000);
  if (secs < 10) return isPrimary ? 'הרגע' : 'just now';

  for (const [divisor, singular, plural] of UNITS_EN) {
    if (secs < divisor) {
      const n = Math.floor(secs);

      if (isPrimary) {
        const [one, two, many] = UNITS_HE[singular];
        if (n === 1) return one;
        if (n === 2) return two;
        return many.replace('%d', String(n));
      }

      if (n === 1) return `a ${singular} ago`;
      return `${n} ${plural} ago`;
    }
    secs = Math.floor(secs / divisor);
  }

  return fallback;
}
