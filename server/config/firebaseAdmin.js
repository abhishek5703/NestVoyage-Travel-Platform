const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

function getFirebaseAuth() {
  if (firebaseApp) {
    return firebaseApp.auth();
  }

  let serviceAccount = null;

  // Local development: use JSON file if available.
  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "firebase-service-account.json"
  );

  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );
  } else {
    // Vercel/production: use environment variables.
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (
      !projectId ||
      !clientEmail ||
      !privateKey
    ) {
      throw new Error(
        "Firebase Admin credentials are not configured."
      );
    }

    serviceAccount = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n")
    };
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return firebaseApp.auth();
}

module.exports = {
  getFirebaseAuth
};