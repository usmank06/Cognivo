import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { connectDB } from './src/db/mongodb.ts';
import { 
  registerUser, 
  loginUser, 
  getUserData, 
  changePassword, 
  deleteUserAccount,
  updateTokenUsage 
} from './src/db/auth.ts';
import {
  uploadFile,
  getUserFiles,
  getFileDetails,
  updateFileNickname,
  deleteFile,
  getFileStatus,
  getUserFileStats,
  downloadFile,
} from './src/db/fileManager.ts';
import {
  createCanvas,
  getUserCanvases,
  getCanvas,
  updateCanvasScript,
  updateCanvasName,
  updateCanvasThumbnail,
  addChatToCanvas,
  addMessageToChat,
  deleteCanvas,
  getCanvasStats,
} from './src/db/canvasManager.ts';

const app = express();
const PORT = 3001;

// File upload configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

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

// ============================================
// Canvas Management Routes
// ============================================

// Create a new canvas
app.post('/api/canvas/create', async (req, res) => {
  try {
    const { username, userId, name, initialScript } = req.body;
    const result = await createCanvas(username, userId, name, initialScript);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all canvases for a user
app.get('/api/canvas/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await getUserCanvases(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get a specific canvas
app.get('/api/canvas/:username/:canvasId', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const result = await getCanvas(canvasId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update canvas script (auto-save)
app.patch('/api/canvas/:username/:canvasId/script', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const { script } = req.body;
    const result = await updateCanvasScript(canvasId, username, script);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update canvas name
app.patch('/api/canvas/:username/:canvasId/name', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const { name } = req.body;
    const result = await updateCanvasName(canvasId, username, name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update canvas thumbnail
app.patch('/api/canvas/:username/:canvasId/thumbnail', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const { thumbnail } = req.body;
    const result = await updateCanvasThumbnail(canvasId, username, thumbnail);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add a new chat to canvas
app.post('/api/canvas/:username/:canvasId/chat', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const result = await addChatToCanvas(canvasId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add message to a chat
app.post('/api/canvas/:username/:canvasId/chat/:chatId/message', async (req, res) => {
  try {
    const { username, canvasId, chatId } = req.params;
    const { role, content } = req.body;
    const result = await addMessageToChat(canvasId, username, chatId, role, content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete canvas
app.delete('/api/canvas/:username/:canvasId', async (req, res) => {
  try {
    const { username, canvasId } = req.params;
    const result = await deleteCanvas(canvasId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get canvas statistics
app.get('/api/canvas/:username/stats/summary', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await getCanvasStats(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// AI Chat Streaming Routes
// ============================================

// Stream AI chat responses (proxy to Python API)
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, canvasId, username } = req.body;
    
    // Get current canvas
    const canvasResult = await getCanvas(canvasId, username);
    if (!canvasResult.success) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    // Get user's data files
    const filesResult = await getUserFiles(username);
    const dataFiles = filesResult.success ? filesResult.files : [];
    
    // Get detailed file info for files that are completed
    const detailedFiles = [];
    for (const file of dataFiles) {
      if (file.status === 'completed') {
        const fileDetails = await getFileDetails(file.id, username);
        if (fileDetails.success) {
          detailedFiles.push(fileDetails.file);
        }
      }
    }
    
    // Call Python API for streaming
    const pythonResponse = await fetch('http://localhost:8000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages,
        current_canvas: canvasResult.canvas.script,
        data_sources: detailedFiles,
      }),
    });
    
    if (!pythonResponse.ok) {
      throw new Error(`Python API returned ${pythonResponse.status}`);
    }
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe the stream from Python to client
    pythonResponse.body.pipe(res);
    
  } catch (error) {
    console.error('Chat stream error:', error);
    res.status(500).json({ success: false, error: 'Failed to stream chat' });
  }
});

// ============================================
// File Management Routes
// ============================================

// Upload file(s)
app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { username, userId } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    
    const results = [];
    
    for (const file of req.files) {
      const result = await uploadFile(
        username,
        userId,
        file.originalname,
        file.buffer,
        file.size,
        file.mimetype
      );
      results.push(result);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all files for a user
app.get('/api/files/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await getUserFiles(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get file details
app.get('/api/files/:username/:fileId', async (req, res) => {
  try {
    const { username, fileId } = req.params;
    const result = await getFileDetails(fileId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update file nickname
app.patch('/api/files/:username/:fileId/nickname', async (req, res) => {
  try {
    const { username, fileId } = req.params;
    const { nickname } = req.body;
    const result = await updateFileNickname(fileId, username, nickname);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete file
app.delete('/api/files/:username/:fileId', async (req, res) => {
  try {
    const { username, fileId } = req.params;
    const result = await deleteFile(fileId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get file status
app.get('/api/files/:username/:fileId/status', async (req, res) => {
  try {
    const { username, fileId } = req.params;
    const result = await getFileStatus(fileId, username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get user file statistics
app.get('/api/files/:username/stats/summary', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await getUserFileStats(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Download file
app.get('/api/files/:username/:fileId/download', async (req, res) => {
  try {
    const { username, fileId } = req.params;
    const result = await downloadFile(fileId, username);
    
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    
    // Set response headers
    res.setHeader('Content-Type', result.fileType);
    res.setHeader('Content-Length', result.fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    
    // Pipe the GridFS stream to response
    result.stream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
