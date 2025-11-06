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
    
    console.log('🔨 Creating canvas with initial chat:', initialChat);
    
    const canvas = await Canvas.create({
      userId,
      username,
      name,
      script: initialScript || '{"nodes":[],"edges":[]}',
      chats: [initialChat],
    });

    console.log('💾 Canvas created in DB with', canvas.chats.length, 'chats');
    console.log('📋 Chat IDs:', canvas.chats.map(c => c.id));

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
    console.error('Create canvas error:', error);
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
    
    console.log('📚 [GET CANVASES] Found', canvases.length, 'canvases for', username);
    
    return { 
      success: true, 
      canvases: canvases.map(c => {
        console.log('📋 [GET CANVASES] Canvas', c._id.toString(), 'has', c.chats.length, 'chats');
        return {
          id: c._id.toString(),
          name: c.name,
          script: c.script,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          lastAccessedAt: c.lastAccessedAt,
          chatCount: c.chats.length,
          chats: c.chats, // Include full chat data
        };
      })
    };
  } catch (error) {
    console.error('❌ [GET CANVASES] Error:', error);
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
      console.log('❌ [GET CANVAS] Canvas not found:', canvasId);
      return { success: false, error: 'Canvas not found' };
    }
    
    console.log('✅ [GET CANVAS] Found canvas:', canvasId);
    console.log('📊 [GET CANVAS] Canvas has', canvas.chats.length, 'chats');
    console.log('📋 [GET CANVAS] Chat IDs:', canvas.chats.map(c => c.id));
    
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
    console.error('❌ [GET CANVAS] Error:', error);
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
    console.error('Update canvas script error:', error);
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
    console.error('Update canvas name error:', error);
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
      console.log('❌ [ADD CHAT] Canvas not found:', canvasId);
      return { success: false, error: 'Canvas not found' };
    }
    
    console.log('🆕 [ADD CHAT] Adding chat to canvas:', canvasId);
    console.log('📊 [ADD CHAT] Current chat count:', canvas.chats.length);
    
    const newChat: IChat = {
      id: `chat-${Date.now()}`,
      messages: [],
      createdAt: new Date(),
    };
    
    canvas.chats.push(newChat);
    await canvas.save();
    
    console.log('✅ [ADD CHAT] Chat created with ID:', newChat.id);
    console.log('📊 [ADD CHAT] New chat count:', canvas.chats.length);
    
    return { 
      success: true,
      chatId: newChat.id,
    };
  } catch (error) {
    console.error('❌ [ADD CHAT] Error:', error);
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
      console.log('❌ [ADD MSG] Canvas not found:', canvasId);
      return { success: false, error: 'Canvas not found' };
    }
    
    const chat = canvas.chats.find(c => c.id === chatId);
    
    if (!chat) {
      console.log('❌ [ADD MSG] Chat not found:', chatId);
      console.log('📋 [ADD MSG] Available chats:', canvas.chats.map(c => c.id));
      return { success: false, error: 'Chat not found' };
    }
    
    console.log('💬 [ADD MSG] Adding', role, 'message to chat:', chatId);
    console.log('📊 [ADD MSG] Current message count:', chat.messages.length);
    
    const message: IChatMessage = {
      role,
      content,
      timestamp: new Date(),
    };
    
    chat.messages.push(message);
    canvas.updatedAt = new Date();
    await canvas.save();
    
    console.log('✅ [ADD MSG] Message saved. New count:', chat.messages.length);
    
    return { success: true };
  } catch (error) {
    console.error('❌ [ADD MSG] Error:', error);
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
    
    const chat = canvas.chats.find(c => c.id === chatId);
    
    if (!chat) {
      return { success: false, error: 'Chat not found' };
    }
    
    chat.title = title;
    canvas.updatedAt = new Date();
    await canvas.save();
    
    return { success: true };
  } catch (error) {
    console.error('Update chat title error:', error);
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
    
    return { success: true, message: 'Canvas deleted successfully' };
  } catch (error) {
    console.error('Delete canvas error:', error);
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
      totalChats: canvases.reduce((sum, c) => sum + c.chats.length, 0),
      totalMessages: canvases.reduce((sum, c) => 
        sum + c.chats.reduce((chatSum, chat) => chatSum + chat.messages.length, 0), 0
      ),
      recentlyUpdated: canvases
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map(c => ({
          id: c._id.toString(),
          name: c.name,
          updatedAt: c.updatedAt,
        })),
    };
    
    return { success: true, stats };
  } catch (error) {
    console.error('Get canvas stats error:', error);
    return { success: false, error: 'Failed to get canvas statistics' };
  }
}
