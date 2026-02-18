'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '../lib/store/uiStore'
import { LoginScreen } from '../components/screens/LoginScreen'
import { ExamCodeScreen } from '../components/screens/ExamCodeScreen'
import { WaitingRoomScreen } from '../components/screens/WaitingRoomScreen'
import { ExamScreen } from '../components/screens/ExamScreen'
import { ChecklistScreen } from '../components/screens/ChecklistScreen'
import { ConfirmationScreen } from '../components/screens/ConfirmationScreen'
import { ErrorScreen } from '../components/screens/ErrorScreen'
import { proctoringService } from '../lib/services/proctoring'

export default function Home() {
  const { screen } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Setup global proctoring listeners (e.g. context menu block)
    const cleanup = proctoringService.setupListeners((event) => {
      // Log proctoring events (could be sent to backend in production)
      console.log('Proctoring event:', event)
    })
    return cleanup
  }, [])

  if (!mounted) return null

  return (
    <main>
      {screen === 'LOGIN' && <LoginScreen />}
      {screen === 'EXAM_CODE' && <ExamCodeScreen />}
      {screen === 'WAITING_ROOM' && <WaitingRoomScreen />}
      {screen === 'CHECKLIST' && <ChecklistScreen />}
      {screen === 'EXAM' && <ExamScreen />}
      {screen === 'CONFIRMATION' && <ConfirmationScreen />}
      {screen === 'ERROR' && <ErrorScreen />}
    </main>
  )
}
