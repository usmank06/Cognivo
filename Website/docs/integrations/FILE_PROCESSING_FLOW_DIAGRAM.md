# File Processing Flow - Visual Guide

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS FILE                        │
│                      (SourcesPage.tsx)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ FormData (multipart/form-data)
                             │ - files: File[]
                             │ - username: string
                             │ - userId: string
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS API SERVER                         │
│                      (api-server.js)                            │
│                                                                 │
│  POST /api/files/upload                                         │
│    ↓                                                            │
│  uploadFile() → fileManager.ts                                 │
│    ↓                                                            │
│  1. Create MongoDB record (status: "uploading")                │
│  2. Start background processing (non-blocking)                 │
│  3. Return fileId to frontend                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Background async
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKGROUND PROCESSOR                           │
│                  (fileProcessor.ts)                             │
│                                                                 │
│  processFileInBackground(fileId, buffer, name, type)           │
│    ↓                                                            │
│  Update DB: "Preparing file..." (10%)                          │
│    ↓                                                            │
│  Convert buffer to Base64                                      │
│    ↓                                                            │
│  Update DB: "Sending to processing engine..." (20%)            │
│    ↓                                                            │
│  Call Python API ────────────────────────┐                     │
└─────────────────────────────────────────┼─────────────────────┘
                                          │
                                          │ HTTP POST
                                          │ {
                                          │   fileBuffer: base64,
                                          │   fileName: string,
                                          │   fileType: string
                                          │ }
                                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PYTHON FASTAPI                             │
│                      (main.py)                                  │
│                                                                 │
│  POST /api/process-file                                         │
│    ↓                                                            │
│  Decode base64 → bytes                                         │
│    ↓                                                            │
│  if CSV:                                                        │
│    process_csv_file(bytes, name)                               │
│      ↓                                                          │
│      🔴 YOUR LOGIC HERE 🔴                                      │
│      - Read CSV with pandas                                    │
│      - Analyze columns                                         │
│      - Detect types                                            │
│      - Generate schema                                         │
│      - Create subsets                                          │
│    ↓                                                            │
│  elif Excel:                                                    │
│    process_excel_file(bytes, name)                             │
│      ↓                                                          │
│      🔴 YOUR LOGIC HERE 🔴                                      │
│      - Read Excel with pandas                                  │
│      - Same analysis as CSV                                    │
│    ↓                                                            │
│  Return JSON:                                                   │
│  {                                                              │
│    success: true,                                              │
│    schema: { columns, rowCount, summary },                     │
│    subsets: [ { description, xAxis, yAxis, dataPoints } ]     │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Response (JSON)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKGROUND PROCESSOR                           │
│                  (fileProcessor.ts)                             │
│                                                                 │
│  Receive Python response                                       │
│    ↓                                                            │
│  Update DB: "Saving results..." (90%)                          │
│    ↓                                                            │
│  completeProcessing(fileId, result)                            │
│    → Save schema to MongoDB                                    │
│    → Save subsets to MongoDB                                   │
│    → Update status: "completed" (100%)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Database updated
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         MONGODB                                 │
│                      (datafiles collection)                     │
│                                                                 │
│  Document structure:                                            │
│  {                                                              │
│    _id: ObjectId,                                              │
│    username: "user123",                                        │
│    originalFileName: "sales.csv",                              │
│    status: "completed",  ◄── Updated                           │
│    processingProgress: 100,  ◄── Updated                       │
│    fileSchema: {  ◄── NEW                                      │
│      columns: [...],                                           │
│      rowCount: 1500,                                           │
│      summary: "..."                                            │
│    },                                                           │
│    subsets: [  ◄── NEW                                         │
│      {                                                          │
│        description: "...",                                     │
│        xAxisName: "...",                                       │
│        yAxisName: "...",                                       │
│        dataPoints: [{x, y}, ...]                               │
│      }                                                          │
│    ]                                                            │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Frontend polls every 2s
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                      (SourcesPage.tsx)                          │
│                                                                 │
│  useEffect(() => {                                              │
│    const interval = setInterval(() => {                        │
│      loadFiles()  // GET /api/files/:username                  │
│    }, 2000)                                                     │
│  })                                                             │
│    ↓                                                            │
│  Render UI:                                                     │
│    - Progress bar (0% → 100%)                                  │
│    - Status badge: "Processing" → "Completed"                  │
│    - Processing stage: "Analyzing..." → "Completed"            │
│    - Subset count: "3 subsets"                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Points

### 1. **Non-Blocking Processing**
- File upload returns immediately
- Processing happens in background
- User can navigate away
- Frontend polls for updates

### 2. **Progress Updates**
- Stage 1: "Preparing file..." (10%)
- Stage 2: "Sending to processing engine..." (20%)
- Stage 3: "Analyzing file structure..." (40%)
- Stage 4: "Saving results..." (90%)
- Stage 5: "Completed" (100%)

### 3. **Error Handling**
```
If Python API fails:
  → Express catches error
  → Updates DB: status = "error"
  → Sets errorMessage
  → Frontend shows error badge
```

### 4. **Data Storage**
Everything stored in MongoDB:
- Original file metadata
- Processing status
- Schema (columns, types, descriptions)
- Subsets (x/y data for charts)

## 📊 Example Data Flow

### Input: User uploads `sales.csv`
```csv
date,amount,category
2024-01-01,100.50,Food
2024-01-02,50.25,Transport
2024-01-03,200.00,Entertainment
```

### Processing: Python analyzes
```python
df = pd.read_csv(...)
# Detect: 3 columns, 3 rows
# Types: date (string/date), amount (number), category (string)
# Generate subsets: time series, category distribution
```

### Output: Stored in MongoDB
```javascript
{
  fileSchema: {
    columns: [
      { name: "date", type: "date", description: "From 2024-01-01 to 2024-01-03" },
      { name: "amount", type: "number", description: "Min: 50.25, Max: 200.00" },
      { name: "category", type: "string", description: "3 unique values" }
    ],
    rowCount: 3,
    summary: "Dataset contains 3 rows and 3 columns from sales.csv"
  },
  subsets: [
    {
      description: "Total amount by category",
      xAxisName: "Category",
      yAxisName: "Total Amount",
      dataPoints: [
        { x: "Food", y: 100.50 },
        { x: "Transport", y: 50.25 },
        { x: "Entertainment", y: 200.00 }
      ]
    }
  ]
}
```

### Display: Frontend shows
- ✅ Status: Completed
- 📊 3 rows, 3 columns
- 📈 1 subset generated
- 💾 350 bytes

## 🔧 Where to Add Your Code

### Location: `python-api/main.py`

Find these functions:
```python
async def process_csv_file(file_bytes: bytes, file_name: str):
    # 🔴 IMPLEMENT HERE
    pass

async def process_excel_file(file_bytes: bytes, file_name: str):
    # 🔴 IMPLEMENT HERE
    pass
```

### What to return:
```python
return FileProcessingResponse(
    success=True,
    schema=FileSchema(
        columns=[...],      # Detected columns
        rowCount=X,         # Number of rows
        summary="..."       # Natural language summary
    ),
    subsets=[
        DataSubset(
            description="...",
            xAxisName="...",
            yAxisName="...",
            dataPoints=[{x, y}, ...]
        )
    ]
)
```

## 🧪 Testing

### 1. Start servers
```bash
npm run dev
```

### 2. Test Python API
```bash
cd python-api
python test_integration.py
```

### 3. Upload via frontend
1. Go to http://localhost:5173
2. Login
3. Sources page
4. Upload file
5. Watch progress bar

### 4. Check MongoDB
```javascript
db.datafiles.findOne({ originalFileName: "sales.csv" })
```

## 🎓 What You Need to Learn

### If you know Python:
- ✅ You're ready! Just use pandas/numpy
- Read: `python-api/IMPLEMENTATION_GUIDE.md`
- Copy the code examples
- Test with your files

### If you don't know Python:
- Learn pandas basics (2 hours)
- `df = pd.read_csv(file)`
- `df.describe()`, `df.dtypes`, `df.groupby()`
- Copy the examples in `IMPLEMENTATION_GUIDE.md`

## 🚀 Summary

Infrastructure: ✅ **100% Complete**  
Processing Logic: 🔄 **Returns dummy data (you implement)**  
Testing Tools: ✅ **Included**  
Documentation: ✅ **Complete**  

**You just need to add pandas code to make it real!**
