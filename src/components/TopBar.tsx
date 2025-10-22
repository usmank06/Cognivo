import React from 'react'
import { EXAMPLES } from '../examples'

export default function TopBar({
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

        <div className="ml-2 flex items-center gap-1 rounded-2xl border border-gray-300 bg-white px-2 py-1">
          <button className="px-2 text-sm" onClick={onZoomOut} title="Zoom out">–</button>
          <div className="px-2 text-sm tabular-nums select-none" title="Current zoom">{Math.round(zoomPct)}%</div>
          <button className="px-2 text-sm" onClick={onZoomIn} title="Zoom in">+</button>
          <div className="mx-1 h-5 w-px bg-gray-200" />
          <button className="px-2 text-sm" onClick={onFit} title="Fit view">Fit</button>
          <button className="px-2 text-sm" onClick={onReset} title="Reset view">Reset</button>
        </div>

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

