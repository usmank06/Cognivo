import { connectDB } from './src/db/mongodb.ts';

console.log('🚀 Starting MongoDB...');

const connection = await connectDB();

console.log('✅ Setup Complete!');
console.log('💡 Keep this terminal open while developing');
console.log('📊 Data persists in: ./mongodb-data/');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
