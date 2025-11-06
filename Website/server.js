import { connectDB } from './src/db/mongodb.ts';

console.log('🚀 Starting MongoDB...\n');

const connection = await connectDB();

console.log('\n✅ Setup Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 Keep this terminal open while developing');
console.log('📊 Data persists in: ./mongodb-data/');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
