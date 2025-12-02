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
  if (!duration || typeof duration !== 'string') {
    return 0;
  }

  // ISO 8601 duration regex: PT[n]H[n]M[n]S
  const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const match = duration.match(regex);

  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
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
  if (totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

