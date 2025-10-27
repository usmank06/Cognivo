# Canvas Management System Documentation

## Overview
Complete canvas management system with database persistence, real-time auto-save, and integrated chat functionality per canvas.

## Database Schema

### Canvas Collection (`Canvas.ts`)

```typescript
Canvas {
  _id: ObjectId
  userId: string
  username: string
  name: string
  script: string              // JSON string of canvas data (nodes, edges, etc.)
  thumbnail?: string          // Base64 image or URL for preview
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
  chats: [{
    id: string
    messages: [{
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }]
    createdAt: Date
  }]
}
```

### DeletedCanvas Collection
- Same structure as Canvas
- Includes `deletedAt`, `originalCreatedAt`, `originalUpdatedAt`
- Soft delete for recovery

## Features Implemented

### 1. Canvas Management ✅
- **Create Canvas**: New canvases with custom names
- **Load Canvases**: Fetch all user's canvases from database
- **Switch Canvas**: Change between different canvases
- **Rename Canvas**: Update canvas names
- **Delete Canvas**: Soft delete (moves to DeletedCanvas collection)
- **Auto-create**: Creates default canvas if user has none

### 2. Script Editor ✅
- **Real-time Editing**: Edit canvas script (JSON) in textarea
- **Auto-save**: Debounced auto-save (2 seconds after last edit)
- **Manual Save**: "Save Now" button for immediate save
- **Format JSON**: Format script with proper indentation
- **Export**: Download canvas script as JSON file
- **Status Indicators**: Shows saving status, last saved time, unsaved changes badge

### 3. Thumbnail System ✅
- **Preview Display**: Shows thumbnail in sidebar (or placeholder)
- **Update API**: Ready for thumbnail generation/upload
- **Storage**: Stored in database (Base64 or URL)

### 4. Chat System (Structure Ready) ✅
- **Multiple Chats per Canvas**: Each canvas has its own chats array
- **Create New Chat**: Add new chat thread to canvas
- **Switch Chats**: Select different chats within a canvas
- **Message History**: Persistent messages per chat
- **Canvas Scoped**: Chats reset when switching canvases
- **Reload Function**: `onReloadCanvas()` for chat to trigger canvas refresh

### 5. Real-time Updates ✅
- **Debounced Saves**: Saves 2 seconds after last edit (prevents excessive DB calls)
- **Immediate Database Updates**: Changes saved to MongoDB instantly after debounce
- **Optimistic UI**: Local state updates immediately, then syncs with DB
- **Last Saved Indicator**: Shows "Just now", "Xs ago", etc.

## API Endpoints

All canvas endpoints are in `api-server.js`:

### Canvas CRUD
```javascript
POST   /api/canvas/create                          // Create new canvas
GET    /api/canvas/:username                       // Get all user canvases
GET    /api/canvas/:username/:canvasId             // Get specific canvas with full data
PATCH  /api/canvas/:username/:canvasId/script      // Update canvas script
PATCH  /api/canvas/:username/:canvasId/name        // Update canvas name
PATCH  /api/canvas/:username/:canvasId/thumbnail   // Update canvas thumbnail
DELETE /api/canvas/:username/:canvasId             // Delete canvas (soft delete)
GET    /api/canvas/:username/stats/summary         // Get canvas statistics
```

### Chat Operations
```javascript
POST   /api/canvas/:username/:canvasId/chat                     // Create new chat
POST   /api/canvas/:username/:canvasId/chat/:chatId/message     // Add message to chat
```

## Frontend Components

### BoardPage.tsx
**Main orchestrator for canvas system**

**Responsibilities:**
- Load all canvases from database
- Manage current canvas state
- Handle canvas creation, renaming, deletion
- Pass data to child components
- Provide reload function for chat

**Key Functions:**
```typescript
loadCanvases()          // Fetch all user canvases
loadCanvasDetails()     // Load specific canvas with chats
handleCreateCanvas()    // Create new canvas
handleRenameCanvas()    // Update canvas name
handleDeleteCanvas()    // Soft delete canvas
handleScriptChange()    // Update local script state
reloadCanvas()          // Reload current canvas (for chat)
```

### CanvasArea.tsx
**Script editor and canvas management**

**Features:**
- Large textarea for editing canvas script (JSON)
- Auto-save with 2-second debounce
- Manual save button
- Format JSON button
- Export to JSON file
- Status indicators (saving, last saved, unsaved changes)
- Canvas metadata display

**Auto-save Logic:**
```typescript
// Updates debounce timer on every edit
useEffect(() => {
  if (localScript !== script) {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveScript(localScript);
    }, 2000);
  }
}, [localScript]);
```

### BoardSidebar.tsx
**Canvas list and management UI**

**Features:**
- Expandable/collapsible sidebar
- Canvas list with thumbnails
- Quick switcher dropdown
- Create new canvas dialog
- Rename canvas dialog
- Delete canvas button
- Shows chat count and last updated time

**Thumbnail Display:**
- Shows image if thumbnail exists
- Placeholder icon if no thumbnail
- 128px height preview

### ChatSidebar.tsx
**Chat interface per canvas**

**Features:**
- Multiple chats per canvas
- Create new chat button
- Switch between chats (dropdown)
- Message history display
- Send messages (persists to database)
- Empty state when no chat selected
- Resets when canvas changes

**Future Integration:**
- AI/LLM integration for chat responses
- Canvas manipulation via chat commands
- Call `onReloadCanvas()` after modifying canvas via chat

## Database Manager (canvasManager.ts)

Complete CRUD operations:

```typescript
createCanvas(username, userId, name, initialScript?)
getUserCanvases(username)                    // Returns list with thumbnails
getCanvas(canvasId, username)                // Returns full canvas with chats
updateCanvasScript(canvasId, username, script)
updateCanvasName(canvasId, username, name)
updateCanvasThumbnail(canvasId, username, thumbnail)
addChatToCanvas(canvasId, username)          // Creates new chat thread
addMessageToChat(canvasId, username, chatId, role, content)
deleteCanvas(canvasId, username)             // Soft delete
getCanvasStats(username)                     // Statistics
```

## Usage Flow

### User Creates Canvas
1. User clicks "New Canvas" in BoardSidebar
2. Dialog appears, user enters name
3. `handleCreateCanvas()` calls API
4. Database creates canvas with empty script
5. Canvas added to list and auto-selected
6. CanvasArea loads with empty editor

### User Edits Canvas
1. User types in textarea in CanvasArea
2. Local state updates immediately
3. After 2 seconds of no typing, auto-save triggers
4. Script saved to database
5. "Last saved" timestamp updates
6. User can continue editing (process repeats)

### User Switches Canvas
1. User selects different canvas in BoardSidebar
2. `handleSelectCanvas()` updates currentCanvas
3. BoardPage calls `loadCanvasDetails()` to fetch full data
4. CanvasArea loads new script
5. ChatSidebar loads chats for new canvas

### User Chats
1. User creates new chat (if none exists)
2. User types message and sends
3. Message saved to database under current canvas
4. Local state updates to show message
5. In future: AI responds and can modify canvas
6. Chat calls `onReloadCanvas()` to refresh canvas view

## Future Enhancements

### Immediate Next Steps
1. **Visual Canvas Renderer**
   - Parse JSON script
   - Render actual canvas (React Flow, D3, etc.)
   - Replace textarea with visual editor
   - Keep script editor as debug/advanced view

2. **Thumbnail Generation**
   - Auto-generate thumbnail when canvas saved
   - Use canvas-to-image library
   - Update database with Base64 image

3. **AI Chat Integration**
   - Connect to LLM API
   - Parse user commands
   - Modify canvas script based on chat
   - Call canvas reload after modifications

### Later Enhancements
- [ ] Canvas templates
- [ ] Version history / undo-redo
- [ ] Collaborative editing (real-time)
- [ ] Canvas sharing/permissions
- [ ] Import/export different formats
- [ ] Canvas search
- [ ] Keyboard shortcuts
- [ ] Canvas tags/categories
- [ ] Duplicate canvas
- [ ] Canvas analytics

## Testing

### Test Canvas Creation
```bash
# Start servers
npm run dev

# In browser:
1. Login
2. Navigate to Board page
3. Click "New Canvas"
4. Enter name "Test Canvas"
5. Canvas appears in sidebar
```

### Test Auto-save
```bash
1. Edit script in canvas area
2. Wait 2 seconds
3. Check "Last saved: Just now"
4. Refresh page
5. Canvas should load with saved script
```

### Test Chat System
```bash
1. Open ChatSidebar
2. Click "New Chat"
3. Type message and send
4. Refresh page
5. Message should persist
```

### Test Canvas Switching
```bash
1. Create multiple canvases
2. Switch between them in sidebar
3. Each should load correct script
4. Chats should change per canvas
```

## Troubleshooting

**Canvas not saving:**
- Check browser console for errors
- Verify API server is running on port 3001
- Check MongoDB connection
- Ensure username is passed correctly

**Chats not appearing:**
- Verify canvas has been fully loaded
- Check that chats array exists in database
- Ensure chat creation API is working

**Sidebar not showing thumbnails:**
- Thumbnails are optional (shows placeholder)
- Implement thumbnail generation later
- Check thumbnail URL/Base64 is valid

## Technical Notes

### Auto-save Implementation
Uses `useRef` to track timeout and prevent memory leaks:
```typescript
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Clear on unmount
return () => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
};
```

### Canvas/Chat Relationship
- One canvas has many chats
- Chats are embedded in canvas document (not separate collection)
- Benefits: Atomic updates, easier querying, faster loads
- Trade-off: Canvas document can grow large (monitor size)

### Soft Delete Strategy
- Never permanently delete immediately
- Admin can review deleted canvases
- User can potentially "undelete" (future feature)
- Keeps data integrity and audit trail

## Performance Considerations

### Current Optimizations
- Debounced auto-save (prevents DB spam)
- Only loads full canvas data when selected
- Thumbnails for quick preview without full load
- Embedded chats (single DB query per canvas)

### Future Optimizations
- Pagination for canvas list (if >50 canvases)
- Lazy load chat messages (if chat is very long)
- Compress large canvas scripts
- WebSocket for real-time collaboration
- IndexedDB for offline support

## Security Notes

### Current State (MVP)
- Basic authentication (username-based)
- No canvas sharing between users
- Simple MongoDB queries (no injection risk)

### For Production
- [ ] Add proper authentication (JWT)
- [ ] Validate canvas ownership on every request
- [ ] Sanitize user inputs
- [ ] Rate limiting on canvas saves
- [ ] Canvas size limits
- [ ] Message content filtering
