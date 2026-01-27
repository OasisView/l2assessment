# Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API Key
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key:
# VITE_OPENAI_API_KEY=sk-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### Step 3: Start the App
```bash
npm run dev
```

### Step 4: Open Browser
Navigate to: `http://localhost:5173` (or the port shown in terminal)

### Step 5: Test It Out
Copy and paste this test message:
```
Server down now
```

Click "Analyze Message" and observe the results.

## What You Should See

The app will show:
- **Category**: Likely "Technical Problem"
- **Urgency**: Low (❌ This is wrong! Short message = Low urgency by the flawed logic)
- **Recommended Action**: "Escalate to Tier 2 Support"
- **AI Reasoning**: Explanation from the AI

## Known Issues to Explore

Try these test cases to see the flaws:

1. **Empty message** - No validation stops you
2. **"Thank you!"** - Marked as High urgency (wrong!)
3. **"Add dark mode please"** - Wrong recommendation
4. **Click analyze twice** - No loading state, no feedback

## Project Structure

```
src/
├── App.jsx              # Main UI (intentionally flawed)
├── utils/
│   ├── llmHelper.js     # OpenAI integration (vague prompt)
│   ├── urgencyScorer.js # Rule-based scoring (broken logic)
│   └── templates.js     # Recommendations (mismatched)
```

## Important Files

- **README.md** - Full documentation and setup
- **TESTING.md** - Complete list of flaws to verify
- **sample-messages.json** - 8 test messages to try
- **INSTRUCTOR-NOTES.md** - Assessment guidance (for instructors)

## Troubleshooting

**"API key not working"**
- Ensure it starts with `sk-`
- Check file is named `.env.local` (not `.env`)
- Restart dev server after adding key

**"Port 5173 in use"**
- Normal! Vite will use 5174, 5175, etc.

**"Styles not loading"**
- Run `npm install` again
- Restart dev server

## Next Steps

### For Week 2 Assessment:
1. Test with all sample messages
2. Document issues you find
3. Prioritize what to fix
4. Propose improvements

### For Week 8 Assessment:
1. Pick 3-5 issues to fix
2. Implement improvements
3. Improve the AI prompt
4. Add error handling
5. Document your changes

## Need More Info?

- Full setup: See **README.md**
- Testing guide: See **TESTING.md**
- Sample messages: See **sample-messages.json**

---

**Remember**: This app is intentionally flawed for learning purposes! 🎓
