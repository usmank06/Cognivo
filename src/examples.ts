import { RFState } from './types'

export const EXAMPLES: Record<string, RFState> = {
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

