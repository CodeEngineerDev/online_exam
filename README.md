# ExamPoint

Online examination management application with a NestJS REST API, Next.js App Router frontend and MySQL database.

## Run with Docker

Install and start Docker Desktop, then run from the project root:

```bash
docker compose up --build -d
```

Open http://localhost:3000. The API health check is at http://localhost:3001/api/health.

Stop containers with `docker compose down`. To also delete the local database and all saved records, run `docker compose down -v`.

## Run locally

Start your local MySQL server. In PowerShell from the project root, create the app database account and initialize the schema once:

```bash
Get-Content backend/database/local-user.sql | mysql -u root -p
Get-Content backend/database/init.sql | mysql -u root -p
Copy-Item backend/.env.example backend/.env
```

Enter your local MySQL administrator password when prompted. If the `mysql` command is not on your PATH, run both SQL files from MySQL Workbench instead. The app account created by the first script is `exam_user` with password `exam_password`; edit `backend/.env` if you choose different credentials.

Then install and start the API:

```bash
cd backend
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend is at http://localhost:3000 and the API is at http://localhost:3001/api. The API reads database settings from `backend/.env`.

Root convenience commands are `npm run dev:api`, `npm run dev:web`, `npm run build:api` and `npm run build:web` after installing the backend and frontend dependencies.

## Features

- Register and browse students
- Create examinations with duration and availability windows
- Add and browse multiple-choice questions
- Take an open examination and submit one attempt per student
- Grade answers on the server and review scores and submission history
- Dashboard totals and recent results

## API

- `GET /api/health`, `/api/stats`
- `GET, POST /api/students`
- `GET, POST /api/exams`
- `GET, POST /api/questions?exam_id=1`
- `GET /api/exam-questions?exam_id=1`
- `POST /api/submit`
- `GET /api/results`

Correct answers are excluded from question responses and used only by the API when grading. This project has no authentication or role permissions and is for learning and demonstration, not high-stakes examinations or production use without security hardening.
Jenkins deployment test
