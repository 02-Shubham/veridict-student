import React from 'react'
import { useExamStore } from '../../lib/store/examStore'
import { useUIStore } from '../../lib/store/uiStore'
import styles from './ConfirmationScreen.module.css'

export const ConfirmationScreen: React.FC = () => {
  const { submission, session } = useExamStore()
  // useUIStore hook present but setScreen unused if we just exit

  const handleExit = () => {
    // In a web app, we can't reliably close the tab.
    // Try window.close() (only works if script-opened), otherwise redirect or show message.
    try {
      window.close()
    } catch {
      // ignore
    }
    // Fallback: Reload the page to reset state (like a kiosk reset)
    window.location.reload()
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.card}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.badge}>SUBMISSION CONFIRMED</div>
        <h1 className={styles.title}>Exam Submitted Successfully</h1>
        <p className={styles.subtitle}>
          Your answers have been securely recorded. The submission is cryptographically verified.
        </p>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Submission ID</span>
            <span className={styles.detailValue}>{submission?.submissionId ?? '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Exam</span>
            <span className={styles.detailValue}>{session?.title ?? '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Candidate ID</span>
            <span className={styles.detailValue}>{session?.candidateId ?? '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Submitted At</span>
            <span className={styles.detailValue}>{new Date().toLocaleString()}</span>
          </div>
          <div className={`${styles.detailItem} ${styles.detailFull}`}>
            <span className={styles.detailLabel}>SHA-256 Payload Hash</span>
            <span className={`${styles.detailValue} ${styles.hashValue}`}>
              {submission?.payloadHash ?? '—'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Blockchain Status</span>
            <span className={`${styles.detailValue} ${styles.blockchainStatus}`}>
              <span className={styles.pendingDot} />
              {submission?.blockchainStatus === 'confirmed' ? 'Confirmed on-chain' : 'Pending confirmation'}
            </span>
          </div>
        </div>

        <div className={styles.notice}>
          Keep your Submission ID as proof of submission. Your teacher can verify this using the Veridict Teacher Portal.
        </div>

        <button onClick={handleExit} className={styles.exitBtn}>
          Close Exam Session
        </button>
      </div>
    </div>
  )
}
