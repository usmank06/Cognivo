// GraphCanvas.tsx
// Graph editor + resizable chart nodes with ALL chart types supported
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
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow'
import { toPng } from 'html-to-image'
import 'reactflow/dist/style.css'

// Recharts (for embedded charts as nodes)
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  AreaChart, Area,
  ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis,
  FunnelChart, Funnel, LabelList,
  Treemap,
  Sankey,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Cell
} from 'recharts'

// ---------- Types ----------
type ChartKind = 'line' | 'bar' | 'pie' | 'area' | 'composed' | 'radar' | 'radialBar' | 'scatter' | 'funnel' | 'treemap' | 'sankey'
type ElementKind = 'title' | 'sectionHeader' | 'horizontalDivider' | 'verticalDivider'

type ChartStyle = {
  // Common styling
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  strokeColor?: string
  fillColor?: string
  fillOpacity?: number
  strokeWidth?: number
  
  // Line/Area specific
  lineType?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'basis'
  showDots?: boolean
  
  // Bar specific
  barSize?: number
  stackOffset?: 'expand' | 'none' | 'wiggle' | 'silhouette' | 'sign'
  
  // Pie/Radial specific
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  showLabels?: boolean
  
  // Radar specific
  radarFillOpacity?: number
  
  // Scatter specific
  scatterSize?: number
  
  // Composed chart types
  composedTypes?: ('line' | 'bar' | 'area')[]
  
  // Additional data keys for multi-series
  secondaryKey?: string
  tertiaryKey?: string
}

type NodeData = {
  label?: string
  notes?: string
  kind?: ChartKind | ElementKind
  data?: any[] // chart data
  xKey?: string
  yKey?: string
  zKey?: string // for scatter/sankey
  nameKey?: string // for pie/treemap
  style?: ChartStyle
  // For text elements
  text?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  backgroundColor?: string
  // For dividers
  dividerColor?: string
  dividerThickness?: number
}

type RFNode = {
  id: string
  position: { x: number; y: number }
  data: NodeData
  type?: 'default' | 'chart' | 'element'
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
  const zKey = data.zKey ?? 'z'
  const nameKey = data.nameKey ?? 'name'
  
  // Style options with defaults
  const style = data.style ?? {}
  const showGrid = style.showGrid ?? true
  const showLegend = style.showLegend ?? true
  const showTooltip = style.showTooltip ?? true
  const strokeColor = style.strokeColor ?? '#8884d8'
  const fillColor = style.fillColor ?? '#8884d8'
  const fillOpacity = style.fillOpacity ?? 0.8
  const strokeWidth = style.strokeWidth ?? 2
  const lineType = style.lineType ?? 'monotone'
  const showDots = style.showDots ?? true
  const barSize = style.barSize ?? 20
  const innerRadius = style.innerRadius ?? 0
  const outerRadius = style.outerRadius ?? 80
  const startAngle = style.startAngle ?? 0
  const endAngle = style.endAngle ?? 360
  const showLabels = style.showLabels ?? false
  const radarFillOpacity = style.radarFillOpacity ?? 0.6
  const scatterSize = style.scatterSize ?? 64

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

  // Toolbar edits
  const setKind = (k: ChartKind) => updateNode(id, (n) => ({ ...n, data: { ...n.data, kind: k } }))
  const setXKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, xKey: val } }))
  const setYKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, yKey: val } }))
  const updateStyle = (updates: Partial<ChartStyle>) => {
    updateNode(id, (n) => ({ ...n, data: { ...n.data, style: { ...n.data.style, ...updates } } }))
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0', '#8dd1e1']

  const renderChart = () => {
    const commonProps = { margin: { top: 5, right: 16, left: 0, bottom: 5 } }
    
    switch (kind) {
      case 'line':
        return (
          <LineChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Line 
              type={lineType} 
              dataKey={yKey} 
              stroke={strokeColor} 
              strokeWidth={strokeWidth}
              dot={showDots} 
            />
            {style.secondaryKey && (
              <Line type={lineType} dataKey={style.secondaryKey} stroke="#82ca9d" strokeWidth={strokeWidth} dot={showDots} />
            )}
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar dataKey={yKey} fill={fillColor} barSize={barSize} />
            {style.secondaryKey && (
              <Bar dataKey={style.secondaryKey} fill="#82ca9d" barSize={barSize} />
            )}
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area 
              type={lineType} 
              dataKey={yKey} 
              stroke={strokeColor} 
              fill={fillColor} 
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
            />
            {style.secondaryKey && (
              <Area 
                type={lineType} 
                dataKey={style.secondaryKey} 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
              />
            )}
          </AreaChart>
        )
      
      case 'composed':
        return (
          <ComposedChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area type={lineType} dataKey={yKey} fill={fillColor} stroke={strokeColor} fillOpacity={0.3} />
            {style.secondaryKey && <Bar dataKey={style.secondaryKey} fill="#413ea0" barSize={barSize} />}
            {style.tertiaryKey && <Line type={lineType} dataKey={style.tertiaryKey} stroke="#ff7300" strokeWidth={strokeWidth} />}
          </ComposedChart>
        )
      
      case 'pie':
        return (
          <PieChart>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Pie 
              data={d} 
              dataKey={yKey} 
              nameKey={nameKey} 
              cx="50%" 
              cy="50%" 
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              label={showLabels}
            >
              {d.map((_e, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )
      
      case 'radar':
        return (
          <RadarChart data={d} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey={xKey} />
            <PolarRadiusAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Radar 
              name={data.label || 'Series 1'} 
              dataKey={yKey} 
              stroke={strokeColor} 
              fill={fillColor} 
              fillOpacity={radarFillOpacity} 
            />
            {style.secondaryKey && (
              <Radar 
                name="Series 2" 
                dataKey={style.secondaryKey} 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={radarFillOpacity} 
              />
            )}
          </RadarChart>
        )
      
      case 'radialBar':
        return (
          <RadialBarChart 
            data={d} 
            cx="50%" 
            cy="50%" 
            innerRadius="10%" 
            outerRadius="90%"
            startAngle={startAngle}
            endAngle={endAngle}
          >
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <RadialBar 
              label={showLabels ? { position: 'insideStart', fill: '#666' } : false} 
              background 
              dataKey={yKey} 
            />
          </RadialBarChart>
        )
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} type="number" />
            <YAxis dataKey={yKey} type="number" />
            <ZAxis dataKey={zKey} type="number" range={[scatterSize, scatterSize * 2]} />
            {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {showLegend && <Legend />}
            <Scatter name={data.label || 'Series 1'} data={d} fill={fillColor} />
          </ScatterChart>
        )
      
      case 'funnel':
        return (
          <FunnelChart {...commonProps}>
            {showTooltip && <Tooltip />}
            <Funnel dataKey={yKey} data={d} isAnimationActive>
              {showLabels && <LabelList position="right" fill="#000" stroke="none" dataKey={nameKey} />}
            </Funnel>
          </FunnelChart>
        )
      
      case 'treemap':
        return (
          <Treemap
            data={d}
            dataKey={yKey}
            stroke="#fff"
            fill={fillColor}
            aspectRatio={4 / 3}
          />
        )
      
      case 'sankey':
        return (
          <Sankey
            data={{ nodes: d.filter((item: any) => item.type === 'node'), links: d.filter((item: any) => item.type === 'link') }}
            nodePadding={50}
            margin={{ left: 50, right: 50, top: 20, bottom: 20 }}
            link={{ stroke: strokeColor }}
          >
            {showTooltip && <Tooltip />}
          </Sankey>
        )
      
      default:
        return <div style={{ padding: 20, color: '#999' }}>Unknown chart type</div>
    }
  }

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
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Toolbar anchored to node (only while selected) */}
      <NodeToolbar isVisible={selected} position={'top' as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'white', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)', maxWidth: 800 }}>
          {/* Row 1: Type and Keys */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as ChartKind)} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="area">Area</option>
              <option value="composed">Composed</option>
              <option value="pie">Pie</option>
              <option value="radar">Radar</option>
              <option value="radialBar">Radial Bar</option>
              <option value="scatter">Scatter</option>
              <option value="funnel">Funnel</option>
              <option value="treemap">Treemap</option>
              <option value="sankey">Sankey</option>
            </select>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <label style={{ fontSize: 11, color: '#555' }}>xKey</label>
            <input value={xKey} onChange={(e) => setXKey(e.target.value)} style={{ width: 70, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
            <label style={{ fontSize: 11, color: '#555' }}>yKey</label>
            <input value={yKey} onChange={(e) => setYKey(e.target.value)} style={{ width: 70, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          
          {/* Row 2: Styling Options */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
            {(kind === 'line' || kind === 'bar' || kind === 'area' || kind === 'composed' || kind === 'scatter') && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <input type="checkbox" checked={showGrid} onChange={(e) => updateStyle({ showGrid: e.target.checked })} />
                  Grid
                </label>
              </>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input type="checkbox" checked={showLegend} onChange={(e) => updateStyle({ showLegend: e.target.checked })} />
              Legend
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input type="checkbox" checked={showTooltip} onChange={(e) => updateStyle({ showTooltip: e.target.checked })} />
              Tooltip
            </label>
            
            {(kind === 'line' || kind === 'area' || kind === 'composed') && (
              <>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <label style={{ fontSize: 11, color: '#555' }}>Line Type</label>
                <select value={lineType} onChange={(e) => updateStyle({ lineType: e.target.value as any })} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <option value="monotone">Monotone</option>
                  <option value="linear">Linear</option>
                  <option value="step">Step</option>
                  <option value="basis">Basis</option>
                </select>
              </>
            )}
            
            {kind === 'line' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <input type="checkbox" checked={showDots} onChange={(e) => updateStyle({ showDots: e.target.checked })} />
                Dots
              </label>
            )}
            
            {(kind === 'bar' || kind === 'composed') && (
              <>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <label style={{ fontSize: 11, color: '#555' }}>Bar Size</label>
                <input 
                  type="number" 
                  value={barSize} 
                  onChange={(e) => updateStyle({ barSize: parseInt(e.target.value) || 20 })} 
                  style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
                />
              </>
            )}
            
            {(kind === 'pie' || kind === 'radialBar' || kind === 'funnel' || kind === 'treemap') && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <input type="checkbox" checked={showLabels} onChange={(e) => updateStyle({ showLabels: e.target.checked })} />
                Labels
              </label>
            )}
            
            {kind === 'pie' && (
              <>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <label style={{ fontSize: 11, color: '#555' }}>Inner R</label>
                <input 
                  type="number" 
                  value={innerRadius} 
                  onChange={(e) => updateStyle({ innerRadius: parseInt(e.target.value) || 0 })} 
                  style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
                />
                <label style={{ fontSize: 11, color: '#555' }}>Outer R</label>
                <input 
                  type="number" 
                  value={outerRadius} 
                  onChange={(e) => updateStyle({ outerRadius: parseInt(e.target.value) || 80 })} 
                  style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
                />
              </>
            )}
          </div>
        </div>
      </NodeToolbar>
    </div>
  )
}

// ---------- Element Node (title, header, dividers) ----------
function ElementNode(props: { id: string; data: NodeData; selected: boolean }) {
  const { id, data, selected } = props
  const updateNode = useNodeUpdater()

  const kind = data.kind as ElementKind
  const text = data.text ?? 'Text'
  const fontSize = data.fontSize ?? (kind === 'title' ? 32 : kind === 'sectionHeader' ? 24 : 16)
  const fontWeight = data.fontWeight ?? (kind === 'title' ? 'bold' : kind === 'sectionHeader' ? '600' : 'normal')
  const textAlign = data.textAlign ?? 'center'
  const textColor = data.textColor ?? '#1f2937'
  const backgroundColor = data.backgroundColor ?? 'transparent'
  const dividerColor = data.dividerColor ?? '#e5e7eb'
  const dividerThickness = data.dividerThickness ?? 2

  const onTextBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent ?? ''
    updateNode(id, (n) => ({ ...n, data: { ...n.data, text: newText } }))
  }

  const onTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (kind === 'title' || kind === 'sectionHeader')) {
      e.preventDefault()
      ;(e.currentTarget as HTMLDivElement).blur()
    }
  }

  const updateStyle = (updates: Partial<NodeData>) => {
    updateNode(id, (n) => ({ ...n, data: { ...n.data, ...updates } }))
  }

  // Render based on kind
  if (kind === 'horizontalDivider') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <NodeResizer isVisible={selected} minWidth={100} minHeight={20} handleStyle={{ width: 10, height: 10, borderRadius: 4 }} />
        <div style={{ width: '100%', height: `${dividerThickness}px`, backgroundColor: dividerColor }} />
        
        <NodeToolbar isVisible={selected} position={'top' as any}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
            <label style={{ fontSize: 11, color: '#555' }}>Color</label>
            <input type="color" value={dividerColor} onChange={(e) => updateStyle({ dividerColor: e.target.value })} style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <label style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Thickness</label>
            <input type="number" value={dividerThickness} onChange={(e) => updateStyle({ dividerThickness: parseInt(e.target.value) || 2 })} style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
        </NodeToolbar>
      </div>
    )
  }

  if (kind === 'verticalDivider') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <NodeResizer isVisible={selected} minWidth={20} minHeight={100} handleStyle={{ width: 10, height: 10, borderRadius: 4 }} />
        <div style={{ width: `${dividerThickness}px`, height: '100%', backgroundColor: dividerColor }} />
        
        <NodeToolbar isVisible={selected} position={'top' as any}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
            <label style={{ fontSize: 11, color: '#555' }}>Color</label>
            <input type="color" value={dividerColor} onChange={(e) => updateStyle({ dividerColor: e.target.value })} style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <label style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Thickness</label>
            <input type="number" value={dividerThickness} onChange={(e) => updateStyle({ dividerThickness: parseInt(e.target.value) || 2 })} style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
        </NodeToolbar>
      </div>
    )
  }

  // Title or Section Header
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor, position: 'relative', padding: '10px', borderRadius: 8 }}>
      <NodeResizer isVisible={selected} minWidth={100} minHeight={40} handleStyle={{ width: 10, height: 10, borderRadius: 4 }} />
      
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={onTextBlur}
        onKeyDown={onTextKeyDown}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color: textColor,
          textAlign,
          outline: 'none',
          cursor: 'text',
          userSelect: 'text',
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {text}
      </div>

      <NodeToolbar isVisible={selected} position={'top' as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'white', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)', maxWidth: 600 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: '#555' }}>Size</label>
            <input type="number" value={fontSize} onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) || 16 })} style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
            <label style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Weight</label>
            <select value={fontWeight} onChange={(e) => updateStyle({ fontWeight: e.target.value })} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="normal">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="bold">Bold</option>
            </select>
            <label style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Align</label>
            <select value={textAlign} onChange={(e) => updateStyle({ textAlign: e.target.value as any })} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
            <label style={{ fontSize: 11, color: '#555' }}>Text Color</label>
            <input type="color" value={textColor} onChange={(e) => updateStyle({ textColor: e.target.value })} style={{ width: 50, height: 24, border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <label style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Background</label>
            <input type="color" value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} style={{ width: 50, height: 24, border: '1px solid #e5e7eb', borderRadius: 4 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginLeft: 8 }}>
              <input type="checkbox" checked={backgroundColor === 'transparent'} onChange={(e) => updateStyle({ backgroundColor: e.target.checked ? 'transparent' : '#ffffff' })} />
              Transparent BG
            </label>
          </div>
        </div>
      </NodeToolbar>
    </div>
  )
}

const nodeTypes = { chart: ChartNode, element: ElementNode }

// ---------- Sample graphs (for quick testing) ----------
const EXAMPLES: Record<string, RFState> = {
  'All Charts Showcase': {
    nodes: [
      // Page Title
      {
        id: 'title1', type: 'element', position: { x: 0, y: -120 }, style: { width: 800, height: 80 },
        data: {
          kind: 'title',
          text: 'Interactive Chart Dashboard',
          fontSize: 48,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#1f2937',
          backgroundColor: 'transparent'
        }
      },
      // Section Header - Charts
      {
        id: 'header1', type: 'element', position: { x: 0, y: -30 }, style: { width: 1300, height: 50 },
        data: {
          kind: 'sectionHeader',
          text: 'Time Series & Categorical Charts',
          fontSize: 24,
          fontWeight: '600',
          textAlign: 'left',
          textColor: '#374151',
          backgroundColor: '#f3f4f6'
        }
      },
      // Horizontal Divider
      {
        id: 'divider1', type: 'element', position: { x: 0, y: 270 }, style: { width: 1300, height: 10 },
        data: {
          kind: 'horizontalDivider',
          dividerColor: '#e5e7eb',
          dividerThickness: 2
        }
      },
      // Section Header - Analysis
      {
        id: 'header2', type: 'element', position: { x: 0, y: 590 }, style: { width: 1300, height: 50 },
        data: {
          kind: 'sectionHeader',
          text: 'Multi-Dimensional Analysis',
          fontSize: 24,
          fontWeight: '600',
          textAlign: 'left',
          textColor: '#374151',
          backgroundColor: '#f3f4f6'
        }
      },
      // Vertical Divider
      {
        id: 'vdivider1', type: 'element', position: { x: 850, y: 660 }, style: { width: 10, height: 250 },
        data: {
          kind: 'verticalDivider',
          dividerColor: '#d1d5db',
          dividerThickness: 3
        }
      },
      // Horizontal Divider
      {
        id: 'divider2', type: 'element', position: { x: 0, y: 940 }, style: { width: 1300, height: 10 },
        data: {
          kind: 'horizontalDivider',
          dividerColor: '#e5e7eb',
          dividerThickness: 2
        }
      },
      // Section Header - Advanced
      {
        id: 'header3', type: 'element', position: { x: 0, y: 950 }, style: { width: 1300, height: 50 },
        data: {
          kind: 'sectionHeader',
          text: 'Advanced Visualizations',
          fontSize: 24,
          fontWeight: '600',
          textAlign: 'left',
          textColor: '#374151',
          backgroundColor: '#f3f4f6'
        }
      },
      // Line Chart
      {
        id: 'line1', type: 'chart', position: { x: 0, y: 40 }, style: { width: 400, height: 250 },
        data: {
          label: 'Line Chart - Daily Visitors',
          kind: 'line',
          xKey: 'day',
          yKey: 'visitors',
          style: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            strokeColor: '#8884d8',
            strokeWidth: 3,
            lineType: 'monotone',
            showDots: true,
            secondaryKey: 'revenue'
          },
          data: [
            { day: 'Mon', visitors: 120, revenue: 240 },
            { day: 'Tue', visitors: 180, revenue: 320 },
            { day: 'Wed', visitors: 100, revenue: 180 },
            { day: 'Thu', visitors: 220, revenue: 380 },
            { day: 'Fri', visitors: 260, revenue: 450 },
            { day: 'Sat', visitors: 300, revenue: 520 },
            { day: 'Sun', visitors: 200, revenue: 350 },
          ]
        }
      },
      // Bar Chart
      {
        id: 'bar1', type: 'chart', position: { x: 450, y: 40 }, style: { width: 400, height: 250 },
        data: {
          label: 'Bar Chart - Monthly Sales',
          kind: 'bar',
          xKey: 'month',
          yKey: 'sales',
          style: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            fillColor: '#82ca9d',
            barSize: 30,
            secondaryKey: 'target'
          },
          data: [
            { month: 'Jan', sales: 400, target: 450 },
            { month: 'Feb', sales: 800, target: 700 },
            { month: 'Mar', sales: 600, target: 650 },
            { month: 'Apr', sales: 1000, target: 900 }
          ]
        }
      },
      // Area Chart
      {
        id: 'area1', type: 'chart', position: { x: 900, y: 40 }, style: { width: 400, height: 250 },
        data: {
          label: 'Area Chart - Traffic Growth',
          kind: 'area',
          xKey: 'date',
          yKey: 'uv',
          style: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            strokeColor: '#8884d8',
            fillColor: '#8884d8',
            fillOpacity: 0.6,
            lineType: 'monotone',
            secondaryKey: 'pv'
          },
          data: [
            { date: '05-01', uv: 4000, pv: 2400 },
            { date: '05-02', uv: 3000, pv: 1398 },
            { date: '05-03', uv: 2000, pv: 9800 },
            { date: '05-04', uv: 2780, pv: 3908 },
            { date: '05-05', uv: 1890, pv: 4800 },
            { date: '05-06', uv: 2390, pv: 3800 },
            { date: '05-07', uv: 3490, pv: 4300 },
          ]
        }
      },
      // Composed Chart
      {
        id: 'composed1', type: 'chart', position: { x: 0, y: 330 }, style: { width: 400, height: 280 },
        data: {
          label: 'Composed - Multi-metric Dashboard',
          kind: 'composed',
          xKey: 'name',
          yKey: 'amt',
          style: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            fillColor: '#8884d8',
            strokeColor: '#8884d8',
            lineType: 'monotone',
            barSize: 20,
            secondaryKey: 'pv',
            tertiaryKey: 'uv'
          },
          data: [
            { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
            { name: 'Page B', uv: 868, pv: 967, amt: 1506 },
            { name: 'Page C', uv: 1397, pv: 1098, amt: 989 },
            { name: 'Page D', uv: 1480, pv: 1200, amt: 1228 },
            { name: 'Page E', uv: 1520, pv: 1108, amt: 1100 },
            { name: 'Page F', uv: 1400, pv: 680, amt: 1700 },
          ]
        }
      },
      // Pie Chart
      {
        id: 'pie1', type: 'chart', position: { x: 450, y: 330 }, style: { width: 380, height: 280 },
        data: {
          label: 'Pie Chart - Market Share',
          kind: 'pie',
          nameKey: 'name',
          yKey: 'value',
          style: {
            showLegend: true,
            showTooltip: true,
            innerRadius: 50,
            outerRadius: 100,
            showLabels: true
          },
          data: [
            { name: 'Product A', value: 35 },
            { name: 'Product B', value: 25 },
            { name: 'Product C', value: 20 },
            { name: 'Product D', value: 15 },
            { name: 'Product E', value: 5 }
          ]
        }
      },
      // Radar Chart
      {
        id: 'radar1', type: 'chart', position: { x: 880, y: 330 }, style: { width: 400, height: 280 },
        data: {
          label: 'Radar - Skills Assessment',
          kind: 'radar',
          xKey: 'subject',
          yKey: 'A',
          style: {
            showLegend: true,
            showTooltip: true,
            strokeColor: '#8884d8',
            fillColor: '#8884d8',
            radarFillOpacity: 0.6,
            secondaryKey: 'B'
          },
          data: [
            { subject: 'Math', A: 120, B: 110 },
            { subject: 'Chinese', A: 98, B: 130 },
            { subject: 'English', A: 86, B: 130 },
            { subject: 'Geography', A: 99, B: 100 },
            { subject: 'Physics', A: 85, B: 90 },
            { subject: 'History', A: 65, B: 85 },
          ]
        }
      },
      // Radial Bar Chart
      {
        id: 'radialBar1', type: 'chart', position: { x: 0, y: 660 }, style: { width: 400, height: 280 },
        data: {
          label: 'Radial Bar - Age Demographics',
          kind: 'radialBar',
          nameKey: 'name',
          yKey: 'uv',
          style: {
            showLegend: true,
            showTooltip: true,
            startAngle: 180,
            endAngle: 0,
            showLabels: true
          },
          data: [
            { name: '18-24', uv: 31.47, fill: '#8884d8' },
            { name: '25-29', uv: 26.69, fill: '#83a6ed' },
            { name: '30-34', uv: 15.69, fill: '#8dd1e1' },
            { name: '35-39', uv: 8.22, fill: '#82ca9d' },
            { name: '40-49', uv: 8.63, fill: '#a4de6c' },
            { name: '50+', uv: 2.63, fill: '#d0ed57' },
            { name: 'unknown', uv: 6.67, fill: '#ffc658' },
          ]
        }
      },
      // Scatter Chart
      {
        id: 'scatter1', type: 'chart', position: { x: 450, y: 660 }, style: { width: 400, height: 280 },
        data: {
          label: 'Scatter - Height vs Weight',
          kind: 'scatter',
          xKey: 'height',
          yKey: 'weight',
          zKey: 'score',
          style: {
            showGrid: true,
            showLegend: true,
            showTooltip: true,
            fillColor: '#8884d8',
            scatterSize: 64
          },
          data: [
            { height: 160, weight: 65, score: 95 },
            { height: 170, weight: 72, score: 85 },
            { height: 165, weight: 68, score: 90 },
            { height: 175, weight: 78, score: 88 },
            { height: 180, weight: 82, score: 92 },
            { height: 155, weight: 60, score: 87 },
            { height: 168, weight: 70, score: 94 },
            { height: 172, weight: 75, score: 89 },
          ]
        }
      },
      // Funnel Chart
      {
        id: 'funnel1', type: 'chart', position: { x: 900, y: 660 }, style: { width: 400, height: 280 },
        data: {
          label: 'Funnel - Sales Pipeline',
          kind: 'funnel',
          nameKey: 'name',
          yKey: 'value',
          style: {
            showTooltip: true,
            showLabels: true,
            fillColor: '#8884d8'
          },
          data: [
            { name: 'Leads', value: 1000 },
            { name: 'Qualified', value: 750 },
            { name: 'Proposals', value: 500 },
            { name: 'Negotiations', value: 300 },
            { name: 'Closed', value: 150 }
          ]
        }
      },
      // Treemap
      {
        id: 'treemap1', type: 'chart', position: { x: 0, y: 1020 }, style: { width: 520, height: 320 },
        data: {
          label: 'Treemap - Storage Distribution',
          kind: 'treemap',
          nameKey: 'name',
          yKey: 'size',
          style: {
            showTooltip: true,
            fillColor: '#8884d8'
          },
          data: [
            { name: 'Documents', size: 2400, children: [] },
            { name: 'Photos', size: 4500, children: [] },
            { name: 'Videos', size: 8200, children: [] },
            { name: 'Music', size: 1800, children: [] },
            { name: 'Apps', size: 3200, children: [] },
            { name: 'System', size: 2100, children: [] },
          ]
        }
      },
      // Sankey
      {
        id: 'sankey1', type: 'chart', position: { x: 570, y: 1020 }, style: { width: 700, height: 320 },
        data: {
          label: 'Sankey - User Flow',
          kind: 'sankey',
          style: {
            showTooltip: true,
            strokeColor: '#77c878'
          },
          data: [
            { type: 'node', name: 'Visit', value: 357898 },
            { type: 'node', name: 'Direct-Favourite', value: 3728 },
            { type: 'node', name: 'Page-Click', value: 354170 },
            { type: 'node', name: 'Detail-Favourite', value: 62429 },
            { type: 'node', name: 'Lost', value: 291741 },
            { type: 'link', source: 0, target: 1, value: 3728 },
            { type: 'link', source: 0, target: 2, value: 354170 },
            { type: 'link', source: 2, target: 3, value: 62429 },
            { type: 'link', source: 2, target: 4, value: 291741 },
          ]
        }
      },
    ],
    edges: [
      { id: 'line-bar', source: 'line1', target: 'bar1', label: 'compare' },
      { id: 'bar-area', source: 'bar1', target: 'area1', label: 'trend' },
      { id: 'area-composed', source: 'area1', target: 'composed1', label: 'combined' },
      { id: 'composed-pie', source: 'composed1', target: 'pie1', label: 'breakdown' },
    ],
  },
  'Line Chart Variations': {
    nodes: [
      {
        id: 'line-monotone', type: 'chart', position: { x: 0, y: 0 }, style: { width: 400, height: 250 },
        data: {
          label: 'Monotone Line (Smooth)',
          kind: 'line',
          xKey: 'day',
          yKey: 'value',
          style: { lineType: 'monotone', showDots: true, strokeColor: '#8884d8', strokeWidth: 2, showGrid: true },
          data: [
            { day: 'Mon', value: 12 }, { day: 'Tue', value: 19 }, { day: 'Wed', value: 15 },
            { day: 'Thu', value: 25 }, { day: 'Fri', value: 22 }, { day: 'Sat', value: 30 }
          ]
        }
      },
      {
        id: 'line-linear', type: 'chart', position: { x: 450, y: 0 }, style: { width: 400, height: 250 },
        data: {
          label: 'Linear Line (Sharp)',
          kind: 'line',
          xKey: 'day',
          yKey: 'value',
          style: { lineType: 'linear', showDots: false, strokeColor: '#82ca9d', strokeWidth: 3, showGrid: true },
          data: [
            { day: 'Mon', value: 12 }, { day: 'Tue', value: 19 }, { day: 'Wed', value: 15 },
            { day: 'Thu', value: 25 }, { day: 'Fri', value: 22 }, { day: 'Sat', value: 30 }
          ]
        }
      },
      {
        id: 'line-step', type: 'chart', position: { x: 900, y: 0 }, style: { width: 400, height: 250 },
        data: {
          label: 'Step Line',
          kind: 'line',
          xKey: 'day',
          yKey: 'value',
          style: { lineType: 'step', showDots: true, strokeColor: '#ffc658', strokeWidth: 2, showGrid: true },
          data: [
            { day: 'Mon', value: 12 }, { day: 'Tue', value: 19 }, { day: 'Wed', value: 15 },
            { day: 'Thu', value: 25 }, { day: 'Fri', value: 22 }, { day: 'Sat', value: 30 }
          ]
        }
      },
    ],
    edges: [],
  },
  'Text & Layout Elements': {
    nodes: [
      // Page Title
      {
        id: 'title-demo', type: 'element', position: { x: 100, y: 0 }, style: { width: 600, height: 100 },
        data: {
          kind: 'title',
          text: 'Dashboard Title Example',
          fontSize: 48,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#1f2937',
          backgroundColor: 'transparent'
        }
      },
      // Section Headers
      {
        id: 'header-1', type: 'element', position: { x: 0, y: 120 }, style: { width: 800, height: 60 },
        data: {
          kind: 'sectionHeader',
          text: 'Section One - Sales Overview',
          fontSize: 28,
          fontWeight: '600',
          textAlign: 'left',
          textColor: '#374151',
          backgroundColor: '#f9fafb'
        }
      },
      {
        id: 'header-2', type: 'element', position: { x: 0, y: 400 }, style: { width: 800, height: 60 },
        data: {
          kind: 'sectionHeader',
          text: 'Section Two - Performance Metrics',
          fontSize: 28,
          fontWeight: '600',
          textAlign: 'left',
          textColor: '#1e40af',
          backgroundColor: '#dbeafe'
        }
      },
      // Horizontal Dividers
      {
        id: 'hdiv-1', type: 'element', position: { x: 0, y: 200 }, style: { width: 800, height: 8 },
        data: {
          kind: 'horizontalDivider',
          dividerColor: '#e5e7eb',
          dividerThickness: 2
        }
      },
      {
        id: 'hdiv-2', type: 'element', position: { x: 0, y: 380 }, style: { width: 800, height: 8 },
        data: {
          kind: 'horizontalDivider',
          dividerColor: '#60a5fa',
          dividerThickness: 4
        }
      },
      {
        id: 'hdiv-3', type: 'element', position: { x: 0, y: 680 }, style: { width: 800, height: 12 },
        data: {
          kind: 'horizontalDivider',
          dividerColor: '#9ca3af',
          dividerThickness: 1
        }
      },
      // Vertical Dividers
      {
        id: 'vdiv-1', type: 'element', position: { x: 250, y: 220 }, style: { width: 8, height: 150 },
        data: {
          kind: 'verticalDivider',
          dividerColor: '#d1d5db',
          dividerThickness: 2
        }
      },
      {
        id: 'vdiv-2', type: 'element', position: { x: 550, y: 220 }, style: { width: 12, height: 150 },
        data: {
          kind: 'verticalDivider',
          dividerColor: '#6b7280',
          dividerThickness: 4
        }
      },
      // Text boxes with backgrounds
      {
        id: 'text-1', type: 'element', position: { x: 50, y: 230 }, style: { width: 180, height: 120 },
        data: {
          kind: 'sectionHeader',
          text: 'Sales\n$125K',
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#ffffff',
          backgroundColor: '#10b981'
        }
      },
      {
        id: 'text-2', type: 'element', position: { x: 280, y: 230 }, style: { width: 180, height: 120 },
        data: {
          kind: 'sectionHeader',
          text: 'Users\n1,234',
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#ffffff',
          backgroundColor: '#3b82f6'
        }
      },
      {
        id: 'text-3', type: 'element', position: { x: 580, y: 230 }, style: { width: 180, height: 120 },
        data: {
          kind: 'sectionHeader',
          text: 'Growth\n+23%',
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#ffffff',
          backgroundColor: '#8b5cf6'
        }
      },
      // Different text alignments
      {
        id: 'text-left', type: 'element', position: { x: 50, y: 480 }, style: { width: 200, height: 80 },
        data: {
          kind: 'sectionHeader',
          text: 'Left Aligned Text',
          fontSize: 18,
          fontWeight: 'normal',
          textAlign: 'left',
          textColor: '#1f2937',
          backgroundColor: '#f3f4f6'
        }
      },
      {
        id: 'text-center', type: 'element', position: { x: 300, y: 480 }, style: { width: 200, height: 80 },
        data: {
          kind: 'sectionHeader',
          text: 'Center Aligned',
          fontSize: 18,
          fontWeight: '500',
          textAlign: 'center',
          textColor: '#1f2937',
          backgroundColor: '#f3f4f6'
        }
      },
      {
        id: 'text-right', type: 'element', position: { x: 550, y: 480 }, style: { width: 200, height: 80 },
        data: {
          kind: 'sectionHeader',
          text: 'Right Aligned',
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'right',
          textColor: '#1f2937',
          backgroundColor: '#f3f4f6'
        }
      },
      // Custom styled text
      {
        id: 'text-custom', type: 'element', position: { x: 100, y: 600 }, style: { width: 600, height: 60 },
        data: {
          kind: 'title',
          text: 'Custom Styled Header',
          fontSize: 32,
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#dc2626',
          backgroundColor: '#fef2f2'
        }
      },
    ],
    edges: [],
  },
  'Charts Demo': {
    nodes: [
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
      {
        id: 'bar1', type: 'chart', position: { x: 420, y: 0 }, style: { width: 360, height: 220 },
        data: {
          label: 'Bar: Sales', kind: 'bar', xKey: 'month', yKey: 'sales',
          data: [
            { month: 'Jan', sales: 4 }, { month: 'Feb', sales: 8 }, { month: 'Mar', sales: 6 }, { month: 'Apr', sales: 10 }
          ]
        }
      },
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
  onExportImage,
  onExportPDF,
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
  onExportImage: () => void
  onExportPDF: () => void
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
          <div className="h-5 w-px bg-gray-200" />
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={onExportImage}>Export PNG</button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white" onClick={onExportPDF}>Export PDF</button>
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
  const onMove = useCallback(() => {
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

  // Export as PNG
  const onExportImage = async () => {
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
      a.download = 'graph.png'
      a.click()
    } catch (err) {
      console.error('Failed to export image:', err)
      alert('Failed to export image')
    }
  }

  // Export as PDF
  const onExportPDF = async () => {
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

      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf')
      
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
        pdf.save('graph.pdf')
      }
    } catch (err) {
      console.error('Failed to export PDF:', err)
      alert('Failed to export PDF')
    }
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
    setExampleKey('All Charts Showcase')
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
        onExportImage={onExportImage}
        onExportPDF={onExportPDF}
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
            onMove={onMove}
            fitView
            nodeTypes={nodeTypes}
            minZoom={0.25}
            maxZoom={2}
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
