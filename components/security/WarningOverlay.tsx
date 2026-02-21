'use client'

import React, { useEffect, useState } from 'react'
import { ViolationType } from '../../lib/security/ViolationController'
import styles from './WarningOverlay.module.css'

interface WarningOverlayProps {
  violationType: ViolationType
  violationCount: number
  maxViolations: number
  description: string
  onContinue: () => void
  isTerminated?: boolean
}

export const WarningOverlay: React.FC<WarningOverlayProps> = ({
  violationType,
  violationCount,
  maxViolations,
  description,
  onContinue,
  isTerminated = false
}) => {
  const [shake, setShake] = useState(false)

  useEffect(() => {
    // Trigger shake animation
    setShake(true)
    const timer = setTimeout(() => setShake(false), 600)
    return () => clearTimeout(timer)
  }, [violationCount])

  const getWarningLevel = (): 'warning' | 'danger' | 'critical' => {
    if (violationCount >= maxViolations) return 'critical'
    if (violationCount === maxViolations - 1) return 'danger'
    return 'warning'
  }

  const getWarningColor = (): string => {
    const level = getWarningLevel()
    if (level === 'critical') return '#dc2626' // Red
    if (level === 'danger') return '#ea580c' // Orange
    return '#eab308' // Yellow
  }

  const getIcon = (): string => {
    if (isTerminated) return '🔒'
    const level = getWarningLevel()
    if (level === 'critical') return '🚨'
    if (level === 'danger') return '⚠️'
    return '⚡'
  }

  const getTitle = (): string => {
    if (isTerminated) return 'Exam Terminated'
    if (violationCount >= maxViolations) return 'Final Warning'
    return 'Security Violation Detected'
  }

  const getMessage = (): string => {
    if (isTerminated) {
      return 'Your exam has been automatically terminated due to multiple security violations.'
    }
    return description
  }

  return (
    <div className={styles.overlay}>
      <div 
        className={`${styles.card} ${shake ? styles.shake : ''}`}
        style={{ borderColor: getWarningColor() }}
      >
        {/* Icon */}
        <div className={styles.iconContainer}>
          <div 
            className={styles.icon}
            style={{ backgroundColor: getWarningColor() }}
          >
            {getIcon()}
          </div>
        </div>

        {/* Title */}
        <h2 className={styles.title} style={{ color: getWarningColor() }}>
          {getTitle()}
        </h2>

        {/* Violation Counter */}
        {!isTerminated && (
          <div className={styles.counter}>
            <span className={styles.counterText}>
              Violation <strong>{violationCount}</strong> of <strong>{maxViolations}</strong>
            </span>
          </div>
        )}

        {/* Description */}
        <p className={styles.description}>
          {getMessage()}
        </p>

        {/* Warning Message */}
        {!isTerminated && violationCount < maxViolations && (
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              {violationCount === maxViolations - 1 ? (
                <>
                  <strong>This is your final warning.</strong> One more violation will result in automatic exam termination.
                </>
              ) : (
                <>
                  You have <strong>{maxViolations - violationCount}</strong> warning{maxViolations - violationCount > 1 ? 's' : ''} remaining before automatic termination.
                </>
              )}
            </p>
          </div>
        )}

        {/* Termination Message */}
        {isTerminated && (
          <div className={styles.terminationBox}>
            <p className={styles.terminationText}>
              Your answers have been automatically submitted. Please contact your instructor for further instructions.
            </p>
          </div>
        )}

        {/* Action Button */}
        {!isTerminated && (
          <button 
            onClick={onContinue}
            className={styles.continueButton}
            style={{ backgroundColor: getWarningColor() }}
          >
            I Understand - Continue Exam
          </button>
        )}

        {/* Rules Reminder */}
        {!isTerminated && (
          <div className={styles.rulesReminder}>
            <p className={styles.rulesTitle}>📋 Exam Rules:</p>
            <ul className={styles.rulesList}>
              <li>Do not switch tabs or windows</li>
              <li>Do not copy or paste content</li>
              <li>Do not open developer tools</li>
              <li>Stay in fullscreen mode</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
