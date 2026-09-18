const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

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

  // Local development
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );
  } else {
    // Production / Vercel
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!encoded) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 is missing."
      );
    }

    try {
      const json = Buffer.from(
        encoded,
        "base64"
      ).toString("utf8");

      serviceAccount = JSON.parse(json);
    } catch (err) {
      throw new Error(
        `Invalid Firebase service account: ${err.message}`
      );
    }
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error(
      "Firebase service account is missing project_id, client_email or private_key."
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return firebaseApp.auth();
}

module.exports = {
  getFirebaseAuth
};