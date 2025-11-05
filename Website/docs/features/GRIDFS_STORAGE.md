# GridFS File Storage

## Overview

Your application now uses **MongoDB GridFS** to store uploaded files. GridFS is MongoDB's specification for storing and retrieving large files that exceed the BSON document size limit of 16MB.

## How It Works

### Storage
When a file is uploaded:
1. File is received as a Buffer from multer
2. Buffer is converted to a stream
3. Stream is piped to GridFS using `bucket.openUploadStream()`
4. GridFS splits the file into chunks (default 255KB each)
5. Stores chunks in `uploads.chunks` collection
6. Stores metadata in `uploads.files` collection
7. Returns a `gridfsFileId` which is saved in the `DataFile` document

### Retrieval
When a file needs to be downloaded or processed:
1. Get the `gridfsFileId` from the `DataFile` document
2. Use `bucket.openDownloadStream(gridfsFileId)` to get a readable stream
3. Pipe stream to response (download) or collect into Buffer (processing)

## Collections Created

GridFS creates two collections automatically:

- **`uploads.files`** - File metadata (filename, uploadDate, length, metadata)
- **`uploads.chunks`** - File data split into 255KB chunks

## Benefits

✅ **No Size Limit** - Can handle files up to 16GB (though performance degrades with very large files)
✅ **Automatic Chunking** - No need to manually split/join large files
✅ **Streaming** - Files can be streamed in/out without loading entirely into memory
✅ **Persistence** - Stored in your `mongodb-data/` directory alongside other data
✅ **Atomic Operations** - GridFS operations are atomic
✅ **Query Support** - Can query file metadata

## File Lifecycle

1. **Upload** → Stored in GridFS + metadata in `DataFile` collection
2. **Processing** → Python API receives the file buffer (from GridFS)
3. **Download** → Stream from GridFS to user
4. **Delete** → Removed from both GridFS and `DataFile` collection

## API Endpoints

### Download File
```
GET /api/files/:username/:fileId/download
```

Returns the file as a downloadable stream.

**Response:**
- Content-Type: Original file MIME type
- Content-Disposition: `attachment; filename="..."`
- Body: File stream

## Code References

- **GridFS Setup**: `src/db/mongodb.ts` - `getGridFSBucket()`
- **File Upload**: `src/db/fileManager.ts` - `uploadFile()`
- **File Download**: `src/db/fileManager.ts` - `downloadFile()`
- **File Delete**: `src/db/fileManager.ts` - `deleteFile()` (also deletes from GridFS)
- **Download Endpoint**: `api-server.js` - `GET /api/files/:username/:fileId/download`

## Technical Details

### Storage Path
Files are physically stored in:
```
./mongodb-data/
```

The same directory where your MongoDB data persists.

### Performance Considerations

- **Small files (< 1MB)**: Excellent performance
- **Medium files (1-50MB)**: Good performance, suitable for CSV/Excel files
- **Large files (50-500MB)**: Acceptable performance
- **Very large files (> 500MB)**: Consider alternative storage (S3, local filesystem)

### Size Limits

- **GridFS Chunk**: 255KB (default)
- **Total File Size**: Up to 16GB (theoretical), but recommended < 500MB
- **Current Multer Limit**: 50MB (set in `api-server.js`)

To increase the upload limit:
```javascript
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});
```

## Example: Download a File

```javascript
// Frontend
const downloadFile = async (fileId) => {
  const response = await fetch(
    `http://localhost:3001/api/files/${username}/${fileId}/download`,
    { credentials: 'include' }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filename.csv'; // Get from response headers
  a.click();
};
```

## Database Schema

### DataFile Document
```typescript
{
  _id: ObjectId,
  userId: string,
  username: string,
  originalFileName: string,
  fileSize: number,
  fileType: string,
  gridfsFileId: ObjectId,  // ← Reference to GridFS file
  status: string,
  // ... other fields
}
```

### GridFS Files Collection
```json
{
  "_id": ObjectId,
  "length": 1024000,
  "chunkSize": 261120,
  "uploadDate": ISODate,
  "filename": "data.csv",
  "metadata": {
    "username": "john",
    "userId": "123",
    "uploadedAt": ISODate,
    "fileType": "text/csv"
  }
}
```

### GridFS Chunks Collection
```json
{
  "_id": ObjectId,
  "files_id": ObjectId,  // Reference to files collection
  "n": 0,                 // Chunk number (0, 1, 2, ...)
  "data": BinData         // Chunk data (255KB)
}
```

## Backup & Restore

Since GridFS data is stored in MongoDB collections, it's included in your regular MongoDB backups:

```bash
# Backup (everything is in mongodb-data/)
mongodump --db cognivo --out ./backup

# Restore
mongorestore --db cognivo ./backup/cognivo
```

## Troubleshooting

### "GridFS not initialized"
- Ensure `connectDB()` is called before any GridFS operations
- Check that MongoDB connection is successful

### "File not found in GridFS"
- File may have been deleted from GridFS but metadata still exists
- Check `uploads.files` collection for the file

### Memory issues with large files
- GridFS streams data, so memory usage should be minimal
- If issues persist, increase Node.js memory: `node --max-old-space-size=4096 api-server.js`

## Future Enhancements

Consider these improvements:

1. **Compression** - Compress files before storing in GridFS
2. **Checksums** - Verify file integrity with MD5 checksums
3. **Virus Scanning** - Scan files before storage
4. **CDN Integration** - For public files, use GridFS + CDN
5. **Duplicate Detection** - Hash files to avoid storing duplicates
