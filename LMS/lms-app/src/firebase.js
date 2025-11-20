// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAokkLUFTeQwGijlgZ9wBD32VqCjnC-9Wk",
  authDomain: "lms-2025-c98ad.firebaseapp.com",
  projectId: "lms-2025-c98ad",
  storageBucket: "lms-2025-c98ad.firebasestorage.app",
  messagingSenderId: "623786356137",
  appId: "1:623786356137:web:73c19ab0274c2ea5a428b8",
  measurementId: "G-HLRHS2RSQT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
