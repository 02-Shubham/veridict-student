import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Setup minimal frontend firebase web app (for testing without admin constraints)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function addDummySubmission() {
    console.log("Submitting dummy test exam...");
    const submissionsRef = collection(db, 'submissions');

    const dummyData = {
        // Basic Spec Metadata
        studentId: "student_12345",
        examId: "exam_math_01",
        submittedAt: new Date().toISOString(),
        timeSpent: 3600,
        changeCount: 5,
        savedAt: new Date().toISOString(),

        // Trigger for the blockchain agent
        blockchainStatus: "pending",

        // Payload to hash
        answers: [
            { questionId: "q_1", value: "A" },
            { questionId: "q_2", value: "C" },
            { questionId: "q_3", value: "B" } // Will be sorted by agent
        ],
    };

    try {
        const docRef = await addDoc(submissionsRef, dummyData);
        console.log(`✅ Dummy submission added with ID: ${docRef.id}`);
    } catch (error) {
        console.error("Error adding submission: ", error);
    }
}

addDummySubmission().then(() => process.exit(0));
