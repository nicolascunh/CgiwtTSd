// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFl6_HKz1ZE9vbYkXLYQAUr8F7nh2iS6Y",
  authDomain: "dashboard-trackmax-web.firebaseapp.com",
  projectId: "dashboard-trackmax-web",
  storageBucket: "dashboard-trackmax-web.firebasestorage.app",
  messagingSenderId: "1077575076861",
  appId: "1:1077575076861:web:333c4105032abced94e794",
  measurementId: "G-GMED40FN4G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

