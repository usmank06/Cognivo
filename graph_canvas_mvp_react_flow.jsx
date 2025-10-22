// GraphCanvas.tsx
// Graph editor + resizable chart nodes (line/bar/pie) with inline, on-canvas text editing.
// Top bar: zoom controls, Fit/Reset, Graph <-> Code toggle, and example loader.
// MiniMap: bottom-right, pannable + zoomable.
// Install deps: npm i react react-dom reactflow recharts

import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
  NodeResizer,
  NodeToolbar,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Recharts (for embedded charts as nodes)
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Cell
} from 'recharts'

// ---------- Types ----------
type NodeData = {
  label?: string
  notes?: string
  kind?: 'line' | 'bar' | 'pie' // for chart nodes
  data?: any[] // chart data
  xKey?: string
  yKey?: string
}

type RFNode = {
  id: string
  position: { x: number; y: number }
  data: NodeData
  type?: 'default' | 'chart'
  style?: React.CSSProperties // width/height used by NodeResizer
}

type RFEdge = {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

type RFState = {
  nodes: RFNode[]
  edges: RFEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

// Small helper to update a node by id
function useNodeUpdater() {
  const { setNodes } = useReactFlow()
  return useCallback((id: string, updater: (n: RFNode) => RFNode) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? updater(n as RFNode) : n)))
  }, [setNodes])
}

// ---------- Chart Node (resizable + editable title + toolbar) ----------
function ChartNode(props: { id: string; data: NodeData; selected: boolean }) {
  const { id, data, selected } = props
  const updateNode = useNodeUpdater()

  const kind = data.kind ?? 'line'
  const d = data.data ?? []
  const xKey = data.xKey ?? 'x'
  const yKey = data.yKey ?? 'y'

  // Inline title editing
  const onTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent ?? ''
    updateNode(id, (n) => ({ ...n, data: { ...n.data, label: text } }))
  }
  const onTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); (e.currentTarget as HTMLDivElement).blur()
    }
  }

  // Toolbar edits (kind/xKey/yKey)
  const setKind = (k: 'line' | 'bar' | 'pie') => updateNode(id, (n) => ({ ...n, data: { ...n.data, kind: k } }))
  const setXKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, xKey: val } }))
  const setYKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, yKey: val } }))

  return (
    <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,.08)', border: '1px solid #eee', position: 'relative' }}>
      {/* Resizer handles show when selected */}
      <NodeResizer isVisible={selected} minWidth={240} minHeight={180} handleStyle={{ width: 10, height: 10, borderRadius: 4 }} />

      {/* Inline editable title */}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={onTitleBlur}
        onKeyDown={onTitleKeyDown}
        style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555', outline: 'none', cursor: 'text', userSelect: 'text' }}
      >
        {data.label ?? (kind.toUpperCase() + ' Chart')}
      </div>

      {/* Chart area uses 100% of node size */}
      <div style={{ width: '100%', height: 'calc(100% - 32px)', padding: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'line' && (
            <LineChart data={d} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} dot={false} />
            </LineChart>
          )}
          {kind === 'bar' && (
            <BarChart data={d} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} />
            </BarChart>
          )}
          {kind === 'pie' && (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={d} dataKey={yKey} nameKey={xKey} outerRadius={80} innerRadius={40}>
                {d.map((_e, i) => (
                  <Cell key={i} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Toolbar anchored to node (only while selected) */}
      <NodeToolbar isVisible={selected} position="top">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
          <label style={{ fontSize: 12, color: '#555' }}>Type</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={{ fontSize: 12 }}>
            <option value="line">line</option>
            <option value="bar">bar</option>
            <option value="pie">pie</option>
          </select>
          <label style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>xKey</label>
          <input value={xKey} onChange={(e) => setXKey(e.target.value)} style={{ width: 90, fontSize: 12, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          <label style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>yKey</label>
          <input value={yKey} onChange={(e) => setYKey(e.target.value)} style={{ width: 90, fontSize: 12, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
        </div>
      </NodeToolbar>
    </div>
  )
}

const nodeTypes = { chart: ChartNode }

// ---------- Sample graphs (for quick testing) ----------
const EXAMPLES: Record<string, RFState> = {
  'Charts Demo': {
    nodes: [
      // Line chart node
      {
        id: 'line1', type: 'chart', position: { x: 0, y: 0 }, style: { width: 360, height: 220 },
        data: {
          label: 'Line: Visitors', kind: 'line', xKey: 'day', yKey: 'visitors',
          data: [
            { day: 'Mon', visitors: 12 }, { day: 'Tue', visitors: 18 }, { day: 'Wed', visitors: 10 },
            { day: 'Thu', visitors: 22 }, { day: 'Fri', visitors: 26 }, { day: 'Sat', visitors: 30 }, { day: 'Sun', visitors: 20 },
          ]
        }
      },
      // Bar chart node
      {
        id: 'bar1', type: 'chart', position: { x: 420, y: 0 }, style: { width: 360, height: 220 },
        data: {
          label: 'Bar: Sales', kind: 'bar', xKey: 'month', yKey: 'sales',
          data: [
            { month: 'Jan', sales: 4 }, { month: 'Feb', sales: 8 }, { month: 'Mar', sales: 6 }, { month: 'Apr', sales: 10 }
          ]
        }
      },
      // Pie chart node
      {
        id: 'pie1', type: 'chart', position: { x: 220, y: 280 }, style: { width: 320, height: 240 },
        data: {
          label: 'Pie: Segments', kind: 'pie', xKey: 'name', yKey: 'value',
          data: [
            { name: 'A', value: 35 }, { name: 'B', value: 25 }, { name: 'C', value: 20 }, { name: 'D', value: 20 }
          ]
        }
      },
    ],
    edges: [
      { id: 'l-b', source: 'line1', target: 'bar1', label: 'compare' },
      { id: 'b-p', source: 'bar1', target: 'pie1', label: 'breakdown' },
    ],
  },
  'Linear Flow': {
    nodes: [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: 'B', position: { x: 200, y: 0 }, data: { label: 'Process' } },
      { id: 'C', position: { x: 400, y: 0 }, data: { label: 'End' } },
    ],
    edges: [
      { id: 'A-B', source: 'A', target: 'B', label: 'next' },
      { id: 'B-C', source: 'B', target: 'C' },
    ],
  },
  'Small DAG': {
    nodes: [
      { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
      { id: '2', position: { x: 200, y: -80 }, data: { label: '2' } },
      { id: '3', position: { x: 200, y: 80 }, data: { label: '3' } },
      { id: '4', position: { x: 400, y: 0 }, data: { label: '4' } },
    ],
    edges: [
      { id: '1-2', source: '1', target: '2' },
      { id: '1-3', source: '1', target: '3' },
      { id: '2-4', source: '2', target: '4' },
      { id: '3-4', source: '3', target: '4' },
    ],
  },
}

// ---------- Toolbar ----------
function TopBar({
  mode,
  setMode,
  zoomPct,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  exampleKey,
  setExampleKey,
  onLoadExample,
  onCopyJSON,
  onDownloadJSON,
}: {
  mode: 'graph' | 'code'
  setMode: (m: 'graph' | 'code') => void
  zoomPct: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
  exampleKey: string
  setExampleKey: (k: string) => void
  onLoadExample: () => void
  onCopyJSON: () => void
  onDownloadJSON: () => void
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-6xl p-2 flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-300">
          <button
            className={`px-3 py-1 text-sm ${mode === 'graph' ? 'bg-gray-900 text-white' : 'bg-white'}`}
            onClick={() => setMode('graph')}
            title="Graph view"
          >
            Graph
          </button>
          <button
            className={`px-3 py-1 text-sm ${mode === 'code' ? 'bg-gray-900 text-white' : 'bg-white'}`}
            onClick={() => setMode('code')}
            title="Code view"
          >
            Code
          </button>
        </div>

        {/* Zoom controls */}
        <div className="ml-2 flex items-center gap-1 rounded-2xl border border-gray-300 bg-white px-2 py-1">
          <button className="px-2 text-sm" onClick={onZoomOut} title="Zoom out">–</button>
          <div className="px-2 text-sm tabular-nums select-none" title="Current zoom">{Math.round(zoomPct)}%</div>
          <button className="px-2 text-sm" onClick={onZoomIn} title="Zoom in">+</button>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <button className="px-2 text-sm" onClick={onFit} title="Fit view">Fit</button>
          <button className="px-2 text-sm" onClick={onReset} title="Reset view">Reset</button>
        </div>

        {/* Examples */}
        <div className="ml-auto flex items-center gap-2">
          <select
            className="border border-gray-300 rounded-lg text-sm px-2 py-1 bg-white"
            value={exampleKey}
            onChange={(e) => setExampleKey(e.target.value)}
            title="Select example graph"
          >
            {Object.keys(EXAMPLES).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={onLoadExample}>Load</button>
          <div className="h-5 w-px bg-gray-200" />
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={onCopyJSON}>Copy JSON</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={onDownloadJSON}>Download</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Main Graph Board ----------
function GraphCore() {
  const [mode, setMode] = useState<'graph' | 'code'>('graph')
  const [nodes, setNodes] = useState<RFNode[]>([])
  const [edges, setEdges] = useState<RFEdge[]>([])
  const [zoomPct, setZoomPct] = useState<number>(100)
  const [exampleKey, setExampleKey] = useState<string>(Object.keys(EXAMPLES)[0])

  const { zoomIn, zoomOut, setViewport, getViewport, fitView } = useReactFlow()

  // Keep code text in sync when switching to code view
  const [codeText, setCodeText] = useState('')
  useEffect(() => {
    if (mode === 'code') {
      const state: RFState = { nodes, edges, viewport: getViewport?.() }
      setCodeText(JSON.stringify(state, null, 2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // React Flow change handlers
  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes as any, nds)), [])
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes as any, eds)), [])
  const onConnect = useCallback((connection: any) => setEdges((eds) => addEdge(connection, eds)), [])
  const onMoveEnd = useCallback(() => {
    const vp = getViewport?.()
    if (vp) setZoomPct(vp.zoom * 100)
  }, [getViewport])

  // Actions
  const handleZoomIn = () => zoomIn?.()
  const handleZoomOut = () => zoomOut?.()
  const handleFit = () => fitView?.({ padding: 0.2 })
  const handleReset = () => setViewport?.({ x: 0, y: 0, zoom: 1 }, { duration: 300 })

  const onLoadExample = () => {
    const ex = EXAMPLES[exampleKey]
    if (!ex) return
    setNodes(ex.nodes)
    setEdges(ex.edges)
    setTimeout(() => fitView?.({ padding: 0.2 }), 0)
  }

  // JSON helpers
  const onCopyJSON = () => {
    const vp = getViewport?.()
    const state: RFState = { nodes, edges, viewport: vp }
    const json = JSON.stringify(state, null, 2)
    navigator.clipboard?.writeText(json)
    alert('Graph JSON copied to clipboard.')
  }

  const onDownloadJSON = () => {
    const vp = getViewport?.()
    const state: RFState = { nodes, edges, viewport: vp }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyCode = () => {
    try {
      const parsed = JSON.parse(codeText) as RFState
      setNodes(parsed.nodes || [])
      setEdges(parsed.edges || [])
      if (parsed.viewport) setViewport?.(parsed.viewport, { duration: 300 })
      setMode('graph')
    } catch (e: any) {
      alert('Invalid JSON: ' + e?.message)
    }
  }

  // Initial seed
  useEffect(() => {
    setExampleKey('Charts Demo')
    setTimeout(onLoadExample, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-white">
      <TopBar
        mode={mode}
        setMode={setMode}
        zoomPct={zoomPct}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onReset={handleReset}
        exampleKey={exampleKey}
        setExampleKey={setExampleKey}
        onLoadExample={onLoadExample}
        onCopyJSON={onCopyJSON}
        onDownloadJSON={onDownloadJSON}
      />

      {/* Workspace */}
      <div className="pt-12 h-full">
        {mode === 'graph' ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onMoveEnd={onMoveEnd}
            fitView
            nodeTypes={nodeTypes}
          >
            <Background />
            <MiniMap position="bottom-right" pannable zoomable style={{ width: 200, height: 140, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }} />
          </ReactFlow>
        ) : (
          <div className="h-full grid grid-rows-[1fr_auto]">
            <textarea
              className="w-full h-full p-4 font-mono text-sm border-t outline-none"
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              spellCheck={false}
            />
            <div className="p-2 border-t bg-white flex items-center justify-between">
              <div className="text-xs text-gray-500">Paste/edit the graph JSON (nodes, edges, optional viewport). Chart nodes use <code>type: 'chart'</code> with <code>data.kind</code> = 'line' | 'bar' | 'pie'. You can also set <code>style.width</code> and <code>style.height</code> for node size.</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={applyCode}>Apply</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={() => setMode('graph')}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Exported wrapper with provider ----------
export default function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCore />
    </ReactFlowProvider>
  )
}
