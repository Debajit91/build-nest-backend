// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json"); // ✅ match the path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
