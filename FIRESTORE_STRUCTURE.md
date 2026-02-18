# Firestore Database Structure for Exam System

## ⚠️ IMPORTANT: Actual Structure Used by Teacher Dashboard

Your teacher dashboard uses a **separate `questions` collection**, NOT embedded arrays.

## Collections Overview

```
firestore/
├── exams/              # Exam metadata (NO questions array)
├── questions/          # All questions (linked by examId)
└── submissions/        # Student exam submissions
```

---

## 1. EXAMS Collection

**Collection Path:** `exams/{examId}`

### Document Structure:

```typescript
{
  // Basic Info
  name: string,                    // Exam title (e.g., "GATE 2024")
  subjectCode: string,             // 6-digit code (e.g., "123456")
  
  // Timing
  duration: number,                // Duration in minutes (e.g., 120)
  startTime: Timestamp,            // When exam becomes available
  endTime: Timestamp,              // When exam closes
  
  // Metadata
  totalMarks: number,              // Total marks (calculated from questions)
  instructions: string,            // Exam instructions
  createdBy: string,               // Teacher UID
  createdAt: Timestamp,
  updatedAt: Timestamp,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  
  // NOTE: NO questions array here!
}
```

### Example Document:

```json
{
  "name": "GATE Computer Science 2024",
  "subjectCode": "123456",
  "duration": 180,
  "startTime": "2024-03-15T09:00:00Z",
  "endTime": "2024-03-15T12:00:00Z",
  "totalMarks": 100,
  "instructions": "Answer all questions. No negative marking.",
  "createdBy": "teacher-uid-123",
  "createdAt": "2024-02-01T10:00:00Z",
  "updatedAt": "2024-02-01T10:00:00Z",
  "status": "PUBLISHED"
}
```

---

## 2. QUESTIONS Collection (Separate!)

**Collection Path:** `questions/{questionId}`

### Document Structure:

```typescript
{
  // Link to exam
  examId: string,                  // Reference to exam document ID
  
  // Question content
  text: string,                    // Question text
  type: "MCQ" | "SHORT_ANSWER" | "ESSAY" | "INFORMATION" | 
        "FILL_GAPS" | "MATCH" | "GRID" | "ATTACHMENT",
  
  // For MCQ/MATCH/FILL_GAPS
  options?: string[],              // Answer options
  correctAnswers?: string[],       // Correct answers (for auto-grading)
  shuffledOrder?: boolean,         // Shuffle options
  multipleSelect?: boolean,        // Allow multiple selections
  
  // Scoring
  points: number,                  // Marks for this question
  pointsPerAnswer?: number,        // For multi-part questions
  
  // Metadata
  createdBy: string,               // Teacher UID
  createdAt: Timestamp
}
```

### Example Documents:

```json
// Question 1 - MCQ
{
  "id": "q1-abc123",
  "examId": "exam-gate-2024",
  "text": "What is the time complexity of binary search?",
  "type": "MCQ",
  "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  "correctAnswers": ["O(log n)"],
  "points": 2,
  "shuffledOrder": false,
  "multipleSelect": false,
  "createdBy": "teacher-uid-123",
  "createdAt": "2024-02-01T10:05:00Z"
}

// Question 2 - Text
{
  "id": "q2-def456",
  "examId": "exam-gate-2024",
  "text": "Explain the difference between stack and queue.",
  "type": "SHORT_ANSWER",
  "points": 5,
  "createdBy": "teacher-uid-123",
  "createdAt": "2024-02-01T10:06:00Z"
}
```

---

## 3. SUBMISSIONS Collection

**Collection Path:** `submissions/{submissionId}`

### Document Structure:

```typescript
{
  // Exam Info
  examId: string,                  // Reference to exam document
  studentId: string,               // Student UID
  candidateId: string,             // Display ID (e.g., "CAND-1234")
  
  // Answers
  answers: {
    [questionId: string]: {
      value: string,               // Answer text or selected option
      savedAt: string,             // ISO timestamp
      changeCount?: number         // Number of times changed
    }
  },
  
  // Timing
  submittedAt: Timestamp,
  timeSpent: number,               // Seconds spent on exam
  
  // Proctoring
  proctoringEvents?: Array<{
    type: string,
    timestamp: string,
    metadata?: string
  }>,
  
  // Blockchain
  blockchainStatus: "pending" | "confirmed",
  payloadHash: string
}
```

---

## How to Query Questions

### In Teacher Dashboard (Create/Edit):

```typescript
// Get all questions for an exam
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)
)
const questionsSnap = await getDocs(questionsQuery)
const questions = questionsSnap.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}))
```

### In Student App (Take Exam):

```typescript
// 1. Find exam by subject code
const examQuery = query(
  collection(db, 'exams'),
  where('subjectCode', '==', '123456')
)
const examSnap = await getDocs(examQuery)
const examId = examSnap.docs[0].id

// 2. Load questions for that exam
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)
)
const questionsSnap = await getDocs(questionsQuery)
const questions = questionsSnap.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}))
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTeacher() {
      return isAuthenticated() && 
             request.auth.token.role == 'TEACHER';
    }
    
    // EXAMS - Students can read published, Teachers can write
    match /exams/{examId} {
      allow read: if isAuthenticated() && 
                    resource.data.status == 'PUBLISHED';
      allow write: if isTeacher();
    }
    
    // QUESTIONS - Students can read, Teachers can write
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if isTeacher();
    }
    
    // SUBMISSIONS - Students can create their own
    match /submissions/{submissionId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated() && 
                    (resource.data.studentId == request.auth.uid || 
                     isTeacher());
      allow update, delete: if false;
    }
  }
}
```

---

## Firestore Indexes

Create these composite indexes in Firebase Console:

1. **Exams by Subject Code:**
   - Collection: `exams`
   - Fields: `subjectCode` (Ascending), `status` (Ascending)

2. **Questions by Exam:**
   - Collection: `questions`
   - Fields: `examId` (Ascending), `createdAt` (Ascending)

3. **Submissions by Exam:**
   - Collection: `submissions`
   - Fields: `examId` (Ascending), `submittedAt` (Descending)

4. **Submissions by Student:**
   - Collection: `submissions`
   - Fields: `studentId` (Ascending), `submittedAt` (Descending)

---

## Why Separate Questions Collection?

**Advantages:**
1. ✅ No 1MB document size limit
2. ✅ Can have unlimited questions per exam
3. ✅ Better performance (only load questions when needed)
4. ✅ Easier to implement question banks
5. ✅ Multiple teachers can add questions simultaneously
6. ✅ Better indexing and querying capabilities

**Disadvantages:**
1. ❌ Requires two queries (exam + questions)
2. ❌ Slightly more complex code

---

## Common Mistakes

### ❌ WRONG: Using subjectCode as examId

```json
{
  "examId": "123456",  // This is the subjectCode!
  "text": "Question..."
}
```

### ✅ CORRECT: Using document ID as examId

```json
{
  "examId": "abc123xyz",  // This is the Firestore document ID
  "text": "Question..."
}
```

### ❌ WRONG: Looking for questions array in exam

```typescript
const exam = await getDoc(doc(db, 'exams', examId))
const questions = exam.data().questions  // Doesn't exist!
```

### ✅ CORRECT: Querying questions collection

```typescript
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)
)
const questions = await getDocs(questionsQuery)
```

**Collection Path:** `submissions/{submissionId}`

### Document Structure:

```typescript
{
  // Exam Info
  examId: string,                  // Reference to exam document
  studentId: string,               // Student UID
  candidateId: string,             // Display ID (e.g., "CAND-1234")
  
  // Answers
  answers: {
    [questionId: string]: {
      value: string,               // Answer text or selected option
      savedAt: string,             // ISO timestamp
      changeCount?: number         // Number of times changed
    }
  },
  
  // Timing
  submittedAt: Timestamp,
  timeSpent: number,               // Seconds spent on exam
  
  // Proctoring
  proctoringEvents?: Array<{
    type: string,
    timestamp: string,
    metadata?: string
  }>,
  
  // Blockchain
  blockchainStatus: "pending" | "confirmed",
  payloadHash: string
}
```

### Example Document:

```json
{
  "examId": "exam-gate-2024",
  "studentId": "student-uid-456",
  "candidateId": "CAND-7890",
  "answers": {
    "q1": {
      "value": "O(log n)",
      "savedAt": "2024-03-15T09:15:00Z",
      "changeCount": 1
    },
    "q2": {
      "value": "Stack follows LIFO principle while queue follows FIFO...",
      "savedAt": "2024-03-15T09:30:00Z",
      "changeCount": 3
    }
  },
  "submittedAt": "2024-03-15T11:45:00Z",
  "timeSpent": 9900,
  "proctoringEvents": [
    {
      "type": "WINDOW_SWITCH",
      "timestamp": "2024-03-15T10:30:00Z",
      "metadata": "Switched to another window"
    }
  ],
  "blockchainStatus": "pending",
  "payloadHash": "hash-abc123xyz"
}
```

---

## 3. STUDENTS Collection (Optional)

**Collection Path:** `students/{uid}`

```typescript
{
  email: string,
  name: string,
  role: "STUDENT",
  examHistory: string[],           // Array of exam IDs
  createdAt: Timestamp
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is teacher
    function isTeacher() {
      return isAuthenticated() && 
             request.auth.token.role == 'TEACHER';
    }
    
    // EXAMS - Students can read, Teachers can write
    match /exams/{examId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isTeacher();
    }
    
    // SUBMISSIONS - Students can create their own, Teachers can read all
    match /submissions/{submissionId} {
      allow create: if isAuthenticated() && 
                      request.resource.data.studentId == request.auth.uid;
      allow read: if isAuthenticated() && 
                    (resource.data.studentId == request.auth.uid || isTeacher());
      allow update, delete: if false; // No updates after submission
    }
    
    // STUDENTS - Users can read their own data
    match /students/{uid} {
      allow read: if isAuthenticated() && request.auth.uid == uid;
      allow write: if isTeacher();
    }
  }
}
```

---

## Firestore Indexes

Create these composite indexes in Firebase Console:

1. **Exams by Subject Code:**
   - Collection: `exams`
   - Fields: `subjectCode` (Ascending), `status` (Ascending)

2. **Submissions by Exam:**
   - Collection: `submissions`
   - Fields: `examId` (Ascending), `submittedAt` (Descending)

3. **Submissions by Student:**
   - Collection: `submissions`
   - Fields: `studentId` (Ascending), `submittedAt` (Descending)

---

## How Data Flows

### Teacher Creates Exam:
1. Teacher fills exam form (name, code, duration, questions)
2. Data saved to `exams/{examId}` with all questions in array
3. Exam status set to "published"

### Student Takes Exam:
1. Student enters 6-digit code (e.g., "123456")
2. App queries `exams` where `subjectCode == "123456"`
3. App loads exam document with all questions
4. Student answers questions (auto-saved to IndexedDB)
5. On submit, creates document in `submissions/{submissionId}`

### Teacher Views Results:
1. Teacher queries `submissions` where `examId == "exam-gate-2024"`
2. Displays all student submissions with answers
3. Can auto-grade MCQ questions using `correctAnswer` field
