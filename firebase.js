const { initializeApp } = require("firebase/app");
const { getFirestore, collection } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const { getAuth } = require("firebase/auth");

require("dotenv").config()



//firebaseConfig: specify the project to connect to.
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);

//initialize the connection to firebase backend:
initializeApp(firebaseConfig)

//--- init services ---
const db = getFirestore()
//set collection ref
const colRef = collection(db, "heroes") //(db, collectionName)

//init auth service:
const auth = getAuth()

//init storage:
const storage = getStorage()

module.exports = { db, colRef, auth, storage }