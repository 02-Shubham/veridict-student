import React, { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../../lib/store/uiStore'
import { useExamStore } from '../../lib/store/examStore'
import { examService } from '../../lib/services/exam'
import styles from './ExamCodeScreen.module.css'

const CODE_LENGTH = 6

export const ExamCodeScreen: React.FC = () => {
  const { setScreen } = useUIStore()
  const { setSession } = useExamStore()
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9A-Za-z]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    setLocalError('')

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (value && index === CODE_LENGTH - 1 && newCode.every((c) => c !== '')) {
      handleValidate(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '').toUpperCase().slice(0, CODE_LENGTH)
    const newCode = Array(CODE_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i]
    setCode(newCode)
    if (pasted.length === CODE_LENGTH) handleValidate(pasted)
  }

  const handleValidate = async (codeStr: string) => {
    setLocalError('')
    setLoading(true)
    try {
      const result = await examService.validateExamCode(codeStr)
      if (!result.valid) {
        setLocalError(result.error ?? 'Invalid exam code')
        setLoading(false)
        return
      }

      const now = new Date()
      const startTime = new Date(result.startTime!)

      // Update state with partial session info
      const partialSession = {
        examId: result.examId!,
        title: result.title ?? 'Exam',
        candidateId: result.candidateId!,
        questions: [],
        duration: result.duration!,
        startTime: result.startTime!,
        endTime: result.endTime!
      }

      if (now < startTime) {
        // Exam hasn't started yet - go to waiting room
        setSession(partialSession)
        setScreen('WAITING_ROOM')
      } else {
        // Exam has started - fetch questions and go to checklist
        try {
          const paper = await examService.getExamPaper(result.examId!)
          setSession({
            ...partialSession,
            questions: paper.questions,
            duration: paper.duration,
            startTime: paper.startTime,
            endTime: paper.endTime
          })
          setScreen('CHECKLIST')
        } catch (questionError: any) {
          // If questions fail to load, show error
          setLocalError(questionError.message || 'Failed to load exam questions')
          setLoading(false)
          return
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Validation failed'
      setLocalError(message)
      setLoading(false)
    }
  }

  const codeStr = code.join('')

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>EXAM CODE ENTRY</div>
          <h1 className={styles.title}>Enter Your Exam Code</h1>
          <p className={styles.subtitle}>
            Enter the 6-character code provided by your invigilator
          </p>
        </div>

        <div className={styles.codeInputs} onPaste={handlePaste}>
          {code.map((char, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`${styles.codeInput} ${localError ? styles.codeInputError : ''}`}
              disabled={loading}
              aria-label={`Code digit ${i + 1}`}
            />
          ))}
        </div>

        {localError && (
          <div className={styles.errorBanner} role="alert">
            <span>⚠</span> {localError}
          </div>
        )}

        <button
          onClick={() => handleValidate(codeStr)}
          disabled={loading || codeStr.length < CODE_LENGTH}
          className={styles.submitBtn}
        >
          {loading ? <span className={styles.spinner} /> : 'Validate Code →'}
        </button>

        <div className={styles.hint}>
          Code is case-insensitive. Contact your invigilator if you don't have a code.
        </div>
      </div>
    </div>
  )
}
