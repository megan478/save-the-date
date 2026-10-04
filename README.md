# Daisy & Edward — Save the Date

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

## Publish on Vercel

The Vercel Hobby plan and Neon Free plan are sufficient for this personal wedding site. The included `app.py`, root `requirements.txt`, and `vercel.json` let Vercel build the React frontend and run the FastAPI backend as one project.

1. Push the branch you want to publish to GitHub and merge it into the repository's production branch (normally `main`).
2. Sign in at [vercel.com](https://vercel.com) with GitHub and choose **Add New → Project**.
3. Import the `save-the-date` repository. Leave the project root at the repository root and click **Deploy**. The first deployment can be used to verify the site before connecting the form.
4. In the Vercel project, open **Storage**, choose **Create Database**, select **Neon Postgres**, and choose the free plan. Use a region close to the Vercel Function region. Connect the database to this project for Production, Preview, and Development.
5. In **Settings → Environment Variables**, confirm the Neon integration supplied `DATABASE_URL`. If Neon supplied only another pooled Postgres variable, copy its pooled connection value into a new variable named `DATABASE_URL`.
6. Add `ADMIN_PASSWORD` as a Production, Preview, and Development environment variable. Use a long random value and do not commit it to GitHub.
7. Open **Deployments**, select the latest deployment, and choose **Redeploy** so the function starts with the new database variables.
8. Test the deployed form once. Then download the guest list with:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  https://YOUR-PROJECT.vercel.app/api/addresses/export \
  --output save-the-date-addresses.csv
```

Vercel automatically provides an HTTPS `*.vercel.app` URL. A custom domain is optional; add one later under **Settings → Domains** if desired.

## Replace the placeholders

Add four booth photos named `booth-1.jpg` through `booth-4.jpg`, one full-width photo named `couple-hero.jpg`, and optionally `polaroid.jpg` inside `frontend/public/images/`. The layout displays tasteful numbered placeholders until those files exist. Update venue, email, and event text in `frontend/src/content.ts`.

The Audrey and Reynold demo font is bundled for this personal wedding site under its included personal-use license in `frontend/public/fonts/AudreyAndReynold-LICENSE.txt`. Purchase the appropriate font license before any commercial use.

## Docker

Copy `.env.example` to `.env`, choose a strong password, then run:

```bash
docker compose up --build
```

SQLite is persisted in the `save-the-date-data` volume.
