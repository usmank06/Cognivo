# Python API - Endpoint Reference

## 🎯 Essential Endpoints (Only 2 needed!)

---

## 1. GET `/health`

### Purpose
Check if the Python API server is running and responsive.

### Called By
- Frontend health checks
- Express API to verify Python is available
- Test scripts

### Request
```http
GET http://localhost:8000/health
```

No parameters needed.

### Response
```json
{
  "status": "healthy",
  "message": "Python API is running!"
}
```

### Example Usage
```typescript
// TypeScript
const response = await fetch('http://localhost:8000/health');
const data = await response.json();
console.log(data.status); // "healthy"
```

```python
# Python
import requests
response = requests.get('http://localhost:8000/health')
print(response.json())  # {'status': 'healthy', ...}
```

---

## 2. POST `/api/process-file`

### Purpose
**THE MAIN ENDPOINT** - Process uploaded CSV/Excel files and return schema + data subsets.

### Called By
- Express API (`fileProcessor.ts`) after user uploads a file

### Request
```http
POST http://localhost:8000/api/process-file
Content-Type: application/json
```

**Body:**
```json
{
  "fileBuffer": "base64EncodedFileContent...",
  "fileName": "sales_data.csv",
  "fileType": "text/csv"
}
```

**Request Fields:**
- `fileBuffer` (string, required): Base64-encoded file content
- `fileName` (string, required): Original filename (e.g., "data.csv")
- `fileType` (string, required): MIME type (e.g., "text/csv", "application/vnd.ms-excel")

### Response - Success
```json
{
  "success": true,
  "schema": {
    "columns": [
      {
        "name": "date",
        "type": "date",
        "description": "Transaction date from 2024-01-01 to 2024-12-31"
      },
      {
        "name": "amount",
        "type": "number",
        "description": "Min: 10.50, Max: 999.99, Mean: 156.32"
      },
      {
        "name": "category",
        "type": "string",
        "description": "5 unique values"
      }
    ],
    "rowCount": 1500,
    "summary": "Dataset contains 1,500 rows and 3 columns from sales_data.csv"
  },
  "subsets": [
    {
      "description": "Total purchases over time",
      "xAxisName": "Month",
      "xAxisDescription": "Transaction date (monthly aggregation)",
      "yAxisName": "Total Amount",
      "yAxisDescription": "Sum of all purchase amounts",
      "dataPoints": [
        { "x": "2024-01", "y": 45000 },
        { "x": "2024-02", "y": 52000 },
        { "x": "2024-03", "y": 48000 }
      ]
    },
    {
      "description": "Purchase distribution by category",
      "xAxisName": "Category",
      "xAxisDescription": "Purchase categories",
      "yAxisName": "Count",
      "yAxisDescription": "Number of purchases in each category",
      "dataPoints": [
        { "x": "Electronics", "y": 250 },
        { "x": "Groceries", "y": 380 },
        { "x": "Clothing", "y": 180 }
      ]
    }
  ]
}
```

### Response - Error
```json
{
  "success": false,
  "error": "Failed to parse CSV: unexpected format"
}
```

### Response Schema Details

#### `schema` Object
**Purpose:** Describe the structure of the uploaded file

- `columns` (array): List of all columns in the file
  - `name` (string): Column name (e.g., "date", "amount")
  - `type` (string): Data type - "number", "string", "date", "boolean"
  - `description` (string): Human-readable description (e.g., "Min: 10, Max: 100, Mean: 55")

- `rowCount` (number): Total number of rows in the file

- `summary` (string): Natural language summary of the dataset

#### `subsets` Array
**Purpose:** Pre-computed data visualizations/aggregations

Each subset represents a meaningful view of the data that can be visualized:

- `description` (string): What this subset shows (e.g., "Sales over time")
- `xAxisName` (string): Name for X-axis (e.g., "Month", "Category")
- `xAxisDescription` (string): Longer description of X-axis
- `yAxisName` (string): Name for Y-axis (e.g., "Total Sales", "Count")
- `yAxisDescription` (string): Longer description of Y-axis
- `dataPoints` (array): The actual data
  - Each point: `{ "x": value, "y": value }`
  - X can be: string (categories), number, date string (ISO format)
  - Y is typically: number

### What To Return In Subsets

Generate interesting views of the data:

1. **Time Series** (if date column exists)
   - Aggregate by day/week/month
   - Show trends over time
   - Example: Total sales per month

2. **Categorical Distribution**
   - Count items per category
   - Example: Products by type

3. **Numeric Correlations**
   - Scatter plot of two numeric columns
   - Example: Price vs Quantity

4. **Summary Statistics**
   - Average/sum by group
   - Example: Average price per category

5. **Top N Rankings**
   - Top 10 products by sales
   - Top 5 categories by count

### Example Processing Logic

```python
import pandas as pd
from io import BytesIO

# Decode and read file
file_bytes = base64.b64decode(request.fileBuffer)
df = pd.read_csv(BytesIO(file_bytes))

# Create schema
columns = []
for col in df.columns:
    if pd.api.types.is_numeric_dtype(df[col]):
        col_type = "number"
        desc = f"Min: {df[col].min()}, Max: {df[col].max()}, Mean: {df[col].mean():.2f}"
    else:
        col_type = "string"
        desc = f"{df[col].nunique()} unique values"
    
    columns.append({
        "name": col,
        "type": col_type,
        "description": desc
    })

schema = {
    "columns": columns,
    "rowCount": len(df),
    "summary": f"Dataset contains {len(df)} rows and {len(df.columns)} columns"
}

# Create subsets
subsets = []

# Example: Category distribution
if 'category' in df.columns:
    category_counts = df['category'].value_counts()
    subsets.append({
        "description": "Distribution by category",
        "xAxisName": "Category",
        "xAxisDescription": "Product categories",
        "yAxisName": "Count",
        "yAxisDescription": "Number of items",
        "dataPoints": [
            {"x": cat, "y": int(count)} 
            for cat, count in category_counts.items()
        ]
    })

# Example: Time series
if 'date' in df.columns:
    df['date'] = pd.to_datetime(df['date'])
    monthly = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
    subsets.append({
        "description": "Total amount over time",
        "xAxisName": "Month",
        "xAxisDescription": "Time period",
        "yAxisName": "Total Amount",
        "yAxisDescription": "Sum of amounts",
        "dataPoints": [
            {"x": str(month), "y": float(amount)} 
            for month, amount in monthly.items()
        ]
    })

return {
    "success": True,
    "schema": schema,
    "subsets": subsets
}
```

---

## 🔄 Complete Data Flow

```
1. User uploads CSV file in frontend
   ↓
2. Express receives file, stores in MongoDB
   ↓
3. Express calls Python API:
   POST /api/process-file
   Body: { fileBuffer: "base64...", fileName: "data.csv", fileType: "text/csv" }
   ↓
4. Python decodes base64 → reads CSV → analyzes
   ↓
5. Python returns: { success: true, schema: {...}, subsets: [...] }
   ↓
6. Express saves schema + subsets to MongoDB
   ↓
7. Frontend shows: "Completed, 3 subsets generated"
```

---

## 📝 Summary

### You Only Need 2 Endpoints:

1. **GET `/health`** - Health check (already complete, no changes needed)

2. **POST `/api/process-file`** - File processing (add your pandas logic here)
   - **Input:** Base64 file + metadata
   - **Output:** Schema + subsets
   - **Currently:** Returns dummy data
   - **You add:** Real pandas analysis

### What Express Expects:

Express (`fileProcessor.ts`) calls Python and expects:

```typescript
{
  success: boolean,
  schema?: {
    columns: Array<{ name: string, type: string, description?: string }>,
    rowCount: number,
    summary: string
  },
  subsets?: Array<{
    description: string,
    xAxisName: string,
    xAxisDescription: string,
    yAxisName: string,
    yAxisDescription: string,
    dataPoints: Array<{ x: any, y: any }>
  }>,
  error?: string
}
```

### What Gets Stored in MongoDB:

Everything you return in `schema` and `subsets` gets saved to the database and can be viewed by the user later.

---

## 🧪 Testing

### Test health endpoint:
```bash
curl http://localhost:8000/health
```

### Test file processing:
```bash
cd python-api
python test_integration.py
```

### Test via frontend:
1. Upload a CSV file
2. Check MongoDB: `db.datafiles.findOne()`
3. See your schema and subsets stored there

---

## 🎯 Your Task

**Location:** `python-api/main.py` → function `process_csv_file()`

Replace the dummy data with real pandas analysis:
1. Read the file with pandas
2. Analyze columns (types, stats, unique values)
3. Create schema object
4. Generate 2-5 interesting subsets
5. Return the data

**See:** `IMPLEMENTATION_GUIDE.md` for complete code examples!
