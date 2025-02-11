// Import the functions you need from the SDKs you need
// Import the necessary Firebase modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Required for Expo


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbMeP1WMp8n3D0UsNDQprymFsoig1Nw3M",
  authDomain: "tradenest-afc77.firebaseapp.com",
  projectId: "tradenest-afc77",
  storageBucket: "tradenest-afc77.firebasestorage.app",
  messagingSenderId: "964372906191",
  appId: "1:964372906191:web:81a38e0e8efafbb9a0b7ba",
  measurementId: "G-DJM592XTN6"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const firestore = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services for use in your app
export { app, auth, firestore, storage };