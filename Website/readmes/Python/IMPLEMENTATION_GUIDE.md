# File Processing Implementation Guide

## Overview

The file upload and processing system is now fully integrated with Python! Here's how it works:

### Flow:
1. **User uploads file** → Frontend (SourcesPage.tsx)
2. **File sent to Express** → API Server (port 3001)
3. **Express stores in MongoDB** → Creates file record with status "processing"
4. **Express sends to Python API** → Background processing (fileProcessor.ts)
5. **Python processes file** → Parses, analyzes, creates schema & subsets (main.py)
6. **Python returns results** → Back to Express
7. **Express updates MongoDB** → Marks as "completed" with results
8. **Frontend polls for updates** → Shows progress & results

## Current State

✅ **Infrastructure is complete!**
- File upload to Express works
- Express → Python API communication works
- Progress tracking works
- Database storage works
- Frontend polling works

🔄 **Processing logic returns dummy data**
- You need to implement the actual CSV/Excel parsing
- You need to implement the actual schema detection
- You need to implement the actual subset generation

## Where to Add Your Logic

### Location: `python-api/main.py`

Look for these two functions:

```python
async def process_csv_file(file_bytes: bytes, file_name: str)
async def process_excel_file(file_bytes: bytes, file_name: str)
```

## Step-by-Step Implementation

### Step 1: Install Python Libraries

Edit `python-api/requirements.txt` and uncomment:

```txt
pandas==2.2.3
numpy==2.1.3
openpyxl==3.1.5  # For Excel files
```

Then install:

```bash
cd python-api
pip install -r requirements.txt
```

### Step 2: Implement CSV Processing

Edit `main.py` - function `process_csv_file`:

```python
async def process_csv_file(file_bytes: bytes, file_name: str) -> FileProcessingResponse:
    try:
        import pandas as pd
        import numpy as np
        from io import BytesIO
        
        # Read CSV file
        df = pd.read_csv(BytesIO(file_bytes))
        
        # ===================================
        # STEP 2.1: Create Schema
        # ===================================
        columns = []
        for col_name in df.columns:
            col_data = df[col_name]
            
            # Detect type
            if pd.api.types.is_numeric_dtype(col_data):
                col_type = "number"
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                col_type = "date"
            else:
                col_type = "string"
            
            # Generate description
            if col_type == "number":
                description = f"Min: {col_data.min():.2f}, Max: {col_data.max():.2f}, Mean: {col_data.mean():.2f}"
            elif col_type == "string":
                unique_count = col_data.nunique()
                description = f"{unique_count} unique values"
            else:
                description = f"{col_type} column"
            
            columns.append({
                "name": col_name,
                "type": col_type,
                "description": description
            })
        
        schema = FileSchema(
            columns=columns,
            rowCount=len(df),
            summary=f"Dataset contains {len(df)} rows and {len(df.columns)} columns from {file_name}"
        )
        
        # ===================================
        # STEP 2.2: Generate Subsets
        # ===================================
        subsets = []
        
        # Find numeric columns for analysis
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Find datetime columns
        date_cols = []
        for col in df.columns:
            try:
                pd.to_datetime(df[col])
                date_cols.append(col)
            except:
                pass
        
        # Find categorical columns (strings with < 20 unique values)
        categorical_cols = []
        for col in df.select_dtypes(include=['object']).columns:
            if df[col].nunique() < 20:
                categorical_cols.append(col)
        
        # SUBSET 1: Time series if date column exists
        if len(date_cols) > 0 and len(numeric_cols) > 0:
            date_col = date_cols[0]
            numeric_col = numeric_cols[0]
            
            # Convert to datetime
            df_time = df.copy()
            df_time[date_col] = pd.to_datetime(df_time[date_col])
            df_time = df_time.sort_values(date_col)
            
            # Aggregate by month
            df_time['month'] = df_time[date_col].dt.to_period('M')
            monthly = df_time.groupby('month')[numeric_col].sum().reset_index()
            
            subsets.append(DataSubset(
                description=f"{numeric_col} over time",
                xAxisName="Month",
                xAxisDescription="Time period (monthly)",
                yAxisName=numeric_col,
                yAxisDescription=f"Total {numeric_col}",
                dataPoints=[
                    {"x": str(row['month']), "y": float(row[numeric_col])}
                    for _, row in monthly.iterrows()
                ]
            ))
        
        # SUBSET 2: Category distribution
        if len(categorical_cols) > 0:
            cat_col = categorical_cols[0]
            distribution = df[cat_col].value_counts().head(10)
            
            subsets.append(DataSubset(
                description=f"Distribution by {cat_col}",
                xAxisName=cat_col,
                xAxisDescription=f"Categories of {cat_col}",
                yAxisName="Count",
                yAxisDescription="Number of occurrences",
                dataPoints=[
                    {"x": str(idx), "y": int(val)}
                    for idx, val in distribution.items()
                ]
            ))
        
        # SUBSET 3: Numeric correlations
        if len(numeric_cols) >= 2:
            col1, col2 = numeric_cols[0], numeric_cols[1]
            
            # Sample if too many rows
            sample_df = df if len(df) < 1000 else df.sample(1000)
            
            subsets.append(DataSubset(
                description=f"{col1} vs {col2}",
                xAxisName=col1,
                xAxisDescription=f"Values of {col1}",
                yAxisName=col2,
                yAxisDescription=f"Values of {col2}",
                dataPoints=[
                    {"x": float(row[col1]), "y": float(row[col2])}
                    for _, row in sample_df[[col1, col2]].dropna().iterrows()
                ]
            ))
        
        # SUBSET 4: Summary statistics for numeric columns
        if len(numeric_cols) > 0:
            stats_data = []
            for col in numeric_cols[:5]:  # Top 5 numeric columns
                stats_data.append({
                    "x": col,
                    "y": float(df[col].mean())
                })
            
            subsets.append(DataSubset(
                description="Average values by column",
                xAxisName="Column",
                xAxisDescription="Numeric columns",
                yAxisName="Average",
                yAxisDescription="Mean value",
                dataPoints=stats_data
            ))
        
        return FileProcessingResponse(
            success=True,
            schema=schema,
            subsets=subsets
        )
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
```

### Step 3: Implement Excel Processing

Edit `main.py` - function `process_excel_file`:

```python
async def process_excel_file(file_bytes: bytes, file_name: str) -> FileProcessingResponse:
    try:
        import pandas as pd
        from io import BytesIO
        
        # Read Excel file (first sheet)
        df = pd.read_excel(BytesIO(file_bytes), sheet_name=0)
        
        # Use same logic as CSV processing
        # (You can extract the common logic into a separate function)
        
        # For now, use the CSV processing function
        # Convert to CSV in memory and reuse logic
        csv_buffer = BytesIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        # Call CSV processing
        return await process_csv_file(csv_buffer.read(), file_name)
        
    except Exception as e:
        print(f"Error processing Excel: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
```

### Step 4: Add Requirements

Add to `python-api/requirements.txt`:

```txt
pandas==2.2.3
numpy==2.1.3
openpyxl==3.1.5
python-dateutil==2.9.0
```

## Testing

### 1. Start all servers:

```bash
npm run dev
```

This starts:
- Express (port 3001)
- Vite (port 5173)
- Python API (port 8000)

### 2. Upload a test file:

- Create a simple CSV file:
  ```csv
  date,amount,category
  2024-01-01,100,Food
  2024-01-02,50,Transport
  2024-01-03,200,Entertainment
  ```

- Go to http://localhost:5173
- Login
- Go to "Sources" page
- Upload the CSV

### 3. Watch the processing:

- You'll see progress updates
- Processing stages will update
- When complete, file status shows "Completed"
- The subsets are stored in MongoDB

### 4. Check the results:

You can view the processed data in MongoDB:

```javascript
// In MongoDB
db.datafiles.findOne({ originalFileName: "test.csv" })
```

You'll see:
- `fileSchema` - detected columns and types
- `subsets` - array of generated visualizations

## Advanced Features to Add

### 1. More Intelligent Subset Generation

```python
# Detect outliers
def detect_outliers(df, col):
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)]
    return outliers

# Detect trends
def detect_trend(df, date_col, value_col):
    from scipy import stats
    x = pd.to_numeric(pd.to_datetime(df[date_col]))
    y = df[value_col]
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    return {
        "trend": "increasing" if slope > 0 else "decreasing",
        "strength": abs(r_value)
    }
```

### 2. Smart Column Detection

```python
# Detect column types more intelligently
def detect_column_type(series):
    # Email
    if series.astype(str).str.contains('@').mean() > 0.8:
        return "email"
    
    # Phone
    if series.astype(str).str.match(r'^\d{3}-\d{3}-\d{4}$').mean() > 0.8:
        return "phone"
    
    # Currency
    if series.astype(str).str.match(r'^\$[\d,]+\.?\d*$').mean() > 0.8:
        return "currency"
    
    # Default detection
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    return "string"
```

### 3. Natural Language Descriptions

```python
def generate_description(df, col):
    if pd.api.types.is_numeric_dtype(df[col]):
        mean = df[col].mean()
        median = df[col].median()
        return f"Numeric column with average {mean:.2f} and median {median:.2f}"
    
    unique = df[col].nunique()
    total = len(df)
    return f"Categorical column with {unique} unique values out of {total} total"
```

## Troubleshooting

### Python API not responding:

```bash
# Check if it's running
curl http://localhost:8000/health

# Check logs in terminal
# You should see FastAPI startup messages
```

### Processing fails:

- Check Python terminal for error messages
- Check Express terminal for connection errors
- Verify pandas is installed: `pip list | grep pandas`

### File not being processed:

- Check MongoDB - is the file record created?
- Check status field - is it stuck on "uploading"?
- Check error message in MongoDB

## Next Steps

1. **Implement the CSV/Excel processing** using the code above
2. **Test with real files** - try various CSV and Excel files
3. **Add more subset types** - box plots, histograms, heatmaps
4. **Add error handling** - handle malformed files gracefully
5. **Add file validation** - check file size, format before processing
6. **Add caching** - cache processed results for faster re-access

## Summary

✅ Infrastructure complete - files flow from frontend → Express → Python → MongoDB  
✅ Progress tracking works - frontend shows real-time updates  
✅ Error handling works - failures are caught and displayed  
🔄 Processing logic needs implementation - add your pandas/numpy code  

The system is ready for you to add the actual data processing logic! All the plumbing is connected. Just fill in the processing functions with your pandas/numpy/sklearn code.
