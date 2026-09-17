# NestVoyage — AI Trip Planner + Firebase Email Verification + Email OTP Password Reset

This package includes the previous NestVoyage UI/listing/pagination/dashboard-image/session fixes plus:
- AI Trip Planner using Gemini API or local Ollama
- Firebase Email/Password signup with email verification
- Forgot Password using a 6-digit email OTP
- Existing local/Passport accounts kept compatible

## 0. Important: keep your existing `.env` files private

The ZIP intentionally does **not** contain your real `.env` files or Firebase Admin service-account credentials.

Do not commit secrets to GitHub.

## 1. Extract the new project

You can rename your current project folder as a backup, then extract this ZIP.

Keep your existing MongoDB data. No collections containing listings/users/reviews need to be deleted for these features.

## 2. Install dependencies

Open CMD #1:

```cmd
cd C:\Users\abhis\Desktop\NestVoyage_2\server
npm install
```

Open CMD #2:

```cmd
cd C:\Users\abhis\Desktop\NestVoyage_2\client
npm install
```

The added packages are:

Server:
- firebase-admin
- nodemailer

Client:
- firebase

## 3. Server `.env`

Create/update:

```text
NestVoyage_2\server\.env
```

Keep your existing MongoDB, Cloudinary, port, client URL and session secret. Make sure the session variable is named `SESSION_SECRET`.

Add:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite

OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b

FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=YOUR_FIREBASE_SERVICE_ACCOUNT_EMAIL
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_CONTENT\\n-----END PRIVATE KEY-----\\n"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=YOUR_GMAIL_ADDRESS
SMTP_PASS=YOUR_GOOGLE_APP_PASSWORD
SMTP_FROM=NestVoyage <YOUR_GMAIL_ADDRESS>
```

Do not use `SECRET=` for the session secret in this version. Use:

```env
SESSION_SECRET=YOUR_LONG_STRONG_SECRET
```

## 4. Gemini API setup (free tier)

1. Open Google AI Studio.
2. Create/select a project.
3. Create an API key.
4. Put it in `server/.env` as `GEMINI_API_KEY`.
5. Keep the project on the free tier; do not link billing just to test this feature.

Current Gemini documentation lists `gemini-2.5-flash-lite` with a free tier. Free-tier usage is subject to Google's quotas/limits.

## 5. Ollama local setup (free/local)

Install Ollama on your computer.

Then open CMD:

```cmd
ollama pull gemma3:4b
```

Confirm Ollama is available:

```cmd
ollama list
```

The app expects the local Ollama API at:

```text
http://127.0.0.1:11434
```

The AI Planner lets the user select either:
- Gemini API
- Ollama Local

## 6. Firebase Authentication setup

1. Open the Firebase Console.
2. Create a project or select an existing NestVoyage Firebase project.
3. Go to **Authentication → Sign-in method**.
4. Enable **Email/Password**.
5. Go to **Project settings → Your apps**.
6. Register a **Web App**.
7. Copy its web configuration values.

Put them in:

```text
NestVoyage_2\client\.env
```

as:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Firebase's web SDK uses these values to initialize Email/Password Authentication.

## 7. Firebase Admin setup for Express

1. In Firebase Console, open **Project settings → Service accounts**.
2. Click **Generate new private key**.
3. Download the JSON service-account file.
4. Do not put this JSON file in React/client code or GitHub.
5. Copy these values to the server `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

Keep the `\n` sequences escaped inside the `.env` value, as shown in the example above.

## 8. Gmail email sender for the password OTP

For the free OTP email flow, use a Gmail account with Google 2-Step Verification enabled.

Then:

1. Open your Google Account security settings.
2. Enable 2-Step Verification.
3. Open **App passwords**.
4. Create an App Password for NestVoyage.
5. Put the generated 16-character value into `SMTP_PASS`.
6. Put the Gmail address into `SMTP_USER`.

Do not use your normal Gmail password as `SMTP_PASS`.

## 9. Start the backend

```cmd
cd C:\Users\abhis\Desktop\NestVoyage_2\server
npm run dev
```

Expected output:

```text
MongoDB connected
NestVoyage API running on http://localhost:5000
```

## 10. Start the frontend

Open another CMD:

```cmd
cd C:\Users\abhis\Desktop\NestVoyage_2\client
npm run dev
```

Open:

```text
http://localhost:5173
```

## 11. Test AI Trip Planner

Open:

```text
http://localhost:5173/trip-planner
```

Try Gemini first.

Example:
- Destination: Goa
- Days: 3
- Travelers: 2
- Budget: ₹20,000
- Interests: Beaches, Food, Culture

Click **Generate Gemini itinerary**.

Then switch to **Ollama Local** and generate again.

## 12. Test Firebase signup

Open:

```text
http://localhost:5173/signup
```

Create a new account with an email you can access.

Expected flow:
1. Firebase creates the account.
2. Firebase sends a verification email.
3. Verify the email.
4. Return to NestVoyage.
5. Log in.

Unverified Firebase accounts are blocked from creating the NestVoyage backend session.

Existing local/Passport accounts remain supported.

## 13. Test Forgot Password OTP

Open:

```text
http://localhost:5173/forgot-password
```

Flow:

```text
Email
  ↓
Send OTP
  ↓
6-digit OTP email
  ↓
Verify OTP
  ↓
New password
  ↓
Login
```

The OTP expires after 10 minutes and is stored as a hash in MongoDB.

## 14. MongoDB sessions

The project uses the working session collection:

```text
nestvoyage_sessions_v6
```

Do not delete it unless you intentionally want to invalidate all current sessions.

## 15. Important security checks

Keep these out of GitHub:

```text
server/.env
Firebase service-account JSON/private key
Gemini API key
Gmail App Password
MongoDB password
Cloudinary API secret
```

Make sure `.env` is covered by `.gitignore` before pushing to GitHub.

## 16. If Gemini says quota/key error

Check:
- `GEMINI_API_KEY` is present in `server/.env`
- `GEMINI_MODEL=gemini-2.5-flash-lite`
- the server was restarted after editing `.env`
- the API key belongs to the intended Google project

## 17. If Ollama fails

Run:

```cmd
ollama list
```

Make sure `gemma3:4b` appears.

If not:

```cmd
ollama pull gemma3:4b
```

Then retry the planner.

## 18. If Firebase signup fails

Check:
- Email/Password is enabled in Firebase Authentication
- client `.env` contains all `VITE_FIREBASE_*` values
- server `.env` contains the three Firebase Admin values
- the service-account private key contains the escaped `\n` characters
- restart both server and client after editing `.env`

## 19. If Gmail OTP email fails

Check:
- 2-Step Verification is enabled
- you used an App Password, not the normal Gmail password
- `SMTP_USER` is the same Gmail account that created the App Password
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`

Google notes that App Passwords require 2-Step Verification and may be unavailable for some work/school or protected accounts.
