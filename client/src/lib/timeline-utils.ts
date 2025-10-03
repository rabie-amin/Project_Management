import { type ProjectWithPhases } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths } from "date-fns";

export interface TimelineData {
  startDate: Date;
  endDate: Date;
  months: Date[];
  projects: ProjectWithPhases[];
  scale: {
    x: (date: Date) => number;
    y: (projectId: string) => number;
  };
}

export function calculateTimelineData(
  projects: ProjectWithPhases[], 
  width: number, 
  height: number,
  margin = { top: 60, right: 20, bottom: 40, left: 200 }
): TimelineData {
  if (!projects.length) {
    const now = new Date();
    return {
      startDate: now,
      endDate: now,
      months: [now],
      projects: [],
      scale: {
        x: () => 0,
        y: () => 0,
      },
    };
  }

  // Calculate date range from all phases
  const allDates = projects.flatMap(p => 
    p.phases?.map(ph => [new Date(ph.startDate), new Date(ph.endDate)]).flat() || []
  );

  if (!allDates.length) {
    const now = new Date();
    return {
      startDate: now,
      endDate: now,
      months: [now],
      projects,
      scale: {
        x: () => 0,
        y: () => 0,
      },
    };
  }

  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Add padding to date range
  const startDate = startOfMonth(addMonths(minDate, -1));
  const endDate = endOfMonth(addMonths(maxDate, 1));

  // Generate months for the timeline
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Create scale functions
  const timeScale = (date: Date) => {
    const totalTime = endDate.getTime() - startDate.getTime();
    const dateTime = date.getTime() - startDate.getTime();
    return (dateTime / totalTime) * (width - margin.left - margin.right);
  };

  const projectScale = (projectId: string) => {
    const index = projects.findIndex(p => p.id === projectId);
    return index * 80; // 80px per project row
  };

  return {
    startDate,
    endDate,
    months,
    projects,
    scale: {
      x: timeScale,
      y: projectScale,
    },
  };
}

export function getStatusColor(status: string): string {
  const colors = {
    completed: '#22c55e', // green
    in_progress: '#eab308', // yellow
    delayed: '#ef4444', // red
    pending: '#94a3b8', // gray
  };
  
  return colors[status as keyof typeof colors] || colors.pending;
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✓';
    case 'in_progress': return '⟳';
    case 'delayed': return '⚠';
    default: return '○';
  }
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`;
}

export function calculatePhaseDuration(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPhaseProgress(phase: any): number {
  const now = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
}
