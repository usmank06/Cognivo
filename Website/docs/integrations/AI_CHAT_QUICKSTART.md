# Quick Setup: AI Chat Feature

## 1. Install Python Dependencies

```bash
cd python-api
pip install anthropic python-dotenv
```

## 2. Get Anthropic API Key

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-api03-...`)

## 3. Configure Environment

Create `.env` file in `python-api/` directory:

```bash
# In python-api/ directory
echo ANTHROPIC_API_KEY=your-key-here > .env
```

Replace `your-key-here` with your actual API key.

## 4. Start All Servers

```bash
# From Website/ root directory
npm run dev
```

This starts:
- Frontend (Vite) on port 5173
- Express API on port 3001
- Python API on port 8000

## 5. Test It Out

1. Open http://localhost:5173
2. Login or register
3. Go to "Board" page
4. Create a new canvas
5. Click "New Chat" button
6. Try these prompts:
   - "Hello! Can you help me?"
   - "Add a text node that says 'Welcome'"
   - "Create a simple layout with 3 nodes"

## Watch For

- ✅ Text streaming word-by-word
- ✅ "Editing canvas..." spinner when AI modifies canvas
- ✅ Canvas updates in real-time
- ✅ Conversation history persists

## Troubleshooting

### Python API won't start
```bash
cd python-api
pip install -r requirements.txt
```

### "Anthropic API key not configured"
- Check `.env` file exists in `python-api/`
- Check key starts with `sk-ant-`
- Restart Python server

### Stream not working
- Check browser console for errors
- Check Network tab (should see streaming response)
- Verify all 3 servers are running

## Full Documentation

See `readmes/Website/AI_CHAT_STREAMING.md` for complete documentation.
