import type { ImportEventRow } from '../api/client';
import type { EventType } from '../types';

/** Yksinkertainen CSV-parseri joka tukee lainausmerkeillä ympäröityjä kenttiä (pilkkuja/rivinvaihtoja sisältävät arvot). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const VALID_TYPES: EventType[] = ['elokuva', 'ravintola', 'muu'];

/** Odottaa otsikkorivin: festivaali, vuosi, tyyppi, pvm, nimi, linkki, paikka, sijainti, alku, loppu, kesto, huom, note */
export function rowsToImportEvents(rows: string[][]): { events: ImportEventRow[]; skipped: number } {
  if (rows.length < 2) return { events: [], skipped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const col = {
    festivaali: idx('festivaali'),
    vuosi: idx('vuosi'),
    tyyppi: idx('tyyppi'),
    pvm: idx('pvm'),
    nimi: idx('nimi'),
    linkki: idx('linkki'),
    paikka: idx('paikka'),
    sijainti: idx('sijainti'),
    alku: idx('alku'),
    loppu: idx('loppu'),
    kesto: idx('kesto'),
    huom: idx('huom'),
    note: idx('note'),
  };

  const events: ImportEventRow[] = [];
  let skipped = 0;

  for (const cells of rows.slice(1)) {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');
    const festivalName = get(col.festivaali);
    const festivalYear = Number(get(col.vuosi));
    const date = get(col.pvm);
    const name = get(col.nimi);
    const startTime = get(col.alku);
    const endTime = get(col.loppu);

    if (!festivalName || !festivalYear || !date || !name || !startTime || !endTime) {
      skipped++;
      continue;
    }

    const typeRaw = get(col.tyyppi).toLowerCase() as EventType;
    const durationRaw = get(col.kesto);

    events.push({
      festivalName,
      festivalYear,
      type: VALID_TYPES.includes(typeRaw) ? typeRaw : 'elokuva',
      date,
      name,
      link: get(col.linkki),
      theaterName: get(col.paikka) || undefined,
      theaterLocation: get(col.sijainti) || undefined,
      startTime,
      endTime,
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      highlight: get(col.huom),
      note: get(col.note),
    });
  }

  return { events, skipped };
}
