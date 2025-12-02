import {
  parseIso8601DurationToSeconds,
  formatDuration,
} from './iso8601-duration.util';

describe('ISO 8601 Duration Utilities', () => {
  describe('parseIso8601DurationToSeconds', () => {
    it('should parse hours, minutes, and seconds', () => {
      expect(parseIso8601DurationToSeconds('PT1H2M30S')).toBe(3750);
    });

    it('should parse hours only', () => {
      expect(parseIso8601DurationToSeconds('PT1H')).toBe(3600);
    });

    it('should parse minutes only', () => {
      expect(parseIso8601DurationToSeconds('PT15M')).toBe(900);
    });

    it('should parse seconds only', () => {
      expect(parseIso8601DurationToSeconds('PT30S')).toBe(30);
    });

    it('should parse hours and seconds without minutes', () => {
      expect(parseIso8601DurationToSeconds('PT1H30S')).toBe(3630);
    });

    it('should parse minutes and seconds without hours', () => {
      expect(parseIso8601DurationToSeconds('PT5M45S')).toBe(345);
    });

    it('should parse double-digit values', () => {
      expect(parseIso8601DurationToSeconds('PT10H30M45S')).toBe(37845);
    });

    it('should return 0 for empty string', () => {
      expect(parseIso8601DurationToSeconds('')).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(parseIso8601DurationToSeconds(null as any)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(parseIso8601DurationToSeconds(undefined as any)).toBe(0);
    });

    it('should return 0 for invalid format', () => {
      expect(parseIso8601DurationToSeconds('invalid')).toBe(0);
      expect(parseIso8601DurationToSeconds('1:30:00')).toBe(0);
      expect(parseIso8601DurationToSeconds('P1H')).toBe(0); // Missing T
    });

    it('should handle zero values', () => {
      expect(parseIso8601DurationToSeconds('PT0S')).toBe(0);
      expect(parseIso8601DurationToSeconds('PT0M0S')).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3750)).toBe('1:02:30');
    });

    it('should format minutes and seconds only', () => {
      expect(formatDuration(900)).toBe('15:00');
    });

    it('should format seconds only', () => {
      expect(formatDuration(30)).toBe('0:30');
    });

    it('should format zero', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should pad minutes and seconds with zeros', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('should handle large values', () => {
      expect(formatDuration(36000)).toBe('10:00:00');
    });

    it('should handle negative values as zero', () => {
      expect(formatDuration(-100)).toBe('0:00');
    });

    it('should format seconds less than 10 with padding', () => {
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(65)).toBe('1:05');
    });
  });
});

