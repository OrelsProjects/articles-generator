import {
  format,
  getMonth,
  getYear,
  getDate,
  addMinutes,
  isAfter,
  isSameDay,
  addDays,
} from "date-fns";

// Constants
export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Minimum scheduling time in minutes
export const MIN_SCHEDULE_MINUTES = 5;

// Getter functions for schedule values
export const getMonthValue = (date: Date): string => {
  return months[getMonth(date)];
};

export const getDayValue = (date: Date): string => {
  return getDate(date).toString();
};

export const getYearValue = (date: Date): string => {
  return getYear(date).toString();
};

export const getHourValue = (date: Date): string => {
  const hours = date.getHours();
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return displayHour.toString();
};

export const getMinuteValue = (date: Date): string => {
  return date.getMinutes().toString().padStart(2, "0");
};

export const getAmPmValue = (date: Date): string => {
  return date.getHours() >= 12 ? "PM" : "AM";
};

// Helper generators for select options
export const generateDays = (scheduledDate?: Date): string[] => {
  if (!scheduledDate)
    return Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const year = getYear(scheduledDate);
  const month = getMonth(scheduledDate);

  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => (i + 1).toString());
};

export const generateYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  // Generate years from current year to current year + 3
  return Array.from({ length: 4 }, (_, i) => (currentYear + i).toString());
};

export const generateHours = (): string[] => {
  return Array.from({ length: 12 }, (_, i) => (i + 1).toString());
};

export const generateMinutes = (): string[] => {
  return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
};

// Simple date updating functions
export const updateMonth = (date: Date, monthName: string): Date => {
  const newDate = new Date(date);
  newDate.setMonth(months.indexOf(monthName));
  return newDate;
};

export const updateDay = (date: Date, day: string): Date => {
  const newDate = new Date(date);
  newDate.setDate(parseInt(day, 10));
  return newDate;
};

export const updateYear = (date: Date, year: string): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(parseInt(year, 10));
  return newDate;
};

// Time updating functions that work directly with Date objects
export const updateHour = (date: Date, hour: string): Date => {
  const newDate = new Date(date);
  const isPM = newDate.getHours() >= 12;
  let hourValue = parseInt(hour, 10);

  // Convert 12-hour format to 24-hour format
  if (hourValue === 12) {
    hourValue = isPM ? 12 : 0;
  } else if (isPM) {
    hourValue += 12;
  }

  newDate.setHours(hourValue);
  return newDate;
};

export const updateMinute = (date: Date, minute: string): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(parseInt(minute, 10));
  return newDate;
};

export const updateAmPm = (date: Date, ampm: string): Date => {
  const newDate = new Date(date);
  const currentHour = newDate.getHours();
  const isPM = currentHour >= 12;
  const shouldBePM = ampm === "PM";

  if (isPM && !shouldBePM) {
    // Convert from PM to AM
    newDate.setHours(currentHour - 12);
  } else if (!isPM && shouldBePM) {
    // Convert from AM to PM
    newDate.setHours(currentHour + 12);
  }

  return newDate;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

const isTomorrow = (date: Date): boolean => {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
};

// Helper function to get formatted schedule text
export const getScheduleTimeText = (
  scheduledDate: Date,
  includeText: boolean = true,
): string => {
  const day = format(scheduledDate, "EEE");
  const time = format(scheduledDate, "h:mm a");
  if (includeText) {
    return `Will send on ${day}, ${format(scheduledDate, "MMM d, yyyy")} at ${time}`;
  }
  const today = isToday(scheduledDate);
  const tomorrow = isTomorrow(scheduledDate);

  if (today) {
    return `Today at ${time}`;
  }
  if (tomorrow) {
    return `Tomorrow at ${time}`;
  }

  return `${day}, ${format(scheduledDate, "MMM d, yyyy")} at ${time}`;
};

// Check if a date is scheduled
export const isScheduled = (scheduledDate: Date | undefined): boolean => {
  return scheduledDate !== undefined;
};

// Validate that the schedule time is at least MIN_SCHEDULE_MINUTES minutes in the future
export const isValidScheduleTime = (
  scheduledDate: Date | undefined,
): boolean => {
  if (!scheduledDate) return false;
  const now = new Date();
  const minimumValidTime = addMinutes(now, MIN_SCHEDULE_MINUTES);

  return isAfter(scheduledDate, minimumValidTime);
};

// Get error message for invalid schedule time
export const getInvalidTimeMessage = (): string => {
  return `Schedule time must be in the future. (at least ${MIN_SCHEDULE_MINUTES} minutes)`;
};
