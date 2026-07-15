export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export const ALL_HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export const ROW_HEIGHT = 44;
export const DAY_COLUMN_WIDTH = 92;
/** Width of each hour column when time runs along the top axis. */
export const HOUR_COLUMN_WIDTH = 64;
/** Height of each day row in the transposed grid. */
export const DAY_ROW_HEIGHT = 56;
/** Fixed width for day labels on the left. */
export const DAY_LABEL_WIDTH = 44;

export const COURSE_COLORS = [
  'blue',
  'green',
  'yellow',
  'peach',
  'purple',
  'pink',
  'teal',
  'orange',
] as const;

export type CourseColor = (typeof COURSE_COLORS)[number];

export type BackendSection = {
  sectionId?: number;
  day?: string;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  room?: string;
  type?: string;
};

export type BackendScheduleItem = {
  courseId?: number;
  courseCode: string;
  courseName: string;
  credits: number;
  type?: string;
  section: BackendSection;
};

export type TopSchedule = {
  schedule: BackendScheduleItem[];
  totalCredits: number;
  score: number;
  daysOnCampus?: string[];
};

export type ScheduleSlot = {
  day: number;
  startHour: number | null;
  endHour: number | null;
  duration: number;
};

export type UICourse = {
  id: number | string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  color: CourseColor;
  type?: string;
  credits: number;
  slots: ScheduleSlot[];
};

export const COURSE_COLOR_STYLES: Record<
  CourseColor,
  { background: string; border: string; text: string }
> = {
  blue: { background: 'rgba(186, 215, 247, 0.9)', border: 'rgba(100, 149, 237, 0.5)', text: '#1e3a5f' },
  green: { background: 'rgba(186, 235, 208, 0.9)', border: 'rgba(72, 160, 115, 0.5)', text: '#1a4030' },
  yellow: { background: 'rgba(250, 230, 180, 0.95)', border: 'rgba(200, 160, 60, 0.5)', text: '#5c4a10' },
  peach: { background: 'rgba(250, 218, 200, 0.95)', border: 'rgba(210, 140, 100, 0.5)', text: '#5c3018' },
  purple: { background: 'rgba(220, 200, 250, 0.95)', border: 'rgba(150, 120, 200, 0.5)', text: '#3d2860' },
  pink: { background: 'rgba(250, 200, 220, 0.95)', border: 'rgba(210, 120, 160, 0.5)', text: '#5c1838' },
  teal: { background: 'rgba(180, 235, 230, 0.95)', border: 'rgba(80, 180, 170, 0.5)', text: '#124840' },
  orange: { background: 'rgba(250, 215, 180, 0.95)', border: 'rgba(220, 140, 60, 0.5)', text: '#5c3010' },
};

export function parseDays(dayString?: string): number[] {
  if (!dayString || dayString === 'TBA') return [];
  const map: Record<string, number> = { M: 0, T: 1, W: 2, TH: 3, F: 4 };
  return dayString
    .split(',')
    .map((d) => map[d.trim().toUpperCase()])
    .filter((d): d is number => d !== undefined);
}

export function timeToDecimalHour(timeVal?: string | Date | null): number | null {
  if (!timeVal) return null;
  const str = timeVal.toString();
  if (timeVal instanceof Date || str.includes('T')) {
    const d = new Date(timeVal);
    return d.getUTCHours() + d.getUTCMinutes() / 60;
  }
  const parts = str.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
  }
  return null;
}

export function assignColor(_courseCode: string, index: number): CourseColor {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

export function formatHour(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
}

export function formatTime(h: number | null): string {
  if (h == null) return 'TBA';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12;
  const displayHour = Math.floor(hour) === 0 ? 12 : Math.floor(hour);
  const mins = Math.round((h % 1) * 60)
    .toString()
    .padStart(2, '0');
  return `${displayHour}:${mins} ${suffix}`;
}

export function parseBackendSchedule(backendScheduleArr: BackendScheduleItem[]): UICourse[] {
  return backendScheduleArr.map((item, index) => {
    const sec = item.section || {};
    const startH = timeToDecimalHour(sec.startTime);
    const endH = timeToDecimalHour(sec.endTime);
    const daysArr = parseDays(sec.day);
    const duration = startH != null && endH != null ? endH - startH : 0;

    return {
      id: item.courseId ?? index,
      code: item.courseCode,
      name: item.courseName,
      instructor: sec.instructor || 'TBA',
      room: sec.room || 'TBA',
      color: assignColor(item.courseCode, index),
      type: item.type || sec.type,
      credits: item.credits,
      slots: daysArr.map((d) => ({
        day: d,
        startHour: startH,
        endHour: endH,
        duration,
      })),
    };
  });
}

export function buildSlotsByDay(courses: UICourse[]): Record<number, { course: UICourse; slot: ScheduleSlot }[]> {
  const slotsByDay: Record<number, { course: UICourse; slot: ScheduleSlot }[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
  };

  courses.forEach((course) => {
    course.slots.forEach((slot) => {
      if (slot.day >= 0 && slot.day < 5 && slot.startHour != null) {
        slotsByDay[slot.day].push({ course, slot });
      }
    });
  });

  return slotsByDay;
}

export function computeGridHours(courses: UICourse[]): {
  gridStartHour: number;
  gridEndHour: number;
  hours: number[];
} {
  let gridStartHour = 8;
  let gridEndHour = 18;

  if (courses.length > 0) {
    let earliestHour = 24;
    let latestHour = 0;
    courses.forEach((course) => {
      course.slots.forEach((slot) => {
        if (slot.startHour != null && slot.startHour < earliestHour) earliestHour = slot.startHour;
        if (slot.endHour != null && slot.endHour > latestHour) latestHour = slot.endHour;
      });
    });
    if (earliestHour < 24) gridStartHour = Math.min(8, Math.floor(earliestHour));
    if (latestHour > 0) gridEndHour = Math.max(18, Math.ceil(latestHour));
  }

  const hours = ALL_HOURS.filter((h) => h >= gridStartHour && h < gridEndHour);
  return { gridStartHour, gridEndHour, hours };
}
