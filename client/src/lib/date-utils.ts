import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  addDays, 
  addWeeks, 
  addMonths, 
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO
} from "date-fns";

export function formatProjectDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "MMM dd, yyyy");
}

export function formatPhaseDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "MMM dd");
}

export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

export function isPhaseOverdue(endDate: string | Date): boolean {
  const dateObj = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return isBefore(dateObj, new Date());
}

export function isPhaseUpcoming(startDate: string | Date, days = 7): boolean {
  const dateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const upcomingDate = addDays(new Date(), days);
  return isWithinInterval(dateObj, { start: new Date(), end: upcomingDate });
}

export function calculateProjectDuration(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
}

export function calculateProjectProgress(
  startDate: string | Date, 
  endDate: string | Date, 
  phases: any[]
): number {
  const completedPhases = phases.filter(phase => phase.status === 'completed').length;
  return phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
}

export function getTimelineScale(
  startDate: Date, 
  endDate: Date, 
  viewMode: 'day' | 'week' | 'month' = 'month'
) {
  const totalDays = differenceInDays(endDate, startDate);
  
  switch (viewMode) {
    case 'day':
      return {
        unit: 'day',
        count: totalDays,
        formatter: (date: Date) => format(date, 'dd'),
        majorFormatter: (date: Date) => format(date, 'MMM yyyy'),
      };
    case 'week':
      return {
        unit: 'week',
        count: differenceInWeeks(endDate, startDate),
        formatter: (date: Date) => format(date, 'MMM dd'),
        majorFormatter: (date: Date) => format(date, 'MMM yyyy'),
      };
    default:
      return {
        unit: 'month',
        count: differenceInMonths(endDate, startDate),
        formatter: (date: Date) => format(date, 'MMM'),
        majorFormatter: (date: Date) => format(date, 'yyyy'),
      };
  }
}

export function generateTimelineMarkers(
  startDate: Date, 
  endDate: Date, 
  viewMode: 'day' | 'week' | 'month' = 'month'
): Date[] {
  const markers: Date[] = [];
  let currentDate = startDate;
  
  switch (viewMode) {
    case 'day':
      while (isBefore(currentDate, endDate)) {
        markers.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
      break;
    case 'week':
      while (isBefore(currentDate, endDate)) {
        markers.push(startOfWeek(currentDate));
        currentDate = addWeeks(currentDate, 1);
      }
      break;
    default:
      while (isBefore(currentDate, endDate)) {
        markers.push(startOfMonth(currentDate));
        currentDate = addMonths(currentDate, 1);
      }
  }
  
  return markers;
}

export function getPhaseStatusFromDates(
  startDate: string | Date,
  endDate: string | Date,
  currentStatus: string
): string {
  const now = new Date();
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  // If manually set to completed, keep it
  if (currentStatus === 'completed') return 'completed';
  
  // If end date has passed and not completed, it's delayed
  if (isAfter(now, end) && currentStatus !== 'completed') return 'delayed';
  
  // If current date is within the phase period, it's in progress
  if (isWithinInterval(now, { start, end })) return 'in_progress';
  
  // If start date is in the future, it's pending
  if (isAfter(start, now)) return 'pending';
  
  return currentStatus;
}
