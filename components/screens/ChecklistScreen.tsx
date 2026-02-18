import React, { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '../../lib/store/uiStore'
import { useExamStore } from '../../lib/store/examStore'
import styles from './ChecklistScreen.module.css'

interface SecurityCheck {
  id: 'camera' | 'fullscreen' | 'connection' | 'devtools' | 'version'
  label: string
  status: 'pending' | 'success' | 'error'
  message?: string
}

export const ChecklistScreen: React.FC = () => {
  const { setScreen } = useUIStore()
  const { session } = useExamStore()
  const [checks, setChecks] = useState<SecurityCheck[]>([
    { id: 'camera', label: 'Camera Access', status: 'pending' },
    { id: 'fullscreen', label: 'Fullscreen Mode', status: 'pending' },
    { id: 'connection', label: 'Internet Connection', status: 'pending' },
    { id: 'devtools', label: 'Developer Tools', status: 'pending' },
    { id: 'version', label: 'App Version Verified', status: 'pending' }
  ])

  // --- Helper to update a specific check ---
  const updateCheck = useCallback((id: string, status: 'success' | 'error', message?: string) => {
    setChecks(prev => prev.map(check =>
      check.id === id ? { ...check, status, message } : check
    ))
  }, [])

  // --- Check 1: App Version (Static for now) ---
  useEffect(() => {
    // In a real app, strict version checking against backend config would happen here
    setTimeout(() => {
      updateCheck('version', 'success')
    }, 500)
  }, [updateCheck])

  // --- Check 2: Internet Connection ---
  useEffect(() => {
    const checkConnection = () => {
      if (navigator.onLine) {
        updateCheck('connection', 'success')
      } else {
        updateCheck('connection', 'error', 'No internet connection')
      }
    }
    checkConnection()
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
    }
  }, [updateCheck])

  // --- Check 3: Camera Access ---
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      // Stop tracks immediately after check to release camera
      stream.getTracks().forEach(track => track.stop())
      updateCheck('camera', 'success')
    } catch (err) {
      updateCheck('camera', 'error', 'Permission denied or no camera found')
    }
  }

  // --- Check 4: Fullscreen Mode ---
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
      updateCheck('fullscreen', 'success')
    } catch (err) {
      updateCheck('fullscreen', 'error', 'Failed to enter fullscreen')
    }
  }

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        updateCheck('fullscreen', 'success')
      } else {
        updateCheck('fullscreen', 'error', 'Fullscreen required')
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Initial check (might fail if not triggered by user action yet)
    if(document.fullscreenElement) updateCheck('fullscreen', 'success')

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [updateCheck])


  // --- Check 5: Developer Tools (Heuristic) ---
  useEffect(() => {
    const checkDevTools = () => {
      // Heuristic: Check if window inner size is significantly smaller than outer size
      // This is a loose check and can be flaky, but serves as a basic deterrent in web
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight
      
      // Threshold for what might be considered "docked devtools"
      if (widthDiff > 160 || heightDiff > 160) {
        updateCheck('devtools', 'error', 'Close Developer Tools')
      } else {
        updateCheck('devtools', 'success')
      }
    }
    
    checkDevTools() // Check on mount
    window.addEventListener('resize', checkDevTools)
    return () => window.removeEventListener('resize', checkDevTools)
  }, [updateCheck])


  // --- Final Validation ---
  const allChecksPassed = checks.every(c => c.status === 'success')

  const handleProceed = async () => {
    if (allChecksPassed) {
       if(!session) {
           setScreen('EXAM_CODE')
           return
       }

       const now = new Date()
       const startTime = new Date(session.startTime)
       
       if (now < startTime) {
           setScreen('WAITING_ROOM')
       } else {
           // Load questions if not already loaded
           if (!session.questions || session.questions.length === 0) {
             try {
               const { examService } = await import('../../lib/services/exam')
               const paper = await examService.getExamPaper(session.examId)
               useExamStore.getState().setSession({
                 ...session,
                 questions: paper.questions
               })
             } catch (error) {
               console.error('Failed to load questions:', error)
               setScreen('ERROR')
               return
             }
           }
           setScreen('EXAM')
       }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
            <div className={styles.title}>System Check</div>
            <div className={styles.subtitle}>
              Ensure your environment is secure before starting the exam.
            </div>
        </div>

        <div className={styles.checklist}>
          {checks.map(check => (
            <div 
              key={check.id} 
              className={`${styles.checkItem} ${check.status === 'success' ? styles.success : check.status === 'error' ? styles.error : ''}`}
            >
              <div className={styles.checkInfo}>
                <div className={`${styles.icon} ${check.status === 'pending' ? styles.pending : check.status === 'success' ? styles.success : styles.error}`}>
                   {check.status === 'success' ? '✓' : check.status === 'error' ? '✕' : '?'}
                </div>
                <div>
                   <div className={styles.checkLabel}>{check.label}</div>
                   {check.message && <div className={check.status === 'error' ? styles.statusError : styles.statusPending}>{check.message}</div>}
                </div>
              </div>
              
              {/* Action buttons for specific checks if they failed or are pending */}
              {check.status !== 'success' && check.id === 'camera' && (
                <button className={styles.actionButton} onClick={requestCamera}>Enable</button>
              )}
              {check.status !== 'success' && check.id === 'fullscreen' && (
                <button className={styles.actionButton} onClick={requestFullscreen}>Enable</button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
            <button 
                className={styles.proceedBtn} 
                disabled={!allChecksPassed}
                onClick={handleProceed}
            >
                {allChecksPassed ? 'Enter Exam Environment' : 'Complete All Checks to Proceed'}
            </button>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                Refresh / Retry
            </button>
        </div>
      </div>
    </div>
  )
}
