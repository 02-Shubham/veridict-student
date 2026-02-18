# Question Loading Fix - Complete Guide

## ✅ What Was Fixed

Your student app now correctly loads questions from the separate `questions` collection in Firestore, matching your teacher dashboard's database structure.

### Changes Made:

1. **Updated `lib/services/exam.ts`:**
   - Changed `getExamPaper()` to query the `questions` collection
   - Uses `where('examId', '==', examId)` to find questions
   - Maps teacher question types to student app types
   - Sorts questions by creation timestamp

2. **Updated `components/screens/ExamCodeScreen.tsx`:**
   - Better error handling for question loading
   - Shows specific error if questions fail to load

3. **Updated `components/screens/ChecklistScreen.tsx`:**
   - Loads questions before entering exam if not already loaded
   - Handles error state if questions fail to load

4. **Updated `lib/types/index.ts`:**
   - Added support for more question types

---

## 🗄️ Database Structure

Your teacher dashboard creates this structure:

```
Firestore:
├── exams/{examId}
│   ├── name: "GATE Computer Science 2024"
│   ├── subjectCode: "123456"
│   ├── duration: 180
│   ├── status: "PUBLISHED"
│   └── ... (NO questions array here)
│
└── questions/{questionId}
    ├── examId: "abc123"  ← Links to exam
    ├── text: "What is binary search?"
    ├── type: "MCQ"
    ├── options: ["O(n)", "O(log n)", ...]
    ├── points: 2
    └── createdAt: Timestamp
```

---

## 🔄 How It Works Now

### Flow:

```
1. Student enters code "123456"
   ↓
2. App queries: exams where subjectCode == "123456"
   ↓
3. Finds exam document (gets examId)
   ↓
4. App queries: questions where examId == {examId}
   ↓
5. Loads all questions for that exam
   ↓
6. Displays questions to student
```

### Code Flow:

```typescript
// 1. Find exam by code
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

## 🎯 Question Type Mapping

Your teacher dashboard uses these types, which are mapped to student app types:

| Teacher Type | Student Type | Description |
|-------------|-------------|-------------|
| MCQ | mcq | Multiple choice (single answer) |
| SHORT_ANSWER | text | Short text answer |
| ESSAY | text | Long text answer |
| ATTACHMENT | text | File upload (shown as text) |
| MATCH | checkbox | Matching questions |
| FILL_GAPS | checkbox | Fill in the blanks |
| INFORMATION | text | Information display |
| GRID | text | Grid questions |

---

## 🧪 Testing

### Test Checklist:

1. **Create Test Exam in Teacher Dashboard:**
   - [ ] Name: "Test Exam"
   - [ ] Code: "TEST01"
   - [ ] Add 3 MCQ questions
   - [ ] Add 2 text questions
   - [ ] Set status to "PUBLISHED"
   - [ ] Set start time to now
   - [ ] Set end time to 2 hours from now

2. **Test in Student App:**
   - [ ] Enter code "TEST01"
   - [ ] Verify exam name appears
   - [ ] Verify duration appears
   - [ ] Complete proctoring checklist
   - [ ] Verify all 5 questions load
   - [ ] Verify MCQ options display correctly
   - [ ] Answer questions
   - [ ] Submit exam
   - [ ] Check submission in Firestore

### Manual Test in Browser Console:

```javascript
// Test 1: Find exam by code
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './lib/firebase'

const examQuery = query(
  collection(db, 'exams'),
  where('subjectCode', '==', '123456')
)
const examSnap = await getDocs(examQuery)
console.log('Exams found:', examSnap.size)
examSnap.forEach(doc => {
  console.log('Exam:', doc.id, doc.data())
})

// Test 2: Load questions for exam
const examId = examSnap.docs[0].id
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)
)
const questionsSnap = await getDocs(questionsQuery)
console.log('Questions found:', questionsSnap.size)
questionsSnap.forEach(doc => {
  console.log('Question:', doc.id, doc.data())
})
```

---

## 🐛 Troubleshooting

### Issue 1: "No questions found for this exam"

**Possible Causes:**
1. Questions don't exist in Firestore
2. Questions have wrong `examId`
3. Exam status is not "PUBLISHED"

**Solution:**
```javascript
// Check in Firebase Console:
1. Go to Firestore Database
2. Open 'questions' collection
3. Verify questions exist
4. Check each question has 'examId' field
5. Verify 'examId' matches the exam document ID (not subjectCode!)
```

**Common Mistake:**
```javascript
// ❌ WRONG - examId should be document ID, not subjectCode
{
  examId: "123456",  // This is the subjectCode!
  text: "Question..."
}

// ✅ CORRECT - examId is the Firestore document ID
{
  examId: "abc123xyz",  // This is the exam document ID
  text: "Question..."
}
```

### Issue 2: Questions load but show as blank

**Possible Causes:**
1. Question `text` field is empty
2. Question type not recognized

**Solution:**
```javascript
// Check question data in Firestore:
{
  text: "What is 2+2?",  // Must have text
  type: "MCQ",           // Must be valid type
  options: ["3", "4"],   // MCQ must have options
  points: 2              // Must have points
}
```

### Issue 3: Questions appear in wrong order

**Possible Causes:**
1. Questions missing `createdAt` timestamp
2. Questions created at same time

**Solution:**
- Questions are sorted by `createdAt.seconds`
- If timestamps are identical, order may be random
- Consider adding an explicit `order` field in teacher dashboard

### Issue 4: Permission denied error

**Possible Causes:**
1. Firestore security rules too restrictive
2. User not authenticated

**Solution - Update Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow reading published exams
    match /exams/{examId} {
      allow read: if request.auth != null;
    }
    
    // Allow reading questions for any exam
    match /questions/{questionId} {
      allow read: if request.auth != null;
    }
    
    // Allow creating submissions
    match /submissions/{submissionId} {
      allow create: if request.auth != null;
    }
  }
}
```

---

## 📊 Console Logs to Check

When you enter an exam code, you should see these logs:

```
✅ Good logs:
Exam data loaded: { examId: "abc123", name: "GATE", duration: 180 }
Fetching questions from questions collection...
Found questions: 5
Questions loaded and sorted: 5

❌ Bad logs:
Found questions: 0
→ Check if questions exist in Firestore

Error fetching questions: Permission denied
→ Check Firestore security rules

No questions found for this exam
→ Check examId in questions matches exam document ID
```

---

## 🔐 Security Rules

Make sure your Firestore rules allow students to read questions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Exams - anyone authenticated can read published exams
    match /exams/{examId} {
      allow read: if request.auth != null && 
                    resource.data.status == 'PUBLISHED';
      allow write: if request.auth.token.role == 'TEACHER';
    }
    
    // Questions - anyone authenticated can read
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'TEACHER';
    }
    
    // Submissions - students can create their own
    match /submissions/{submissionId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
                    (resource.data.studentId == request.auth.uid ||
                     request.auth.token.role == 'TEACHER');
    }
  }
}
```

---

## 📝 Summary

**What changed:**
- Student app now queries `questions` collection instead of looking for embedded array
- Questions are linked to exams via `examId` field
- Questions are sorted by creation timestamp
- Better error handling and logging

**What you need to do:**
1. Test with an exam created in teacher dashboard
2. Verify questions have correct `examId` (exam document ID, not subjectCode)
3. Check Firestore security rules allow reading questions
4. Monitor browser console for any errors

**Key Points:**
- ✅ Questions are in separate `questions` collection
- ✅ Each question has `examId` field linking to exam
- ✅ Use `where('examId', '==', examId)` to fetch questions
- ✅ Questions sorted by `createdAt` timestamp
- ✅ Question types are mapped from teacher format to student format

Your student app is now ready to load questions from the teacher dashboard! 🚀
