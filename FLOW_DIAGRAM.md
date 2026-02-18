# Exam System Flow Diagram

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEACHER DASHBOARD                            │
│                                                                   │
│  1. Create Exam                                                  │
│     ├─ Name: "GATE"                                             │
│     ├─ Code: "123456"                                           │
│     ├─ Duration: 180 min                                        │
│     └─ Status: PUBLISHED                                        │
│                                                                   │
│  2. Add Questions                                                │
│     ├─ Q1: MCQ (2 points)                                       │
│     ├─ Q2: Text (5 points)                                      │
│     └─ Q3: MCQ (3 points)                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE DATABASE                          │
│                                                                   │
│  exams/exam-abc123                                               │
│  ├─ name: "GATE"                                                │
│  ├─ subjectCode: "123456"                                       │
│  ├─ duration: 180                                               │
│  ├─ status: "PUBLISHED"                                         │
│  └─ (NO questions array)                                        │
│                                                                   │
│  questions/q1-xyz                                                │
│  ├─ examId: "exam-abc123" ◄─────┐                              │
│  ├─ text: "What is 2+2?"        │                              │
│  ├─ type: "MCQ"                  │                              │
│  ├─ options: ["3","4","5","6"]  │  Links to exam               │
│  └─ points: 2                    │                              │
│                                   │                              │
│  questions/q2-def                │                              │
│  ├─ examId: "exam-abc123" ◄─────┤                              │
│  ├─ text: "Explain..."           │                              │
│  ├─ type: "SHORT_ANSWER"         │                              │
│  └─ points: 5                    │                              │
│                                   │                              │
│  questions/q3-ghi                │                              │
│  ├─ examId: "exam-abc123" ◄─────┘                              │
│  ├─ text: "Which of..."                                         │
│  ├─ type: "MCQ"                                                 │
│  └─ points: 3                                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STUDENT WEB APP                             │
│                                                                   │
│  Step 1: Enter Code                                              │
│  ┌──────────────────┐                                           │
│  │  Enter: 123456   │                                           │
│  └──────────────────┘                                           │
│           │                                                       │
│           ▼                                                       │
│  Step 2: Find Exam                                               │
│  Query: exams where subjectCode == "123456"                     │
│  Result: exam-abc123                                             │
│           │                                                       │
│           ▼                                                       │
│  Step 3: Load Questions                                          │
│  Query: questions where examId == "exam-abc123"                 │
│  Result: [q1-xyz, q2-def, q3-ghi]                              │
│           │                                                       │
│           ▼                                                       │
│  Step 4: Display Exam                                            │
│  ┌─────────────────────────────────────┐                       │
│  │ GATE Computer Science               │                       │
│  │ Duration: 180 minutes               │                       │
│  │                                     │                       │
│  │ Q1: What is 2+2? (2 points)        │                       │
│  │  ○ 3  ○ 4  ○ 5  ○ 6                │                       │
│  │                                     │                       │
│  │ Q2: Explain... (5 points)          │                       │
│  │  [Text area]                        │                       │
│  │                                     │                       │
│  │ Q3: Which of... (3 points)         │                       │
│  │  ○ A  ○ B  ○ C  ○ D                │                       │
│  └─────────────────────────────────────┘                       │
│           │                                                       │
│           ▼                                                       │
│  Step 5: Submit Answers                                          │
│  Save to: submissions/sub-123456                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Code Flow in Student App

```typescript
// 1. Student enters code "123456"
const code = "123456"

// 2. Find exam by subject code
const examQuery = query(
  collection(db, 'exams'),
  where('subjectCode', '==', code)
)
const examSnap = await getDocs(examQuery)
const examDoc = examSnap.docs[0]
const examId = examDoc.id  // "exam-abc123"

// 3. Load questions for this exam
const questionsQuery = query(
  collection(db, 'questions'),
  where('examId', '==', examId)  // "exam-abc123"
)
const questionsSnap = await getDocs(questionsQuery)

// 4. Map questions to app format
const questions = questionsSnap.docs.map(doc => ({
  id: doc.id,
  text: doc.data().text,
  type: doc.data().type,
  options: doc.data().options,
  marks: doc.data().points
}))

// 5. Display exam with questions
return (
  <div>
    <h1>{examDoc.data().name}</h1>
    {questions.map(q => (
      <Question key={q.id} {...q} />
    ))}
  </div>
)
```

---

## 🎯 Key Relationships

```
Exam Document ID ──────┐
(exam-abc123)          │
                       │
                       │ Links via examId
                       │
                       ▼
Question Documents
├─ q1-xyz (examId: "exam-abc123")
├─ q2-def (examId: "exam-abc123")
└─ q3-ghi (examId: "exam-abc123")
```

---

## ⚠️ Common Mistake

```
❌ WRONG: Using subjectCode as examId

questions/q1-xyz
├─ examId: "123456"  ← This is the subjectCode!
└─ text: "Question..."

This won't work because:
- subjectCode is "123456"
- examId should be "exam-abc123" (document ID)


✅ CORRECT: Using document ID as examId

questions/q1-xyz
├─ examId: "exam-abc123"  ← This is the document ID!
└─ text: "Question..."

This works because:
- We query: where('examId', '==', 'exam-abc123')
- Matches the exam document ID
```

---

## 📝 Summary

1. **Teacher creates exam** → Saves to `exams` collection
2. **Teacher adds questions** → Saves to `questions` collection with `examId`
3. **Student enters code** → Finds exam by `subjectCode`
4. **App gets exam ID** → Uses document ID (not subjectCode)
5. **App loads questions** → Queries `questions` where `examId` matches
6. **Student takes exam** → Answers questions
7. **Student submits** → Saves to `submissions` collection

**Critical Point:** The `examId` in questions must match the **Firestore document ID** of the exam, not the `subjectCode`!
