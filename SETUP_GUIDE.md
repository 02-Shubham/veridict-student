# Complete Setup Guide - Exam System

## 🎯 Overview

You have two applications sharing one Firestore database:
1. **Teacher Dashboard** (React) - Create exams and questions
2. **Student App** (Next.js) - Take exams

## 📋 What I Fixed in Student App

### 1. Enhanced Error Handling
- Added detailed console logging to track data loading
- Better error messages when questions are missing
- Handles both embedded questions and subcollection questions

### 2. Improved Data Loading
- Fixed question loading from Firestore
- Added fallback for missing timestamps
- Better handling of exam duration and timing

### 3. Enhanced Submission
- Added studentId to submissions
- Better error tracking

## 🚀 Next Steps

### For Student App (Current Project):

1. **Test the fixes:**
   ```bash
   npm run dev
   ```

2. **Open browser console** and enter exam code "123456"

3. **Check console logs** - you should see:
   ```
   Exam data loaded: { examId: "...", hasQuestions: true, questionCount: 10 }
   ```

4. **If questions don't load**, check Firestore:
   - Go to Firebase Console
   - Open Firestore Database
   - Find `exams` collection
   - Look for document with `subjectCode: "123456"`
   - Verify it has a `questions` array with data

### For Teacher Dashboard:

1. **Use the prompt** in `TEACHER_DASHBOARD_PROMPT.md`

2. **Give this to Kiro or another AI:**
   ```
   I need to create an exam creation feature for my React teacher dashboard.
   Please read TEACHER_DASHBOARD_PROMPT.md and implement the exam creation form
   with question builder that saves to Firestore.
   ```

3. **Key points to implement:**
   - Exam form with name, code, duration, dates
   - Question builder (MCQ, text, checkbox)
   - Save to Firestore with exact structure in FIRESTORE_STRUCTURE.md
   - Validate subject code is unique

## 📊 Firestore Structure

See `FIRESTORE_STRUCTURE.md` for complete details.

**Quick Reference:**

```javascript
// Exam Document
{
  name: "GATE 2024",
  subjectCode: "123456",
  duration: 180,
  startTime: Timestamp,
  endTime: Timestamp,
  questions: [
    {
      id: "q1",
      text: "Question text here",
      type: "mcq",
      options: ["A", "B", "C", "D"],
      marks: 2,
      order: 1
    }
  ]
}
```

## 🔧 Troubleshooting

### Problem: Questions not loading

**Check 1:** Verify exam exists in Firestore
```javascript
// In browser console
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './lib/firebase'

const q = query(collection(db, 'exams'), where('subjectCode', '==', '123456'))
const snap = await getDocs(q)
console.log('Found:', snap.size, 'exams')
snap.forEach(doc => console.log(doc.data()))
```

**Check 2:** Verify questions array exists
- Open Firebase Console
- Go to Firestore
- Find exam document
- Check if `questions` field exists and has data

**Check 3:** Check browser console for errors
- Look for "Exam data loaded" log
- Look for "Questions from subcollection" log
- Check for any red errors

### Problem: Exam code not found

**Solution:** Ensure teacher created exam with exact code "123456"
- Subject code must be string, not number
- Case-sensitive (though code converts to uppercase)
- Must be exactly 6 characters

### Problem: Time/duration issues

**Solution:** Ensure dates are set correctly
- `startTime` should be in the past or now
- `endTime` should be in the future
- `duration` should match (endTime - startTime) in minutes

## 📝 Testing Checklist

### Teacher Dashboard:
- [ ] Create exam with name "GATE"
- [ ] Set subject code "123456"
- [ ] Set duration 180 minutes
- [ ] Add at least 3 questions (1 MCQ, 2 text)
- [ ] Set start time to now
- [ ] Set end time to 3 hours from now
- [ ] Save/publish exam
- [ ] Verify in Firestore console

### Student App:
- [ ] Enter code "123456"
- [ ] See exam title "GATE"
- [ ] See duration "180 minutes"
- [ ] See all 3 questions
- [ ] Answer questions
- [ ] Submit exam
- [ ] Check submission in Firestore

## 🎓 Example: Creating Test Data Manually

If you want to test immediately without teacher dashboard:

1. Go to Firebase Console → Firestore
2. Create collection `exams`
3. Add document with ID `test-exam-1`:

```json
{
  "name": "GATE Computer Science",
  "subjectCode": "123456",
  "duration": 180,
  "startTime": "2024-02-19T10:00:00Z",
  "endTime": "2024-02-19T13:00:00Z",
  "totalMarks": 10,
  "instructions": "Answer all questions",
  "questions": [
    {
      "id": "q1",
      "text": "What is 2+2?",
      "type": "mcq",
      "options": ["3", "4", "5", "6"],
      "marks": 2,
      "order": 1,
      "correctAnswer": "4"
    },
    {
      "id": "q2",
      "text": "Explain binary search",
      "type": "text",
      "marks": 5,
      "order": 2
    }
  ],
  "status": "published",
  "createdAt": "2024-02-19T08:00:00Z"
}
```

4. Test in student app with code "123456"

## 📞 Support

If issues persist:
1. Check Firebase Console for data
2. Check browser console for errors
3. Verify Firebase config in `.env.local`
4. Check Firestore security rules allow read/write
