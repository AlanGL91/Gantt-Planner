import { TimeAperture, TimelineColumn } from '../types/gantt';

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function parseDate(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDateToISO(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateFriendly(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]}`;
}

export function formatDateRange(startDateStr?: string | null, endDateStr?: string | null): string {
  if (!startDateStr || !endDateStr) return '-';
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${MONTH_SHORT_ES[start.getMonth()]} - ${end.getDate()} ${MONTH_SHORT_ES[end.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_SHORT_ES[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${MONTH_SHORT_ES[end.getMonth()]} ${end.getFullYear()}`;
}

export function getDaysDifference(startStr?: string | null, endStr?: string | null): number {
  if (!startStr || !endStr) return 1;
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

// Generate timeline range based on project dates
export function getTimelineBounds(allDates: string[], paddingDays = 14): { startDate: Date; endDate: Date } {
  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const dateStr of allDates) {
    if (!dateStr || typeof dateStr !== 'string') continue;
    const t = parseDate(dateStr).getTime();
    if (!isNaN(t)) {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  }

  if (minTime === Infinity || maxTime === -Infinity) {
    const today = new Date();
    return {
      startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 3, 1),
    };
  }

  const start = new Date(minTime - paddingDays * 24 * 60 * 60 * 1000);
  const end = new Date(maxTime + paddingDays * 24 * 60 * 60 * 1000);

  // Normalize start to Monday
  const startDay = start.getDay();
  const diffToMonday = startDay === 0 ? -6 : 1 - startDay;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Generate columns based on aperture
export function generateTimelineColumns(
  rangeStart: Date,
  rangeEnd: Date,
  aperture: TimeAperture
): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  if (!rangeStart || !rangeEnd || isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return cols;
  }

  const curr = new Date(rangeStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Safety counter to prevent any possible infinite loop
  let safetyCounter = 0;
  const MAX_COLS = 200;

  if (aperture === 'week') {
    while (curr <= rangeEnd && safetyCounter < MAX_COLS) {
      safetyCounter++;
      const colStart = new Date(curr);
      const colEnd = new Date(curr);
      colEnd.setDate(colEnd.getDate() + 6);
      colEnd.setHours(23, 59, 59, 999);

      const weekNum = getISOWeekNumber(colStart);
      const isCurrentWeek = today >= colStart && today <= colEnd;

      cols.push({
        id: `week-${formatDateToISO(colStart)}`,
        label: `W${weekNum}`,
        subLabel: `${colStart.getDate()} - ${colEnd.getDate()} ${MONTH_SHORT_ES[colEnd.getMonth()]}`,
        groupLabel: `${MONTH_NAMES_ES[colStart.getMonth()]} ${colStart.getFullYear()}`,
        startDate: colStart,
        endDate: colEnd,
        isToday: isCurrentWeek,
      });

      curr.setDate(curr.getDate() + 7);
    }
  } else if (aperture === 'sprint') {
    let sprintIndex = 1;
    while (curr <= rangeEnd && safetyCounter < MAX_COLS) {
      safetyCounter++;
      const colStart = new Date(curr);
      const colEnd = new Date(curr);
      colEnd.setDate(colEnd.getDate() + 13);
      colEnd.setHours(23, 59, 59, 999);

      const isCurrentSprint = today >= colStart && today <= colEnd;

      cols.push({
        id: `sprint-${formatDateToISO(colStart)}`,
        label: `Sprint ${sprintIndex}`,
        subLabel: `${colStart.getDate()} ${MONTH_SHORT_ES[colStart.getMonth()]} - ${colEnd.getDate()} ${MONTH_SHORT_ES[colEnd.getMonth()]}`,
        groupLabel: `${MONTH_NAMES_ES[colStart.getMonth()]} ${colStart.getFullYear()}`,
        startDate: colStart,
        endDate: colEnd,
        isToday: isCurrentSprint,
      });

      curr.setDate(curr.getDate() + 14);
      sprintIndex++;
    }
  } else if (aperture === 'month') {
    curr.setDate(1);
    while (curr <= rangeEnd && safetyCounter < MAX_COLS) {
      safetyCounter++;
      const colStart = new Date(curr.getFullYear(), curr.getMonth(), 1);
      const colEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59, 999);

      const isCurrentMonth = today.getFullYear() === curr.getFullYear() && today.getMonth() === curr.getMonth();

      cols.push({
        id: `month-${curr.getFullYear()}-${curr.getMonth() + 1}`,
        label: MONTH_NAMES_ES[curr.getMonth()],
        subLabel: `${curr.getFullYear()}`,
        groupLabel: `${curr.getFullYear()}`,
        startDate: colStart,
        endDate: colEnd,
        isToday: isCurrentMonth,
      });

      curr.setMonth(curr.getMonth() + 1);
    }
  } else if (aperture === 'quarter') {
    const currentQMonth = Math.floor(curr.getMonth() / 3) * 3;
    curr.setMonth(currentQMonth, 1);

    while (curr <= rangeEnd && safetyCounter < MAX_COLS) {
      safetyCounter++;
      const qIndex = Math.floor(curr.getMonth() / 3) + 1;
      const colStart = new Date(curr.getFullYear(), curr.getMonth(), 1);
      const colEnd = new Date(curr.getFullYear(), curr.getMonth() + 3, 0, 23, 59, 59, 999);

      const isCurrentQuarter = today >= colStart && today <= colEnd;

      cols.push({
        id: `quarter-${curr.getFullYear()}-Q${qIndex}`,
        label: `Q${qIndex} ${curr.getFullYear()}`,
        subLabel: `${MONTH_SHORT_ES[colStart.getMonth()]} - ${MONTH_SHORT_ES[colEnd.getMonth()]}`,
        groupLabel: `Año ${curr.getFullYear()}`,
        startDate: colStart,
        endDate: colEnd,
        isToday: isCurrentQuarter,
      });

      curr.setMonth(curr.getMonth() + 3);
    }
  }

  return cols;
}

// Convert date string into horizontal pixel coordinate on the timeline
export function calculateBarPosition(
  startDateStr?: string | null,
  endDateStr?: string | null,
  columns: TimelineColumn[] = [],
  columnWidth = 140
): { left: number; width: number; isVisible: boolean } {
  if (!startDateStr || !endDateStr || !columns || columns.length === 0 || !columns[0] || !columns[columns.length - 1]) {
    return { left: 0, width: 0, isVisible: false };
  }

  const taskStart = parseDate(startDateStr).getTime();
  const taskEnd = parseDate(endDateStr).getTime() + (24 * 60 * 60 * 1000 - 1);

  if (isNaN(taskStart) || isNaN(taskEnd)) {
    return { left: 0, width: 0, isVisible: false };
  }

  const timelineStart = columns[0].startDate.getTime();
  const timelineEnd = columns[columns.length - 1].endDate.getTime();

  if (taskEnd < timelineStart || taskStart > timelineEnd) {
    return { left: 0, width: 0, isVisible: false };
  }

  const totalTimelineDuration = timelineEnd - timelineStart;
  if (totalTimelineDuration <= 0) {
    return { left: 0, width: 0, isVisible: false };
  }

  const totalTimelineWidth = columns.length * columnWidth;

  const clampedStart = Math.max(taskStart, timelineStart);
  const clampedEnd = Math.min(taskEnd, timelineEnd);

  const startRatio = (clampedStart - timelineStart) / totalTimelineDuration;
  const durationRatio = (clampedEnd - clampedStart) / totalTimelineDuration;

  const left = Math.round(startRatio * totalTimelineWidth);
  const width = Math.max(18, Math.round(durationRatio * totalTimelineWidth));

  return { left, width, isVisible: true };
}

// Calculate position of Today marker line
export function calculateTodayPosition(
  columns: TimelineColumn[] = [],
  columnWidth = 140
): number | null {
  if (!columns || columns.length === 0 || !columns[0] || !columns[columns.length - 1]) return null;
  const today = new Date().getTime();
  const timelineStart = columns[0].startDate.getTime();
  const timelineEnd = columns[columns.length - 1].endDate.getTime();

  if (today < timelineStart || today > timelineEnd) return null;

  const totalTimelineDuration = timelineEnd - timelineStart;
  if (totalTimelineDuration <= 0) return null;

  const totalTimelineWidth = columns.length * columnWidth;
  const ratio = (today - timelineStart) / totalTimelineDuration;
  return Math.round(ratio * totalTimelineWidth);
}
