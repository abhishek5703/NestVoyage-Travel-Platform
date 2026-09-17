# NestVoyage 2.0 — MERN Migration

This folder contains a React + Express + MongoDB/Mongoose + Cloudinary implementation built around the existing NestVoyage feature set.

## What is preserved

The original repository uses Passport Local / passport-local-mongoose, MongoDB/Mongoose, Cloudinary, owner-only listing mutation, review references, cascade deletion, categories, search, filters, guest browsing, and redirect-after-login semantics. The new API keeps the same user credential model and continues to understand legacy listing documents that only have `image.url` + `image.filename`.

The original project is intentionally left untouched. This is a parallel migration directory so the working application and database are not overwritten.

## Added safely

- React SPA with React Router and Axios
- REST JSON API
- premium responsive UI
- skeleton/loading/error/empty states
- multi-image listing uploads
- profile editing and profile gallery
- primary profile image
- favorites stored in MongoDB
- recently viewed stored in MongoDB
- server-driven sorting, pagination, filtering and search
- user dashboard and recommendation endpoint
- security middleware (Helmet, CORS, rate limiting)
- admin-role architecture without exposing admin actions to normal users

## Important compatibility notes

1. Existing users remain compatible because `passport-local-mongoose` is still used.
2. Existing listings with the original `image` object do not need an immediate database migration.
3. New listings use both `images[]` and the legacy `image` field for a safe transition.
4. The existing `init/index.js` destructive seed script is NOT copied into this migration. Do not run `deleteMany({})` against a production database.
5. The current source has no coordinate field, so the map view is not fabricated. It should be added only after real location coordinates are available.
6. The original source does not implement bookings, notifications, saved searches, or moderation; this build leaves those as future API modules rather than fake buttons.

## Setup

### 1. Server

```bash
cd server
npm install
copy .env.example .env
```

Fill in `ATLASDB_URL`, `SECRET` (or `SESSION_SECRET`), and the Cloudinary values using your existing environment configuration. Do not commit `.env`.

```bash
npm run dev
```

Server: `http://localhost:5000`

### 2. Client

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Client: `http://localhost:5173`

### 3. Production

Build the React app:

```bash
cd client
npm run build
```

Run the server with `NODE_ENV=production` and configure `CLIENT_URL`, HTTPS cookie settings, MongoDB, and Cloudinary. The Express app serves `client/dist` in production.

## API surface

Authentication:
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

Listings:
- GET `/api/listings`
- GET `/api/listings/:id`
- POST `/api/listings`
- PUT `/api/listings/:id`
- DELETE `/api/listings/:id`
- POST `/api/listings/:id/reviews`
- DELETE `/api/listings/:id/reviews/:reviewId`

Profile:
- GET `/api/users/me`
- PUT `/api/users/me`
- DELETE `/api/users/me`
- POST `/api/users/me/images`
- DELETE `/api/users/me/images/:imageId`
- PUT `/api/users/me/images/:imageId/primary`
- PUT `/api/users/me/images/reorder`

Discovery:
- GET `/api/users/me/favorites`
- POST `/api/users/me/favorites/:listingId`
- DELETE `/api/users/me/favorites/:listingId`
- GET `/api/users/me/recent`
- POST `/api/users/me/recent/:listingId`
- DELETE `/api/users/me/recent/:listingId`
- DELETE `/api/users/me/recent`
- GET `/api/users/me/recommendations`
- GET `/api/users/me/dashboard`

## Migration verification checklist

Before switching the live frontend to this build, verify:

- signup/login/logout for an existing user
- a legacy listing renders its old `image.url`
- owner-only edit/delete
- review author + listing owner delete authorization
- listing deletion removes referenced reviews
- search and combined filters
- Cloudinary upload/replacement/deletion
- profile image upload/delete/primary
- favorites and recently viewed persistence
- responsive pages at 320 / 375 / 425 / 768 / 1024 / 1440+
- production HTTPS cookies and CORS
- no seed/reset script is pointed at the production database

No automatic database reset or destructive migration is included.
