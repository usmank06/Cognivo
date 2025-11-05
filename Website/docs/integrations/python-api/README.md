# Python FastAPI Server for Cognivo

## Setup

### 1. Create a Python virtual environment (recommended)

**On Windows (cmd):**
```bash
cd python-api
python -m venv venv
venv\Scripts\activate
```

**On Windows (PowerShell):**
```bash
cd python-api
python -m venv venv
venv\Scripts\Activate.ps1
```

**On Linux/Mac:**
```bash
cd python-api
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the server

The server is automatically started when you run `npm run dev` from the root directory.

Or run it manually:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- **GET /** - API info
- **GET /health** - Health check
- **POST /api/process-data** - Process data arrays
- **POST /api/analyze** - Analyze data
- **POST /api/ml/predict** - ML predictions

## Interactive Docs

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Usage from TypeScript

```typescript
// Example: Call Python API from your TypeScript code
const response = await fetch('http://localhost:8000/api/process-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
    operation: 'normalize'
  })
});

const result = await response.json();
console.log(result);
```

## Adding Python Libraries

Edit `requirements.txt` and uncomment or add libraries you need:

```bash
pip install pandas numpy scikit-learn
```

Then import them in `main.py`:

```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
```
