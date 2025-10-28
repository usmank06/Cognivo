import mongoose, { Schema, Document } from 'mongoose';

// Subset of data extracted from the file
export interface IDataSubset {
  description: string;
  xAxisName: string;
  xAxisDescription: string;
  yAxisName: string;
  yAxisDescription: string;
  dataPoints: Array<{ x: any; y: any }>;
}

// Main file document
export interface IDataFile extends Document {
  userId: string;
  username: string;
  originalFileName: string;
  nickname?: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  
  // Processing status
  status: 'uploading' | 'processing' | 'completed' | 'error';
  processingStage?: string; // e.g., "Reading file...", "Extracting data...", "Creating schema...", "Generating subsets..."
  processingProgress?: number; // 0-100
  errorMessage?: string;
  
  // Schema/summary of the file
  fileSchema?: {
    columns: Array<{ name: string; type: string; description?: string }>;
    rowCount: number;
    summary: string;
  };
  
  // Mini datasets extracted from the file
  subsets: IDataSubset[];
  
  // Metadata
  lastAccessedAt?: Date;
  updatedAt: Date;
}

const DataSubsetSchema = new Schema({
  description: { type: String, required: true },
  xAxisName: { type: String, required: true },
  xAxisDescription: { type: String, required: true },
  yAxisName: { type: String, required: true },
  yAxisDescription: { type: String, required: true },
  dataPoints: [{
    x: Schema.Types.Mixed,
    y: Schema.Types.Mixed,
  }],
}, { _id: false });

const DataFileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    index: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'error'],
    default: 'uploading',
    required: true,
  },
  processingStage: {
    type: String,
  },
  processingProgress: {
    type: Number,
    min: 0,
    max: 100,
  },
  errorMessage: {
    type: String,
  },
  fileSchema: {
    columns: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      description: { type: String, required: false },
    }],
    rowCount: { type: Number, required: false },
    summary: { type: String, required: false },
  },
  subsets: [DataSubsetSchema],
  lastAccessedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
DataFileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DataFile = mongoose.model<IDataFile>('DataFile', DataFileSchema);

// Deleted files collection (soft delete)
export interface IDeletedDataFile extends Document {
  userId: string;
  username: string;
  originalFileName: string;
  nickname?: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  deletedAt: Date;
  
  fileSchema?: {
    columns: Array<{ name: string; type: string; description?: string }>;
    rowCount: number;
    summary: string;
  };
  
  subsets: IDataSubset[];
  
  originalCreatedAt: Date;
  originalUpdatedAt: Date;
}

const DeletedDataFileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
  fileSchema: {
    columns: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      description: { type: String, required: false },
    }],
    rowCount: { type: Number, required: false },
    summary: { type: String, required: false },
  },
  subsets: [DataSubsetSchema],
  originalCreatedAt: {
    type: Date,
  },
  originalUpdatedAt: {
    type: Date,
  },
});

export const DeletedDataFile = mongoose.model<IDeletedDataFile>('DeletedDataFile', DeletedDataFileSchema);
