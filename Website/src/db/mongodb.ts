import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDB() {
  try {
    // Create mongodb-data directory if it doesn't exist
    const dbPath = './mongodb-data';
    if (!existsSync(dbPath)) {
      await mkdir(dbPath, { recursive: true });
      console.log('📁 Created mongodb-data directory');
    }

    // Create MongoDB Memory Server with persistence
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'noesis',
        storageEngine: 'wiredTiger',
        // Enable persistence - data will be stored in ./mongodb-data/
        dbPath: dbPath,
      },
    });

    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📍 MongoDB URL: ' + uri);
    console.log('📁 Data location: ./mongodb-data/');

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
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
