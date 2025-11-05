import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { GridFSBucket } from 'mongodb';

let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;
let gridFSBucket: GridFSBucket | null = null;

export async function connectDB() {
  try {
    // Return existing connection if already connected
    if (isConnected && mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Create mongodb-data directory if it doesn't exist
    const dbPath = './mongodb-data';
    if (!existsSync(dbPath)) {
      await mkdir(dbPath, { recursive: true });
      console.log('📁 Created mongodb-data directory');
    }

    // Create MongoDB Memory Server with persistence
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'cognivo',
        storageEngine: 'wiredTiger',
        // Enable persistence - data will be stored in ./mongodb-data/
        dbPath: dbPath,
      },
    });

    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    isConnected = true;
    
    // Initialize GridFS bucket for file storage
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB database not available');
    }
    
    gridFSBucket = new GridFSBucket(db, {
      bucketName: 'uploads' // Files will be stored in 'uploads.files' and 'uploads.chunks' collections
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📍 MongoDB URL: ' + uri);
    console.log('📁 Data location: ./mongodb-data/');
    console.log('📦 GridFS initialized for file storage');

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function ensureConnected() {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
  }
}

export function getGridFSBucket(): GridFSBucket {
  if (!gridFSBucket) {
    throw new Error('GridFS not initialized. Call connectDB() first.');
  }
  return gridFSBucket;
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    isConnected = false;
    gridFSBucket = null;
    console.log('👋 MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
}

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
