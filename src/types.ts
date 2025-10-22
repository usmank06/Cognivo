export type NodeData = {
  label?: string
  notes?: string
  kind?: 'line' | 'bar' | 'pie'
  data?: any[]
  xKey?: string
  yKey?: string
}

export type RFNode = {
  id: string
  position: { x: number; y: number }
  data: NodeData
  type?: 'default' | 'chart'
  style?: React.CSSProperties
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

