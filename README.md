#  NestVoyage — Full-Stack Travel & Property Marketplace

> A modern full-stack travel platform for discovering stays, publishing property listings, managing profiles, saving favorites, tracking recently viewed properties, and generating personalized AI travel itineraries.

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

**Live Demo:** [NestVoyage](https://nest-voyage-travel-platform-9x13.vercel.app/)

---

##  Screenshots

Add the project screenshots to a folder named **`screenshots/`** in the repository and use these filenames. The README is already wired to display them.

<table>
  <tr>
    <td width="50%">
      <img src="./screenshots/home.png" alt="NestVoyage Home Page" width="100%" />
      <p align="center"><b>Home Page</b></p>
    </td>
    <td width="50%">
      <img src="./screenshots/login.png" alt="NestVoyage Login Page" width="100%" />
      <p align="center"><b>Login & Authentication</b></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./screenshots/ai-trip-planner.png" alt="NestVoyage AI Trip Planner" width="100%" />
      <p align="center"><b>AI Trip Planner</b></p>
    </td>
    <td width="50%">
      <img src="./screenshots/create-listing.png" alt="NestVoyage Listing Creation Form" width="100%" />
      <p align="center"><b>Create Listing Form</b></p>
    </td>
  </tr>
</table>

> **More screenshots:** You can add additional images such as `listing-details.png`, `explore.png`, `profile.png`, `dashboard.png`, and `favorites.png` as the project evolves.

---

##  Overview

NestVoyage is a **React + Express + MongoDB** travel and property marketplace built as a modern migration of the original NestVoyage application.

The platform combines property discovery and host-side listing management with persistent user features such as favorites, recently viewed listings, profiles, reviews, and dashboard activity. It also adds an **AI Trip Planner** that generates day-by-day itineraries from user preferences using **Google Gemini** or **local Ollama** during development.

A major engineering goal of the project is **safe migration and backward compatibility**. Existing Passport Local credentials remain supported, and older listing documents that contain the legacy `image.url` / `image.filename` structure can still be rendered while new listings use a multi-image representation.

---

##  Core Features

###  Property Discovery

- Browse listings without logging in.
- Search across **title, description, location, country, and category**.
- Filter by category and location.
- Filter by minimum and maximum nightly price.
- Combine multiple search and filter conditions.
- Sort by:
  - Newest
  - Oldest
  - Price: low to high
  - Price: high to low
  - Rating
  - Popularity / review count
- Server-driven pagination with configurable page limits.
- Listing cards display calculated rating and review metadata.

###  Listing Management

Authenticated users can create, read, update, and delete listings.

Each listing supports:

- Title
- Description
- Nightly price
- Location
- Country
- Multiple categories
- Contact name
- Contact email
- Contact phone
- Multiple property images

Owner authorization is enforced on update and delete operations.

###  Cloudinary Image Pipeline

- Multi-image listing uploads with **up to 8 images per request**.
- Maximum **8 MB per image**.
- Supported image formats are handled through the upload pipeline.
- Cloudinary stores the media while MongoDB stores the image URL and public ID.
- Replacing listing images removes the previous Cloudinary assets.
- Deleting a listing also performs image cleanup.
- Backward-compatible rendering supports older single-image listing documents.

###  Reviews & Ratings

- Authenticated users can submit a **1–5 star rating** with a text review.
- Review ownership rules are enforced server-side.
- Review authors can remove their own reviews.
- Listing owners can remove reviews on their listings.
- Listing deletion cascades to referenced reviews.
- Listing discovery responses calculate average rating and review count from stored reviews.

###  Favorites & Recently Viewed

User discovery activity is persisted in MongoDB instead of browser-only state.

- Add/remove listings from favorites.
- Dedicated Favorites page.
- Track recently viewed listings.
- Automatically reorder recently viewed items by latest activity.
- Keep up to **12 recent listings**.
- Remove an individual history item.
- Clear the entire recently viewed history.

###  Personalized Recommendations

NestVoyage includes a lightweight, server-side recommendation system.

It uses:

- Categories of listings the user has favorited.
- Locations from recently viewed listings.
- Existing listing data to build relevant candidates.
- A fallback to recent/new listings when enough personalized matches are unavailable.

> This is a **rule-based recommendation system**, not a machine-learning ranking model.

###  Profiles & Dashboard

Authenticated users can manage a richer profile with:

- Username
- Email
- Phone
- Location
- Bio
- Social links in the user model
- Profile image gallery
- Primary profile image

Profile images support:

- Multiple uploads
- Delete image
- Set primary image
- Reorder gallery images
- Cloudinary cleanup

The dashboard also exposes account activity and recent listings using data calculated from the backend.

###  Authentication & Account Security

NestVoyage supports both the original local authentication model and Firebase-based authentication.

**Local authentication**

- Passport Local
- `passport-local-mongoose`
- Server-side sessions stored in MongoDB
- Login with username/email-compatible account flow
- HTTP-only session cookies
- Redirect-after-login flow

**Firebase authentication**

- Firebase Email/Password signup
- Firebase email verification
- Google sign-in
- Firebase Admin token verification on the server
- Existing local accounts remain compatible through the hybrid authentication model

###  Forgot Password with Email OTP

The password recovery flow uses an emailed **6-digit OTP**.

Security controls include:

- OTP hashed before storage.
- OTP expiration after **10 minutes**.
- Maximum **5 failed attempts**.
- Verified reset flow using a separately hashed reset token.
- Reset token expiration.
- Nodemailer SMTP delivery.
- Firebase-linked accounts can also synchronize their Firebase password update.

###  AI Trip Planner

The AI Trip Planner lets an authenticated user describe how they want to travel and generates a structured itinerary.

Users can provide:

- Destination
- **1–14 days**
- **1–20 travelers**
- Budget
- Travel style
- Travel pace
- Transport preference
- Multiple interests

Available interests include:

`Nature` · `Beaches` · `Food` · `Culture` · `Adventure` · `Nightlife` · `Shopping` · `Photography`

The generated itinerary can contain:

- Trip title
- Summary
- Budget note
- Day-by-day schedule
- Morning activities
- Afternoon activities
- Evening activities
- Food suggestions
- Transport guidance
- Day-specific tips
- Packing ideas
- General travel tips

###  Gemini +  Ollama Support

The backend AI route supports:

- **Google Gemini** for cloud generation.
- **Ollama** for local generation during development.

The frontend exposes provider selection in development so the same planner can be tested against either a cloud model or a local model.

The UI also explicitly warns users that AI-generated travel information should be verified before making real-world decisions.

###  API & Application Security

The Express backend includes:

- Helmet security headers.
- CORS with credentials support.
- Request rate limiting: **300 requests per 15 minutes**.
- Joi payload validation.
- Authentication middleware.
- Owner authorization middleware.
- Admin-role architecture.
- Centralized 404 and error handling.
- HTTP-only session cookies.
- Production-aware `sameSite` / `secure` cookie settings.
- MongoDB-backed session persistence.

---

##  Architecture

```mermaid
flowchart LR
    U[User] --> R[React + Vite SPA]
    R -->|Axios / JSON API| E[Express API]
    R --> F[Firebase Auth]
    E --> M[(MongoDB / Mongoose)]
    E --> C[Cloudinary]
    E --> P[Passport Local + Sessions]
    E --> G[Gemini API]
    E --> O[Ollama Local]
    E --> S[SMTP / Nodemailer]
```

### Request & Data Flow

```text
React UI
   │
   ├── Authentication ────────► Firebase / Passport
   │
   ├── REST API requests ─────► Express
   │                              │
   │                              ├── Joi validation
   │                              ├── Auth / owner checks
   │                              ├── Business logic
   │                              └── Error handling
   │
   ├── Images ─────────────────► Multer ──► Cloudinary
   │
   └── AI Trip Planner ────────► Express ──► Gemini / Ollama
                                  │
                                  └────────► MongoDB
```

---

##  Tech Stack

### Frontend

- React 18
- React Router
- Vite
- Axios
- Firebase Web SDK
- Lucide React
- React Hot Toast
- Custom responsive CSS

### Backend

- Node.js
- Express.js
- Passport.js
- Passport Local
- `passport-local-mongoose`
- Express Session
- Connect Mongo
- Multer
- Joi
- Helmet
- CORS
- Express Rate Limit
- Nodemailer

### Database & Storage

- MongoDB
- Mongoose
- Cloudinary
- `multer-storage-cloudinary`

### AI

- Google Gemini API
- Ollama local inference

### Deployment

- Vercel-compatible frontend configuration
- Express production server configuration
- Environment-based API URLs and production cookie settings

---

##  Project Structure

```text
NestVoyage/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── http.js
│   │   ├── components/
│   │   │   ├── Avatar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ListingCard.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── firebase.js
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── ListingDetails.jsx
│   │   │   ├── ListingForm.jsx
│   │   │   ├── Listings.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── TripPlanner.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── vercel.json
│   └── package.json
│
├── server/
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── firebaseAdmin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── error.js
│   ├── models/
│   │   ├── listing.js
│   │   ├── passwordReset.js
│   │   ├── review.js
│   │   └── user.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── ai.js
│   │   ├── auth.js
│   │   ├── listings.js
│   │   └── users.js
│   ├── services/
│   │   ├── cloudinary.js
│   │   ├── mailer.js
│   │   └── recommendations.js
│   ├── utils/
│   │   └── validation.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── screenshots/
│   ├── home.png
│   ├── login.png
│   ├── ai-trip-planner.png
│   └── create-listing.png
│
└── README.md
```

---

##  API Overview

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Local signup |
| `POST` | `/api/auth/firebase/signup` | Firebase-backed signup |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Current authenticated user |
| `POST` | `/api/auth/request-password-reset` | Request OTP |
| `POST` | `/api/auth/verify-password-otp` | Verify OTP |
| `POST` | `/api/auth/reset-password` | Complete password reset |

### Listings

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/listings` | Search, filter, sort and paginate listings |
| `GET` | `/api/listings/:id` | Listing details |
| `POST` | `/api/listings` | Create listing |
| `PUT` | `/api/listings/:id` | Update owner listing |
| `DELETE` | `/api/listings/:id` | Delete owner listing |
| `GET` | `/api/listings/:id/reviews` | Fetch listing reviews |
| `POST` | `/api/listings/:id/reviews` | Add review |
| `DELETE` | `/api/listings/:id/reviews/:reviewId` | Delete review |
| `POST` | `/api/listings/:id/view` | Record viewed listing |
| `POST` | `/api/listings/:id/favorite` | Add favorite |
| `DELETE` | `/api/listings/:id/favorite` | Remove favorite |

### Profile & Discovery

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/users/me` | Read profile |
| `PUT` | `/api/users/me` | Update profile |
| `DELETE` | `/api/users/me` | Delete account |
| `POST` | `/api/users/me/images` | Upload profile images |
| `DELETE` | `/api/users/me/images/:imageId` | Remove profile image |
| `PUT` | `/api/users/me/images/:imageId/primary` | Set primary image |
| `PUT` | `/api/users/me/images/reorder` | Reorder gallery |
| `GET` | `/api/users/me/favorites` | Get favorites |
| `POST` | `/api/users/me/favorites/:listingId` | Favorite listing |
| `DELETE` | `/api/users/me/favorites/:listingId` | Unfavorite listing |
| `GET` | `/api/users/me/recent` | Recently viewed listings |
| `POST` | `/api/users/me/recent/:listingId` | Record a view |
| `DELETE` | `/api/users/me/recent/:listingId` | Remove one recent item |
| `DELETE` | `/api/users/me/recent` | Clear recent history |
| `GET` | `/api/users/me/recommendations` | Personalized recommendations |
| `GET` | `/api/users/me/dashboard` | Dashboard statistics/activity |

### AI

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/ai/trip-planner` | Generate a personalized itinerary |

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API health check |

---

##  Getting Started

### Prerequisites

Install:

- Node.js 18+
- MongoDB Atlas or a reachable MongoDB instance
- Cloudinary account
- Firebase project (for Firebase authentication)
- Gemini API key (for cloud AI generation)
- Ollama + a local model such as `gemma3:4b` for local AI development
- Gmail SMTP/App Password or another SMTP provider for OTP email delivery

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd NestVoyage_2
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure server environment variables

Create `server/.env`.

```env
ATLASDB_URL=your_mongodb_connection_string
SESSION_SECRET=your_long_random_session_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite

OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@example.com
SMTP_PASS=your_google_app_password
SMTP_FROM=NestVoyage <your_email@example.com>
```

> Never commit `server/.env`, Firebase service-account credentials, API keys, database credentials, Cloudinary secrets, or SMTP passwords.

### 4. Start the backend

```bash
cd server
npm run dev
```

The API runs locally at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 5. Install client dependencies

```bash
cd ../client
npm install
```

### 6. Configure client environment variables

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 7. Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

##  AI Trip Planner Setup

### Gemini

Add a valid Gemini API key to `server/.env`:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

Restart the backend after changing environment variables.

### Ollama

Install Ollama and pull the configured local model:

```bash
ollama pull gemma3:4b
```

Verify:

```bash
ollama list
```

The project expects the local endpoint:

```text
http://127.0.0.1:11434
```

The client exposes the Gemini/Ollama selector when running in development mode.

---

##  Firebase Authentication Setup

1. Create or select a Firebase project.
2. Enable **Email/Password** under Firebase Authentication.
3. Register a Web App in Firebase Project Settings.
4. Copy the Firebase web configuration into `client/.env`.
5. Create a Firebase service-account key for server-side verification.
6. Map the service-account values to the server environment variables.
7. Enable the required Google sign-in configuration if Google authentication is used.

Firebase credentials and service-account files must remain outside source control.

---

##  Password Reset / Email OTP Setup

NestVoyage uses Nodemailer for the six-digit OTP password-reset workflow.

For Gmail:

1. Enable Google 2-Step Verification.
2. Create a Google App Password.
3. Put the App Password in `SMTP_PASS`.
4. Use the corresponding mailbox in `SMTP_USER`.

Do not place your regular Gmail password in the repository.

---

##  Migration & Backward Compatibility

NestVoyage 2.0 was designed as a parallel React/Express migration rather than a destructive replacement.

### Existing users

The backend still uses `passport-local-mongoose`, so existing local user credentials remain compatible with the migrated application.

### Existing listings

Legacy listing documents that contain:

```js
image: {
  url: "...",
  filename: "..."
}
```

remain renderable.

New listings additionally use:

```js
images: [
  {
    url: "...",
    publicId: "..."
  }
]
```

The first image is mirrored into the legacy `image` field during creation so the application can transition without immediately rewriting every database document.

### Reviews

When a listing is deleted, referenced reviews are removed through the model cascade.

### Database safety

The migration does **not** include an automatic production reset or destructive seed step.

---

##  Validation & Development Notes

Useful checks before deployment:

```bash
cd server
npm run check
```

Client production build:

```bash
cd client
npm run build
```

Recommended manual checks:

- Existing local user login/logout.
- Firebase signup and email verification.
- Google sign-in.
- Forgot-password OTP flow.
- Guest listing browsing.
- Listing create/update/delete as owner.
- Unauthorized listing mutation attempts.
- Legacy listing image rendering.
- Multi-image Cloudinary upload and replacement.
- Review create/delete permissions.
- Favorites persistence.
- Recently viewed persistence.
- Dashboard and recommendations.
- AI planner with Gemini.
- AI planner with Ollama in development.
- Responsive layouts across desktop and mobile widths.
- Production CORS and HTTPS cookie behavior.

---

##  Security Notes

Do not commit any of the following:

```text
server/.env
client/.env
server/firebase-service-account.json
MongoDB credentials
Cloudinary API secret
Gemini API key
SMTP password / App Password
SESSION_SECRET
```

Before public deployment, make sure all production secrets are stored in the deployment platform's environment-variable manager.

---

##  Scope Boundaries

The current source intentionally does **not** implement:

- Booking transactions / reservation engine
- Online payments
- Notification infrastructure
- Saved-search persistence
- Moderation workflows
- Map/coordinate features

The listing detail page supports **contacting the property owner for booking inquiries**, but there is no transactional booking workflow in the current implementation.


---

##  Project Highlights

| Capability | Implementation |
|---|---|
| Architecture | React SPA + Express REST API + MongoDB |
| Authentication | Passport Local + Firebase Email/Password + Google |
| Sessions | Express Session + MongoDB (`connect-mongo`) |
| Authorization | Auth middleware + owner checks + admin-role architecture |
| Listing CRUD | Full create/read/update/delete |
| Search | Multi-field keyword search |
| Filters | Category, location, min/max price |
| Sorting | Date, price, rating, popularity |
| Pagination | Server-driven |
| Media | Multer + Cloudinary |
| Listing images | Up to 8 per upload, 8 MB each |
| Reviews | 1–5 rating + comments + permission checks |
| Favorites | MongoDB persisted |
| Recently viewed | MongoDB persisted, capped at 12 |
| Recommendations | Rule-based personalization |
| Profiles | Editable profile + image gallery |
| Password reset | 6-digit hashed OTP + reset token |
| AI planner | Gemini + Ollama |
| AI planning range | 1–14 days, 1–20 travelers |
| Security | Helmet + CORS + rate limiting + Joi |

---

##  Author

**Abhishek Kumar**

B.Tech — Electrical Engineering, Netaji Subhas University of Technology (NSUT), Delhi

- GitHub: `https://github.com/abhishek5703`
- LinkedIn: `https://www.linkedin.com/in/abhishekkumar8983/`
- Portfolio: `https://portfolio8983.netlify.app/`

---

