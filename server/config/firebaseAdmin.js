const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

function normalizePrivateKey(value) {
  let key = String(value || "").trim();

  // Remove accidental surrounding quotes.
  if (
    key.startsWith('"') &&
    key.endsWith('"')
  ) {
    key = key.slice(1, -1);
  }

  if (
    key.startsWith("'") &&
    key.endsWith("'")
  ) {
    key = key.slice(1, -1);
  }

  // Convert escaped newlines from Vercel env into real newlines.
  key = key.replace(/\\n/g, "\n");

  return key;
}

function getFirebaseAuth() {
  if (firebaseApp) {
    return firebaseApp.auth();
  }

  let serviceAccount = null;

  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "firebase-service-account.json"
  );

  // Local development.
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(
      fs.readFileSync(
        serviceAccountPath,
        "utf8"
      )
    );
  } else {
    // Production / Vercel.
    const projectId =
      process.env.FIREBASE_PROJECT_ID;

    const clientEmail =
      process.env.FIREBASE_CLIENT_EMAIL;

    const privateKey =
      normalizePrivateKey(
        process.env.FIREBASE_PRIVATE_KEY
      );

    if (
      !projectId ||
      !clientEmail ||
      !privateKey
    ) {
      throw new Error(
        "Firebase Admin credentials are not configured."
      );
    }

    if (
      !privateKey.includes(
        "-----BEGIN PRIVATE KEY-----"
      )
    ) {
      throw new Error(
        "FIREBASE_PRIVATE_KEY is not a valid PEM private key."
      );
    }

    serviceAccount = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey
    };
  }

  firebaseApp = admin.initializeApp({
    credential:
      admin.credential.cert(serviceAccount)
  });

  return firebaseApp.auth();
}

module.exports = {
  getFirebaseAuth
};