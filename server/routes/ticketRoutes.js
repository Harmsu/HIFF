const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const sharp = require('sharp');
const { pool } = require('../database');
const { requireAuth } = require('../auth');
const { asyncHandler } = require('../asyncHandler');

router.use(requireAuth);

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Vain JPEG-, PNG- tai WebP-kuvat sallittu'));
    }
    cb(null, true);
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Tiedoston lataus epäonnistui' });
    next();
  });
}

function parseSlot(req, res) {
  const slot = Number(req.params.slot);
  if (![1, 2].includes(slot)) {
    res.status(400).json({ error: 'Slot on oltava 1 tai 2' });
    return null;
  }
  return slot;
}

function toTicketMeta(row, eventId) {
  return {
    slot: row.slot,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    uploadedAt: row.uploaded_at,
    url: `/api/events/${eventId}/tickets/${row.slot}/file`,
  };
}

// GET /api/events/:eventId/tickets
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT slot, mime_type, original_filename, uploaded_at FROM event_tickets WHERE event_id = $1 ORDER BY slot',
    [req.params.eventId]
  );
  res.json(rows.map((row) => toTicketMeta(row, req.params.eventId)));
}));

// POST /api/events/:eventId/tickets/:slot
router.post('/:slot', uploadSingle, asyncHandler(async (req, res) => {
  const slot = parseSlot(req, res);
  if (slot === null) return;
  if (!req.file) return res.status(400).json({ error: 'Tiedosto vaaditaan' });

  const { rows: eventRows } = await pool.query('SELECT id FROM events WHERE id = $1', [req.params.eventId]);
  if (!eventRows[0]) return res.status(404).json({ error: 'Tapahtumaa ei löydy' });

  let processed;
  try {
    processed = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return res.status(400).json({ error: 'Kuvan käsittely epäonnistui, tarkista tiedosto' });
  }

  await pool.query(
    `INSERT INTO event_tickets (event_id, slot, mime_type, original_filename, data)
     VALUES ($1, $2, 'image/jpeg', $3, $4)
     ON CONFLICT (event_id, slot) DO UPDATE
       SET mime_type = 'image/jpeg', original_filename = EXCLUDED.original_filename,
           data = EXCLUDED.data, uploaded_at = now()`,
    [req.params.eventId, slot, req.file.originalname || null, processed]
  );

  const { rows } = await pool.query(
    'SELECT slot, mime_type, original_filename, uploaded_at FROM event_tickets WHERE event_id = $1 AND slot = $2',
    [req.params.eventId, slot]
  );
  res.status(201).json(toTicketMeta(rows[0], req.params.eventId));
}));

// GET /api/events/:eventId/tickets/:slot/file
router.get('/:slot/file', asyncHandler(async (req, res) => {
  const slot = parseSlot(req, res);
  if (slot === null) return;

  const { rows } = await pool.query(
    'SELECT mime_type, data FROM event_tickets WHERE event_id = $1 AND slot = $2',
    [req.params.eventId, slot]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Lippua ei löydy' });

  res.setHeader('Content-Type', rows[0].mime_type);
  res.send(rows[0].data);
}));

// DELETE /api/events/:eventId/tickets/:slot
router.delete('/:slot', asyncHandler(async (req, res) => {
  const slot = parseSlot(req, res);
  if (slot === null) return;

  const { rowCount } = await pool.query(
    'DELETE FROM event_tickets WHERE event_id = $1 AND slot = $2',
    [req.params.eventId, slot]
  );
  if (!rowCount) return res.status(404).json({ error: 'Lippua ei löydy' });
  res.json({ success: true });
}));

module.exports = router;
