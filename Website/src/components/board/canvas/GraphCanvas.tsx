// GraphCanvas.tsx - ReactFlow wrapper for canvas visualization
import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  getNodesBounds,
  getViewportForBounds
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ChartNode } from './ChartNode'
import { ElementNode } from './ElementNode'
import type { RFNode, RFEdge, RFState } from './types'

// HTML canvas export (for PNG)
import { toPng } from 'html-to-image'
// PDF export
import { jsPDF } from 'jspdf'

interface GraphCanvasProps {
  script: string // JSON string
  onChange: (script: string) => void
}

export interface GraphCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
  exportPNG: () => Promise<void>
  exportPDF: () => Promise<void>
  getZoomLevel: () => number
}

const nodeTypes: NodeTypes = {
  chart: ChartNode as any,
  chartNode: ChartNode as any,
  element: ElementNode as any,
  elementNode: ElementNode as any,
}

function GraphCanvasInner({ script, onChange }: GraphCanvasProps, ref: React.Ref<GraphCanvasHandle>) {
  const { zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow()
  const flowRef = useRef<HTMLDivElement>(null)
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const isFirstLoad = useRef(true)
  const isInternalUpdate = useRef(false)

  // Parse script JSON → nodes + edges
  useEffect(() => {
    try {
      const parsed: RFState = JSON.parse(script || '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}')
      
      // Mark this as an external update (from props, not user interaction)
      isInternalUpdate.current = true
      setNodes(parsed.nodes || [])
      setEdges(parsed.edges || [])
      
      // Fit view only on first load
      if (isFirstLoad.current && parsed.nodes.length > 0) {
        setTimeout(() => fitView({ padding: 0.2 }), 100)
        isFirstLoad.current = false
      }
      
      // Reset the flag after a short delay to allow state updates to settle
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 50)
    } catch (err) {
      console.warn('Failed to parse graph script:', err)
      isInternalUpdate.current = true
      setNodes([])
      setEdges([])
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 50)
    }
  }, [script, setNodes, setEdges, fitView])

  // Sync changes back to JSON (only when user makes changes, not from external updates)
  useEffect(() => {
    // Skip if this is an external update (from script prop change)
    if (isInternalUpdate.current) return
    
    // Skip empty updates on init
    if (nodes.length === 0 && edges.length === 0) return
    
    const state: RFState = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    onChange(JSON.stringify(state, null, 2))
  }, [nodes, edges, onChange])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds))
  }, [setEdges])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    fitView: () => fitView({ padding: 0.2 }),
    getZoomLevel: () => {
      const viewport = getViewport?.()
      return viewport ? Math.round(viewport.zoom * 100) : 100
    },
    exportPNG: async () => {
      if (nodes.length === 0) {
        alert('No content to export')
        return
      }

      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement
      if (!viewportElement) return

      try {
        // Get bounds of all nodes
        const nodeBounds = getNodesBounds(nodes as any)
        const padding = 20
        
        // Calculate the actual content area
        const contentWidth = nodeBounds.width + padding * 2
        const contentHeight = nodeBounds.height + padding * 2
        
        // Get current viewport
        const viewport = getViewport?.()
        if (!viewport) return

        // Calculate transform to show just the content
        const transform = getViewportForBounds(
          nodeBounds,
          contentWidth,
          contentHeight,
          0.5,
          2,
          padding / contentWidth
        )

        // Temporarily apply transform to capture content
        const originalTransform = viewportElement.style.transform
        viewportElement.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
        
        // Wait a tick for render
        await new Promise(resolve => setTimeout(resolve, 100))

        // Capture the content area
        const dataUrl = await toPng(viewportElement, {
          backgroundColor: '#ffffff',
          width: contentWidth,
          height: contentHeight,
          style: {
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
          }
        })

        // Restore original transform
        viewportElement.style.transform = originalTransform

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'canvas-export.png'
        a.click()
      } catch (err) {
        console.error('Failed to export image:', err)
        alert('Failed to export image')
      }
    },
    exportPDF: async () => {
      if (nodes.length === 0) {
        alert('No content to export')
        return
      }

      try {
        // Get bounds of all nodes
        const nodeBounds = getNodesBounds(nodes as any)
        const padding = 20
        
        // Calculate the actual content area
        const contentWidth = nodeBounds.width + padding * 2
        const contentHeight = nodeBounds.height + padding * 2
        
        // Create a temporary container to render just the content
        const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement
        if (!viewportElement) return
        
        // Get current viewport
        const viewport = getViewport?.()
        if (!viewport) return

        // Calculate transform to show just the content
        const transform = getViewportForBounds(
          nodeBounds,
          contentWidth,
          contentHeight,
          0.5,
          2,
          padding / contentWidth
        )

        // Temporarily apply transform to capture content
        const originalTransform = viewportElement.style.transform
        viewportElement.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
        
        // Wait a tick for render
        await new Promise(resolve => setTimeout(resolve, 100))

        // Capture the content area
        const dataUrl = await toPng(viewportElement, {
          backgroundColor: '#ffffff',
          width: contentWidth,
          height: contentHeight,
          style: {
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
          }
        })

        // Restore original transform
        viewportElement.style.transform = originalTransform

        // Letter size in points (72 points = 1 inch)
        const pageWidth = 8.5 * 72  // 612 points
        const pageHeight = 11 * 72   // 792 points
        
        const img = new Image()
        img.src = dataUrl
        img.onload = () => {
          const imgWidth = contentWidth
          const imgHeight = contentHeight
          
          // Calculate scaling to fit content to letter size page with margins
          const margin = 36 // 0.5 inch margins
          const availableWidth = pageWidth - (2 * margin)
          const availableHeight = pageHeight - (2 * margin)
          
          // Scale to fit within available space
          const scale = Math.min(
            availableWidth / imgWidth,
            availableHeight / imgHeight
          )
          
          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale
          
          // Center horizontally, align to top with margin
          const x = (pageWidth - scaledWidth) / 2
          const y = margin
          
          // Create letter-sized PDF
          const pdf = new jsPDF('portrait', 'pt', 'letter')
          pdf.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight)
          pdf.save('canvas-export.pdf')
        }
      } catch (err) {
        console.error('Failed to export PDF:', err)
        alert('Failed to export PDF')
      }
    }
  }), [zoomIn, zoomOut, fitView, nodes, getViewport])

  return (
    <div ref={flowRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.25 }}
        minZoom={0.05}
        maxZoom={4}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ 
            background: '#f8f8f8', 
            border: '1px solid #e5e7eb',
            borderRadius: 8
          }}
        />
      </ReactFlow>
    </div>
  )
}

const GraphCanvasWithRef = forwardRef(GraphCanvasInner)

// Export with ReactFlowProvider wrapper
export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GraphCanvasWithRef {...props} ref={ref} />
    </ReactFlowProvider>
  )
})
