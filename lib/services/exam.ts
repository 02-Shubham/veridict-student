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
      console.log('Exam data loaded:', { examId, name: data.name, duration: data.duration })
      
      // Fetch questions from separate 'questions' collection where examId matches
      console.log('Fetching questions from questions collection...')
      const questionsQuery = query(
        collection(db, 'questions'),
        where('examId', '==', examId)
      )
      const questionsSnap = await getDocs(questionsQuery)
      
      console.log('Found questions:', questionsSnap.size)
      
      if (questionsSnap.empty) {
        throw new Error('No questions found for this exam. Please contact your instructor.')
      }

      // Map questions to the format expected by the app
      const questions = questionsSnap.docs.map(doc => {
        const qData = doc.data()
        
        // Map teacher dashboard question types to student app types
        let questionType: 'text' | 'mcq' | 'checkbox' = 'text'
        const teacherType = qData.type?.toUpperCase()
        
        if (teacherType === 'MCQ') {
          questionType = 'mcq'
        } else if (teacherType === 'MATCH' || teacherType === 'FILL_GAPS') {
          questionType = 'checkbox'
        } else if (teacherType === 'SHORT_ANSWER' || teacherType === 'ESSAY' || teacherType === 'ATTACHMENT') {
          questionType = 'text'
        }
        
        return {
          id: doc.id,
          text: qData.text || '',
          type: questionType,
          options: qData.options || [],
          marks: qData.points || 0,
          order: qData.createdAt?.seconds || 0 // Use timestamp for ordering
        }
      })

      // Sort questions by creation time (oldest first)
      questions.sort((a: any, b: any) => a.order - b.order)
      
      console.log('Questions loaded and sorted:', questions.length)

      // Ensure start/end times are strings
      const now = new Date()
      const startTime = data.startTime?.toDate?.()?.toISOString() || data.startTime || now.toISOString()
      
      let endTime = data.endTime?.toDate?.()?.toISOString() || data.endTime
      if (!endTime && data.duration) {
        const start = new Date(startTime)
        endTime = new Date(start.getTime() + (data.duration * 60000)).toISOString()
      } else if (!endTime) {
        endTime = new Date(now.getTime() + 3600000).toISOString()
      }

      return {
        examId,
        title: data.name || data.title || 'Untitled Exam',
        candidateId: 'CAND-SESSION', // Should come from auth context
        questions,
        duration: data.duration || 60,
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
      
      // Get student info from auth if available
      const studentId = 'student-' + Math.random().toString(36).substring(7) // Replace with actual auth.currentUser.uid
      
      const payload = {
        examId,
        studentId,
        answers,
        submittedAt: new Date().toISOString(),
        blockchainStatus: 'pending' as const,
        timeSpent: 0 // Calculate actual time spent
      }

      await setDoc(doc(db, 'submissions', submissionId), payload)
      console.log('Exam submitted successfully:', submissionId)
      
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
