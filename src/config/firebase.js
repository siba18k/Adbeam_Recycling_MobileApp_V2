import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDlXJXfvl_HV_Az8akLxpaOu-y-Oze_isA",
    authDomain: "adbeam.firebaseapp.com",
    databaseURL: "https://adbeam-default-rtdb.firebaseio.com",
    projectId: "adbeam",
    storageBucket: "adbeam.firebasestorage.app",
    messagingSenderId: "413534942519",
    appId: "1:413534942519:web:f06c1220723b6c8da896b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app);
}

// Initialize other services
const database = getDatabase(app);
const storage = getStorage(app);

export { app, auth, database, storage };
export default app;
