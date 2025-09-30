/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/** Calendar domain types */
export type EventType =
  | "birthday"
  | "homework"
  | "assignment"
  | "test"
  | "due"
  | "appointment"
  | "holiday";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD) for all-day events
  time?: string; // HH:mm optional start time
  type: EventType;
  notes?: string;
  colorHex?: string; // optional custom color override in hex, e.g. #FFAA00
  isHoliday?: boolean; // true for preset holidays
}

export interface Holiday {
  name: string;
  date: string; // ISO date (YYYY-MM-DD), observed date when applicable
  actualDate?: string; // original date when observed differs
}

export interface HolidaysResponse {
  year: number;
  country: string; // e.g., "US"
  holidays: Holiday[];
}
