# MongoDB Configuration

This project uses `mongodb-memory-server` with persistence for local development.

## How it works:
- MongoDB data is stored in `./mongodb-data/`
- Data persists between restarts
- Runs automatically with `npm run dev`

## Database Connection:
```typescript
import { connectDB } from './db/mongodb';

// Connect to database
await connectDB();
```

## Example Usage:
```typescript
import { User } from './db/models/User';

// Create a user
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashed_password_here'
});

// Find users
const users = await User.find();

// Update user
await User.findByIdAndUpdate(userId, { username: 'new_name' });

// Delete user
await User.findByIdAndDelete(userId);
```

## Available Scripts:
- `npm run dev` - Starts both MongoDB and Vite dev server
- `npm run dev:vite` - Starts only Vite dev server
- `npm run dev:db` - Starts only MongoDB server

## Database Location:
Your MongoDB data is stored in: `./mongodb-data/`

## Clean Start:
To start with a fresh database, delete the `mongodb-data` folder.
