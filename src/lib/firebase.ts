import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCLG2xQL910x6hQzc8l5UjIwYKIGGli5Ik',
  authDomain: 'greenguard-478b7.firebaseapp.com',
  projectId: 'greenguard-478b7',
  storageBucket: 'greenguard-478b7.firebasestorage.app',
  messagingSenderId: '981446136083',
  appId: '1:981446136083:android:ae3475593e70bc4acf0ae6',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
