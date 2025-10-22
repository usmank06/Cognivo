import React from 'react'
import { ReactFlowProvider } from 'reactflow'
import GraphCore from './GraphCore'

export default function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCore />
    </ReactFlowProvider>
  )
}

