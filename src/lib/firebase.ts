import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDCTsAU443g3qJQ8Z1mnzwufYoYAqvBA6U",
    authDomain: "blockchain-ticket-21537.firebaseapp.com",
    projectId: "blockchain-ticket-21537",
    storageBucket: "blockchain-ticket-21537.firebasestorage.app",
    messagingSenderId: "1032649960288",
    appId: "1:1032649960288:web:a0c516581b30c4c000cc05",
    measurementId: "G-62FM1Z077V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
