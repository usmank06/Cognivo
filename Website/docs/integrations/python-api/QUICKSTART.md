# Quick Start - File Processing with Python

## 🚀 Setup (5 minutes)

### 1. Install Python dependencies
```bash
cd python-api
pip install -r requirements.txt
cd ..
```

### 2. Start all servers
```bash
npm run dev
```

This starts:
- Express API (port 3001)
- Vite frontend (port 5173)
- Python FastAPI (port 8000)

### 3. Test it works
```bash
cd python-api
python test_integration.py
```

## 📝 Implementation Checklist

- [ ] **Step 1:** Uncomment pandas in `python-api/requirements.txt`
- [ ] **Step 2:** Run `pip install -r requirements.txt` in python-api folder
- [ ] **Step 3:** Edit `python-api/main.py` → function `process_csv_file()`
- [ ] **Step 4:** Add your pandas code (see IMPLEMENTATION_GUIDE.md)
- [ ] **Step 5:** Test with real CSV file via frontend
- [ ] **Step 6:** Implement `process_excel_file()` (similar to CSV)

## 📂 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `python-api/main.py` | Processing logic | 🔄 Add your code here |
| `python-api/IMPLEMENTATION_GUIDE.md` | How to implement | 📖 Read this |
| `python-api/test_integration.py` | Test script | ✅ Ready to use |
| `src/db/fileProcessor.ts` | Calls Python API | ✅ Complete |
| `src/components/SourcesPage.tsx` | UI | ✅ Complete |

## 🔧 Your Task

Edit: `python-api/main.py` line ~140

```python
async def process_csv_file(file_bytes: bytes, file_name: str):
    # Replace this with your pandas code:
    import pandas as pd
    from io import BytesIO
    
    df = pd.read_csv(BytesIO(file_bytes))
    
    # 1. Analyze df.columns and df.dtypes
    # 2. Create schema
    # 3. Generate subsets (aggregations, distributions)
    # 4. Return FileProcessingResponse
```

## 🧪 Testing

### Upload a file:
1. Go to http://localhost:5173
2. Login (or register)
3. Click "Sources" in navigation
4. Click "Upload Files"
5. Select CSV or Excel file
6. Watch progress bar
7. Status changes to "Completed"

### Check results:
- Frontend: Shows "X subsets" after completion
- MongoDB: `db.datafiles.findOne({ originalFileName: "test.csv" })`
- Logs: Check Python terminal for print statements

## 🐛 Troubleshooting

**Problem:** Python API not starting
- **Solution:** Check if port 8000 is available, run `python main.py` separately

**Problem:** Processing fails
- **Solution:** Check Python terminal for errors, verify pandas is installed

**Problem:** Progress stuck at 20%
- **Solution:** Python API might be down, check `http://localhost:8000/health`

**Problem:** "Module not found: pandas"
- **Solution:** `cd python-api && pip install pandas numpy openpyxl`

## 📚 Documentation

- **Complete Guide:** `python-api/IMPLEMENTATION_GUIDE.md`
- **Flow Diagram:** `readmes/FILE_PROCESSING_FLOW_DIAGRAM.md`
- **Integration Summary:** `readmes/FILE_PROCESSING_PYTHON_INTEGRATION.md`
- **Python API Setup:** `readmes/PYTHON_API_SETUP.md`

## 💡 Code Examples

### Example 1: Basic CSV Processing
```python
import pandas as pd
from io import BytesIO

df = pd.read_csv(BytesIO(file_bytes))

schema = FileSchema(
    columns=[
        {"name": col, "type": str(df[col].dtype), "description": f"Column {col}"}
        for col in df.columns
    ],
    rowCount=len(df),
    summary=f"Dataset from {file_name} with {len(df)} rows"
)

subsets = [
    DataSubset(
        description="Data preview",
        xAxisName="Row",
        yAxisName="Value",
        dataPoints=[{"x": i, "y": row[0]} for i, row in df.head(10).iterrows()]
    )
]

return FileProcessingResponse(success=True, schema=schema, subsets=subsets)
```

### Example 2: With Aggregation
```python
# Time series aggregation
df['date'] = pd.to_datetime(df['date'])
monthly = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()

subset = DataSubset(
    description="Monthly totals",
    xAxisName="Month",
    yAxisName="Total Amount",
    dataPoints=[{"x": str(month), "y": float(amount)} for month, amount in monthly.items()]
)
```

## ✅ Success Criteria

You're done when:
- [ ] Upload CSV file via frontend
- [ ] Processing completes (status: "Completed")
- [ ] Real data appears (not dummy data)
- [ ] Subsets are generated from your file
- [ ] MongoDB shows correct schema and subsets

## 🎯 Next Steps After Implementation

1. Add more subset types (histograms, box plots, correlations)
2. Add data validation (check for nulls, outliers)
3. Add natural language summaries (use GPT to describe data)
4. Add support for more file types (JSON, Parquet)
5. Add data cleaning options (remove duplicates, fill nulls)
6. Add export options (export processed data)

---

**Need help?** Check the full guides in the `readmes/` folder!
