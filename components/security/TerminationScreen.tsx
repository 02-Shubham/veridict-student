'use client'

import React from 'react'
import { ViolationState } from '../../lib/security/ViolationController'
import styles from './TerminationScreen.module.css'

interface TerminationScreenProps {
  violationState: ViolationState
  submissionId?: string
  examTitle?: string
}

export const TerminationScreen: React.FC<TerminationScreenProps> = ({
  violationState,
  submissionId,
  examTitle
}) => {
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Lock Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.lockIcon}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className={styles.title}>Exam Terminated</h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          Your exam session has been automatically terminated due to security policy violations.
        </p>

        {/* Info Cards */}
        <div className={styles.infoGrid}>
          {/* Exam Info */}
          {examTitle && (
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Exam</div>
              <div className={styles.infoValue}>{examTitle}</div>
            </div>
          )}

          {/* Violation Count */}
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Total Violations</div>
            <div className={styles.infoValue}>{violationState.totalViolations}</div>
          </div>

          {/* Submission Status */}
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>Submission Status</div>
            <div className={styles.infoValue}>
              {submissionId ? 'Submitted' : 'Auto-Terminated'}
            </div>
          </div>

          {/* Reference ID */}
          {submissionId && (
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Reference ID</div>
              <div className={styles.infoValue}>{submissionId}</div>
            </div>
          )}
        </div>

        {/* Violation Breakdown */}
        <div className={styles.violationBreakdown}>
          <h3 className={styles.breakdownTitle}>Violation Summary</h3>
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Tab Switches</span>
              <span className={styles.breakdownValue}>{violationState.focusLossCount}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Copy/Paste Attempts</span>
              <span className={styles.breakdownValue}>{violationState.copyPasteCount}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Fullscreen Exits</span>
              <span className={styles.breakdownValue}>{violationState.fullscreenExitCount}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>DevTools Detected</span>
              <span className={styles.breakdownValue}>
                {violationState.devToolsDetected ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Violation Log */}
        {violationState.violations.length > 0 && (
          <div className={styles.violationLog}>
            <h3 className={styles.logTitle}>Violation Log</h3>
            <div className={styles.logContainer}>
              {violationState.violations.map((violation, index) => (
                <div key={index} className={styles.logEntry}>
                  <div className={styles.logHeader}>
                    <span className={styles.logType}>{violation.type}</span>
                    <span className={styles.logTime}>
                      {formatTimestamp(violation.timestamp)}
                    </span>
                  </div>
                  <div className={styles.logDescription}>{violation.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Termination Reason */}
        {violationState.terminationReason && (
          <div className={styles.reasonBox}>
            <p className={styles.reasonLabel}>Termination Reason:</p>
            <p className={styles.reasonText}>{violationState.terminationReason}</p>
          </div>
        )}

        {/* Instructions */}
        <div className={styles.instructions}>
          <h3 className={styles.instructionsTitle}>What happens next?</h3>
          <ul className={styles.instructionsList}>
            <li>Your answers have been automatically submitted</li>
            <li>All violations have been logged and reported</li>
            <li>Your instructor will be notified of the termination</li>
            <li>Please contact your instructor for further instructions</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className={styles.contactBox}>
          <p className={styles.contactText}>
            If you believe this termination was in error, please contact your exam administrator immediately with your reference ID.
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => window.location.href = '/'}
          className={styles.closeButton}
        >
          Return to Home
        </button>
      </div>
    </div>
  )
}
