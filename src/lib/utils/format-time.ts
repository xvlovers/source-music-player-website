/**
 * Formats seconds as "m:ss", or "h:mm:ss" from one hour up.
 * Invalid input (null, undefined, NaN, Infinity) and negative values
 * are treated as 0. Fractions are floored, so 59.9 becomes "0:59".
 */
export function formatTime(seconds: number | null | undefined): string {
  const total =
    seconds !== null &&
    seconds !== undefined &&
    Number.isFinite(seconds) &&
    seconds > 0
      ? Math.floor(seconds)
      : 0;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const ss = String(secs).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }

  return `${minutes}:${ss}`;
}
