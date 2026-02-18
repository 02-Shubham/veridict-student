// Test script to verify Firestore data structure
// Run this in your browser console on the student app

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function testExamData(subjectCode: string) {
  console.log('🔍 Testing exam code:', subjectCode)
  
  try {
    // Test 1: Find exam by subject code
    const examsRef = collection(db, 'exams')
    const q = query(examsRef, where('subjectCode', '==', subjectCode))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.error('❌ No exam found with code:', subjectCode)
      return
    }
    
    const examDoc = snapshot.docs[0]
    const examData = examDoc.data()
    
    console.log('✅ Exam found:', {
      id: examDoc.id,
      name: examData.name,
      duration: examData.duration,
      questionCount: examData.questions?.length || 0
    })
    
    // Test 2: Check questions
    if (!examData.questions || examData.questions.length === 0) {
      console.warn('⚠️ No questions in exam document')
      
      // Check subcollection
      const questionsRef = collection(db, 'exams', examDoc.id, 'questions')
      const qSnap = await getDocs(questionsRef)
      
      if (qSnap.empty) {
        console.error('❌ No questions in subcollection either')
      } else {
        console.log('✅ Found questions in subcollection:', qSnap.size)
      }
    } else {
      console.log('✅ Questions loaded:', examData.questions.length)
      examData.questions.forEach((q: any, i: number) => {
        console.log(`  Q${i + 1}:`, q.text?.substring(0, 50) + '...')
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}
