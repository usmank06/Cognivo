# Graph Canvas JSON Documentation

## Overview

This document provides a comprehensive guide on how to create the JSON object structure that defines graphs in the Graph Canvas application. The graph consists of **nodes** (chart elements, text elements, dividers) and **edges** (connections between nodes).

---

## Table of Contents

1. [Main Graph Structure](#main-graph-structure)
2. [Node Types](#node-types)
3. [Chart Nodes](#chart-nodes)
4. [Element Nodes](#element-nodes)
5. [Edges](#edges)
6. [Complete Examples](#complete-examples)

---

## Main Graph Structure

The top-level JSON object has three main properties:

```json
{
  "nodes": [...],      // Array of node objects
  "edges": [...],      // Array of edge objects (connections)
  "viewport": {        // Optional: Initial view settings
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

### Properties

- **`nodes`** (required): Array of node objects defining charts, text, and dividers
- **`edges`** (optional): Array of edge objects connecting nodes
- **`viewport`** (optional): Initial camera position and zoom level

---

## Node Types

There are two main node types:

1. **`chart`** - For displaying interactive charts
2. **`element`** - For text elements and dividers

### Base Node Structure

Every node must have these properties:

```json
{
  "id": "unique-id",           // Unique identifier (string)
  "type": "chart" | "element", // Node type ("default" also supported but not commonly used)
  "position": {                // Position on canvas
    "x": 0,
    "y": 0
  },
  "style": {                   // Visual styling (optional but recommended)
    "width": 400,              // Width in pixels
    "height": 300              // Height in pixels
  },
  "data": {                    // Node-specific data (varies by type)
    ...
  }
}
```

**Note**: The `type` field can be:
- `"chart"` - For chart nodes (uses ChartNode component)
- `"element"` - For text/layout elements (uses ElementNode component)  
- `"default"` - Default ReactFlow node (rarely used in this app)

---

## Chart Nodes

Chart nodes display interactive data visualizations using Recharts.

### Chart Node Structure

```json
{
  "id": "chart1",              // Required: unique identifier
  "type": "chart",             // Required: must be "chart"
  "position": { "x": 0, "y": 0 },  // Required: canvas position
  "style": { "width": 400, "height": 300 },  // Optional but recommended
  "data": {
    "label": "Chart Title",  // Optional: chart title (default: "[KIND] Chart")
    "kind": "line",          // Required: chart type (see table below)
    "xKey": "x",             // Required for most charts: data key for X-axis
    "yKey": "y",             // Required: data key for Y-axis/values
    "zKey": "z",             // Optional: for scatter (bubble size) and sankey
    "nameKey": "name",       // Required for pie/funnel/treemap: category names
    "data": [...],           // Required: chart data array (must not be empty)
    "style": {...}           // Optional: chart styling options (uses defaults if omitted)
  }
}
```

**Important Notes**:
- All chart nodes MUST have `data.data` array with at least one object
- Keys (`xKey`, `yKey`, etc.) must match actual property names in your data objects
- If `style` is omitted, sensible defaults are applied (grid on, legend on, blue colors)

### Default Values for Omitted Fields

If you omit these fields, the following defaults are used:

| Field | Default Value | Notes |
|-------|--------------|-------|
| `data.kind` | `"line"` | Defaults to line chart |
| `data.label` | `"[KIND] CHART"` | e.g., "LINE Chart" or "PIE Chart" |
| `data.xKey` | `"x"` | For X-axis data |
| `data.yKey` | `"y"` | For Y-axis data |
| `data.zKey` | `"z"` | For scatter Z-axis |
| `data.nameKey` | `"name"` | For pie/funnel/treemap categories |
| `data.data` | `[]` | Empty array (chart won't display) |

**Additional Optional Field**:
- `data.notes` - String field for storing notes/comments (not displayed, for metadata only)

### Chart Types (`kind`)

The following chart types are supported:

| Type | Description | Required Keys | Special Keys |
|------|-------------|---------------|--------------|
| `line` | Line chart | xKey, yKey | - |
| `bar` | Bar chart | xKey, yKey | - |
| `area` | Area chart | xKey, yKey | - |
| `composed` | Multi-series combined chart | xKey, yKey | secondaryKey, tertiaryKey |
| `pie` | Pie/Donut chart | nameKey, yKey | - |
| `radar` | Radar/Spider chart | xKey, yKey | secondaryKey |
| `radialBar` | Radial bar chart | yKey | - |
| `scatter` | Scatter plot | xKey, yKey, zKey | - |
| `funnel` | Funnel chart | nameKey, yKey | - |
| `treemap` | Treemap | nameKey, yKey | - |
| `sankey` | Sankey diagram | Special format | - |

### Chart Data Format

Each chart type expects data in a specific format:

#### Standard Charts (Line, Bar, Area, Composed, Scatter)

```json
"data": [
  { "x": "Mon", "y": 120 },
  { "x": "Tue", "y": 180 },
  { "x": "Wed", "y": 150 }
]
```

#### Pie, Funnel, Treemap

```json
"data": [
  { "name": "Category A", "value": 35 },
  { "name": "Category B", "value": 25 },
  { "name": "Category C", "value": 40 }
]
```

#### Radar

```json
"data": [
  { "subject": "Math", "A": 120, "B": 110 },
  { "subject": "Science", "A": 98, "B": 130 },
  { "subject": "English", "A": 86, "B": 130 }
]
```

#### Radial Bar

```json
"data": [
  { "name": "18-24", "uv": 31.47, "fill": "#8884d8" },
  { "name": "25-29", "uv": 26.69, "fill": "#83a6ed" }
]
```

**Note**: RadialBar supports optional `fill` property per data item for custom colors per segment

#### Sankey (Special Format)

```json
"data": [
  { "type": "node", "name": "Visit", "value": 357898 },
  { "type": "node", "name": "Click", "value": 354170 },
  { "type": "link", "source": 0, "target": 1, "value": 354170 }
]
```

### Chart Style Options

The `style` object within chart data controls visual appearance:

```json
"style": {
  // Common Options (most charts)
  "showGrid": true,              // Show grid lines (line, bar, area, composed, scatter)
  "showLegend": true,            // Show legend
  "showTooltip": true,           // Show tooltips on hover
  "strokeColor": "#8884d8",      // Line/stroke color
  "fillColor": "#8884d8",        // Fill color
  "fillOpacity": 0.8,            // Fill opacity (0-1)
  "strokeWidth": 2,              // Line width
  
  // Line/Area Specific
  "lineType": "monotone",        // "monotone" | "linear" | "step" | "stepBefore" | "stepAfter" | "basis"
  "showDots": true,              // Show data points on line
  
  // Bar Specific
  "barSize": 20,                 // Width of bars
  "stackOffset": "none",         // "expand" | "none" | "wiggle" | "silhouette" | "sign"
  
  // Pie/Radial Specific
  "innerRadius": 0,              // Inner radius (0 for pie, >0 for donut)
  "outerRadius": 80,             // Outer radius
  "startAngle": 0,               // Start angle in degrees
  "endAngle": 360,               // End angle in degrees
  "showLabels": false,           // Show value labels
  
  // Radar Specific
  "radarFillOpacity": 0.6,       // Fill opacity for radar
  
  // Scatter Specific
  "scatterSize": 64,             // Bubble size
  
  // Multi-Series
  "secondaryKey": "revenue",     // Second data series key
  "tertiaryKey": "profit",       // Third data series key (composed only)
  "composedTypes": ["line", "bar", "area"]  // Types for composed chart
}
```

---

## Element Nodes

Element nodes are for text, headers, and dividers.

### Element Types (`kind`)

| Type | Description | Use Case |
|------|-------------|----------|
| `title` | Large title text | Page/dashboard titles |
| `sectionHeader` | Section header text | Group headers |
| `horizontalDivider` | Horizontal line | Visual separation |
| `verticalDivider` | Vertical line | Column separation |

### Title Node

```json
{
  "id": "title1",
  "type": "element",
  "position": { "x": 0, "y": 0 },
  "style": { "width": 600, "height": 80 },
  "data": {
    "kind": "title",
    "text": "Dashboard Title",
    "fontSize": 48,
    "fontWeight": "bold",            // "normal" | "500" | "600" | "bold"
    "textAlign": "center",           // "left" | "center" | "right"
    "textColor": "#1f2937",
    "backgroundColor": "transparent" // Any hex color or "transparent"
  }
}
```

### Section Header Node

```json
{
  "id": "header1",
  "type": "element",
  "position": { "x": 0, "y": 100 },
  "style": { "width": 800, "height": 60 },
  "data": {
    "kind": "sectionHeader",
    "text": "Sales Overview",
    "fontSize": 24,
    "fontWeight": "600",
    "textAlign": "left",
    "textColor": "#374151",
    "backgroundColor": "#f3f4f6"
  }
}
```

### Horizontal Divider Node

```json
{
  "id": "divider1",
  "type": "element",
  "position": { "x": 0, "y": 200 },
  "style": { "width": 800, "height": 10 },
  "data": {
    "kind": "horizontalDivider",
    "dividerColor": "#e5e7eb",
    "dividerThickness": 2
  }
}
```

### Vertical Divider Node

```json
{
  "id": "vdivider1",
  "type": "element",
  "position": { "x": 400, "y": 0 },
  "style": { "width": 10, "height": 300 },
  "data": {
    "kind": "verticalDivider",
    "dividerColor": "#e5e7eb",
    "dividerThickness": 2
  }
}
```

---

## Edges

Edges connect nodes to show relationships.

### Edge Structure

```json
{
  "id": "edge1",           // Unique identifier
  "source": "node1",       // Source node ID
  "target": "node2",       // Target node ID
  "label": "connects to",  // Optional: Label text
  "type": "default"        // Optional: Edge type
}
```

### Edge Types

- `default` - Straight line with arrow
- `step` - Step-wise connection
- `smoothstep` - Smooth step connection
- `straight` - Straight line (no curve)

---

## Complete Examples

### Example 1: Simple Line Chart

```json
{
  "nodes": [
    {
      "id": "line1",
      "type": "chart",
      "position": { "x": 100, "y": 100 },
      "style": { "width": 400, "height": 250 },
      "data": {
        "label": "Weekly Sales",
        "kind": "line",
        "xKey": "day",
        "yKey": "sales",
        "style": {
          "showGrid": true,
          "showLegend": true,
          "strokeColor": "#8884d8",
          "strokeWidth": 2,
          "lineType": "monotone"
        },
        "data": [
          { "day": "Mon", "sales": 120 },
          { "day": "Tue", "sales": 180 },
          { "day": "Wed", "sales": 150 },
          { "day": "Thu", "sales": 220 },
          { "day": "Fri", "sales": 260 }
        ]
      }
    }
  ],
  "edges": []
}
```

### Example 2: Dashboard with Title and Charts

```json
{
  "nodes": [
    {
      "id": "title",
      "type": "element",
      "position": { "x": 100, "y": 0 },
      "style": { "width": 800, "height": 80 },
      "data": {
        "kind": "title",
        "text": "Sales Dashboard",
        "fontSize": 48,
        "fontWeight": "bold",
        "textAlign": "center",
        "textColor": "#1f2937",
        "backgroundColor": "transparent"
      }
    },
    {
      "id": "divider",
      "type": "element",
      "position": { "x": 100, "y": 90 },
      "style": { "width": 800, "height": 8 },
      "data": {
        "kind": "horizontalDivider",
        "dividerColor": "#e5e7eb",
        "dividerThickness": 2
      }
    },
    {
      "id": "chart1",
      "type": "chart",
      "position": { "x": 100, "y": 120 },
      "style": { "width": 380, "height": 280 },
      "data": {
        "label": "Revenue Trend",
        "kind": "area",
        "xKey": "month",
        "yKey": "revenue",
        "style": {
          "showGrid": true,
          "fillColor": "#8884d8",
          "fillOpacity": 0.6
        },
        "data": [
          { "month": "Jan", "revenue": 4000 },
          { "month": "Feb", "revenue": 3000 },
          { "month": "Mar", "revenue": 5000 }
        ]
      }
    },
    {
      "id": "chart2",
      "type": "chart",
      "position": { "x": 520, "y": 120 },
      "style": { "width": 380, "height": 280 },
      "data": {
        "label": "Product Share",
        "kind": "pie",
        "nameKey": "name",
        "yKey": "value",
        "style": {
          "showLegend": true,
          "innerRadius": 50,
          "outerRadius": 100
        },
        "data": [
          { "name": "Product A", "value": 35 },
          { "name": "Product B", "value": 25 },
          { "name": "Product C", "value": 40 }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "chart1",
      "target": "chart2",
      "label": "breakdown"
    }
  ]
}
```

### Example 3: Multi-Series Comparison

```json
{
  "nodes": [
    {
      "id": "composed1",
      "type": "chart",
      "position": { "x": 100, "y": 100 },
      "style": { "width": 500, "height": 350 },
      "data": {
        "label": "Revenue vs Expenses vs Profit",
        "kind": "composed",
        "xKey": "quarter",
        "yKey": "revenue",
        "style": {
          "showGrid": true,
          "showLegend": true,
          "showTooltip": true,
          "fillColor": "#8884d8",
          "strokeColor": "#ff7300",
          "secondaryKey": "expenses",
          "tertiaryKey": "profit"
        },
        "data": [
          { "quarter": "Q1", "revenue": 4000, "expenses": 2400, "profit": 1600 },
          { "quarter": "Q2", "revenue": 3000, "expenses": 1398, "profit": 1602 },
          { "quarter": "Q3", "revenue": 2000, "expenses": 9800, "profit": -7800 },
          { "quarter": "Q4", "revenue": 2780, "expenses": 3908, "profit": -1128 }
        ]
      }
    }
  ],
  "edges": []
}
```

---

## Best Practices

### 1. Node IDs
- Use descriptive, unique IDs: `"sales-chart-1"` instead of `"node1"`
- Keep IDs consistent between nodes and edges

### 2. Positioning
- Plan your layout on paper first
- Use consistent spacing (e.g., 450px between columns)
- Leave room for titles and dividers

### 3. Sizing
- Minimum chart size: 240x180px
- Recommended chart size: 400x280px
- Title height: 60-100px
- Section header height: 50-70px

### 4. Colors
- Use consistent color palette across charts
- Default colors: `#8884d8`, `#82ca9d`, `#ffc658`
- Use Tailwind color codes for text elements

### 5. Data Keys
- Keep key names consistent across related charts
- Use descriptive key names: `"revenue"` instead of `"y"`
- Required keys depend on chart type - see chart type table

### 6. Viewport
- Omit viewport for auto-fit behavior
- Set viewport to control initial view:
  ```json
  "viewport": { "x": -100, "y": -50, "zoom": 0.8 }
  ```

---

## Common Patterns

### Pattern 1: Two-Column Layout

```json
{
  "nodes": [
    { "position": { "x": 0, "y": 0 }, "style": { "width": 400, "height": 300 } },
    { "position": { "x": 450, "y": 0 }, "style": { "width": 400, "height": 300 } }
  ]
}
```

### Pattern 2: Grid Layout (2x2)

```json
{
  "nodes": [
    { "position": { "x": 0, "y": 0 } },
    { "position": { "x": 450, "y": 0 } },
    { "position": { "x": 0, "y": 350 } },
    { "position": { "x": 450, "y": 350 } }
  ]
}
```

### Pattern 3: Title + Divider + Content

```json
{
  "nodes": [
    { "type": "element", "position": { "x": 0, "y": 0 }, "data": { "kind": "title" } },
    { "type": "element", "position": { "x": 0, "y": 90 }, "data": { "kind": "horizontalDivider" } },
    { "type": "chart", "position": { "x": 0, "y": 120 } }
  ]
}
```

---

## Troubleshooting

### Issue: Chart doesn't display
- ✅ Check `data` array is not empty
- ✅ Verify `xKey`/`yKey` match data object keys
- ✅ Ensure `kind` is a valid chart type

### Issue: Labels not showing
- ✅ Set `style.showLabels: true` for pie/funnel/treemap
- ✅ Check font size isn't too large for node size

### Issue: Multiple series not appearing
- ✅ Use `secondaryKey` and `tertiaryKey` in style
- ✅ Ensure data objects contain those keys

### Issue: Nodes overlap
- ✅ Check position coordinates
- ✅ Account for node width/height in positioning
- ✅ Use `fitView()` after loading

---

## JSON Validation Checklist

Before loading your JSON:

- [ ] All nodes have unique `id` values
- [ ] All nodes have `type` field (`"chart"` or `"element"`)
- [ ] All nodes have `position` with `x` and `y`
- [ ] Chart nodes have `data.kind` set to valid chart type
- [ ] Chart nodes have `data.data` array with values
- [ ] Element nodes have `data.kind` set to valid element type
- [ ] Edge `source` and `target` match existing node IDs
- [ ] JSON is properly formatted (no trailing commas, quotes correct)

---

## Quick Reference

### Chart Types Quick List
```
line, bar, area, composed, pie, radar, radialBar, scatter, funnel, treemap, sankey
```

### Element Types Quick List
```
title, sectionHeader, horizontalDivider, verticalDivider
```

### Common Style Properties
```
showGrid, showLegend, showTooltip, strokeColor, fillColor, fillOpacity, 
strokeWidth, lineType, showDots, barSize, innerRadius, outerRadius, showLabels
```

---

## Additional Resources

- **Example Graphs**: Load built-in examples from the toolbar dropdown
- **Code View**: Toggle to "Code" mode to see/edit JSON in real-time
- **Export**: Use "Copy JSON" to get current graph structure
- **Import**: Paste JSON in Code view and click "Apply"

---

*Last Updated: November 2, 2025*
