const router = require('express').Router();
const { pool } = require('../database');
const { requireAuth } = require('../auth');

router.use(requireAuth);

function toFestival(row) {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

// GET /api/festivals
router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM festivals ORDER BY year DESC, name ASC');
  res.json(rows.map(toFestival));
});

// POST /api/festivals
router.post('/', async (req, res) => {
  const { name, year, startDate, endDate } = req.body;
  if (!name || !year) {
    return res.status(400).json({ error: 'Nimi ja vuosi vaaditaan' });
  }
  const { rows } = await pool.query(
    'INSERT INTO festivals (name, year, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, Number(year), startDate || null, endDate || null]
  );
  res.status(201).json(toFestival(rows[0]));
});

// PUT /api/festivals/:id
router.put('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM festivals WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Festivaalia ei löydy' });

  const { name, year, startDate, endDate } = req.body;
  const { rows } = await pool.query(
    'UPDATE festivals SET name=$1, year=$2, start_date=$3, end_date=$4 WHERE id=$5 RETURNING *',
    [name, Number(year), startDate || null, endDate || null, req.params.id]
  );
  res.json(toFestival(rows[0]));
});

// DELETE /api/festivals/:id
router.delete('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM festivals WHERE id = $1', [req.params.id]);
  if (!existingRows[0]) return res.status(404).json({ error: 'Festivaalia ei löydy' });
  await pool.query('DELETE FROM festivals WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
