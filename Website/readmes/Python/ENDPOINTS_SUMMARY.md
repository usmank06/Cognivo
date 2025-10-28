# Python API Endpoints - Simple Summary

## 🎯 Only 2 Endpoints Needed

---

## 1️⃣ GET `/health`

**What it does:** Tells you if Python API is alive

**Who calls it:** Tests, health checks

**Returns:**
```json
{
  "status": "healthy",
  "message": "Python API is running!"
}
```

**Status:** ✅ Complete, no changes needed

---

## 2️⃣ POST `/api/process-file`

**What it does:** THE MAIN ONE - Process uploaded files

**Who calls it:** Express API when user uploads a file

**Receives:**
```json
{
  "fileBuffer": "base64_encoded_file...",
  "fileName": "data.csv",
  "fileType": "text/csv"
}
```

**Must return:**
```json
{
  "success": true,
  "schema": {
    "columns": [
      {"name": "date", "type": "date", "description": "..."},
      {"name": "amount", "type": "number", "description": "Min: X, Max: Y"}
    ],
    "rowCount": 1500,
    "summary": "Dataset contains..."
  },
  "subsets": [
    {
      "description": "Sales over time",
      "xAxisName": "Month",
      "yAxisName": "Total Sales",
      "dataPoints": [
        {"x": "2024-01", "y": 45000},
        {"x": "2024-02", "y": 52000}
      ]
    }
  ]
}
```

**Status:** 🔄 Returns dummy data - YOU ADD PANDAS LOGIC HERE

---

## 📊 What You Need To Return

### Schema (File Structure)
Tell us about the file:
- **columns**: What columns exist, their types, basic stats
- **rowCount**: How many rows
- **summary**: One sentence describing the data

### Subsets (Data Views)
Create 2-5 interesting visualizations:
- Time series (if dates exist)
- Category distributions  
- Numeric correlations
- Top N rankings
- Any other interesting patterns

Each subset has:
- **description**: "What am I showing?"
- **xAxisName/yAxisName**: Axis labels
- **dataPoints**: The actual data `[{x, y}, {x, y}, ...]`

---

## 🎯 Example

**Input File (CSV):**
```csv
date,amount,category
2024-01-01,100,Food
2024-01-02,50,Transport
2024-02-01,200,Food
```

**Your Code Should Return:**
```json
{
  "success": true,
  "schema": {
    "columns": [
      {"name": "date", "type": "date", "description": "From 2024-01-01 to 2024-02-01"},
      {"name": "amount", "type": "number", "description": "Min: 50, Max: 200, Mean: 116.67"},
      {"name": "category", "type": "string", "description": "2 unique values"}
    ],
    "rowCount": 3,
    "summary": "Dataset contains 3 rows and 3 columns"
  },
  "subsets": [
    {
      "description": "Total by category",
      "xAxisName": "Category",
      "yAxisName": "Total Amount",
      "dataPoints": [
        {"x": "Food", "y": 300},
        {"x": "Transport", "y": 50}
      ]
    },
    {
      "description": "Amount over time",
      "xAxisName": "Date",
      "yAxisName": "Amount",
      "dataPoints": [
        {"x": "2024-01-01", "y": 100},
        {"x": "2024-01-02", "y": 50},
        {"x": "2024-02-01", "y": 200}
      ]
    }
  ]
}
```

---

## ✅ That's It!

Just 2 endpoints:
1. `/health` - Already done ✅
2. `/api/process-file` - Add your pandas code 🔄

Everything else is infrastructure (already built).

**Next:** See `IMPLEMENTATION_GUIDE.md` for code examples!
