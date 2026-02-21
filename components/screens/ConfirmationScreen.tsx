import React, { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useExamStore } from '../../lib/store/examStore'
import { useUIStore } from '../../lib/store/uiStore'
import styles from './ConfirmationScreen.module.css'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const ConfirmationScreen: React.FC = () => {
  const { submission, session } = useExamStore()
  // useUIStore hook present but setScreen unused if we just exit
  const [liveStatus, setLiveStatus] = useState<string>(submission?.blockchainStatus || 'pending')
  const [txHash, setTxHash] = useState<string | null>(submission?.blockchainTxHash || null)
  const [downloading, setDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Listen to the submission document in Firestore for real-time updates from our blockchain agent
  useEffect(() => {
    if (!submission?.submissionId) return

    const unsub = onSnapshot(doc(db, 'submissions', submission.submissionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.blockchainStatus) {
          setLiveStatus(data.blockchainStatus)
        }
        if (data.blockchainTxHash) {
          setTxHash(data.blockchainTxHash)
        }
      }
    })

    return () => unsub()
  }, [submission?.submissionId])

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return
    setDownloading(true)
    try {
      // Temporarily hide the buttons for the screenshot
      const buttons = receiptRef.current.querySelectorAll(`.${styles.actionButtons}`)
      buttons.forEach(b => (b as HTMLElement).style.display = 'none')

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      // Restore buttons
      buttons.forEach(b => (b as HTMLElement).style.display = 'flex')

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2] // match scale
      })

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`Veridict_Receipt_${submission?.submissionId || 'exam'}.pdf`)
    } catch (err) {
      console.error("Failed to generate PDF", err)
    } finally {
      setDownloading(false)
    }
  }

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

  const isPending = liveStatus === 'pending'

  return (
    <div className={styles.container}>
      <div className={styles.bgGrid} aria-hidden />

      {isPending && (
        <div className={styles.loaderOverlay}>
          <div className={styles.spinner}></div>
          <h2 className={styles.loaderTitle}>Verifying on Blockchain</h2>
          <p className={styles.loaderText}>
            Please wait while your submission is cryptographically anchored to the Polygon network.
            This usually takes 5-15 seconds. Do not close this window.
          </p>
        </div>
      )}

      <div className={`${styles.card} ${isPending ? styles.blurred : ''}`} ref={receiptRef}>
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
            <span className={styles.detailLabel}>CRYPTOGRAPHIC PAYLOAD HASH</span>
            <span className={`${styles.detailValue} ${styles.hashValue}`}>
              {submission?.payloadHash ?? '—'}
            </span>
            {txHash && (
              <>
                <div style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  <span className={styles.detailLabel}>BLOCKCHAIN TX HASH</span>
                </div>
                <span className={`${styles.detailValue} ${styles.hashValue}`} style={{ wordBreak: 'break-all' }}>
                  {txHash}
                </span>
              </>
            )}
          </div>
          <div className={`${styles.detailItem} ${styles.detailFull}`}>
            <span className={styles.detailLabel}>Blockchain Status</span>
            <span className={`${styles.detailValue} ${styles.blockchainStatus}`}>
              {liveStatus === 'confirmed' ? (
                <>
                  <span className={styles.confirmedIcon} title="Verified on Blockchain"></span>
                  Blockchain Confirmed
                </>
              ) : liveStatus === 'failed' ? (
                <>
                  <span className={styles.failedIcon}></span>
                  Verification Failed
                </>
              ) : (
                <>
                  <span className={styles.pendingDot} />
                  Pending confirmation
                </>
              )}
            </span>
          </div>
        </div>

        <div className={styles.notice}>
          Keep your Submission ID and Transaction Hash as proof of submission. Your teacher can verify this using the Veridict Teacher Portal.
        </div>

        <div className={styles.actionButtons}>
          <button onClick={handleDownloadPDF} className={`${styles.exitBtn} ${styles.downloadBtn}`} disabled={downloading}>
            {downloading ? 'Preparing PDF...' : 'Download Receipt'}
          </button>
          <button onClick={handleExit} className={styles.exitBtn}>
            Close Exam Session
          </button>
        </div>
      </div>
    </div>
  )
}

