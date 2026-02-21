import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore';
import { ethers } from 'ethers';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env specific to the agent if needed
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

// Ensure required env vars
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.warn('⚠️ BLOCKCHAIN_PRIVATE_KEY not found in environment. Using a dummy key for testing.');
}

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
if (!RPC_URL) {
    console.warn('⚠️ BLOCKCHAIN_RPC_URL not found. Using dummy provider for testing.');
}

// 1. Initialize Firebase 
// Setup minimal frontend firebase web app to bypass needing GOOGLE_APPLICATION_CREDENTIALS service accounts locally
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
console.log('Firebase Initialized successfully.');

// 2. Initialize Blockchain connection
// Fallback to random test credentials if not configured, allowing script to run and log
const provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : ethers.getDefaultProvider('sepolia');
const wallet = new ethers.Wallet(PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, provider);

// Mock Smart Contract ABI (Replace with real ABI and address)
const CONTRACT_ADDRESS = process.env.SMART_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const contractABI = [
    "function storeSubmissionHash(string examId, string submissionHash) public"
];
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

console.log(`Using Wallet Address: ${wallet.address}`);
console.log(`Target Contract: ${CONTRACT_ADDRESS}`);

// --- Core Helper Functions ---

function canonicalizeData(submissionId: string, data: any): string {
    // Check if answers is an object (record) and convert to array
    let answersArray: any[] = [];
    if (data.answers && typeof data.answers === 'object' && !Array.isArray(data.answers)) {
        answersArray = Object.keys(data.answers).map(key => ({
            questionId: key,
            value: data.answers[key]
        }));
    } else if (Array.isArray(data.answers)) {
        answersArray = data.answers;
    }

    // Sort answers by questionId alphabetically
    const sortedAnswers = answersArray.sort((a: any, b: any) => {
        return a.questionId.localeCompare(b.questionId);
    });

    // Build the canonical object
    const canonicalObject = {
        submissionId: submissionId,
        studentId: data.studentId || '',
        examId: data.examId || '',
        submittedAt: data.submittedAt || '', // Assuming this is an ISO string or consistent format
        answers: sortedAnswers.map((ans: any) => ({
            questionId: ans.questionId,
            value: ans.value
        }))
    };

    // Stringify with no extra whitespace
    return JSON.stringify(canonicalObject);
}

/**
 * Generates SHA-256 hash.
 */
function generateHash(canonicalString: string): string {
    return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Pushes hash to blockchain with retries.
 */
async function pushToBlockchain(examId: string, submissionHash: string): Promise<{ txHash: string, blockNumber: number, timestamp: string } | null> {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            console.log(`Attempting blockchain tx (try ${attempt + 1}/${MAX_RETRIES})...`);

            // IMPORTANT: In a real scenario, call the actual contract function.
            // If doing local testing without a real deployed contract, we can simulate the transaction.
            // For now, if we don't have a real address, we simulate.
            if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
                console.log('Simulating tx because real contract address is missing.');
                // Simulate local delay and mock tx data
                await new Promise(resolve => setTimeout(resolve, 1000));
                return {
                    txHash: `0xmocktxhash_${Date.now()}_${submissionHash.substring(0, 10)}`,
                    blockNumber: 12345678,
                    timestamp: new Date().toISOString()
                };
            }

            // REAL TX
            const tx = await contract.storeSubmissionHash(examId, submissionHash);
            console.log(`[BLOCKCHAIN_TX_SENT] Tx Hash: ${tx.hash}`);

            // Wait for 1 confirmation
            const receipt = await tx.wait(1);

            // Get block details for timestamp
            const block = await provider.getBlock(receipt.blockNumber);

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString()
            };

        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);
            attempt++;
            if (attempt >= MAX_RETRIES) {
                console.error(`[BLOCKCHAIN_FAILED] Failed after ${MAX_RETRIES} attempts.`);
                return null;
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
    return null;
}

// --- Main Processor ---

async function processSubmission(docSnapshot: any) {
    const docId = docSnapshot.id;
    const data = docSnapshot.data();

    // If already confirmed or failed in a terminal way, or already has a hash (deduplication safeguard)
    if (data.blockchainStatus === 'confirmed' || data.submissionHash) {
        return;
    }

    console.log(`\n--- Processing Submission: ${docId} ---`);

    try {
        // 1. & 2. Fetch and Canonicalize
        const canonicalString = canonicalizeData(docId, data);

        // 3. Generate Hash
        const hash = generateHash(canonicalString);
        console.log(`[SUBMISSION_HASHED] ${hash}`);

        // Update DB to show we are actively trying (if not already pending)
        const docRef = doc(db, 'submissions', docId);
        if (data.blockchainStatus !== 'pending') {
            await updateDoc(docRef, { blockchainStatus: 'pending', submissionHash: hash });
        }

        // 4. Push to Blockchain
        const txResult = await pushToBlockchain(data.examId, hash);

        // 5. Update Firestore
        if (txResult) {
            await updateDoc(docRef, {
                submissionHash: hash,
                blockchainTxHash: txResult.txHash,
                blockNumber: txResult.blockNumber,
                blockchainStatus: 'confirmed',
                blockchainAnchoredAt: txResult.timestamp
            });
            console.log(`[BLOCKCHAIN_CONFIRMED] Submission ${docId} anchored successfully.`);
        } else {
            await updateDoc(docRef, {
                submissionHash: hash,
                blockchainStatus: 'failed'
            });
        }

    } catch (err: any) {
        console.error(`Error processing submission ${docId}:`, err);
        // Safe fallback update
        try {
            const docRef = doc(db, 'submissions', docId);
            await updateDoc(docRef, { blockchainStatus: 'failed' });
        } catch (e) { }
    }
}

// --- Batch Worker ---

let isProcessingBatch = false;

async function processPendingBatch() {
    if (isProcessingBatch) return;
    isProcessingBatch = true;

    try {
        const submissionsRef = collection(db, 'submissions');
        const q = query(submissionsRef, where('blockchainStatus', '==', 'pending'), limit(BATCH_SIZE));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            isProcessingBatch = false;
            return;
        }

        console.log(`Found ${snapshot.size} pending documents to process in batch.`);

        // Process concurrently but bounded by batch size
        const promises = snapshot.docs.map(docSnapshot => processSubmission(docSnapshot));
        await Promise.allSettled(promises);

        console.log(`Batch complete.`);

        // If we hit the limit, there might be more. Trigger again immediately.
        if (snapshot.size === BATCH_SIZE) {
            isProcessingBatch = false;
            processPendingBatch(); // Recursive call to clear queue
            return;
        }

    } catch (error) {
        console.error(`Error processing batch:`, error);
    }

    isProcessingBatch = false;
}

// --- Listener Setup ---

function startListening() {
    console.log('Starting Firestore listener for submissions collection...');

    const submissionsRef = collection(db, 'submissions');

    // Listen for NEW documents or documents specifically updated to 'pending'
    onSnapshot(submissionsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data();
                // We trigger on new docs (might not have status yet) or explicitly pending docs
                if (!data.blockchainStatus || data.blockchainStatus === 'pending') {
                    // We can just add it to the batch processing trigger to avoid race conditions
                    processPendingBatch();
                }
            }
        });
    }, (error) => {
        console.error('Firestore listener error:', error);
        // Attempt reconnect after delay
        setTimeout(startListening, 5000);
    });

    // Also kick off an initial batch process just in case there are pending ones from before
    processPendingBatch();
}

// Start
startListening();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});
