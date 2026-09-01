const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');
const { buildICS, sendInviteEmail } = require('../ics');

router.use(requireAuth);

function toEvent(row) {
  return {
    id: row.id,
    festivalId: row.festival_id,
    type: row.type,
    date: row.date,
    name: row.name,
    link: row.link || '',
    theaterId: row.theater_id,
    theaterName: row.theater_name || null,
    theaterLocation: row.theater_location || null,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    highlight: row.highlight || '',
    note: row.note || '',
  };
}

const SELECT_EVENTS = `
  SELECT e.*, t.name AS theater_name, t.location AS theater_location
  FROM events e
  LEFT JOIN theaters t ON t.id = e.theater_id
`;

function calcDurationMinutes(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // yli puolenyön menevä tapahtuma
  return minutes;
}

// GET /api/events?festivalId=xxx
router.get('/', async (req, res) => {
  const { festivalId } = req.query;
  if (!festivalId) return res.status(400).json({ error: 'festivalId vaaditaan' });
  const { rows } = await pool.query(
    `${SELECT_EVENTS} WHERE e.festival_id = $1 ORDER BY e.date ASC, e.start_time ASC`,
    [festivalId]
  );
  res.json(rows.map(toEvent));
});

// GET /api/events/export?festivalId=xxx
router.get('/export', async (req, res) => {
  const { festivalId } = req.query;
  if (!festivalId) return res.status(400).json({ error: 'festivalId vaaditaan' });
  const { rows } = await pool.query(
    `${SELECT_EVENTS} WHERE e.festival_id = $1 ORDER BY e.date ASC, e.start_time ASC`,
    [festivalId]
  );
  const header = ['tyyppi', 'pvm', 'nimi', 'linkki', 'paikka', 'sijainti', 'alku', 'loppu', 'kesto', 'huom', 'note'];
  const csvEscape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    const ev = toEvent(row);
    lines.push([
      ev.type, ev.date, ev.name, ev.link, ev.theaterName || '', ev.theaterLocation || '',
      ev.startTime, ev.endTime, ev.durationMinutes ?? '', ev.highlight, ev.note,
    ].map(csvEscape).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tapahtumat.csv"');
  res.send(lines.join('\r\n'));
});

// POST /api/events
router.post('/', async (req, res) => {
  const { festivalId, type, date, name, link, theaterId, startTime, endTime, durationMinutes, highlight, note } = req.body;
  if (!festivalId || !type || !date || !name || !startTime || !endTime) {
    return res.status(400).json({ error: 'festivalId, tyyppi, pvm, nimi, alku ja loppu vaaditaan' });
  }
  const duration = durationMinutes ?? calcDurationMinutes(startTime, endTime);
  const { rows } = await pool.query(
    `INSERT INTO events (festival_id, type, date, name, link, theater_id, start_time, end_time, duration_minutes, highlight, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [festivalId, type, date, name, link || '', theaterId || null, startTime, endTime, duration, highlight || '', note || '']
  );
  const { rows: fullRows } = await pool.query(`${SELECT_EVENTS} WHERE e.id = $1`, [rows[0].id]);
  res.status(201).json(toEvent(fullRows[0]));
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Tapahtumaa ei löydy' });

  const { type, date, name, link, theaterId, startTime, endTime, durationMinutes, highlight, note } = req.body;
  const duration = durationMinutes ?? calcDurationMinutes(startTime, endTime);
  await pool.query(
    `UPDATE events SET type=$1, date=$2, name=$3, link=$4, theater_id=$5, start_time=$6, end_time=$7, duration_minutes=$8, highlight=$9, note=$10
     WHERE id=$11`,
    [type, date, name, link || '', theaterId || null, startTime, endTime, duration, highlight || '', note || '', req.params.id]
  );
  const { rows: fullRows } = await pool.query(`${SELECT_EVENTS} WHERE e.id = $1`, [req.params.id]);
  res.json(toEvent(fullRows[0]));
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Tapahtumaa ei löydy' });
  await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// POST /api/events/:id/invite
router.post('/:id/invite', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Sähköpostiosoite vaaditaan' });

  const { rows } = await pool.query(`${SELECT_EVENTS} WHERE e.id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Tapahtumaa ei löydy' });
  const event = toEvent(rows[0]);

  const locationText = [event.theaterName, event.theaterLocation].filter(Boolean).join(', ');
  const icsContent = buildICS({
    name: event.name,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    locationText,
    descriptionText: [event.link, event.highlight, event.note].filter(Boolean).join('\n'),
  });

  await sendInviteEmail({ to: email, icsContent, event, locationText });
  res.json({ success: true });
});

// POST /api/events/import - lisää tapahtumia (ja tarvittaessa festivaaleja/paikkoja), ei korvaa olemassa olevaa dataa
router.post('/import', async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'events-taulukko vaaditaan' });
  }

  const client = await pool.connect();
  let imported = 0;
  try {
    await client.query('BEGIN');

    const festivalCache = new Map();
    const theaterCache = new Map();

    for (const row of events) {
      const { festivalName, festivalYear, type, date, name, link, theaterName, theaterLocation,
        startTime, endTime, durationMinutes, highlight, note } = row;

      if (!festivalName || !festivalYear || !type || !date || !name || !startTime || !endTime) continue;

      const festivalKey = `${festivalName}::${festivalYear}`;
      let festivalId = festivalCache.get(festivalKey);
      if (!festivalId) {
        const { rows: existing } = await client.query(
          'SELECT id FROM festivals WHERE name = $1 AND year = $2',
          [festivalName, Number(festivalYear)]
        );
        if (existing[0]) {
          festivalId = existing[0].id;
        } else {
          const { rows: created } = await client.query(
            'INSERT INTO festivals (name, year) VALUES ($1, $2) RETURNING id',
            [festivalName, Number(festivalYear)]
          );
          festivalId = created[0].id;
        }
        festivalCache.set(festivalKey, festivalId);
      }

      let theaterId = null;
      if (theaterName) {
        theaterId = theaterCache.get(theaterName);
        if (!theaterId) {
          const { rows: existing } = await client.query('SELECT id FROM theaters WHERE name = $1', [theaterName]);
          if (existing[0]) {
            theaterId = existing[0].id;
          } else {
            const { rows: created } = await client.query(
              'INSERT INTO theaters (name, location) VALUES ($1, $2) RETURNING id',
              [theaterName, theaterLocation || '']
            );
            theaterId = created[0].id;
          }
          theaterCache.set(theaterName, theaterId);
        }
      }

      const duration = durationMinutes ?? calcDurationMinutes(startTime, endTime);
      await client.query(
        `INSERT INTO events (festival_id, type, date, name, link, theater_id, start_time, end_time, duration_minutes, highlight, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [festivalId, type, date, name, link || '', theaterId, startTime, endTime, duration, highlight || '', note || '']
      );
      imported++;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ imported });
});

module.exports = router;
