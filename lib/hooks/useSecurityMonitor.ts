'use client'

import { useEffect, useState, useCallback } from 'react'
import { violationController, ViolationState, Violation } from '../security/ViolationController'
import { securityMonitor } from '../security/monitor-service'

interface UseSecurityMonitorReturn {
  violationState: ViolationState
  currentViolation: Violation | null
  isTerminated: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  dismissWarning: () => void
  requestFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<void>
}

/**
 * React hook for security monitoring
 * 
 * Manages security monitoring lifecycle and violation state
 */
export function useSecurityMonitor(): UseSecurityMonitorReturn {
  const [violationState, setViolationState] = useState<ViolationState>(
    violationController.getState()
  )
  const [currentViolation, setCurrentViolation] = useState<Violation | null>(null)
  const [isTerminated, setIsTerminated] = useState(false)

  // Start monitoring
  const startMonitoring = useCallback(() => {
    console.log('🔒 Starting security monitoring from hook...')
    securityMonitor.startMonitoring()
  }, [])

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    console.log('🔓 Stopping security monitoring from hook...')
    securityMonitor.stopMonitoring()
  }, [])

  // Dismiss current warning
  const dismissWarning = useCallback(() => {
    setCurrentViolation(null)
  }, [])

  // Request fullscreen
  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    return await securityMonitor.requestFullscreen()
  }, [])

  // Exit fullscreen
  const exitFullscreen = useCallback(async (): Promise<void> => {
    await securityMonitor.exitFullscreen()
  }, [])

  // Subscribe to violations
  useEffect(() => {
    const unsubscribe = violationController.subscribe((state, violation) => {
      console.log('📢 Violation received in hook:', violation)
      
      setViolationState(state)
      setCurrentViolation(violation)
      setIsTerminated(state.isTerminated)

      // If terminated, stop monitoring
      if (state.isTerminated) {
        securityMonitor.stopMonitoring()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (securityMonitor.isActive()) {
        securityMonitor.stopMonitoring()
      }
    }
  }, [])

  return {
    violationState,
    currentViolation,
    isTerminated,
    startMonitoring,
    stopMonitoring,
    dismissWarning,
    requestFullscreen,
    exitFullscreen
  }
}
