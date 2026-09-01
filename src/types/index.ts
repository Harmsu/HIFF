export type EventType = 'elokuva' | 'ravintola' | 'muu';

export interface Festival {
  id: string;
  name: string;
  year: number;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
}

export interface Theater {
  id: string;
  name: string;
  location: string;
}

export interface FestivalEvent {
  id: string;
  festivalId: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  name: string;
  link: string;
  theaterId: string | null;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number | null;
  highlight: string;
  note: string;
}

export interface FestivalEventWithTheater extends FestivalEvent {
  theaterName: string | null;
  theaterLocation: string | null;
}

export type View = 'table' | 'calendar' | 'settings';
