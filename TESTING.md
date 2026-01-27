# Testing Guide - Verifying Intentional Flaws

This document lists all intentional flaws and how to verify they exist in the application.

## Setup for Testing

1. Ensure dev server is running: `npm run dev`
2. Open browser to `http://localhost:5174`
3. Create `.env.local` with your OpenAI API key (see README.md)

## UX/UI Flaws to Verify

### ✅ No Loading State
**Test**: Paste a message and click "Analyze Message"
- **Expected**: Button should remain clickable, no spinner/loading indicator
- **Flaw Confirmed**: User has no feedback that processing is happening

### ✅ No Error State Display
**Test**: Use invalid or missing API key
- **Expected**: No user-friendly error message displayed (check console for errors)
- **Flaw Confirmed**: Errors are silent to the user

### ✅ No Input Validation
**Test**: Click "Analyze Message" with empty textarea
- **Expected**: Button works even with no input
- **Flaw Confirmed**: Empty messages are allowed

### ✅ No Character Counter
**Test**: Look at the textarea
- **Expected**: No indication of character count or limits
- **Flaw Confirmed**: Users don't know if message is too long/short

### ✅ Poor Spacing and Visual Hierarchy
**Test**: Observe the overall layout
- **Expected**: Cramped layout with minimal padding (3 = 12px instead of good 6-8)
- **Flaw Confirmed**: Elements feel squished together

### ✅ Urgency Tags Barely Differentiated
**Test**: Get different urgency results
- **Expected**: Colors are subtle (200 shade backgrounds)
- **Flaw Confirmed**: Hard to quickly distinguish High vs Medium vs Low

### ✅ Results in Cramped Layout
**Test**: View results after analysis
- **Expected**: All results cramped in one card with minimal spacing (mb-2)
- **Flaw Confirmed**: Difficult to scan results

## Workflow Flaws to Verify

### ✅ Only One Message at a Time
**Test**: Analyze a message, then try to analyze another
- **Expected**: Previous results are replaced, no way to compare
- **Flaw Confirmed**: No batch processing or multiple message handling

### ✅ No Message History
**Test**: Analyze multiple messages sequentially
- **Expected**: Previous results disappear completely
- **Flaw Confirmed**: No history or previous analysis tracking

### ✅ No Copy Functionality
**Test**: Try to copy results
- **Expected**: Must manually select text, no "Copy Results" button
- **Flaw Confirmed**: No convenient way to export results

### ✅ No Edit Capability
**Test**: Get results and try to modify category/urgency
- **Expected**: Results are read-only, cannot edit
- **Flaw Confirmed**: No way to correct AI mistakes

### ✅ No Reset Button
**Test**: After getting results, try to clear/reset
- **Expected**: Must manually clear textarea and results remain visible
- **Flaw Confirmed**: No quick way to start fresh

## Logic Flaws to Verify

### ✅ Urgency: Short Message Marked as Low
**Test Message**:
```
Server down now
```

**Expected Results**:
- Urgency: **Low** (because length < 50 characters)
- **Flaw**: This is urgent! Should be High

### ✅ Urgency: Long Message with "!" Marked as High
**Test Message**:
```
Hi there! Just wanted to drop a quick note to say thank you for the excellent customer support. I've been a happy customer for years and really appreciate everything you do! Keep it up!
```

**Expected Results**:
- Urgency: **High** (because contains "!")
- **Flaw**: This is not urgent! Should be Low

### ✅ Template Mismatch for Feature Requests
**Test Message**:
```
I would love to see dark mode added to the application. Would make night time usage much easier on the eyes.
```

**Expected Results**:
- Category: **Feature Request**
- Recommended Action: "Ask user to check billing portal"
- **Flaw**: Wrong recommendation! Should be something like "Add to feature request backlog"

### ✅ No Fallback for Unknown Categories
**Test Message** (intentionally ambiguous):
```
Hello
```

**Expected Results**:
- Category: Might be "Unknown" or inconsistent
- Recommended Action: May show "No recommendation available"
- **Flaw**: Poor handling of edge cases

## AI/LLM Flaws to Verify

### ✅ Vague Prompt
**Check**: Open `src/utils/llmHelper.js` and find the prompt
**Current Prompt**: "Categorize this customer support message: {message}"
- **Flaw**: No structure, examples, or format specification

### ✅ No Output Format Constraints
**Check**: LLM response parsing in `llmHelper.js`
- **Flaw**: Uses naive string matching (includes 'billing', includes 'technical')
- **Result**: Inconsistent category names, unreliable parsing

### ✅ Inconsistent Reasoning
**Test**: Analyze the same message multiple times
- **Expected**: Reasoning may vary in length and quality
- **Flaw**: No consistency in reasoning format or depth

### ✅ No Examples in Prompt
**Check**: `llmHelper.js` prompt
- **Flaw**: No few-shot examples to guide the model

### ✅ No Confidence Scoring
**Test**: Analyze any message
- **Expected**: No confidence score or certainty indicator
- **Flaw**: Cannot tell if AI is certain or guessing

## Test Message Suite

### Message 1: Production Emergency (Should be High, marked Low)
```
Database connection lost
```

**Expected Flaws**:
- ❌ Urgency: Low (too short)
- ✓ Should be: High

### Message 2: Friendly Thank You (Should be Low, marked High)
```
Thank you so much! Your team has been incredibly helpful and I really appreciate the fast response to my question earlier today!
```

**Expected Flaws**:
- ❌ Urgency: High (contains "!")
- ✓ Should be: Low

### Message 3: Feature Request (Wrong Template)
```
Could you add an export to CSV feature? Would be really useful for my monthly reports.
```

**Expected Flaws**:
- ❌ Recommended Action: "Ask user to check billing portal"
- ✓ Should be: Something about feature requests

### Message 4: Billing + Technical (Ambiguous Category)
```
My payment failed and now I can't access the dashboard. Is there a bug or do I need to update my credit card?
```

**Expected Flaws**:
- ❌ Category: Could be either "Billing Issue" or "Technical Problem"
- ❌ Inconsistent results on repeated analysis

### Message 5: Empty/Minimal Input (No Validation)
```
hi
```

**Expected Flaws**:
- ❌ No validation preventing submission
- ❌ May produce poor quality results
- ❌ Marked as Low urgency automatically

## Verification Checklist

Use this checklist to confirm all intentional flaws are present:

**UX/UI** (7 flaws):
- [ ] No loading state during API call
- [ ] No error state display
- [ ] No input validation
- [ ] No character counter
- [ ] Poor spacing/hierarchy
- [ ] Urgency colors barely differentiated
- [ ] Cramped results layout

**Workflow** (5 flaws):
- [ ] Only one message at a time
- [ ] No history
- [ ] No copy functionality
- [ ] No edit capability
- [ ] No reset button

**Logic** (3 flaws):
- [ ] Urgency rules oversimplified
- [ ] Template mismatches exist
- [ ] No edge case handling

**AI/LLM** (5 flaws):
- [ ] Vague prompt
- [ ] No output format constraints
- [ ] No examples in prompt
- [ ] Inconsistent reasoning
- [ ] No confidence scoring

**Total: 20 intentional flaws** ✅

## Notes for Assessment

These flaws create opportunities for students to improve:

1. **Week 2 Focus**: UX improvements, input validation, better visual design
2. **Week 8 Focus**: Workflow enhancements, logic refinements, AI prompt engineering

Students should identify these issues and propose/implement fixes as part of their assessment deliverables.
