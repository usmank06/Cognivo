import express from 'express';
import cors from 'cors';
import { connectDB } from './src/db/mongodb.ts';
import { 
  registerUser, 
  loginUser, 
  getUserData, 
  changePassword, 
  deleteUserAccount,
  updateTokenUsage 
} from './src/db/auth.ts';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
await connectDB();
console.log('✅ API Server - MongoDB connected');

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const result = await registerUser(email, username, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await getUserData(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/user/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const result = await changePassword(username, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await deleteUserAccount(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/user/track-tokens', async (req, res) => {
  try {
    const { username, tokens, cost } = req.body;
    const result = await updateTokenUsage(username, tokens, cost);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
