# File Upload System Documentation

## Overview
Complete file upload and management system with background processing, real-time status updates, and soft delete functionality.

## Features
- ✅ Multiple file upload (CSV, Excel)
- ✅ Background processing with progress tracking
- ✅ Real-time status updates (polling)
- ✅ File nickname/rename
- ✅ Soft delete (moves to deleted collection)
- ✅ File statistics dashboard
- ✅ Processing stages visualization

## Architecture

### Database Models
Located in: `src/db/models/DataFile.ts`

**DataFile Collection:**
```typescript
{
  userId: string
  username: string
  originalFileName: string
  nickname?: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  
  // Processing status
  status: 'uploading' | 'processing' | 'completed' | 'error'
  processingStage?: string
  processingProgress?: number (0-100)
  errorMessage?: string
  
  // Results
  fileSchema?: {
    columns: Array<{ name, type, description }>
    rowCount: number
    summary: string
  }
  
  subsets: Array<{
    description: string
    xAxisName: string
    xAxisDescription: string
    yAxisName: string
    yAxisDescription: string
    dataPoints: Array<{ x, y }>
  }>
}
```

**DeletedDataFile Collection:**
- Same structure as DataFile
- Includes `deletedAt`, `originalCreatedAt`, `originalUpdatedAt`

### Backend Processing Flow

1. **File Upload** (`src/db/fileManager.ts`)
   - User uploads file(s)
   - File saved to database with status: 'uploading'
   - Background processing starts immediately
   - Returns file ID to client

2. **Background Processing** (`src/db/fileProcessor.ts`)
   - Runs asynchronously (non-blocking)
   - Updates status through multiple stages:
     - "Reading file..." (10%)
     - "Extracting data..." (30%)
     - "Creating schema..." (50%)
     - "Generating data subsets..." (70%)
     - "Finalizing..." (95%)
     - "Completed" (100%)
   
3. **Status Updates**
   - Client polls every 2 seconds for files in 'uploading' or 'processing' state
   - Real-time progress bar updates
   - Processing stage text updates

### API Endpoints

All endpoints in `api-server.js`:

#### Upload Files
```javascript
POST /api/files/upload
Body: FormData with 'files', 'username', 'userId'
Response: { success: true, results: [...] }
```

#### Get User's Files
```javascript
GET /api/files/:username
Response: { success: true, files: [...] }
```

#### Get File Details
```javascript
GET /api/files/:username/:fileId
Response: { success: true, file: {...} }
```

#### Update File Nickname
```javascript
PATCH /api/files/:username/:fileId/nickname
Body: { nickname: string }
Response: { success: true }
```

#### Delete File
```javascript
DELETE /api/files/:username/:fileId
Response: { success: true }
```

#### Get File Status
```javascript
GET /api/files/:username/:fileId/status
Response: { success: true, status: {...} }
```

#### Get File Statistics
```javascript
GET /api/files/:username/stats/summary
Response: { success: true, stats: {...} }
```

## Frontend Dashboard

Located in: `src/components/SourcesPage.tsx`

### Features:
1. **Upload Interface**
   - Multi-file upload
   - Drag & drop support (via file input)
   - Upload progress indication

2. **File List**
   - Shows all uploaded files
   - Color-coded status badges:
     - Green: Completed
     - Blue: Processing (with spinner)
     - Yellow: Uploading
     - Red: Error
   
3. **File Management**
   - Edit nickname (inline editing)
   - Delete file (with confirmation)
   - View processing progress
   - See file metadata (size, date, subset count)

4. **Statistics Cards**
   - Total files
   - Completed files
   - Processing files
   - Total storage used

5. **Real-time Updates**
   - Auto-refreshes every 2 seconds for processing files
   - Progress bar updates
   - Stage updates

## Implementing Your Processing Logic

### Step 1: File Reading
Edit `src/db/fileProcessor.ts`, function `readFile()`:

```typescript
export async function readFile(fileBuffer: Buffer, fileType: string): Promise<any> {
  // For CSV files
  if (fileType.includes('csv')) {
    // Use a CSV parser library
    // Parse buffer into rows and columns
  }
  
  // For Excel files
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    // Use xlsx library
    // const workbook = XLSX.read(fileBuffer);
    // Extract data from sheets
  }
  
  return parsedData;
}
```

### Step 2: Schema Creation
Edit function `createSchema()`:

```typescript
export async function createSchema(rawData: any): Promise<FileProcessingResult['schema']> {
  // Analyze columns
  const columns = rawData.columns.map(col => ({
    name: col.name,
    type: detectType(col.values), // number, string, date, etc.
    description: generateDescription(col.name, col.values),
  }));
  
  // Count rows
  const rowCount = rawData.rows.length;
  
  // Generate summary
  const summary = `Dataset contains ${rowCount} records with ${columns.length} fields...`;
  
  return { columns, rowCount, summary };
}
```

### Step 3: Subset Generation
Edit function `generateSubsets()`:

```typescript
export async function generateSubsets(rawData: any, schema: any): Promise<IDataSubset[]> {
  const subsets = [];
  
  // Example: Time series if date column exists
  const dateColumn = schema.columns.find(c => c.type === 'date');
  if (dateColumn) {
    subsets.push({
      description: 'Data distribution over time',
      xAxisName: 'Date',
      xAxisDescription: 'Time period',
      yAxisName: 'Count',
      yAxisDescription: 'Number of records',
      dataPoints: aggregateByDate(rawData, dateColumn.name),
    });
  }
  
  // Example: Category distribution
  const categoryColumns = schema.columns.filter(c => c.type === 'string');
  for (const col of categoryColumns) {
    if (getUniqueCount(rawData, col.name) < 20) { // Only if <20 categories
      subsets.push({
        description: `Distribution by ${col.name}`,
        xAxisName: col.name,
        xAxisDescription: `${col.name} categories`,
        yAxisName: 'Count',
        yAxisDescription: 'Number of occurrences',
        dataPoints: aggregateByCategory(rawData, col.name),
      });
    }
  }
  
  // Example: Numeric correlations
  const numericColumns = schema.columns.filter(c => c.type === 'number');
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      subsets.push({
        description: `${numericColumns[i].name} vs ${numericColumns[j].name}`,
        xAxisName: numericColumns[i].name,
        xAxisDescription: numericColumns[i].description || '',
        yAxisName: numericColumns[j].name,
        yAxisDescription: numericColumns[j].description || '',
        dataPoints: createScatterPlot(rawData, numericColumns[i].name, numericColumns[j].name),
      });
    }
  }
  
  return subsets;
}
```

### Step 4: Replace Dummy Data
In `src/db/fileProcessor.ts`, replace `createDummyProcessingResult()` with:

```typescript
// Stage 2: Extract data
const rawData = await readFile(fileBuffer, fileType);

// Stage 3: Create schema
const schema = await createSchema(rawData);

// Stage 4: Generate subsets
const subsets = await generateSubsets(rawData, schema);

const result = { schema, subsets };
```

## Usage Flow

### User Journey:
1. User logs in
2. Navigates to "Sources" page
3. Clicks "Upload Files"
4. Selects one or more CSV/Excel files
5. Files upload instantly
6. Processing begins automatically
7. User sees real-time progress updates
8. When complete, user can:
   - View file details
   - Rename file (add nickname)
   - Delete file
   - See generated subsets (backend only)

### Admin Access:
```javascript
// View all files in MongoDB
db.datafiles.find()

// View deleted files
db.deleteddatafiles.find()

// Check a specific user's files
db.datafiles.find({ username: "john_doe" })

// See file with all subsets
db.datafiles.findOne({ _id: ObjectId("...") })
```

## File Size Limits
- Current limit: 50MB per file
- Configurable in `api-server.js`:
  ```javascript
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // Change this
    },
  });
  ```

## Error Handling
- Upload errors: Shown via toast notification
- Processing errors: File marked with 'error' status, error message displayed
- Network errors: Auto-retry on next poll
- File too large: Rejected with error message

## Testing

### Test the Upload:
1. Start servers: `npm run dev`
2. Login to the app
3. Go to Sources page
4. Upload a test CSV file
5. Watch the progress bar
6. File should complete in ~3 seconds (with dummy processing)

### Test the API Directly:
```bash
# Upload file
curl -X POST http://localhost:3001/api/files/upload \
  -F "username=testuser" \
  -F "userId=12345" \
  -F "files=@test.csv"

# Get user files
curl http://localhost:3001/api/files/testuser

# Delete file
curl -X DELETE http://localhost:3001/api/files/testuser/FILE_ID
```

## Future Enhancements
- [ ] Add file preview
- [ ] Support more file types (JSON, Parquet)
- [ ] Add file validation before upload
- [ ] Implement file compression
- [ ] Add batch operations
- [ ] Export subsets to new files
- [ ] Share files between users
- [ ] Add file versioning
- [ ] Implement file tags/categories

## Troubleshooting

**Files stuck in "processing":**
- Check API server logs for errors
- Verify MongoDB connection
- Check fileProcessor.ts for exceptions

**Upload fails:**
- Check file size limit
- Verify multer is installed
- Check CORS settings
- Verify username/userId are passed

**Progress not updating:**
- Check browser console for errors
- Verify polling interval is working
- Check API endpoint is accessible

**Subsets not appearing:**
- Verify processing completed successfully
- Check MongoDB for the file record
- Ensure subsets array is populated
