import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqX4qVswd-OLBiZI1C4GwrbuXHmrF-oPQ",
  authDomain: "ap-csa-web.firebaseapp.com",
  projectId: "ap-csa-web",
  storageBucket: "ap-csa-web.firebasestorage.app",
  messagingSenderId: "622816119523",
  appId: "1:622816119523:web:1ef33de16dcf5b91dfd3d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs };
