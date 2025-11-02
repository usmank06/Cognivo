# Quick Start Commands - Graph Canvas Integration

## Run These Commands in Order

### 1. Install Dependencies
```cmd
cd c:\Users\usman\Desktop\Data-Platform-MVP\Website
npm install
```

### 2. Verify Installation
```cmd
npm list reactflow html-to-image jspdf
```

### 3. Start Development Server
```cmd
npm run dev
```

### 4. Start Python API (Separate Terminal)
```cmd
cd c:\Users\usman\Desktop\Data-Platform-MVP\Website\python-api
python main.py
```

### 5. Open Browser
Navigate to: `http://localhost:5173`

---

## Quick Test

1. Login
2. Open a canvas
3. Click "Graph" button (should be selected by default)
4. Upload a CSV file in chat
5. Ask AI: "Add a bar chart showing [column] by [column]"
6. Watch the chart appear in graph view! 🎉

---

## Export Tests

- **PNG**: Click "PNG" button → downloads image
- **PDF**: Click "PDF" button → downloads PDF
- **JSON**: Switch to "Code" → click "JSON" button

---

## Files Created
- `src/components/board/canvas/types.ts`
- `src/components/board/canvas/ChartNode.tsx`
- `src/components/board/canvas/ElementNode.tsx`
- `src/components/board/canvas/GraphCanvas.tsx`

## Files Modified
- `package.json`
- `src/components/board/CanvasArea.tsx`

---

See `GRAPH_CANVAS_INTEGRATION_COMPLETE.md` for full details.
