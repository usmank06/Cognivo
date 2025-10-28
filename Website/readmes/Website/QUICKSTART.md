# Quick Start Guide - Authentication & Token Tracking

## 🚀 Getting Started

### 1. Start the App
```bash
npm run dev
```
This starts both MongoDB and the Vite dev server.

### 2. Create Your Account
- Open http://localhost:5173
- Click "Get Started" or "Register"
- Fill in email, username, and password
- You're automatically logged in!

### 3. Access Settings
- Click your username in the navigation
- Select "Settings"
- View your token usage and account info

## 💰 Tracking Token Usage

### Basic Usage
```typescript
import { trackTokens } from './db/tokenTracker';

// After an AI API call
await trackTokens(username, 1500, 0.045);
//                        👆      👆
//                     tokens   cost in $
```

### With Preset Pricing
```typescript
import { trackGPT4, trackGPT35, trackClaude } from './db/tokenTracker';

// For GPT-4
await trackGPT4(username, 1500);

// For GPT-3.5
await trackGPT35(username, 1500);

// For Claude
await trackClaude(username, 1500);
```

### Custom Pricing
```typescript
import { calculateCost, trackTokens, AI_PRICING } from './db/tokenTracker';

const tokens = 2500;
const cost = calculateCost(tokens, AI_PRICING.GPT4);
await trackTokens(username, tokens, cost);
```

## 🔐 Authentication Functions

### In Your Components
```typescript
import { loginUser, registerUser, getUserData } from './db/auth';

// Login
const result = await loginUser(username, password);
if (result.success) {
  console.log('Welcome!', result.user);
}

// Get current user data (including token stats)
const data = await getUserData(username);
console.log('Tokens:', data.user.totalTokensSpent);
console.log('Money:', data.user.totalMoneySpent);
```

## 📊 Viewing Usage Stats

### In Your App
The settings page automatically shows:
- Total tokens spent
- Total money spent
- Email and username
- All account options

### As Admin
Connect to MongoDB to view all users:
```bash
# If using MongoDB Compass or similar
mongodb://127.0.0.1:27017/noesis

# Collections:
# - users (active accounts)
# - deletedusers (soft-deleted accounts)
```

## 🗑️ Deleted Accounts

When users delete their account:
1. ✅ They're immediately logged out
2. ✅ Data moves to `deletedusers` collection
3. ✅ They can sign up again with same email
4. ✅ You can still access their old data

To manually delete permanently:
```javascript
// In MongoDB
db.deletedusers.deleteOne({ username: "someuser" })
```

## 🔧 Common Operations

### Update User's Token Count Manually
```typescript
import { updateTokenUsage } from './db/auth';

await updateTokenUsage('john', 1000, 0.02);
// Adds 1000 tokens and $0.02 to john's total
```

### Change Password
```typescript
import { changePassword } from './db/auth';

const result = await changePassword(username, oldPass, newPass);
```

### Check If User Exists
```typescript
import { loginUser } from './db/auth';

// Try to login (don't need password for this)
const result = await getUserData(username);
if (result.success) {
  console.log('User exists!');
}
```

## 📁 Important Files

- `src/db/auth.ts` - All auth functions
- `src/db/tokenTracker.ts` - Easy token tracking
- `src/db/models/User.ts` - User schema
- `src/components/SettingsPage.tsx` - Settings UI
- `readmes/AUTHENTICATION.md` - Full documentation

## ⚠️ Remember

This is an MVP for personal use:
- ✅ Simple and fast
- ✅ Works for small user base
- ❌ NOT production-ready security
- ❌ No email verification
- ❌ Basic password hashing

For production, upgrade to:
- bcrypt for passwords
- JWT tokens
- Email verification
- Rate limiting
- HTTPS
