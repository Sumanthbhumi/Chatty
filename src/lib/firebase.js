import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-7c040.firebaseapp.com",
  projectId: "reactchat-7c040",
  storageBucket: "reactchat-7c040.appspot.com",
  messagingSenderId: "372120408306",
  appId: "1:372120408306:web:6d3986d1ed9a7f00bd406b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
