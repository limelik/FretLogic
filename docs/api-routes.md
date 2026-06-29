# API Routes

Base URL: `http://localhost:8080/api/v1`

## Auth

- `POST /auth/register`
  - body: `{ "displayName", "email", "password" }`
- `POST /auth/login`
  - body: `{ "email", "password" }`
- `GET /auth/me`
  - auth: `Bearer <token>`

## Music

- `GET /music/tunings`
  - auth required
- `POST /music/fretboard`
  - body: `{ "tuningId", "fretCount", "preferSharps" }`
  - auth required
- `POST /music/scales`
  - body: `{ "rootNote", "scaleType", "tuningId", "fretCount", "preferSharps" }`
  - auth required
- `POST /music/note-exercise`
  - body: `{ "difficulty", "tuningId" }`
  - auth required

## Progress

- `GET /progress/dashboard`
  - auth required
- `GET /progress/state`
  - auth required
- `PUT /progress/state`
  - body: saved progress payload
  - auth required
- `GET /progress/sessions`
  - auth required
- `POST /progress/sessions`
  - body: session payload
  - auth required
- `GET /progress/exercise-results`
  - auth required
- `POST /progress/exercise-results`
  - body: exercise result payload
  - auth required
- `GET /progress/favorite-scales`
  - auth required
- `POST /progress/favorite-scales`
  - body: `{ "rootNote", "scaleType", "tuningId", "fretCount", "nickname", "preferSharps" }`
  - auth required
- `DELETE /progress/favorite-scales/{favoriteScaleId}`
  - auth required
