# AI Features Setup Checklist

## ✅ Already Done (Implemented)

### AI Chat System:
- [x] Python FastAPI streaming endpoint created
- [x] Express API proxy route added
- [x] ChatSidebar component updated with streaming logic
- [x] Documentation created (4 markdown files)
- [x] .env.example template created
- [x] requirements.txt updated with chat dependencies

### AI File Processing:
- [x] Claude AI integration for intelligent subset generation
- [x] Full pandas CSV reading implementation
- [x] Full pandas Excel reading (multi-sheet support)
- [x] Automatic data analysis and visualization recommendations
- [x] Smart sampling for large files (>5000 rows)
- [x] Column type detection and analysis
- [x] Generate 5-15 diverse visualization subsets per file
- [x] Testing guide and sample data created

## ✅ Previously Done

- [x] Python FastAPI streaming endpoint created
- [x] Express API proxy route added
- [x] ChatSidebar component updated with streaming logic
- [x] Documentation created (4 markdown files)
- [x] .env.example template created
- [x] requirements.txt updated with new dependencies

---

## 🔧 What You Need to Do (Step-by-Step)

### 1. Install Python Dependencies (5 minutes)

```bash
cd python-api
pip install anthropic python-dotenv
```

**Why:** Adds Claude AI SDK and environment variable management.

**Verify it worked:**
```bash
pip list | grep anthropic
# Should show: anthropic 0.39.0 (or similar)

pip list | grep python-dotenv
# Should show: python-dotenv 1.0.0 (or similar)
```

---

### 2. Get Anthropic API Key (5 minutes)

**Steps:**
1. Go to: https://console.anthropic.com/settings/keys
2. Sign up or log in to Anthropic Console
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-api03-...`)

**Cost Information:**
- Claude Sonnet 4 pricing: ~$3/million input tokens, ~$15/million output tokens
- Typical message: ~$0.006 per conversation turn
- They give free credits to start

**Important:** Keep this key secret! Never commit it to git.

---

### 3. Create .env File (2 minutes)

```bash
# In python-api/ directory
cd python-api

# Windows (cmd):
echo ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here > .env

# Or just create the file manually and paste:
# ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Verify it worked:**
```bash
# Windows (cmd):
type .env

# Should show:
# ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Important:** Make sure `.env` is in your `.gitignore` so you don't commit it!

---

### 4. Test Python API (2 minutes)

```bash
# Start just the Python API to test
cd python-api
python main.py

# Should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete.
```

**In another terminal, test health check:**
```bash
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "message": "Python API is running!",
#   "anthropic_configured": true  ← Should be TRUE
# }
```

**If `anthropic_configured` is `false`:**
- Check `.env` file exists in `python-api/` directory
- Check API key format (should start with `sk-ant-`)
- Restart Python server

---

### 5. Start All Servers (2 minutes)

```bash
# From Website/ root directory
npm run dev

# Should start 3 servers:
# ✓ Vite frontend (port 5173)
# ✓ Express API (port 3001)
# ✓ Python API (port 8000)
```

**Verify all running:**
- Frontend: http://localhost:5173 (should show your app)
- Express API: http://localhost:3001/health (should return JSON)
- Python API: http://localhost:8000/health (should show anthropic_configured: true)

---

### 6. Test the Chat Feature (5 minutes)

**In the Browser:**

1. Go to: http://localhost:5173
2. Login or register
3. Navigate to "Board" page
4. Create a new canvas (if you don't have one)
5. In the left sidebar, click "New Chat"
6. Type a test message:
   ```
   Hello! Can you help me?
   ```
7. Click Send

**What You Should See:**
- Text appears word-by-word ✓
- AI responds naturally ✓
- Message saved to chat history ✓

**Try Canvas Editing:**
```
Add a text node that says "Hello World"
```

**What You Should See:**
- AI responds with text ✓
- Spinner appears: "🔧 Editing canvas..." ✓
- Canvas updates (new node appears) ✓
- Success toast: "Canvas updated!" ✓

**Try More Complex:**
```
Create a simple layout with 3 text nodes: Title, Description, and Footer
```

---

### 7. Check for Errors (Optional Debugging)

**If text doesn't stream:**
- Open browser DevTools (F12)
- Go to Network tab
- Send a message
- Look for `/api/chat/stream` request
- Check if it's streaming (Content-Type: text/plain)
- Look in Console for JavaScript errors

**If spinner never appears:**
- Check Console for errors
- Verify Python API is running
- Check Network tab for stream events

**If canvas doesn't update:**
- Check that `onReloadCanvas()` is being called
- Look for MongoDB connection errors in Express terminal
- Check that canvas ID is correct

---

## 🎯 Quick Verification Commands

```bash
# 1. Check Python dependencies
cd python-api
pip list | grep -E "anthropic|python-dotenv"

# 2. Check .env exists
type .env  # Windows
cat .env   # Mac/Linux

# 3. Test Python API health
curl http://localhost:8000/health

# 4. Check all servers running
# You should see 3 processes running:
# - node (Express API)
# - vite (Frontend)
# - python main.py (Python API)

# 5. Test from browser
# http://localhost:5173
```

---

## 📋 Troubleshooting Guide

### "ModuleNotFoundError: No module named 'anthropic'"
**Solution:**
```bash
cd python-api
pip install anthropic python-dotenv
```

### "anthropic_configured": false in health check
**Solution:**
1. Check `.env` file exists: `type .env`
2. Check format: `ANTHROPIC_API_KEY=sk-ant-...`
3. No spaces around `=`
4. Restart Python server

### "Anthropic API key not configured" error in chat
**Solution:**
- Same as above
- Make sure Python server restarted after creating .env

### Text not streaming in browser
**Check:**
1. Browser console for errors (F12)
2. Network tab - is request streaming?
3. Express logs - any errors?
4. Python logs - any errors?

### Canvas doesn't update
**Check:**
1. Is MongoDB running? (Express should show "MongoDB connected")
2. Check canvas ID is correct
3. Look for errors in browser Console
4. Check Express logs for MongoDB errors

### High costs / too many tokens
**Solutions:**
- The system prompt is ~500 tokens
- Each data file adds ~300 tokens
- Consider limiting data_sources sent to Python
- Add rate limiting (10 messages/minute)
- Track costs in Settings page (already implemented)

---

## 🚀 You're Done When...

- [ ] Python API health check shows `"anthropic_configured": true`
- [ ] All 3 servers start without errors
- [ ] Can login to frontend
- [ ] Can create a canvas
- [ ] Can create a chat
- [ ] Can send a message and see text stream word-by-word
- [ ] Can ask AI to edit canvas and see spinner + canvas update
- [ ] Messages persist (refresh page, they're still there)
- [ ] Can send follow-up messages

---

## 📚 Documentation Reference

All docs are in `readmes/Website/`:

- **AI_CHAT_QUICKSTART.md** - Quick setup (you're reading the extended version now)
- **AI_CHAT_STREAMING.md** - Complete technical documentation
- **AI_CHAT_IMPLEMENTATION_SUMMARY.md** - What was implemented
- **AI_CHAT_FLOW_DIAGRAM.md** - Visual flow diagrams

---

## 🎉 Estimated Total Time: 20-30 minutes

Most of this is just installing dependencies and getting an API key. The actual implementation is already done!

---

## 💡 Next Steps (After It's Working)

Once the basic chat is working, you can:

1. **Implement file processing** (python-api/main.py has TODOs for pandas logic)
2. **Add more tools** (e.g., analyze_data, create_visualization)
3. **Implement visual canvas** (replace JSON textarea with React Flow)
4. **Add rate limiting** (prevent abuse)
5. **Track token costs** (use existing token tracker)
6. **Add "Stop generating" button**
7. **Improve error messages**

But for now, just get it running! 🚀
