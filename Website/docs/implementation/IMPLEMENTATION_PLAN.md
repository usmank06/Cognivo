# File Processing with Claude AI - Implementation Plan

## Date: November 2, 2025

---

## 🎯 OBJECTIVE

Implement AI-powered file processing using Claude (Anthropic) to analyze CSV/Excel files and automatically generate multiple intelligent data subsets for visualization.

---

## 📋 REQUIREMENTS

### 1. **Data Processing Flow**
```
User Uploads File (CSV/Excel)
    ↓
Backend stores in GridFS
    ↓
Convert entire file to JSON/text
    ↓
Send full data to Claude AI
    ↓
Claude analyzes and creates intelligent subsets
    ↓
Store subsets in MongoDB
    ↓
Return processed file to frontend
```

### 2. **Subset Generation Goals**
Claude should create diverse visualizations including:
- **Time-based**: Daily, monthly, yearly aggregations
- **Categorical**: Grouped by categories/dimensions
- **Statistical**: Totals, averages, distributions
- **Transformations**: Log scale, percentages, ratios
- **Correlations**: Multi-variable relationships
- **Trends**: Moving averages, growth rates
- **Comparisons**: Year-over-year, period comparisons

### 3. **Chart Types to Support**
Based on the provided chart documentation:
- Line charts (trend data)
- Bar charts (comparisons)
- Area charts (cumulative data)
- Pie charts (distributions)
- Scatter plots (correlations)
- Radar charts (multi-dimensional)
- Funnel charts (conversion flows)
- Composed charts (multi-metric)

---

## 🏗️ ARCHITECTURE CHANGES

### Current Flow (Dummy Data):
```
Upload → GridFS → Python API (dummy data) → MongoDB
```

### New Flow (AI-Powered):
```
Upload → GridFS → Read Full File → Claude AI → Intelligent Subsets → MongoDB
```

---

## 📝 IMPLEMENTATION STEPS

### Phase 1: Python API Enhancement ✅

**File**: `python-api/main.py`

1. **Add pandas for file reading**
   - Parse CSV files completely
   - Parse Excel files (all sheets)
   - Convert to JSON format for Claude

2. **Create Claude AI subset generator**
   - Build comprehensive system prompt
   - Define schema for subset output
   - Handle streaming responses (optional)
   - Parse Claude's JSON response

3. **Update `/api/process-file` endpoint**
   - Remove dummy data
   - Read actual file content
   - Send to Claude with instructions
   - Return real subsets

### Phase 2: Claude Prompt Engineering ✅

**System Prompt Structure**:
```
You are a data visualization expert analyzing a dataset.

INPUT:
- File name: {filename}
- File type: {type}
- Data shape: {rows} rows × {columns} columns
- Column info: {column_names_and_types}
- Sample data: {first_10_rows}
- Full data: {complete_dataset}

TASK:
Generate 5-15 diverse data subsets optimized for different chart types.

REQUIREMENTS:
1. Identify patterns, trends, temporal data
2. Group by meaningful categories
3. Calculate aggregations (sum, avg, count)
4. Apply transformations (log, %, growth)
5. Create comparison views
6. Ensure variety of chart types

OUTPUT FORMAT:
{
  "file_schema": {
    "columns": [...],
    "rowCount": N,
    "summary": "Brief overview"
  },
  "subsets": [
    {
      "description": "Clear description of what this shows",
      "xAxisName": "X-axis label",
      "xAxisDescription": "What X represents",
      "yAxisName": "Y-axis label", 
      "yAxisDescription": "What Y represents",
      "dataPoints": [{"x": ..., "y": ...}]
    }
  ]
}
```

### Phase 3: Data Preparation ✅

**Helper Functions**:
```python
def read_csv_file(buffer: bytes) -> pd.DataFrame
def read_excel_file(buffer: bytes) -> Dict[str, pd.DataFrame]
def dataframe_to_json(df: pd.DataFrame) -> str
def analyze_columns(df: pd.DataFrame) -> dict
def prepare_claude_payload(df: pd.DataFrame, filename: str) -> dict
```

### Phase 4: Error Handling ✅

**Edge Cases**:
- Large files (>10MB) → Sample intelligently
- Multiple Excel sheets → Process all or combine
- Missing values → Handle gracefully
- Mixed data types → Convert appropriately
- Claude API errors → Retry with fallback
- Invalid JSON response → Request retry

### Phase 5: Testing Strategy ✅

**Test Files**:
1. Simple CSV (100 rows, 3 columns)
2. Complex CSV (10k rows, 20 columns)
3. Excel with multiple sheets
4. Time-series data
5. Categorical data
6. Mixed data types

---

## 🔧 TECHNICAL DETAILS

### Environment Variables

**`.env` in `python-api/`**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Dependencies to Add

**`requirements.txt`**:
```
# Already installed:
anthropic==0.39.0
python-dotenv==1.0.0

# Need to uncomment/add:
pandas==2.2.3
numpy==2.1.3
openpyxl==3.1.5  # For Excel
python-dateutil==2.9.0
```

### Claude Model Configuration

```python
model = "claude-sonnet-4-20250514"  # Latest Sonnet
max_tokens = 8000  # For large responses
temperature = 0.3  # Low for consistent output
```

---

## 📊 SUBSET EXAMPLES

### Example 1: Time Series Data
```json
{
  "description": "Daily sales trend over time",
  "xAxisName": "Date",
  "xAxisDescription": "Transaction date",
  "yAxisName": "Total Sales",
  "yAxisDescription": "Sum of all sales in USD",
  "dataPoints": [
    {"x": "2024-01-01", "y": 15420},
    {"x": "2024-01-02", "y": 16890}
  ]
}
```

### Example 2: Category Breakdown
```json
{
  "description": "Sales by product category",
  "xAxisName": "Category",
  "xAxisDescription": "Product categories",
  "yAxisName": "Revenue",
  "yAxisDescription": "Total revenue per category",
  "dataPoints": [
    {"x": "Electronics", "y": 125000},
    {"x": "Clothing", "y": 89000}
  ]
}
```

### Example 3: Monthly Aggregation
```json
{
  "description": "Monthly total transactions",
  "xAxisName": "Month",
  "xAxisDescription": "Month and year",
  "yAxisName": "Transaction Count",
  "yAxisDescription": "Number of transactions",
  "dataPoints": [
    {"x": "Jan 2024", "y": 1240},
    {"x": "Feb 2024", "y": 1680}
  ]
}
```

---

## 🎨 VISUALIZATION MAPPING

Claude should suggest appropriate chart types:

| Data Pattern | Chart Type | Use Case |
|--------------|-----------|----------|
| Time series | Line/Area | Trends over time |
| Categories | Bar/Pie | Comparisons |
| Distribution | Bar/Histogram | Frequency |
| Correlation | Scatter | Relationships |
| Part-to-whole | Pie/Donut | Proportions |
| Multi-dimensional | Radar | Multi-metric comparison |
| Flow/Funnel | Sankey/Funnel | Process stages |

---

## ⚡ OPTIMIZATION STRATEGIES

### 1. File Size Handling
```python
MAX_FILE_SIZE = 50_000_000  # 50MB
MAX_ROWS_FOR_CLAUDE = 5000  # Send sample if larger

if len(df) > MAX_ROWS_FOR_CLAUDE:
    # Send schema + sample + statistics
    sample = df.sample(n=1000)
    stats = df.describe()
    # Ask Claude to generate subsets based on structure
else:
    # Send complete data
    full_data = df.to_dict(orient='records')
```

### 2. Multi-Sheet Excel
```python
sheets = pd.read_excel(buffer, sheet_name=None)
if len(sheets) > 1:
    # Option A: Process each sheet separately
    # Option B: Combine related sheets
    # Option C: Let Claude decide based on sheet names
```

### 3. Caching (Future Enhancement)
```python
# Cache Claude responses for identical files
file_hash = hashlib.sha256(buffer).hexdigest()
if file_hash in cache:
    return cache[file_hash]
```

---

## 🚨 ERROR SCENARIOS

### Scenario 1: Claude Returns Invalid JSON
```python
try:
    result = json.loads(claude_response)
except json.JSONDecodeError:
    # Retry with explicit JSON format request
    # Or use fallback basic subsets
```

### Scenario 2: API Rate Limit
```python
try:
    response = await anthropic_client.messages.create(...)
except anthropic.RateLimitError:
    # Wait and retry
    await asyncio.sleep(2)
    # Or queue for later processing
```

### Scenario 3: Malformed Data
```python
if df.empty or df.shape[0] < 3:
    return error_response("File too small to analyze")

if df.isnull().sum().sum() > df.size * 0.5:
    return error_response("Too many missing values")
```

---

## 📈 SUCCESS METRICS

1. ✅ File successfully parsed (pandas)
2. ✅ Claude returns valid JSON
3. ✅ Minimum 3 subsets generated
4. ✅ Subsets cover different chart types
5. ✅ Processing completes in <30 seconds
6. ✅ Subsets are actually useful/meaningful

---

## 🔄 ROLLBACK PLAN

If Claude integration fails:
1. Keep existing dummy data as fallback
2. Use pandas for basic statistics
3. Generate simple subsets programmatically:
   - First 100 rows
   - Column distributions
   - Basic aggregations

---

## 📚 REFERENCE LINKS

- Claude Messages API: https://docs.anthropic.com/en/api/messages
- Pandas DataFrame: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html
- Anthropic Python SDK: https://github.com/anthropics/anthropic-sdk-python
- Chart Types Documentation: (provided in user request)

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Setup env vars | 5 min | ⏳ TODO |
| Install pandas | 2 min | ⏳ TODO |
| Implement file readers | 30 min | ⏳ TODO |
| Design Claude prompt | 45 min | ⏳ TODO |
| Implement Claude integration | 60 min | ⏳ TODO |
| Testing & refinement | 90 min | ⏳ TODO |
| **TOTAL** | **~3.5 hours** | |

---

## 🎯 NEXT IMMEDIATE STEPS

1. ✅ Review and approve this plan
2. ⏳ Set up ANTHROPIC_API_KEY in .env
3. ⏳ Uncomment pandas dependencies
4. ⏳ Implement `process_csv_file()` with Claude
5. ⏳ Test with sample CSV file
6. ⏳ Implement `process_excel_file()` with Claude
7. ⏳ End-to-end testing
8. ✅ Deploy and celebrate! 🎉

---

## 💡 FUTURE ENHANCEMENTS

- **Progressive subsets**: Generate 3 fast, then 10 more in background
- **User preferences**: Let users request specific chart types
- **Subset regeneration**: "Make this a line chart instead"
- **Data transformations**: Let Claude suggest derived columns
- **Anomaly detection**: Flag unusual patterns
- **Predictive subsets**: Forecast future values

---

*Ready to implement! Let's make file processing intelligent! 🚀*
