# Python FastAPI Integration Guide

## Overview
Your project now runs **3 servers simultaneously**:
1. **Vite** (Frontend) - Port 5173
2. **Express** (Node.js API) - Port 3001  
3. **FastAPI** (Python API) - Port 8000

## Quick Start

### 1. Install Python Dependencies

Open a terminal and navigate to the `python-api` folder:

```bash
cd python-api
```

**Create virtual environment (recommended):**

```bash
# On Windows (cmd)
python -m venv venv
venv\Scripts\activate

# On Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1

# On Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

**Install packages:**

```bash
pip install -r requirements.txt
```

### 2. Run All Servers

From the **root directory** (not inside python-api):

```bash
npm run dev
```

This will start:
- ✅ Express API on http://localhost:3001
- ✅ Vite frontend on http://localhost:5173
- ✅ FastAPI on http://localhost:8000

### 3. Verify Python API

Visit these URLs in your browser:
- http://localhost:8000 - API info
- http://localhost:8000/docs - Interactive Swagger documentation
- http://localhost:8000/health - Health check

## Project Structure

```
Website/
├── python-api/              # ← New Python API folder
│   ├── main.py             # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── README.md          # Python API docs
│   └── venv/              # Virtual environment (created after setup)
├── src/
│   ├── api/
│   │   ├── client.ts      # Express API client
│   │   └── pythonClient.ts # ← New Python API client
│   └── components/
│       └── PythonAPIExample.tsx # ← Example component
└── package.json           # Updated with new script
```

## Using Python API in TypeScript

### Example 1: Simple API Call

```typescript
import { processData } from '../api/pythonClient';

async function handleProcess() {
  const data = [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 30 }
  ];
  
  const response = await processData(data, 'normalize');
  
  if (response.success) {
    console.log('Result:', response.data);
  } else {
    console.error('Error:', response.error);
  }
}
```

### Example 2: In a Component

```typescript
import { useState } from 'react';
import { analyzeData } from '../api/pythonClient';
import { Button } from './ui/button';

export function MyComponent() {
  const [result, setResult] = useState(null);

  const analyze = async () => {
    const response = await analyzeData({ values: [1, 2, 3] });
    if (response.success) {
      setResult(response.data);
    }
  };

  return (
    <div>
      <Button onClick={analyze}>Analyze</Button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### Example 3: Check if Python API is Running

```typescript
import { useEffect, useState } from 'react';
import { checkPythonAPIHealth } from '../api/pythonClient';

export function SomeComponent() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkPythonAPIHealth().then(setIsConnected);
  }, []);

  return (
    <div>
      Python API: {isConnected ? '✅ Connected' : '❌ Disconnected'}
    </div>
  );
}
```

## Adding Python Libraries

### Step 1: Add to requirements.txt

Edit `python-api/requirements.txt`:

```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.2
pandas==2.2.3          # ← Add this
numpy==2.1.3           # ← Add this
scikit-learn==1.5.2    # ← Add this
```

### Step 2: Install

```bash
cd python-api
pip install -r requirements.txt
```

### Step 3: Use in Python API

Edit `python-api/main.py`:

```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

@app.post("/api/analyze-csv")
async def analyze_csv(data: dict):
    # Convert to DataFrame
    df = pd.DataFrame(data['rows'])
    
    # Get statistics
    stats = df.describe().to_dict()
    
    # Example: Calculate correlations
    correlations = df.corr().to_dict() if len(df.columns) > 1 else {}
    
    return {
        "success": True,
        "statistics": stats,
        "correlations": correlations,
        "row_count": len(df),
        "columns": list(df.columns)
    }
```

## Common Use Cases

### Use Case 1: CSV/Excel Processing

**Python side (`main.py`):**

```python
import pandas as pd

@app.post("/api/parse-csv")
async def parse_csv(file_content: str):
    from io import StringIO
    df = pd.read_csv(StringIO(file_content))
    
    return {
        "success": True,
        "data": df.to_dict(orient='records'),
        "columns": list(df.columns),
        "shape": df.shape
    }
```

**TypeScript side:**

```typescript
// In pythonClient.ts
export async function parseCSV(content: string) {
  return callPythonAPI('/api/parse-csv', 'POST', { file_content: content });
}

// In your component
const handleFileUpload = async (file: File) => {
  const text = await file.text();
  const result = await parseCSV(text);
  console.log(result.data);
};
```

### Use Case 2: Machine Learning

**Python side:**

```python
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load your trained model
model = joblib.load('models/my_model.pkl')

@app.post("/api/predict")
async def predict(features: dict):
    X = [[features['feature1'], features['feature2'], features['feature3']]]
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0].tolist()
    
    return {
        "success": True,
        "prediction": int(prediction),
        "probability": probability,
        "confidence": max(probability)
    }
```

**TypeScript side:**

```typescript
const features = {
  feature1: 1.5,
  feature2: 2.3,
  feature3: 0.8
};

const result = await mlPredict(features);
console.log('Prediction:', result.data.prediction);
console.log('Confidence:', result.data.confidence);
```

### Use Case 3: Data Visualization Prep

**Python side:**

```python
import matplotlib.pyplot as plt
import io
import base64

@app.post("/api/generate-plot")
async def generate_plot(data: dict):
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    
    df = pd.DataFrame(data['rows'])
    
    plt.figure(figsize=(10, 6))
    plt.plot(df['x'], df['y'])
    plt.title(data.get('title', 'Plot'))
    plt.xlabel('X')
    plt.ylabel('Y')
    
    # Save to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close()
    
    return {
        "success": True,
        "image": f"data:image/png;base64,{image_base64}"
    }
```

## Troubleshooting

### Python API Not Starting

**Issue:** `npm run dev` fails to start Python API

**Solution:**
1. Make sure Python is installed: `python --version`
2. Check you're in the right directory
3. Try running Python API separately:
   ```bash
   cd python-api
   python main.py
   ```

### Port Already in Use

**Issue:** Port 8000 is already taken

**Solution:** Change port in `main.py`:
```python
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001)  # Changed to 8001
```

And update `pythonClient.ts`:
```typescript
const PYTHON_API_URL = 'http://localhost:8001';
```

### CORS Errors

**Issue:** Browser blocks requests to Python API

**Solution:** Already configured in `main.py`, but verify:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your Vite URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Module Not Found

**Issue:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd python-api
pip install -r requirements.txt
```

## Running Individual Servers

Instead of `npm run dev`, you can run them separately:

**Terminal 1 - Express API:**
```bash
npm run dev:api
```

**Terminal 2 - Vite:**
```bash
npm run dev:vite
```

**Terminal 3 - Python API:**
```bash
npm run dev:python
# or
cd python-api && python main.py
```

## Interactive API Documentation

FastAPI automatically generates interactive documentation!

Visit: **http://localhost:8000/docs**

You can:
- ✅ See all endpoints
- ✅ Try them directly in the browser
- ✅ See request/response schemas
- ✅ No Postman needed!

## Next Steps

1. **Add pandas for CSV processing** in your `fileProcessor.ts`
2. **Integrate ML models** for predictions
3. **Add data analysis endpoints** for your canvas system
4. **Use Python for heavy computations** (statistics, transformations)

## Example Integration: File Processing

Update your file processor to use Python:

**In `fileManager.ts`:**

```typescript
import { parseCSV, generateStatistics } from '../api/pythonClient';

export async function processUploadedFile(file: File) {
  // Read file
  const content = await file.text();
  
  // Send to Python for parsing
  const parseResult = await parseCSV(content);
  
  if (parseResult.success) {
    // Generate statistics using Python
    const statsResult = await generateStatistics(parseResult.data.data);
    
    return {
      data: parseResult.data.data,
      statistics: statsResult.data,
      columns: parseResult.data.columns
    };
  }
}
```

## Summary

✅ **3 servers running**: Node.js (3001) + Vite (5173) + Python (8000)  
✅ **Easy API calls**: Use `pythonClient.ts` helpers  
✅ **Auto-reload**: Both Express and Python APIs reload on changes  
✅ **Type-safe**: TypeScript interfaces for API responses  
✅ **Interactive docs**: FastAPI generates Swagger UI automatically  

Your Python API is now integrated and ready to use! 🐍🚀
