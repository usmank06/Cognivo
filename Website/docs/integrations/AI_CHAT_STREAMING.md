# AI Chat Streaming with Canvas Editing

## Overview

The AI Chat system allows users to have natural language conversations with Claude AI that can:
- Answer questions about data and visualizations
- Edit the canvas in real-time by modifying the JSON structure
- Stream responses word-by-word for better UX
- Show "Editing canvas..." spinner when making changes
- Handle multiple chats per canvas with full conversation history

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER TYPES MESSAGE                           │
│                    (ChatSidebar.tsx)                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ POST /api/chat/stream
                       │ {
                       │   messages: [...conversation history],
                       │   canvasId: "canvas-123",
                       │   username: "user"
                       │ }
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                EXPRESS API SERVER                               │
│                (api-server.js)                                  │
│                                                                 │
│  1. Gets current canvas JSON                                    │
│  2. Gets user's completed data files                            │
│  3. Proxies request to Python API                              │
│  4. Streams response back to frontend                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ POST /api/chat/stream
                       │ {
                       │   messages: [...],
                       │   current_canvas: "{...}",
                       │   data_sources: [...]
                       │ }
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PYTHON FASTAPI                                │
│                   (main.py)                                     │
│                                                                 │
│  1. Builds system prompt with context:                          │
│     - Current canvas state (nodes, edges)                       │
│     - Available data sources (files, schemas, subsets)          │
│                                                                 │
│  2. Streams Claude response:                                    │
│     async with anthropic_client.messages.stream(...):           │
│       - Text deltas → {"type": "text_delta", "text": "..."}    │
│       - Tool use starts → {"type": "tool_start", ...}          │
│       - Tool finishes → {"type": "tool_finish", ...}           │
│       - Canvas update → {"type": "canvas_update", "canvas": ...}│
│       - Done → {"type": "done", "usage": {...}}                │
│                                                                 │
│  3. Claude Tools:                                               │
│     - edit_canvas: Modify canvas JSON                           │
│       - Input: canvas_json (string), explanation (string)       │
│       - Returns: Complete new canvas structure                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ Server-Sent Events (Line-delimited JSON)
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND                                   │
│                   (ChatSidebar.tsx)                             │
│                                                                 │
│  Reads stream line-by-line:                                     │
│                                                                 │
│  {"type": "text_delta", "text": "I'll"}                        │
│    → Append to streaming text                                   │
│                                                                 │
│  {"type": "text_delta", "text": " help"}                       │
│    → Append to streaming text                                   │
│                                                                 │
│  {"type": "tool_start", "tool_name": "edit_canvas"}            │
│    → Show spinner: "🔧 Editing canvas..."                      │
│                                                                 │
│  {"type": "canvas_update", "canvas": "{...}"}                  │
│    → Update canvas in database                                  │
│    → Reload canvas to show changes                              │
│    → Hide spinner                                               │
│                                                                 │
│  {"type": "text_delta", "text": " you"}                        │
│    → Continue streaming text                                    │
│                                                                 │
│  {"type": "done", "usage": {...}}                              │
│    → Save complete message to database                          │
│    → Enable input field                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-api
pip install -r requirements.txt
```

This installs:
- `anthropic` - Claude AI Python SDK
- `python-dotenv` - Environment variable management

### 2. Configure API Key

Create `.env` file in `python-api/` directory:

```bash
cd python-api
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your API key from: https://console.anthropic.com/settings/keys

### 3. Start All Servers

From the root `Website/` directory:

```bash
npm run dev
```

This starts:
- Vite frontend (port 5173)
- Express API (port 3001)
- Python API (port 8000) - **Now with Claude AI!**

### 4. Verify Setup

Check Python API health:

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "message": "Python API is running!",
  "anthropic_configured": true
}
```

## How It Works

### Stream Event Types

The Python API emits different event types as JSON lines:

#### 1. Text Delta (Streaming Response)
```json
{"type": "text_delta", "text": "I can"}
{"type": "text_delta", "text": " help"}
{"type": "text_delta", "text": " you"}
```

Frontend: Appends each text piece to build the complete message word-by-word.

#### 2. Tool Start (Canvas Editing Begins)
```json
{
  "type": "tool_start",
  "tool_name": "edit_canvas",
  "message": "🔧 Editing canvas..."
}
```

Frontend: Shows spinner with "Editing canvas..." text.

#### 3. Canvas Update (New Canvas Structure)
```json
{
  "type": "canvas_update",
  "canvas": "{\"nodes\": [...], \"edges\": [...]}",
  "explanation": "Added a bar chart showing sales data"
}
```

Frontend:
1. Updates canvas in MongoDB
2. Calls `onReloadCanvas()` to refresh the canvas view
3. Shows success toast

#### 4. Tool Finish (Canvas Editing Done)
```json
{
  "type": "tool_finish",
  "tool_name": "edit_canvas"
}
```

Frontend: Hides spinner, continues streaming text.

#### 5. Done (Stream Complete)
```json
{
  "type": "done",
  "usage": {
    "input_tokens": 1523,
    "output_tokens": 847
  }
}
```

Frontend:
1. Saves complete message to database
2. Re-enables input field
3. Can track token usage for billing

#### 6. Error (Something Went Wrong)
```json
{
  "type": "error",
  "error": "Anthropic API key not configured"
}
```

Frontend: Shows error toast, stops streaming.

## Example User Flow

### Scenario: User asks AI to add a chart

**User Input:**
```
"Add a bar chart showing sales by category"
```

**Stream Events:**

```json
{"type": "text_delta", "text": "I'll"}
{"type": "text_delta", "text": " create"}
{"type": "text_delta", "text": " a"}
{"type": "text_delta", "text": " bar"}
{"type": "text_delta", "text": " chart"}
{"type": "text_delta", "text": " for"}
{"type": "text_delta", "text": " you."}

{"type": "tool_start", "tool_name": "edit_canvas", "message": "🔧 Editing canvas..."}

{"type": "canvas_update", "canvas": "{\"nodes\":[{\"id\":\"chart-1\",\"type\":\"chart\",\"position\":{\"x\":100,\"y\":100},\"data\":{\"chartType\":\"bar\",\"dataSource\":\"file-abc123\",\"subset\":\"sales-by-category\"}}],\"edges\":[]}", "explanation": "Added bar chart with sales by category data"}

{"type": "tool_finish", "tool_name": "edit_canvas"}

{"type": "text_delta", "text": " I've"}
{"type": "text_delta", "text": " added"}
{"type": "text_delta", "text": " the"}
{"type": "text_delta", "text": " chart"}
{"type": "text_delta", "text": " to"}
{"type": "text_delta", "text": " your"}
{"type": "text_delta", "text": " canvas!"}

{"type": "done", "usage": {"input_tokens": 892, "output_tokens": 456}}
```

**What User Sees:**

1. Text appears word-by-word: "I'll create a bar chart for you."
2. Spinner appears: "🔧 Editing canvas..."
3. Canvas updates in real-time (new chart appears)
4. Spinner disappears
5. More text: "I've added the chart to your canvas!"
6. Input field re-enabled

## System Prompt

The Python API builds a system prompt with context:

```python
system_prompt = f"""You are an AI assistant helping users build data visualizations on a canvas.

**Current Canvas State:**
- Nodes: 3
- Edges: 2
- Full JSON: {current_canvas}

**Available Data Sources:**
- sales.csv: 5 columns, 1500 rows, 3 pre-generated visualizations
- customers.xlsx: 12 columns, 450 rows, 2 pre-generated visualizations

**Your Capabilities:**
1. Have conversations about data analysis and visualization
2. Use the `edit_canvas` tool to modify the canvas by providing new JSON
3. Add nodes (charts, text, shapes) and connections (edges)
4. Reference data sources in visualizations

**Canvas JSON Format:**
{{
  "nodes": [
    {{
      "id": "unique-id",
      "type": "text|shape|chart|table",
      "position": {{"x": 100, "y": 100}},
      "data": {{
        "label": "Node content",
        "dataSource": "file-id",
        "subset": "subset-description"
      }}
    }}
  ],
  "edges": [...]
}}

Be creative, helpful, and make beautiful visualizations!
"""
```

This gives Claude full context about:
- What's currently on the canvas
- What data is available
- How to structure canvas JSON
- What tools it can use

## Claude Tools

### edit_canvas Tool

**Description:** Edit the canvas by modifying its JSON structure. Use this to add, remove, or modify nodes and edges.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "canvas_json": {
      "type": "string",
      "description": "The complete new canvas JSON structure with nodes and edges"
    },
    "explanation": {
      "type": "string",
      "description": "Brief explanation of what was changed"
    }
  },
  "required": ["canvas_json", "explanation"]
}
```

**Example Tool Use:**

Claude decides to edit canvas and emits:

```json
{
  "name": "edit_canvas",
  "input": {
    "canvas_json": "{\"nodes\":[...new structure...],\"edges\":[...]}",
    "explanation": "Added a pie chart showing distribution"
  }
}
```

Python API:
1. Validates the JSON
2. Sends `canvas_update` event to frontend
3. Frontend updates MongoDB
4. Canvas reloads automatically

## Frontend Implementation

### ChatSidebar Component

**Key State:**
```typescript
const [isStreaming, setIsStreaming] = useState(false);
const [streamingText, setStreamingText] = useState('');
const [isEditingCanvas, setIsEditingCanvas] = useState(false);
```

**Sending Messages:**
```typescript
const handleSendMessage = async () => {
  // 1. Save user message to DB
  // 2. Build conversation history
  // 3. Call Express API /api/chat/stream
  // 4. Read stream line-by-line
  // 5. Handle each event type
  // 6. Save assistant response when done
};
```

**Reading Stream:**
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    const event = JSON.parse(line);
    handleEvent(event);
  }
}
```

**Displaying Stream:**
```tsx
{isStreaming && streamingText && (
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
      <p>{streamingText}</p>
      {isEditingCanvas && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Editing canvas...</span>
        </div>
      )}
    </div>
  </div>
)}
```

## Token Tracking

The system returns token usage in the `done` event:

```json
{
  "type": "done",
  "usage": {
    "input_tokens": 1523,
    "output_tokens": 847
  }
}
```

You can track this using the existing token tracking system:

```typescript
import { trackClaude } from './db/tokenTracker';

// After receiving 'done' event
const totalTokens = usage.input_tokens + usage.output_tokens;
await trackClaude(username, totalTokens);
```

This updates the user's token and cost counters visible in the Settings page.

## Error Handling

### Missing API Key

If `ANTHROPIC_API_KEY` is not set:

```json
{"type": "error", "error": "Anthropic API key not configured"}
```

Frontend shows: "AI Error: Anthropic API key not configured"

### Invalid Canvas JSON

If Claude generates invalid JSON:

```json
{"type": "error", "error": "Invalid canvas JSON: Unexpected token..."}
```

### Network Issues

Frontend catches network errors and shows toast:
```typescript
catch (error: any) {
  if (error.name === 'AbortError') {
    // User navigated away
  } else {
    toast.error('Failed to get AI response');
  }
}
```

## Testing

### Test the Python API Directly

```bash
curl -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, can you help me?"}
    ],
    "current_canvas": "{\"nodes\":[],\"edges\":[]}",
    "data_sources": []
  }'
```

You'll see streaming JSON events in the response.

### Test Through Frontend

1. Start all servers: `npm run dev`
2. Login to application
3. Go to Canvas page
4. Create a new canvas
5. Click "New Chat" in ChatSidebar
6. Type: "Add a text node saying Hello World"
7. Watch the stream appear word-by-word
8. Watch spinner when editing canvas
9. See canvas update in real-time

## Conversation History

Each chat maintains full conversation history:

```typescript
const conversationHistory = [
  { role: 'user', content: 'Add a chart' },
  { role: 'assistant', content: 'I added a bar chart for you' },
  { role: 'user', content: 'Make it bigger' },
  { role: 'assistant', content: 'I increased the size' },
  // Current message
  { role: 'user', content: 'Change the color to blue' }
];
```

This is sent to Python API each time, giving Claude full context of the conversation.

## Multiple Chats Per Canvas

- Each canvas can have multiple chats
- Select different chats via dropdown
- Each chat has independent conversation history
- All chats can edit the same canvas
- Chat history persists in MongoDB

## Performance Notes

### Streaming Benefits

- **Perceived Performance:** Users see responses immediately, not after waiting for full completion
- **Interruptible:** Can navigate away while streaming (abort controller cleans up)
- **Progress Feedback:** Spinner shows when AI is working on canvas edits

### Token Costs

Claude Sonnet 4 pricing (as of Oct 2024):
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

Typical conversation:
- System prompt: ~500 tokens
- User message: ~50 tokens
- Canvas JSON: ~200 tokens
- Data sources: ~300 tokens/file
- Assistant response: ~200 tokens

**Example:**
- Input: 1,050 tokens → $0.003
- Output: 200 tokens → $0.003
- **Total per message: ~$0.006**

## Security Considerations

### Current (MVP) State

✅ API key in .env (not in code)  
✅ Only processes data for authenticated users  
✅ Validates canvas ownership before updates  
⚠️ No rate limiting on chat requests  
⚠️ No input validation on message length  

### For Production

- [ ] Add rate limiting (e.g., 10 messages per minute)
- [ ] Validate message length (max 10,000 chars)
- [ ] Add prompt injection protection
- [ ] Monitor API costs per user
- [ ] Add user quotas for AI usage
- [ ] Sanitize canvas JSON before saving
- [ ] Add abuse detection

## Future Enhancements

### Short-term
- [ ] Add "Stop generating" button
- [ ] Show typing indicator before first token
- [ ] Add message regeneration
- [ ] Add edit previous message
- [ ] Copy message to clipboard

### Medium-term
- [ ] Multiple canvas editing operations in one response
- [ ] Image generation for thumbnails
- [ ] Data analysis tools (statistics, correlations)
- [ ] Export conversation as markdown
- [ ] Voice input for messages

### Long-term
- [ ] Multi-modal: Upload images to chat
- [ ] Collaborative editing: Multiple users chatting
- [ ] Fine-tuned model for canvas generation
- [ ] Custom tools for specific data operations
- [ ] Integration with external APIs (Google Sheets, etc.)

## Troubleshooting

### Stream not appearing

**Check:**
1. Python API is running: `curl http://localhost:8000/health`
2. API key is set: Check response includes `"anthropic_configured": true`
3. Browser console for errors
4. Network tab in DevTools (should see streaming response)

### Canvas not updating

**Check:**
1. Express API can reach MongoDB
2. Canvas ID is correct
3. User has permission to edit canvas
4. Check browser console for `canvas_update` event
5. Check `onReloadCanvas()` is being called

### "Editing canvas..." spinner never stops

**Check:**
1. Look for `tool_finish` event in network response
2. Check if canvas JSON is valid
3. Look for errors in Python API logs
4. Verify Claude completed tool use correctly

### High API costs

**Check:**
1. Token usage in `done` events
2. Verify system prompt isn't too long
3. Check if sending too much data source info
4. Consider caching frequent queries
5. Add rate limiting

## Summary

This implementation provides:

✅ **Real-time streaming** - Word-by-word text appearance  
✅ **Canvas editing** - AI can modify the canvas via tools  
✅ **Progress indicators** - Spinner when editing canvas  
✅ **Full history** - Conversation persists across sessions  
✅ **Multiple chats** - Each canvas has independent chats  
✅ **Error handling** - Graceful failures with user feedback  
✅ **Token tracking** - Monitor AI usage and costs  

The system is production-ready pending security hardening and rate limiting!
