import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCbMeP1WMp8n3D0UsNDQprymFsoig1Nw3M",
    authDomain: "tradenest-afc77.firebaseapp.com",
    projectId: "tradenest-afc77",
    storageBucket: "tradenest-afc77.firebasestorage.app",
    messagingSenderId: "964372906191",
    appId: "1:964372906191:web:81a38e0e8efafbb9a0b7ba",
    measurementId: "G-DJM592XTN6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
