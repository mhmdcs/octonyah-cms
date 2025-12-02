/**
 * Parses an ISO 8601 duration string to seconds.
 * YouTube API returns duration in this format (e.g., "PT1H2M30S").
 *
 * Format: PT[n]H[n]M[n]S
 * - PT prefix is required
 * - H = hours, M = minutes, S = seconds
 * - Each component is optional
 *
 * @example
 * parseIso8601DurationToSeconds("PT1H2M30S") // 3750
 * parseIso8601DurationToSeconds("PT15M")     // 900
 * parseIso8601DurationToSeconds("PT30S")     // 30
 * parseIso8601DurationToSeconds("PT1H")      // 3600
 * parseIso8601DurationToSeconds("PT1H30S")   // 3630
 *
 * @param duration - ISO 8601 duration string
 * @returns Duration in seconds, or 0 if invalid format
 */
export function parseIso8601DurationToSeconds(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return +(h || 0) * 3600 + +(m || 0) * 60 + +(s || 0);
}

/**
 * Formats seconds to a human-readable duration string.
 *
 * @example
 * formatDuration(3750) // "1:02:30"
 * formatDuration(900)  // "15:00"
 * formatDuration(30)   // "0:30"
 *
 * @param totalSeconds - Duration in seconds
 * @returns Formatted duration string (H:MM:SS or MM:SS)
 */
export function formatDuration(totalSeconds: number): string {
  const t = Math.max(0, totalSeconds);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

