import { DataFile, DeletedDataFile } from './models/DataFile';
import { ensureConnected, getGridFSBucket } from './mongodb';
import { processFileInBackground } from './fileProcessor';
import { Readable } from 'stream';

/**
 * Upload a new file and start processing
 */
export async function uploadFile(
  username: string,
  userId: string,
  fileName: string,
  fileBuffer: Buffer,
  fileSize: number,
  fileType: string
) {
  try {
    await ensureConnected();
    
    // Store file in GridFS
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(fileName, {
      metadata: {
        username,
        userId,
        uploadedAt: new Date(),
        fileType,
      }
    });
    
    // Convert buffer to readable stream and pipe to GridFS
    const readableStream = Readable.from(fileBuffer);
    const gridfsFileId = await new Promise<any>((resolve, reject) => {
      readableStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id));
    });
    
    // Create initial file record with GridFS reference
    const dataFile = await DataFile.create({
      userId,
      username,
      originalFileName: fileName,
      fileSize,
      fileType,
      gridfsFileId, // Store reference to GridFS file
      status: 'uploading',
      processingProgress: 0,
      subsets: [],
    });

    // Start background processing (non-blocking)
    // Don't await - let it run in background
    const fileId = (dataFile._id as any).toString();
    processFileInBackground(
      fileId,
      fileBuffer,
      fileName,
      fileType,
      username  // Pass username for token tracking
    ).catch(err => {
      console.error('Background processing failed:', err);
    });

    return { 
      success: true, 
      fileId: fileId,
      message: 'File uploaded successfully. Processing started.',
    };
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

/**
 * Get all files for a user
 */
export async function getUserFiles(username: string) {
  try {
    await ensureConnected();
    
    const files = await DataFile.find({ username }).sort({ uploadedAt: -1 });
    
    return { 
      success: true, 
      files: files.map(f => ({
        id: f._id,
        originalFileName: f.originalFileName,
        nickname: f.nickname,
        fileSize: f.fileSize,
        fileType: f.fileType,
        uploadedAt: f.uploadedAt,
        status: f.status,
        processingStage: f.processingStage,
        processingProgress: f.processingProgress,
        errorMessage: f.errorMessage,
        hasSchema: !!f.fileSchema,
        subsetCount: f.subsets.length,
      }))
    };
  } catch (error) {
    console.error('Get user files error:', error);
    return { success: false, error: 'Failed to get files' };
  }
}

/**
 * Get details of a specific file (including subsets)
 */
export async function getFileDetails(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    // Update last accessed
    file.lastAccessedAt = new Date();
    await file.save();
    
    return { 
      success: true, 
      file: {
        id: file._id,
        originalFileName: file.originalFileName,
        nickname: file.nickname,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadedAt: file.uploadedAt,
        status: file.status,
        processingStage: file.processingStage,
        processingProgress: file.processingProgress,
        errorMessage: file.errorMessage,
        schema: file.fileSchema,
        subsets: file.subsets,
        lastAccessedAt: file.lastAccessedAt,
      }
    };
  } catch (error) {
    console.error('Get file details error:', error);
    return { success: false, error: 'Failed to get file details' };
  }
}

/**
 * Update file nickname
 */
export async function updateFileNickname(fileId: string, username: string, nickname: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOneAndUpdate(
      { _id: fileId, username },
      { nickname, updatedAt: new Date() },
      { new: true }
    );
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    return { success: true, message: 'Nickname updated successfully' };
  } catch (error) {
    console.error('Update nickname error:', error);
    return { success: false, error: 'Failed to update nickname' };
  }
}

/**
 * Soft delete a file (move to deleted collection)
 * NOTE: GridFS file is NOT deleted - keeps file data for deleted files
 */
export async function deleteFile(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    // Move to deleted collection (keep gridfsFileId reference)
    await DeletedDataFile.create({
      userId: file.userId,
      username: file.username,
      originalFileName: file.originalFileName,
      nickname: file.nickname,
      fileSize: file.fileSize,
      fileType: file.fileType,
      uploadedAt: file.uploadedAt,
      gridfsFileId: file.gridfsFileId, // Keep GridFS reference for recovery
      fileSchema: file.fileSchema,
      subsets: file.subsets,
      originalCreatedAt: file.uploadedAt,
      originalUpdatedAt: file.updatedAt,
      deletedAt: new Date(),
    });
    
    // Delete from active collection (GridFS file remains)
    await DataFile.deleteOne({ _id: fileId });
    
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}

/**
 * Get processing status of a file
 */
export async function getFileStatus(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    return { 
      success: true, 
      status: {
        status: file.status,
        processingStage: file.processingStage,
        processingProgress: file.processingProgress,
        errorMessage: file.errorMessage,
      }
    };
  } catch (error) {
    console.error('Get file status error:', error);
    return { success: false, error: 'Failed to get file status' };
  }
}

/**
 * Get file statistics for a user
 */
export async function getUserFileStats(username: string) {
  try {
    await ensureConnected();
    
    const files = await DataFile.find({ username });
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
      byStatus: {
        completed: files.filter(f => f.status === 'completed').length,
        processing: files.filter(f => f.status === 'processing').length,
        error: files.filter(f => f.status === 'error').length,
        uploading: files.filter(f => f.status === 'uploading').length,
      },
      totalSubsets: files.reduce((sum, f) => sum + f.subsets.length, 0),
    };
    
    return { success: true, stats };
  } catch (error) {
    console.error('Get file stats error:', error);
    return { success: false, error: 'Failed to get file statistics' };
  }
}

/**
 * Download a file from GridFS
 */
export async function downloadFile(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    if (!file.gridfsFileId) {
      return { success: false, error: 'File data not available' };
    }
    
    const bucket = getGridFSBucket();
    
    // Return download stream
    const downloadStream = bucket.openDownloadStream(file.gridfsFileId);
    
    // Update last accessed
    file.lastAccessedAt = new Date();
    await file.save();
    
    return { 
      success: true, 
      stream: downloadStream,
      fileName: file.originalFileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
    };
  } catch (error) {
    console.error('Download file error:', error);
    return { success: false, error: 'Failed to download file' };
  }
}

/**
 * Get file buffer from GridFS (for processing)
 */
export async function getFileBuffer(gridfsFileId: any): Promise<Buffer> {
  const bucket = getGridFSBucket();
  const downloadStream = bucket.openDownloadStream(gridfsFileId);
  
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    downloadStream
      .on('data', (chunk) => chunks.push(chunk))
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Get raw file data for AI chat (reads from GridFS)
 */
export async function getFileDataForAI(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file || !file.gridfsFileId) {
      return { success: false, error: 'File not found' };
    }
    
    // Get file buffer from GridFS
    const buffer = await getFileBuffer(file.gridfsFileId);
    
    return {
      success: true,
      fileName: file.originalFileName,
      fileType: file.fileType,
      fileBuffer: buffer.toString('base64'), // Convert to base64 for JSON transport
    };
  } catch (error) {
    console.error('Get file data for AI error:', error);
    return { success: false, error: 'Failed to get file data' };
  }
}
