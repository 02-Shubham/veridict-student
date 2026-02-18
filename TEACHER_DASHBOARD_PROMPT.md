# Teacher Dashboard - Exam Creation Feature Prompt

## Context
I have a React-based teacher dashboard that needs an exam creation and management system. The dashboard should allow teachers to create exams, add questions, and manage exam settings. This connects to the same Firestore database used by the student exam-taking application.

## Requirements

### 1. Exam Creation Form
Create a comprehensive exam creation interface with the following fields:

**Basic Information:**
- Exam Name/Title (text input)
- Subject Code (6-character code, auto-generated or manual)
- Total Marks (number input)
- Duration (in minutes)
- Instructions (textarea)

**Timing:**
- Start Date & Time (datetime picker)
- End Date & Time (datetime picker)

**Status:**
- Draft / Published / Archived (dropdown)

### 2. Question Management
Create a dynamic question builder that allows teachers to:

**Add Multiple Question Types:**
- Text/Essay questions (long answer)
- Multiple Choice Questions (MCQ)
- Checkbox questions (multiple correct answers)

**For Each Question:**
- Question text (textarea)
- Question type selector
- Marks allocation (number input)
- Order/sequence number (auto-incremented)
- For MCQ/Checkbox: Add/remove options dynamically
- Optional: Correct answer (for auto-grading)

**Question List Features:**
- Drag-and-drop reordering
- Edit existing questions
- Delete questions
- Duplicate questions
- Preview mode

### 3. Firestore Integration

**Collection Structure:**
```
exams/{examId}
  - name: string
  - subjectCode: string (6 digits, e.g., "123456")
  - duration: number (minutes)
  - startTime: Timestamp
  - endTime: Timestamp
  - questions: Array<Question>
  - totalMarks: number
  - instructions: string
  - createdBy: string (teacher UID)
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - status: "draft" | "published" | "archived"
```

**Question Object:**
```typescript
{
  id: string,              // e.g., "q1", "q2"
  text: string,
  type: "text" | "mcq" | "checkbox",
  options?: string[],      // For MCQ/checkbox
  marks: number,
  order: number,
  correctAnswer?: string   // Optional, for auto-grading
}
```

### 4. Exam Management Dashboard

**List View:**
- Display all exams in a table/card layout
- Show: Name, Subject Code, Duration, Start Time, Status
- Filter by status (Draft/Published/Archived)
- Search by name or subject code
- Sort by creation date, start time

**Actions:**
- Create New Exam (button)
- Edit Exam (icon/button per row)
- Delete Exam (with confirmation)
- Duplicate Exam
- View Submissions (link to results page)
- Change Status (Draft ↔ Published ↔ Archived)

### 5. Validation Rules

**Before Saving:**
- Exam name is required
- Subject code must be exactly 6 characters
- Subject code must be unique (check Firestore)
- Duration must be > 0
- Start time must be before end time
- At least 1 question is required
- All questions must have text and marks > 0
- MCQ/Checkbox questions must have at least 2 options

### 6. UI/UX Requirements

**Design:**
- Clean, modern interface
- Responsive design (works on desktop and tablet)
- Use a component library (Material-UI, Ant Design, or Chakra UI)
- Loading states for all async operations
- Success/error toast notifications

**User Flow:**
1. Teacher clicks "Create New Exam"
2. Fills basic information form
3. Adds questions one by one using question builder
4. Can preview exam before saving
5. Saves as draft or publishes immediately
6. Redirected to exam list with success message

### 7. Example Data

**Sample Exam Document:**
```json
{
  "name": "GATE Computer Science 2024",
  "subjectCode": "123456",
  "duration": 180,
  "startTime": Timestamp("2024-03-15T09:00:00Z"),
  "endTime": Timestamp("2024-03-15T12:00:00Z"),
  "totalMarks": 100,
  "instructions": "Answer all questions. No negative marking.",
  "questions": [
    {
      "id": "q1",
      "text": "What is the time complexity of binary search?",
      "type": "mcq",
      "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      "marks": 2,
      "order": 1,
      "correctAnswer": "O(log n)"
    },
    {
      "id": "q2",
      "text": "Explain the difference between stack and queue.",
      "type": "text",
      "marks": 5,
      "order": 2
    }
  ],
  "createdBy": "teacher-uid-123",
  "createdAt": Timestamp.now(),
  "updatedAt": Timestamp.now(),
  "status": "published"
}
```

### 8. Technical Stack

**Use:**
- React (with hooks)
- Firebase/Firestore for database
- React Hook Form or Formik for form management
- Date-fns or Day.js for date handling
- React Beautiful DnD for drag-and-drop (optional)
- React Router for navigation

**Firebase Setup:**
```javascript
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Create exam
const createExam = async (examData) => {
  const docRef = await addDoc(collection(db, 'exams'), {
    ...examData,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return docRef.id
}

// Update exam
const updateExam = async (examId, examData) => {
  await updateDoc(doc(db, 'exams', examId), {
    ...examData,
    updatedAt: new Date()
  })
}

// Check if subject code exists
const checkSubjectCodeExists = async (code) => {
  const q = query(collection(db, 'exams'), where('subjectCode', '==', code))
  const snapshot = await getDocs(q)
  return !snapshot.empty
}
```

### 9. Additional Features (Nice to Have)

- **Bulk Import:** Upload questions from CSV/Excel
- **Question Bank:** Save questions to reuse across exams
- **Preview Mode:** Preview exam as student would see it
- **Analytics:** View exam statistics (avg score, completion rate)
- **Notifications:** Send email/SMS to students when exam is published

### 10. Testing Checklist

Before deployment, test:
- [ ] Create exam with all question types
- [ ] Edit existing exam
- [ ] Delete exam
- [ ] Duplicate exam
- [ ] Subject code uniqueness validation
- [ ] Date/time validation
- [ ] Question reordering
- [ ] Student can see exam with code "123456"
- [ ] Student can load all questions
- [ ] Student submission saves correctly

---

## Implementation Steps

1. **Setup Firebase connection** in your React app
2. **Create exam form component** with basic fields
3. **Create question builder component** with dynamic add/remove
4. **Implement Firestore CRUD operations**
5. **Create exam list/dashboard component**
6. **Add validation and error handling**
7. **Test with student app** to ensure data flows correctly
8. **Deploy and test end-to-end**

---

## Expected Outcome

After implementation:
1. Teacher creates exam "GATE" with code "123456"
2. Teacher adds 10 questions (mix of MCQ and text)
3. Teacher publishes exam
4. Student enters code "123456" in student app
5. Student sees exam title, duration, and all 10 questions
6. Student completes exam and submits
7. Teacher can view submission in dashboard

---

## Need Help?

If you encounter issues:
1. Check Firebase console to verify data structure
2. Check browser console for errors
3. Verify Firestore security rules allow read/write
4. Test with simple data first, then add complexity
