# 🚀 Quick Setup Guide - Cognivo

This guide will help you get Cognivo up and running in under 5 minutes.

## ⚡ Quick Start (TL;DR)

```bash
# 1. Install dependencies
npm install
cd python-api && pip install -r requirements.txt && cd ..

# 2. Setup environment
copy .env.example .env
# Edit .env and add your Anthropic API key

# 3. Run everything
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📋 Detailed Setup

### Step 1: Prerequisites

Make sure you have:
- ✅ **Node.js** v18+ ([Download](https://nodejs.org/))
- ✅ **Python** 3.9+ ([Download](https://python.org/downloads/))
- ✅ **npm** (comes with Node.js)

Verify installation:
```bash
node --version    # Should show v18.x.x or higher
python --version  # Should show 3.9.x or higher
npm --version     # Should show 9.x.x or higher
```

### Step 2: Install Dependencies

**Node.js packages:**
```bash
npm install
```

**Python packages:**
```bash
cd python-api
pip install -r requirements.txt
cd ..
```

### Step 3: Environment Setup

**Create `.env` file:**

Windows CMD:
```cmd
copy .env.example .env
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

macOS/Linux:
```bash
cp .env.example .env
```

**Get your Anthropic API key:**

1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Sign in or create account
3. Click "Create Key"
4. Copy the API key (starts with `sk-ant-api03-...`)

**Edit `.env` file:**

Open `.env` in your text editor and paste your API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
```

**⚠️ IMPORTANT:** 
- Never share your API key
- Never commit `.env` to Git (it's already in `.gitignore`)
- Keep it secret!

### Step 4: Run the Application

**Option A: Run everything together (Recommended)**

```bash
npm run dev
```

This starts:
- 🌐 Frontend on `http://localhost:3000`
- 🔌 Node.js API on `http://localhost:3001`
- 🐍 Python API on `http://localhost:8000`

**Option B: Run individually (for debugging)**

Terminal 1 - Frontend:
```bash
npm run dev:vite
```

Terminal 2 - Node.js API:
```bash
npm run dev:api
```

Terminal 3 - Python API:
```bash
npm run dev:python
```

### Step 5: Test It Out

1. Open browser to `http://localhost:3000`
2. Click "Register" to create account
3. Login with your credentials
4. Upload a CSV/Excel file on "Sources" page
5. Go to "Canvas" page
6. Start chatting with AI!

---

## 🎯 What Each Service Does

### Frontend (Port 3000)
- React app built with Vite
- Provides the UI for canvas, chat, file management
- Communicates with Node.js API

### Node.js API (Port 3001)
- Handles authentication
- Manages canvas and file storage
- Proxies AI chat requests to Python API
- Stores data in MongoDB

### Python API (Port 8000)
- Processes uploaded files with Claude AI
- Generates intelligent visualizations
- Handles streaming AI chat responses
- Tracks token usage

---

## 🗂️ Environment Variables Explained

```env
# Required - Get from Anthropic Console
ANTHROPIC_API_KEY=your-key-here

# Optional - Server ports (defaults work fine)
API_SERVER_PORT=3001        # Node.js API port
PYTHON_API_PORT=8000        # Python API port
VITE_PORT=3000             # Frontend port

# Optional - MongoDB config (defaults work fine)
MONGODB_DB_NAME=cognivo
MONGODB_STORAGE_ENGINE=wiredTiger
```

**You only NEED to set `ANTHROPIC_API_KEY`** - everything else has sensible defaults.

---

## 🐛 Common Issues & Fixes

### Issue: "Port 3000 already in use"

**Fix:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

Then restart: `npm run dev`

### Issue: "ANTHROPIC_API_KEY not set"

**Fix:**
1. Make sure `.env` file exists in root directory (not in `python-api/`)
2. Check that the API key line has no extra spaces
3. Restart the servers after editing `.env`

### Issue: "Module 'dotenv' not found"

**Fix:**
```bash
npm install dotenv
```

### Issue: Python packages missing

**Fix:**
```bash
cd python-api
pip install -r requirements.txt
cd ..
```

### Issue: MongoDB connection error

**Fix:**
1. Delete the `mongodb-data/` folder
2. Restart the app: `npm run dev`
3. MongoDB will recreate the database

---

## 📝 Next Steps

After setup, check out:

- **README.md** - Full documentation
- **python-api/TESTING_GUIDE.md** - API testing guide
- Try uploading a sample CSV file
- Experiment with AI chat and canvas editing

---

## 🆘 Still Having Issues?

1. Make sure all prerequisites are installed
2. Check that ports 3000, 3001, 8000 are available
3. Verify `.env` file is in the ROOT directory (not in python-api/)
4. Try deleting `node_modules/` and running `npm install` again
5. Try deleting `python-api/__pycache__/` and reinstalling Python packages

---

## ✅ Checklist

- [ ] Node.js v18+ installed
- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`npm install` and `pip install -r python-api/requirements.txt`)
- [ ] `.env` file created from `.env.example`
- [ ] Anthropic API key added to `.env`
- [ ] All services running (`npm run dev`)
- [ ] Browser open to `http://localhost:3000`
- [ ] Account registered and logged in

**All checked?** You're ready to go! 🚀

---

**Need help?** Check the main README.md for detailed documentation.
