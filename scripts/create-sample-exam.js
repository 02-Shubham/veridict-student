// Sample script to create test exam data in Firestore
// Run this in Node.js or browser console

const sampleExam = {
  name: "GATE Computer Science 2024",
  subjectCode: "123456",
  duration: 180, // 3 hours in minutes
  startTime: new Date("2024-02-19T10:00:00Z"),
  endTime: new Date("2024-02-19T13:00:00Z"),
  totalMarks: 100,
  instructions: "Answer all questions. No negative marking. Use of calculator is not allowed.",
  questions: [
    {
      id: "q1",
      text: "What is the time complexity of binary search algorithm?",
      type: "mcq",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      marks: 2,
      order: 1,
      correctAnswer: "O(log n)"
    },
    {
      id: "q2",
      text: "Which data structure uses LIFO (Last In First Out) principle?",
      type: "mcq",
      options: ["Queue", "Stack", "Array", "Linked List"],
      marks: 2,
      order: 2,
      correctAnswer: "Stack"
    },
    {
      id: "q3",
      text: "Explain the difference between stack and queue data structures with examples.",
      type: "text",
      marks: 5,
      order: 3
    },
    {
      id: "q4",
      text: "What is the purpose of a hash function in hash tables?",
      type: "text",
      marks: 5,
      order: 4
    },
    {
      id: "q5",
      text: "Which of the following are characteristics of object-oriented programming?",
      type: "checkbox",
      options: ["Encapsulation", "Inheritance", "Polymorphism", "Compilation"],
      marks: 3,
      order: 5,
      correctAnswer: "Encapsulation,Inheritance,Polymorphism"
    }
  ],
  status: "published",
  createdBy: "teacher-sample",
  createdAt: new Date(),
  updatedAt: new Date()
}

// To use in Firebase Console or Node.js:
// 1. Go to Firebase Console → Firestore
// 2. Click "Start collection"
// 3. Collection ID: "exams"
// 4. Document ID: "gate-cs-2024" (or auto-generate)
// 5. Paste the JSON above (convert dates to timestamps)

console.log(JSON.stringify(sampleExam, null, 2))
