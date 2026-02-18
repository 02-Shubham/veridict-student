# Quick Start Guide - Testing Your Exam System

## 🚀 Test in 5 Minutes

### Step 1: Create Test Exam (Teacher Dashboard)

1. Open your teacher dashboard
2. Create new exam:
   - **Name:** "Test Exam"
   - **Code:** "123456"
   - **Duration:** 60 minutes
   - **Start Time:** Now
   - **End Time:** 1 hour from now
   - **Status:** PUBLISHED

3. Add questions:
   - **Question 1 (MCQ):**
     - Text: "What is 2+2?"
     - Options: ["3", "4", "5", "6"]
     - Points: 2
   
   - **Question 2 (Text):**
     - Text: "Explain binary search"
     - Points: 5

4. Save/Publish exam

### Step 2: Verify in Firestore

1. Open Firebase Console
2. Go to Firestore Database
3. Check `exams` collection:
   - Should have document with `subjectCode: "123456"`
   - Note the document ID (e.g., "abc123xyz")
4. Check `questions` collection:
   - Should have 2 documents
   - Each should have `examId: "abc123xyz"` (matching exam doc ID)

### Step 3: Test Student App

1. Run student app:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:3000`

3. Enter code: **123456**

4. Check browser console - should see:
   ```
   Exam data loaded: { examId: "abc123xyz", name: "Test Exam", duration: 60 }
   Fetching questions from questions collection...
   Found questions: 2
   Questions loaded and sorted: 2
   ```

5. Complete proctoring checklist

6. Verify both questions appear

7. Answer questions and submit

8. Check `submissions` collection in Firestore

---

## ✅ Success Checklist

- [ ] Exam created in teacher dashboard
- [ ] Exam appears in Firestore `exams` collection
- [ ] Questions appear in Firestore `questions` collection
- [ ] Questions have correct `examId` (exam document ID)
- [ ] Student can find exam with code
- [ ] Questions load in student app
- [ ] Student can answer questions
- [ ] Submission saves to Firestore

---

## ❌ Common Issues

### "Invalid exam code"
→ Check `subjectCode` in exam document is exactly "123456"

### "No questions found"
→ Check questions have `examId` matching exam document ID (not subjectCode!)

### "Permission denied"
→ Update Firestore security rules (see QUESTION_LOADING_FIX.md)

### Questions show as blank
→ Check questions have `text` field with content

---

## 🔍 Debug Commands

Run in browser console:

```javascript
// Check if exam exists
const examQuery = query(
  collection(db, 'exams'),
  where('subjectCode', '==', '123456')
)
const examSnap = await getDocs(examQuery)
console.log('Found exams:', examSnap.size)

// Check if questions exist
const examId = examSnap.docs[0].id
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)
)
const questionsSnap = await getDocs(questionsQuery)
console.log('Found questions:', questionsSnap.size)
```

---

## 📞 Need Help?

1. Check browser console for errors
2. Check Firebase Console for data
3. Read QUESTION_LOADING_FIX.md for detailed troubleshooting
4. Verify Firestore security rules
