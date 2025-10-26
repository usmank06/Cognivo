import { DataFile, DeletedDataFile } from './models/DataFile';
import { ensureConnected } from './mongodb';
import { processFileInBackground } from './fileProcessor';

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
    
    // Create initial file record
    const dataFile = await DataFile.create({
      userId,
      username,
      originalFileName: fileName,
      fileSize,
      fileType,
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
      fileType
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
 */
export async function deleteFile(fileId: string, username: string) {
  try {
    await ensureConnected();
    
    const file = await DataFile.findOne({ _id: fileId, username });
    
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    // Move to deleted collection
    await DeletedDataFile.create({
      userId: file.userId,
      username: file.username,
      originalFileName: file.originalFileName,
      nickname: file.nickname,
      fileSize: file.fileSize,
      fileType: file.fileType,
      uploadedAt: file.uploadedAt,
      fileSchema: file.fileSchema,
      subsets: file.subsets,
      originalCreatedAt: file.uploadedAt,
      originalUpdatedAt: file.updatedAt,
      deletedAt: new Date(),
    });
    
    // Delete from active collection
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
