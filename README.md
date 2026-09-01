# HIFF — Festivaaliseuranta

Elokuvafestivaalien (ja muiden festivaalitapahtumien, kuten ravintolavarausten) seuranta. Korvaa Excel-pohjan
taulukko- ja kalenterinäkymällä, sekä lähettää kalenterikutsuja sähköpostitse.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind, PWA
- Backend: Node.js + Express (`server/`)
- Tietokanta: PostgreSQL (jaettu UpCloud-instanssi, oma kanta `hiff`)
- Auth: JWT, yksi käyttäjä (tunnukset ympäristömuuttujista)
- Kalenterikutsut: .ics-liite sähköpostitse [Resendin](https://resend.com) kautta
- Deploy: Netlify (frontend) + Render (backend)

## Paikallinen kehitys

### Backend

```
cd server
npm install
cp .env.example .env   # täytä DATABASE_URL, ADMIN_USERNAME/PASSWORD/EMAIL, JWT_SECRET, RESEND_API_KEY
npm run dev
```

Jos yhdistät jaettuun UpCloud-Postgres-palvelimeen paikallisesta koneesta, käytä SSH-tunnelia
(sama malli kuin muissa hobbysovelluksissa):

```
ssh -L 15432:localhost:5432 sanna@87.58.144.118
# ja DATABASE_URL: postgresql://hiff:SALASANA@localhost:15432/hiff
```

### Frontend

```
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3001/api
npm run dev
```

## CSV-tuonti

Asetukset-sivulla voi tuoda aiempien vuosien tapahtumat CSV-tiedostosta. Otsikkorivin sarakkeet:

```
festivaali,vuosi,tyyppi,pvm,nimi,linkki,paikka,sijainti,alku,loppu,kesto,huom,note
```

- `tyyppi`: `elokuva` / `ravintola` / `muu` (tyhjä tai tunnistamaton tulkitaan `elokuva`ksi)
- `pvm`: `YYYY-MM-DD`, `alku`/`loppu`: `HH:MM`
- Puuttuvat festivaalit ja paikat luodaan automaattisesti nimen (+ vuoden) perusteella
- Tuonti on additiivinen — ei korvaa olemassa olevaa dataa

## Deploy

- Backend: Render, `render.yaml` määrittää palvelun `hiff-api`
- Frontend: Netlify, `netlify.toml`
- Tietokanta: uusi kanta+käyttäjä jaetulle UpCloud-palvelimelle, sekä ufw/pg_hba-säännöt Renderin
  IP-alueille — tehdään vaihe kerrallaan käyttäjän vahvistuksella ennen palomuurimuutoksia
