import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { CalendarEvent, EventType, HolidaysResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, CalendarPlus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: "birthday", label: "Birthday", color: "bg-pink-500" },
  { value: "homework", label: "Homework", color: "bg-amber-500" },
  { value: "assignment", label: "Assignment", color: "bg-blue-500" },
  { value: "test", label: "Test", color: "bg-red-500" },
  { value: "due", label: "Due Date", color: "bg-violet-500" },
  { value: "appointment", label: "Appointment", color: "bg-emerald-500" },
  { value: "holiday", label: "Holiday", color: "bg-slate-500" },
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function DayCell({
  date,
  month,
  events,
  onAdd,
  onDelete,
}: {
  date: Date;
  month: number;
  events: CalendarEvent[];
  onAdd: (date: Date) => void;
  onDelete: (id: string) => void;
}) {
  const inMonth = date.getMonth() === month;
  const isTodayFlag = isToday(date);

  return (
    <div className={`border border-border p-2 rounded-md flex flex-col gap-1 min-h-28 ${inMonth ? "bg-card" : "bg-muted/40"}`}>
      <div className="flex items-center justify-between text-xs">
        <div className={`font-semibold ${isTodayFlag ? "text-primary" : "text-muted-foreground"}`}>{format(date, "d")}</div>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onAdd(date)}
          aria-label="Add event"
          title="Add event"
        >
          +
        </button>
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {events.slice(0, 3).map((ev) => (
          <div key={ev.id} className="flex items-center gap-2 truncate">
            <span className={`h-2 w-2 rounded-full ${ev.type === "holiday" ? "bg-slate-500" : EVENT_TYPES.find(e => e.value === ev.type)?.color}`}></span>
            <span className="text-xs truncate" title={ev.title}>{ev.title}</span>
            {ev.isHoliday ? null : (
              <button
                className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(ev.id)}
                title="Delete"
                aria-label="Delete event"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {events.length > 3 && (
          <span className="text-xs text-muted-foreground">+{events.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

function useHolidays(year: number) {
  const [holidays, setHolidays] = useState<Record<string, string>>({}); // date => name
  useEffect(() => {
    let active = true;
    fetch(`/api/holidays?year=${year}&country=US`)
      .then((r) => r.json())
      .then((data: HolidaysResponse) => {
        if (!active) return;
        const map: Record<string, string> = {};
        for (const h of data.holidays) map[h.date] = h.name;
        setHolidays(map);
      })
      .catch(() => setHolidays({}));
    return () => {
      active = false;
    };
  }, [year]);
  return holidays;
}

function EventForm({ onSubmit, defaultDate }: { onSubmit: (e: Omit<CalendarEvent, "id">) => void; defaultDate: Date | null }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>(defaultDate ? toISODate(defaultDate) : toISODate(new Date()));
  const [type, setType] = useState<EventType>("assignment");
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (defaultDate) setDate(toISODate(defaultDate));
  }, [defaultDate]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, date, type, time: time || undefined, notes: notes || undefined, isHoliday: false });
        setTitle("");
        setTime("");
        setNotes("");
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as EventType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.filter((t) => t.value !== "holiday").map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="gap-2"><CalendarPlus className="h-4 w-4"/> Add Event</Button>
      </div>
    </form>
  );
}

export default function Index() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("events", []);
  const [filter, setFilter] = useState<Record<EventType, boolean>>({
    birthday: true,
    homework: true,
    assignment: true,
    test: true,
    due: true,
    appointment: true,
    holiday: true,
  });

  const holidays = useHolidays(currentMonth.getFullYear());

  // merge holidays as events (id composed)
  const holidayEvents: CalendarEvent[] = useMemo(() =>
    Object.entries(holidays).map(([date, name]) => ({
      id: `holiday-${date}`,
      title: name,
      date,
      type: "holiday" as const,
      isHoliday: true,
    })), [holidays]);

  const allEvents = useMemo(() => {
    // prevent duplicates if user also created an event with same id
    const map = new Map<string, CalendarEvent>();
    [...events, ...holidayEvents].forEach((e) => map.set(e.id, e));
    return Array.from(map.values());
  }, [events, holidayEvents]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  const openAddFor = (date: Date) => {
    setDefaultDate(date);
    setDialogOpen(true);
  };

  const addEvent = (e: Omit<CalendarEvent, "id">) => {
    const id = `${e.type}-${e.date}-${e.title}-${Math.random().toString(36).slice(2, 8)}`;
    setEvents((prev) => [{ ...e, id }, ...prev]);
    setDialogOpen(false);
  };

  const deleteEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const visibleDays: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) visibleDays.push(d);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of allEvents) {
      if (!filter[ev.type]) continue;
      map[ev.date] ||= [];
      map[ev.date].push(ev);
    }
    for (const k in map) map[k].sort((a, b) => (a.type === "holiday" ? -1 : 1));
    return map;
  }, [allEvents, filter]);

  const upcoming = useMemo(() => {
    const nowISO = toISODate(today);
    return allEvents
      .filter((e) => e.date >= nowISO)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 8);
  }, [allEvents]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <section className="xl:col-span-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">School Calendar</h1>
            <p className="text-muted-foreground">Birthdays, homework, assignments, tests, due dates and appointments — with US holidays preloaded.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>Today</Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => addMonths(d, -1))}><ChevronLeft/></Button>
              <div className="font-semibold w-36 text-center">{format(currentMonth, "MMMM yyyy")}</div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((d) => addMonths(d, 1))}><ChevronRight/></Button>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><CalendarPlus className="h-4 w-4"/>New Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add event</DialogTitle>
                </DialogHeader>
                <EventForm onSubmit={addEvent} defaultDate={defaultDate} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((d) => (
            <div key={d} className="text-xs font-semibold text-muted-foreground px-2">{d}</div>
          ))}
          {visibleDays.map((date) => (
            <DayCell
              key={toISODate(date)}
              date={date}
              month={currentMonth.getMonth()}
              events={(eventsByDate[toISODate(date)] || [])}
              onAdd={openAddFor}
              onDelete={deleteEvent}
            />
          ))}
        </div>
      </section>
      <aside className="xl:col-span-1 space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Filters</h2>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter((f) => ({ ...f, [t.value]: !f[t.value] }))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${filter[t.value] ? "bg-secondary" : "bg-background"}`}
              >
                <span className={`h-2 w-2 rounded-full ${t.color}`}></span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Upcoming</h2>
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${e.type === "holiday" ? "bg-slate-500" : EVENT_TYPES.find(t => t.value === e.type)?.color}`}></span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{format(parseISO(e.date), "eee, MMM d")}{e.time ? ` • ${e.time}` : ""}</div>
                </div>
                {!e.isHoliday && (
                  <Button size="icon" variant="ghost" onClick={() => deleteEvent(e.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
            {upcoming.length === 0 && (
              <li className="text-sm text-muted-foreground">No upcoming items.</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold mb-2">Legend</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {EVENT_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${t.color}`}></span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
