/**
 * ─────────────────────────────────────────────────────
 *  FIREBASE CONFIG — TradeVault
 *  YOU only need to fill in the values below.
 *  Get them from: Firebase Console → Project Settings
 *                 → Your Apps → SDK setup and configuration
 * ─────────────────────────────────────────────────────
 */
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
