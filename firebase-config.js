// Firebase Configuration for Hotel Grand Plaza
// Database URL: https://hotel-grand-plaza-db-default-rtdb.firebaseio.com/
// Project ID: hotel-grand-plaza-db

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALFXaA521YaigaJ9J2Vx270nkvbctgyzI",
    authDomain: "hotel-grand-plaza-db.firebaseapp.com",
    databaseURL: "https://hotel-grand-plaza-db-default-rtdb.firebaseio.com",
    projectId: "hotel-grand-plaza-db",
    storageBucket: "hotel-grand-plaza-db.firebasestorage.app",
    messagingSenderId: "318765519849",
    appId: "1:318765519849:web:6675205f6e49a4228fb178",
    measurementId: "G-S3LF56444M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const database = getDatabase(app);
const auth = getAuth(app);

// Export for use in other files
window.firebaseServices = {
    database,
    ref,
    set,
    get,
    push,
    onValue,
    update,
    remove,
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};

console.log('Firebase initialized successfully!');
