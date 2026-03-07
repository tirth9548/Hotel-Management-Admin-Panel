// Firebase Configuration for Hotel Grand Plaza
// Database URL: https://hotel-grand-plaza-db-c62d3-default-rtdb.firebaseio.com/
// Project ID: hotel-grand-plaza-db-c62d3

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDCLmSvngqB1QK10vEms__9N3AizPU6X1c",
    authDomain: "hotel-grand-plaza-db-c62d3.firebaseapp.com",
    databaseURL: "https://hotel-grand-plaza-db-c62d3-default-rtdb.firebaseio.com",
    projectId: "hotel-grand-plaza-db-c62d3",
    storageBucket: "hotel-grand-plaza-db-c62d3.firebasestorage.app",
    messagingSenderId: "746768995375",
    appId: "1:746768995375:web:9b60f5afb9f9fdc503a2da",
    measurementId: "G-RPMWZ74FEE"
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
