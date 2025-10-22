import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './nodes/ChartNode'
import TopBar from './components/TopBar'
import { EXAMPLES } from './examples'
import { RFEdge, RFNode, RFState } from './types'

export default function GraphCore() {
  const [mode, setMode] = useState<'graph' | 'code'>('graph')
  const [nodes, setNodes] = useState<RFNode[]>([])
  const [edges, setEdges] = useState<RFEdge[]>([])
  const [zoomPct, setZoomPct] = useState<number>(100)
  const [exampleKey, setExampleKey] = useState<string>(Object.keys(EXAMPLES)[0])

  const { zoomIn, zoomOut, setViewport, getViewport, fitView } = useReactFlow()

  const [codeText, setCodeText] = useState('')
  useEffect(() => {
    if (mode === 'code') {
      const state: RFState = { nodes, edges, viewport: getViewport?.() }
      setCodeText(JSON.stringify(state, null, 2))
    }
  }, [mode, nodes, edges, getViewport])

  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes as any, nds)), [])
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes as any, eds)), [])
  const onConnect = useCallback((connection: any) => setEdges((eds) => addEdge(connection, eds)), [])
  const onMoveEnd = useCallback(() => {
    const vp = getViewport?.()
    if (vp) setZoomPct(vp.zoom * 100)
  }, [getViewport])

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
            nodeTypes={nodeTypes as any}
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

