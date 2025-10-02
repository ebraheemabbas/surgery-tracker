# Surgery Tracker (Web + Mobile-friendly)

A minimal full-stack app for managing **Patients** and **Surgeries** with a dashboard, plus pages to log new patients and new surgeries. 
- Frontend: **React (Vite)**, responsive and mobile-friendly.
- Backend: **Node/Express** with **SQLite (better-sqlite3)** for a simple relational database.

## Features
- Dashboard showing: Total Patients, Today's Surgeries, Total Surgeries, Success Rate.
- Recent surgeries list with tags (emergency/elective; status).
- Forms to create **New Patient** and **New Surgery**.
- After save, navigates back to Dashboard and data re-renders.
- Persisted in `server/db.sqlite` (auto-created with seed data).

## Quick Start

### 1) Start the API
```bash
cd server
npm install
npm run dev   # or: npm start
```
The API runs at `http://localhost:3001`.

### 2) Start the Web app
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Vite will print a local and network URL (e.g. `http://localhost:5173`).

> The frontend expects the API at `http://localhost:3001`. To change this, edit `client/.env.development`.

## Production build (optional)
```bash
cd client
npm run build
# serve the dist/ folder with any static file server
```

## API Overview
- `GET /api/stats`
- `GET /api/patients`, `POST /api/patients`, `GET /api/patients/:id`, `PATCH /api/patients/:id`
- `GET /api/surgeries`, `POST /api/surgeries`, `GET /api/surgeries/:id`, `PATCH /api/surgeries/:id`


## Notes
- This project is intentionally lightweight so you can adapt it to Expo/React Native Web or a different backend later.
- For healthcare production, add Auth (JWT/SSO), RBAC, audit logs, encryption, and stricter validation (Zod + server-side checks).
- https://chatgpt.com/share/e/68de4a82-6718-800a-a183-d781839dba80