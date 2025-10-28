# Quick Start: File Upload System 🚀

## What's Been Set Up

### ✅ Database Models
- `DataFile` - Stores active files with processing status
- `DeletedDataFile` - Stores soft-deleted files
- Full schema with status tracking, progress, and subsets

### ✅ Backend API (api-server.js)
- 7 new endpoints for file management
- Multer configured for multi-file uploads (50MB limit)
- Background processing system

### ✅ File Processing System
- `fileProcessor.ts` - Handles background processing
- Stages: Reading → Extracting → Schema → Subsets → Complete
- Progress tracking (0-100%)
- Error handling

### ✅ File Manager
- `fileManager.ts` - All CRUD operations
- Upload, delete, update nickname, get status
- Soft delete implementation

### ✅ Dashboard UI (SourcesPage)
- Upload multiple files
- Real-time progress tracking (polls every 2s)
- File management (rename, delete)
- Statistics cards
- Status badges with colors

---

## Testing It Now

### 1. Start the servers:
```bash
npm run dev
```

### 2. Test the flow:
1. Open http://localhost:3000
2. Login or register
3. Click "Sources" in navigation
4. Click "Upload Files"
5. Select a CSV or Excel file
6. Watch the magic happen! ✨

You'll see:
- File uploads instantly
- Processing progress bar
- Stage updates ("Reading file..." → "Extracting..." etc.)
- Status badge changes
- Completion in ~3 seconds with dummy data

---

## Your Job: Implement the Processing Logic

### The 3 functions you need to fill in:

#### 1. `readFile()` - Parse the uploaded file
Location: `src/db/fileProcessor.ts` (line ~168)

```typescript
export async function readFile(fileBuffer: Buffer, fileType: string): Promise<any> {
  // TODO: Your code here
  // - Parse CSV using a CSV library
  // - Parse Excel using xlsx library
  // - Return structured data (rows, columns)
}
```

#### 2. `createSchema()` - Analyze the data structure
Location: `src/db/fileProcessor.ts` (line ~180)

```typescript
export async function createSchema(rawData: any): Promise<FileProcessingResult['schema']> {
  // TODO: Your code here
  // - Detect column types (string, number, date)
  // - Count rows
  // - Generate summary description
  // - Add column descriptions
}
```

#### 3. `generateSubsets()` - Create mini datasets
Location: `src/db/fileProcessor.ts` (line ~192)

```typescript
export async function generateSubsets(rawData: any, schema: any): Promise<IDataSubset[]> {
  // TODO: Your code here
  // - Find interesting data relationships
  // - Create time series (if date columns exist)
  // - Create category distributions
  // - Create correlations between numeric columns
  // - Each subset needs:
  //   - description
  //   - xAxisName, xAxisDescription
  //   - yAxisName, yAxisDescription
  //   - dataPoints: [{ x, y }, { x, y }, ...]
}
```

#### 4. Update `processFileInBackground()`
Location: `src/db/fileProcessor.ts` (around line 62-75)

Replace the TODO sections with your actual functions:
```typescript
// Stage 2: Extracting data
const rawData = await readFile(fileBuffer, fileType);

// Stage 3: Creating schema
const schema = await createSchema(rawData);

// Stage 4: Generating subsets
const subsets = await generateSubsets(rawData, schema);

const result = { schema, subsets };
```

Remove the `createDummyProcessingResult()` call.

---

## Current State (With Dummy Data)

Right now, the system:
- ✅ Accepts file uploads
- ✅ Stores files in MongoDB
- ✅ Runs background processing
- ✅ Shows progress updates
- ✅ Creates dummy schema and subsets
- ✅ Marks as completed

The dummy data shows you **exactly** what structure your real functions should return.

---

## File Structure Overview

```
src/db/
├── models/
│   └── DataFile.ts          # Database schemas
├── mongodb.ts               # Connection
├── fileProcessor.ts         # ⭐ IMPLEMENT YOUR LOGIC HERE
├── fileManager.ts           # CRUD operations (done)
└── auth.ts                  # User auth (done)

api-server.js                # API endpoints (done)

src/components/
└── SourcesPage.tsx          # Dashboard UI (done)
```

---

## Example: What Your Functions Should Do

### Example Input (CSV):
```csv
date,category,amount
2024-01-01,Electronics,299.99
2024-01-02,Groceries,45.50
2024-01-03,Electronics,599.99
```

### Example Output from `createSchema()`:
```javascript
{
  columns: [
    { name: 'date', type: 'date', description: 'Transaction date' },
    { name: 'category', type: 'string', description: 'Purchase category' },
    { name: 'amount', type: 'number', description: 'Purchase amount in USD' }
  ],
  rowCount: 3,
  summary: 'Dataset contains 3 purchase records across 2 categories...'
}
```

### Example Output from `generateSubsets()`:
```javascript
[
  {
    description: 'Total spending over time',
    xAxisName: 'Date',
    xAxisDescription: 'Transaction date',
    yAxisName: 'Amount',
    yAxisDescription: 'Total amount in USD',
    dataPoints: [
      { x: '2024-01-01', y: 299.99 },
      { x: '2024-01-02', y: 45.50 },
      { x: '2024-01-03', y: 599.99 }
    ]
  },
  {
    description: 'Spending by category',
    xAxisName: 'Category',
    xAxisDescription: 'Purchase categories',
    yAxisName: 'Total Amount',
    yAxisDescription: 'Sum of all purchases',
    dataPoints: [
      { x: 'Electronics', y: 899.98 },
      { x: 'Groceries', y: 45.50 }
    ]
  }
]
```

---

## Useful Libraries to Install

For CSV parsing:
```bash
npm install csv-parse
```

For Excel parsing:
```bash
npm install xlsx
```

For data analysis (optional):
```bash
npm install lodash
npm install date-fns
```

---

## Tips

1. **Start simple** - Get basic CSV parsing working first
2. **Use console.log** - Debug your data structure
3. **Test with small files** - Use 5-10 row CSVs initially
4. **Check the dummy data** - It shows you the exact structure needed
5. **One function at a time** - Get readFile() working, then schema, then subsets

---

## Next Steps

1. ✅ Test the current system with dummy data
2. ⏳ Install CSV/Excel parsing libraries
3. ⏳ Implement `readFile()`
4. ⏳ Implement `createSchema()`
5. ⏳ Implement `generateSubsets()`
6. ⏳ Test with real data
7. ⏳ Refine subset generation logic

---

## Questions?

Check these files:
- Full docs: `readmes/FILE_UPLOAD_SYSTEM.md`
- Processing logic: `src/db/fileProcessor.ts`
- API reference: Look at the endpoints in `api-server.js`
- UI code: `src/components/SourcesPage.tsx`

Everything is set up and working. You just need to add the actual data processing logic! 💪
