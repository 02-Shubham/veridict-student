/**
 * SecurityMonitor - Browser-based security monitoring
 * 
 * Monitors for cheating attempts in web environment:
 * - Tab/window switching (visibility API)
 * - Copy/paste attempts
 * - DevTools detection (heuristic)
 * - Fullscreen exit
 * - Context menu
 */

import { violationController, ViolationType } from './ViolationController'

class SecurityMonitor {
  private isMonitoring = false
  private cleanupFunctions: (() => void)[] = []
  private devToolsCheckInterval?: NodeJS.Timeout
  private lastVisibilityState = true

  /**
   * Start monitoring for security violations
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring already active')
      return
    }

    console.log('🔒 Starting security monitoring...')
    this.isMonitoring = true

    // Monitor tab/window switching
    this.monitorVisibility()

    // Monitor copy/paste
    this.monitorCopyPaste()

    // Monitor context menu
    this.monitorContextMenu()

    // Monitor fullscreen
    this.monitorFullscreen()

    // Monitor DevTools (heuristic)
    this.monitorDevTools()

    // Monitor keyboard shortcuts
    this.monitorKeyboardShortcuts()

    console.log('✅ Security monitoring active')
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    console.log('🔓 Stopping security monitoring...')
    
    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []

    // Clear intervals
    if (this.devToolsCheckInterval) {
      clearInterval(this.devToolsCheckInterval)
      this.devToolsCheckInterval = undefined
    }

    this.isMonitoring = false
    console.log('✅ Security monitoring stopped')
  }

  /**
   * Monitor tab/window visibility changes
   */
  private monitorVisibility(): void {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden

      // Only register violation when tab becomes hidden
      if (!isVisible && this.lastVisibilityState) {
        violationController.registerViolation(
          'FOCUS_LOSS',
          'Student switched to another tab or window',
          { 
            timestamp: new Date().toISOString(),
            visibilityState: document.visibilityState
          }
        )
      }

      this.lastVisibilityState = isVisible
    }

    const handleBlur = () => {
      // Window lost focus
      if (this.lastVisibilityState) {
        violationController.registerViolation(
          'FOCUS_LOSS',
          'Exam window lost focus',
          { 
            timestamp: new Date().toISOString(),
            event: 'blur'
          }
        )
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    })
  }

  /**
   * Monitor and block copy/paste attempts
   */
  private monitorCopyPaste(): void {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      violationController.registerViolation(
        'COPY_PASTE',
        'Attempted to copy content',
        { action: 'copy' }
      )
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      violationController.registerViolation(
        'COPY_PASTE',
        'Attempted to paste content',
        { action: 'paste' }
      )
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      violationController.registerViolation(
        'COPY_PASTE',
        'Attempted to cut content',
        { action: 'cut' }
      )
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', handleCut)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('cut', handleCut)
    })
  }

  /**
   * Block context menu (right-click)
   */
  private monitorContextMenu(): void {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      violationController.registerViolation(
        'CONTEXT_MENU',
        'Attempted to open context menu',
        { x: e.clientX, y: e.clientY }
      )
    }

    document.addEventListener('contextmenu', handleContextMenu)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('contextmenu', handleContextMenu)
    })
  }

  /**
   * Monitor fullscreen state
   */
  private monitorFullscreen(): void {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        violationController.registerViolation(
          'FULLSCREEN_EXIT',
          'Student exited fullscreen mode',
          { timestamp: new Date().toISOString() }
        )
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    })
  }

  /**
   * Monitor for DevTools (heuristic detection)
   * 
   * Note: This is not foolproof but provides basic detection
   */
  private monitorDevTools(): void {
    let devToolsOpen = false

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160
      const orientation = widthThreshold ? 'vertical' : 'horizontal'

      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true
        violationController.registerViolation(
          'DEVTOOLS',
          'Developer tools detected (immediate termination)',
          { orientation, timestamp: new Date().toISOString() }
        )
      } else if (!widthThreshold && !heightThreshold && devToolsOpen) {
        devToolsOpen = false
      }
    }

    // Check every 1 second
    this.devToolsCheckInterval = setInterval(checkDevTools, 1000)

    // Also check on resize
    window.addEventListener('resize', checkDevTools)

    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', checkDevTools)
    })
  }

  /**
   * Monitor suspicious keyboard shortcuts
   */
  private monitorKeyboardShortcuts(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // Block Ctrl+C, Ctrl+V, Ctrl+X
      if (ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        violationController.registerViolation(
          'COPY_PASTE',
          `Attempted keyboard shortcut: ${isMac ? 'Cmd' : 'Ctrl'}+${e.key.toUpperCase()}`,
          { key: e.key, ctrlKey, metaKey: e.metaKey }
        )
      }

      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        violationController.registerViolation(
          'DEVTOOLS',
          'Attempted to open DevTools with F12',
          { key: 'F12' }
        )
      }

      // Block Ctrl+Shift+I (DevTools)
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        violationController.registerViolation(
          'DEVTOOLS',
          'Attempted to open DevTools with keyboard shortcut',
          { shortcut: 'Ctrl+Shift+I' }
        )
      }

      // Block Ctrl+Shift+J (Console)
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        violationController.registerViolation(
          'DEVTOOLS',
          'Attempted to open Console with keyboard shortcut',
          { shortcut: 'Ctrl+Shift+J' }
        )
      }

      // Block Ctrl+U (View Source)
      if (ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        violationController.registerViolation(
          'SUSPICIOUS_KEYSTROKE',
          'Attempted to view page source',
          { shortcut: 'Ctrl+U' }
        )
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    this.cleanupFunctions.push(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })
  }

  /**
   * Request fullscreen mode
   */
  async requestFullscreen(): Promise<boolean> {
    try {
      await document.documentElement.requestFullscreen()
      console.log('✅ Entered fullscreen mode')
      return true
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      return false
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        console.log('✅ Exited fullscreen mode')
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }

  /**
   * Check if currently monitoring
   */
  isActive(): boolean {
    return this.isMonitoring
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor()
