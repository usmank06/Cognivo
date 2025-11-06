# 🎨 Cognivo - AI-Powered Data Visualization Platform

Transform your spreadsheets into intelligent, interactive visualizations using the power of Claude AI. Cognivo is a modern web platform that analyzes your data and automatically generates comprehensive dashboards with 10-15+ diverse charts.

---

## 📸 Screenshots

### Landing Page
![Cognivo Landing Page](./assets/landing-page.png)
*Clean, modern interface for data visualization*

### Interactive Dashboard
![Interactive Canvas Dashboard](./assets/dashboard.png)
*AI-generated visualizations from uploaded CSV/Excel files*

---

## 🎥 Demo Video

[![Cognivo Demo](./assets/video-thumbnail.png)](./assets/demo.mp4)
*Watch how Cognivo transforms raw data into insights in seconds*

---

## ✨ What is Cognivo?

Cognivo is an AI-powered data visualization platform that makes data analysis accessible to everyone. Simply upload your CSV or Excel file, and watch as Claude AI analyzes your data and creates a comprehensive dashboard with multiple chart types, trends, comparisons, and insights.

**Key Capabilities:**
- 🤖 **AI-Powered Analysis** - Claude AI intelligently analyzes your data structure and content
- 📊 **Auto-Generate Dashboards** - Creates 10-15+ diverse visualizations automatically
- 🎨 **Interactive Canvas** - Drag-and-drop interface for customizing your visualizations
- 💬 **AI Chat Assistant** - Ask questions about your data and get instant visual answers
- 📁 **Multi-Format Support** - Works with CSV, Excel (XLSX/XLS), and multiple sheets
- 💾 **Persistent Storage** - Your canvases and data are automatically saved

---

## � Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Anthropic API Key ([Get one here](https://console.anthropic.com/settings/keys))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/usmank06/Data-Platform-MVP.git
cd Website

# 2. Install dependencies
npm install
cd python-api && pip install -r requirements.txt && cd ..

# 3. Setup environment
copy .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# 4. Run the application
npm run dev
```

Visit **http://localhost:3000** to start visualizing!

---

## 🛠 Tech Stack

**Frontend:** React 18, TypeScript, Vite, ReactFlow, Recharts, Radix UI, Tailwind CSS  
**Backend:** Node.js, Express, Python FastAPI, MongoDB, GridFS  
**AI:** Anthropic Claude (Haiku 4.5)

---

## 📊 How It Works

1. **Upload** - Drop your CSV/Excel file into the platform
2. **AI Analysis** - Claude AI analyzes columns, data types, relationships, and patterns
3. **Auto-Visualization** - System generates 10-15+ charts showing different perspectives
4. **Interact** - Chat with AI to modify visualizations or ask data questions
5. **Export** - Download your dashboard as PDF or individual charts

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
# Required
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional (defaults shown)
API_SERVER_PORT=3001
PYTHON_API_PORT=8000
VITE_PORT=3000
MONGODB_DB_NAME=cognivo
```

**⚠️ Never commit `.env` to Git!**

---

## 📁 Project Structure

```
Website/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── db/               # Database layer
│   └── api/              # API clients
├── python-api/            # FastAPI backend
│   └── main.py           # AI processing server
├── api-server.js         # Express API server
└── mongodb-data/         # Local database (auto-created)
```

---

## 🧪 Testing

```bash
cd python-api
python test_api.py          # Test file processing
python test_integration.py  # Test full workflow
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using React, FastAPI, and Claude AI**
