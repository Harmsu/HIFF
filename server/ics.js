const { v4: uuidv4 } = require('uuid');

// Vakio VTIMEZONE-lohko Europe/Helsinki-aikavyöhykkeelle (EU:n kesäaikasäännöt).
const VTIMEZONE = `BEGIN:VTIMEZONE
TZID:Europe/Helsinki
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
TZNAME:EEST
DTSTART:19700329T030000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
TZNAME:EET
DTSTART:19701025T040000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toICSDateTime(date, time) {
  // date: YYYY-MM-DD, time: HH:MM -> YYYYMMDDTHHMMSS
  const datePart = date.replace(/-/g, '');
  const timePart = `${time.replace(':', '')}00`;
  return `${datePart}T${timePart}`;
}

function stampNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS({ name, date, startTime, endTime, locationText, descriptionText }) {
  const uid = `${uuidv4()}@hiff`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HIFF//Festivaaliseuranta//FI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampNow()}`,
    `DTSTART;TZID=Europe/Helsinki:${toICSDateTime(date, startTime)}`,
    `DTEND;TZID=Europe/Helsinki:${toICSDateTime(date, endTime)}`,
    `SUMMARY:${escapeText(name)}`,
  ];
  if (locationText) lines.push(`LOCATION:${escapeText(locationText)}`);
  if (descriptionText) lines.push(`DESCRIPTION:${escapeText(descriptionText)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

async function sendInviteEmail({ to, icsContent, event, locationText }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY puuttuu ympäristömuuttujista');
  const from = process.env.RESEND_FROM_EMAIL || 'HIFF <onboarding@resend.dev>';

  const descriptionParts = [];
  if (event.link) descriptionParts.push(event.link);
  if (event.highlight) descriptionParts.push(event.highlight);
  if (event.note) descriptionParts.push(event.note);
  const descriptionHtml = descriptionParts.map((p) => `<p>${p}</p>`).join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Kalenterikutsu: ${event.name}`,
      html: `<h2>${event.name}</h2><p>${event.date} klo ${event.startTime}-${event.endTime}</p>${locationText ? `<p>${locationText}</p>` : ''}${descriptionHtml}`,
      attachments: [
        {
          filename: 'kutsu.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend-lähetys epäonnistui: ${res.status} ${errBody}`);
  }
}

module.exports = { buildICS, sendInviteEmail };
