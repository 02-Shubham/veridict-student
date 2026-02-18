import React, { useEffect, useState, useCallback } from 'react'
import { useUIStore } from '../../lib/store/uiStore'
import { useExamStore } from '../../lib/store/examStore'
import { examService } from '../../lib/services/exam'
import styles from './WaitingRoomScreen.module.css'

function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = String(Math.floor(total / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return { hours, minutes, seconds }
}

export const WaitingRoomScreen: React.FC = () => {
  const { setScreen } = useUIStore()
  const { session, setSession } = useExamStore()
  const [msRemaining, setMsRemaining] = useState(0)
  const [fetching, setFetching] = useState(false)

  const startTime = session?.startTime ? new Date(session.startTime) : null

  const fetchAndStart = useCallback(async () => {
    if (!session || fetching) return
    setFetching(true)
    try {
      // In Next.js, we call the API service instead of Electron IPC
      const paper = await examService.getExamPaper(session.examId)
      setSession({ ...session, questions: paper.questions })
      setScreen('EXAM')
    } catch (err) {
      console.error('Failed to start exam:', err)
      setFetching(false)
    }
  }, [session, fetching, setSession, setScreen])

  useEffect(() => {
    if (!startTime) return

    const tick = () => {
      const remaining = startTime.getTime() - Date.now()
      setMsRemaining(remaining)
      if (remaining <= 0) {
        fetchAndStart()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime, fetchAndStart])

  const { hours, minutes, seconds } = formatCountdown(msRemaining)

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.card}>
        <div className={styles.statusDot} />
        <div className={styles.badge}>WAITING ROOM</div>
        <h1 className={styles.title}>{session?.title ?? 'Exam'}</h1>
        <p className={styles.subtitle}>Your exam will begin automatically when the timer reaches zero</p>

        <div className={styles.countdown}>
          <div className={styles.timeBlock}>
            <span className={styles.timeValue}>{hours}</span>
            <span className={styles.timeLabel}>Hours</span>
          </div>
          <span className={styles.timeSep}>:</span>
          <div className={styles.timeBlock}>
            <span className={styles.timeValue}>{minutes}</span>
            <span className={styles.timeLabel}>Minutes</span>
          </div>
          <span className={styles.timeSep}>:</span>
          <div className={styles.timeBlock}>
            <span className={styles.timeValue}>{seconds}</span>
            <span className={styles.timeLabel}>Seconds</span>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Duration</span>
            <span className={styles.infoValue}>{session?.duration ?? '--'} minutes</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Candidate ID</span>
            <span className={styles.infoValue}>{session?.candidateId ?? '--'}</span>
          </div>
        </div>

        <div className={styles.rules}>
          <p className={styles.rulesTitle}>📋 Exam Rules</p>
          <ul className={styles.rulesList}>
            <li>Do not switch windows or applications during the exam</li>
            <li>Copy, paste, and screenshots are disabled</li>
            <li>All activity is monitored and logged</li>
            <li>The exam will auto-submit when time expires</li>
          </ul>
        </div>

        {fetching && (
          <div className={styles.fetchingBanner}>
            <span className={styles.spinner} />
            Loading exam paper…
          </div>
        )}
      </div>
    </div>
  )
}
