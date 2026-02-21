# Security System Testing Guide

## 🧪 Complete Testing Checklist

This guide provides step-by-step instructions for testing all security features.

---

## Prerequisites

1. Start your development server:
```bash
npm run dev
```

2. Open browser: `http://localhost:3000`

3. Open browser console (F12) to see logs

4. Navigate to exam screen

---

## Test 1: Tab Switching Detection

### Steps:
1. Start exam
2. Click outside browser window (or press Alt+Tab)
3. Observe warning overlay appears
4. Click "I Understand - Continue Exam"
5. Repeat steps 2-4 two more times
6. On 3rd violation, observe termination screen

### Expected Console Logs:
```
🔒 Starting security monitoring...
✅ Security monitoring active
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 1, total: 1, description: '...' }
📢 Violation received in hook: { type: 'FOCUS_LOSS', ... }
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 2, total: 2, description: '...' }
📢 Violation received in hook: { type: 'FOCUS_LOSS', ... }
🚨 Security Violation: { type: 'FOCUS_LOSS', count: 3, total: 3, description: '...' }
🛑 EXAM TERMINATED: Maximum violations reached: FOCUS_LOSS
📢 Violation received in hook: { type: 'FOCUS_LOSS', ... }
🔓 Stopping security monitoring...
✅ Security monitoring stopped
```

### Expected UI:
- ✅ Yellow warning on 1st violation
- ✅ Orange warning on 2nd violation
- ✅ Red warning on 3rd violation
- ✅ Termination screen after 3rd

### Pass Criteria:
- [ ] Warning appears on each tab switch
- [ ] Violation counter increments (1 of 3, 2 of 3, 3 of 3)
- [ ] Colors change (yellow → orange → red)
- [ ] Termination screen shows after 3 violations
- [ ] Violation log shows all 3 violations

---

## Test 2: Copy/Paste Blocking

### Steps:
1. Start exam
2. Select some text
3. Press Ctrl+C (or Cmd+C on Mac)
4. Observe warning overlay
5. Click "Continue"
6. Try Ctrl+V
7. Observe warning overlay
8. Click "Continue"
9. Try Ctrl+X
10. Observe termination screen

### Expected Console Logs:
```
🚨 Security Violation: { type: 'COPY_PASTE', count: 1, total: 1, description: 'Attempted keyboard shortcut: Ctrl+C' }
🚨 Security Violation: { type: 'COPY_PASTE', count: 2, total: 2, description: 'Attempted keyboard shortcut: Ctrl+V' }
🚨 Security Violation: { type: 'COPY_PASTE', count: 3, total: 3, description: 'Attempted keyboard shortcut: Ctrl+X' }
🛑 EXAM TERMINATED: Maximum violations reached: COPY_PASTE
```

### Alternative Test (Right-Click):
1. Right-click on text
2. Observe context menu is blocked
3. Observe violation logged (but doesn't count toward termination)

### Pass Criteria:
- [ ] Ctrl+C is blocked
- [ ] Ctrl+V is blocked
- [ ] Ctrl+X is blocked
- [ ] Right-click menu is blocked
- [ ] Each attempt shows warning
- [ ] 3 attempts trigger termination

---

## Test 3: DevTools Detection

### Steps:
1. Start exam
2. Press F12
3. Observe immediate termination (no warnings)

### Expected Console Logs:
```
🚨 Security Violation: { type: 'DEVTOOLS', count: 0, total: 1, description: 'Attempted to open DevTools with F12' }
🛑 EXAM TERMINATED: Immediate termination: DEVTOOLS
```

### Alternative Tests:
- Press Ctrl+Shift+I
- Press Ctrl+Shift+J
- Manually resize window to trigger heuristic detection

### Pass Criteria:
- [ ] F12 is blocked
- [ ] Ctrl+Shift+I is blocked
- [ ] Ctrl+Shift+J is blocked
- [ ] Immediate termination (no warnings)
- [ ] Termination screen shows DevTools violation

---

## Test 4: Fullscreen Enforcement

### Steps:
1. Start exam (should auto-enter fullscreen)
2. Press Esc to exit fullscreen
3. Observe warning overlay
4. Click "Continue"
5. Press Esc again
6. Observe warning overlay
7. Click "Continue"
8. Press Esc third time
9. Observe termination screen

### Expected Console Logs:
```
✅ Entered fullscreen mode
🚨 Security Violation: { type: 'FULLSCREEN_EXIT', count: 1, total: 1, description: 'Student exited fullscreen mode' }
🚨 Security Violation: { type: 'FULLSCREEN_EXIT', count: 2, total: 2, description: 'Student exited fullscreen mode' }
🚨 Security Violation: { type: 'FULLSCREEN_EXIT', count: 3, total: 3, description: 'Student exited fullscreen mode' }
🛑 EXAM TERMINATED: Maximum violations reached: FULLSCREEN_EXIT
```

### Pass Criteria:
- [ ] Fullscreen requested on exam start
- [ ] Esc exits fullscreen
- [ ] Warning appears on each exit
- [ ] 3 exits trigger termination

---

## Test 5: Context Menu Blocking

### Steps:
1. Start exam
2. Right-click anywhere
3. Observe context menu is blocked
4. Check console for violation log

### Expected Console Logs:
```
🚨 Security Violation: { type: 'CONTEXT_MENU', count: 0, total: 1, description: 'Attempted to open context menu' }
```

### Pass Criteria:
- [ ] Right-click is blocked
- [ ] No context menu appears
- [ ] Violation is logged
- [ ] Does NOT count toward termination

---

## Test 6: Keyboard Shortcut Blocking

### Shortcuts to Test:
- F12 (DevTools) → Immediate termination
- Ctrl+Shift+I (DevTools) → Immediate termination
- Ctrl+Shift+J (Console) → Immediate termination
- Ctrl+U (View Source) → Logged as suspicious
- Ctrl+C (Copy) → Warning + count
- Ctrl+V (Paste) → Warning + count
- Ctrl+X (Cut) → Warning + count

### Pass Criteria:
- [ ] All shortcuts are blocked
- [ ] DevTools shortcuts trigger immediate termination
- [ ] Copy/paste shortcuts trigger warnings
- [ ] View source is blocked and logged

---

## Test 7: Mixed Violations

### Steps:
1. Start exam
2. Switch tab (1st violation)
3. Try to copy (2nd violation)
4. Exit fullscreen (3rd violation)
5. Observe termination

### Expected Behavior:
- Violations from different types count toward same total
- 3 total violations = termination
- Termination screen shows all violation types

### Pass Criteria:
- [ ] Different violation types are tracked separately
- [ ] Total violations count is accurate
- [ ] Termination occurs at 3 total violations
- [ ] Violation log shows all types

---

## Test 8: Warning Overlay UI

### Visual Checks:
- [ ] Overlay covers entire screen
- [ ] Background is semi-transparent dark
- [ ] Card is centered
- [ ] Shake animation plays on violation
- [ ] Icon changes color (yellow → orange → red)
- [ ] Violation counter is visible
- [ ] Description is clear
- [ ] Continue button works
- [ ] Rules reminder is visible

### Responsive Check:
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test on desktop viewport

---

## Test 9: Termination Screen UI

### Visual Checks:
- [ ] Red gradient background
- [ ] Lock icon with pulse animation
- [ ] Title "Exam Terminated" is visible
- [ ] Violation summary shows correct counts
- [ ] Violation log shows all violations
- [ ] Timestamps are formatted correctly
- [ ] Submission status is shown
- [ ] Instructions are clear
- [ ] Return to home button works

---

## Test 10: Data Export

### Steps:
1. Trigger 3 violations
2. Open browser console
3. Run:
```javascript
violationController.exportForSubmission()
```

### Expected Output:
```javascript
{
  violations: [
    {
      type: 'FOCUS_LOSS',
      timestamp: '2024-02-19T10:30:00.000Z',
      severity: 'warning',
      description: 'Student switched to another tab or window',
      metadata: { ... }
    },
    // ... more violations
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

### Pass Criteria:
- [ ] All violations are included
- [ ] Timestamps are correct
- [ ] Summary counts are accurate
- [ ] Termination reason is clear

---

## Test 11: Monitoring Lifecycle

### Steps:
1. Start exam
2. Check console: "🔒 Starting security monitoring..."
3. Check console: "✅ Security monitoring active"
4. Navigate away from exam
5. Check console: "🔓 Stopping security monitoring..."
6. Check console: "✅ Security monitoring stopped"

### Pass Criteria:
- [ ] Monitoring starts on exam mount
- [ ] Monitoring stops on exam unmount
- [ ] No memory leaks
- [ ] Event listeners are cleaned up

---

## Test 12: Browser Compatibility

### Browsers to Test:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Features to Verify:
- [ ] Fullscreen API works
- [ ] Visibility API works
- [ ] Clipboard events work
- [ ] Keyboard events work
- [ ] Context menu blocking works

---

## Test 13: Performance

### Metrics to Check:
1. Open browser DevTools → Performance tab
2. Start recording
3. Trigger several violations
4. Stop recording
5. Check metrics

### Expected Performance:
- [ ] CPU usage < 1%
- [ ] Memory usage < 5MB
- [ ] No memory leaks
- [ ] No frame drops
- [ ] Smooth animations

---

## Test 14: Edge Cases

### Test Rapid Violations:
1. Rapidly switch tabs 10 times
2. Verify only 3 violations are counted
3. Verify termination occurs

### Test During Submission:
1. Start submitting exam
2. Try to trigger violation
3. Verify violation is ignored (already submitting)

### Test After Termination:
1. Trigger termination
2. Try to trigger more violations
3. Verify violations are ignored (already terminated)

---

## Automated Testing Script

### Run in Browser Console:

```javascript
// Test violation registration
console.log('Testing violation registration...')

// Import controller
const { violationController } = await import('./lib/security/ViolationController')

// Reset state
violationController.reset()
console.log('✅ Controller reset')

// Register test violations
violationController.registerViolation('FOCUS_LOSS', 'Test 1')
console.log('✅ Violation 1 registered')

violationController.registerViolation('FOCUS_LOSS', 'Test 2')
console.log('✅ Violation 2 registered')

violationController.registerViolation('FOCUS_LOSS', 'Test 3')
console.log('✅ Violation 3 registered')

// Check state
const state = violationController.getState()
console.log('Final state:', state)

// Verify
console.assert(state.focusLossCount === 3, 'Focus loss count should be 3')
console.assert(state.totalViolations === 3, 'Total violations should be 3')
console.assert(state.isTerminated === true, 'Should be terminated')

console.log('✅ All assertions passed!')
```

---

## Regression Testing

### After Code Changes:

1. Run all tests above
2. Verify no regressions
3. Check console for errors
4. Test on multiple browsers
5. Test on multiple devices

---

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

Test 1: Tab Switching          [ ] Pass [ ] Fail
Test 2: Copy/Paste             [ ] Pass [ ] Fail
Test 3: DevTools               [ ] Pass [ ] Fail
Test 4: Fullscreen             [ ] Pass [ ] Fail
Test 5: Context Menu           [ ] Pass [ ] Fail
Test 6: Keyboard Shortcuts     [ ] Pass [ ] Fail
Test 7: Mixed Violations       [ ] Pass [ ] Fail
Test 8: Warning UI             [ ] Pass [ ] Fail
Test 9: Termination UI         [ ] Pass [ ] Fail
Test 10: Data Export           [ ] Pass [ ] Fail
Test 11: Lifecycle             [ ] Pass [ ] Fail
Test 12: Compatibility         [ ] Pass [ ] Fail
Test 13: Performance           [ ] Pass [ ] Fail
Test 14: Edge Cases            [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________
```

---

## Summary

Complete all tests before deploying to production. Document any failures and fix before release.

**All tests passing = System is production-ready! ✅**
