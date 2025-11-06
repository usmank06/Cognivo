# Authentication System

## Overview
Simple authentication system for the Cognivo platform. Designed for personal use with friends.

## Features
- User registration with email, username, and password
- Login system with simple password hashing
- Token usage tracking (total tokens and money spent)
- Soft delete for user accounts (moved to DeletedUser collection)
- Password change functionality

## Security Notes
**This is an MVP with basic security:**
- Uses a simple hash function (NOT production-ready)
- For production, replace with bcrypt or similar
- No JWT tokens (stores username in React state)
- No email verification
- No rate limiting

## Database Structure

### User Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  totalTokensSpent: Number,
  totalMoneySpent: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### DeletedUser Collection
```javascript
{
  username: String,
  email: String,
  password: String,
  totalTokensSpent: Number,
  totalMoneySpent: Number,
  deletedAt: Date,
  originalCreatedAt: Date,
  originalUpdatedAt: Date
}
```

## Usage

### Starting the App
```bash
npm run dev
```

This starts both MongoDB and the Vite dev server.

### Creating an Account
1. Click "Register" from landing page
2. Enter email, username, and password
3. Account is created and you're logged in

### Logging In
1. Click "Login" from landing page
2. Enter username and password
3. You'll be redirected to the canvas page

### Settings Page
Access via navigation menu when logged in. Features:
- View account info (username, email)
- See token usage statistics
- See money spent
- Download your data
- Change password
- Log out
- Delete account (soft delete)

### Soft Delete
When a user deletes their account:
1. User data is copied to `DeletedUser` collection
2. User is removed from active `User` collection
3. User can register again with the same email/username
4. You (admin) can still access deleted user data in MongoDB

### Updating Token Usage
To track API usage, call this function:
```typescript
import { updateTokenUsage } from './db/auth';

// After an API call
await updateTokenUsage(username, tokensUsed, moneyCost);
```

## File Structure
```
src/
  db/
    mongodb.ts          # MongoDB connection
    auth.ts             # Authentication functions
    models/
      User.ts           # User and DeletedUser models
  components/
    LoginPage.tsx       # Login UI
    RegisterPage.tsx    # Registration UI
    SettingsPage.tsx    # Settings and account management
```

## Admin Access
To view deleted users, connect to MongoDB and query the `deletedusers` collection:
```javascript
// Using MongoDB shell or GUI tool
db.deletedusers.find()
```

## Future Improvements (if needed)
- Add bcrypt for proper password hashing
- Add session tokens/JWT
- Add email verification
- Add password reset functionality
- Add rate limiting
- Add user roles/permissions
