// src/config/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Utilisation simple
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiAcDUuYemSTpoeZcX0F4ye15_w6u3uh4",
  authDomain: "guettguiapp.firebaseapp.com",
  projectId: "guettguiapp",
  storageBucket: "guettguiapp.firebasestorage.app",
  messagingSenderId: "1020247743535",
  appId: "1:1020247743535:web:c33b01e8b0d56f8b07fada",
  measurementId: "G-TB197MP8BF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services avec la configuration par défaut
// Firebase Auth garde automatiquement la persistance dans Expo
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Vérification de l'initialisation
console.log('Firebase initialisé avec succès');
console.log('Firebase Auth initialisé:', !!auth);
console.log('Firebase Firestore initialisé:', !!firestore);
console.log('Firebase Storage initialisé:', !!storage);

// Exporter tous les services
export { app, auth, firestore, storage };