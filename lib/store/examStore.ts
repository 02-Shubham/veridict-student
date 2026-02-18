import { create } from 'zustand'
import type { ExamSession, Answer, ProctoringEvent, SubmissionResult } from '../types'

interface ExamState {
  session: ExamSession | null
  answers: Record<string, Answer>
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'offline'
  lastSavedAt: string | null
  proctoringEvents: ProctoringEvent[]
  submission: SubmissionResult | null

  setSession: (session: ExamSession) => void
  setAnswer: (questionId: string, value: string) => void
  loadAnswers: (answers: Record<string, { value: string; savedAt: string }>) => void
  setAutoSaveStatus: (status: ExamState['autoSaveStatus']) => void
  setLastSavedAt: (time: string) => void
  addProctoringEvent: (event: ProctoringEvent) => void
  setSubmission: (result: SubmissionResult) => void
  reset: () => void
}

export const useExamStore = create<ExamState>((set) => ({
  session: null,
  answers: {},
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  proctoringEvents: [],
  submission: null,

  setSession: (session) => set({ session }),

  setAnswer: (questionId, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          value,
          savedAt: new Date().toISOString(),
          changeCount: (state.answers[questionId]?.changeCount ?? 0) + 1
        }
      }
    })),

  loadAnswers: (answers) =>
    set({
      answers: Object.fromEntries(
        Object.entries(answers).map(([qId, a]) => [
          qId,
          { value: a.value, savedAt: a.savedAt, changeCount: 0 }
        ])
      )
    }),

  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),
  setLastSavedAt: (time) => set({ lastSavedAt: time }),

  addProctoringEvent: (event) =>
    set((state) => ({ proctoringEvents: [...state.proctoringEvents, event] })),

  setSubmission: (result) => set({ submission: result }),

  reset: () =>
    set({
      session: null,
      answers: {},
      autoSaveStatus: 'idle',
      lastSavedAt: null,
      proctoringEvents: [],
      submission: null
    })
}))
