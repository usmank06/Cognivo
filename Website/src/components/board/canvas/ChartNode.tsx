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
import { DESIGN_SYSTEM, getChartColor } from '../../../lib/designSystem'

interface ChartNodeProps {
  id: string
  data: NodeData
  selected: boolean
}

// Modern, accessible color palette
const COLORS = DESIGN_SYSTEM.chartColors.primary

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
  
  // Style options with modern defaults
  const style = data.style ?? {}
  const showGrid = style.showGrid ?? true
  const showLegend = style.showLegend ?? true
  const showTooltip = style.showTooltip ?? true
  const strokeColor = style.strokeColor ?? DESIGN_SYSTEM.chartColors.primary[0]
  const fillColor = style.fillColor ?? DESIGN_SYSTEM.chartColors.primary[0]
  const fillOpacity = style.fillOpacity ?? 0.85
  const strokeWidth = style.strokeWidth ?? 2.5
  const lineType = style.lineType ?? 'monotone'
  const showDots = style.showDots ?? true
  const barSize = style.barSize ?? 24
  const innerRadius = style.innerRadius ?? 0
  const outerRadius = style.outerRadius ?? 85
  const startAngle = style.startAngle ?? 0
  const endAngle = style.endAngle ?? 360
  const showLabels = style.showLabels ?? false
  const radarFillOpacity = style.radarFillOpacity ?? 0.7
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
    const commonProps = { margin: { top: 8, right: 20, left: 0, bottom: 8 } }
    const gridStyle = {
      stroke: DESIGN_SYSTEM.chartDefaults.grid.stroke,
      strokeDasharray: DESIGN_SYSTEM.chartDefaults.grid.strokeDasharray,
      strokeOpacity: DESIGN_SYSTEM.chartDefaults.grid.strokeOpacity,
    }
    const axisStyle = {
      fontSize: DESIGN_SYSTEM.chartDefaults.axis.fontSize,
      fill: DESIGN_SYSTEM.chartDefaults.axis.fill,
    }
    
    switch (kind) {
      case 'line':
        return (
          <LineChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xKey} tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <YAxis tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
            <Line 
              type={lineType} 
              dataKey={yKey} 
              stroke={strokeColor} 
              strokeWidth={strokeWidth}
              dot={showDots} 
            />
            {style.secondaryKey && (
              <Line type={lineType} dataKey={style.secondaryKey} stroke={getChartColor(1)} strokeWidth={strokeWidth} dot={showDots} />
            )}
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xKey} tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <YAxis tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
            <Bar dataKey={yKey} fill={fillColor} barSize={barSize} radius={[6, 6, 0, 0]} />
            {style.secondaryKey && (
              <Bar dataKey={style.secondaryKey} fill={getChartColor(1)} barSize={barSize} radius={[6, 6, 0, 0]} />
            )}
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xKey} tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <YAxis tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
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
                stroke={getChartColor(1)} 
                fill={getChartColor(1)} 
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
              />
            )}
          </AreaChart>
        )
      
      case 'composed':
        return (
          <ComposedChart data={d} {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xKey} tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <YAxis tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
            <Area type={lineType} dataKey={yKey} fill={fillColor} stroke={strokeColor} fillOpacity={0.4} />
            {style.secondaryKey && <Bar dataKey={style.secondaryKey} fill={getChartColor(1)} barSize={barSize} radius={[6, 6, 0, 0]} />}
            {style.tertiaryKey && <Line type={lineType} dataKey={style.tertiaryKey} stroke={getChartColor(2)} strokeWidth={strokeWidth} />}
          </ComposedChart>
        )
      
      case 'pie':
        // Allow custom pie colors via style.pieColors array, or use fillColor for monochrome, or default palette
        const pieColors = style.pieColors ?? (fillColor !== DESIGN_SYSTEM.chartColors.primary[0] ? [fillColor] : null)
        return (
          <PieChart>
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
            <Pie 
              data={d} 
              dataKey={yKey} 
              nameKey={nameKey} 
              cx="50%" 
              cy="50%" 
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              label={showLabels}
              paddingAngle={2}
            >
              {d.map((_e, i) => {
                // Use custom colors, or single fill color with opacity variation, or default palette
                const fill = pieColors 
                  ? pieColors[i % pieColors.length] 
                  : getChartColor(i)
                return <Cell key={i} fill={fill} />
              })}
            </Pie>
          </PieChart>
        )
      
      case 'radar':
        return (
          <RadarChart data={d} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid stroke={DESIGN_SYSTEM.chartDefaults.grid.stroke} />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: DESIGN_SYSTEM.chartDefaults.axis.fontSize, fill: DESIGN_SYSTEM.chartDefaults.axis.fill }} />
            <PolarRadiusAxis tick={{ fontSize: DESIGN_SYSTEM.chartDefaults.axis.fontSize, fill: DESIGN_SYSTEM.chartDefaults.axis.fill }} />
            {showTooltip && <Tooltip contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
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
                stroke={getChartColor(1)} 
                fill={getChartColor(1)} 
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
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xKey} type="number" tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <YAxis dataKey={yKey} type="number" tick={axisStyle} stroke={DESIGN_SYSTEM.chartDefaults.axis.stroke} />
            <ZAxis dataKey={zKey} type="number" range={[scatterSize, scatterSize * 2]} />
            {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: DESIGN_SYSTEM.borders.radius.base, border: `1px solid ${DESIGN_SYSTEM.borders.color.light}`, boxShadow: DESIGN_SYSTEM.shadows.md }} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: DESIGN_SYSTEM.chartDefaults.legend.fontSize, color: DESIGN_SYSTEM.chartDefaults.legend.fill }} />}
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
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: DESIGN_SYSTEM.chartDefaults.container.background, 
      borderRadius: DESIGN_SYSTEM.chartDefaults.container.borderRadius, 
      boxShadow: DESIGN_SYSTEM.chartDefaults.container.boxShadow, 
      border: `${DESIGN_SYSTEM.borders.width.base} solid ${DESIGN_SYSTEM.borders.color.light}`, 
      position: 'relative',
      fontFamily: DESIGN_SYSTEM.typography.fontFamily,
    }}>
      {/* Resizer handles show when selected */}
      <NodeResizer 
        isVisible={selected} 
        minWidth={DESIGN_SYSTEM.chartDefaults.minWidth} 
        minHeight={DESIGN_SYSTEM.chartDefaults.minHeight} 
        handleStyle={{ 
          width: 12, 
          height: 12, 
          borderRadius: 6, 
          background: DESIGN_SYSTEM.colors.primary[500],
          border: '2px solid white',
          boxShadow: DESIGN_SYSTEM.shadows.sm,
        }} 
      />

      {/* Inline editable title */}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={onTitleBlur}
        onKeyDown={onTitleKeyDown}
        style={{ 
          padding: '10px 14px', 
          borderBottom: `1.5px solid ${DESIGN_SYSTEM.borders.color.light}`, 
          fontSize: DESIGN_SYSTEM.typography.fontSize.sm, 
          fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
          color: DESIGN_SYSTEM.colors.neutral[700], 
          outline: 'none', 
          cursor: 'text', 
          userSelect: 'text',
          background: DESIGN_SYSTEM.colors.neutral[50],
        }}
      >
        {data.label ?? (kind.toUpperCase() + ' Chart')}
      </div>

      {/* Chart area uses 100% of node size */}
      <div style={{ width: '100%', height: 'calc(100% - 38px)', padding: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Toolbar anchored to node (only while selected) */}
      <NodeToolbar isVisible={selected} position={"top" as any}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: DESIGN_SYSTEM.spacing.sm, 
          background: 'white', 
          padding: '10px 12px', 
          border: `${DESIGN_SYSTEM.borders.width.base} solid ${DESIGN_SYSTEM.borders.color.light}`, 
          borderRadius: DESIGN_SYSTEM.borders.radius.lg, 
          boxShadow: DESIGN_SYSTEM.shadows.lg, 
          maxWidth: 800,
          fontFamily: DESIGN_SYSTEM.typography.fontFamily,
        }}>
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
            <div className="h-4 w-px bg-border mx-1" />
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
                <div className="h-4 w-px bg-border mx-1" />
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
                <div className="h-4 w-px bg-border mx-1" />
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
                <div className="h-4 w-px bg-border mx-1" />
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
