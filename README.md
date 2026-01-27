# Customer Inbox Triage App

> **Important Note**: This application is intentionally imperfect. It was designed for the L2 Technical Assessment to provide opportunities for product, workflow, logic, and AI improvements.

## Overview

The Customer Inbox Triage app is a lightweight AI-powered tool that helps classify customer support messages and recommend actions. It uses OpenAI's API to categorize messages, applies rule-based urgency scoring, and suggests next steps based on predefined templates.

## Problem Statement

Support teams waste time manually reading and triaging customer messages. This tool provides an automated first pass at classification to help prioritize and route messages more efficiently.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq API (Llama 3.3 70B - Free tier)
- **Runtime**: Browser-based (local development only)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API key (FREE - get from https://console.groq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "L2 assessment"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Groq API Key**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Groq API key:
   ```
   VITE_GROQ_API_KEY=gsk_your-actual-key-here
   ```
   
   Get your FREE API key from: https://console.groq.com/keys
   
   **Why Groq?** Groq offers a generous free tier with fast inference and no credit card required!

4. **Run the application**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## How It Works

1. **Paste Message**: User pastes a customer support message into the text area
2. **Analyze**: Click "Analyze Message" to process the input
3. **Classification**: The app runs three processes in parallel:
   - **Category Classification** (LLM): Uses Groq AI (Llama 3.3 70B) to categorize the message
   - **Urgency Scoring** (Rule-based): Applies simple rules to determine urgency
   - **Recommendation** (Template-based): Maps category to a recommended action
4. **Display Results**: Shows category, urgency tag, recommended action, and AI reasoning
5. **History**: All analyses are saved to localStorage and viewable in the History tab

## Known Issues & Intentional Flaws

This application is deliberately flawed to create opportunities for improvement during the L2 assessment.

### UX/UI Issues
- ❌ No loading state during API calls
- ❌ No error state display
- ❌ No input validation (empty messages allowed)
- ❌ No character counter
- ❌ Poor spacing and visual hierarchy
- ❌ Urgency tags barely differentiated visually
- ❌ Results displayed in cramped layout

### Workflow Issues
- ❌ Only processes one message at a time
- ❌ No message history
- ❌ No way to copy results
- ❌ No edit capability for outputs
- ❌ No reset button

### Logic Issues
- ❌ Urgency rules are oversimplified
  - Assumes "!" always means high urgency
  - Assumes short messages are low urgency
  - Ignores actual urgency keywords
- ❌ Template mismatches (e.g., "Feature Request" → "Check billing portal")
- ❌ No handling of edge cases (empty input, very long messages)

### AI/LLM Issues
- ❌ Prompt is too vague
- ❌ No examples or structure in prompt
- ❌ No output format constraints
- ❌ Inconsistent category names possible
- ❌ Reasoning field often vague
- ❌ No confidence scoring

## Example Test Messages

### Example 1: Short Urgent Message (Incorrectly Categorized)
**Input:**
```
Our production server is down
```

**Expected Issues:**
- Marked as "Low" urgency (because it's short)
- Should be "High" urgency!

### Example 2: Long Message with Exclamation (Incorrectly Categorized)
**Input:**
```
Hi there! I just wanted to say thank you for your amazing customer service. I've been using your product for three years now and I'm really happy with it. Keep up the great work!
```

**Expected Issues:**
- Marked as "High" urgency (because it contains "!")
- Should be "Low" urgency (it's just a compliment)

### Example 3: Feature Request Template Mismatch
**Input:**
```
I would love to see a dark mode option in the app. It would be much easier on my eyes during night time usage.
```

**Expected Issues:**
- Categorized as "Feature Request"
- Recommended action: "Ask user to check billing portal" (wrong template!)

### Example 4: Ambiguous Category
**Input:**
```
I tried to update my payment method but the page keeps loading forever. Is this a known issue?
```

**Expected Issues:**
- Could be categorized as either "Billing Issue" or "Technical Problem"
- Inconsistent categorization depending on LLM response

### Example 5: Empty or Invalid Input
**Input:**
```
(empty string or just spaces)
```

**Expected Issues:**
- No validation prevents submission
- May cause API errors or unexpected behavior

## Improvement Opportunities

Students working on this project can improve:

1. **UX Enhancements**: Add loading states, error handling, better layout, input validation
2. **Workflow Improvements**: Add history, copy functionality, batch processing, reset button
3. **Logic Refinements**: Improve urgency rules, fix template mismatches, add fallbacks
4. **AI Optimizations**: Better prompts, structured outputs, confidence scoring, examples
5. **Additional Features**: Confidence metrics, editable categories, priority queues, analytics

## Security Note

⚠️ **Warning**: This application exposes the Groq API key in the browser (using `dangerouslyAllowBrowser: true`). This is acceptable for local development and assessment purposes but should **NEVER** be done in production. In a real application, API calls should be made from a secure backend server.

## Why Groq Instead of OpenAI?

- ✅ **Completely Free** - No credit card required
- ✅ **Fast Inference** - Groq's LPU technology is incredibly fast
- ✅ **Generous Limits** - ~14,400 requests/day on free tier
- ✅ **High Quality** - Llama 3.3 70B performs excellently
- ✅ **Easy Signup** - Get started in minutes at https://console.groq.com

## License

This project is for educational and assessment purposes only.
