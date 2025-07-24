const { initializeApp } = require('firebase/app');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app = null;
let auth = null;
let db = null;

// Only initialize Firebase if all required env vars are present
const hasFirebaseConfig = firebaseConfig.apiKey && 
                          firebaseConfig.projectId && 
                          firebaseConfig.appId;

if (hasFirebaseConfig) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication and get a reference to the service
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
    
    // Initialize Cloud Firestore and get a reference to the service
    const { getFirestore } = require('firebase/firestore');
    db = getFirestore(app);
    
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('💡 Running without Firebase integration');
  }
} else {
  console.log('⚠️ Firebase credentials not configured - running in local mode');
  console.log('💡 Configure Firebase environment variables to enable user management');
}

module.exports = {
  auth,
  db,
  app,
  isFirebaseEnabled: !!app
};
