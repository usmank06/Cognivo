// ChartNode.tsx - Resizable chart node with all chart types
import { useCallback } from 'react'
import { NodeResizer, NodeToolbar, useReactFlow } from 'reactflow'
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
import type { NodeData, RFNode, ChartKind } from './types'

interface ChartNodeProps {
  id: string
  data: NodeData
  selected: boolean
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0', '#8dd1e1']

function useNodeUpdater() {
  const { setNodes } = useReactFlow()
  return useCallback((id: string, updater: (n: RFNode) => RFNode) => {
    setNodes((nds: any[]) => nds.map((n: any) => (n.id === id ? updater(n as RFNode) : n)))
  }, [setNodes])
}

export function ChartNode({ id, data, selected }: ChartNodeProps) {
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
    updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, label: text } }))
  }
  
  const onTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.currentTarget as HTMLDivElement).blur()
    }
  }

  // Toolbar edits
  const setKind = (k: ChartKind) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, kind: k } }))
  const setXKey = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, xKey: val } }))
  const setYKey = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, yKey: val } }))
  const updateStyle = (updates: Partial<typeof style>) => {
    updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, style: { ...n.data.style, ...updates } } }))
  }

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
            data={{ 
              nodes: d.filter((item: any) => item.type === 'node'), 
              links: d.filter((item: any) => item.type === 'link') 
            }}
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
      <NodeToolbar isVisible={selected} position={"top" as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'white', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.08)', maxWidth: 800 }}>
          {/* Row 1: Type and Keys */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Type</label>
            <select value={kind} onChange={(e: any) => setKind(e.target.value as ChartKind)} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
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
            <input value={xKey} onChange={(e: any) => setXKey(e.target.value)} style={{ width: 70, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
            <label style={{ fontSize: 11, color: '#555' }}>yKey</label>
            <input value={yKey} onChange={(e: any) => setYKey(e.target.value)} style={{ width: 70, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          
          {/* Row 2: Styling Options */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
            {(kind === 'line' || kind === 'bar' || kind === 'area' || kind === 'composed' || kind === 'scatter') && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <input type="checkbox" checked={showGrid} onChange={(e: any) => updateStyle({ showGrid: e.target.checked })} />
                Grid
              </label>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input type="checkbox" checked={showLegend} onChange={(e: any) => updateStyle({ showLegend: e.target.checked })} />
              Legend
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input type="checkbox" checked={showTooltip} onChange={(e: any) => updateStyle({ showTooltip: e.target.checked })} />
              Tooltip
            </label>
            
            {(kind === 'line' || kind === 'area' || kind === 'composed') && (
              <>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <label style={{ fontSize: 11, color: '#555' }}>Line Type</label>
                <select value={lineType} onChange={(e: any) => updateStyle({ lineType: e.target.value as any })} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <option value="monotone">Monotone</option>
                  <option value="linear">Linear</option>
                  <option value="step">Step</option>
                  <option value="basis">Basis</option>
                </select>
              </>
            )}
            
            {kind === 'line' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <input type="checkbox" checked={showDots} onChange={(e: any) => updateStyle({ showDots: e.target.checked })} />
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
                  onChange={(e: any) => updateStyle({ barSize: parseInt(e.target.value) || 20 })} 
                  style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
                />
              </>
            )}
            
            {(kind === 'pie' || kind === 'radialBar' || kind === 'funnel' || kind === 'treemap') && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <input type="checkbox" checked={showLabels} onChange={(e: any) => updateStyle({ showLabels: e.target.checked })} />
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
                  onChange={(e: any) => updateStyle({ innerRadius: parseInt(e.target.value) || 0 })} 
                  style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
                />
                <label style={{ fontSize: 11, color: '#555' }}>Outer R</label>
                <input 
                  type="number" 
                  value={outerRadius} 
                  onChange={(e: any) => updateStyle({ outerRadius: parseInt(e.target.value) || 80 })} 
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
