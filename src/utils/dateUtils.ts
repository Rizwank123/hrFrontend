import { format, isValid } from 'date-fns';

// Helper function to safely format dates
export const safeFormatDate = (
  dateString: string | null | undefined,
  formatString: string,
  fallback: string = "--"
): string => {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  if (!isValid(date)) return fallback;

  // Adjust for local timezone
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return format(utcDate, formatString);
};