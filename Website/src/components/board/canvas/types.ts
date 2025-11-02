// Type definitions for graph canvas nodes and charts

export type ChartKind = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'area' 
  | 'composed' 
  | 'radar' 
  | 'radialBar' 
  | 'scatter' 
  | 'funnel' 
  | 'treemap' 
  | 'sankey'

export type ElementKind = 
  | 'text'
  | 'title' 
  | 'sectionHeader' 
  | 'horizontalDivider' 
  | 'verticalDivider'

export type ChartStyle = {
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

export type NodeData = {
  // Chart-specific
  label?: string
  notes?: string
  kind?: ChartKind | ElementKind
  data?: any[] // chart data
  xKey?: string
  yKey?: string
  zKey?: string // for scatter/sankey
  nameKey?: string // for pie/treemap
  style?: ChartStyle
  
  // Element-specific (text, dividers)
  text?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  backgroundColor?: string
  
  // Divider-specific
  dividerColor?: string
  dividerThickness?: number
}

export type RFNode = {
  id: string
  position: { x: number; y: number }
  data: NodeData
  type?: 'default' | 'chart' | 'element'
  style?: React.CSSProperties // width/height used by NodeResizer
}

export type RFEdge = {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

export type RFState = {
  nodes: RFNode[]
  edges: RFEdge[]
  viewport?: { x: number; y: number; zoom: number }
}
