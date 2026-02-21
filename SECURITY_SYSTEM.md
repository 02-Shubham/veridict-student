# Web-Based Security Monitoring System

## Overview

This document describes the comprehensive security monitoring system implemented for the student exam application. The system detects and prevents cheating attempts through browser-based monitoring and enforces a 3-strike violation policy.

---

## Architecture

### Core Components

```
lib/security/
├── ViolationController.ts    # Centralized violation tracking
└── monitor-service.ts         # Browser-based security monitoring

components/security/
├── WarningOverlay.tsx         # Violation warning UI
├── WarningOverlay.module.css
├── TerminationScreen.tsx      # Exam termination UI
└── TerminationScreen.module.css

lib/hooks/
└── useSecurityMonitor.ts      # React hook for security integration
```

---

## Security Features

### 1. Tab/Window Switching Detection

**Implementation:**
- Uses `document.visibilitychange` event
- Uses `window.blur` event
- Tracks when student switches away from exam

**Behavior:**
- First violation: Yellow warning
- Second violation: Orange warning
- Third violation: Red warning + Auto-termination

**Code:**
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    violationController.registerViolation(
      'FOCUS_LOSS',
      'Student switched to another tab or window'
    )
  }
})
```

---

### 2. Copy/Paste Blocking

**Implementation:**
- Intercepts `copy`, `paste`, `cut` events
- Blocks keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X)
- Prevents clipboard access

**Behavior:**
- Each attempt counts as a violation
- 3 violations = Auto-termination

**Code:**
```typescript
document.addEventListener('copy', (e) => {
  e.preventDefault()
  violationController.registerViolation(
    'COPY_PASTE',
    'Attempted to copy content'
  )
})
```

---

### 3. DevTools Detection

**Implementation:**
- Heuristic detection based on window size differences
- Checks `window.outerWidth - window.innerWidth`
- Blocks F12 and Ctrl+Shift+I shortcuts

**Behavior:**
- Immediate termination (no warnings)
- Cannot be bypassed

**Code:**
```typescript
const widthDiff = window.outerWidth - window.innerWidth
const heightDiff = window.outerHeight - window.innerHeight

if (widthDiff > 160 || heightDiff > 160) {
  violationController.registerViolation(
    'DEVTOOLS',
    'Developer tools detected (immediate termination)'
  )
}
```

---

### 4. Fullscreen Enforcement

**Implementation:**
- Requests fullscreen on exam start
- Monitors `fullscreenchange` event
- Tracks exits from fullscreen

**Behavior:**
- Each exit counts as a violation
- 3 violations = Auto-termination

**Code:**
```typescript
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    violationController.registerViolation(
      'FULLSCREEN_EXIT',
      'Student exited fullscreen mode'
    )
  }
})
```

---

### 5. Context Menu Blocking

**Implementation:**
- Blocks right-click context menu
- Logs each attempt

**Behavior:**
- Logged but doesn't count toward termination
- Prevents access to browser features

---

### 6. Keyboard Shortcut Blocking

**Blocked Shortcuts:**
- F12 (DevTools)
- Ctrl+Shift+I (DevTools)
- Ctrl+Shift+J (Console)
- Ctrl+U (View Source)
- Ctrl+C, Ctrl+V, Ctrl+X (Copy/Paste)

---

## Violation Controller

### ViolationController Class

Centralized violation tracking and enforcement engine.

**State Tracking:**
```typescript
interface ViolationState {
  focusLossCount: number
  copyPasteCount: number
  devToolsDetected: boolean
  fullscreenExitCount: number
  totalViolations: number
  violations: Violation[]
  isTerminated: boolean
  terminationReason?: string
}
```

**Key Methods:**
- `registerViolation()` - Record a violation
- `getState()` - Get current state
- `subscribe()` - Listen for violations
- `isTerminated()` - Check termination status
- `exportForSubmission()` - Export for backend

**3-Strike Rule:**
```typescript
private readonly MAX_VIOLATIONS = 3

private shouldTerminateByCount(type: ViolationType): boolean {
  const count = this.getViolationCount(type)
  return count >= this.MAX_VIOLATIONS
}
```

**Immediate Termination:**
```typescript
private readonly IMMEDIATE_TERMINATION_TYPES = ['DEVTOOLS']

private shouldTerminateImmediately(type: ViolationType): boolean {
  return this.IMMEDIATE_TERMINATION_TYPES.includes(type)
}
```

---

## Security Monitor

### SecurityMonitor Class

Browser-based monitoring service.

**Lifecycle:**
```typescript
// Start monitoring
securityMonitor.startMonitoring()

// Stop monitoring
securityMonitor.stopMonitoring()

// Check status
securityMonitor.isActive()
```

**Monitoring Features:**
- Visibility changes
- Copy/paste attempts
- Context menu
- Fullscreen state
- DevTools (heuristic)
- Keyboard shortcuts

---

## React Integration

### useSecurityMonitor Hook

React hook for easy integration.

**Usage:**
```typescript
const {
  violationState,
  currentViolation,
  isTerminated,
  startMonitoring,
  stopMonitoring,
  dismissWarning,
  requestFullscreen,
  exitFullscreen
} = useSecurityMonitor()
```

**Example:**
```typescript
useEffect(() => {
  // Start monitoring when exam begins
  startMonitoring()
  requestFullscreen()

  return () => {
    // Cleanup on unmount
    stopMonitoring()
  }
}, [])
```

---

## UI Components

### WarningOverlay

Professional warning modal displayed on violations.

**Features:**
- Fullscreen modal overlay
- Animated shake effect
- Color-coded by severity:
  - Yellow: First warning
  - Orange: Second warning
  - Red: Final warning
- Violation counter
- Clear description
- Rules reminder

**Props:**
```typescript
interface WarningOverlayProps {
  violationType: ViolationType
  violationCount: number
  maxViolations: number
  description: string
  onContinue: () => void
  isTerminated?: boolean
}
```

---

### TerminationScreen

Displayed when exam is terminated.

**Features:**
- Red-themed secure design
- Lock icon with pulse animation
- Violation summary
- Detailed violation log
- Submission status
- Reference ID
- Instructions for next steps

**Props:**
```typescript
interface TerminationScreenProps {
  violationState: ViolationState
  submissionId?: string
  examTitle?: string
}
```

---

## Exam Flow

### Complete Flow

```
1. Student enters exam
   ↓
2. Request fullscreen
   ↓
3. Start security monitoring
   ↓
4. Student takes exam
   ↓
5. [If violation detected]
   ├─ Show warning overlay
   ├─ Increment counter
   └─ Log violation
   ↓
6. [If 3 violations OR DevTools]
   ├─ Auto-submit exam
   ├─ Stop monitoring
   ├─ Exit fullscreen
   └─ Show termination screen
   ↓
7. [If completed normally]
   ├─ Manual submit
   ├─ Include violation data
   ├─ Stop monitoring
   └─ Show confirmation
```

---

## Integration Example

### ExamScreen.tsx

```typescript
export const ExamScreen: React.FC = () => {
  const {
    violationState,
    currentViolation,
    isTerminated,
    startMonitoring,
    stopMonitoring,
    dismissWarning,
    requestFullscreen
  } = useSecurityMonitor()

  useEffect(() => {
    // Start monitoring
    startMonitoring()
    requestFullscreen()

    return () => {
      stopMonitoring()
    }
  }, [])

  // Show termination screen
  if (isTerminated) {
    return <TerminationScreen violationState={violationState} />
  }

  return (
    <div>
      {/* Warning overlay */}
      {currentViolation && (
        <WarningOverlay
          violationType={currentViolation.type}
          violationCount={violationState.totalViolations}
          maxViolations={3}
          description={currentViolation.description}
          onContinue={dismissWarning}
        />
      )}

      {/* Exam content */}
      <ExamContent />
    </div>
  )
}
```

---

## Violation Data Export

### For Backend Submission

```typescript
const violationData = violationController.exportForSubmission()

// Submit with exam answers
await examService.submitExam(examId, {
  answers: studentAnswers,
  violations: violationData.violations,
  violationSummary: violationData.summary
})
```

**Exported Data:**
```typescript
{
  violations: [
    {
      type: 'FOCUS_LOSS',
      timestamp: '2024-02-19T10:30:00Z',
      severity: 'warning',
      description: 'Student switched to another tab',
      metadata: { ... }
    }
  ],
  summary: {
    totalViolations: 3,
    focusLossCount: 2,
    copyPasteCount: 1,
    fullscreenExitCount: 0,
    devToolsDetected: false,
    isTerminated: true,
    terminationReason: 'Maximum violations reached: FOCUS_LOSS'
  }
}
```

---

## Limitations (Web-Based)

### What's NOT Possible in Browser:

1. ❌ **True Kiosk Mode**
   - Cannot prevent Alt+Tab at OS level
   - Cannot lock user to application

2. ❌ **Process Scanning**
   - Cannot detect screen recording software
   - Cannot scan running processes

3. ❌ **Force-Close Applications**
   - Cannot close other applications
   - Cannot prevent external tools

4. ❌ **Hardware Control**
   - Cannot disable USB devices
   - Cannot control camera/microphone at OS level

### What IS Possible:

1. ✅ **Tab Switching Detection**
   - Reliable visibility API
   - Window blur detection

2. ✅ **Copy/Paste Blocking**
   - Event interception
   - Keyboard shortcut blocking

3. ✅ **DevTools Detection**
   - Heuristic detection (not foolproof)
   - Keyboard shortcut blocking

4. ✅ **Fullscreen Enforcement**
   - Request fullscreen
   - Detect exits

5. ✅ **Violation Tracking**
   - Comprehensive logging
   - Auto-termination

---

## Security Best Practices

### For Students:

1. Use a dedicated browser profile
2. Close all other tabs before starting
3. Disable browser extensions
4. Use fullscreen mode
5. Don't switch windows during exam

### For Administrators:

1. Review violation logs after each exam
2. Set clear policies about violations
3. Communicate rules before exam
4. Have backup proctoring methods
5. Consider manual review for edge cases

---

## Testing

### Test Scenarios:

1. **Tab Switching:**
   - Switch to another tab
   - Verify warning appears
   - Check violation counter

2. **Copy/Paste:**
   - Try Ctrl+C
   - Try right-click copy
   - Verify blocked and logged

3. **DevTools:**
   - Press F12
   - Try Ctrl+Shift+I
   - Verify immediate termination

4. **Fullscreen:**
   - Exit fullscreen (Esc)
   - Verify warning appears
   - Check violation counter

5. **3-Strike Rule:**
   - Trigger 3 violations
   - Verify auto-termination
   - Check termination screen

---

## Console Logs

### Monitoring Logs:

```
🔒 Starting security monitoring...
✅ Security monitoring active
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 1, total: 1 }
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 2, total: 2 }
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 3, total: 3 }
🛑 EXAM TERMINATED: Maximum violations reached: FOCUS_LOSS
🔓 Stopping security monitoring...
✅ Security monitoring stopped
```

---

## Future Enhancements

### Possible Additions:

1. **Webcam Monitoring** (with permission)
   - Face detection
   - Multiple person detection
   - Looking away detection

2. **Audio Monitoring** (with permission)
   - Voice detection
   - Background noise analysis

3. **Mouse Tracking**
   - Unusual patterns
   - Rapid movements

4. **Network Monitoring**
   - Detect VPN usage
   - Monitor network requests

5. **AI-Based Detection**
   - Behavioral analysis
   - Anomaly detection

---

## Summary

This web-based security system provides comprehensive monitoring and enforcement for online exams. While it has limitations compared to native desktop applications, it offers robust protection against common cheating attempts and maintains detailed logs for review.

The system is production-ready, well-documented, and easy to integrate into existing React applications.
