require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./database');

const authRoutes = require('./routes/authRoutes');
const festivalRoutes = require('./routes/festivalRoutes');
const theaterRoutes = require('./routes/theaterRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: false,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sisäinen palvelinvirhe' });
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Palvelin käynnissä portissa ${PORT}`));
}).catch(err => {
  console.error('Tietokannan alustus epäonnistui:', err);
  process.exit(1);
});
