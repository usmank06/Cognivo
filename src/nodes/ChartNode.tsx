import React, { useCallback } from 'react'
import { useReactFlow, NodeResizer, NodeToolbar } from 'reactflow'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  Cell
} from 'recharts'
import { NodeData, RFNode } from '../types'

function useNodeUpdater() {
  const { setNodes } = useReactFlow()
  return useCallback((id: string, updater: (n: RFNode) => RFNode) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? updater(n as RFNode) : n)))
  }, [setNodes])
}

export default function ChartNode(props: { id: string; data: NodeData; selected: boolean }) {
  const { id, data, selected } = props
  const updateNode = useNodeUpdater()

  const kind = data.kind ?? 'line'
  const d = data.data ?? []
  const xKey = data.xKey ?? 'x'
  const yKey = data.yKey ?? 'y'

  const onTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent ?? ''
    updateNode(id, (n) => ({ ...n, data: { ...n.data, label: text } }))
  }
  const onTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); (e.currentTarget as HTMLDivElement).blur()
    }
  }

  const setKind = (k: 'line' | 'bar' | 'pie') => updateNode(id, (n) => ({ ...n, data: { ...n.data, kind: k } }))
  const setXKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, xKey: val } }))
  const setYKey = (val: string) => updateNode(id, (n) => ({ ...n, data: { ...n.data, yKey: val } }))

  return (
    <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,.08)', border: '1px solid #eee', position: 'relative' }}>
      <NodeResizer isVisible={selected} minWidth={240} minHeight={180} handleStyle={{ width: 10, height: 10, borderRadius: 4 }} />

      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={onTitleBlur}
        onKeyDown={onTitleKeyDown}
        style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#555', outline: 'none', cursor: 'text', userSelect: 'text' }}
      >
        {data.label ?? (kind.toUpperCase() + ' Chart')}
      </div>

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

export const nodeTypes = { chart: ChartNode }

