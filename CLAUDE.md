# CLAUDE.md — Relay AI Customer Inbox Triage

This file is the source of truth for how Claude Code should work in this repo.
Read it fully before making any changes.

---

## Project Overview

**Relay AI** is a SaaS customer operations platform. This repo is the
**Customer Inbox Triage** tool — a React + Vite web app that takes a raw
customer support message and returns:

- A **category** (what type of issue it is)
- A **confidence score** (how sure the LLM is)
- An **urgency level** (High / Medium / Low)
- A **recommended action** (what the support agent should do next)
- An **escalation flag** (whether to immediately route to engineering or billing)

Tech stack: React, Vite, Tailwind CSS, Groq API (Llama 3.3 70B), localStorage.

---

## Repo Structure

```
src/
  utils/
    llmHelper.js       ← LLM call + JSON parsing + mock fallback
    urgencyScorer.js   ← Rule-based urgency scoring (no LLM)
    templates.js       ← Category × urgency action matrix + escalation logic
  pages/
    AnalyzePage.jsx    ← Main UI: input, analysis pipeline, results display
    HistoryPage.jsx    ← Reads triageHistory from localStorage
    DashboardPage.jsx  ← Aggregate stats from localStorage
    HomePage.jsx       ← Landing, links to Analyze
  components/
    Navigation.jsx     ← Top nav bar
```

---

## The Three Core Files — What They Do and the Rules to Follow

### 1. `src/utils/llmHelper.js`

**What it does:**
Calls the Groq API with a system prompt that instructs the LLM to return
structured JSON. Parses and validates the response. Falls back to
`getMockCategorization()` if the API call fails.

**The system prompt contract — do not break this:**

The LLM must be instructed to return ONLY this JSON shape:

```json
{
  "category": "<one of the 5 valid categories>",
  "confidence": 85,
  "reasoning": "One sentence explaining the classification."
}
```

**Valid categories — exactly these strings, nothing else:**

| Category | When to use |
|---|---|
| `"Billing Issue"` | payments, charges, invoices, refunds, subscription changes |
| `"Technical Problem"` | bugs, errors, crashes, features not working, performance |
| `"Feature Request"` | suggestions for new functionality or improvements |
| `"General Inquiry"` | questions, info requests, account questions, positive feedback |
| `"Urgent Outage"` | production down, data loss, security breach, full service unavailable |

**Rules for the LLM call:**
- Always use a `system` role message — never put the category instructions in the user message
- Temperature must stay at `0.1` — we want deterministic classification, not creativity
- Strip markdown fences from the response before `JSON.parse()` — the model sometimes wraps output in ` ```json ``` `
- Always validate `parsed.category` against the valid category list. If the model hallucinated a new category, fall back to `"General Inquiry"` — never let an unknown string propagate downstream
- Clamp `confidence` to `[0, 100]` before returning it

**Return shape from `categorizeMessage()`:**
```js
{ category: string, confidence: number | null, reasoning: string }
```

**Mock fallback rules:**
- `getMockCategorization()` must return the same shape as the live path
- Check for Urgent Outage signals first (highest priority)
- Order of checks: Urgent Outage → Billing → Technical → Feature → General Inquiry (default)
- Use `.some(term => lower.includes(term))` pattern for term lists — not chained `||` conditions

---

### 2. `src/utils/urgencyScorer.js`

**What it does:**
Pure rule-based function. Takes the raw message string, returns `"High"`,
`"Medium"`, or `"Low"`. No LLM involved. No async.

**Scoring rules — follow this logic exactly:**

Start at 50. Apply all matching adjustments. Clamp to [0, 100]. Map to label.

| Signal type | Terms | Score change |
|---|---|---|
| Critical outage | "production down", "outage", "data loss", "security breach", "site is down", "app is down", "completely down" | +40 if any match |
| Urgent language | "urgent", "asap", "immediately", "critical", "emergency", "blocking", "blocked", "losing money", "deadline", "p0", "p1", "sev1" | +15 per match |
| Error signals | "error", "crash", "broken", "not working", "bug", "failed", "500", "404" | +8 per match |
| Frustration | "frustrated", "unacceptable", "ridiculous", "terrible", "horrible", "worst" | +10 per match |
| Multiple exclamation marks (2+) | — | +10 |
| Low urgency language | "feature request", "suggestion", "would be nice", "someday", "eventually" | -20 per match |
| Positive tone | "thank you", "thanks", "appreciate", "happy", "love", "great", "excellent", "wonderful" | -15 per match |
| Question with no error signals | `message.includes('?') && score <= 55` | -10 |

**Thresholds:**
- `score >= 70` → `"High"`
- `score >= 40` → `"Medium"`
- `score < 40` → `"Low"`

**What NOT to do:**
- Do not reduce urgency for ALL CAPS text — shouting usually signals frustration, not spam
- Do not factor in time of day or day of week — urgency is about message content, not when it arrives
- Do not let politeness alone suppress a legitimately urgent ticket

---

### 3. `src/utils/templates.js`

**What it does:**
Maps `(category, urgency)` pairs to specific recommended actions.
Also exports `shouldEscalate(category, urgency)` and `getAvailableCategories()`.

**The action matrix — maintain this structure:**

```
category × urgency → action string
```

Every category must have an entry for High, Medium, and Low.
`getRecommendedAction(category, urgency)` always receives both arguments.

**Escalation logic in `shouldEscalate(category, urgency)`:**

Escalate if ANY of these are true:
- urgency is `"High"` (any category)
- category is `"Urgent Outage"` (any urgency)
- category is `"Billing Issue"` AND urgency is `"Medium"`

Do NOT escalate based on message length, character count, or any other heuristic.

**`getAvailableCategories()` must stay in sync:**
If you add a new category to the action matrix, add it here too. This is used
by the Dashboard and History pages.

---

## `AnalyzePage.jsx` — Pipeline and Data Flow

The analyze pipeline runs in this exact order inside `handleAnalyze()`:

```
1. categorizeMessage(message)     → { category, confidence, reasoning }
2. calculateUrgency(message)      → urgency string
3. getRecommendedAction(category, urgency) → recommendedAction string
4. shouldEscalate(category, urgency)       → escalate boolean
5. Build analysisResult object and setResults()
6. Push to localStorage triageHistory array
```

**The `analysisResult` object shape** — keep all fields present:
```js
{
  message,       // original string
  category,      // from LLM
  confidence,    // from LLM (null if unavailable)
  urgency,       // from urgency scorer
  recommendedAction,
  reasoning,     // from LLM
  escalate,      // boolean
  timestamp      // ISO string
}
```

This shape is read by HistoryPage and DashboardPage. Adding or removing
fields is a breaking change to those pages — update them too.

---

## UI Rules for Results Display

**Category badge colors:**

| Category | Tailwind classes |
|---|---|
| Urgent Outage | `bg-red-100 text-red-800` |
| Technical Problem | `bg-orange-100 text-orange-800` |
| Billing Issue | `bg-yellow-100 text-yellow-800` |
| Feature Request | `bg-purple-100 text-purple-800` |
| General Inquiry | `bg-blue-100 text-blue-800` |

**Confidence bar colors:**
- `>= 80%` → `bg-green-500`
- `>= 60%` → `bg-yellow-500`
- `< 60%` → `bg-red-400`

**Escalation banner:** Only render if `results.escalate === true`.
Use red styling (`bg-red-50 border-red-300`).

**Copy Results button** must include: category, confidence, urgency, escalate flag, recommendation, reasoning.

---

## Environment Setup

```bash
cp .env.example .env.local
# Add your Groq API key:
# VITE_GROQ_API_KEY=gsk_your-key-here

npm install
npm run dev        # http://localhost:5173
npm run build      # production build — run this to verify no errors before committing
```

Get a free Groq key at: https://console.groq.com/keys

**Security note:** `dangerouslyAllowBrowser: true` is set on the Groq client.
This is intentional for local dev only. In production the API call must move
to a backend server with the key in an environment variable, never exposed
to the browser.

---

## Test Messages — Use These to Verify Changes

After any change to the three core utils, test with all five categories
and confirm the category, urgency, and escalation flag are all correct.

```
# Should be: Urgent Outage / High / Escalate
Our production environment is completely down. All users are affected and we're losing revenue every minute. This needs to be fixed NOW.

# Should be: Technical Problem / High / Escalate
The dashboard crashes immediately when I try to filter by date. Getting a 500 error in the console. This is blocking our entire team.

# Should be: Billing Issue / Medium / Escalate
I was charged twice for my subscription this month. I need a refund on the duplicate charge as soon as possible.

# Should be: Feature Request / Low / No escalation
It would be great if the app had a dark mode option. My eyes get tired during late-night sessions.

# Should be: General Inquiry / Low / No escalation
Hi! I've been using Relay AI for about six months and I really love it. Just wanted to say thank you to the team for the great product.
```

---

## What Not to Touch

- `Navigation.jsx` — no changes needed, routing is stable
- `vite.config.js`, `tailwind.config.cjs`, `postcss.config.cjs` — build config, leave alone
- `index.html` — no changes needed
- `localStorage` key names (`triageHistory`, `exampleMessage`) — changing these breaks History and Dashboard silently

---

## Commit Message Format

Use conventional commits:

```
fix: <what was wrong and what you changed>
feat: <new capability added>
refactor: <restructure without behavior change>
```

Run `npm run build` before every commit. A clean build is required.
