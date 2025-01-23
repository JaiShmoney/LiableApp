import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUe4KLmi7budtjBILXI7qVfoE59KHfOVE",
  authDomain: "liableappv1.firebaseapp.com",
  projectId: "liableappv1",
  storageBucket: "liableappv1.firebasestorage.app",
  messagingSenderId: "756271333999",
  appId: "1:756271333999:web:d047b729440b0cfc0a439a",
  measurementId: "G-NBQP7G4ZM9"
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
