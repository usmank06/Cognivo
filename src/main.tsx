import React from 'react'
import { createRoot } from 'react-dom/client'
import GraphCanvas from './GraphCanvas'

const el = document.getElementById('root')!
createRoot(el).render(<GraphCanvas />)

