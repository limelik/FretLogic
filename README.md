# FretLogic

FretLogic = premium full-stack guitar practice platform. Built with Spring Boot, React, TypeScript, TailwindCSS, PostgreSQL, JWT, REST.

App centers on 2 core machines:

- `Note Machine`: interactive fretboard note drills with timer, scoring, streaks, alternate tunings, instant feedback.
- `Scale Machine`: root + scale selection, interval formulas, highlighted fretboard positions, favorites, saved state.

## Stack

- Backend: Java 21 + Spring Boot 3
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Database: PostgreSQL 16
- Auth: JWT
- Infra: Docker + Docker Compose

## Features

- Dark premium UI with animated hero fretboard, glass panels, gradients, glow accents
- Guest mode with local persistence
- JWT login/register with persistent sessions
- Saved progression for logged-in users
- Dashboard stats, streaks, recent activity, trend charts
- Music theory engine for note mapping, tunings, intervals, scale formulas
- SVG fretboard centerpiece for both machines
- Seeded demo user and practice history

## Project Structure

```text
FretLogic/
├── backend/                  Spring Boot API
│   ├── src/main/java/com/fretlogic/api
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── src/main/resources/application.yml
├── frontend/                 React + TS client
│   ├── src/components/
│   ├── src/lib/
│   ├── src/pages/
│   └── src/styles/
├── docs/
│   ├── api-routes.md
│   ├── schema.md
│   ├── mock-data.json
│   ├── mock-home.svg
│   └── mock-dashboard.svg
└── docker-compose.yml
```

## Local Setup

Install JDK 21 before running the backend (`brew install openjdk@21` on macOS).
The Maven launcher honors `JAVA_HOME` and detects Homebrew JDK 21 on macOS
when the active Java version is too old.

1. Copy env file.
2. Start PostgreSQL.
3. Run backend.
4. Run frontend.

```bash
cp .env.example .env
docker compose up postgres
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:8080`

## One Command Dev Run

```bash
./run-dev.sh
```

Script:

- creates `.env` from `.env.example` if missing
- starts PostgreSQL with Docker
- installs frontend deps if needed
- starts backend + frontend together

Stop with `Ctrl+C`.

## Full Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Frontend: `http://localhost:4173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Demo Seed Account

- Email: `demo@fretlogic.app`
- Password: `DemoPass123`

## Core Routes

Frontend:

- `/`
- `/login`
- `/register`
- `/guest`
- `/dashboard`
- `/note-machine`
- `/scale-machine`
- `/profile`

Backend REST:

- Auth: `/api/v1/auth/*`
- Music: `/api/v1/music/*`
- Progress: `/api/v1/progress/*`

Full endpoint list: [docs/api-routes.md](/Users/lin/Desktop/FretLogic/docs/api-routes.md)

## Progress Persistence

Logged-in users persist:

- completed exercises
- accuracy
- streak context
- favorite scales
- practice history
- last visited exercise
- saved UI/settings state

Guest mode stores same shape locally in browser storage.

## Database Schema

Schema summary lives in [docs/schema.md](/Users/lin/Desktop/FretLogic/docs/schema.md)

Main models:

- `User`
- `PracticeSession`
- `ScaleEntity`
- `SavedProgress`
- `FavoriteScale`
- `ExerciseResult`

## Mock Data + Preview Assets

- Mock payloads: [docs/mock-data.json](/Users/lin/Desktop/FretLogic/docs/mock-data.json)
- Home preview: [docs/mock-home.svg](/Users/lin/Desktop/FretLogic/docs/mock-home.svg)
- Dashboard preview: [docs/mock-dashboard.svg](/Users/lin/Desktop/FretLogic/docs/mock-dashboard.svg)

![Home Preview](/Users/lin/Desktop/FretLogic/docs/mock-home.svg)

![Dashboard Preview](/Users/lin/Desktop/FretLogic/docs/mock-dashboard.svg)

## Notes

- Guest mode uses frontend music engine directly so practice works without account.
- Logged-in mode syncs state and progress through REST API.
- Maven wrapper script included. First run downloads wrapper + dependencies.
- Dockerfiles assume internet access for dependency install on first build.
