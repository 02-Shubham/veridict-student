import { ProctoringEvent, ProctoringEventType } from '../types'

type EventCallback = (event: ProctoringEvent) => void

export const proctoringService = {
  setupListeners(callback: EventCallback): () => void {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        callback({
          type: 'FOCUS_LOSS',
          timestamp: new Date().toISOString(),
          metadata: 'Tab hidden / Window minimized'
        })
      } else {
        callback({
          type: 'WINDOW_SWITCH', // Or 'FOCUS_GAIN'
          timestamp: new Date().toISOString(),
          metadata: 'Tab visible / Window restored'
        })
      }
    }

    const handleBlur = () => {
      callback({
        type: 'FOCUS_LOSS',
        timestamp: new Date().toISOString(),
        metadata: 'Window blur'
      })
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        callback({
          type: 'FULLSCREEN_EXIT',
          timestamp: new Date().toISOString(),
          metadata: 'User exited fullscreen'
        })
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // Optional: log right-click attempt? usually just block
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  },

  async enterFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err)
    }
  },

  exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error(err))
    }
  }
}
