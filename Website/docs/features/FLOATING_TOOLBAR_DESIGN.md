# Floating Canvas Toolbar - Visual Design Mockup

## 🎨 Visual States

### 1. Default State (Graph View)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Canvas Content                           │
│                                                                   │
│     ╔═══════════════════════════════════════════════════╗        │
│     ║  👁️  </> │ ➖ 100% ➕ ⛶ │ 💾 Save │ ⋮              ║        │
│     ╚═══════════════════════════════════════════════════╝        │
│                                                                   │
│                         [Graph Canvas]                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Breakdown:**
- `👁️` Graph View (active/selected)
- `</>` Code View (inactive)
- `│` Divider
- `➖` Zoom Out
- `100%` Current Zoom Level
- `➕` Zoom In  
- `⛶` Fit View
- `│` Divider
- `💾 Save` Save button (when unsaved changes)
- `│` Divider
- `⋮` More menu (export options)

### 2. Saving State

```
╔═══════════════════════════════════════════════════╗
║  👁️  </> │ ➖ 100% ➕ ⛶ │ 🔄 Saving... │ ⋮        ║
╚═══════════════════════════════════════════════════╝
```

**Changes:**
- Save button replaced with animated spinner + "Saving..." text

### 3. Saved State (Brief, 2 seconds)

```
╔═══════════════════════════════════════════════════╗
║  👁️  </> │ ➖ 100% ➕ ⛶ │ 🟢 Saved │ ⋮            ║
╚═══════════════════════════════════════════════════╝
```

**Changes:**
- Green dot + "Saved" text
- Disappears after 2 seconds

### 4. Code View

```
╔═══════════════════════════════════════════════════╗
║  👁️  </> │ Format │ 💾 Save │ ⋮                  ║
╚═══════════════════════════════════════════════════╝
```

**Changes:**
- No zoom controls (graph-specific)
- "Format" button for JSON formatting

### 5. Hover State

```
╔═══════════════════════════════════════════════════╗
║  👁️  </> │ ➖ 100% ➕ ⛶ │ 💾 Save │ ⋮            ║
╚═══════════════════════════════════════════════════╝
     ▲ Slightly more opaque background
     ▲ Stronger shadow
```

### 6. More Menu Expanded

```
╔═══════════════════════════════════════════════════╗
║  👁️  </> │ ➖ 100% ➕ ⛶ │ 💾 Save │ ⋮            ║
╚═══════════════════════════════════════════════════╝
                                       │
                    ╔══════════════════╧══════╗
                    ║  Export Canvas          ║
                    ╠══════════════════════════╣
                    ║  🖼️  Export as PNG       ║
                    ║  📄  Export as PDF       ║
                    ╠──────────────────────────╣
                    ║  💾  Export as JSON      ║
                    ╚═════════════════════════╝
```

## 📐 Dimensions & Spacing

```
┌─ Floating Toolbar ─────────────────────────────────────────────┐
│                                                                  │
│  Padding: 8px (vertical) × 16px (horizontal)                   │
│  Height: 44px (compact)                                         │
│  Border Radius: 9999px (fully rounded)                          │
│  Gap between groups: 12px                                       │
│                                                                  │
│  ┌─────┐ │ ┌─────────────────┐ │ ┌────────┐ │ ┌─┐            │
│  │View │ │ │   Zoom Group    │ │ │  Save  │ │ │⋮│            │
│  │Mode │ │ │  (Graph only)   │ │ │ Status │ │ └─┘            │
│  └─────┘ │ └─────────────────┘ │ └────────┘ │                 │
│   80px       200px                100px        32px            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
          Total Width: ~450-500px (flexible based on content)
```

## 🎨 Color Scheme (Tailwind Classes)

### Background
```css
/* Normal State */
bg-card/80             /* Card background at 80% opacity */
backdrop-blur-md       /* Medium blur for glass effect */

/* Hover State */
bg-card/90             /* Card background at 90% opacity */
```

### Border & Shadow
```css
border border-border   /* Subtle border */
shadow-lg              /* Large shadow for depth */

/* Hover State */
shadow-xl              /* Extra large shadow on hover */
```

### Buttons
```css
/* Icon Buttons */
h-8 w-8 p-0 rounded-full

/* Active (Selected View Mode) */
bg-primary text-primary-foreground

/* Inactive/Ghost */
variant="ghost"
```

### Icons
```css
className="h-4 w-4"    /* 16px icons */
className="h-3 w-3"    /* 12px for small icons (spinner) */
```

### Text
```css
text-xs                /* 12px for labels */
font-medium            /* Medium weight */
text-muted-foreground  /* Muted color for secondary text */
```

## 🌈 Visual Hierarchy

### Z-Index Layers
```
Layer 5: Dropdown Menu Content (z-50 + dropdown z-index)
Layer 4: Tooltips (z-50 + tooltip z-index)
Layer 3: Floating Toolbar (z-50)
Layer 2: Canvas Content (z-10)
Layer 1: Background (z-0)
```

## 📱 Responsive Behavior

### Desktop (> 1024px)
- Full toolbar with all controls visible
- Centered at top of canvas

### Tablet (768px - 1024px)
- Slightly reduced padding
- Icons remain same size

### Mobile (< 768px)
- **Consideration**: May need to adapt to vertical toolbar on left/right edge
- Or switch to bottom toolbar
- **Current implementation**: Optimized for desktop/tablet

## ✨ Animation & Transitions

### Hover Transition
```css
transition-all duration-200
```
- Background opacity: 80% → 90%
- Shadow: lg → xl
- Duration: 200ms

### Save Status Changes
- Fade in/out: 200ms
- Brief display: 2 seconds for "Saved" status

### View Mode Toggle
- Instant switch (no animation)
- Background color transition: 200ms

### Zoom Level Update
- Number change: Instant
- Updates every 200ms

## 🔍 Tooltips

### Positioning
```css
side="bottom"          /* Appear below buttons */
```

### Content Examples
- "Graph View"
- "Code View"
- "Zoom In (Ctrl + =)"
- "Zoom Out (Ctrl + -)"
- "Fit View (Ctrl + 0)"
- "Format JSON"
- "Save Changes (Ctrl + S)"
- "More Options"

### Delay
```tsx
delayDuration={300}    /* 300ms before showing */
```

## 🎯 Interactive States

### Button States
1. **Normal**: Base styling
2. **Hover**: Slight background change
3. **Active/Pressed**: Darker shade
4. **Disabled**: Reduced opacity, no pointer events
5. **Selected** (View mode): Primary color background

### Dropdown Menu States
1. **Closed**: Just the ⋮ icon visible
2. **Opening**: Slide down animation (Radix UI default)
3. **Open**: Full menu visible with items
4. **Closing**: Fade out animation

## 🖼️ Context-Specific Layouts

### Graph View - Full Controls
```
[ 👁️ Active ] [ </> ] │ [ ➖ ] [ 100% ] [ ➕ ] [ ⛶ ] │ [ Save ] │ [ ⋮ ]
```

### Code View - Simplified Controls  
```
[ 👁️ ] [ </> Active ] │ [ Format ] │ [ Save ] │ [ ⋮ ]
```

### Saving State - Any View
```
[ View Toggle ] │ [ ... ] │ [ 🔄 Saving... ] │ [ ⋮ ]
```

### No Unsaved Changes - Any View
```
[ View Toggle ] │ [ ... ] │ [ 🟢 Saved ] │ [ ⋮ ]
                              ↑ Temporary
```

## 📊 Comparison: Before vs After

### Before (Old Full-Width Toolbar)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Canvas Name                                                │ │
│ │  Last saved: 2m ago                                         │ │
│ │                                                             │ │
│ │  [Graph][Code] [Zoom-] [Zoom+] [Fit] [Format] [Save] [PNG]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                         Canvas Content                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```
❌ Takes up significant vertical space  
❌ Always visible, even when not needed  
❌ Cluttered with many buttons  
❌ Static header feeling  

### After (New Floating Toolbar)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│     ╔═══════════════════════════════════════════════════╗        │
│     ║  👁️  </> │ ➖ 100% ➕ ⛶ │ 💾 Save │ ⋮              ║        │
│     ╚═══════════════════════════════════════════════════╝        │
│                                                                   │
│                         Canvas Content                           │
│                         (Full Height)                            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```
✅ Minimal vertical space usage  
✅ Floats over content  
✅ Clean, grouped controls  
✅ Modern, app-like feeling  
✅ More canvas space

## 🎬 User Interaction Flow

### Zooming In/Out
1. User hovers over toolbar → Shadow increases
2. User clicks ➕ or ➖ → Canvas zooms
3. Zoom level updates in real-time (200ms polling)
4. Number animates: `100%` → `125%`

### Saving Changes
1. User edits canvas → "Save" button appears
2. User waits 2 seconds → Auto-saves with "Saving..." indicator
3. OR user clicks "Save" → Immediate save
4. Save completes → "🟢 Saved" appears briefly
5. After 2 seconds → "Saved" indicator disappears

### Switching Views
1. User clicks </> icon → View switches to code
2. Toolbar updates: Zoom controls hidden, Format button appears
3. Code editor loads
4. Canvas data preserved

### Exporting Canvas
1. User clicks ⋮ → Dropdown opens
2. User selects export format
3. Export process begins
4. File downloads
5. Toast notification appears

---

**Design Philosophy**: Minimal, functional, and beautiful. Every element has a purpose, and the UI gets out of the way to let users focus on their canvas.
