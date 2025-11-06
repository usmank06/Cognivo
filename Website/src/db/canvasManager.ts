import { Canvas, DeletedCanvas, IChat, IChatMessage } from './models/Canvas';
import { ensureConnected } from './mongodb';

/**
 * Create a new canvas for a user
 */
export async function createCanvas(
  username: string,
  userId: string,
  name: string,
  initialScript?: string
) {
  try {
    await ensureConnected();
    
    // Create initial chat for the canvas
    const initialChat: IChat = {
      id: `chat-${Date.now()}`,
      messages: [],
      createdAt: new Date(),
    };
    
    const canvas = await Canvas.create({
      userId,
      username,
      name,
      script: initialScript || '{"nodes":[],"edges":[]}',
      chats: [initialChat],
    });

    return { 
      success: true, 
      canvasId: canvas._id.toString(),
      canvas: {
        id: canvas._id.toString(),
        name: canvas.name,
        script: canvas.script,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
        chats: canvas.chats,
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to create canvas' };
  }
}

/**
 * Get all canvases for a user
 */
export async function getUserCanvases(username: string) {
  try {
    await ensureConnected();
    
    const canvases = await Canvas.find({ username }).sort({ updatedAt: -1 });
    
    return { 
      success: true, 
      canvases: canvases.map(c => ({
        id: c._id.toString(),
        name: c.name,
        script: c.script,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        lastAccessedAt: c.lastAccessedAt,
        chatCount: c.chats.length,
        chats: c.chats, // Include full chat data
      }))
    };
  } catch (error) {
    return { success: false, error: 'Failed to get canvases' };
  }
}

/**
 * Get a specific canvas with full data
 */
export async function getCanvas(canvasId: string, username: string) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOne({ _id: canvasId, username });
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    // Update last accessed
    canvas.lastAccessedAt = new Date();
    await canvas.save();
    
    return { 
      success: true, 
      canvas: {
        id: canvas._id.toString(),
        name: canvas.name,
        script: canvas.script,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
        lastAccessedAt: canvas.lastAccessedAt,
        chats: canvas.chats,
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to get canvas' };
  }
}

/**
 * Update canvas script (auto-save)
 */
export async function updateCanvasScript(
  canvasId: string,
  username: string,
  script: string
) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOneAndUpdate(
      { _id: canvasId, username },
      { 
        script,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    return { 
      success: true,
      updatedAt: canvas.updatedAt,
    };
  } catch (error) {
    return { success: false, error: 'Failed to update canvas script' };
  }
}

/**
 * Update canvas name
 */
export async function updateCanvasName(
  canvasId: string,
  username: string,
  name: string
) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOneAndUpdate(
      { _id: canvasId, username },
      { 
        name,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update canvas name' };
  }
}

/**
 * Add a new chat to a canvas
 */
export async function addChatToCanvas(
  canvasId: string,
  username: string
) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOne({ _id: canvasId, username });
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    const newChat: IChat = {
      id: `chat-${Date.now()}`,
      messages: [],
      createdAt: new Date(),
    };
    
    canvas.chats.push(newChat);
    await canvas.save();
    
    return { 
      success: true,
      chatId: newChat.id,
    };
  } catch (error) {
    return { success: false, error: 'Failed to add chat' };
  }
}

/**
 * Add a message to a specific chat
 */
export async function addMessageToChat(
  canvasId: string,
  username: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOne({ _id: canvasId, username });
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    const chat = canvas.chats.find((c: IChat) => c.id === chatId);
    
    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }
    
    const message: IChatMessage = {
      role,
      content,
      timestamp: new Date(),
    };
    
    chat.messages.push(message);
    canvas.updatedAt = new Date();
    await canvas.save();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to add message' };
  }
}

/**
 * Update chat title
 */
export async function updateChatTitle(
  canvasId: string,
  username: string,
  chatId: string,
  title: string
) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOne({ _id: canvasId, username });
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    const chat = canvas.chats.find((c: IChat) => c.id === chatId);
    
    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }
    
    chat.title = title;
    canvas.updatedAt = new Date();
    await canvas.save();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update chat title' };
  }
}

/**
 * Soft delete a canvas
 */
export async function deleteCanvas(canvasId: string, username: string) {
  try {
    await ensureConnected();
    
    const canvas = await Canvas.findOne({ _id: canvasId, username });
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }
    
    // Move to deleted collection
    await DeletedCanvas.create({
      userId: canvas.userId,
      username: canvas.username,
      name: canvas.name,
      script: canvas.script,
      chats: canvas.chats,
      originalCreatedAt: canvas.createdAt,
      originalUpdatedAt: canvas.updatedAt,
      deletedAt: new Date(),
    });
    
    // Delete from active collection
    await Canvas.deleteOne({ _id: canvasId });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete canvas' };
  }
}

/**
 * Get canvas statistics for a user
 */
export async function getCanvasStats(username: string) {
  try {
    await ensureConnected();
    
    const canvases = await Canvas.find({ username });
    
    const stats = {
      totalCanvases: canvases.length,
      totalChats: canvases.reduce((sum: number, c: any) => sum + c.chats.length, 0),
      totalMessages: canvases.reduce((sum: number, c: any) => 
        sum + c.chats.reduce((chatSum: number, chat: any) => chatSum + chat.messages.length, 0), 0
      ),
      recentlyUpdated: canvases
        .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map((c: any) => ({
          id: c._id.toString(),
          name: c.name,
          updatedAt: c.updatedAt,
        })),
    };
    
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: 'Failed to get canvas stats' };
  }
}
