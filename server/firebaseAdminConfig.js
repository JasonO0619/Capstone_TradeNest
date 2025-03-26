const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const admin = require('firebase-admin');
const fs = require('fs');


if (!process.env.FIREBASE_ADMIN_KEY_PATH) {
  throw new Error('FIREBASE_ADMIN_KEY_PATH environment variable is not set.');
}

const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_ADMIN_KEY_PATH);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account key file not found at path: ${serviceAccountPath}`);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "tradenest-afc77.firebasestorage.app", 
});

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();
const storage = admin.storage();

module.exports = { admin, db, auth, messaging, storage };
