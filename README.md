# Daisy & Ed — Save the Date

A web-only animated save-the-date experience with a photo-booth reveal, invitation view, countdown, contact section, and an address form backed by FastAPI and SQLite.

## Run locally

Requires Node 22+ and Python 3.11+.

```bash
npm install
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
npm run build
npm start
```

Open http://localhost:3000. During frontend development, use `npm run dev` and open http://localhost:5173.

The first run creates `backend/data/save-the-date.sqlite`. Submitted mailing addresses are available from the authenticated export endpoint; configure `ADMIN_PASSWORD` in `.env` before collecting real data.

To download the guest list as a spreadsheet-compatible CSV, run the site and request the protected export endpoint:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  http://localhost:3000/api/addresses/export \
  --output save-the-date-addresses.csv
```

The resulting file opens directly in Excel, Numbers, or Google Sheets. The SQLite database remains the source of truth, so downloading the spreadsheet does not remove any submissions.

## Production database

Local development uses SQLite. For Vercel or another serverless host, provision a managed Postgres database (Neon is available through the Vercel Marketplace) and set its pooled connection string as `DATABASE_URL`. The backend detects that variable, creates the `addresses` table automatically, and stores submissions in Postgres. If `DATABASE_URL` is absent, it continues using the local SQLite file.

The production table contains `id`, `name`, `email`, `attendance`, `address`, `details`, and `created_at`. Keep `ADMIN_PASSWORD` configured as a separate production environment variable to protect spreadsheet exports.

## Replace the placeholders

Add four booth photos named `booth-1.jpg` through `booth-4.jpg`, one full-width photo named `couple-hero.jpg`, and optionally `polaroid.jpg` inside `frontend/public/images/`. The layout displays tasteful numbered placeholders until those files exist. Update venue, email, and event text in `frontend/src/content.ts`.

The Audrey and Reynold demo font is bundled for this personal wedding site under its included personal-use license in `frontend/public/fonts/AudreyAndReynold-LICENSE.txt`. Purchase the appropriate font license before any commercial use.

## Docker

Copy `.env.example` to `.env`, choose a strong password, then run:

```bash
docker compose up --build
```

SQLite is persisted in the `save-the-date-data` volume.
