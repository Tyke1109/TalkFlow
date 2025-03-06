import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: Analytics is not directly supported in React Native/Expo
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkzt5fAwUmOy2fZx5fTwJdj8iHJUKeX18",
  authDomain: "talkflow-df8bd.firebaseapp.com",
  projectId: "talkflow-df8bd",
  storageBucket: "talkflow-df8bd.firebasestorage.app",
  messagingSenderId: "162882394155",
  appId: "1:162882394155:web:eefda1056b2de81c21f26e",
  measurementId: "G-43ZTWFQL6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
export const storage = getStorage(app);
// const analytics = getAnalytics(app);

export { auth, db };