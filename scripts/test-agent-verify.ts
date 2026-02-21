import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin
try {
    initializeApp();
} catch (e) {
    console.log('App already initialized or failed to initialize');
}

const db = getFirestore();

async function checkSubmission(id: string) {
    console.log(`Checking document: ${id}...`);
    const docRef = db.collection('submissions').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.log('❌ Document does not exist!');
        process.exit(1);
    }

    const data = docSnap.data();
    console.log('\n--- Final Document State ---');
    console.log(JSON.stringify(data, null, 2));

    if (data?.blockchainStatus === 'confirmed') {
        console.log(`\n✅ Success! Document hashed and confirmed: ${data.submissionHash}`);
    } else {
        console.log(`\n⚠️ Document is not confirmed. Current status: ${data?.blockchainStatus}`);
    }
    process.exit(0);
}

// Pass ID as argument
const id = process.argv[2];
if (!id) {
    console.error("Please provide a submission ID");
    process.exit(1);
}

checkSubmission(id);
