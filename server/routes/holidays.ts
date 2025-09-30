import { RequestHandler } from "express";
import { HolidaysResponse, Holiday } from "@shared/api";

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nthWeekdayOfMonth(year: number, monthIndex0: number, weekday: number, n: number): Date {
  // weekday: 0=Sun..6=Sat, monthIndex0: 0..11
  const first = new Date(year, monthIndex0, 1);
  const offset = (7 + weekday - first.getDay()) % 7; // days to first weekday
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, monthIndex0, day);
}

function lastWeekdayOfMonth(year: number, monthIndex0: number, weekday: number): Date {
  const last = new Date(year, monthIndex0 + 1, 0); // last day of month
  const offset = (7 + last.getDay() - weekday) % 7; // days since last weekday
  return new Date(year, monthIndex0 + 1, 0 - offset);
}

function observed(date: Date): { observed: Date; actual: Date } {
  const dow = date.getDay();
  if (dow === 0) {
    // Sunday -> observed Monday
    const obs = new Date(date);
    obs.setDate(obs.getDate() + 1);
    return { observed: obs, actual: date };
  }
  if (dow === 6) {
    // Saturday -> observed Friday
    const obs = new Date(date);
    obs.setDate(obs.getDate() - 1);
    return { observed: obs, actual: date };
  }
  return { observed: date, actual: date };
}

function getUSHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // New Year's Day - Jan 1
  {
    const { observed: obs, actual } = observed(new Date(year, 0, 1));
    const h: Holiday = { name: "New Year's Day", date: toISODate(obs) };
    if (obs.getTime() !== actual.getTime()) h.actualDate = toISODate(actual);
    holidays.push(h);
  }

  // Martin Luther King Jr. Day - 3rd Monday in January
  holidays.push({ name: "Martin Luther King Jr. Day", date: toISODate(nthWeekdayOfMonth(year, 0, 1, 3)) });

  // Presidents' Day - 3rd Monday in February
  holidays.push({ name: "Presidents' Day", date: toISODate(nthWeekdayOfMonth(year, 1, 1, 3)) });

  // Memorial Day - last Monday in May
  holidays.push({ name: "Memorial Day", date: toISODate(lastWeekdayOfMonth(year, 4, 1)) });

  // Juneteenth - June 19
  {
    const { observed: obs, actual } = observed(new Date(year, 5, 19));
    const h: Holiday = { name: "Juneteenth National Independence Day", date: toISODate(obs) };
    if (obs.getTime() !== actual.getTime()) h.actualDate = toISODate(actual);
    holidays.push(h);
  }

  // Independence Day - July 4
  {
    const { observed: obs, actual } = observed(new Date(year, 6, 4));
    const h: Holiday = { name: "Independence Day", date: toISODate(obs) };
    if (obs.getTime() !== actual.getTime()) h.actualDate = toISODate(actual);
    holidays.push(h);
  }

  // Labor Day - 1st Monday in September
  holidays.push({ name: "Labor Day", date: toISODate(nthWeekdayOfMonth(year, 8, 1, 1)) });

  // Columbus Day / Indigenous Peoples' Day - 2nd Monday in October
  holidays.push({ name: "Columbus Day", date: toISODate(nthWeekdayOfMonth(year, 9, 1, 2)) });

  // Veterans Day - Nov 11
  {
    const { observed: obs, actual } = observed(new Date(year, 10, 11));
    const h: Holiday = { name: "Veterans Day", date: toISODate(obs) };
    if (obs.getTime() !== actual.getTime()) h.actualDate = toISODate(actual);
    holidays.push(h);
  }

  // Thanksgiving Day - 4th Thursday in November
  holidays.push({ name: "Thanksgiving Day", date: toISODate(nthWeekdayOfMonth(year, 10, 4, 4)) });

  // Christmas Day - Dec 25
  {
    const { observed: obs, actual } = observed(new Date(year, 11, 25));
    const h: Holiday = { name: "Christmas Day", date: toISODate(obs) };
    if (obs.getTime() !== actual.getTime()) h.actualDate = toISODate(actual);
    holidays.push(h);
  }

  return holidays;
}

export const handleHolidays: RequestHandler = (req, res) => {
  const yearParam = req.query.year as string | undefined;
  const country = ((req.query.country as string | undefined) || "US").toUpperCase();
  const year = Number(yearParam) || new Date().getFullYear();

  if (country !== "US") {
    return res.status(400).json({ error: "Only country=US is supported in this starter." });
  }

  const holidays = getUSHolidays(year);
  const response: HolidaysResponse = {
    year,
    country,
    holidays,
  };
  res.status(200).json(response);
};
