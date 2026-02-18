import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useUIStore } from '../../lib/store/uiStore'
import { useExamStore } from '../../lib/store/examStore'
import { examService } from '../../lib/services/exam'
import { storageService } from '../../lib/services/storage'
import { proctoringService } from '../../lib/services/proctoring'
import type { Question } from '../../lib/types'
import styles from './ExamScreen.module.css'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const ExamScreen: React.FC = () => {
  const { setScreen } = useUIStore()
  const { session, answers, setAnswer, autoSaveStatus, setAutoSaveStatus, setLastSavedAt, lastSavedAt, setSubmission } = useExamStore()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize timer
  useEffect(() => {
    if (!session) return
    const endTime = new Date(session.endTime).getTime()
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
    setTimeLeft(remaining)
  }, [session])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          handleAutoSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft > 0])

  // Load saved answers on mount
  useEffect(() => {
    if (!session) return
    storageService.loadAnswers(session.examId).then((saved) => {
      if (Object.keys(saved).length > 0) {
        useExamStore.getState().loadAnswers(saved)
      }
    })
    // Set exam context for proctoring
    storageService.logProctoringEvent(session.examId, {
      type: 'FOCUS_LOSS', // Placeholder or initial event? "EXAM_START" isn't in type definition but FOCUS_LOSS is safe fallback or we add new type.
      // Wait, proctoringService listens to events globally. Here we just log initial state?
      // Actually, let's just ensure fullscreen:
      type: 'WINDOW_SWITCH',
      timestamp: new Date().toISOString(),
      metadata: 'Exam Screen Mount'
    })
    proctoringService.enterFullscreen()
  }, [session])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!session) return
    autoSaveTimerRef.current = setInterval(() => {
      triggerAutoSave()
    }, 30_000)
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [session, answers])

  const triggerAutoSave = useCallback(async () => {
    if (!session) return
    setAutoSaveStatus('saving')
    try {
      for (const [qId, ans] of Object.entries(answers)) {
        await storageService.saveAnswer(session.examId, qId, ans.value)
      }
      const now = new Date().toLocaleTimeString()
      setLastSavedAt(now)
      setAutoSaveStatus('saved')
    } catch {
      setAutoSaveStatus('offline')
    }
  }, [session, answers, setAutoSaveStatus, setLastSavedAt])

  const handleAnswerChange = async (questionId: string, value: string) => {
    setAnswer(questionId, value)
    // Debounced save on change
    setAutoSaveStatus('saving')
    try {
      await storageService.saveAnswer(session!.examId, questionId, value)
      setLastSavedAt(new Date().toLocaleTimeString())
      setAutoSaveStatus('saved')
    } catch {
      setAutoSaveStatus('offline')
    }
  }

  const handleAutoSubmit = useCallback(async () => {
    if (!session || submitting) return
    setSubmitting(true)
    try {
      await triggerAutoSave()
      const result = await examService.submitExam(session.examId, answers)
      setSubmission(result)
      proctoringService.exitFullscreen()
      setScreen('CONFIRMATION')
    } catch {
      setScreen('ERROR')
    }
  }, [session, submitting, triggerAutoSave, setSubmission, setScreen, answers])

  const handleManualSubmit = async () => {
    setShowConfirmDialog(false)
    setSubmitting(true)
    try {
      await triggerAutoSave()
      const result = await examService.submitExam(session!.examId, answers)
      setSubmission(result)
      proctoringService.exitFullscreen()
      setScreen('CONFIRMATION')
    } catch {
      setSubmitting(false)
      setScreen('ERROR')
    }
  }

  if (!session) return null

  const questions = session.questions
  const currentQuestion: Question | undefined = questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.value?.trim()).length
  const isWarning = timeLeft < 300 // < 5 minutes
  const isCritical = timeLeft < 60  // < 1 minute

  return (
    <div className={styles.container}>
      {/* Header bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoMark}>V</div>
          <div>
            <div className={styles.examTitle}>{session.title}</div>
            <div className={styles.candidateId}>ID: {session.candidateId}</div>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.progressText}>
            {answeredCount} / {questions.length} answered
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={`${styles.timer} ${isWarning ? styles.timerWarning : ''} ${isCritical ? styles.timerCritical : ''}`}>
            <span className={styles.timerIcon}>⏱</span>
            {formatTime(timeLeft)}
          </div>
          <div className={styles.autoSave}>
            {autoSaveStatus === 'saving' && <><span className={styles.savingDot} />Saving…</>}
            {autoSaveStatus === 'saved' && <><span className={styles.savedDot} />Saved {lastSavedAt}</>}
            {autoSaveStatus === 'offline' && <><span className={styles.offlineDot} />Offline</>}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className={styles.main}>
        {/* Question navigator sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Questions</div>
          <div className={styles.questionGrid}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`${styles.qNavBtn} ${i === currentQuestionIndex ? styles.qNavActive : ''} ${answers[q.id]?.value?.trim() ? styles.qNavAnswered : ''}`}
                title={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Question panel */}
        <main className={styles.questionPanel}>
          {currentQuestion ? (
            <>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Question {currentQuestionIndex + 1}</span>
                {currentQuestion.marks && (
                  <span className={styles.marks}>{currentQuestion.marks} marks</span>
                )}
              </div>

              <p className={styles.questionText}>{currentQuestion.text}</p>

              {currentQuestion.type === 'text' && (
                <textarea
                  className={styles.answerTextarea}
                  value={answers[currentQuestion.id]?.value ?? ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here…"
                  rows={10}
                  disabled={submitting}
                />
              )}

              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className={styles.options}>
                  {currentQuestion.options.map((opt, oi) => (
                    <label key={oi} className={`${styles.option} ${answers[currentQuestion.id]?.value === opt ? styles.optionSelected : ''}`}>
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={opt}
                        checked={answers[currentQuestion.id]?.value === opt}
                        onChange={() => handleAnswerChange(currentQuestion.id, opt)}
                        disabled={submitting}
                        className={styles.radioInput}
                      />
                      <span className={styles.optionText}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className={styles.questionNav}>
                <button
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0}
                  className={styles.navBtn}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={styles.navBtn}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noQuestion}>No questions available</div>
          )}
        </main>
      </div>

      {/* Submit button */}
      <footer className={styles.footer}>
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={submitting}
          className={styles.submitBtn}
        >
          {submitting ? <><span className={styles.spinner} /> Submitting…</> : 'Submit Exam'}
        </button>
      </footer>

      {/* Confirm dialog */}
      {showConfirmDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>Submit Exam?</h2>
            <p className={styles.dialogText}>
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              Once submitted, you cannot make changes.
            </p>
            <div className={styles.dialogActions}>
              <button onClick={() => setShowConfirmDialog(false)} className={styles.dialogCancel}>
                Continue Exam
              </button>
              <button onClick={handleManualSubmit} className={styles.dialogConfirm}>
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
