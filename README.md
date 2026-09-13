# Personal Academic Study Management System

Mastery-first study platform for university students targeting a **3.75–4.00 GPA**.

> Lecturer pace and student mastery are two separate tracks. Stay connected to lectures while closing weak-topic gaps.

## Documentation

Read these before diving into code:

1. [System Architecture](docs/01-SYSTEM-ARCHITECTURE.md)
2. [Database ERD](docs/02-DATABASE-ERD.md)
3. [API & Workflows](docs/03-API-AND-WORKFLOWS.md)
4. [Algorithms & Roadmap](docs/04-ALGORITHMS-AND-ROADMAP.md)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS, Chart.js |
| Backend | NestJS, TypeORM, JWT |
| Database | SQLite (default for local) or PostgreSQL 16 |

## Quick start

Local development uses **SQLite** so you can run without Docker. Set `DATABASE_TYPE=postgres` in `backend/.env` when PostgreSQL is available (`docker compose up -d`).

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run start:dev
```

API: `http://localhost:3000/api/v1`

Demo login: `demo@student.edu` / `password123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## Phase status

- **Phase 1 (MVP):** Auth, courses, topics, lecturer progress, mastery, gaps, weekly targets, study sessions, dashboard, priority engine
- **Phase 2:** Assessments, GPA, revision, notifications, analytics
- **Phase 3:** Past papers, question bank, topic frequency
- **Phase 4:** Advanced recommendations
