export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const ALL_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM – 9 PM (full range)

// Helper to convert typical backend formats like "M,W" or "T,Th" to indices [0, 2]
export const parseDays = (dayString) => {
  if (!dayString || dayString === "TBA") return [];
  const map = {
    'M': 0,
    'T': 1,
    'W': 2,
    'TH': 3,
    'F': 4
  };
  return dayString.split(',').map(d => map[d.trim().toUpperCase()]).filter(d => d !== undefined);
};

// Map backend times (e.g., "11:00:00" or Date obj) to decimal hours (11.0)
export const timeToDecimalHour = (timeVal) => {
  if (!timeVal) return null;
  let str = timeVal.toString();
  if (timeVal instanceof Date || str.includes('T')) {
    const d = new Date(timeVal);
    // MUST use UTC because SQL server saves the exact local time string as purely UTC (e.g. 1970-01-01T08:00:00Z)
    // and using local getHours() will shift the 8AM based on the browser's timezone (+02:00 -> 10AM).
    return d.getUTCHours() + (d.getUTCMinutes() / 60);
  }
  const parts = str.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) + (parseInt(parts[1]) / 60);
  }
  return null;
};

// Stable color assignment for courses
export const COURSE_COLORS = ['blue', 'green', 'yellow', 'peach', 'purple', 'pink', 'teal', 'orange'];

export const assignColor = (courseCode, index) => {
  return COURSE_COLORS[index % COURSE_COLORS.length];
};

export const formatHour = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
};

export const formatTime = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  const displayHour = Math.floor(hour) === 0 ? 12 : Math.floor(hour);
  const minsDecimal = h % 1;
  const preciseMins = Math.round(minsDecimal * 60).toString().padStart(2, '0');
  return `${displayHour}:${preciseMins} ${suffix}`;
};

export const ROW_HEIGHT = 41;   // CSS height 40px + 1px border = 41px
