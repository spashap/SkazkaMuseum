import { createEvent } from 'ics';

// "Add to calendar" links for a ticket — no accounts/APIs involved, just URL
// templates (Google, Outlook) and a generated .ics file (Apple Calendar has no
// URL scheme, and .ics also works as a generic fallback for any calendar app).
type EventInfo = { title: string; description: string; location: string; startAt: Date; endAt: Date };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function localCompact(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function googleCalendarUrl(e: EventInfo): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${localCompact(e.startAt)}/${localCompact(e.endAt)}`,
    details: e.description,
    location: e.location,
    ctz: 'Europe/Moscow',
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: EventInfo): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    startdt: localIso(e.startAt),
    enddt: localIso(e.endAt),
    body: e.description,
    location: e.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function toDateArray(d: Date): [number, number, number, number, number] {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

export function buildIcs(e: EventInfo): string | null {
  const { error, value } = createEvent({
    title: e.title,
    description: e.description,
    location: e.location,
    start: toDateArray(e.startAt),
    startInputType: 'local',
    end: toDateArray(e.endAt),
    endInputType: 'local',
  });
  if (error || !value) return null;
  return value;
}
