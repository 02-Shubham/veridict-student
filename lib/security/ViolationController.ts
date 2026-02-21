/**
 * ViolationController - Centralized violation tracking and enforcement
 * 
 * Tracks all security violations during exam session and enforces
 * the 3-strike rule with escalating warnings.
 */

export type ViolationType =
  | 'FOCUS_LOSS'
  | 'COPY_PASTE'
  | 'DEVTOOLS'
  | 'FULLSCREEN_EXIT'
  | 'CONTEXT_MENU'
  | 'SUSPICIOUS_KEYSTROKE'
  | 'CELL_PHONE'
  | 'NO_PERSON'

export type ViolationSeverity = 'warning' | 'critical' | 'immediate'

export interface Violation {
  type: ViolationType
  timestamp: string
  severity: ViolationSeverity
  description: string
  metadata?: Record<string, any>
}

export interface ViolationState {
  focusLossCount: number
  copyPasteCount: number
  devToolsDetected: boolean
  fullscreenExitCount: number
  cellPhoneCount: number
  noPersonCount: number
  totalViolations: number
  violations: Violation[]
  isTerminated: boolean
  terminationReason?: string
}

export type ViolationCallback = (state: ViolationState, violation: Violation) => void

class ViolationController {
  private state: ViolationState = {
    focusLossCount: 0,
    copyPasteCount: 0,
    devToolsDetected: false,
    fullscreenExitCount: 0,
    cellPhoneCount: 0,
    noPersonCount: 0,
    totalViolations: 0,
    violations: [],
    isTerminated: false
  }

  private listeners: Set<ViolationCallback> = new Set()
  private readonly MAX_VIOLATIONS = 3
  private readonly IMMEDIATE_TERMINATION_TYPES: ViolationType[] = ['DEVTOOLS']

  /**
   * Register a violation
   */
  registerViolation(
    type: ViolationType,
    description: string,
    metadata?: Record<string, any>
  ): void {
    if (this.state.isTerminated) {
      return // Already terminated, ignore further violations
    }

    const severity = this.getSeverity(type)

    const violation: Violation = {
      type,
      timestamp: new Date().toISOString(),
      severity,
      description,
      metadata
    }

    // Update state
    this.state.violations.push(violation)
    this.state.totalViolations++

    // Update specific counters
    switch (type) {
      case 'FOCUS_LOSS':
        this.state.focusLossCount++
        break
      case 'COPY_PASTE':
        this.state.copyPasteCount++
        break
      case 'DEVTOOLS':
        this.state.devToolsDetected = true
        break
      case 'FULLSCREEN_EXIT':
        this.state.fullscreenExitCount++
        break
      case 'CELL_PHONE':
        this.state.cellPhoneCount++
        break
      case 'NO_PERSON':
        this.state.noPersonCount++
        break
    }

    console.warn('🚨 Security Violation:', {
      type,
      count: this.getViolationCount(type),
      total: this.state.totalViolations,
      description
    })

    // Check for immediate termination
    if (this.shouldTerminateImmediately(type)) {
      this.terminate(`Immediate termination: ${type}`)
    }
    // Check for 3-strike termination
    else if (this.shouldTerminateByCount(type)) {
      this.terminate(`Maximum violations reached: ${type}`)
    }

    // Notify listeners
    this.notifyListeners(violation)
  }

  /**
   * Get severity level for violation type
   */
  private getSeverity(type: ViolationType): ViolationSeverity {
    if (this.IMMEDIATE_TERMINATION_TYPES.includes(type)) {
      return 'immediate'
    }

    const count = this.getViolationCount(type)
    if (count >= this.MAX_VIOLATIONS) {
      return 'critical'
    }

    return 'warning'
  }

  /**
   * Get count for specific violation type
   */
  private getViolationCount(type: ViolationType): number {
    switch (type) {
      case 'FOCUS_LOSS':
        return this.state.focusLossCount
      case 'COPY_PASTE':
        return this.state.copyPasteCount
      case 'FULLSCREEN_EXIT':
        return this.state.fullscreenExitCount
      case 'CELL_PHONE':
        return this.state.cellPhoneCount
      case 'NO_PERSON':
        return this.state.noPersonCount
      default:
        return 0
    }
  }

  /**
   * Check if violation should trigger immediate termination
   */
  private shouldTerminateImmediately(type: ViolationType): boolean {
    return this.IMMEDIATE_TERMINATION_TYPES.includes(type)
  }

  /**
   * Check if violation count exceeds threshold
   */
  private shouldTerminateByCount(type: ViolationType): boolean {
    return this.state.totalViolations >= this.MAX_VIOLATIONS
  }

  /**
   * Terminate the exam session
   */
  private terminate(reason: string): void {
    if (this.state.isTerminated) return

    this.state.isTerminated = true
    this.state.terminationReason = reason

    console.error('🛑 EXAM TERMINATED:', reason)
    console.error('Final violation state:', this.state)
  }

  /**
   * Subscribe to violation events
   */
  subscribe(callback: ViolationCallback): () => void {
    this.listeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(violation: Violation): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState(), violation)
      } catch (error) {
        console.error('Error in violation listener:', error)
      }
    })
  }

  /**
   * Get current violation state (immutable copy)
   */
  getState(): ViolationState {
    return JSON.parse(JSON.stringify(this.state))
  }

  /**
   * Get warning level (1, 2, or 3)
   */
  getWarningLevel(type: ViolationType): number {
    return Math.min(this.state.totalViolations, this.MAX_VIOLATIONS)
  }

  /**
   * Check if exam is terminated
   */
  isTerminated(): boolean {
    return this.state.isTerminated
  }

  /**
   * Get all violations for logging/submission
   */
  getViolations(): Violation[] {
    return [...this.state.violations]
  }

  /**
   * Reset controller (for testing or new exam session)
   */
  reset(): void {
    this.state = {
      focusLossCount: 0,
      copyPasteCount: 0,
      devToolsDetected: false,
      fullscreenExitCount: 0,
      cellPhoneCount: 0,
      noPersonCount: 0,
      totalViolations: 0,
      violations: [],
      isTerminated: false
    }
    console.log('✅ ViolationController reset')
  }

  /**
   * Export violations for backend submission
   */
  exportForSubmission(): {
    violations: Violation[]
    summary: {
      totalViolations: number
      focusLossCount: number
      copyPasteCount: number
      fullscreenExitCount: number
      cellPhoneCount: number
      noPersonCount: number
      devToolsDetected: boolean
      isTerminated: boolean
      terminationReason?: string
    }
  } {
    return {
      violations: this.getViolations(),
      summary: {
        totalViolations: this.state.totalViolations,
        focusLossCount: this.state.focusLossCount,
        copyPasteCount: this.state.copyPasteCount,
        fullscreenExitCount: this.state.fullscreenExitCount,
        cellPhoneCount: this.state.cellPhoneCount,
        noPersonCount: this.state.noPersonCount,
        devToolsDetected: this.state.devToolsDetected,
        isTerminated: this.state.isTerminated,
        terminationReason: this.state.terminationReason
      }
    }
  }
}

// Singleton instance
export const violationController = new ViolationController()
