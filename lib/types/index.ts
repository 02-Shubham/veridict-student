// Shared TypeScript types for Veridict Student App
// (Ported from Electron Desktop App)

export interface Student {
  uid: string
  email: string
  name: string
  role: 'STUDENT'
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'mcq' | 'checkbox'
  options?: string[]
  marks?: number
}

export interface ExamSession {
  examId: string
  title: string
  candidateId: string
  questions: Question[]
  duration: number       // minutes
  startTime: string      // ISO8601
  endTime: string        // ISO8601
}

export interface Answer {
  value: string
  savedAt: string        // ISO8601
  changeCount?: number
}

export type ProctoringEventType =
  | 'FOCUS_LOSS'
  | 'WINDOW_SWITCH'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'SCREENSHOT_ATTEMPT'
  | 'SUSPICIOUS_KEYSTROKE'
  | 'DEVTOOLS_OPEN'
  | 'FULLSCREEN_EXIT'

export interface ProctoringEvent {
  type: ProctoringEventType
  timestamp: string
  metadata?: string
}

export interface SubmissionResult {
  submissionId: string
  payloadHash: string
  blockchainStatus: 'pending' | 'confirmed'
}

export type AppScreen =
  | 'LOGIN'
  | 'EXAM_CODE'
  | 'WAITING_ROOM'
  | 'EXAM'
  | 'CONFIRMATION'
  | 'ERROR'
