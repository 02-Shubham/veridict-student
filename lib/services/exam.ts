import { collection, query, where, getDocs, getDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { ExamSession, SubmissionResult } from '../types'

export const examService = {
  async validateExamCode(code: string): Promise<{ valid: boolean; examId?: string; error?: string; title?: string; candidateId?: string; duration?: number; startTime?: string; endTime?: string }> {
    try {
      // Query Firestore collection 'exams' for code matching input (field 'subjectCode')
      const examsRef = collection(db, 'exams')
      const q = query(examsRef, where('subjectCode', '==', code))
      // Handle both string and number types for code if necessary, but subjectCode seems to be string in screenshot
      const qNumber = query(examsRef, where('subjectCode', '==', Number(code)))
      
      let querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        querySnapshot = await getDocs(qNumber)
      }

      if (querySnapshot.empty) {
        return { valid: false, error: 'Invalid exam code' }
      }

      const docSnapshot = querySnapshot.docs[0]
      const data = docSnapshot.data()
      
      // Handle date fields that might be missing in the screenshot
      // Default to "now" start and "now + duration" end if missing, so the exam is immediately available
      const now = new Date()
      const startTime = data.startTime?.toDate?.()?.toISOString() || data.startTime || now.toISOString()
      
      let endTime = data.endTime?.toDate?.()?.toISOString() || data.endTime
      if (!endTime && data.duration) {
        // Calculate end time based on start time + duration (minutes)
        const start = new Date(startTime)
        endTime = new Date(start.getTime() + (data.duration * 60000)).toISOString()
      } else if (!endTime) {
        // Fallback: 1 hour from now
        endTime = new Date(now.getTime() + 3600000).toISOString()
      }

      return {
        valid: true,
        examId: docSnapshot.id,
        title: data.name || data.title || 'Untitled Exam', // Map 'name' from screenshot to 'title'
        candidateId: 'CAND-' + Math.floor(Math.random() * 10000),
        duration: data.duration || 60,
        startTime,
        endTime
      }
    } catch (error: any) {
      console.error('Validation error:', error)
      return { valid: false, error: error.message || 'Validation failed' }
    }
  },

  async getExamPaper(examId: string): Promise<ExamSession> {
    try {
      const examRef = doc(db, 'exams', examId)
      const examSnap = await getDoc(examRef)
      
      if (!examSnap.exists()) {
        throw new Error('Exam not found')
      }

      const data = examSnap.data()
      // Check if questions are in a subcollection or array field
      let questions = data.questions || []
      
      if (!questions.length) {
        // Fallback: Check subcollection 'questions'
        const questionsRef = collection(db, 'exams', examId, 'questions')
        const qSnap = await getDocs(questionsRef)
        questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      }

      // Ensure start/end times are strings
      const startTime = data.startTime?.toDate?.()?.toISOString() || data.startTime
      const endTime = data.endTime?.toDate?.()?.toISOString() || data.endTime

      return {
        examId,
        title: data.title,
        candidateId: 'CAND-SESSION', // Should come from auth context
        questions: questions.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
        duration: data.duration,
        startTime,
        endTime
      }
    } catch (error: any) {
      console.error('Get paper error:', error)
      throw new Error(error.message || 'Failed to load exam paper')
    }
  },

  async submitExam(examId: string, answers: Record<string, any>): Promise<SubmissionResult> {
    try {
      const submissionId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const payload = {
        examId,
        answers,
        submittedAt: new Date().toISOString(),
        blockchainStatus: 'pending'
      }

      await setDoc(doc(db, 'submissions', submissionId), payload)
      
      // Mock hash for display
      const payloadHash = 'hash-' + Math.random().toString(36).substring(7)
      
      return {
        submissionId,
        payloadHash,
        blockchainStatus: 'pending'
      }
    } catch (error: any) {
      console.error('Submission error:', error)
      throw new Error('Submission failed')
    }
  }
}
