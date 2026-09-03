const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');
const { asyncHandler } = require('../asyncHandler');

router.use(requireAuth);

function toTheater(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location || '',
  };
}

// GET /api/theaters
router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM theaters ORDER BY name ASC');
  res.json(rows.map(toTheater));
}));

// POST /api/theaters
router.post('/', asyncHandler(async (req, res) => {
  const { name, location } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nimi vaaditaan' });
  }
  const { rows } = await pool.query(
    'INSERT INTO theaters (name, location) VALUES ($1, $2) RETURNING *',
    [name, location || '']
  );
  res.status(201).json(toTheater(rows[0]));
}));

// PUT /api/theaters/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM theaters WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Paikkaa ei löydy' });

  const { name, location } = req.body;
  const { rows } = await pool.query(
    'UPDATE theaters SET name=$1, location=$2 WHERE id=$3 RETURNING *',
    [name, location || '', req.params.id]
  );
  res.json(toTheater(rows[0]));
}));

// DELETE /api/theaters/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM theaters WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Paikkaa ei löydy' });
  await pool.query('DELETE FROM theaters WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;
