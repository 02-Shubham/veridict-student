import React from 'react'
import { useUIStore } from '../../lib/store/uiStore'
import styles from './ErrorScreen.module.css'

export const ErrorScreen: React.FC = () => {
  const { error, setScreen } = useUIStore()

  const handleExit = () => {
    // Fallback: Reload to restart the app
    window.location.reload()
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.card}>
        <div className={styles.errorIcon}>!</div>
        <div className={styles.badge}>ERROR</div>
        <h1 className={styles.title}>Something Went Wrong</h1>
        <p className={styles.message}>
          {error ?? 'An unexpected error occurred. Please contact your invigilator.'}
        </p>
        <div className={styles.actions}>
          <button onClick={() => setScreen('EXAM')} className={styles.retryBtn}>
            Return to Exam
          </button>
          <button onClick={handleExit} className={styles.quitBtn}>
            Exit Application
          </button>
        </div>
        <div className={styles.support}>
          If this issue persists, note your Candidate ID and contact your invigilator.
        </div>
      </div>
    </div>
  )
}
